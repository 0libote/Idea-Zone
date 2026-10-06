# Markdown patterns

Use only the patterns that help the user's material. This is syntax, not content to copy into a document.

```markdown
### Compare the options

| Option | Cost | Trade-off |
| :--- | ---: | :--- |
| Option A | 100 | Lower cost; fewer features |
| **Option B** | **150** | Preferred if the extra feature is needed |

### Next steps

- [x] A step the source says is complete.
- [ ] A step still to do.

1. Confirm the requirements.
   - Record constraints and assumptions.
2. Review the options.
3. Make the decision.

![A description of the supplied image](./actual-image.webp "Caption from the source or a factual description")

> [!NOTE]
> A qualification from the source that the reader needs before deciding.

> A real quoted passage, with its attribution preserved.

Use `setting_name` for a setting, **bold** for a key result, and *italic* for a short aside. ~~Strike out~~ only if showing a discarded option is useful.

A source note can sit below the main text.[^source]

[^source]: A supplied source or a real URL. Footnote references and definitions stay on the same page.

---

### A new topic

[Read the supplied source](https://example.com/the-real-source)
```

Fenced code uses three backticks followed by a language name:

```json
{
  "setting": "value"
}
```

The values and links above illustrate syntax. Replace them with supplied facts. The renderer escapes raw HTML. It supports Markdown and the listed callout/footnote extensions, not arbitrary HTML, LaTeX or Mermaid source. If a supplied diagram exists as a raster image, embed that image instead.
