import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDocument } from "htmlparser2";
import { findAll, getText } from "domutils";
import { renderDocument } from "../idea-zone/skills/share-idea/assets/render.mjs";

test("task checkboxes have unique, meaningful labels across pages and nested lists", () => {
  const markdown =
    "- [x] **Review** the estimate\n  - [ ] Check the measurements\n\n- [ ] Ask the owner\n\n  Include the budget.";
  const html = renderDocument({
    title: "Tasks",
    pages: [
      { title: "First", markdown },
      { title: "Second", markdown },
    ],
  });
  const tree = parseDocument(html);
  const inputs = findAll((node) => node.name === "input", tree.children);
  assert.equal(inputs.length, 6);
  const ids = new Set();
  for (const input of inputs) {
    assert.ok(!ids.has(input.attribs.id));
    ids.add(input.attribs.id);
    const labels = findAll(
      (node) => node.attribs?.id === input.attribs["aria-labelledby"],
      tree.children,
    );
    assert.equal(labels.length, 1);
    assert.match(getText(labels[0]), /Review|Check|Ask/);
    assert.equal(input.attribs.disabled, "");
  }
  assert.equal(
    inputs.filter((input) => Object.hasOwn(input.attribs, "checked")).length,
    2,
  );
});

test("Markdown alignment and footnotes use accessible modern HTML", () => {
  const html = renderDocument({
    title: "Notes",
    pages: [
      {
        title: "Details",
        markdown:
          "| Left | Centre | Amount |\n| :--- | :---: | ---: |\n| A | B | 10 |\n\nSource[^a].\n\n[^a]: A note.",
      },
    ],
  });
  assert.doesNotMatch(html, /\balign="|role="group"/);
  for (const alignment of ["left", "center", "right"])
    assert.match(html, new RegExp('class="align-' + alignment + '"'));
  assert.match(html, /<section[^>]+aria-label="Footnotes"/);
  assert.match(html, /<fieldset class="palette-options"><legend/);
});
