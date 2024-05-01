#!/usr/bin/env node
import fs from "fs";
import path from "path";
import madge, { MadgeModuleDependencyGraph } from "madge";
import recursive from "recursive-readdir";
import type { TSConfigJSON } from "types-tsconfig";

export type Config = {
  includeExtensions?: string[];
  router?: "app" | "pages";
  srcDir?: boolean;
};

async function main(): Promise<void> {
  const configPath = path.resolve(process.cwd(), "next-unused.config.js");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const {
    includeExtensions = [".ts", ".tsx"],
    router = "app",
    srcDir = true,
  }: Config = fs.existsSync(configPath) ? require(configPath) : {};
  const madgePath = path.resolve(process.cwd(), srcDir ? "src" : "", router);
  const tsConfigPath = path.resolve(process.cwd(), "tsconfig.json");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
  const tsConfig: TSConfigJSON = require(tsConfigPath);
  const res = await madge(madgePath, {
    baseDir: ".",
    fileExtensions: ["ts", "tsx"],
    tsConfig: {
      ...tsConfig,
      compilerOptions: {
        // baseUrl is required in madge
        baseUrl: ".",
        ...tsConfig.compilerOptions,
      },
    },
  });
  const dependency = res.obj();
  const files = await recursive(
    path.resolve(process.cwd(), srcDir ? "src" : ""),
  );
  const entryPoint = Object.keys(dependency).reduce<typeof dependency>(
    (previousValue, currentValue) =>
      currentValue.startsWith([srcDir ? "src" : "", router].join("/"))
        ? {
            ...previousValue,
            [currentValue]: dependency[currentValue],
          }
        : previousValue,
    {},
  );
  const dependencyFiles: string[] = [];

  Object.keys(entryPoint).forEach((entryFile) => {
    dependencyFiles.push(entryFile);

    entryPoint[entryFile].forEach((dependencyFile) => {
      pushDependencyFiles({ dependency, dependencyFile, dependencyFiles });
    });
  });

  const uniqueDependencyFiles = Array.from(new Set(dependencyFiles));
  const notDependencyFiles = files
    .filter(
      (file) =>
        !uniqueDependencyFiles.some((dependencyFile) =>
          file.endsWith(dependencyFile),
        ),
    )
    .filter((notDependencyFile) =>
      includeExtensions.some((includeExtension) =>
        notDependencyFile.endsWith(includeExtension),
      ),
    )
    .map((notDependencyFile) => notDependencyFile.replace(process.cwd(), ""));

  if (notDependencyFiles.length === 0) {
    console.log("No unused files!");

    return;
  }

  console.log(
    `Found ${notDependencyFiles.length} unused ${
      notDependencyFiles.length === 1 ? "file" : "files"
    }:`,
  );

  notDependencyFiles.forEach((notDependencyFile) =>
    console.log(notDependencyFile),
  );
}

type PushDependencyFilesParam = {
  dependency: MadgeModuleDependencyGraph;
  dependencyFile: string;
  dependencyFiles: string[];
};

function pushDependencyFiles({
  dependency,
  dependencyFile,
  dependencyFiles,
}: PushDependencyFilesParam): void {
  dependencyFiles.push(dependencyFile);

  dependency[dependencyFile].forEach((dependencyFile) => {
    pushDependencyFiles({
      dependency,
      dependencyFile,
      dependencyFiles,
    });
  });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
