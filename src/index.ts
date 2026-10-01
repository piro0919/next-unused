import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import madge from "madge";

export type Router = "app" | "pages" | "both";

export type Config = {
  /** File extensions to exclude when collecting candidates. */
  excludeExtensions?: string[];
  /**
   * Files to leave out of the report. A pattern without a `/` matches a file
   * name exactly (`"legacy.tsx"`). A pattern with a `/` is a glob matched
   * against the path relative to the project root, as the report prints it
   * (`"src/components/legacy/**"`). `*` stays within one segment, `**` spans
   * any number, `?` is one character.
   */
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
  excludeFiles: [],
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
  const mod = await import(pathToFileURL(file).href);
  return mod.default ?? mod;
}

/**
 * Directories that never hold project source. With `srcDir: false` the walk
 * starts at the project root, where these sit next to `app/`.
 */
const IGNORED_DIRS = new Set([".git", ".next", "build", "coverage", "dist", "node_modules", "out"]);

/**
 * Walks `root` by hand rather than with `readdir({ recursive: true })`, so the
 * ignored directories are never entered and no Node 20.12+ `parentPath` is needed.
 */
async function listFiles(root: string): Promise<string[]> {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) await walk(full);
      } else if (entry.isFile() && !entry.name.endsWith(".d.ts")) {
        files.push(full);
      }
    }
  };
  await walk(root);
  return files;
}

/**
 * Files Next.js loads by name from the project root (or `src/`), beside the
 * routers. They are entries of the dependency graph, like `app/` itself.
 */
const ENTRY_FILES = [
  "middleware",
  "proxy",
  "instrumentation",
  "instrumentation-client",
  "mdx-components",
];
const ENTRY_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function entryFiles(baseDir: string): string[] {
  return ENTRY_FILES.flatMap((name) =>
    ENTRY_EXTENSIONS.map((ext) => path.join(baseDir, name + ext)),
  ).filter((file) => existsSync(file));
}

function globToRegExp(glob: string): RegExp {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i] as string;
    if (char === "*" && glob[i + 1] === "*") {
      // `**/` may also match nothing, so `src/**/x.ts` covers `src/x.ts`.
      if (glob[i + 2] === "/") {
        source += "(?:.*/)?";
        i += 2;
      } else {
        source += ".*";
        i += 1;
      }
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

function excluder(cwd: string, patterns: string[]): (file: string) => boolean {
  const matchers = patterns.map((pattern) => {
    if (!pattern.includes("/")) return (rel: string) => path.posix.basename(rel) === pattern;
    const re = globToRegExp(pattern.replace(/^\.\//, ""));
    return (rel: string) => re.test(rel);
  });
  return (file) => {
    const rel = path.relative(cwd, file).split(path.sep).join("/");
    return matchers.some((match) => match(rel));
  };
}

export async function findUnusedFiles(options: FindOptions = {}): Promise<string[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = { ...DEFAULTS, ...options.config };

  const routers: ("app" | "pages")[] =
    config.router === "both" ? ["app", "pages"] : [config.router];
  const baseDir = config.srcDir ? path.resolve(cwd, "src") : cwd;
  const madgePaths = [...routers.map((r) => path.resolve(baseDir, r)), ...entryFiles(baseDir)];

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
  const isExcluded = excluder(cwd, config.excludeFiles);

  const unused = allFiles.filter((file) => {
    if (referenced.has(file)) return false;
    if (config.excludeExtensions.some((ext) => file.endsWith(ext))) return false;
    if (isExcluded(file)) return false;
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

export type UnusedExport = {
  /** File the export is declared in, relative to `cwd`. */
  file: string;
  /** Exported name. */
  name: string;
};

/**
 * Exports the framework calls for you. Nothing in the project references
 * these by name, and that is how the router is meant to work.
 *
 * `alt`, `size` and `contentType` belong to the metadata image routes
 * (`opengraph-image.tsx`, `icon.tsx`), which is easy to forget: they sit in an
 * ordinary-looking component file next to the default export.
 *
 * `proxy` is what Next 16 renamed `middleware` to; `register` and
 * `onRequestError` belong to `instrumentation.ts`, `onRouterTransitionStart`
 * to `instrumentation-client.ts`, and `useMDXComponents` to `mdx-components.tsx`.
 */
const FRAMEWORK_EXPORTS =
  /^(default|middleware|proxy|register|onRequestError|onRouterTransitionStart|useMDXComponents|config|metadata|viewport|revalidate|dynamic|dynamicParams|fetchCache|runtime|preferredRegion|maxDuration|experimental_ppr|alt|size|contentType|generateMetadata|generateViewport|generateStaticParams|generateImageMetadata|generateSitemaps|GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/;

/** `export function foo`, `export const foo`, `export class Foo`. */
const EXPORT_DECLARATION = /^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+(\w+)/gm;

const TEST_FILE = /\.(?:test|spec)\.tsx?$/;

/**
 * Finds exports that no other file mentions by name.
 *
 * This is the export-level companion to `findUnusedFiles`: a file can be
 * imported by the router and still carry an export nobody calls, and the
 * dependency graph cannot see inside a file.
 *
 * Two deliberate choices:
 *
 * - A mention inside a test counts as a use. Exports that exist so a test can
 *   reach them are real, so zero findings is not the goal — the list is meant
 *   to be read, not enforced.
 * - Matching is by name across the other files, not by resolving imports. A
 *   name reached only through `import * as ns` is therefore reported, and a
 *   name that collides with an unrelated identifier elsewhere is not.
 */
export async function findUnusedExports(options: FindOptions = {}): Promise<UnusedExport[]> {
  const cwd = options.cwd ?? process.cwd();
  const config = { ...DEFAULTS, ...options.config };
  const baseDir = config.srcDir ? path.resolve(cwd, "src") : cwd;

  const isExcluded = excluder(cwd, config.excludeFiles);
  const candidates = (await listFiles(baseDir)).filter((file) => {
    if (config.excludeExtensions.some((ext) => file.endsWith(ext))) return false;
    if (isExcluded(file)) return false;
    return config.includeExtensions.some((ext) => file.endsWith(ext));
  });

  const { readFile } = await import("node:fs/promises");
  const sources = new Map<string, string>(
    await Promise.all(
      candidates.map(async (file) => [file, await readFile(file, "utf8")] as const),
    ),
  );

  const found: UnusedExport[] = [];
  for (const [file, text] of sources) {
    if (TEST_FILE.test(file)) continue;

    for (const match of text.matchAll(EXPORT_DECLARATION)) {
      const name = match[1];
      if (!name || FRAMEWORK_EXPORTS.test(name)) continue;

      const mentioned = new RegExp(`\\b${name}\\b`);
      const used = [...sources].some(([other, body]) => other !== file && mentioned.test(body));
      if (!used) found.push({ file: path.relative(cwd, file), name });
    }
  }

  return found.sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name));
}
