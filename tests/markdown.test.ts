import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/lib/markdown";

describe("renderMarkdown", () => {
  it("escapes raw HTML / script injection", () => {
    const html = renderMarkdown('<script>alert(1)</script> **x**');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<strong>x</strong>");
  });
  it("blocks javascript: links but allows https and relative", () => {
    expect(renderMarkdown("[a](javascript:alert(1))")).not.toContain("href");
    expect(renderMarkdown("[a](https://x.com)")).toContain('href="https://x.com"');
    expect(renderMarkdown("[a](/contact)")).toContain('href="/contact"');
  });
  it("renders headings shifted down and lists", () => {
    const html = renderMarkdown("# T\n- a\n- b\n\n1. c");
    expect(html).toContain("<h2>T</h2>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
  });
});
