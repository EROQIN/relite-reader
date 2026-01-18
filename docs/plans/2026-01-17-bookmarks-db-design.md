# Plan: Bookmarks + DB Progress (Design)

## Goal
Persist reading progress and bookmarks in PostgreSQL when configured, with a clean reader UI to manage bookmarks.

## Scope
- Postgres progress store with upsert.
- Bookmarks package (memory + Postgres).
- Bookmark API endpoints.
- TXT reader bookmark UI + API sync.

## Endpoints
- `GET /api/bookmarks/{bookId}`
- `POST /api/bookmarks/{bookId}`
- `DELETE /api/bookmarks/{bookId}/{bookmarkId}`

## Behavior
- Progress uses local storage immediately and syncs to DB when authenticated.
- Bookmarks sync to DB when authenticated; local fallback when not.
