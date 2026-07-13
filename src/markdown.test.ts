import { describe, it, expect } from "vitest";
import {
  buildSkeleton,
  insertAtTopOfUpdates,
  renderUpdate,
  targetUpdateFilePath,
  updateFileName,
} from "./markdown";
import type { ProgramUpdateItem } from "./types";

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
  it("renders a date-free running-list bullet", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "Prepared fall outreach plan",
    };
    expect(renderUpdate(item)).toBe("- Prepared fall outreach plan\n");
  });

  it("trims whitespace from the text", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "  spacy update  ",
    };
    expect(renderUpdate(item)).toBe("- spacy update\n");
  });

  it("indents multiline text so it stays inside one update bullet", () => {
    const item: ProgramUpdateItem = {
      program: { name: "BSSP", path: "02 Programs/BSSP" },
      text: "Key takeaways\n- first\n\nplain follow-up",
    };
    expect(renderUpdate(item)).toBe(
      "- Key takeaways\n  - first\n\n  plain follow-up\n"
    );
  });
});

describe("insertAtTopOfUpdates", () => {
  const update = "- new update\n";

  it("creates skeleton + update under the program heading when file is empty", () => {
    expect(insertAtTopOfUpdates("", "BSSP", update)).toBe(
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
        "# BSSP Updates\n- new update\n"
    );
  });

  it("inserts at the top when the file already has updates", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "# BSSP Updates\n- 5/3/26 — earlier update\n";
    expect(insertAtTopOfUpdates(existing, "BSSP", update)).toBe(
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
        "# BSSP Updates\n- new update\n- earlier update\n"
    );
  });

  it("preserves notes below the update list", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "# BSSP Updates\n- 5/3/26 — alpha\n\n## Parking Lot\n- keep this\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out).toContain(
      "# BSSP Updates\n- new update\n- alpha\n"
    );
    expect(out).toContain("## Parking Lot\n- keep this\n");
  });

  it("preserves unrelated frontmatter keys", () => {
    const existing =
      "---\ntype: program-updates\nfoo: bar\n---\n\n" +
      "# BSSP Updates\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out.startsWith("---\ntype: program-updates\nfoo: bar\n---\n")).toBe(true);
    expect(out).toContain("# BSSP Updates\n- new update\n");
  });

  it("adds canonical frontmatter if the file has none", () => {
    const existing = "# BSSP Updates\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out.startsWith("---\ntype: program-updates\nprogram: \"BSSP\"\n---\n")).toBe(true);
    expect(out).toContain("# BSSP Updates\n- new update\n");
  });

  it("adds the program heading if it is missing", () => {
    const existing =
      "---\ntype: program-updates\nprogram: \"BSSP\"\n---\n\n" +
      "Loose note\n";
    const out = insertAtTopOfUpdates(existing, "BSSP", update);
    expect(out).toContain(
      "# BSSP Updates\n- new update\nLoose note\n"
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
      "# BSSP Updates\n- new update\n- later update\n"
    );
  });
});
