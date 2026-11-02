import MarkdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import attrs from "markdown-it-attrs";

// Matches kramdown's header ids: "(and why it's important)" -> "and-why-its-important".
function kramdownSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Blog posts are written by the site owner, so raw HTML (inline <style>, <figure>, footnote <sup>s) is allowed.
// typographer gives kramdown's smart quotes and dashes; attrs gives its `{: .class #id}` block attributes.
const blog = new MarkdownIt({ html: true, typographer: true })
  .use(attrs, { leftDelimiter: "{:", rightDelimiter: "}" })
  .use(anchor, { slugify: kramdownSlug, tabIndex: false });

export function renderMarkdown(source: string): string {
  return blog.render(source);
}

// Feed posts and comments are plain text: escaped, links made clickable, line breaks kept.
const plain = new MarkdownIt("zero", { linkify: true, breaks: true }).enable(["linkify", "newline"]);
plain.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  tokens[idx].attrSet("rel", "nofollow ugc noopener");
  tokens[idx].attrSet("target", "_blank");
  return self.renderToken(tokens, idx, options);
};

export function renderPlainText(text: string): string {
  return plain.render(text.trim());
}
