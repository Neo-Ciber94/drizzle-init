import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
