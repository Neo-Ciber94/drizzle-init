import chalk from "chalk";
import { Command } from "commander";
import packageJson from "../package.json";
import inquirer from "inquirer";
import path from "path";
import initCommand, { type InitCommandArgs } from "./commands/init";
import {
  DRIVERS,
  MYSQL_DB_PROVIDERS,
  POSTGRESTQL_DB_PROVIDERS,
  SQLITE_PROVIDERS,
  DRIZZLE_CONFIG_FILENAME,
} from "./constants";

const command = new Command()
  .description(packageJson.description)
  .version(packageJson.version)
  .action(async () => {
    const hasSrcDirectory = path.join(process.cwd(), "src");
    const args: InitCommandArgs = await inquirer.prompt([
      {
        name: "driver",
        message: "What driver you want to use?",
        type: "list",
        choices: DRIVERS.map((value) => ({ value, name: value })),
        default: DRIVERS[0],
      },
      {
        name: "dbProvider",
        type: "list",
        message(answers) {
          return `What ${chalk.blue(answers.driver)} provider do you want to use?`;
        },
        choices(answers) {
          switch (answers.driver) {
            case DRIVERS[0]:
              return MYSQL_DB_PROVIDERS.map((value) => ({ value, name: value }));
            case DRIVERS[1]:
              return POSTGRESTQL_DB_PROVIDERS.map((value) => ({ value, name: value }));
            case DRIVERS[2]:
              return SQLITE_PROVIDERS.map((value) => ({ value, name: value }));
            default:
              throw new Error(`Unable to determine providers for: ${answers.driver}`);
          }
        },
      },
      {
        name: "configFile",
        message: "Config file location",
        default: "./drizzle.config.ts",
        validate(input) {
          const filename = path.basename(input);

          if (!DRIZZLE_CONFIG_FILENAME.includes(filename)) {
            const validFileNames = DRIZZLE_CONFIG_FILENAME.map((f) => chalk.blue(f)).join(", ");

            return `Invalid config file name, expected one of: ${validFileNames}`;
          }

          return true;
        },
      },
      {
        name: "migrateFile",
        message: "Migrate file location",
        default: "./migrate.ts",
        async validate(input) {
          // We assume is a valid file if have an extension
          const extension = path.extname(input);
          return extension.length > 0 ? true : "Expected a valid file, eg: migrate.ts";
        },
      },
      {
        name: "databaseDir",
        message: "Database and Schema directory",
        default: hasSrcDirectory ? "./src/db" : "./lib/db",
      },
    ]);

    await initCommand(args);
  });

command.parseAsync().catch((error) => {
  console.error(chalk.red("Failed to initialize drizzle"), error);
  process.exit(1);
});
