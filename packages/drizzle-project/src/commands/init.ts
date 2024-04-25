import fse from "fs-extra";
import path from "path";
import type { Driver, Language, DbProvider } from "../types";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { detectPackageManager } from "../utils";
import spawn from "cross-spawn";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR_PLACEHOLDER = "#databaseDir";
const TEMPLATES_PATH = path.join(__dirname, "..", "templates");
const RUN_MIGRATION_SCRIPT_PLACEHOLDER = "#runMigration";

const PACKAGE_JSON_SCRIPTS = {
  mysql: {
    "db:generate": "npx drizzle-kit generate:mysql",
    "db:migrate": RUN_MIGRATION_SCRIPT_PLACEHOLDER,
    "db:push": "npx drizzle-kit push:mysql",
  },
  postgresql: {
    "db:generate": "npx drizzle-kit generate:pg",
    "db:migrate": RUN_MIGRATION_SCRIPT_PLACEHOLDER,
    "db:push": "npx drizzle-kit push:pg",
  },
  sqlite: {
    "db:generate": "npx drizzle-kit generate:sqlite",
    "db:migrate": RUN_MIGRATION_SCRIPT_PLACEHOLDER,
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
  installDeps: boolean;
};

export default async function createCommand(args: InitCommandArgs) {
  const providerDir = path.join(TEMPLATES_PATH, "providers", args.driver, args.dbProvider);
  const packageManager = await detectPackageManager();

  if (!(await fse.exists(providerDir))) {
    throw new Error(
      `Database provider '${args.dbProvider}' for '${args.driver}' is not implemented yet`
    );
  }

  // 1. Check if can write template files to ensure not overwriting existing ones
  await ensureCanWriteFiles(args);

  // 2. Read template files (schema, migration, config, database)
  const providerTemplate = await readDatabaseProviderTemplate(providerDir, args);

  // 3. Write template files
  await writeDatabaseProviderTemplate(providerTemplate, args);

  // 4. Update package.json database scripts
  await updatePackageJsonScripts(providerDir, providerTemplate, args);

  // 5. Install dependencies
  const { dependencies, devDependencies } = getDepsToInstall(providerTemplate, args);

  console.log("\n");
  console.log(chalk.bold("Dependencies to install:\n"));
  console.log(chalk.bgBlue("dependencies:\n"), dependencies.join("\n"));
  console.log(chalk.bgBlue("devDependencies:\n"), devDependencies.join("\n"));
  console.log("\n");

  if (args.installDeps) {
    await installDeps({ deps: dependencies, isDev: false });
    await installDeps({ deps: devDependencies, isDev: true });
  }

  // If no package manager was detected, probably the script was called on an empty folder,
  // this is an edge case we don't cover currently, we expected the CLI be used on an existing project
  if (packageManager == null) {
    await updatePackageJsonScripts(providerDir, providerTemplate, args);
  }
}

async function installDeps({ isDev, deps }: { isDev: boolean; deps: string[] }) {
  const packageManager = (await detectPackageManager()) ?? "npm";
  const args: string[] = ["install"];

  if (isDev) {
    args.push("-D");
  }

  args.push(...deps);

  return new Promise<void>((resolve, reject) => {
    const childProcess = spawn(packageManager, args, {
      stdio: "inherit",
      env: {
        ...process.env,
      },
    });

    childProcess.on("close", () => resolve());
    childProcess.on("error", () => reject(`Failed to install dependencies: ${deps.join(", ")}`));
  });
}

interface DatabaseProviderTemplate {
  databaseSchemaContents: string;
  databaseDriverContents: string;
  drizzleConfigContents: string;
  migrateFileContents: string;
  providerPackageJson: PackageJson;
}

async function ensureCanWriteFiles(args: InitCommandArgs) {
  const extension = args.configType === "typescript" ? "ts" : "js";
  const configFilePath = path.join(process.cwd(), `drizzle.config.${extension}`);
  const migrateFilePath = path.join(process.cwd(), `${args.migrateFile}`);
  const schemaFilePath = path.join(process.cwd(), args.databaseDir, `schema.${extension}`);
  const databaseFilePath = path.join(process.cwd(), args.databaseDir, `index.${extension}`);

  if (await fse.exists(configFilePath)) {
    throw new Error(
      `Drizzle config file "${path.relative(process.cwd(), configFilePath)}" already exists`
    );
  }

  if (await fse.exists(migrateFilePath)) {
    throw new Error(
      `A migrate file "${path.relative(process.cwd(), migrateFilePath)}" already exists`
    );
  }

  if (await fse.exists(schemaFilePath)) {
    throw new Error(
      `Database schema "${path.relative(process.cwd(), schemaFilePath)}" already exists`
    );
  }

  if (await fse.exists(databaseFilePath)) {
    throw new Error(
      `Database file "${path.relative(process.cwd(), databaseFilePath)}" already exists`
    );
  }
}

async function readDatabaseProviderTemplate(
  providerDir: string,
  args: InitCommandArgs
): Promise<DatabaseProviderTemplate> {
  const schemaFile = path.join(TEMPLATES_PATH, "schemas", `${args.driver}.schema.ts`);

  try {
    const databaseSchemaContents = await fse.readFile(schemaFile, "utf-8");
    const providerPackageJson: PackageJson = await fse.readJson(
      path.join(providerDir, "package.json")
    );
    const configFile = providerPackageJson.drizzle?.config;

    if (!configFile) {
      throw new Error(`package.json drizzle.config section was not defined for '${providerDir}'`);
    }

    const drizzleConfigContents = await fse.readFile(
      path.join(TEMPLATES_PATH, "config", `${configFile}.config.ts`),
      "utf-8"
    );

    const databaseDriverContents = await fse.readFile(path.join(providerDir, "index.ts"), "utf-8");

    const migrateFileContents = await fse.readFile(path.join(providerDir, "migrate.ts"), "utf-8");

    return {
      databaseSchemaContents,
      drizzleConfigContents,
      migrateFileContents,
      databaseDriverContents,
      providerPackageJson,
    };
  } catch (err) {
    console.error(
      chalk.red(`Failed to read '${args.driver}' template for provider '${args.dbProvider}'`)
    );
    throw err;
  }
}

async function writeDatabaseProviderTemplate(
  template: DatabaseProviderTemplate,
  args: InitCommandArgs
) {
  const extension = args.configType === "typescript" ? "ts" : "js";
  const configFilePath = path.join(process.cwd(), `drizzle.config.${extension}`);
  const migrateFilePath = path.join(process.cwd(), `${args.migrateFile}`);
  const schemaFilePath = path.join(process.cwd(), args.databaseDir, `schema.${extension}`);
  const databaseFilePath = path.join(process.cwd(), args.databaseDir, `index.${extension}`);

  console.log("\n");

  // drizzle.config.{ts|js}
  await safeWriteFile(configFilePath, template.drizzleConfigContents);

  // db/schema.{ts|js}
  await safeWriteFile(schemaFilePath, template.databaseSchemaContents);

  // db/index.{ts|js}
  await safeWriteFile(databaseFilePath, template.databaseDriverContents);

  // migrate.{ts|js}
  await safeWriteFile(
    migrateFilePath,
    replaceDatabaseDirPlaceholder(template.migrateFileContents, args)
  );
}

async function updatePackageJsonScripts(
  providerDir: string,
  template: DatabaseProviderTemplate,
  args: InitCommandArgs
) {
  const dbScripts = PACKAGE_JSON_SCRIPTS[args.driver];

  if (!dbScripts) {
    throw new Error(`Unable to find database scripts for ${args.driver}`);
  }

  const packageFilePath = path.join(process.cwd(), "package.json");

  if (!(await fse.exists(packageFilePath))) {
    return;
  }

  const packageJson: PackageJson = await fse.readJSON(packageFilePath);
  packageJson.scripts ??= {}; // ensure no empty

  const runMigration =
    args.configType === "javascript" ? `node ${args.migrateFile}` : `npx tsx ${args.migrateFile}`;

  packageJson.scripts = {
    ...packageJson.scripts,
    ["db:push"]: dbScripts["db:push"],
    ["db:generate"]: dbScripts["db:generate"],
    ["db:migrate"]: dbScripts["db:migrate"].replace(RUN_MIGRATION_SCRIPT_PLACEHOLDER, runMigration),
  };

  // TODO: format with prettier
  await fse.writeJSON(packageFilePath, packageJson, { spaces: 2 });
}

function replaceDatabaseDirPlaceholder(contents: string, args: InitCommandArgs) {
  return contents.replace(DATABASE_DIR_PLACEHOLDER, args.databaseDir);
}

function getDepsToInstall(template: DatabaseProviderTemplate, args: InitCommandArgs) {
  const dependencies: string[] = [];
  const devDependencies: string[] = [];

  if (template.providerPackageJson.dependencies) {
    const deps = Object.keys(template.providerPackageJson.dependencies);
    dependencies.push(...deps);
  }

  if (template.providerPackageJson.devDependencies) {
    const deps = Object.keys(template.providerPackageJson.devDependencies);
    devDependencies.push(...deps);
  }

  if (args.configType === "typescript") {
    // We execute the typescript migrate with tsx
    devDependencies.push("tsx");
  }

  // migrate uses `dotenv/config`
  devDependencies.push("dotenv");

  return {
    devDependencies,
    dependencies,
  };
}

async function safeWriteFile(filePath: string, content: string) {
  if (await fse.exists(filePath)) {
    throw new Error(`${filePath} already exists`);
  }

  console.log(chalk.green(`Creating '${path.relative(process.cwd(), filePath)}'...`));
  const dirname = path.dirname(filePath);
  await fse.ensureDir(dirname);
  await fse.writeFile(filePath, content);
}
