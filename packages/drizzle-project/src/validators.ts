import path from "path";
import {
  type Language,
  type DbProvider,
  type Driver,
  DRIVERS,
  MYSQL_DB_PROVIDERS,
  POSTGRESTQL_DB_PROVIDERS,
  SQLITE_PROVIDERS,
} from "./types";

export type ValidatorResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

export function validateDriver(input: string): ValidatorResult<Driver> {
  if (!DRIVERS.includes(input as Driver)) {
    return {
      success: false,
      error: `Unknown driver ${input}, expected one of: ${DRIVERS.join(", ")}`,
    };
  }

  return { success: true, data: input as Driver };
}

export function validateProvider(input: string): ValidatorResult<DbProvider> {
  const providers = [...MYSQL_DB_PROVIDERS, ...POSTGRESTQL_DB_PROVIDERS, ...SQLITE_PROVIDERS];

  if (!providers.includes(input as DbProvider)) {
    return {
      success: false,
      error: `Unknown provider ${input}, expected one of: ${providers.join(", ")}`,
    };
  }

  return { success: true, data: input as DbProvider };
}

export function validateConfigType(input: string): ValidatorResult<Language> {
  if (input === "javascript" || input === "typescript") {
    return { success: true, data: input };
  }

  return { success: false, error: "Invalid config type, expected 'javascript' or 'typescript'" };
}

export function validateMigrationFile(input: string): ValidatorResult<string> {
  if (path.isAbsolute(input)) {
    return { success: false, error: "Migrate file path should be relative to the current dir" };
  }

  // We assume is a valid file if have an extension
  const extension = path.extname(input);
  if (extension.length > 0) {
    return { success: true, data: input };
  }

  return { success: false, error: "Expected a valid file, eg: migrate.ts" };
}

export function validateDatabaseDir(input: string): ValidatorResult<string> {
  return path.isAbsolute(input)
    ? { success: false, error: "Database and schema path should be relative to the current dir" }
    : { success: true, data: input };
}

export function validateOutputDir(input: string): ValidatorResult<string> {
  return path.isAbsolute(input)
    ? { success: false, error: "Output directory path should be relative to the current dir" }
    : { success: true, data: input };
}
