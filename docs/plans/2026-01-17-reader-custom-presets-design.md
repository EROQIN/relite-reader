# Plan: Reader Custom Presets (Design)

## Goal
Give readers a fast way to save, apply, rename, and delete their own reading presets so personalization feels frictionless across sessions.

## UX Summary
- Add a custom presets section inside the reader settings panel.
- Allow saving the current configuration with a user-provided name.
- Surface saved presets in both the preset selector and a small management list with apply + delete actions.
- Allow renaming an existing custom preset without leaving the panel.

## States
- Empty state: show a short message when no custom presets exist.
- Validation: disable save/rename when the name is empty or whitespace.
- Apply: selecting a preset immediately updates the reader.

## Data + Persistence
- Store custom presets in local storage (list of `ReaderPreset` objects).
- Keep built-in presets unchanged; custom presets are appended for selection.

## Accessibility
- Use standard inputs/buttons with labels.
- Keep tap targets consistent with existing 44px minimums.

## Visual Notes
- Use the existing panel styles, with a subtle divider for the custom presets area.
- Keep list rows compact but readable.
