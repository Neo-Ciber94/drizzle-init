import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "better-sqlite",
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
