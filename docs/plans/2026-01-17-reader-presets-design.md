# Reader Presets & Per-Book Preferences Design

## Overview
This iteration adds quick presets and per-book overrides so readers can switch between environments (day, night, focus) and optionally keep unique settings per title. The UX extends the existing reader panel with a preset selector and a scope toggle.

## Goals
- Provide built-in presets for fast switching.
- Support per-book preferences when enabled.
- Preserve global defaults when per-book is off.

## Non-goals (MVP)
- Custom named presets.
- Cloud sync of per-book settings.

## UX Behavior
- Preset selector applies a predefined configuration immediately.
- “Apply to this book” toggle switches persistence scope.
- When a book-specific preference exists, it loads automatically on open.

## Data Model
- Global prefs stored under `relite.prefs` (existing).
- Book prefs stored under `relite.prefs.books` keyed by bookId.
- Built-in presets stored in code.

## Testing
- Preference store tests for book overrides and presets.
- Reader page test for preset selector rendering.

