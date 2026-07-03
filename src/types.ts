export const SECTIONS = [
  "Self-Improvement",
  "Professional Insights",
  "Teaching Insights",
  "Health & Wellness",
  "Other",
] as const;
export type Section = (typeof SECTIONS)[number];

export interface ThoughtItem {
  section: Section;
  text: string;
}
