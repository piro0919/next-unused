import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import magicNumbers from "@piro0919/eslint-config";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  // 名前の無い数字を警告する（全リポジトリで共有する piro0919/eslint-config）
  ...magicNumbers({ files: ["src/**/*.ts", "tests/**/*.ts"] }),
  {
    ignores: [".next/**", "coverage/**", "dist/**", "node_modules/**", "tests/fixtures/**"],
  },
];
