import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" }).catch((err) => {
  console.error(err);
});
