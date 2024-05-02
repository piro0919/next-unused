# next-unused

next-unused is an easy way to find unused files in your [Next.js](https://github.com/vercel/next.js) project.

## Installation

```cli
npm install @piro0919/next-unused --save-dev
```

## Usage

```json
"scripts": {
  "find:unused": "next-unused",
  "check:unused": "next-unused --error-on-unused-files",
}
```

## Configuration

### `next-unused.config.js`

```js
module.exports = {
  excludeExtensions: [],
  excludeFiles = ["middleware.ts"],
  includeExtensions: [".ts", ".tsx"],
  router: "app",
  srcDir: true,
};
```

| property          | description                 | type                         | default             |
| ----------------- | --------------------------- | ---------------------------- | ------------------- |
| excludeExtensions | File extensions not checked | string[]                     | `[]`                |
| excludeFiles      | Files not checked           | string[]                     | `["middleware.ts"]` |
| includeExtensions | File extension to check     | string[]                     | `[".ts", ".tsx"]`   |
| router            | Router used                 | `"app"`, `"pages"`, `"both"` | `"app"`             |
| srcDir            | Use src folder              | boolean                      | `true`              |

## Credits

- [next-unused](https://www.npmjs.com/package/next-unused)
