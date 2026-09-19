// DEV-ONLY demo data so dashboards can be exercised locally. Refuses to run when NODE_ENV=production.
// Every record is labelled DEMO so it can never be mistaken for real data.
import { randomUUID } from "node:crypto";
import { Client } from "pg";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed demo data in production.");
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const p = await c.query(`INSERT INTO products(name,slug,tagline,short_description,business_problem,solution,features,benefits,use_cases,how_it_works,faq,status,published_at)
    VALUES ('DEMO Product','demo-product','Demo tagline','Demo short description — seeded for local testing only.','Demo problem','Demo solution',
     '[{"title":"Capability A","description":"Desc"}]','[{"title":"Benefit A","description":"Desc"}]','[{"title":"Use case A","description":"Desc"}]','[{"title":"Step 1","description":"Desc"}]','[{"q":"Q?","a":"A."}]','published',now())
    ON CONFLICT (slug) DO NOTHING RETURNING id`);
  await c.query(`INSERT INTO insights(title,slug,summary,body_md,status,published_at,author) VALUES ('DEMO article on AI agents','demo-ai-agents','Demo summary','# Heading\n\nSome **bold** text.\n\n- one\n- two','published',now(),'Demo') ON CONFLICT (slug) DO NOTHING`);
  await c.query(`INSERT INTO campaigns(name,utm_campaign,channel,status) VALUES ('DEMO LinkedIn AI Agents','demo-ai-agents-q4','LinkedIn','active') ON CONFLICT DO NOTHING`);
  const sources: [string | null, string | null, string | null][] = [["linkedin", "social", "demo-ai-agents-q4"], ["google", "organic", null], [null, null, null], ["newsletter", "email", null]];
  const paths = ["/", "/ai-consulting", "/products/demo-product", "/insights/demo-ai-agents", "/plm-consulting", "/salesforce-consulting"];
  const cls = (pth: string): [string, string | null, string | null] => pth === "/" ? ["home", "home", null] : pth.startsWith("/products/") ? ["product", pth.split("/")[2], "products"] : pth.startsWith("/insights/") ? ["insight", pth.split("/")[2], null] : ["service", pth.slice(1), pth.includes("plm") ? "plm" : pth.includes("sales") ? "salesforce" : "ai-strategy"];
  for (let v = 0; v < 60; v++) {
    const id = randomUUID(); const s = sources[v % sources.length]; const days = Math.floor(Math.random() * 28);
    await c.query("INSERT INTO visitors(id,first_source,first_medium,first_campaign,first_landing,device,country,first_seen) VALUES ($1,$2,$3,$4,'/',$5,'ES', now() - ($6||' days')::interval)", [id, s[0], s[1], s[2], ["desktop", "mobile", "tablet"][v % 3], String(days)]);
    const n = 1 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const pth = paths[Math.floor(Math.random() * paths.length)]; const [t, slug, theme] = cls(pth);
      const d = days - (i % 2 ? 2 : 0);
      await c.query("INSERT INTO events(visitor_id,type,path,content_type,content_slug,theme,source,medium,campaign,created_at) VALUES ($1,'page_view',$2,$3,$4,$5,$6,$7,$8, now() - ($9||' days')::interval)", [id, pth, t, slug, theme, s[0], s[1], s[2], String(Math.max(0, d))]);
      if (Math.random() < 0.5) await c.query("INSERT INTO events(visitor_id,type,path,content_type,content_slug,theme,value,created_at) VALUES ($1,'engaged',$2,$3,$4,$5,$6, now() - ($7||' days')::interval)", [id, pth, t, slug, theme, 15 + Math.floor(Math.random() * 90), String(Math.max(0, d))]);
      if (Math.random() < 0.2) await c.query("INSERT INTO events(visitor_id,type,path,content_type,content_slug,theme,created_at) VALUES ($1,'cta_click',$2,$3,$4,$5, now() - ($6||' days')::interval)", [id, pth, t, slug, theme, String(Math.max(0, d))]);
    }
  }
  console.log("Demo data seeded", p.rowCount ? "(product created)" : "(already present)");
  await c.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
