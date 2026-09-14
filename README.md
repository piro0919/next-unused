# @piro0919/next-unused

> CLI to find unused files in your Next.js project.

[![npm](https://img.shields.io/npm/v/@piro0919/next-unused.svg)](https://www.npmjs.com/package/@piro0919/next-unused)
[![license](https://img.shields.io/npm/l/@piro0919/next-unused.svg)](./LICENSE)

Walks your Next.js dependency graph from the router root (`app/`, `pages/`, or both) using [`madge`](https://github.com/pahen/madge) and reports `.ts` / `.tsx` files that no one imports.

## Install

```bash
npm install --save-dev @piro0919/next-unused
```

Requires Node 20+.

## Usage

```json
{
  "scripts": {
    "find:unused": "next-unused",
    "find:unused:exports": "next-unused --exports",
    "check:unused": "next-unused --error-on-unused-files"
  }
}
```

`--error-on-unused-files` exits with code 1 when any are found (useful in CI).

### Unused exports

`--exports` reports exported names no other file mentions, instead of whole files.

```bash
$ next-unused --exports
Found 2 unused exports:
src/components/day-marks.tsx  NO_MARKS
src/lib/stripe.ts  TRIAL_DAYS
```

The two views do not overlap. A file the router imports never shows up as an
unused file, and it can still carry an export nobody calls — the dependency
graph cannot see inside a file.

Read the list rather than enforcing it. Two things are worth knowing:

- **A mention inside a test counts as a use.** Exports that exist so a test can
  reach them are real, so zero findings is not the goal.
- **Matching is by name, not by resolved imports.** A name reached only through
  `import * as ns` is reported, and a name that collides with an unrelated
  identifier elsewhere is not.

Exports the framework calls for you — `default`, `metadata`, `generateStaticParams`,
the route handlers, the metadata image `alt` / `size` / `contentType`, and the rest
of the route segment config — are left alone.

## Configuration

Drop a config file in your project root. Picked up in this order: `next-unused.config.mjs` → `.js` → `.json`.

```js
// next-unused.config.mjs
export default {
  excludeExtensions: [],
  excludeFiles: ["middleware.ts"],
  includeExtensions: [".ts", ".tsx"],
  router: "app", // "app" | "pages" | "both"
  srcDir: true,
};
```

| Option              | Type                         | Default             | Description                             |
| ------------------- | ---------------------------- | ------------------- | --------------------------------------- |
| `excludeExtensions` | `string[]`                   | `[]`                | Skip files ending with any of these.    |
| `excludeFiles`      | `string[]`                   | `["middleware.ts"]` | Skip files whose path contains any.     |
| `includeExtensions` | `string[]`                   | `[".ts", ".tsx"]`   | Only consider files with these endings. |
| `router`            | `"app" \| "pages" \| "both"` | `"app"`             | Which router to scan as the graph root. |
| `srcDir`            | `boolean`                    | `true`              | Whether your project uses `src/`.       |

## Programmatic API

```ts
import { findUnusedExports, findUnusedFiles, loadConfig } from "@piro0919/next-unused";

const config = await loadConfig();

const files = await findUnusedFiles({ config });
// ["src/components/Unused.tsx"]

const exports = await findUnusedExports({ config });
// [{ file: "src/lib/format.ts", name: "formatMoney" }]
```

## License

MIT
