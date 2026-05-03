var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => QuickEditPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  doubleClickToEdit: true,
  escapeToReading: true,
  editMode: "live-preview",
  ignoreCodeBlocks: true,
  ignoreInteractiveElements: true
};
var QuickEditPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings", DEFAULT_SETTINGS);
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new QuickEditSettingTab(this.app, this));
    this.addCommand({
      id: "enter-edit-mode",
      name: "Enter edit mode",
      callback: () => this.enterEditModeForActiveLeaf()
    });
    this.addCommand({
      id: "enter-reading-mode",
      name: "Enter reading mode",
      callback: () => this.enterReadingModeForActiveLeaf()
    });
    this.addCommand({
      id: "toggle-reading-edit-mode",
      name: "Toggle reading/editing mode",
      callback: () => this.toggleModeForActiveLeaf()
    });
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.attachToMarkdownLeaves())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.attachToMarkdownLeaves())
    );
    this.attachToMarkdownLeaves();
  }
  /**
   * Attaches QuickEdit event handlers to Markdown leaves.
   * Uses a dataset flag to prevent duplicate listeners on the same container.
   */
  attachToMarkdownLeaves() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) return;
      const container = view.containerEl;
      if (container.dataset.quickEditAttached === "true") return;
      container.dataset.quickEditAttached = "true";
      this.registerDomEvent(container, "dblclick", (event) => {
        if (!this.settings.doubleClickToEdit) return;
        if (!this.isReadingMode(leaf)) return;
        if (this.shouldIgnoreDoubleClick(event)) return;
        this.enterEditModeAtClick(leaf, event);
      });
      this.registerDomEvent(container, "keydown", (event) => {
        if (!this.settings.escapeToReading) return;
        if (event.key !== "Escape") return;
        if (!this.isEditMode(leaf)) return;
        this.enterReadingMode(leaf);
      });
    });
  }
  getActiveMarkdownLeaf() {
    const leaf = this.app.workspace.activeLeaf;
    if (!leaf || !(leaf.view instanceof import_obsidian.MarkdownView)) return null;
    return leaf;
  }
  enterEditModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;
    this.enterEditMode(leaf);
  }
  enterReadingModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;
    this.enterReadingMode(leaf);
  }
  toggleModeForActiveLeaf() {
    const leaf = this.getActiveMarkdownLeaf();
    if (!leaf) return;
    if (this.isReadingMode(leaf)) {
      this.enterEditMode(leaf);
    } else {
      this.enterReadingMode(leaf);
    }
  }
  isReadingMode(leaf) {
    var _a;
    const viewState = leaf.getViewState();
    return ((_a = viewState.state) == null ? void 0 : _a.mode) === "preview";
  }
  isEditMode(leaf) {
    var _a;
    const viewState = leaf.getViewState();
    return ((_a = viewState.state) == null ? void 0 : _a.mode) === "source";
  }
  /**
   * Determines whether QuickEdit should ignore a double-click.
   *
   * Links and checkboxes are always protected because they already have
   * expected Obsidian behavior. Code blocks and other interactive elements
   * remain configurable.
   */
  shouldIgnoreDoubleClick(event) {
    const target = event.target;
    if (!target) return false;
    if (target.closest("a") || target.closest(".internal-link") || target.closest(".external-link") || target.closest(".cm-hmd-internal-link") || target.closest(".cm-link")) {
      return true;
    }
    if (target.closest("input[type='checkbox']")) {
      return true;
    }
    if (this.settings.ignoreCodeBlocks) {
      if (target.closest("pre") || target.closest("code") || target.closest(".markdown-rendered pre") || target.closest(".markdown-rendered code")) {
        return true;
      }
    }
    if (this.settings.ignoreInteractiveElements) {
      const input = target.closest("input");
      if (input && input.getAttribute("type") !== "checkbox") {
        return true;
      }
      if (target.closest("button") || target.closest("select") || target.closest("textarea") || target.closest(".collapse-indicator") || target.closest(".callout-fold") || target.closest(".tree-item-icon")) {
        return true;
      }
    }
    return false;
  }
  /**
   * Enters edit mode without cursor positioning.
   * Used by command palette actions.
   */
  async enterEditMode(leaf) {
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};
    viewState.state.mode = "source";
    viewState.state.source = this.settings.editMode === "source";
    await leaf.setViewState(viewState);
    requestAnimationFrame(() => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) return;
      view.editor.focus();
    });
  }
  /**
   * Enters edit mode and attempts to place the cursor near the click location.
   * Cursor placement is best-effort because rendered Markdown does not always
   * map perfectly to editor positions.
   */
  async enterEditModeAtClick(leaf, event) {
    const clickEvent = event;
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};
    viewState.state.mode = "source";
    viewState.state.source = this.settings.editMode === "source";
    await leaf.setViewState(viewState);
    requestAnimationFrame(() => {
      var _a, _b, _c;
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) return;
      const editor = view.editor;
      editor.focus();
      try {
        const cmEditor = editor.cm;
        const position = (_c = (_a = cmEditor == null ? void 0 : cmEditor.posAtCoords) == null ? void 0 : _a.call(cmEditor, { left: clickEvent.clientX, top: clickEvent.clientY })) != null ? _c : (_b = cmEditor == null ? void 0 : cmEditor.coordsChar) == null ? void 0 : _b.call(cmEditor, { left: clickEvent.clientX, top: clickEvent.clientY });
        if (position) editor.setCursor(position);
      } catch (e) {
      }
    });
  }
  async enterReadingMode(leaf) {
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
};
var QuickEditSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "QuickEdit settings" });
    new import_obsidian.Setting(containerEl).setName("Double-click to edit").setDesc("Double-click a note in Reading mode to enter edit mode.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.doubleClickToEdit).onChange(async (value) => {
        this.plugin.settings.doubleClickToEdit = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Escape to Reading mode").setDesc("Press Escape while editing to return to Reading mode.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.escapeToReading).onChange(async (value) => {
        this.plugin.settings.escapeToReading = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Edit mode").setDesc("Choose whether QuickEdit opens notes in Live Preview or Source mode.").addDropdown(
      (dropdown) => dropdown.addOption("live-preview", "Live Preview").addOption("source", "Source mode").setValue(this.plugin.settings.editMode).onChange(async (value) => {
        this.plugin.settings.editMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Ignore code blocks").setDesc("Do not enter edit mode when double-clicking inline code or code blocks.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ignoreCodeBlocks).onChange(async (value) => {
        this.plugin.settings.ignoreCodeBlocks = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Ignore interactive elements").setDesc("Do not enter edit mode when double-clicking buttons, inputs, fold controls, or similar UI elements.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.ignoreInteractiveElements).onChange(async (value) => {
        this.plugin.settings.ignoreInteractiveElements = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
