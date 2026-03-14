import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  __climitraDbClient?: ReturnType<typeof postgres>;
  __climitraDb?: ReturnType<typeof drizzle>;
};

function getDb() {
  if (globalForDb.__climitraDb) return globalForDb.__climitraDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const client =
    globalForDb.__climitraDbClient ?? postgres(connectionString);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__climitraDbClient = client;
  }

  const database = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__climitraDb = database;
  }

  return database;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
