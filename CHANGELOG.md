# Changelog

All notable changes to QuickEdit will be documented in this file.

This project follows semantic versioning.

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