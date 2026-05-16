# CLAUDE.md

## Project Overview

**@piro0919/next-unused** is a CLI to find unused files in a Next.js project. v1.0.0 is a modernization of the original 0.x — same idea, native Node APIs instead of legacy deps, ESM, parseArgs-based CLI.

- **npm package:** @piro0919/next-unused
- **GitHub:** <https://github.com/piro0919/next-unused>

## Tech Stack

- Node.js 20+ (uses `fs/promises` recursive readdir, `util.parseArgs`)
- TypeScript 5
- tsup — dual entry build (library + CLI)
- Vitest — tests against an in-repo Next.js fixture
- ESLint flat config + Prettier
- Lefthook + Renovate
- madge (sole runtime dep) — produces the dependency graph

## Project Structure

```text
src/
├── index.ts                              # programmatic API: findUnusedFiles, loadConfig
└── cli.ts                                # bin entry with shebang

tests/
├── findUnusedFiles.test.ts
└── fixtures/app-router-project/          # tiny Next.js-shaped fixture
```

## API

```ts
import { findUnusedFiles, loadConfig } from "@piro0919/next-unused";

const unused = await findUnusedFiles({
  cwd: process.cwd(),
  config: { router: "app", srcDir: true },
});
```

## CLI

```bash
next-unused                            # prints unused files
next-unused --error-on-unused-files    # exits 1 when any are found
next-unused --help
```

Config file (project root, picked up in this order): `next-unused.config.mjs` → `.js` → `.json`.

```js
// next-unused.config.mjs
export default {
  excludeExtensions: [],
  excludeFiles: ["middleware.ts"],
  includeExtensions: [".ts", ".tsx"],
  router: "app", // or "pages" or "both"
  srcDir: true,
};
```

## Publishing Notes

- `files: ["dist", "README.md", "LICENSE"]`. `bin` points at `dist/cli.js` (built with `#!/usr/bin/env node` banner by tsup).
- Single runtime dep is `madge`. `arr-diff` and `recursive-readdir` were removed in favor of native APIs.
- v1.0.0 is a breaking change in implementation but not in CLI usage: the CLI flags, defaults, and config format are preserved. Programmatic API is new.
