import { migrate } from "drizzle-orm/sql-js/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" });
