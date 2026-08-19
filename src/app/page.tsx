const OPTIONS = [
  {
    default: "[]",
    description: "Skip files ending with any of these.",
    name: "excludeExtensions",
    type: "string[]",
  },
  {
    default: '["middleware.ts"]',
    description: "Skip files whose path contains any.",
    name: "excludeFiles",
    type: "string[]",
  },
  {
    default: '[".ts", ".tsx"]',
    description: "Only consider files with these endings.",
    name: "includeExtensions",
    type: "string[]",
  },
  {
    default: '"app"',
    description: "Which router to scan as the graph root.",
    name: "router",
    type: '"app" | "pages" | "both"',
  },
  {
    default: "true",
    description: "Whether your project uses src/.",
    name: "srcDir",
    type: "boolean",
  },
];

export default function Home() {
  return (
    <div className="container">
      <h1 className="title">next-unused</h1>
      <p className="subtitle">
        A CLI that walks your Next.js dependency graph from the router root and
        reports the <code>.ts</code> / <code>.tsx</code> files that no one
        imports.
      </p>

      <section className="section">
        <h2>What you get</h2>
        <p>Run it and it prints the files nothing points at.</p>
        <pre className="terminal">
          <code>
            <span className="prompt">$</span> npx next-unused{"\n"}
            <span className="found">Found 3 unused files:</span>
            {"\n"}
            src/components/OldBanner/index.tsx{"\n"}
            src/hooks/useLegacyToggle.ts{"\n"}
            src/lib/formatDeprecated.ts
          </code>
        </pre>
        <p className="note">
          When there is nothing left over, it says{" "}
          <code>No unused files!</code> and exits with 0.
        </p>
      </section>

      <section className="section">
        <h2>Install</h2>
        <pre className="terminal">
          <code>
            <span className="prompt">$</span> npm install --save-dev
            @piro0919/next-unused
          </code>
        </pre>
        <p className="note">Requires Node 20+.</p>
      </section>

      <section className="section">
        <h2>Use it in CI</h2>
        <p>
          <code>--error-on-unused-files</code> exits with code 1 when any are
          found, so a pull request can fail on leftovers.
        </p>
        <pre className="terminal">
          <code>
            {"{\n"}
            {'  "scripts": {\n'}
            {'    "find:unused": "next-unused",\n'}
            {
              '    "check:unused": "next-unused --error-on-unused-files"\n'
            }
            {"  }\n"}
            {"}"}
          </code>
        </pre>
      </section>

      <section className="section">
        <h2>Configuration</h2>
        <p>
          Drop a config file in your project root. Picked up in this order:{" "}
          <code>next-unused.config.mjs</code> → <code>.js</code> →{" "}
          <code>.json</code>.
        </p>
        <div className="tableWrap">
          <table className="options">
            <thead>
              <tr>
                <th>Option</th>
                <th>Type</th>
                <th>Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONS.map((option) => (
                <tr key={option.name}>
                  <td>
                    <code>{option.name}</code>
                  </td>
                  <td className="muted">
                    <code>{option.type}</code>
                  </td>
                  <td className="muted">
                    <code>{option.default}</code>
                  </td>
                  <td>{option.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2>Programmatic API</h2>
        <p>The same walk is available as a function.</p>
        <pre className="terminal">
          <code>
            {
              'import { findUnusedFiles, loadConfig } from "@piro0919/next-unused";\n\n'
            }
            {"const config = await loadConfig();\n"}
            {"const unused = await findUnusedFiles({ config });"}
          </code>
        </pre>
      </section>

      <div className="links">
        <a
          className="link"
          href="https://www.npmjs.com/package/@piro0919/next-unused"
          rel="noopener noreferrer"
          target="_blank"
        >
          npm →
        </a>
        <a
          className="link"
          href="https://github.com/piro0919/next-unused"
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub →
        </a>
      </div>
    </div>
  );
}
