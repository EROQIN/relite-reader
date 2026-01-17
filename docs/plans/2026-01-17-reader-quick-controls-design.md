# Reader Quick Controls & Shortcuts Design

## Overview
Introduce a floating quick-control bar and keyboard shortcuts for common reading adjustments. This improves usability by making key adjustments accessible without opening the full settings panel.

## Goals
- Provide quick controls for theme, font size, layout, and focus.
- Add keyboard shortcuts that map to the same actions.
- Keep controls available even in focus mode.

## Non-goals (MVP)
- Customizable shortcut mapping.
- Advanced gesture controls.

## UX Behavior
- Quick controls appear as a compact floating bar near the bottom-right.
- Buttons: Theme cycle, Font size +/- , Layout toggle, Focus toggle, Settings toggle.
- Keyboard shortcuts:
  - Alt+T: cycle theme
  - Alt+L: toggle layout mode
  - Alt+F: toggle focus mode
  - Alt+S: toggle settings panel
  - Ctrl/Cmd + +/-: adjust font size
- Shortcuts are ignored when typing in inputs or selects.

## Accessibility
- Buttons have text labels and are focusable.
- Shortcut hints appear as small labels when hovered.

## Testing
- Reader page renders quick controls.
- Keyboard handler is smoke-tested (optional). 

