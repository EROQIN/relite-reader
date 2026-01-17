# Plan: Reader Shortcuts Overlay (Design)

## Goal
Make keyboard shortcuts discoverable without leaving the reader by adding a lightweight overlay panel.

## UX Summary
- Add a "Shortcuts" button to the reader toolbar.
- Allow toggling via keyboard ("?").
- Provide a compact list of shortcuts with labels.

## Accessibility
- Overlay uses `aria-modal` semantics and can be dismissed via Escape.
- Keep buttons and labels readable on light and night themes.

## Visual Notes
- Use the existing panel styling with a dimmed backdrop.
- Keep layout minimal: a title, two-column list (action + key).
