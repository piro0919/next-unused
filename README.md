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
    "check:unused": "next-unused --error-on-unused-files"
  }
}
```

`--error-on-unused-files` exits with code 1 when any are found (useful in CI).

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
import { findUnusedFiles, loadConfig } from "@piro0919/next-unused";

const config = await loadConfig();
const unused = await findUnusedFiles({ config });
```

## License

MIT
