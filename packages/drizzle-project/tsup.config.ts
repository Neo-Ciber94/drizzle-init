import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "!src/**/*.test.*", "!src/templates"],
  clean: true,
  bundle: true,
  minify: true,
  format: ["esm"],
});
