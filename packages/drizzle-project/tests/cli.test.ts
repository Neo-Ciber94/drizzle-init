import path from "path";
import fse from "fs-extra";
import os from "os";
import { type InitCommandArgs } from "../src/commands/init";
import { describe, test, expect } from "vitest";
import { exec } from "child_process";

const cliPath = path.join(process.cwd(), "dist", "cli.mjs");

if (!(await fse.exists(cliPath))) {
  throw new Error(`CLI do not exists on : ${cliPath}`);
}

const npmInit = (cwd: string) => runCommand({ cwd, command: "npm init -y" });
const npmDbGenerate = (cwd: string) => runCommand({ cwd, command: "npm run db:generate", env: { DATABASE_URL: "test" } });

describe("Run cli", () => {
  test("Should init mysql2 drizzle template", { timeout: 120_000 }, async () => {
    const tempDir = await createTempDir();

    await npmInit(tempDir);

    await runDrizzleInitProject(tempDir, {
      driver: "mysql",
      dbProvider: "mysql2",
      migrateFile: "./migrate.ts",
      configType: "typescript",
      databaseDir: "./lib/db",
      install: true,
    });

    await npmDbGenerate(tempDir);

    await expect(fse.exists(path.join(tempDir, "./drizzle.config.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./migrate.ts"))).resolves.toBeTruthy();
    await expect(fse.exists(path.join(tempDir, "./lib/db"))).resolves.toBeTruthy();
    await expect(
      fse.exists(path.join(tempDir, "./drizzle", "meta", "_journal.json"))
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

  const command = `node ${args.join(" ")}`;
  return runCommand({ cwd, command });
}

async function runCommand({
  cwd,
  env,
  command,
}: {
  command: string;
  cwd: string;
  env?: Record<string, string>;
}) {
  return new Promise<void>((resolve, reject) => {
    const childProcess = exec(command, {
      cwd,
      env: {
        NODE_ENV: "TEST",
        ...env,
      },
    });

    childProcess.stderr?.setEncoding("utf8");
    childProcess.stderr?.on("data", console.error);

    childProcess.on("close", () => resolve());
    childProcess.on("error", () => reject(new Error(`Failed to run: '${command}'`)));
  });
}

// async function createTempDir() {
//   const tempDirName = btoa(crypto.randomUUID()).replace("=", "");
//   const tempDir = path.join(os.tmpdir(), tempDirName);
//   await fse.ensureDir(tempDir);
//   console.log({ tempDir });
//   return tempDir;
// }
async function createTempDir() {
  const tempDir = path.join(os.tmpdir(), "NWQzNTVhOWEtMTU4MS00MjNjLWE2YjctNjQ3MDBjOTMxNWM1");
  await fse.ensureDir(tempDir);
  console.log({ tempDir });
  return tempDir;
}
