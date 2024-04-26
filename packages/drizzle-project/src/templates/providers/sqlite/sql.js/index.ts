import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs, { type Database } from "sql.js";
import * as schema from "./schema";

type DrizzleSqlite = {
  source: Database;
  db: SQLJsDatabase<typeof schema>;
};

let DRIZZLE_DB: DrizzleSqlite | undefined;

export async function getDatabase(buffer?: Uint8Array): Promise<DrizzleSqlite> {
  if (DRIZZLE_DB) {
    return DRIZZLE_DB;
  }

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const source = new SQL.Database(buffer);
  const db = drizzle(source, { schema });
  return DRIZZLE_DB = { db, source };
}
