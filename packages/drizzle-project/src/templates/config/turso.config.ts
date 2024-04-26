import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error('"DATABASE_URL" environment variable is not set');
}

if (!process.env.DATABASE_AUTH_TOKEN) {
  throw new Error('"DATABASE_AUTH_TOKEN" environment variable is not set');
}

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "turso",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
