import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked, Marked } from "marked";
import markedFootnote from "marked-footnote";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import cssLanguage from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import readerScript from "./reader.js";
import { fontCss } from "./typefaces.mjs";
export { fontCss };
for (const [name, language] of Object.entries({
  javascript,
  json,
  css: cssLanguage,
  bash,
  python,
}))
  hljs.registerLanguage(name, language);
import sanitizeHtml from "sanitize-html";
import css from "./document.css";
import briefCss from "./brief.css";
import editorialCss from "./editorial.css";
import reportCss from "./report.css";

export const escape = (value) =>
  String(value).replaceAll(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const mimeTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};
function imageUrl(href, baseDir) {
  if (/^data:image\/(png|jpeg|gif|webp|avif);base64,[a-z\d+/=\s]+$/i.test(href))
    return href;
  if (/^[a-z][a-z\d+.-]*:|^\/\//i.test(href))
    throw new Error(
      "Images must be local PNG, JPEG, GIF, WebP, or AVIF files, or raster data URLs. Download an authorised image first.",
    );
  const file = path.resolve(baseDir, decodeURIComponent(href));
  const mime = mimeTypes[path.extname(file).toLowerCase()];
  if (!mime) throw new Error("Unsupported image format: " + href);
  const data = fs.readFileSync(file);
  if (data.length > 10 * 1024 * 1024)
    throw new Error("Image exceeds 10 MB: " + href);
  return "data:" + mime + ";base64," + data.toString("base64");
}
function alignedCell(tagName, attrs) {
  const alignment = attrs.align;
  const className = ["left", "center", "right"].includes(alignment)
    ? "align-" + alignment
    : "";
  return { tagName, attribs: className ? { class: className } : {} };
}

export function renderDocument(doc, baseDir = process.cwd()) {
  if (
    !doc ||
    typeof doc !== "object" ||
    typeof doc.title !== "string" ||
    !doc.title.trim()
  )
    throw new Error("title must be a non-empty string");
  const style = doc.style ?? "brief";
  if (!["brief", "editorial", "report"].includes(style))
    throw new Error("style must be brief, editorial, or report");
  const palette =
    doc.palette ??
    { paper: "warm", sage: "sage", midnight: "midnight" }[doc.theme] ??
    "neutral";
  if (
    doc.theme !== undefined &&
    !["sage", "paper", "midnight"].includes(doc.theme)
  )
    throw new Error("Legacy theme must be sage, paper, or midnight");
  if (!["neutral", "warm", "sage", "midnight"].includes(palette))
    throw new Error("palette must be neutral, warm, sage, or midnight");
  const font = doc.font ?? "default";
  if (!["default", "sans", "serif", "mono"].includes(font))
    throw new Error("font must be default, sans, serif, or mono");
  if (doc.subtitle !== undefined && typeof doc.subtitle !== "string")
    throw new Error("subtitle must be a string");
  if (!Array.isArray(doc.pages) || !doc.pages.length)
    throw new Error("pages must be a non-empty array");
  const renderer = new marked.Renderer();
  renderer.html = ({ text }) => escape(text);
  renderer.image = ({ href, title, text }) => {
    const caption = title
      ? "<figcaption>" + escape(title) + "</figcaption>"
      : "";
    return `<figure aria-label="${escape(title || text)}"><img src="${escape(imageUrl(href, baseDir))}" alt="${escape(text)}" loading="lazy">${caption}</figure>`;
  };
  renderer.paragraph = function (token) {
    const html = this.parser.parseInline(token.tokens);
    return token.tokens.length === 1 && token.tokens[0].type === "image"
      ? html
      : `<p>${html}</p>\n`;
  };
  renderer.blockquote = function (token) {
    const match = token.text.match(
      /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/,
    );
    const html = this.parser.parse(token.tokens);
    if (!match) return `<blockquote>${html}</blockquote>`;
    const type = match[1].toLowerCase();
    return `<aside class="callout callout-${type}"><div class="callout-title">${type[0].toUpperCase() + type.slice(1)}</div>${html.replace(/^<p>\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br>)?\s*/, "<p>")}</aside>`;
  };
  renderer.code = ({ text, lang }) => {
    const name = (lang || "").split(/\s/)[0],
      aliases = {
        js: "javascript",
        ts: "javascript",
        sh: "bash",
        shell: "bash",
        py: "python",
      },
      language = aliases[name] || name;
    const html =
      language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language, ignoreIllegals: true }).value
        : escape(text);
    return `<div class="code-block"><div class="code-label">${escape(name || "Code")}</div><pre><code>${html}</code></pre></div>`;
  };
  const pages = doc.pages.map((p, i) => {
    if (
      !p ||
      typeof p.title !== "string" ||
      !p.title.trim() ||
      typeof p.markdown !== "string"
    )
      throw new Error("Each page needs a title string and a markdown string");
    let taskIndex = 0;
    renderer.listitem = function (token) {
      if (!token.task) {
        return marked.Renderer.prototype.listitem.call(this, token);
      }
      const id = "page-" + (i + 1) + "-task-" + ++taskIndex;
      const checked = token.checked ? ' checked=""' : "";
      const content = this.parser.parse(token.tokens, !!token.loose);
      return `<li class="task-list-item"><input id="${id}" type="checkbox" disabled=""${checked} aria-labelledby="${id}-label"><div class="task-label" id="${id}-label">${content}</div></li>`;
    };
    const parser = new Marked().use(
      markedFootnote({
        prefixId: `page-${i + 1}-note-`,
        headingClass: "footnote-heading",
      }),
    );
    const html = sanitizeHtml(
      parser.parse(p.markdown, { renderer, gfm: true }),
      {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat([
          "img",
          "del",
          "input",
          "figure",
          "figcaption",
          "aside",
          "section",
        ]),
        allowedAttributes: {
          a: [
            "href",
            "title",
            "id",
            "aria-label",
            "aria-describedby",
            "data-footnote-ref",
            "data-footnote-backref",
          ],
          img: ["src", "alt", "loading"],
          input: ["type", "checked", "disabled", "id", "aria-labelledby"],
          th: ["class"],
          td: ["class"],
          span: ["class"],
          code: ["class"],
          div: ["class", "id"],
          figure: ["aria-label"],
          aside: ["class"],
          section: ["class", "data-footnotes", "aria-label"],
          h2: ["id", "class"],
          li: ["id", "class"],
          ol: ["start", "class"],
          sup: ["class"],
        },
        allowedSchemes: ["https", "http", "mailto"],
        allowedSchemesByTag: { img: ["data"] },
        allowProtocolRelative: false,
        transformTags: {
          input: (_tag, attrs) => ({
            tagName: "input",
            attribs: { ...attrs, type: "checkbox", disabled: "" },
          }),
          section: (_tag, attrs) => ({
            tagName: "section",
            attribs: { ...attrs, "aria-label": "Footnotes" },
          }),
          th: alignedCell,
          td: alignedCell,
        },
      },
    )
      .replaceAll("<table>", '<div class="table-wrap"><table>')
      .replaceAll("</table>", "</table></div>");
    const number =
      style === "report"
        ? '<span class="section-number">' +
          String(i + 1).padStart(2, "0") +
          "</span>"
        : "";
    return `<section class="document-section" id="page-${i + 1}" aria-labelledby="heading-${i + 1}"><h2 id="heading-${i + 1}">${number}${escape(p.title)}</h2>${html}</section>`;
  });
  const styleCss = {
    brief: briefCss,
    editorial: editorialCss,
    report: reportCss,
  }[style];
  const svg = (name) => {
    const paths = {
      appearance: '<path d="M4 6h16M4 18h16M8 3v6M16 15v6"/>',
      print: '<path d="M7 8V3h10v5M7 17H4V8h16v9h-3M7 14h10v7H7Z"/>',
      save: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
      document: '<path d="M7 3h7l4 4v14H7ZM14 3v4h4M10 11h5M10 15h5"/>',
      check: '<path d="m4 9 3 3 6-7"/>',
    };
    return `<svg viewBox="0 0 ${name === "check" ? "16 16" : "24 24"}" aria-hidden="true">${paths[name]}</svg>`;
  };
  const colourNames = {
    neutral: "Light",
    warm: "Paper",
    sage: "Sage",
    midnight: "Dark",
  };
  const colourOptions = Object.entries(colourNames)
    .map(
      ([value, label]) =>
        `<button type="button" data-palette-choice="${value}" aria-label="${label} colour palette" aria-pressed="${value === palette}"><span class="swatch swatch-${label.toLowerCase()}">${svg("check")}</span>${label}</button>`,
    )
    .join("");
  const fontOptions = Object.entries({
    default: ["Layout default", "Original type pairing"],
    sans: ["Inter", "Clear, everyday reading"],
    serif: ["Newsreader", "A softer reading style"],
    mono: ["IBM Plex Mono", "Technical and monospaced"],
  })
    .map(
      ([value, [name, note]]) =>
        `<button type="button" class="font-option" data-font-choice="${value}" aria-pressed="${value === font}"><span class="font-sample">Aa</span><span class="font-name">${name}<small>${note}</small></span></button>`,
    )
    .join("");
  const appearance = `<details id="appearance" class="appearance"><summary class="tool appearance-summary">${svg("appearance")}<span>Appearance</span><span class="current-colour" id="view-colour">${colourNames[palette]}</span></summary><div class="appearance-panel"><fieldset class="palette-options"><legend class="control-label">Colour</legend>${colourOptions}</fieldset><div class="font-controls"><fieldset class="font-options"><legend class="control-label">Reading font</legend>${fontOptions}</fieldset><p class="preference-note">Use Save a copy to keep your choices in the file.</p></div></div></details>`;
  const navigation = doc.pages
    .map(
      (p, i) =>
        `<a href="#page-${i + 1}" data-number="${String(i + 1).padStart(2, "0")}">${escape(p.title)}</a>`,
    )
    .join("");
  const subtitle = doc.subtitle
    ? '<p class="subtitle">' + escape(doc.subtitle) + "</p>"
    : "";
  return `<!doctype html><html lang="en" data-style="${style}" data-palette="${palette}" data-font="${font}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="${palette === "midnight" ? "dark" : "light"}"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(doc.title)}</title><style>${fontCss}\n${css}\n${styleCss}</style></head><body><a class="skip" href="#document">Skip to document</a><div class="shell"><header class="toolbar"><span class="document-name">${svg("document")} ${doc.pages.length} ${doc.pages.length === 1 ? "section" : "sections"}</span><div class="tools"><a href="#" id="all" class="tool">Read all</a>${appearance}<button id="save" type="button" class="tool save" aria-label="Save a copy">${svg("save")}<span class="tool-label">Save a copy</span></button><button id="print" type="button" class="tool print" aria-label="Print / PDF">${svg("print")}<span class="tool-label">Print</span></button></div></header><div class="layout"><nav aria-label="Document pages"><span class="nav-label">Contents</span>${navigation}</nav><article id="document"><div class="document-heading"><h1>${escape(doc.title)}</h1>${subtitle}</div>${pages.join("")}<div class="end-mark" aria-hidden="true"></div></article></div></div><script>${readerScript}</script></body></html>`;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const [input, output] = process.argv.slice(2);
    if (!input || !output)
      throw new Error("Usage: node render.mjs input.json output.html");
    const doc = JSON.parse(fs.readFileSync(input, "utf8"));
    const html = renderDocument(doc, path.dirname(path.resolve(input)));
    fs.writeFileSync(output, html);
    console.log(
      "Created " + output + " (" + Buffer.byteLength(html) + " bytes)",
    );
  } catch (error) {
    console.error("Idea Zone: " + error.message);
    process.exitCode = 1;
  }
}
