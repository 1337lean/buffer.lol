import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

try {
  const migration = await readFile(join(root, "lib/db/migrations/0000_initial.sql"), "utf8");
  await sql.unsafe(migration);
  console.log("Database schema is ready.");
} finally {
  await sql.end();
}
