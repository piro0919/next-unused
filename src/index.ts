#!/usr/bin/env node
import fs from "fs";
import path from "path";
import diff from "arr-diff";
import madge from "madge";
import recursive from "recursive-readdir";
import type { TSConfigJSON } from "types-tsconfig";

export type Config = {
  excludeExtensions?: string[];
  excludeFiles?: string[];
  includeExtensions?: string[];
  router?: "app" | "both" | "pages";
  srcDir?: boolean;
};

async function main(): Promise<void> {
  const currentWorkingDirectory = process.cwd();
  const configPath = path.resolve(
    currentWorkingDirectory,
    "next-unused.config.js",
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const {
    excludeExtensions = [],
    excludeFiles = ["middleware.ts"],
    includeExtensions = [".ts", ".tsx"],
    router = "app",
    srcDir = true,
  }: Config = fs.existsSync(configPath) ? require(configPath) : {};
  const madgePaths = (router === "both" ? ["app", "pages"] : [router]).map(
    (r) => path.resolve(currentWorkingDirectory, srcDir ? "src" : "", r),
  );
  const tsConfigPath = path.resolve(currentWorkingDirectory, "tsconfig.json");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
  const tsConfig: TSConfigJSON = require(tsConfigPath);
  const res = await madge(madgePaths, {
    baseDir: ".",
    fileExtensions: ["ts", "tsx"],
    tsConfig: {
      ...tsConfig,
      compilerOptions: {
        ...tsConfig.compilerOptions,
        // baseUrl is required in madge
        baseUrl: ".",
        // WARNING: path is not resolved when setting "bundler"
        moduleResolution: "node",
      },
    },
  });
  const dependency = res.obj();
  const dependencyFiles = Array.from(
    new Set(
      Object.keys(dependency).flatMap((file) => [file, ...dependency[file]]),
    ),
  ).map((dependency) => path.resolve(currentWorkingDirectory, dependency));
  const files = await recursive(
    path.resolve(currentWorkingDirectory, srcDir ? "src" : ""),
  );
  const notDependencyFiles = diff(files, dependencyFiles)
    .filter(
      (file) =>
        !excludeExtensions.some((excludeExtension) =>
          file.endsWith(excludeExtension),
        ) &&
        !excludeFiles.some((excludeFile) => file.includes(excludeFile)) &&
        includeExtensions.some((includeExtension) =>
          file.endsWith(includeExtension),
        ),
    )
    .map((notDependencyFile) =>
      notDependencyFile.replace(currentWorkingDirectory, ""),
    );

  if (notDependencyFiles.length === 0) {
    console.log("No unused files!");

    return;
  }

  console.log(
    `Found ${notDependencyFiles.length} unused ${
      notDependencyFiles.length === 1 ? "file" : "files"
    }:`,
  );

  notDependencyFiles
    .sort()
    .forEach((notDependencyFile) => console.log(notDependencyFile));
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
