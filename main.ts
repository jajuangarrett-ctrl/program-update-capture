import { Plugin } from "obsidian";
import {
  ProgramUpdateCaptureSettings,
  ProgramUpdateCaptureSettingTab,
  DEFAULT_SETTINGS,
} from "./src/settings";
import { CaptureModal } from "./src/CaptureModal";

export default class ProgramUpdateCapturePlugin extends Plugin {
  settings: ProgramUpdateCaptureSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon("folder-plus", "Capture program update", () => {
      new CaptureModal(this.app, this).open();
    });

    this.addCommand({
      id: "capture",
      name: "Capture program update",
      callback: () => new CaptureModal(this.app, this).open(),
    });

    this.registerObsidianProtocolHandler("program-update-capture", () => {
      new CaptureModal(this.app, this).open();
    });

    this.addSettingTab(new ProgramUpdateCaptureSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
