import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import madge from "madge";

export type Router = "app" | "pages" | "both";

export type Config = {
  /** File extensions to exclude when collecting candidates. */
  excludeExtensions?: string[];
  /** File path fragments to exclude when collecting candidates. */
  excludeFiles?: string[];
  /** File extensions to include when collecting candidates. */
  includeExtensions?: string[];
  /** Which Next.js router(s) to scan as the dependency entry. */
  router?: Router;
  /** Whether the Next.js project uses `src/`. */
  srcDir?: boolean;
};

const DEFAULTS: Required<Config> = {
  excludeExtensions: [],
  excludeFiles: ["middleware.ts"],
  includeExtensions: [".ts", ".tsx"],
  router: "app",
  srcDir: true,
};

export type FindOptions = {
  cwd?: string;
  config?: Config;
  /** Path to tsconfig.json (relative to cwd). Defaults to tsconfig.json. */
  tsconfigPath?: string;
};

async function loadJsonConfig(file: string): Promise<unknown> {
  if (!existsSync(file)) return {};
  if (file.endsWith(".json")) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(file, "utf8"));
  }
  const mod = await import(file);
  return mod.default ?? mod;
}

async function listFiles(root: string): Promise<string[]> {
  if (!existsSync(root)) return [];
  const entries = await readdir(root, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? root, e.name));
}

export async function findUnusedFiles(options: FindOptions = {}): Promise<string[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = { ...DEFAULTS, ...options.config };

  const routers: ("app" | "pages")[] =
    config.router === "both" ? ["app", "pages"] : [config.router];
  const baseDir = config.srcDir ? path.resolve(cwd, "src") : cwd;
  const madgePaths = routers.map((r) => path.resolve(baseDir, r));

  const tsconfigPath = path.resolve(cwd, options.tsconfigPath ?? "tsconfig.json");
  const tsConfig = (await loadJsonConfig(tsconfigPath)) as {
    compilerOptions?: Record<string, unknown>;
  };

  const res = await madge(madgePaths, {
    baseDir: cwd,
    fileExtensions: ["ts", "tsx"],
    tsConfig: {
      ...tsConfig,
      compilerOptions: {
        ...tsConfig.compilerOptions,
        baseUrl: cwd,
        moduleResolution: "node",
      },
    },
  });

  const dependency = res.obj();
  const referenced = new Set<string>();
  for (const file of Object.keys(dependency)) {
    referenced.add(path.resolve(cwd, file));
    for (const dep of dependency[file] ?? []) {
      referenced.add(path.resolve(cwd, dep));
    }
  }

  const allFiles = await listFiles(baseDir);

  const unused = allFiles.filter((file) => {
    if (referenced.has(file)) return false;
    if (config.excludeExtensions.some((ext) => file.endsWith(ext))) return false;
    if (config.excludeFiles.some((frag) => file.includes(frag))) return false;
    if (!config.includeExtensions.some((ext) => file.endsWith(ext))) return false;
    return true;
  });

  return unused.map((f) => path.relative(cwd, f)).sort();
}

export async function loadConfig(cwd: string = process.cwd()): Promise<Config> {
  const jsPath = path.resolve(cwd, "next-unused.config.js");
  const mjsPath = path.resolve(cwd, "next-unused.config.mjs");
  const jsonPath = path.resolve(cwd, "next-unused.config.json");

  for (const file of [mjsPath, jsPath, jsonPath]) {
    if (existsSync(file)) {
      return (await loadJsonConfig(file)) as Config;
    }
  }
  return {};
}
