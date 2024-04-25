import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src", "!src/**/*.test.*", "!src/templates"],
  sourcemap: true,
  clean: true,
  dts: true,
  format: ["esm"],
});
