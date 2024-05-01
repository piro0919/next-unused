# next-unused

next-unused is an easy way to find unused files in your [Next.js](https://github.com/vercel/next.js) project.

## Installation

```cli
npm install @piro0919/next-unused --save-dev
```

## Usage

```json
"scripts": {
  "find:unused": "next-unused"
}
```

## Configuration

### `next-unused.config.js`

```js
module.exports = {
  includeExtensions: [".ts", ".tsx"],
  router: "app",
  srcDir: true,
};
```

| property          | description             | type           | default           |
| ----------------- | ----------------------- | -------------- | ----------------- |
| includeExtensions | File extension to check | string[]       | `[".ts", ".tsx"]` |
| router            | Router used             | `app`, `pages` | `app`             |
| srcDir            | Use src folder          | boolean        | `true`            |

## Credits

- [next-unused](https://www.npmjs.com/package/next-unused)
