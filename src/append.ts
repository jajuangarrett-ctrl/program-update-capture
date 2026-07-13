import { App, normalizePath, TFile } from "obsidian";
import {
  insertAtTopOfUpdates,
  renderUpdate,
  targetUpdateFilePath,
} from "./markdown";
import type { ProgramUpdateItem } from "./types";

export async function appendProgramUpdate(
  app: App,
  item: ProgramUpdateItem
): Promise<string> {
  const path = normalizePath(targetUpdateFilePath(item.program));
  await ensureParentFolder(app, path);
  const update = renderUpdate(item);
  const file = app.vault.getAbstractFileByPath(path);

  if (file instanceof TFile) {
    const current = await app.vault.read(file);
    const next = insertAtTopOfUpdates(current, item.program.name, update);
    await app.vault.modify(file, next);
    return path;
  }

  if (file) {
    throw new Error(`Update path is not a file: ${path}`);
  }

  const seeded = insertAtTopOfUpdates("", item.program.name, update);
  await app.vault.create(path, seeded);
  return path;
}

async function ensureParentFolder(app: App, path: string): Promise<void> {
  const parent = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  if (!parent) return;
  const normalized = normalizePath(parent);
  if (!app.vault.getAbstractFileByPath(normalized)) {
    await app.vault.createFolder(normalized);
  }
}
