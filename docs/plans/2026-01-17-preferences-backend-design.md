# Plan: Backend Preferences Storage + API (Design)

## Goal
Persist per-user reader preferences on the backend via authenticated APIs so preferences survive across devices.

## Scope
- Add preferences domain model and store interface.
- Provide an in-memory store with optional JSON file persistence.
- Expose authenticated API endpoints to get/update preferences.

## Endpoints
- `GET /api/preferences` -> returns current preferences with defaults applied.
- `PUT /api/preferences` -> replaces preferences payload for the user.

## Data Model
- Reader preferences align with frontend fields: theme, font, fontSize, lineHeight, pageWidth, textAlign, layoutMode, focusMode, readingSpeed, background, brightness.

## Defaults & Validation
- Backend normalizes missing fields with defaults.
- Clamp numeric ranges to sane bounds to avoid invalid values.

## Notes
- Storage defaults to memory; optional JSON file path uses `RELITE_DATA_DIR`.
