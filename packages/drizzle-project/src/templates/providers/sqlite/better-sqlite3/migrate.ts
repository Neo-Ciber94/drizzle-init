import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" });
