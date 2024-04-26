import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" }).catch((err) => {
  console.error(err);
});
