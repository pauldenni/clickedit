# Changelog

All notable changes to ClickEdit will be documented in this file.

This project follows semantic versioning.

---

## [1.1.0] - 2026-05-07

### Added
- Triple-click to Source mode: triple-clicking in Reading mode now enters Source mode directly (disabled by default, toggle in settings)

---

## [1.0.0] - 2026-05-02

### Added
- Improved cursor placement using text anchoring and data-line mapping
- Scroll recovery after entering edit mode for smoother transitions

### Changed
- Simplified settings by removing low-impact options
- Improved consistency and predictability of double-click behavior

### Notes
- Cursor placement is best-effort due to differences between Reading and Edit modesg

---

## [0.2.2] - 2026-05-02

### Fixed
- Resolved issue where checkbox behavior was incorrectly overridden by broader interactive element handling
- Improved consistency of double-click behavior across different UI elements

### Changed
- Removed "Ignore links" and "Ignore checkboxes" settings
- Links and checkboxes are now always protected to preserve native Obsidian behavior

### Improved
- Simplified settings panel by removing low-impact configuration options
- Clarified interaction model to better align with user expectations
- Improved internal handling of interactive elements to avoid unintended overrides

---

## [0.2.1] - 2026-05-02

### Added
- Improved README with inline images and demo GIF
- Added LICENSE file
- Added CHANGELOG

### Improved
- Added inline documentation/comments throughout codebase
- Refined manual installation instructions

---

## [0.2.0] - 2026-05-01

### Added
- Settings panel with configurable behavior:
  - Double-click to edit toggle
  - Escape to return to reading mode
  - Edit mode selection (Live Preview / Source)
  - Ignore links
  - Ignore checkboxes
  - Ignore code blocks
  - Ignore interactive elements
- Command palette commands:
  - Enter edit mode
  - Enter reading mode
  - Toggle mode
- Cursor placement at click location when entering edit mode

### Improved
- More reliable event handling using `registerDomEvent`
- Prevents double-click behavior while already in edit mode
- Safer handling of UI elements (links, buttons, etc.)

---

## [0.1.0] - Initial release

### Added
- Double-click to enter edit mode
- Escape key to return to reading mode
- Basic mode switching between preview and source