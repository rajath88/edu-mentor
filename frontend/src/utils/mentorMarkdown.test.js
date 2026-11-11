import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { normalizeMentorMarkdown } from "./mentorMarkdown.js";

test("renders escaped headings, emphasis, lists, GFM tables, code, and entities", () => {
  const answer = String.raw`\# Summary
\*\*Bold text\*\*

\- First item
\- Second item

| Subject \| Score |
| --- \| ---: |
| Maths \| 90 |

\`\`\`java
System.out.println("hello");
\`\`\`

&#x20;Entity spacing.`;

  const rendered = renderToStaticMarkup(createElement(
    ReactMarkdown,
    { remarkPlugins: [remarkGfm] },
    normalizeMentorMarkdown(answer),
  ));

  assert.match(rendered, /<h1>Summary<\/h1>/);
  assert.match(rendered, /<strong>Bold text<\/strong>/);
  assert.match(rendered, /<ul>/);
  assert.match(rendered, /<table>/);
  assert.match(rendered, /<th>Subject<\/th>/);
  assert.match(rendered, /<pre><code class="language-java">/);
  assert.match(rendered, /Entity spacing\./);
  assert.doesNotMatch(rendered, /&#x20;/);
});

test("preserves escaped characters inside fenced code blocks", () => {
  const answer = String.raw`\`\`\`text
Use \* literally inside code.
\`\`\``;

  assert.equal(
    normalizeMentorMarkdown(answer),
    "```text\nUse \\* literally inside code.\n```",
  );
});

test("unescapes formatting outside inline code while preserving inline code", () => {
  assert.equal(
    normalizeMentorMarkdown(String.raw`Use \`\*literal\*\` and \*\*bold\*\*.`),
    "Use `\\*literal\\*` and **bold**.",
  );
});

test("keeps HTML inert when parsing untrusted mentor output", () => {
  const rendered = renderToStaticMarkup(createElement(
    ReactMarkdown,
    { remarkPlugins: [remarkGfm] },
    "<img src=x onerror=alert(1)>",
  ));

  assert.doesNotMatch(rendered, /<img/);
  assert.match(rendered, /&lt;img/);
});
