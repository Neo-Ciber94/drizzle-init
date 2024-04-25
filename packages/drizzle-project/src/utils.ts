import fse from "fs-extra";
import path from "path";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export async function detectPackageManager(): Promise<PackageManager | null> {
  return Promise.all([
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
}
