import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const globalForDb = globalThis as typeof globalThis & {
  __climitraDbClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__climitraDbClient ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__climitraDbClient = client;
}

export const db = drizzle(client, { schema });
