import { SECTIONS } from "./types";
import type { Section, ThoughtItem } from "./types";

const FRONTMATTER = "---\ntype: thoughts-master\n---";

export function formatDate(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yy = d.getFullYear() % 100;
  return `${m}/${day}/${yy.toString().padStart(2, "0")}`;
}

export function buildSkeleton(): string {
  const headings = SECTIONS.map((s) => `## ${s}\n`).join("\n");
  return `${FRONTMATTER}\n\n${headings}`;
}

export function renderBullet(item: ThoughtItem, capturedAt: Date): string {
  return `- ${formatDate(capturedAt)} — ${formatCapturedText(item.text)}\n`;
}

export function insertAtTopOfSection(
  content: string,
  section: Section,
  bullet: string
): string {
  const ensured = ensureSkeleton(content);
  const { frontmatter, body } = splitFrontmatter(ensured);
  const headingText = `## ${section}`;
  const headingRegex = new RegExp(`^${escapeRegex(headingText)}[ \\t]*$`, "m");

  const match = headingRegex.exec(body);
  if (match) {
    const idx = match.index + match[0].length;
    const insertAt = body.charAt(idx) === "\n" ? idx + 1 : idx;
    return frontmatter + body.slice(0, insertAt) + bullet + body.slice(insertAt);
  }

  const trailing = body.endsWith("\n") ? "" : "\n";
  return `${frontmatter}${body}${trailing}\n${headingText}\n${bullet}`;
}

function ensureSkeleton(content: string): string {
  const normalized = normalizeLineEndings(content);
  if (!normalized.trim()) return buildSkeleton();
  const { frontmatter, body } = splitFrontmatter(normalized);
  const fmPart = frontmatter || `${FRONTMATTER}\n`;
  let result = normalizeLegacyBody(body);
  for (const s of SECTIONS) {
    const headingRegex = new RegExp(`^## ${escapeRegex(s)}[ \\t]*$`, "m");
    if (!headingRegex.test(result)) {
      const trailing = result.endsWith("\n") ? "" : "\n";
      result = `${result}${trailing}\n## ${s}\n`;
    }
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

function normalizeLegacyBody(body: string): string {
  return mergeDuplicateSections(
    repairGluedSectionHeadings(stripDuplicateThoughtsFrontmatter(body))
  );
}

function stripDuplicateThoughtsFrontmatter(body: string): string {
  return body.replace(/(?:^|\n)---\ntype: thoughts-master\n---\n*/g, "\n");
}

function repairGluedSectionHeadings(body: string): string {
  let result = body;
  for (const section of SECTIONS) {
    const regex = new RegExp(`^## ${escapeRegex(section)}-\\s+(.+)$`, "gm");
    result = result.replace(regex, `## ${section}\n- $1`);
  }
  return result;
}

function mergeDuplicateSections(body: string): string {
  const counts = new Map<Section, number>(
    SECTIONS.map((s) => [s, 0] as [Section, number])
  );
  for (const line of body.split("\n")) {
    const section = parseCanonicalSectionHeading(line);
    if (section) counts.set(section, (counts.get(section) || 0) + 1);
  }

  if (![...counts.values()].some((count) => count > 1)) return body;

  const sections = new Map<Section, string[]>(
    SECTIONS.map((s) => [s, []] as [Section, string[]])
  );
  const prefix: string[] = [];
  let current: Section | null = null;

  for (const line of body.split("\n")) {
    const section = parseCanonicalSectionHeading(line);
    if (section) {
      current = section;
      continue;
    }

    if (current) {
      sections.get(current)!.push(line);
    } else {
      prefix.push(line);
    }
  }

  const blocks: string[] = [];
  const cleanedPrefix = trimBlankLines(prefix).join("\n");
  if (cleanedPrefix) blocks.push(cleanedPrefix);

  for (const section of SECTIONS) {
    const lines = trimBlankLines(sections.get(section)!);
    blocks.push(lines.length > 0 ? `## ${section}\n${lines.join("\n")}` : `## ${section}`);
  }

  return `${blocks.join("\n\n")}\n`;
}

function parseCanonicalSectionHeading(line: string): Section | null {
  const match = line.match(/^##[ \t]+(.+?)[ \t]*$/);
  if (!match) return null;
  return (SECTIONS as readonly string[]).includes(match[1])
    ? (match[1] as Section)
    : null;
}

function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start++;
  while (end > start && !lines[end - 1].trim()) end--;
  return lines.slice(start, end);
}

function formatCapturedText(text: string): string {
  const normalized = normalizeLineEndings(text).trim();
  const [first = "", ...rest] = normalized.split("\n");
  if (rest.length === 0) return first;
  return [first, ...rest.map((line) => (line ? `  ${line}` : ""))].join("\n");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
