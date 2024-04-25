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
import { detectPackageManager, detectProjectLanguage } from "./utils";
import {
  validateConfigType,
  validateDatabaseDir,
  validateDriver,
  validateMigrationFile,
  validateProvider,
  type ValidatorResult,
} from "./validators";

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
  .option("-m, --migrationFile <string>", "Migration file path", parseOption(validateMigrationFile))
  .option("-b, --databaseDir <string>", "Directory for the database and schema files")
  .option("-i, --installDeps", "Whether if install the dependencies");

function parseOption(validator: (value: string) => ValidatorResult<unknown>) {
  return (arg: string) => {
    const result = validator(arg);

    if (result.success === false) {
      throw new InvalidOptionArgumentError(result.error);
    }

    return result.data;
  };
}

async function run(init: Partial<InitCommandArgs>) {
  const hasSrcDirectory = await fse.exists(path.join(process.cwd(), "src"));
  const hasAppDirectory = await fse.exists(path.join(process.cwd(), "app"));
  const projectLang = await detectProjectLanguage();
  const packageManager = (await detectPackageManager()) ?? "npm";

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

  if (!init.configType) {
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

  if (!init.databaseDir) {
    init.installDeps = await inquirer
      .prompt({
        name: "installDeps",
        message: `Install dependencies? (${packageManager} install)`,
        type: "confirm",
        default: true,
      })
      .then((x) => x.installDeps);
  }

  console.log({ init });
  await initCommand(init as InitCommandArgs);
}

command
  .parseAsync()
  .then((program) => {
    const opts = program.opts<Partial<InitCommandArgs>>();
    return run(opts);
  })
  .catch((error) => {
    console.error(chalk.red("Failed to initialize drizzle\n\n"), error);
    process.exit(1);
  });
