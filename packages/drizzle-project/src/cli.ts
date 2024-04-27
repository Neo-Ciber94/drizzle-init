#!/usr/bin/env node
import chalk from "chalk";
import { Command, InvalidOptionArgumentError } from "commander";
import packageJson from "../package.json";
import inquirer from "inquirer";
import path from "path";
import fse from "fs-extra";
import initCommand, { type InitCommandArgs } from "./commands/init";
import {
  type Language,
  DRIVERS,
  MYSQL_DB_PROVIDERS,
  POSTGRESTQL_DB_PROVIDERS,
  SQLITE_PROVIDERS,
} from "./types";
import { detectPackageManager, detectProjectLanguage, objectKeys } from "./utils";
import {
  validateConfigType,
  validateDatabaseDir,
  validateDriver,
  validateMigrationFile,
  validateOutputDir,
  validateProvider,
  type ValidatorResult,
} from "./validators";

type Options = Partial<InitCommandArgs> & {
  install?: boolean;
};

const command = new Command()
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .option(
    "-d, --driver <string>",
    "Database driver to use (mysql, postgres, sqlite)",
    parseOption(validateDriver)
  )
  .option("-p, --dbProvider <string>", "Database provider to use", parseOption(validateProvider))
  .option(
    "-c, --configType <string>",
    "Drizzle config file type (typescript, javascript)",
    parseOption(validateConfigType)
  )
  .option("-m, --migrateFile <string>", "Migration file path", parseOption(validateMigrationFile))
  .option(
    "-o, --outDir <string>",
    "Migrations output directory",
    parseOption(validateOutputDir),
    "./drizzle"
  )
  .option("-b, --databaseDir <string>", "Directory for the database and schema files")
  .option("-i, --install", "Whether if install the dependencies")
  .option("--no-install", "No install dependencies");

function parseOption(validator: (value: string) => ValidatorResult<unknown>) {
  return (arg: string) => {
    const result = validator(arg);

    if (result.success === false) {
      throw new InvalidOptionArgumentError(result.error);
    }

    return result.data;
  };
}

async function run(init: Options) {
  const hasSrcDirectory = await fse.exists(path.join(process.cwd(), "src"));
  const hasAppDirectory = await fse.exists(path.join(process.cwd(), "app"));
  const projectLang = await detectProjectLanguage();
  const packageManager = (await detectPackageManager()) ?? "npm";

  // We only ask for the output directory when the cli is called without args
  const promptOutDir = objectKeys(init).filter((x) => x !== "outDir").length === 0;

  if (!init.driver) {
    init.driver = await inquirer
      .prompt({
        name: "driver",
        message: "What driver you want to use?",
        type: "list",
        choices: DRIVERS.map((value) => ({ value, name: value })),
        default: DRIVERS[0],
      })
      .then((x) => x.driver);
  }

  if (!init.dbProvider) {
    init.dbProvider = await inquirer
      .prompt({
        name: "dbProvider",
        type: "list",
        message() {
          return `What ${chalk.blue(init.driver)} provider do you want to use?`;
        },
        choices() {
          switch (init.driver) {
            case DRIVERS[0]:
              return MYSQL_DB_PROVIDERS.map((value) => ({ value, name: value }));
            case DRIVERS[1]:
              return POSTGRESTQL_DB_PROVIDERS.map((value) => ({ value, name: value }));
            case DRIVERS[2]:
              return SQLITE_PROVIDERS.map((value) => ({ value, name: value }));
            default:
              throw new Error(`Unable to determine providers for: ${init.driver}`);
          }
        },
      })
      .then((x) => x.dbProvider);
  }

  if (!init.configType) {
    init.configType = await inquirer
      .prompt({
        name: "configType",
        message: "Config file type",
        default: projectLang ?? "typescript",
        type: "list",
        choices: [
          { value: "typescript", name: chalk.blueBright("Typescript") },
          { value: "javascript", name: chalk.yellowBright("Javascript") },
        ] satisfies { value: Language; name: string }[],
      })
      .then((x) => x.configType);
  }

  if (!init.migrateFile) {
    init.migrateFile = await inquirer
      .prompt({
        name: "migrateFile",
        message: "Migrate file location",
        default() {
          const lang = init.configType === "javascript" ? "javascript" : "typescript";
          switch (lang) {
            case "javascript":
              return "./migrate.js";
            default:
              return "./migrate.ts";
          }
        },
        async validate(input) {
          const result = validateMigrationFile(input);
          return result.success ? true : result.error;
        },
      })
      .then((x) => x.migrateFile);
  }

  if (!init.databaseDir) {
    init.databaseDir = await inquirer
      .prompt({
        name: "databaseDir",
        message: "Database and Schema directory",
        validate(input) {
          const result = validateDatabaseDir(input);
          return result.success ? true : result.error;
        },
        default() {
          if (hasSrcDirectory) {
            return "./src/lib/db";
          }

          if (hasAppDirectory) {
            return "./app/lib/db";
          }

          return "./lib/db";
        },
      })
      .then((x) => x.databaseDir);
  }

  if (promptOutDir) {
    init.outDir = await inquirer
      .prompt({
        name: "outDir",
        message: "Migrations output directory",
        validate(input) {
          const result = validateOutputDir(input);
          return result.success ? true : result.error;
        },
        default: "./drizzle",
      })
      .then((x) => x.outDir);
  }

  init.installDeps = init.install;

  if (init.installDeps == null) {
    init.installDeps = await inquirer
      .prompt({
        name: "installDeps",
        message: `Install dependencies? (${packageManager} install)`,
        type: "confirm",
        default: true,
      })
      .then((x) => x.installDeps);
  }

  await initCommand(init as InitCommandArgs);
}

command
  .parseAsync()
  .then((program) => {
    const opts = program.opts<Options>();
    return run(opts);
  })
  .catch((error) => {
    console.error(chalk.red("Failed to initialize drizzle\n\n"), error);
    process.exit(1);
  });
