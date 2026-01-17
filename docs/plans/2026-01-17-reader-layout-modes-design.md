# Reader Layout Modes & Focus Design

## Overview
Add layout modes and focus mode to deepen customization. Layout modes let readers choose single-column or multi-column reading on wide screens. Focus mode reduces chrome (toolbar + settings) for immersive reading while keeping an exit control.

## Goals
- Provide layout toggle: single vs multi-column.
- Provide focus mode to reduce distractions.
- Persist choices via reader preferences.

## Non-goals (MVP)
- Dynamic per-format reflow logic for fixed layouts.
- Custom column widths per page.

## UX Behavior
- Layout mode appears in settings panel; applies immediately.
- Focus mode hides the toolbar and settings panel, shows a small floating button to exit.
- Preferences persist across sessions.

## Data Model
- Add `layoutMode: 'single' | 'columns'` and `focusMode: boolean` to reader prefs.

## Testing
- Reader prefs tests cover new fields.
- Reader page test ensures focus toggle renders.

