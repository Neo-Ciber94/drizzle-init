export const DRIVERS = ["mysql", "postgresql", "sqlite"] as const;

export const MYSQL_DB_PROVIDERS = ["mysql2", "planetscale"] as const;

export const POSTGRESTQL_DB_PROVIDERS = [
  "node-postgres",
  "neon-http",
  "postgres-js",
  "pglite",
] as const;

export const SQLITE_PROVIDERS = ["better-sqlite3", "libsql", "turso", "bun", "sql.js"] as const;

export type Driver = (typeof DRIVERS)[number];
export type Language = "typescript" | "javascript";
export type MySqlProvider = (typeof MYSQL_DB_PROVIDERS)[number];
export type PostgresqlProvider = (typeof POSTGRESTQL_DB_PROVIDERS)[number];
export type SqliteProvider = (typeof SQLITE_PROVIDERS)[number];
export type DbProvider = MySqlProvider | PostgresqlProvider | SqliteProvider;
