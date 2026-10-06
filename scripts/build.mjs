import fs from "node:fs";
import { build } from "esbuild";
import { zipSync } from "fflate";
const assets = "idea-zone/skills/share-idea/assets";
fs.mkdirSync("dist", { recursive: true });
await build({
  entryPoints: ["src/renderer.mjs"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  outfile: assets + "/render.mjs",
  loader: { ".css": "text", ".woff2": "dataurl" },
  plugins: [
    {
      name: "reader-source",
      setup(b) {
        b.onLoad({ filter: /\/src\/reader\.js$/ }, (args) => ({
          contents: fs.readFileSync(args.path, "utf8"),
          loader: "text",
        }));
      },
    },
  ],
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});
const { renderDocument, fontCss } = await import(
  "../" + assets + "/render.mjs?build=" + Date.now()
);
const examples = {};
for (const style of ["brief", "editorial", "report"]) {
  const doc = JSON.parse(
    fs.readFileSync("examples/" + style + ".json", "utf8"),
  );
  examples[style] = renderDocument(doc, "examples");
  fs.writeFileSync("examples/" + style + ".html", examples[style]);
}
for (const style of ["brief", "editorial", "report"])
  fs.writeFileSync(
    assets + "/template-" + style + ".html",
    renderDocument({
      title: "Document title",
      subtitle: "A short description of this document.",
      style,
      pages: [
        {
          title: "Overview",
          markdown: "Replace this section with the supplied content.",
        },
      ],
    }),
  );
fs.copyFileSync(assets + "/template-brief.html", assets + "/template.html");
fs.copyFileSync("examples/idea.json", assets + "/example.json");
let licenses = "Third-party packages bundled in render.mjs\n\n";
for (const name of [
  "marked",
  "sanitize-html",
  "htmlparser2",
  "domhandler",
  "domutils",
  "domelementtype",
  "dom-serializer",
  "entities",
  "deepmerge",
  "escape-string-regexp",
  "is-plain-object",
  "parse-srcset",
  "postcss",
  "nanoid",
  "picocolors",
  "source-map-js",
  "highlight.js",
  "marked-footnote",
]) {
  const dir = "node_modules/" + name;
  let files = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    continue;
  }
  const license = files.find((f) => /^license(\.md|\.txt)?$/i.test(f));
  if (license)
    licenses +=
      "--- " +
      name +
      " ---\n" +
      fs.readFileSync(dir + "/" + license, "utf8") +
      "\n\n";
}
for (const name of ["inter", "newsreader", "plex-mono"])
  licenses +=
    "--- " +
    name +
    " font ---\n" +
    fs.readFileSync("src/assets/fonts/" + name + "-LICENSE.txt", "utf8") +
    "\n";
licenses += fs.readFileSync("examples/assets/CREDITS.md", "utf8");
fs.writeFileSync(assets + "/THIRD-PARTY-LICENSES.txt", licenses);
const sample = JSON.parse(fs.readFileSync("examples/brief.json", "utf8"));
for (const p of sample.pages)
  p.markdown = p.markdown.replace(
    /\.\/assets\/(studio|studio-plan)\.webp/g,
    (_, name) =>
      "data:image/webp;base64," +
      fs.readFileSync("examples/assets/" + name + ".webp").toString("base64"),
  );
fs.writeFileSync(assets + "/example.json", JSON.stringify(sample, null, 2));
const pluginFiles = {};
function collectPluginFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = directory + "/" + entry.name;
    if (entry.isDirectory()) {
      collectPluginFiles(filename);
    } else if (entry.isFile()) {
      pluginFiles[filename] = new Uint8Array(fs.readFileSync(filename));
    }
  }
}
collectPluginFiles("idea-zone");
fs.writeFileSync(
  "idea-zone-plugin.zip",
  zipSync(pluginFiles, { level: 6, mtime: new Date("2000-01-01T00:00:00Z") }),
);

let url = "https://learn.chatgpt.com/docs/plugins",
  cta = "Read the installation guide",
  status =
    "The package is ready. A public listing is not available. Use the ZIP with a supported plugin import or local marketplace.";
if (fs.existsSync("plugin-release.json")) {
  const release = JSON.parse(fs.readFileSync("plugin-release.json", "utf8"));
  url = release.plugin_url;
  cta = "Open Idea Zone in ChatGPT";
  status =
    "Private release. The link is available to authorised accounts. The ZIP download is a package, not an automatic installation.";
}
const replacements = {
  "/* __FONT_CSS__ */": fontCss,
  __STUDIO_IMAGE__:
    "data:image/webp;base64," +
    fs.readFileSync("examples/assets/studio.webp").toString("base64"),
  __COAST_IMAGE__:
    "data:image/webp;base64," +
    fs.readFileSync("examples/assets/coast.webp").toString("base64"),
  __REPORT_IMAGE__:
    "data:image/webp;base64," +
    fs.readFileSync("examples/assets/release-path.webp").toString("base64"),
  __EXAMPLES__: JSON.stringify(examples).replaceAll(/</g, String.raw`\u003c`),
  __EXAMPLE_DATA__:
    "data:text/html;base64," + Buffer.from(examples.brief).toString("base64"),
  __PLUGIN_URL__: url.replaceAll(/&/g, "&amp;").replaceAll(/"/g, "&quot;"),
  __PLUGIN_CTA__: cta,
  __PLUGIN_STATUS__: status,
  __PLUGIN_DATA__:
    "data:application/zip;base64," +
    fs.readFileSync("idea-zone-plugin.zip").toString("base64"),
};
let html = fs.readFileSync("src/landing.html", "utf8");
for (const [key, value] of Object.entries(replacements))
  html = html.replaceAll(key, value);
fs.writeFileSync("dist/index.html", html);
console.log(
  "Built dist/index.html — " +
    Buffer.byteLength(html) +
    " bytes. Single-file landing page, three layout examples, plugin ZIP.",
);
