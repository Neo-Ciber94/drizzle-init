import fse from "fs-extra";
import path from "path";
import { type DbProvider } from "../constants";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type InitCommandArgs = {
  driver: "mysql" | "postgresql" | "sqlite";
  dbProvider: DbProvider;
  configFile: string;
  migrateFile: string;
  databaseDir: string;
};

const templatesPath = path.join(__dirname, "..", "templates");
console.log(templatesPath);

export default async function createCommand(args: InitCommandArgs) {
  const useTypescript = args.configFile.endsWith(".ts") || (await hasTsConfig());

  const schemaTemplate = path.join(templatesPath, "schemas", `${args.driver}-schema.ts`);
  const schema = await fse.readFile(schemaTemplate, "utf-8");

  console.log(schema);
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
