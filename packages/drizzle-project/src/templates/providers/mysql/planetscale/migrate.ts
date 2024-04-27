import { migrate } from "drizzle-orm/planetscale-serverless/migrator";
import { db } from "#databaseDir";

migrate(db, { migrationsFolder: "#outDir" }).catch((err) => {
  console.error(err);
});
