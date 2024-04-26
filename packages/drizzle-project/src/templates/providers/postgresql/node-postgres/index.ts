import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error('"DATABASE_URL" environment variable is not set');
}

const client = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(client, { schema });
