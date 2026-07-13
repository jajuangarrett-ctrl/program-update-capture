import type { ProgramFolder, ProgramUpdateItem } from "./types";

const FRONTMATTER_TYPE = "program-updates";

export function updateFileName(programName: string): string {
  return `${programName} Updates.md`;
}

export function targetUpdateFilePath(program: ProgramFolder): string {
  const folderPath = trimSlashes(program.path);
  const fileName = updateFileName(program.name);
  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function buildSkeleton(programName: string): string {
  return `${buildFrontmatter(programName)}\n\n# ${programName} Updates\n`;
}

export function renderUpdate(item: ProgramUpdateItem): string {
  return `- ${formatCapturedText(item.text)}\n`;
}

export function insertAtTopOfUpdates(
  content: string,
  programName: string,
  update: string
): string {
  const ensured = ensureProgramFile(content, programName);
  const { frontmatter, body } = splitFrontmatter(ensured);
  const headingRegex = programHeadingRegex(programName);

  const match = headingRegex.exec(body);
  if (match) {
    const idx = match.index + match[0].length;
    const insertAt = body.charAt(idx) === "\n" ? idx + 1 : idx;
    return frontmatter + body.slice(0, insertAt) + update + body.slice(insertAt);
  }

  const trailing = body.endsWith("\n") ? "" : "\n";
  return `${frontmatter}${body}${trailing}\n# ${programName} Updates\n${update}`;
}

function ensureProgramFile(content: string, programName: string): string {
  const normalized = normalizeLineEndings(content);
  if (!normalized.trim()) return buildSkeleton(programName);
  const { frontmatter, body } = splitFrontmatter(normalized);
  const fmPart = frontmatter || `${buildFrontmatter(programName)}\n`;
  let result = stripLegacyUpdateDates(stripDuplicateProgramFrontmatter(body));

  if (!programHeadingRegex(programName).test(result)) {
    const existingBody = result.replace(/^\n+/, "");
    result = existingBody
      ? `# ${programName} Updates\n${existingBody}`
      : `# ${programName} Updates\n`;
  }

  if (!body.startsWith("\n") && !fmPart.endsWith("\n\n")) {
    return `${fmPart}\n${result}`;
  }
  return `${fmPart}${result}`;
}

function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  const match = content.match(/^---\n[\s\S]*?\n---\n?/);
  if (!match) return { frontmatter: "", body: content };
  return { frontmatter: match[0], body: content.slice(match[0].length) };
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n?/g, "\n");
}

function stripDuplicateProgramFrontmatter(body: string): string {
  return body.replace(
    /(?:^|\n)---\ntype: program-updates\n[\s\S]*?\n---\n*/g,
    "\n"
  );
}

function stripLegacyUpdateDates(body: string): string {
  return body.replace(
    /^- \d{1,2}\/\d{1,2}\/\d{2} —[ \t]*/gm,
    "- "
  );
}

function formatCapturedText(text: string): string {
  const normalized = normalizeLineEndings(text).trim();
  const [first = "", ...rest] = normalized.split("\n");
  if (rest.length === 0) return first;
  return [first, ...rest.map((line) => (line ? `  ${line}` : ""))].join("\n");
}

function buildFrontmatter(programName: string): string {
  return `---\ntype: ${FRONTMATTER_TYPE}\nprogram: ${JSON.stringify(programName)}\n---`;
}

function programHeadingRegex(programName: string): RegExp {
  return new RegExp(`^# ${escapeRegex(programName)} Updates[ \\t]*$`, "m");
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
