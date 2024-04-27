import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "#outDir" });
