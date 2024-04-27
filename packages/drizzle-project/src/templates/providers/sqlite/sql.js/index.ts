import { drizzle, type SQLJsDatabase } from "drizzle-orm/sql-js";
import initSqlJs, {
  type BindParams,
  type ParamsCallback,
  type Database,
  type Statement,
} from "sql.js";
import * as schema from "./schema";

let DRIZZLE: SQLJsDatabase<typeof schema>;

const STORE_NAME = "sqlite-sql";
const BUFFER_NAME = "sqlite-buffer";

export async function getDatabase(): Promise<SQLJsDatabase<typeof schema>> {
  if (DRIZZLE) {
    return DRIZZLE;
  }

  const source = await initilializeSqlJs();
  const idb = await indexedDb(STORE_NAME);
  const sqliteBuffer = await idb.get(BUFFER_NAME);

  if (sqliteBuffer == null || !(sqliteBuffer instanceof Uint8Array)) {
    await applyMigrations(idb, source);
  }

  DRIZZLE = drizzle(source, { schema });
  return DRIZZLE;
}

async function indexedDb(storeName: string) {
  function openIDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open("sqlite-db");
      request.onerror = (err) => reject(err);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (ev) => {
        const db = (ev.target as IDBOpenDBRequest).result;
        db.createObjectStore(storeName);
      };
    });
  }

  const idb = await openIDb();

  async function set(key: string, value: unknown) {
    const transaction = idb.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).put(value, key);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = (err) => reject(err);
    });
  }

  async function get(key: string) {
    const transaction = idb.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).get(key);

    return new Promise<unknown>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => reject(err);
    });
  }

  async function remove(key: string) {
    const transaction = idb.transaction(storeName, "readwrite");
    const request = transaction.objectStore(storeName).delete(key);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = (err) => reject(err);
    });
  }

  return {
    set,
    get,
    delete: remove,
  };
}

// Based on: https://github.com/drizzle-team/drizzle-orm/blob/e0aaeb21b14f6027fc5a767d1f4617601650cb06/drizzle-orm/src/sqlite-core/dialect.ts#L727-L728
async function applyMigrations(
  idb: Awaited<ReturnType<typeof indexedDb>>,
  source: Awaited<ReturnType<typeof initilializeSqlJs>>
) {
  const migrationsTable = "__drizzle_migrations";
  source.run(`
    CREATE TABLE IF NOT EXISTS ${migrationsTable} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const migrationsQueryResult = source.exec(
    `SELECT id, hash, created_at FROM ${migrationsTable} ORDER BY created_at DESC LIMIT 1`
  );
  const lastMigration = migrationsQueryResult[0] ?? undefined;

  try {
    const migrationsMeta = await fetchMigrations();

    if (migrationsMeta.length > 0) {
      console.log("⌛ Applying migrations...");
      source.run(`BEGIN`);

      try {
        for (const migration of migrationsMeta) {
          if (lastMigration && Number(lastMigration[2]) < migration.folderMillis) {
            for (const sql of migration.sql) {
              console.log(`📝 Running migration:\n\n${sql}`);
              source.exec(sql);
            }
          }
        }

        source.run(`COMMIT`);

        // Save migrations
        const buffer = source.export();
        await idb.set(BUFFER_NAME, buffer);

        console.log("✅ Applied migrations");
      } catch (err) {
        source.run(`ROLLBACK`);
        console.error("❌ Failed to apply migrations", err);
      }
    }
  } catch (err) {
    console.error("Failed to fetch migrations", err);
  }
}

async function initilializeSqlJs() {
  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  const idb = await indexedDb(STORE_NAME);

  async function loadBuffer() {
    const buffer = await idb.get(BUFFER_NAME);

    try {
      if (buffer instanceof Uint8Array) {
        return buffer;
      }

      return undefined;
    } catch (err) {
      return undefined;
    }
  }

  class __Statement implements Statement {
    constructor(private stmt: Statement, private db: __Database) {}

    bind(values?: BindParams): boolean {
      return this.stmt.bind(values);
    }

    free(): boolean {
      return this.stmt.free();
    }

    freemem(): void {
      return this.stmt.freemem();
    }

    get(params?: BindParams): initSqlJs.SqlValue[] {
      return this.stmt.get(params);
    }

    getAsObject(params?: BindParams): initSqlJs.ParamsObject {
      return this.stmt.getAsObject(params);
    }

    getColumnNames(): string[] {
      return this.stmt.getColumnNames();
    }

    getNormalizedSQL(): string {
      return this.stmt.getNormalizedSQL();
    }

    getSQL(): string {
      return this.stmt.getSQL();
    }

    reset(): void {
      return this.stmt.reset();
    }

    run(values?: BindParams): void {
      const ret = this.stmt.run(values);
      void this.db.syncToStorage();
      return ret;
    }

    step(): boolean {
      return this.stmt.step();
    }
  }

  class __Database extends SQL.Database {
    constructor(buffer?: Uint8Array) {
      super(buffer);
    }

    each(sql: string, params: BindParams, callback: ParamsCallback, done: () => void): Database;
    each(sql: string, callback: ParamsCallback, done: () => void): Database;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    each(sql: any, params: any, callback: any, done?: any): Database {
      const ret = super.each(sql, params, callback, () => {
        done?.();
        void this.syncToStorage();
      });
      return ret;
    }

    exec(sql: string, params?: BindParams): initSqlJs.QueryExecResult[] {
      const ret = super.exec(sql, params);
      void this.syncToStorage();
      return ret;
    }

    run(sql: string, params?: BindParams): Database {
      const ret = super.run(sql, params);
      void this.syncToStorage();
      return ret;
    }

    prepare(sql: string, params?: BindParams): Statement {
      const stmt = super.prepare(sql, params);
      return new __Statement(stmt, this);
    }

    export(): Uint8Array {
      return super.export();
    }

    async syncToStorage() {
      if (super.getRowsModified() > 0) {
        const buffer = super.export();
        await idb.set(BUFFER_NAME, buffer);
      }
    }
  }

  return new __Database(await loadBuffer());
}

type Journal = {
  version: string;
  dialect: string;
  entries: {
    idx: number;
    version: string;
    when: number;
    tag: string;
    breakpoints: boolean;
  }[];
};

interface MigrationMeta {
  sql: string[];
  folderMillis: number;
}

async function fetchMigrations() {
  const migrationsSqls: MigrationMeta[] = [];

  const res = await fetch("/drizzle/meta/_journal.json");

  if (!res.ok || res.status === 404) {
    throw new Error('"/drizzle/meta/_journal.json" was not found in the public directory');
  }

  const journal: Journal = await res.json();
  const entries = journal.entries.sort((a, b) => a.when - b.when);

  for (const entry of entries) {
    const rawSql = await fetch(`/drizzle/${entry.tag}.sql`).then((x) => x.text());
    const parts = rawSql.split("--> statement-breakpoint").map((x) => x.trim());
    migrationsSqls.push({
      sql: parts,
      folderMillis: entry.when,
    });
  }

  return migrationsSqls;
}
