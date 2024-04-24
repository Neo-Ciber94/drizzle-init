import fse from "fs-extra";
import path from "path";
import type { Driver, Language, DbProvider } from "../types";
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
  drizzle: {
    config: "mysql2" | "pg" | "better-sqlite";
  };
};

export type InitCommandArgs = {
  driver: Driver;
  dbProvider: DbProvider;
  configType: Language;
  migrateFile: string;
  databaseDir: string;
};

const templatesPath = path.join(__dirname, "..", "templates");

export default async function createCommand(args: InitCommandArgs) {
  const schemaFile = path.join(templatesPath, "schemas", `${args.driver}.schema.ts`);
  const providerDir = path.join(templatesPath, "providers", args.driver, args.dbProvider);

  if (!(await fse.exists(providerDir))) {
    throw new Error(
      `Database provider '${args.dbProvider}' for '${args.driver}' is not implemented yet`
    );
  }

  const schema = await fse.readFile(schemaFile, "utf-8");
  const packageJson: PackageJson = await fse.readJson(path.join(providerDir, "package.json"));
  const configFile = packageJson.drizzle?.config;

  if (!configFile) {
    throw new Error(`package.json drizzle.config section was not defined for '${providerDir}'`);
  }

  const drizzleConfig = await fse.readFile(
    path.join(templatesPath, "config", `${configFile}.config.ts`),
    "utf-8"
  );

  console.log({ schema, drizzleConfig });

  // 1. Read template files (schema, migration, config, database)

  // 2. Write template to directory

  // 3. Update package.json database scripts

  // 4. Install dependencies
}

async function createFileIfDontExists(filePath: string, content: string) {
  if (await fse.exists(filePath)) {
    throw new Error(`${filePath} already exists`);
  }

  console.log(`Creating '${filePath}'...`);
  const dirname = path.dirname(filePath);
  await fse.ensureDir(dirname);
  await fse.writeFile(filePath, content);
}
