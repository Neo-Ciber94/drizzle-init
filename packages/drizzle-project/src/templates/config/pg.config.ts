import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "pg",
  out: './drizzle',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
