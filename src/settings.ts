import { App, PluginSettingTab, Setting } from "obsidian";
import type ProgramUpdateCapturePlugin from "../main";

export interface ProgramUpdateCaptureSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  programsFolderPath: string;
  showAnotherAfterSave: boolean;
  openUpdatedFileAfterSave: boolean;
  lastUsedProgramPath: string;
  customAcronyms: string;
}

export const DEFAULT_SETTINGS: ProgramUpdateCaptureSettings = {
  openaiApiKey: "",
  anthropicApiKey: "",
  programsFolderPath: "02 Programs",
  showAnotherAfterSave: true,
  openUpdatedFileAfterSave: true,
  lastUsedProgramPath: "",
  customAcronyms: "A2MEND, BSSP, CalWORKs, COYA, EOPS, HACU, ISSP, LGBTQIA, SDCCE, VPSS, FJG",
};

export class ProgramUpdateCaptureSettingTab extends PluginSettingTab {
  plugin: ProgramUpdateCapturePlugin;

  constructor(app: App, plugin: ProgramUpdateCapturePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Program Update Capture" });

    new Setting(containerEl)
      .setName("Programs folder path")
      .setDesc("Folder containing one subfolder per program, relative to the vault root.")
      .addText((t) =>
        t
          .setPlaceholder("02 Programs")
          .setValue(this.plugin.settings.programsFolderPath)
          .onChange(async (v) => {
            this.plugin.settings.programsFolderPath = v.trim() || DEFAULT_SETTINGS.programsFolderPath;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show another after save")
      .setDesc("After saving an update, immediately reopen the capture modal.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showAnotherAfterSave).onChange(async (v) => {
          this.plugin.settings.showAnotherAfterSave = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Open updated file after save")
      .setDesc("After saving an update, open the exact program update file that was changed.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.openUpdatedFileAfterSave).onChange(async (v) => {
          this.plugin.settings.openUpdatedFileAfterSave = v;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl("h3", { text: "Voice transcription & AI copy-edit" });

    new Setting(containerEl)
      .setName("OpenAI API key")
      .setDesc("Used by Whisper to transcribe voice captures. Stored locally in plugin data.")
      .addText((t) => {
        t.inputEl.type = "password";
        t
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.openaiApiKey)
          .onChange(async (v) => {
            this.plugin.settings.openaiApiKey = v.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Anthropic API key")
      .setDesc("Used by Claude Haiku to copy-edit captures (clean grammar, preserve meaning). Optional - without it, the raw text is saved as-is.")
      .addText((t) => {
        t.inputEl.type = "password";
        t
          .setPlaceholder("sk-ant-...")
          .setValue(this.plugin.settings.anthropicApiKey)
          .onChange(async (v) => {
            this.plugin.settings.anthropicApiKey = v.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Custom acronyms")
      .setDesc("Comma-separated acronyms and proper nouns the copy-edit pass should preserve verbatim.")
      .addText((t) =>
        t
          .setPlaceholder("BSSP, CalWORKs, ISSP, SDCCE, VPSS")
          .setValue(this.plugin.settings.customAcronyms)
          .onChange(async (v) => {
            this.plugin.settings.customAcronyms = v;
            await this.plugin.saveSettings();
          })
      );
  }
}
