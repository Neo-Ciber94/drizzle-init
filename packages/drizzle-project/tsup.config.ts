import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts", "!src/**/*.test.*", "!src/templates"],
  clean: true,
  bundle: true,
  minify: true,
  format: ["esm"],
  define: {
    "process.env.NODE_ENV": "'production'",
  },
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url)`,
  },
});
