import { parseArgs } from "node:util";
import { findUnusedExports, findUnusedFiles, loadConfig } from "./index.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "error-on-unused-files": { type: "boolean", default: false },
      exports: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`next-unused — find unused files in your Next.js project.

Usage:
  next-unused [options]

Options:
  --exports                 Report exports no other file mentions, instead of
                            whole files. A file the router imports can still
                            carry an export nobody calls.
  --error-on-unused-files   Exit with code 1 when anything is found.
  -h, --help                Show this help text.

Configuration: next-unused.config.{js,mjs,json} in the project root.`);
    return;
  }

  const config = await loadConfig();

  if (values.exports) {
    const unused = await findUnusedExports({ config });

    if (unused.length === 0) {
      console.log("No unused exports!");
      return;
    }

    const label = unused.length === 1 ? "export" : "exports";
    const header = `Found ${unused.length} unused ${label}:`;
    const lines = unused.map(({ file, name }) => `${file}  ${name}`);

    if (values["error-on-unused-files"]) {
      console.error(header);
      for (const line of lines) console.error(line);
      process.exit(1);
    }

    console.log(header);
    for (const line of lines) console.log(line);
    return;
  }

  const unused = await findUnusedFiles({ config });

  if (unused.length === 0) {
    console.log("No unused files!");
    return;
  }

  const label = unused.length === 1 ? "file" : "files";
  const header = `Found ${unused.length} unused ${label}:`;

  if (values["error-on-unused-files"]) {
    console.error(header);
    for (const f of unused) console.error(f);
    process.exit(1);
  }

  console.log(header);
  for (const f of unused) console.log(f);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
