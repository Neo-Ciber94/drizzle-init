import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "#outDir" }).catch((err) => {
  console.error(err);
});
