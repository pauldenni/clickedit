import {
  App,
  MarkdownView,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} from "obsidian";

interface QuickEditSettings {
  doubleClickToEdit: boolean;
  escapeToReading: boolean;
  editMode: "live-preview" | "source";
  ignoreLinks: boolean;
  ignoreCheckboxes: boolean;
  ignoreCodeBlocks: boolean;
  ignoreInteractiveElements: boolean;
}

const DEFAULT_SETTINGS: QuickEditSettings = {
  doubleClickToEdit: true,
  escapeToReading: true,
  editMode: "live-preview",
  ignoreLinks: true,
  ignoreCheckboxes: true,
  ignoreCodeBlocks: true,
  ignoreInteractiveElements: true,
};

export default class QuickEditPlugin extends Plugin {
  settings: QuickEditSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new QuickEditSettingTab(this.app, this));

    this.addCommand({
      id: "enter-edit-mode",
      name: "Enter edit mode",
      callback: () => this.enterEditModeForActiveLeaf(),
    });

    this.addCommand({
      id: "enter-reading-mode",
      name: "Enter reading mode",
      callback: () => this.enterReadingModeForActiveLeaf(),
    });

    this.addCommand({
      id: "toggle-reading-edit-mode",
      name: "Toggle reading/editing mode",
      callback: () => this.toggleModeForActiveLeaf(),
    });

    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.attachToMarkdownLeaves())
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.attachToMarkdownLeaves())
    );

    this.attachToMarkdownLeaves();
  }

  private attachToMarkdownLeaves() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      const container = view.containerEl;

      if (container.dataset.quickEditAttached === "true") return;
      container.dataset.quickEditAttached = "true";

      this.registerDomEvent(container, "dblclick", (event: MouseEvent) => {
        if (!this.settings.doubleClickToEdit) return;
        if (!this.isReadingMode(leaf)) return;
        if (this.shouldIgnoreDoubleClick(event)) return;

        this.enterEditModeAtClick(leaf, event);
      });

      this.registerDomEvent(container, "keydown", (event: KeyboardEvent) => {
        if (!this.settings.escapeToReading) return;
        if (event.key !== "Escape") return;
        if (!this.isEditMode(leaf)) return;

        this.enterReadingMode(leaf);
      });
    });
  }

  private getActiveMarkdownLeaf(): WorkspaceLeaf | null {
    const leaf = this.app.workspace.activeLeaf;
    if (!leaf || !(leaf.view instanceof MarkdownView)) return null;
    return leaf;
  }

  private enterEditModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;

    this.enterEditMode(leaf);
  }

  private enterReadingModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;

    this.enterReadingMode(leaf);
  }

  private toggleModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;

    if (this.isReadingMode(leaf)) {
      this.enterEditMode(leaf);
    } else {
      this.enterReadingMode(leaf);
    }
  }

  private isReadingMode(leaf: WorkspaceLeaf): boolean {
    const viewState = leaf.getViewState();
    return viewState.state?.mode === "preview";
  }

  private isEditMode(leaf: WorkspaceLeaf): boolean {
    const viewState = leaf.getViewState();
    return viewState.state?.mode === "source";
  }

  private shouldIgnoreDoubleClick(event: MouseEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) return false;

    if (this.settings.ignoreLinks) {
      if (
        target.closest("a") ||
        target.closest(".internal-link") ||
        target.closest(".external-link") ||
        target.closest(".cm-hmd-internal-link") ||
        target.closest(".cm-link")
      ) {
        return true;
      }
    }

    if (this.settings.ignoreCheckboxes) {
      if (target.closest("input[type='checkbox']")) {
        return true;
      }
    }

    if (this.settings.ignoreCodeBlocks) {
      if (
        target.closest("pre") ||
        target.closest("code") ||
        target.closest(".markdown-rendered pre") ||
        target.closest(".markdown-rendered code")
      ) {
        return true;
      }
    }

    if (this.settings.ignoreInteractiveElements) {
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("select") ||
        target.closest("textarea") ||
        target.closest(".collapse-indicator") ||
        target.closest(".callout-fold") ||
        target.closest(".tree-item-icon")
      ) {
        return true;
      }
    }

    return false;
  }

  private async enterEditMode(leaf: WorkspaceLeaf) {
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};

    viewState.state.mode = "source";
    viewState.state.source = this.settings.editMode === "source";

    await leaf.setViewState(viewState);

    requestAnimationFrame(() => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;
      view.editor.focus();
    });
  }

  private async enterEditModeAtClick(leaf: WorkspaceLeaf, event: MouseEvent) {
    const clickEvent = event;

    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};

    viewState.state.mode = "source";
    viewState.state.source = this.settings.editMode === "source";

    await leaf.setViewState(viewState);

    requestAnimationFrame(() => {
      const view = leaf.view;
      if (!(view instanceof MarkdownView)) return;

      const editor = view.editor;
      editor.focus();

      try {
        const position = editor.posAtMouse(clickEvent);
        if (position) editor.setCursor(position);
      } catch {
        // Cursor placement is best-effort.
      }
    });
  }

  private async enterReadingMode(leaf: WorkspaceLeaf) {
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};

    viewState.state.mode = "preview";

    await leaf.setViewState(viewState);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class QuickEditSettingTab extends PluginSettingTab {
  plugin: QuickEditPlugin;

  constructor(app: App, plugin: QuickEditPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "QuickEdit settings" });

    new Setting(containerEl)
      .setName("Double-click to edit")
      .setDesc("Double-click a note in reading mode to enter edit mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.doubleClickToEdit)
          .onChange(async (value) => {
            this.plugin.settings.doubleClickToEdit = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Escape to reading mode")
      .setDesc("Press Escape while editing to return to reading mode.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.escapeToReading)
          .onChange(async (value) => {
            this.plugin.settings.escapeToReading = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Edit mode")
      .setDesc("Choose whether QuickEdit opens notes in Live Preview or Source mode.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("live-preview", "Live Preview")
          .addOption("source", "Source mode")
          .setValue(this.plugin.settings.editMode)
          .onChange(async (value: "live-preview" | "source") => {
            this.plugin.settings.editMode = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore links")
      .setDesc("Do not enter edit mode when double-clicking internal or external links.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreLinks)
          .onChange(async (value) => {
            this.plugin.settings.ignoreLinks = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore checkboxes")
      .setDesc("Do not enter edit mode when double-clicking directly on a checkbox.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreCheckboxes)
          .onChange(async (value) => {
            this.plugin.settings.ignoreCheckboxes = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore code blocks")
      .setDesc("Do not enter edit mode when double-clicking inline code or code blocks.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreCodeBlocks)
          .onChange(async (value) => {
            this.plugin.settings.ignoreCodeBlocks = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ignore interactive elements")
      .setDesc("Do not enter edit mode when double-clicking buttons, inputs, fold controls, or similar UI elements.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.ignoreInteractiveElements)
          .onChange(async (value) => {
            this.plugin.settings.ignoreInteractiveElements = value;
            await this.plugin.saveSettings();
          })
      );
  }
}