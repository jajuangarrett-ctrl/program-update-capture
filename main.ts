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
    const openCapture = () => new CaptureModal(this.app, this).open();

    this.addRibbonIcon("folder-plus", "Capture program update", openCapture);

    this.addCommand({
      id: "capture",
      name: "Capture program update",
      callback: openCapture,
    });

    this.registerObsidianProtocolHandler("program-update-capture", openCapture);

    this.app.workspace.onLayoutReady(() => {
      this.recoverMissedAdvancedUriLaunch(openCapture);
    });

    this.addSettingTab(new ProgramUpdateCaptureSettingTab(this.app, this));
  }

  private recoverMissedAdvancedUriLaunch(openCapture: () => void) {
    const advancedUri = (this.app as any).plugins?.getPlugin?.("obsidian-advanced-uri");
    if (advancedUri?.lastParameters?.commandid === `${this.manifest.id}:capture`) {
      setTimeout(openCapture, 250);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
