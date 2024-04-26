import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" }).catch((err) => {
  console.error(err);
});
