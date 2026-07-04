import { describe, it, expect } from "vitest";
import {
  buildSkeleton,
  formatDate,
  insertAtTopOfUpdates,
  renderUpdate,
  targetUpdateFilePath,
  updateFileName,
} from "./markdown";
import type { ProgramUpdateItem } from "./types";

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
  it("creates a program update file with frontmatter and heading", () => {
    expect(buildSkeleton("BSSP")).toBe(
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
        "# BSSP Updates\n"
    );
  });
});

describe("program file paths", () => {
  it("builds the expected update file name", () => {
    expect(updateFileName("BSSP")).toBe("BSSP Updates.md");
  });

  it("builds the update path inside the selected program folder", () => {
    expect(
      targetUpdateFilePath({ name: "BSSP", path: "02 Programs/BSSP" })
    ).toBe("02 Programs/BSSP/BSSP Updates.md");
    expect(
      targetUpdateFilePath({
        name: "Student Support Services",
        path: "/02 Programs/Student Support Services/",
      })
    ).toBe(
      "02 Programs/Student Support Services/Student Support Services Updates.md"
    );
  });
});

describe("renderUpdate", () => {
  it("renders a bullet with the captured date and text", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "Prepared fall outreach plan",
    };
    expect(renderUpdate(item, MAY_4)).toBe(
      "- 5/4/26 — Prepared fall outreach plan\n"
    );
  });

  it("trims whitespace from the text", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "  spacy update  ",
    };
    expect(renderUpdate(item, MAY_4)).toBe("- 5/4/26 — spacy update\n");
  });

  it("indents multiline text so it stays inside one update bullet", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "Key takeaways\n- first\n\nplain follow-up",
    };
    expect(renderUpdate(item, MAY_4)).toBe(
      "- 5/4/26 — Key takeaways\n  - first\n\n  plain follow-up\n"
    );
  });
});

describe("insertAtTopOfUpdates", () => {
  const update = "- 5/4/26 — new update\n";

  it("creates skeleton + update under the program heading when file is empty", () => {
    expect(insertAtTopOfUpdates("", "BSSP", update)).toBe(
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
        "# BSSP Updates\n- 5/4/26 — new update\n"
    );
  });

  it("inserts at the top when the file already has updates", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "# BSSP Updates\n- 5/3/26 — earlier update\n";
    expect(insertAtTopOfUpdates(existing, "BSSP", update)).toBe(
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
        "# BSSP Updates\n- 5/4/26 — new update\n- 5/3/26 — earlier update\n"
    );
  });

  it("preserves notes below the update list", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "# BSSP Updates\n- 5/3/26 — alpha\n\n## Parking Lot\n- keep this\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out).toContain(
      "# BSSP Updates\n- 5/4/26 — new update\n- 5/3/26 — alpha\n"
    );
    expect(out).toContain("## Parking Lot\n- keep this\n");
  });

  it("preserves unrelated frontmatter keys", () => {
    const existing =
      "---\ntype: program-updates\nfoo: bar\n---\n\n" +
      "# BSSP Updates\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out.startsWith("---\ntype: program-updates\nfoo: bar\n---\n")).toBe(true);
    expect(out).toContain("# BSSP Updates\n- 5/4/26 — new update\n");
  });

  it("adds canonical frontmatter if the file has none", () => {
    const existing = "# BSSP Updates\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out.startsWith("---\ntype: program-updates\nprogram: \"BSSP\"\n---\n")).toBe(true);
    expect(out).toContain("# BSSP Updates\n- 5/4/26 — new update\n");
  });

  it("adds the program heading if it is missing", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "Loose note\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out).toContain(
      "# BSSP Updates\n- 5/4/26 — new update\nLoose note\n"
    );
  });

  it("normalizes duplicate program update frontmatter", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\r\n\r\n" +
      "---\r\ntype: program-updates\r\nprogram: \"BSSP\"\r\n---\r\n\r\n" +
      "# BSSP Updates\r\n- 6/30/26 — later update\r\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out.match(/type: program-updates/g)).toHaveLength(1);
    expect(out).toContain(
      "# BSSP Updates\n- 5/4/26 — new update\n- 6/30/26 — later update\n"
    );
  });
});
