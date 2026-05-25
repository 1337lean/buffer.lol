import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let client: postgres.Sql | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database access.");
  }

  client ??= postgres(databaseUrl, {
    connect_timeout: 10,
    idle_timeout: 20,
    max: 3,
    prepare: false
  });

  return drizzle(client, { schema });
}
