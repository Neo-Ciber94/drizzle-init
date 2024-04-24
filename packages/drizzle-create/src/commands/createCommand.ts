import fse from "fs-extra";
import path from "path";
import { type DbProvider } from "../constants";

export type CreateCommandArgs = {
  driver: "mysql" | "postgresql" | "sqlite";
  dbProvider: DbProvider;
  configFile: string;
  migrateFile: string;
  databaseDir: string;
};

export default async function createCommand(args: CreateCommandArgs) {
  const useTypescript = args.configFile.endsWith(".ts") || (await hasTsConfig());
}

async function hasTsConfig() {
  const files = await fse.readdir(process.cwd());
  return files.some((f) => path.basename(f).startsWith("tsconfig."));
}

async function createFileIfDontExists(filePath: string) {
  if (await fse.exists(filePath)) {
    throw new Error(`${filePath} already exists`);
  }

  const dirname = path.dirname(filePath);
  await fse.ensureDir(dirname);
}
