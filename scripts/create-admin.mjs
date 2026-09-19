// Usage: ADMIN_EMAIL=you@x.com ADMIN_NAME="Name" ADMIN_PASSWORD='...' DATABASE_URL=... node scripts/create-admin.mjs
// The password is read from the environment of the operator running the command — never committed, never pasted into chat.
import bcrypt from "bcryptjs";
import pg from "pg";
const { Client } = pg;

async function main() {
  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = process.env;
  if (!DATABASE_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD are required");
  if (ADMIN_PASSWORD.length < 12 || !/[a-z]/.test(ADMIN_PASSWORD) || !/[A-Z]/.test(ADMIN_PASSWORD) || !/\d/.test(ADMIN_PASSWORD)) throw new Error("Password must be 12+ chars with upper, lower and a digit");
  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await c.query(
    `INSERT INTO users(email,name,password_hash,role) VALUES ($1,$2,$3,'admin')
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin', disabled=false, failed_logins=0, locked_until=NULL`,
    [ADMIN_EMAIL, ADMIN_NAME ?? "Administrator", hash]);
  await c.end();
  console.log(`Admin user ready: ${ADMIN_EMAIL}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
