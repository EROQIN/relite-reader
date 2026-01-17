# Plan: Reading Progress Sync (Design)

## Goal
Persist reading progress on the backend and sync across devices while keeping local storage as a fast fallback.

## Scope
- Backend progress store + API endpoints.
- Frontend progress API helper.
- TXT reader sync with debounce.

## Endpoints
- `GET /api/progress/{bookId}` -> current progress.
- `PUT /api/progress/{bookId}` -> update progress.

## Behavior
- Load local progress first, then merge remote if available.
- Save progress locally immediately and remotely with debounce when authenticated.

## Notes
- Keep the interface minimal; do not block reading UI on network operations.
