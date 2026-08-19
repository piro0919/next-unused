import { parseArgs } from "node:util";
import { findUnusedFiles, loadConfig } from "./index.js";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "error-on-unused-files": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`next-unused — find unused files in your Next.js project.

Usage:
  next-unused [options]

Options:
  --error-on-unused-files   Exit with code 1 when unused files are found.
  -h, --help                Show this help text.

Configuration: next-unused.config.{js,mjs,json} in the project root.`);
    return;
  }

  const config = await loadConfig();
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
