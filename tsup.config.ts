import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    tsconfig: "tsconfig.build.json",
  },
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    sourcemap: true,
    clean: false,
    banner: { js: "#!/usr/bin/env node" },
    tsconfig: "tsconfig.build.json",
  },
]);
