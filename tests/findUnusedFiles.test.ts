import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findUnusedFiles, loadConfig } from "../src";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/app-router-project",
);

describe("findUnusedFiles", () => {
  it("detects an unused component", async () => {
    const unused = await findUnusedFiles({ cwd: fixtureDir });
    expect(unused).toEqual(["src/components/Unused.tsx", "src/lib/auth-middleware.ts"]);
  });

  it("treats middleware and instrumentation as entries, with what they import", async () => {
    const unused = await findUnusedFiles({ cwd: fixtureDir });
    for (const file of [
      "src/middleware.ts",
      "src/instrumentation.ts",
      "src/lib/paths.ts",
      "src/lib/tracing.ts",
    ]) {
      expect(unused).not.toContain(file);
    }
  });

  it("matches a bare excludeFiles entry against the whole file name", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { excludeFiles: ["Unused.tsx", "middleware.ts"] },
    });
    // "middleware.ts" no longer hides auth-middleware.ts by substring.
    expect(unused).toEqual(["src/lib/auth-middleware.ts"]);
  });

  it("matches an excludeFiles entry with a slash as a glob on the relative path", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { excludeFiles: ["src/components/*", "src/**/auth-*.ts"] },
    });
    expect(unused).toEqual([]);
  });

  it("respects excludeExtensions", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { excludeExtensions: [".tsx"] },
    });
    expect(unused).toEqual(["src/lib/auth-middleware.ts"]);
  });

  it("respects includeExtensions narrowing", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { includeExtensions: [".ts"] },
    });
    expect(unused).toEqual(["src/lib/auth-middleware.ts"]);
  });
});

describe("findUnusedFiles with srcDir: false", () => {
  let cwd: string;

  beforeAll(async () => {
    // Built at run time: node_modules/ and *.d.ts are gitignored, so a checked-in
    // fixture could not carry the very files this test is about.
    cwd = await mkdtemp(path.join(tmpdir(), "next-unused-"));
    const files: Record<string, string> = {
      "tsconfig.json": JSON.stringify({ compilerOptions: { jsx: "preserve" } }),
      "next-env.d.ts": '/// <reference types="next" />\n',
      "app/page.tsx":
        'import { Used } from "../components/Used";\nexport default function Page() { return <Used />; }\n',
      "components/Used.tsx": "export function Used() { return null; }\n",
      "components/Unused.tsx": "export function Unused() { return null; }\n",
      "proxy.ts":
        'import { allow } from "./lib/allow";\nexport function proxy() { return allow(); }\n',
      "lib/allow.ts": "export function allow() { return true; }\n",
      "types/global.d.ts": "declare const VERSION: string;\n",
      "node_modules/some-pkg/index.ts": "export const x = 1;\n",
      ".next/types/app/page.ts": "export const y = 1;\n",
      "dist/index.ts": "export const z = 1;\n",
    };
    for (const [file, body] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
      await writeFile(path.join(cwd, file), body);
    }
  });

  afterAll(async () => {
    await rm(cwd, { force: true, recursive: true });
  });

  it("reports only project source, not node_modules, build output or .d.ts", async () => {
    const unused = await findUnusedFiles({ cwd, config: { srcDir: false } });
    expect(unused).toEqual([path.join("components", "Unused.tsx")]);
  });

  it("loads a config file by URL", async () => {
    await writeFile(
      path.join(cwd, "next-unused.config.mjs"),
      "export default { srcDir: false };\n",
    );
    expect(await loadConfig(cwd)).toEqual({ srcDir: false });
    await rm(path.join(cwd, "next-unused.config.mjs"));
  });
});
