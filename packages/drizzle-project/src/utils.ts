import fse from "fs-extra";
import path from "path";
import { type Language } from "./types";
import spawn from "cross-spawn";

let DECTECTED_PACKAGE_MANAGER: PackageManager | undefined | null = undefined;

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export async function detectPackageManager(): Promise<PackageManager | null> {
  if (DECTECTED_PACKAGE_MANAGER !== undefined) {
    return DECTECTED_PACKAGE_MANAGER;
  }

  DECTECTED_PACKAGE_MANAGER = await Promise.all([
    fse.exists(path.resolve(process.cwd(), "yarn.lock")),
    fse.exists(path.resolve(process.cwd(), "package-lock.json")),
    fse.exists(path.resolve(process.cwd(), "pnpm-lock.yaml")),
    fse.exists(path.resolve(process.cwd(), "bun.lockb")),
  ]).then(([isYarn, isNpm, isPnpm, isBun]) => {
    if (isYarn) {
      return "yarn";
    } else if (isPnpm) {
      return "pnpm";
    } else if (isBun) {
      return "bun";
    } else if (isNpm) {
      return "npm";
    }

    return null;
  });

  return DECTECTED_PACKAGE_MANAGER ?? null;
}

export async function detectProjectLanguage(): Promise<Language | null> {
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

export async function installDeps({ isDev, deps }: { isDev: boolean; deps: string[] }) {
  const packageManager = (await detectPackageManager()) ?? "npm";
  const args: string[] = ["add"];

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

export async function replaceDoubleQuoteStrings(
  replacements: Record<string, string>,
  filePaths: string[]
) {
  const promises = filePaths.map(async (filePath) => {
    if (!(await fse.exists(filePath))) {
      throw new Error(`File "${filePath}" does not exist`);
    }

    try {
      let contents = await fse.readFile(filePath, "utf-8");
      for (const [replace, newValue] of Object.entries(replacements)) {
        const regex = new RegExp(`(["'])(.*)${replace}(.*)\\1`);
        contents = contents.replace(regex, (_, ...matches) => {
          const quote = matches[0];
          const start = matches[1];
          const end = matches[2];
          return `${quote}${start}${newValue}${end}${quote}`;
        });
      }

      await fse.writeFile(filePath, contents);
    } catch (err) {
      throw new Error(`Failed to replace contents of file "${filePath}"`);
    }
  });

  const results = await Promise.allSettled(promises);
  const errors = new Set<string>();

  for (const result of results) {
    if (result.status === "rejected") {
      const error =
        result.reason instanceof Error ? result.reason.message : "Failed to replace contents";
      errors.add(error);
    }
  }

  if (errors.size > 0) {
    throw new Error(`${Array.from(errors).join("\n")}`);
  }
}

export function objectKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
