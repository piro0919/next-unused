# Changelog

## Unreleased

- **BREAKING:** `excludeFiles` no longer matches substrings. A pattern without
  `/` matches a file name exactly; a pattern with `/` is a glob on the path
  relative to the project root (`*`, `**`, `?`). `"middleware.ts"` used to hide
  `auth-middleware.ts` as well.
- **BREAKING:** the default `excludeFiles` is now `[]` instead of
  `["middleware.ts"]`. `middleware`, `proxy`, `instrumentation`,
  `instrumentation-client` and `mdx-components` are treated as entry points
  instead, so the files they import count as used too.
- `findUnusedExports` leaves `proxy`, `register`, `onRequestError`,
  `onRouterTransitionStart` and `useMDXComponents` alone.
- With `srcDir: false`, `node_modules`, `.next`, `.git`, `dist`, `build`, `out`
  and `coverage` are no longer walked, and `.d.ts` files are no longer reported.
- The file walk no longer relies on `Dirent.parentPath`, which needs Node 20.12+;
  `engines` stays `>=20`.
- Config files are imported by file URL, so `next-unused.config.mjs` loads on
  Windows.
- `exports` exposes `./package.json`. CI runs publint and attw
  (`pnpm check:package`), the full job on Node 22 and 24, and a smoke run of the
  packed tarball on Node 20.
