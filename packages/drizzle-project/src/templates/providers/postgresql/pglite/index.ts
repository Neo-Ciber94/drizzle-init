import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error('"DATABASE_URL" environment variable is not set');
}

// In memory
// Checkout out other storage backends: https://github.com/electric-sql/pglite
const client = new PGlite();
export const db = drizzle(client, { schema });
