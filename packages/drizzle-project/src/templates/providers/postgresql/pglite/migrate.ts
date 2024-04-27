import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "#outDir" }).catch((err) => {
  console.error(err);
});
