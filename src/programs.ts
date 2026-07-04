import { App, normalizePath, TFolder } from "obsidian";
import type { ProgramFolder } from "./types";

export function listProgramFolders(
  app: App,
  programsFolderPath: string
): ProgramFolder[] {
  const rootPath = normalizePath(programsFolderPath.trim() || "02 Programs");
  const root = app.vault.getAbstractFileByPath(rootPath);
  if (!(root instanceof TFolder)) return [];

  return root.children
    .filter((child): child is TFolder => child instanceof TFolder)
    .filter((folder) => !folder.name.startsWith("."))
    .map((folder) => ({
      name: folder.name,
      path: folder.path,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
}
