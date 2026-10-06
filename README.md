# Idea Zone

A private ChatGPT plugin and a Cloudflare Pages landing page for turning complex conversations into readable, portable HTML documents.

[Open the private plugin](https://chatgpt.com/plugins/plugins_6ac40e721a4881919fb7992535e83c46) · [Official plugin installation guidance](https://learn.chatgpt.com/docs/plugins)

## What is built

- A skills-only Agent Plugins 1.0 package in `idea-zone/`. No backend, API key, MCP server, or document upload service.
- Short instructions: write a title, optional subtitle/layout/palette, and `pages` containing a title and Markdown. A bundled renderer handles layout, Markdown tables, images, navigation, and print styles. Includes an HTML template fallback for sessions without Node/Bun.
- Three separate layouts: Brief (default), Editorial, Report. Each output contains only its selected layout.
- Four colour swatches in the Appearance panel: Light (default), Paper, Sage, Dark. Three embedded fonts: Inter, Newsreader, IBM Plex Mono, plus the layout default. Palette and font changes keep the layout fixed. Save a copy preserves the chosen appearance in a standalone file.
- Every exported document is **one HTML file**. Fonts, CSS and JavaScript are inline; local raster images are embedded as data URLs. Pages are navigable sections in the file. Opening an output requires only a browser.
- `dist/index.html` is also **one file**. It contains the landing page, a document preview, three illustrated examples that open in new tabs, reading-control demos, downloads, and the complete plugin ZIP download. No CDN or network asset dependency.

The plugin has been saved privately to the creator's account, not listed publicly. The landing page labels private access honestly. Installation and file-generation capabilities depend on the ChatGPT surface and workspace. Public directory submission is a separate step.

## Develop and build

Bun is supported and preferred when available:

```sh
bun install
bun run build
bun run dev
bun run test
```

Node 18+ is supported too:

```sh
npm ci
npm run build
npm run dev
npm test
```

Preview at http://localhost:5173. Build regenerates the bundled renderer, three illustrated examples, three minimal layout templates, private plugin ZIP, and the single-file website. Browser checks use `npm run test:browser` after the dev server starts; install Chromium with `npx playwright install chromium` if no local browser is available.

## Make a document

```sh
node idea-zone/skills/share-idea/assets/render.mjs examples/idea.json my-idea.html
# or bun idea-zone/skills/share-idea/assets/render.mjs examples/idea.json my-idea.html
```

```json
{
  "title": "My idea",
  "subtitle": "A proposal for the team",
  "style": "brief",
  "palette": "neutral",
  "pages": [
    {"title": "Overview", "markdown": "A **clear idea**.\n\n![Sketch](./sketch.png)"},
    {"title": "Plan", "markdown": "| Step | Owner |\n| --- | --- |\n| Try it | Us |"}
  ]
}
```

Only `title` and `pages` are required. `style` selects the layout at render time; it cannot be changed inside the output. `palette` selects the initial colour, and readers can switch it in the Appearance panel. To make another layout, render another file with the same content. Legacy `theme` input (sage/paper/midnight) remains accepted as an initial palette for the Brief layout. Images resolve relative to the JSON input. PNG/JPEG/GIF/WebP/AVIF files are supported up to 10 MB each. Remote images must be downloaded first; unsupported or missing images cause an explicit error. Supported Markdown includes captions from image titles, GFM task lists, nested lists, callouts (`[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`), highlighted code (JavaScript, JSON, CSS, Bash and Python), strikethrough, and per-page footnotes. Raw HTML is escaped; executable link schemes are removed. Documents contain a restrictive CSP and never automatically fetch remote resources. Outgoing source links work when followed.

Generated files can be large when images are included. Some email services block HTML attachments; PDF export provides an alternative. Hosting a user's document requires a separate explicit request.

## Deploy to Cloudflare Pages

The public website is the landing page only. Exported user ideas are never included in deployment.

1. Run `bun run build` or `npm run build`.
2. Authenticate with `npx wrangler login` (or `npx wrangler login --device` on a remote machine).
3. Create the project once: `npx wrangler pages project create idea-zone --production-branch main`.
4. Deploy: `npm run deploy` or `bun run deploy`.

Wrangler returns the actual deployment and project URLs. The name may already be taken; use a unique project name and update `package.json` and `wrangler.jsonc` if necessary. Do not assume `idea-zone.pages.dev` belongs to this project before deployment succeeds.

For Git integration, connect this repository in Cloudflare Pages, choose framework **None**, build command `npm ci && npm run build`, output directory `dist`. The output is still just `index.html`. Cloudflare distinguishes Git-integrated projects from Direct Upload projects; choose the intended workflow when creating the project.

## Document design

The output focuses on the supplied content: no product logo, promotional footer, slogans, or filler sections. Brief uses compact sans-serif type and a contents column. Editorial uses a serif reading column and horizontal navigation. Report uses numbered sections, compact tables, and a bordered document layout. These are separate files, not colour variations. Print styles include every section and use dark text on white paper regardless of the chosen screen palette.

## Illustrated examples

- `examples/brief.json`: studio proposal with reference photography, a floor-plan diagram, costs, notes and tasks.
- `examples/editorial.json`: coastal weekend with photography, a schedule, a quotation, nested lists and a source footnote.
- `examples/report.json`: launch review with a release diagram, highlighted Bash/JSON/JavaScript and review checklists.

These are illustrative documents, not claims about completed work or verified travel arrangements. Source photographs and credits are recorded in [examples/assets/CREDITS.md](examples/assets/CREDITS.md). `scripts/example-assets.mjs` builds compressed WebP images and the original diagrams; source photos remain local. Fonts and their OFL licenses are stored in `src/assets/fonts/`. The build includes credits and licenses in the plugin package.

## Design and research decisions

- [Cloudflare supports static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) and [Direct Upload of prebuilt assets](https://developers.cloudflare.com/pages/get-started/direct-upload/), so the landing page needs no server.
- [Bun supports standalone HTML](https://bun.com/docs/bundler/standalone-html). This build explicitly embeds assets and downloads to enforce the one-file invariant; Bun can run the build, development server, tests, and document renderer. The renderer ships already bundled, so an AI does not install dependencies for every document.
- [Astryx provides a React component system with TypeScript and StyleX tooling](https://astryx.atmeta.com/blog/how-astryx-works). It could be bundled into a single-file UI, but the first release uses small inline CSS templates to minimise runtime size and keep model input to a tiny JSON contract. Astryx is not a dependency of this implementation.
- [Official OpenAI plugin guidance](https://learn.chatgpt.com/docs/plugins) describes plugin installation, bundled skills, account/workspace access, and starting a new session after installation. The package follows the [Agent Plugins 1.0 manifest](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json).

## Layout

- `src/renderer.mjs`, `src/document.css`: renderer source and shared palette/content styles.
- `src/brief.css`, `src/editorial.css`, `src/report.css`: separate layout styles; only one is included in each exported file.
- `src/reader.js`, `src/typefaces.mjs`, `src/assets/fonts/`: Appearance controls, preference persistence, file saving, and embedded typefaces.
- `src/landing.html`: landing page source with build placeholders.
- `scripts/build.mjs`: build and private packaging.
- `idea-zone/`: plugin manifest, skill, bundled renderer, layout templates, example, icon, third-party licenses.
- `plugin-release.json`: non-secret identifiers for the created private plugin.
- `examples/`: input and generated examples.
- `dist/index.html`: deployable website.
- `idea-zone-plugin.zip`: private install/export package.
- `tests/`: renderer, packaging, and browser verification.

Private account creation does not establish public access or end-to-end model reliability. The renderer is verified independently; a real installed-chat trial is still needed to measure whether a chosen low-reasoning model follows the workflow reliably.

## SonarCloud analysis

Automatic analysis reads `.sonarcloud.properties`. Maintained code in `src/` and
`scripts/` is analysed; `tests/` is classified as test code. Generated files in
`dist/`, `examples/*.html`, and `idea-zone/skills/share-idea/assets/` are built from
that source and include vendored dependencies, so they are outside the source
analysis scope. They remain covered by renderer, accessibility, preview-server
and browser checks. No quality-gate thresholds or source rules are disabled.

Run `npm run build` before `npm test`. The build packages the plugin ZIP in Node;
Python is not needed. A push triggers SonarCloud's configured automatic scan.
