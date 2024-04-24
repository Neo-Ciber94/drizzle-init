import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "#databaseDir/schema.ts",
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.DATABASE_URL!,
  },
});
