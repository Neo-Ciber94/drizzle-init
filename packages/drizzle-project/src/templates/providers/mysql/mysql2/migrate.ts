import { migrate } from "drizzle-orm/mysql2/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "#outDir" }).catch((err) => {
  console.error(err);
});
