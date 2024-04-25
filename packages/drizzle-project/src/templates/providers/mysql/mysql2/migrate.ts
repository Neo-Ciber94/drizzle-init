import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" }).catch((err) => {
  console.error(err);
  process.exit(0);
});
