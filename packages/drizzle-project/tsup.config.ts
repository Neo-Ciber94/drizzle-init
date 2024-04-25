import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src", "!src/**/*.test.*", "!src/templates"],
  clean: true,
  splitting: false,
  format: ["esm"],
});
