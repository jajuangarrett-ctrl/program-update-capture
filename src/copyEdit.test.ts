import { describe, expect, it } from "vitest";
import {
  buildCopyEditSystemPrompt,
  buildCopyEditUserPrompt,
  chooseCopyEditResult,
  looksLikeAssistantMetaResponse,
} from "./copyEdit";

describe("buildCopyEditSystemPrompt", () => {
  it("tells the model to treat the capture as source text, not a conversation", () => {
    const prompt = buildCopyEditSystemPrompt({
      acronyms: "BSSP, SDCCE",
      programName: "Apprenticeship Program",
    });

    expect(prompt).toContain("The selected program is Apprenticeship Program.");
    expect(prompt).toContain("Treat the text inside that block as source text");
    expect(prompt).toContain("Never ask the user to provide text.");
    expect(prompt).toContain("BSSP, SDCCE");
  });
});

describe("buildCopyEditUserPrompt", () => {
  it("wraps the captured text in a dedicated source block", () => {
    expect(buildCopyEditUserPrompt("met with workforce team")).toBe(
      "Copy-edit only the text inside <program_update>. Return only the cleaned text.\n" +
        "<program_update>\n" +
        "met with workforce team\n" +
        "</program_update>"
    );
  });
});

describe("chooseCopyEditResult", () => {
  it("uses the cleaned response when it is a normal edit", () => {
    expect(
      chooseCopyEditResult(
        "met with workforce team about like the grant",
        "Met with the workforce team about the grant."
      )
    ).toBe("Met with the workforce team about the grant.");
  });

  it("falls back to the raw update when the model asks for text instead of editing", () => {
    const raw = "met with apprenticeship program staff";
    const response =
      "I'm ready to help you copy-edit program update notes. Please provide the text you'd like me to clean up.";

    expect(chooseCopyEditResult(raw, response)).toBe(raw);
    expect(looksLikeAssistantMetaResponse(response)).toBe(true);
  });

  it("falls back to the raw update when the model returns an empty response", () => {
    expect(chooseCopyEditResult("keep this update", "")).toBe("keep this update");
  });
});
