import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findUnusedExports } from "../src";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/app-router-project",
);

describe("findUnusedExports", () => {
  it("finds an export inside a file the router does import", async () => {
    const unused = await findUnusedExports({ cwd: fixtureDir });
    expect(unused).toContainEqual({ file: "src/lib/format.ts", name: "formatMoney" });
  });

  it("does not report an export another file calls", async () => {
    const unused = await findUnusedExports({ cwd: fixtureDir });
    expect(unused).not.toContainEqual({ file: "src/lib/format.ts", name: "formatDate" });
  });

  it("leaves the exports the framework calls alone", async () => {
    const unused = await findUnusedExports({ cwd: fixtureDir });
    expect(unused.some(({ name }) => name === "middleware" || name === "default")).toBe(false);
  });

  it("respects excludeFiles", async () => {
    const unused = await findUnusedExports({
      cwd: fixtureDir,
      config: { excludeFiles: ["middleware.ts", "format.ts"] },
    });
    expect(unused.some(({ file }) => file.includes("format.ts"))).toBe(false);
  });
});
