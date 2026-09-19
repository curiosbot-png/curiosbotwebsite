-- Curiosbot platform: initial schema. Applied once by scripts/migrate.ts (tracked in schema_migrations).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ───────── Auth & security ─────────
CREATE TYPE user_role AS ENUM ('admin', 'marketing');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext NOT NULL UNIQUE,
  name          text NOT NULL,
  password_hash text NOT NULL,
  role          user_role NOT NULL DEFAULT 'marketing',
  mfa_secret    text,                       -- reserved for TOTP MFA rollout (store encrypted)
  mfa_enabled   boolean NOT NULL DEFAULT false,
  disabled      boolean NOT NULL DEFAULT false,
  failed_logins int NOT NULL DEFAULT 0,
  locked_until  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,         -- sha256 of the cookie token; raw token never stored
  expires_at  timestamptz NOT NULL,
  ip          text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

CREATE TABLE password_resets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rate_limits (
  key         text NOT NULL,
  window_start timestamptz NOT NULL,
  hits        int NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE audit_logs (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity      text,
  entity_id   text,
  detail      jsonb NOT NULL DEFAULT '{}',
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_created_idx ON audit_logs(created_at DESC);

-- ───────── Products (database-driven) ─────────
CREATE TYPE publish_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');

CREATE TABLE products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  slug              text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_url          text,
  tagline           text,
  short_description text,
  long_description  text,
  business_problem  text,
  solution          text,
  features          jsonb NOT NULL DEFAULT '[]',   -- [{title, description}]
  benefits          jsonb NOT NULL DEFAULT '[]',   -- [{title, description}]
  use_cases         jsonb NOT NULL DEFAULT '[]',   -- [{title, description}]
  how_it_works      jsonb NOT NULL DEFAULT '[]',   -- [{title, description}]
  faq               jsonb NOT NULL DEFAULT '[]',   -- [{q, a}]
  industries        text[] NOT NULL DEFAULT '{}',
  screenshots       jsonb NOT NULL DEFAULT '[]',   -- [{url, alt}]
  hero_media_url    text,
  video_url         text,
  demo_url          text,
  cta_label         text NOT NULL DEFAULT 'Request a demo',
  seo_title         text,
  seo_description   text,
  social_image_url  text,
  status            publish_status NOT NULL DEFAULT 'draft',
  published_at      timestamptz,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_status_idx ON products(status, published_at DESC);

-- ───────── Insights (articles) ─────────
CREATE TABLE insights (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  slug            text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary         text,
  body_md         text NOT NULL DEFAULT '',
  theme           text,                            -- links to interest_themes.key
  author          text,
  hero_image_url  text,
  seo_title       text,
  seo_description text,
  status          publish_status NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ───────── Campaigns ─────────
CREATE TABLE campaigns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  utm_campaign text NOT NULL UNIQUE,
  channel     text,
  objective   text,
  status      text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','active','paused','completed')),
  starts_on   date,
  ends_on     date,
  budget_eur  numeric(12,2),                       -- planned budget only; actual spend comes from ad APIs
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────── Visitors, consent, events (first-party, consent-gated) ─────────
-- A visitor row exists ONLY after analytics consent. Random cookie id; no fingerprinting; no IP stored.
CREATE TABLE visitors (
  id          uuid PRIMARY KEY,
  first_seen  timestamptz NOT NULL DEFAULT now(),
  last_seen   timestamptz NOT NULL DEFAULT now(),
  first_source text, first_medium text, first_campaign text, first_landing text,
  country     text,                                -- coarse, from proxy header if present
  device      text CHECK (device IN ('desktop','mobile','tablet') OR device IS NULL),
  lead_id     uuid                                 -- set only when the visitor voluntarily submits a form AND marketing consent given
);

CREATE TABLE consents (
  id          bigserial PRIMARY KEY,
  visitor_id  uuid,
  lead_id     uuid,
  analytics   boolean NOT NULL DEFAULT false,
  marketing   boolean NOT NULL DEFAULT false,
  policy_version text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consents_visitor_idx ON consents(visitor_id);

CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  visitor_id  uuid NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
  session_key text,
  type        text NOT NULL CHECK (type IN ('page_view','engaged','scroll','cta_click','download','form_submit','demo_request')),
  path        text NOT NULL,
  content_type text,                               -- insight | product | service | landing | home | other
  content_slug text,
  theme       text,
  source      text, medium text, campaign text,
  value       numeric,                             -- e.g. seconds engaged, scroll percent
  meta        jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_created_idx ON events(created_at DESC);
CREATE INDEX events_visitor_idx ON events(visitor_id, created_at);
CREATE INDEX events_content_idx ON events(content_type, content_slug, created_at);

-- ───────── Leads ─────────
CREATE TYPE lead_status AS ENUM ('new','contacted','qualified','opportunity','customer','disqualified');
CREATE TYPE lead_stage  AS ENUM ('early_interest','engaged','high_intent','sales_ready');

CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  email           citext NOT NULL,
  company         text,
  job_title       text,
  industry        text,
  company_size    text,
  country         text,
  service_interest text,
  product_interest text,
  message         text,
  kind            text NOT NULL DEFAULT 'contact' CHECK (kind IN ('contact','demo','consultation','download')),
  landing_page    text,
  original_source text, latest_source text,
  campaign        text, utm_medium text, utm_term text, utm_content text,
  visitor_id      uuid REFERENCES visitors(id) ON DELETE SET NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_text    text NOT NULL,
  consent_at      timestamptz NOT NULL DEFAULT now(),
  status          lead_status NOT NULL DEFAULT 'new',
  score           int NOT NULL DEFAULT 0,
  stage           lead_stage NOT NULL DEFAULT 'early_interest',
  score_breakdown jsonb NOT NULL DEFAULT '[]',     -- [{rule, points, count}] — shows WHY
  crm_id          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  erased_at       timestamptz
);
CREATE INDEX leads_created_idx ON leads(created_at DESC);
CREATE INDEX leads_email_idx ON leads(email);
ALTER TABLE visitors ADD CONSTRAINT visitors_lead_fk FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

CREATE TABLE lead_notes (
  id         bigserial PRIMARY KEY,
  lead_id    uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  note       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Configurable scoring. Only behavioural/professional signals; no sensitive attributes.
CREATE TABLE scoring_rules (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  event_type  text,                                -- matches events.type, or NULL for special rules
  content_type text,                               -- optional narrowing
  points      int NOT NULL,
  max_count   int NOT NULL DEFAULT 1,              -- cap how many times a rule can score
  active      boolean NOT NULL DEFAULT true
);
CREATE TABLE scoring_stages (
  stage lead_stage PRIMARY KEY,
  min_score int NOT NULL
);

-- Interest themes: keyword/path mapping → themes (AI Strategy, PLM, ...)
CREATE TABLE interest_themes (
  key      text PRIMARY KEY,
  label    text NOT NULL,
  path_prefixes text[] NOT NULL DEFAULT '{}',
  sort     int NOT NULL DEFAULT 0
);

-- ───────── AI generation workspace ─────────
CREATE TABLE ai_generations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('product_marketing','content_factory','analyst','ask')),
  input       jsonb NOT NULL,
  output      jsonb,
  model       text,
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','published')),
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────── Integrations, automations, alerts ─────────
CREATE TABLE integrations (
  key         text PRIMARY KEY,                    -- ga4, gsc, google_ads, linkedin_ads, meta_ads, linkedin, youtube, instagram, facebook, salesforce, email
  label       text NOT NULL,
  status      text NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','connected','error')),
  last_sync_at timestamptz,
  detail      jsonb NOT NULL DEFAULT '{}'          -- never secrets; credentials live in n8n credential store / env
);

-- Data pushed in by n8n from external platforms (never fabricated; empty until connected)
CREATE TABLE external_metrics (
  id          bigserial PRIMARY KEY,
  source      text NOT NULL,                       -- ga4 | gsc | google_ads | linkedin_ads | meta_ads | salesforce
  metric_date date NOT NULL,
  dimension   text NOT NULL DEFAULT '',            -- query / page / campaign
  dimension_value text NOT NULL DEFAULT '',
  metrics     jsonb NOT NULL,                      -- {impressions, clicks, ctr, position, spend, ...}
  ingested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, metric_date, dimension, dimension_value)
);

CREATE TABLE automation_runs (
  id          bigserial PRIMARY KEY,
  workflow    text NOT NULL,
  status      text NOT NULL CHECK (status IN ('success','error','pending_approval')),
  detail      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alert_rules (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  threshold   numeric,
  channel     text NOT NULL DEFAULT 'email'
);
CREATE TABLE alerts (
  id          bigserial PRIMARY KEY,
  rule_key    text NOT NULL REFERENCES alert_rules(key),
  message     text NOT NULL,
  ref         text,
  acknowledged boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ───────── GDPR ─────────
CREATE TABLE data_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       citext NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('access','erasure','rectification','objection')),
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- ───────── Seed reference data ─────────
INSERT INTO scoring_rules(key,label,event_type,content_type,points,max_count) VALUES
 ('product_view','Viewed a product page','page_view','product',5,3),
 ('insights_multi','Read multiple Insights articles','page_view','insight',3,3),
 ('return_visit','Returned on a later day',NULL,NULL,5,1),
 ('service_view','Viewed a consulting page','page_view','service',5,3),
 ('download','Downloaded a resource','download',NULL,8,2),
 ('demo_click','Clicked Request Demo','cta_click',NULL,10,2),
 ('contact_submit','Submitted contact form','form_submit',NULL,15,1),
 ('demo_request','Requested a demo','demo_request',NULL,25,1);
INSERT INTO scoring_stages(stage,min_score) VALUES ('early_interest',0),('engaged',15),('high_intent',35),('sales_ready',60);

INSERT INTO interest_themes(key,label,path_prefixes,sort) VALUES
 ('ai-strategy','AI Strategy','{/ai-strategy-adoption,/ai-consulting}',1),
 ('ai-agents','AI Agents','{/insights/ai-agents}',2),
 ('generative-ai','Generative AI','{/insights/generative-ai}',3),
 ('ai-adoption','AI Adoption','{/ai-strategy-adoption}',4),
 ('ai-roi','AI ROI','{/insights/ai-roi}',5),
 ('automation','Enterprise Automation','{/insights/automation}',6),
 ('plm','PLM','{/plm-consulting}',7),
 ('dam','DAM','{/insights/dam}',8),
 ('mlr','MLR','{/insights/mlr}',9),
 ('salesforce','Salesforce','{/salesforce-consulting}',10),
 ('products','Curiosbot AI Products','{/products}',11),
 ('cxo','CXO AI Advisory','{/cxo-ai-advisory}',12);

INSERT INTO alert_rules(key,label,threshold) VALUES
 ('high_intent_lead','New high-intent lead',35),
 ('demo_request','Demo request',NULL),
 ('traffic_spike','Traffic spike (× vs 7-day avg)',2),
 ('conversion_drop','Conversion drop (% vs prior period)',30),
 ('product_trending','Product trending (× views vs prior period)',2),
 ('campaign_threshold','Campaign threshold',NULL),
 ('automation_failure','Automation failure',NULL);

INSERT INTO integrations(key,label) VALUES
 ('ga4','Google Analytics 4'),('gsc','Google Search Console'),('google_ads','Google Ads'),
 ('linkedin_ads','LinkedIn Ads'),('meta_ads','Meta Ads'),('linkedin','LinkedIn (organic)'),
 ('youtube','YouTube'),('instagram','Instagram'),('facebook','Facebook'),
 ('salesforce','Salesforce / CRM'),('email','Email delivery (Resend/SES)');
