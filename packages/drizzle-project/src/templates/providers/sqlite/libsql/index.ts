import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error('"DATABASE_URL" environment variable is not set');
}

const client = createClient({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });
