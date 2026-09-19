#!/bin/sh
# Runs once on first initialisation of the data directory. Creates least-privilege roles/databases.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<SQL
CREATE ROLE curiosbot LOGIN PASSWORD '${APP_DB_PASSWORD}';
CREATE DATABASE curiosbot OWNER curiosbot;
CREATE ROLE n8n LOGIN PASSWORD '${N8N_DB_PASSWORD}';
CREATE DATABASE n8n OWNER n8n;
SQL
# citext/pgcrypto need superuser to create; the app migration uses CREATE EXTENSION IF NOT EXISTS, so pre-create them here.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname curiosbot <<SQL
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SQL
