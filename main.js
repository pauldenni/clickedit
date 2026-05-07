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
  tripleClickToSource: false,
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
      let sequenceStartedInReadMode = false;
      this.registerDomEvent(container, "click", (event) => {
        if (event.detail === 1) {
          sequenceStartedInReadMode = this.isReadingMode(leaf);
        }
        if (!sequenceStartedInReadMode) return;
        if (this.shouldIgnoreDoubleClick(event)) return;
        if (event.detail === 3 && this.settings.tripleClickToSource) {
          this.enterEditModeAtClick(leaf, event, true);
          return;
        }
        if (event.detail === 2 && this.settings.doubleClickToEdit) {
          this.enterEditModeAtClick(leaf, event);
        }
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
  async enterEditMode(leaf, forceSource = false) {
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};
    viewState.state.mode = "source";
    viewState.state.source = forceSource || this.settings.editMode === "source";
    await leaf.setViewState(viewState);
    requestAnimationFrame(() => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) return;
      view.editor.focus();
    });
  }
  /**
   * Enters edit mode and attempts to place the cursor near the clicked content.
   *
   * Instead of reusing mouse coordinates after the view changes, QuickEdit first
   * captures a text anchor from Reading mode, then searches for that text in the
   * editor after switching modes. This is more reliable because rendered
   * Markdown and editor coordinates do not always map cleanly to each other.
   */
  async enterEditModeAtClick(leaf, event, forceSource = false) {
    const anchor = this.getTextAnchorFromClick(event);
    const viewState = leaf.getViewState();
    if (!viewState.state) viewState.state = {};
    viewState.state.mode = "source";
    viewState.state.source = forceSource || this.settings.editMode === "source";
    await leaf.setViewState(viewState);
    requestAnimationFrame(() => {
      const view = leaf.view;
      if (!(view instanceof import_obsidian.MarkdownView)) return;
      const editor = view.editor;
      editor.focus();
      const position = this.findAnchorPosition(editor, anchor);
      if (position) {
        editor.setCursor(position);
        try {
          editor.scrollIntoView(
            {
              from: position,
              to: position
            },
            true
          );
        } catch (e) {
        }
      }
    });
  }
  /**
   * Captures the best available anchor before switching from Reading mode to edit mode.
   *
   * Obsidian often includes `data-line` attributes in rendered preview content.
   * When available, that line number is more reliable than matching text after
   * the rendered DOM is replaced by the editor. Text anchors remain as fallback.
   */
  getTextAnchorFromClick(event) {
    var _a, _b, _c, _d, _e, _f;
    const target = event.target;
    const selectedText = (_b = (_a = window.getSelection()) == null ? void 0 : _a.toString().trim()) != null ? _b : "";
    const block = target == null ? void 0 : target.closest(
      "[data-line], p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th"
    );
    const dataLineElement = target == null ? void 0 : target.closest("[data-line]");
    const rawLine = dataLineElement == null ? void 0 : dataLineElement.getAttribute("data-line");
    const parsedLine = rawLine !== null && rawLine !== void 0 ? Number(rawLine) : null;
    const blockText = (_f = (_e = (_c = block == null ? void 0 : block.textContent) == null ? void 0 : _c.trim()) != null ? _e : (_d = target == null ? void 0 : target.textContent) == null ? void 0 : _d.trim()) != null ? _f : "";
    return {
      line: parsedLine !== null && Number.isFinite(parsedLine) ? parsedLine : null,
      blockText: this.normalizeText(blockText),
      selectedText: this.normalizeText(selectedText)
    };
  }
  /**
   * Finds the editor position that best matches the captured anchor.
   *
   * Preferred path: use Obsidian's rendered `data-line` value and place the
   * cursor on that source line, near the selected word when available.
   * Fallback path: search for the selected text or surrounding block text.
   */
  findAnchorPosition(editor, anchor) {
    const selectedText = anchor.selectedText.toLowerCase();
    if (anchor.line !== null) {
      const line = Math.min(Math.max(anchor.line, 0), editor.lineCount() - 1);
      const rawLine = editor.getLine(line);
      if (selectedText.length > 0) {
        const ch = rawLine.toLowerCase().indexOf(selectedText);
        return { line, ch: ch >= 0 ? ch : 0 };
      }
      return { line, ch: 0 };
    }
    if (!anchor.blockText && !anchor.selectedText) return null;
    const blockText = anchor.blockText.toLowerCase();
    const blockSnippet = blockText.slice(0, 80);
    for (let line = 0; line < editor.lineCount(); line++) {
      const rawLine = editor.getLine(line);
      const normalizedLine = this.normalizeText(rawLine).toLowerCase();
      if (!normalizedLine) continue;
      const selectedMatch = selectedText.length > 0 && normalizedLine.includes(selectedText);
      const blockMatch = blockText.length > 0 && (blockText.includes(normalizedLine) || normalizedLine.includes(blockSnippet));
      if (selectedMatch) {
        const ch = rawLine.toLowerCase().indexOf(selectedText);
        return { line, ch: Math.max(ch, 0) };
      }
      if (blockMatch) {
        return { line, ch: 0 };
      }
    }
    return null;
  }
  normalizeText(text) {
    return text.replace(/\s+/g, " ").trim();
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
    new import_obsidian.Setting(containerEl).setName("Triple-click to Source mode").setDesc("Triple-click a note in Reading mode to enter Source mode directly.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.tripleClickToSource).onChange(async (value) => {
        this.plugin.settings.tripleClickToSource = value;
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
