import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as unknown as { __pgPool?: Pool };

export function pool(): Pool {
  if (!globalForPg.__pgPool) {
    globalForPg.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return globalForPg.__pgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool().query<T>(text, params);
  return res.rows;
}

export async function one<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** True when a database is configured; public pages degrade gracefully without one (e.g. during build). */
export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
