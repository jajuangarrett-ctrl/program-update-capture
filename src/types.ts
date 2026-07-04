export interface ProgramFolder {
  name: string;
  path: string;
}

export interface ProgramUpdateItem {
  program: ProgramFolder;
  text: string;
}
