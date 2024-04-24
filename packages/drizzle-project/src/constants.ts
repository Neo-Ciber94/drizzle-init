export const DRIZZLE_CONFIG_FILENAME = [
  "drizzle.config.js",
  "drizzle.config.ts",
];

export const DRIVERS = ["mysql", "postgresql", "sqlite"] as const;

export const MYSQL_DB_PROVIDERS = ["mysql2", "planetscale", "sql.js"] as const;

export const POSTGRESTQL_DB_PROVIDERS = [
  "node-postgres",
  "neon-http",
  "supabase",
  "pglite",
] as const;

export const SQLITE_PROVIDERS = ["better-sqlite3", "turso", "bun"] as const;

export type MySqlProvider = (typeof MYSQL_DB_PROVIDERS)[number];
export type PostgresqlProvider = (typeof POSTGRESTQL_DB_PROVIDERS)[number];
export type SqliteProvider = (typeof SQLITE_PROVIDERS)[number];
export type DbProvider = MySqlProvider | PostgresqlProvider | SqliteProvider;
