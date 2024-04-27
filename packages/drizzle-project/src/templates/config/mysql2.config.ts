import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error('"DATABASE_URL" environment variable is not set');
}

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "mysql2",
  out: "#outDir",
  dbCredentials: {
    uri: process.env.DATABASE_URL,
  },
});
