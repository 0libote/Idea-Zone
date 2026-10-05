---
name: share-idea
description: Turn a conversation, complex idea, proposal, plan, or research summary into a polished, shareable single HTML file with Markdown, tables, images, and multiple pages. Use when the user asks for Idea Zone or wants an idea packaged for someone else to read.
---

# Idea Zone

Create ONE standalone `.html` file. Default theme: `sage`. Other choices: `paper` or `midnight`.

## Do these steps

1. Use the conversation and supplied files to write a clear document for the intended reader. Preserve important details, figures, qualifications, and source links. Do not invent facts or present estimates as confirmed. Omit unrelated chat and private details that are not needed for the requested document.
2. Write `idea.json` using the format below. For a short idea use one page; for longer ideas use a few named pages. A page is a section in the SAME HTML file. Use Markdown for all content. Choose a useful title and subtitle. No custom CSS or JavaScript is needed.
3. Run the bundled renderer: `node <this-skill-directory>/assets/render.mjs idea.json idea-zone.html`. `bun` works in place of `node`. Resolve the skill directory from the actual installed file location; do not use a made-up path. No package install, network, or build is needed.
4. Check that the output exists and contains all pages, tables, and embedded images. Open it if a browser is available. Return a downloadable link to `idea-zone.html` using the host's file attachment mechanism. The reader only needs a browser; no account or runtime.

## Exact input format

```json
{
  "title": "A neighbourhood reading room",
  "subtitle": "A practical proposal for a four-week pop-up",
  "theme": "sage",
  "pages": [
    {
      "title": "The idea",
      "markdown": "A place to **read and connect**.\n\n> No purchase required.\n\n### Why it matters\n\n- Shared space\n- Shared books"
    },
    {
      "title": "The plan",
      "markdown": "| Phase | Duration |\n| --- | --- |\n| Listen | 2 weeks |\n| Try | 4 weeks |"
    }
  ]
}
```

Only `title` and a non-empty `pages` array are required. Every page needs `title` and `markdown` strings. `subtitle` and `theme` are optional. Use JSON escaping for newlines (`\n`) and quotes (`\"`). Do not add new fields.

## Content rules

- Supported: headings, paragraphs, **bold**, *italic*, lists, blockquotes, fenced code, horizontal rules, links, and Markdown tables.
- Images: `![Descriptive alt text](./image.png)`. Local paths resolve relative to `idea.json`. PNG, JPEG, GIF, WebP, and AVIF are embedded as data URLs. Maximum 10 MB per image. Resize large images first when tools allow. Never assume an attachment exists at a path: locate the real file. If a user supplies a remote image, download it only when authorised and available, then use its local path. The renderer rejects remote image URLs, SVG, missing files, and unsupported formats. Do not invent images.
- Raw HTML is displayed as text. Use Markdown. Links may use HTTPS, HTTP, or mailto. Preserve real source URLs.
- Multiple pages automatically receive navigation. “Read all” shows the entire document. Printing includes every page, even if only one is selected.
- This exports the relevant idea, not automatically the entire chat history. Do not upload the user's idea to the landing page or publish it unless asked.

## If Node and Bun are unavailable

Use `assets/template.html` as the starting file. It includes the same inline styles and working navigation. Replace the sample title, subtitle, nav links, and section content with escaped semantic HTML (`p`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `a`, `table`, `img`). Keep the inline CSS and script. Give each page an id `page-1`, `page-2`, etc., and matching nav links. Embed raster images as data URLs using available file tools. Keep all assets inside the HTML. Never depend on CDNs or other local files. If you cannot create attachments in this session, provide the complete HTML for saving as `idea-zone.html` and say that an attachment could not be created.
