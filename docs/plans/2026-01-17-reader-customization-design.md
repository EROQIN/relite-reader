# Reader UX & Customization Design

## Overview
This design upgrades the reading experience with a dedicated controls panel and persistent user preferences. Readers can adjust typography, spacing, page width, and theme while reading. Preferences are stored locally for MVP and applied across formats. The UX focuses on calm, distraction-free reading with quick access to customization.

## Goals
- Provide an in-reader settings panel (typography, spacing, theme, alignment).
- Persist preferences locally and apply them across sessions.
- Improve layout for readability (max-width, balanced margins, progress display).
- Keep UI accessible and mobile-friendly.

## Non-goals (MVP)
- Backend preference sync.
- Per-book preferences (global only for now).
- Advanced typography like hyphenation or ligatures.

## Information Architecture
- Reader page
  - Toolbar (title, progress, settings toggle)
  - Reading surface (content area)
  - Settings panel (form controls)

## Preferences Model
- Theme: `paper | sepia | night`
- Font family: `sans | serif | mono`
- Font size: range (14–22)
- Line height: range (1.4–2.0)
- Page width: range (520–900)
- Text align: `left | justify`

## UX Behavior
- Settings toggle opens a panel on the right (drawer on mobile).
- Changes apply immediately to the reading surface.
- Reset button restores defaults.
- Progress remains visible in the toolbar.

## Accessibility
- All inputs have labels and keyboard focus.
- Contrast preserved per theme.
- `prefers-reduced-motion` respected for transitions.

## Testing
- Unit tests for preference store (defaults + persistence).
- Reader controls smoke tests (auth requirement not needed).

