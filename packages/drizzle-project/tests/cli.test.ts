import path from "path";
import fse from "fs-extra";
import os from "os";
import { type InitCommandArgs } from "../src/commands/init";
import { describe, test, expect } from "vitest";
import { exec } from "child_process";
import { MYSQL_DB_PROVIDERS, POSTGRESTQL_DB_PROVIDERS, SQLITE_PROVIDERS } from "../src/types";

const cliPath = path.join(process.cwd(), "dist", "cli.mjs");

if (!(await fse.exists(cliPath))) {
  throw new Error(`CLI do not exists on : ${cliPath}`);
}

const npmInit = (cwd: string) => {
  return execCommand({ cwd, cmd: "npm init -y" });
};

const npmDbGenerate = (cwd: string) => {
  return execCommand({
    cwd,
    cmd: "npm run db:generate",
    env: { DATABASE_URL: "test", DATABASE_AUTH_TOKEN: "test" },
  });
};

describe("Run cli with mysql driver", () => {
  for (const mysqlProvider of MYSQL_DB_PROVIDERS) {
    test(
      `Should init typescript 'mysql - ${mysqlProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "mysql",
          dbProvider: mysqlProvider,
          migrateFile: "./migrate.ts",
          configType: "typescript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.ts"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );

    test(
      `Should init javascript 'mysql - ${mysqlProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "mysql",
          dbProvider: mysqlProvider,
          migrateFile: "./migrate.js",
          configType: "javascript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.js"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );
  }
});

describe("Run cli with postgresql driver", () => {
  for (const postgresqlProvider of POSTGRESTQL_DB_PROVIDERS) {
    test(
      `Should init typescript 'postgres - ${postgresqlProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "postgresql",
          dbProvider: postgresqlProvider,
          migrateFile: "./migrate.ts",
          configType: "typescript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.ts"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );

    test(
      `Should init javascript 'postgres - ${postgresqlProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "postgresql",
          dbProvider: postgresqlProvider,
          migrateFile: "./migrate.js",
          configType: "javascript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.js"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );
  }
});

describe("Run cli with sqlite driver", () => {
  for (const sqliteProvider of SQLITE_PROVIDERS) {
    test(
      `Should init typescript 'sqlite - ${sqliteProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "sqlite",
          dbProvider: sqliteProvider,
          migrateFile: "./migrate.ts",
          configType: "typescript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.ts"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.ts"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );

    test(
      `Should init javascript 'sqlite - ${sqliteProvider}' drizzle template`,
      { timeout: 120_000 },
      async () => {
        const tempDir = await createTempDir();

        await npmInit(tempDir);

        await runDrizzleInitProject(tempDir, {
          driver: "sqlite",
          dbProvider: sqliteProvider,
          migrateFile: "./migrate.js",
          configType: "javascript",
          databaseDir: "./lib/db",
          install: true,
        });

        await npmDbGenerate(tempDir);

        await expect(fse.exists(path.join(tempDir, "./drizzle.config.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./migrate.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/index.js"))).resolves.toBeTruthy();
        await expect(fse.exists(path.join(tempDir, "./lib/db/schema.js"))).resolves.toBeTruthy();
        await expect(
          fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
        ).resolves.toBeTruthy();
      }
    );
  }
});

describe("Run cli with customs options", () => {
  test("Should generate migration on public/db folder", { timeout: 120_000 }, async () => {
    const tempDir = await createTempDir();

    await npmInit(tempDir);

    await runDrizzleInitProject(tempDir, {
      driver: "sqlite",
      dbProvider: "libsql",
      migrateFile: "./migrate.ts",
      configType: "typescript",
      databaseDir: "./lib/db",
      outDir: "public/db",
      install: true,
    });

    await npmDbGenerate(tempDir);

    await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./migrate.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./lib/db/index.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./lib/db/schema.ts"))).resolves.toBeTruthy();
    await expect(
      fse.exists(path.join(tempDir, "public", "db", "meta", "_journal.json"))
    ).resolves.toBeTruthy();
  });

  test("Should generate files with custom options", { timeout: 120_000 }, async () => {
    const tempDir = await createTempDir();

    await npmInit(tempDir);

    await runDrizzleInitProject(tempDir, {
      driver: "mysql",
      dbProvider: "mysql2",
      migrateFile: "db/migrator.ts",
      configType: "typescript",
      databaseDir: "./db",
      outDir: "db/migrations",
      install: true,
    });

    await npmDbGenerate(tempDir);

    await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./db/migrator.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./db/index.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./db/schema.ts"))).resolves.toBeTruthy();
    await expect(
      fse.exists(path.join(tempDir, "db", "migrations", "meta", "_journal.json"))
    ).resolves.toBeTruthy();
  });
});

type InstallOptions = { install: true } | { "no-install": true };
type Options = Omit<InitCommandArgs, "installDeps" | "outDir"> &
  InstallOptions & {
    outDir?: string;
  };

async function runDrizzleInitProject(cwd: string, opts: Options) {
  const args: string[] = [cliPath];

  for (const [key, value] of Object.entries(opts)) {
    if (value === true) {
      args.push(`--${key}`);
    } else {
      args.push(`--${key} ${value}`);
    }
  }

  const cmd = `node ${args.join(" ")}`;
  return execCommand({ cwd, cmd });
}

async function execCommand({
  cwd,
  env,
  cmd,
}: {
  cmd: string;
  cwd: string;
  env?: Record<string, string>;
}) {
  return new Promise<void>((resolve, reject) => {
    const childProcess = exec(cmd, {
      cwd,
      env: {
        ...process.env,
        ...env,
        NODE_ENV: "TEST",
      },
    });

    childProcess.stderr?.setEncoding("utf8");
    childProcess.stderr?.on("data", console.error);

    childProcess.on("close", () => resolve());
    childProcess.on("error", (err) => reject(new Error(`Failed to run: '${cmd}}': ${err}`)));
  });
}

async function createTempDir() {
  const tempDirName = btoa(crypto.randomUUID()).replace("=", "");
  const tempDir = path.join(os.tmpdir(), tempDirName);
  await fse.ensureDir(tempDir);
  return tempDir;
}
