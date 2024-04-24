import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from "./#databaseDir";

migrate(db, { migrationsFolder: "./drizzle" }).catch((err) => {
  console.error(err);
  process.exit(0);
});
