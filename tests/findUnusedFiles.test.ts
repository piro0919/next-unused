import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findUnusedFiles } from "../src";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/app-router-project",
);

describe("findUnusedFiles", () => {
  it("detects an unused component", async () => {
    const unused = await findUnusedFiles({ cwd: fixtureDir });
    expect(unused).toEqual(["src/components/Unused.tsx"]);
  });

  it("respects excludeFiles", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { excludeFiles: ["middleware.ts", "Unused"] },
    });
    expect(unused).toEqual([]);
  });

  it("respects excludeExtensions", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { excludeExtensions: [".tsx"] },
    });
    expect(unused).toEqual([]);
  });

  it("respects includeExtensions narrowing", async () => {
    const unused = await findUnusedFiles({
      cwd: fixtureDir,
      config: { includeExtensions: [".ts"] },
    });
    expect(unused).toEqual([]);
  });
});
