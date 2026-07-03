import { describe, it, expect } from "vitest";
import {
  buildSkeleton,
  formatDate,
  insertAtTopOfSection,
  renderBullet,
} from "./markdown";
import type { ThoughtItem } from "./types";

const MAY_4 = new Date(2026, 4, 4);
const MAY_3 = new Date(2026, 4, 3);
const JAN_1 = new Date(2026, 0, 1);
const DEC_31 = new Date(2099, 11, 31);

describe("formatDate", () => {
  it("formats as M/D/YY with no leading zeros and 2-digit year", () => {
    expect(formatDate(MAY_4)).toBe("5/4/26");
    expect(formatDate(MAY_3)).toBe("5/3/26");
    expect(formatDate(JAN_1)).toBe("1/1/26");
    expect(formatDate(DEC_31)).toBe("12/31/99");
  });

  it("zero-pads year for years < 2010", () => {
    expect(formatDate(new Date(2003, 6, 9))).toBe("7/9/03");
  });
});

describe("buildSkeleton", () => {
  it("creates a file with frontmatter and all five section headings", () => {
    expect(buildSkeleton()).toBe(
      "---\ntype: thoughts-master\n---\n\n" +
        "## Self-Improvement\n\n" +
        "## Professional Insights\n\n" +
        "## Teaching Insights\n\n" +
        "## Health & Wellness\n\n" +
        "## Other\n"
    );
  });
});

describe("renderBullet", () => {
  it("renders a bullet with the captured date and text", () => {
    const item: ThoughtItem = { section: "Self-Improvement", text: "Read 30 min daily" };
    expect(renderBullet(item, MAY_4)).toBe("- 5/4/26 — Read 30 min daily\n");
  });

  it("trims whitespace from the text", () => {
    const item: ThoughtItem = { section: "Other", text: "  spacy thought  " };
    expect(renderBullet(item, MAY_4)).toBe("- 5/4/26 — spacy thought\n");
  });

  it("indents multiline text so it stays inside one thought bullet", () => {
    const item: ThoughtItem = {
      section: "Other",
      text: "Key takeaways\n- first\n\nplain follow-up",
    };
    expect(renderBullet(item, MAY_4)).toBe(
      "- 5/4/26 — Key takeaways\n  - first\n\n  plain follow-up\n"
    );
  });
});

describe("insertAtTopOfSection", () => {
  const bullet = "- 5/4/26 — new thought\n";

  it("creates skeleton + bullet under the chosen section when file is empty", () => {
    expect(insertAtTopOfSection("", "Self-Improvement", bullet)).toBe(
      "---\ntype: thoughts-master\n---\n\n" +
        "## Self-Improvement\n- 5/4/26 — new thought\n\n" +
        "## Professional Insights\n\n" +
        "## Teaching Insights\n\n" +
        "## Health & Wellness\n\n" +
        "## Other\n"
    );
  });

  it("inserts at the TOP of the chosen section when section already has bullets", () => {
    const existing =
      "---\ntype: thoughts-master\n---\n\n" +
      "## Self-Improvement\n- 5/3/26 — earlier thought\n\n" +
      "## Professional Insights\n\n" +
      "## Teaching Insights\n\n" +
      "## Health & Wellness\n\n" +
      "## Other\n";
    expect(insertAtTopOfSection(existing, "Self-Improvement", bullet)).toBe(
      "---\ntype: thoughts-master\n---\n\n" +
        "## Self-Improvement\n- 5/4/26 — new thought\n- 5/3/26 — earlier thought\n\n" +
        "## Professional Insights\n\n" +
        "## Teaching Insights\n\n" +
        "## Health & Wellness\n\n" +
        "## Other\n"
    );
  });

  it("inserts under the correct section when multiple sections have content", () => {
    const existing =
      "---\ntype: thoughts-master\n---\n\n" +
      "## Self-Improvement\n- 5/3/26 — alpha\n\n" +
      "## Professional Insights\n- 5/3/26 — beta\n\n" +
      "## Teaching Insights\n\n" +
      "## Health & Wellness\n\n" +
      "## Other\n";
    const out = insertAtTopOfSection(existing, "Professional Insights", bullet);
    expect(out).toContain(
      "## Professional Insights\n- 5/4/26 — new thought\n- 5/3/26 — beta\n"
    );
    expect(out).toContain("## Self-Improvement\n- 5/3/26 — alpha\n");
  });

  it("inserts into the Other section", () => {
    const existing = buildSkeleton();
    const out = insertAtTopOfSection(existing, "Other", bullet);
    expect(out).toContain("## Other\n- 5/4/26 — new thought\n");
  });

  it("preserves unrelated frontmatter keys", () => {
    const existing =
      "---\ntype: thoughts-master\nfoo: bar\n---\n\n" +
      "## Self-Improvement\n\n## Professional Insights\n\n## Teaching Insights\n\n## Health & Wellness\n\n## Other\n";
    const out = insertAtTopOfSection(existing, "Self-Improvement", bullet);
    expect(out.startsWith("---\ntype: thoughts-master\nfoo: bar\n---\n")).toBe(true);
    expect(out).toContain("## Self-Improvement\n- 5/4/26 — new thought\n");
  });

  it("adds canonical frontmatter if the file has none", () => {
    const existing =
      "## Self-Improvement\n\n## Professional Insights\n\n## Teaching Insights\n\n## Health & Wellness\n\n## Other\n";
    const out = insertAtTopOfSection(existing, "Self-Improvement", bullet);
    expect(out.startsWith("---\ntype: thoughts-master\n---\n")).toBe(true);
    expect(out).toContain("## Self-Improvement\n- 5/4/26 — new thought\n");
  });

  it("appends a missing section at the end if it doesn't exist yet", () => {
    const existing =
      "---\ntype: thoughts-master\n---\n\n" +
      "## Self-Improvement\n- 5/3/26 — alpha\n";
    const out = insertAtTopOfSection(existing, "Other", bullet);
    expect(out).toContain("## Self-Improvement\n- 5/3/26 — alpha\n");
    expect(out).toContain("## Other\n- 5/4/26 — new thought\n");
  });

  it("does NOT alter sibling sections' content order", () => {
    const existing =
      "---\ntype: thoughts-master\n---\n\n" +
      "## Self-Improvement\n- 5/3/26 — alpha\n- 5/2/26 — older\n\n" +
      "## Professional Insights\n\n## Teaching Insights\n\n## Health & Wellness\n\n## Other\n";
    const out = insertAtTopOfSection(existing, "Professional Insights", bullet);
    expect(out).toContain("- 5/3/26 — alpha\n- 5/2/26 — older\n");
  });

  it("inserts into the Teaching Insights section", () => {
    const existing = buildSkeleton();
    const out = insertAtTopOfSection(existing, "Teaching Insights", bullet);
    expect(out).toContain("## Teaching Insights\n- 5/4/26 — new thought\n");
  });

  it("normalizes legacy duplicate frontmatter and glued section headings", () => {
    const existing =
      "---\ntype: thoughts-master\n---\r\n\r\n" +
      "---\r\ntype: thoughts-master\r\n---\r\n\r\n" +
      "## Other- 6/26/26 — glued thought\r\n\r\n" +
      "## Other\r\n- 6/30/26 — later thought\r\n";
    const out = insertAtTopOfSection(existing, "Other", bullet);
    expect(out.match(/type: thoughts-master/g)).toHaveLength(1);
    expect(out.match(/^## Other$/gm)).toHaveLength(1);
    expect(out).not.toContain("## Other-");
    expect(out).toContain(
      "## Other\n- 5/4/26 — new thought\n- 6/26/26 — glued thought\n\n- 6/30/26 — later thought\n"
    );
  });
});
