import chalk from "chalk";
import { Command } from "commander";
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

const command = new Command()
  .description(packageJson.description)
  .version(packageJson.version)
  .action(async () => {
    const hasSrcDirectory = await fse.exists(path.join(process.cwd(), "src"));
    const hasAppDirectory = await fse.exists(path.join(process.cwd(), "app"));
    const projectLang = await guestProjectLanguage();

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
        name: "configType",
        message: "Config file type",
        default: projectLang ?? "typescript",
        type: "list",
        choices: [
          { name: "javascript", value: chalk.yellowBright("Javascript") },
          { name: "typescript", value: chalk.blueBright("Typescript") },
        ] satisfies { name: Language; value: string }[],
      },
      {
        name: "migrateFile",
        message: "Migrate file location",
        default: "./migrate.ts",
        async validate(input) {
          if (path.isAbsolute(input)) {
            return "Migrate file path should be relative to the current dir";
          }

          // We assume is a valid file if have an extension
          const extension = path.extname(input);
          return extension.length > 0 ? true : "Expected a valid file, eg: migrate.ts";
        },
      },
      {
        name: "databaseDir",
        message: "Database and Schema directory",
        validate(input) {
          return path.isAbsolute(input)
            ? "Database and schema path should be relative to the current dir"
            : true;
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
      },
    ]);

    await initCommand(args);
  });

async function guestProjectLanguage(): Promise<Language | null> {
  const files = await fse.readdir(process.cwd());
  const isTypescriptProject = files.some((fileName) =>
    path.basename(fileName).startsWith("tsconfig.")
  );

  if (isTypescriptProject) {
    return "typescript";
  }

  const isJavascriptProject = files.some((fileName) =>
    path.basename(fileName).startsWith("jsconfig.")
  );
  if (isJavascriptProject) {
    return "javascript";
  }

  return null;
}

command.parseAsync().catch((error) => {
  console.error(chalk.red("Failed to initialize drizzle"), error);
  process.exit(1);
});
