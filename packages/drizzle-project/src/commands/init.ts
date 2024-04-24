import fse from "fs-extra";
import path from "path";
import { type DbProvider } from "../constants";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PACKAGE_JSON_SCRIPTS = {
  mysql: {
    "db:generate": "npx drizzle-kit generate:mysql",
    "db:migrate": "tsx #migrateFile",
    "db:push": "npx drizzle-kit push:mysql",
  },
  postgresql: {
    "db:generate": "npx drizzle-kit generate:pg",
    "db:migrate": "tsx #migrateFile",
    "db:push": "npx drizzle-kit push:pg",
  },
  sqlite: {
    "db:generate": "npx drizzle-kit generate:sqlite",
    "db:migrate": "tsx #migrateFile",
    "db:push": "npx drizzle-kit push:sqlite",
  },
};

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

export type InitCommandArgs = {
  driver: "mysql" | "postgresql" | "sqlite";
  dbProvider: DbProvider;
  configFile: string;
  migrateFile: string;
  databaseDir: string;
};

const templatesPath = path.join(__dirname, "..", "templates");

export default async function createCommand(args: InitCommandArgs) {
  const useTypescript = args.configFile.endsWith(".ts") || (await hasTsConfig());

  const schemaTemplate = path.join(templatesPath, "schemas", `${args.driver}-schema.ts`);
  const providerDir = path.join(templatesPath, "schemas", args.driver, args.dbProvider);

  if (!(await fse.exists(providerDir))) {
    throw new Error(
      `Database provider '${args.dbProvider}' for '${args.driver}' is not implemented yet`
    );
  }

  const schemaFile = await fse.readFile(schemaTemplate, "utf-8");
  const databaseFile = await fse.readFile(path.join(providerDir, "index.ts"), "utf-8");
  const packageJson: PackageJson = await fse.readJson(path.join(providerDir, "package.json"));

  // console.log(schemaFile);
  await createFileIfDontExists(path.join(process.cwd()));
}

async function hasTsConfig() {
  const files = await fse.readdir(process.cwd());
  return files.some((f) => path.basename(f).startsWith("tsconfig."));
}

async function createFileIfDontExists(filePath: string) {
  if (await fse.exists(filePath)) {
    throw new Error(`${filePath} already exists`);
  }

  console.log(`Creating '${filePath}'...`);
  const dirname = path.dirname(filePath);
  await fse.ensureDir(dirname);
}
