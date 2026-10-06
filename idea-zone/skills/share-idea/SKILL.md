---
name: share-idea
description: Turn a conversation, complex idea, proposal, plan, or research summary into a polished, shareable single HTML file with Markdown, tables, images, and multiple pages. Use when the user asks for Idea Zone or wants an idea packaged for someone else to read.
---

# Idea Zone

Create ONE standalone `.html` file per layout. Default layout: `brief`. Default colour palette: `neutral`.

Layouts: `brief` (compact sans-serif document), `editorial` (serif reading column), `report` (numbered sections and denser tables). Choose one when rendering. Do not add a layout switcher to the output. A different layout means a separate HTML file.

Palettes: `neutral` (Light), `warm` (Paper), `sage`, `midnight` (Dark). Fonts: `default` (layout pairing), `sans` (Inter), `serif` (Newsreader), `mono` (IBM Plex Mono). The Appearance panel lets readers change colours and fonts. All three fonts are embedded; no network request is needed. Save a copy preserves choices in a new HTML file.

## Do these steps

1. Use the conversation and supplied files to write a clear document for the intended reader. Preserve important details, figures, qualifications, and source links. Do not invent facts or present estimates as confirmed. Omit unrelated chat and private details that are not needed for the requested document.
2. Write `idea.json` using the format below. For a short idea use one page; for longer ideas use a few named pages. A page is a section in the SAME HTML file. Use Markdown for all content. Choose a factual title and a short subtitle if useful. Set `style` to the requested layout, `palette` to the initial colour and `font` only if a particular font was requested. Choose Markdown structures that make the supplied information easier to read; use the short guide below. No custom CSS or JavaScript is needed.
3. Run the bundled renderer: `node <this-skill-directory>/assets/render.mjs idea.json idea-zone.html`. `bun` works in place of `node`. Resolve the skill directory from the actual installed file location; do not use a made-up path. No package install, network, or build is needed.
4. Check that the output exists and contains all pages, tables, and embedded images. Open it if a browser is available. Return a downloadable link to `idea-zone.html` using the host's file attachment mechanism. The reader only needs a browser; no account or runtime.

## Exact input format

```json
{
  "title": "Support handover",
  "subtitle": "A two-week trial for the shared inbox.",
  "style": "brief",
  "palette": "neutral",
  "pages": [
    {
      "title": "Proposal",
      "markdown": "Assign one **inbox owner** each day.\n\n### Scope\n\n- Use the existing inbox.\n- Review the trial after two weeks."
    },
    {
      "title": "Routine",
      "markdown": "| When | Action |\n| --- | --- |\n| Morning | Assign open requests |\n| End of day | Leave a handover |"
    }
  ]
}
```

Only `title` and a non-empty `pages` array are required. Every page needs `title` and `markdown` strings. `subtitle`, `style`, `palette`, and `font` are optional. Use JSON escaping for newlines (`\n`) and quotes (`\"`). Do not add new fields.

## Content rules

- Write for the recipient. Use specific headings, plain sentences and the original evidence. Do not add slogans, promotional introductions, decorative quotes, exaggerated claims, or a closing sales pitch. Do not pad short content to fit a template.
- The document has no Idea Zone logo, byline, or promotional footer. Do not add those, or mention AI generation, unless the user requests it. Preserve any attribution or disclosures supplied by the user.
- Choose layout separately from colour. If the user requests multiple layouts, render each as its own file using the same content. All colour choices stay available within each file.

- Supported: headings, paragraphs, **bold**, *italic*, ~~strikethrough~~, ordered/unordered/nested lists, GFM task lists, blockquotes, fenced code with highlighting, horizontal rules, links, Markdown tables, image captions, GFM callouts and footnotes.
- Images: `![Descriptive alt text](./image.png "A useful caption")`. Put images on their own line. The optional Markdown image title is rendered as a figure caption. Local paths resolve relative to `idea.json`. PNG, JPEG, GIF, WebP, and AVIF are embedded as data URLs. Maximum 10 MB per image. Resize large images first when tools allow. Never assume an attachment exists at a path: locate the real file. If a user supplies a remote image, download it only when authorised and available, then use its local path. The renderer rejects remote image URLs, SVG, missing files, and unsupported formats. Do not invent images.
- Raw HTML is displayed as text. Use Markdown. Links may use HTTPS, HTTP, or mailto. Preserve real source URLs.
- Multiple pages automatically receive navigation. “Read all” shows the entire document. Printing includes every page, even if only one is selected.
- This exports the relevant idea, not automatically the entire chat history. Do not upload the user's idea to the landing page or publish it unless asked.

## Use Markdown to organise the information

Choose the format for the job. Do not turn a dense source into a wall of paragraphs or a list of bold labels. Do not add irrelevant features to show off formatting.

| Information | Use |
| --- | --- |
| Options, costs, dates, owners | A Markdown table; right-align numeric columns with `---:` |
| Actions someone can complete | `- [ ] Task` and `- [x] Completed task` |
| A process | Numbered steps, with indented lists for supporting details |
| Sections within a page | `### Heading` and, if needed, `#### Subheading`; the document and page titles are already supplied |
| A supplied photograph or diagram | An image on its own line, meaningful alt text and an optional caption |
| A real quote or highlighted passage | A blockquote; preserve attribution and do not invent a quote |
| A caveat that changes a decision | A callout: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, or `> [!CAUTION]`, followed by its text on another quoted line |
| Code or configuration | A fenced code block with a language (`javascript`, `json`, `bash`, `css`, `python`); use inline backticks for names and short commands |
| A source note that interrupts reading | `Text[^source]` and a definition `[^source]: Source details or a real source link.` on the same page |

Use bold for an important result or a decision, italic for an aside, and a horizontal rule only where there is a real change of topic. Keep existing facts, tables and useful formatting. Don't invent numbers to fill a table, completed tasks, photo sources or citations.

For a compact example covering these features, see `references/markdown.md`. The bundled `assets/example.json` is a complete illustrated proposal that can be rendered without extra assets. Treat example facts and images as examples; never carry them into the user's document.

## If Node and Bun are unavailable

Use `assets/template-brief.html`, `assets/template-editorial.html`, or `assets/template-report.html` to match the selected layout (`assets/template.html` is also Brief). It includes the same inline styles and working navigation. Replace the sample title, subtitle, nav links, and section content with escaped semantic HTML (`p`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `a`, `table`, `img`). Keep the embedded fonts, inline CSS, Appearance panel, and script. Edit the body fragment with file tools without printing the embedded font data. Replace every placeholder with supplied content. Keep the layout fixed; do not bundle other layouts or add a layout selector. Use `<section class="document-section" id="page-1">` for each page, incrementing the id for later pages, with matching nav links. Keep `article id="document"` and all existing reader-control IDs so navigation and appearance controls continue to work. Embed raster images as data URLs using available file tools. Keep all assets inside the HTML. Never depend on CDNs or other local files. If you cannot create attachments in this session, provide the complete HTML for saving as `idea-zone.html` and say that an attachment could not be created.
