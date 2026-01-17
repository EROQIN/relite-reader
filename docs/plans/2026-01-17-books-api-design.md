# Books API Design (Read-Only MVP)

## Overview
Add a minimal, authenticated Books API so clients can list the indexed library created by WebDAV sync. The API returns per-user book records (title, author, format, source_path, missing, updated_at). This is intentionally read-only: creation and updates happen through sync, not via the API.

## Goals
- Provide a stable `/api/books` GET endpoint for listing a user’s indexed books.
- Keep response shape aligned with the in-memory `books` store fields.
- Reuse existing JWT auth flow and handler patterns.

## Non-goals (MVP)
- Book upload or manual book edits.
- Deep metadata parsing beyond filename-derived fields.
- Pagination, filtering, or search (can come later).

## Architecture
- Add a `BooksHandler` in `backend/internal/http/handlers` that reads the authenticated user ID and returns `books.Store.ListByUser` results.
- Extract common helper utilities (auth extraction + JSON responses) from WebDAV handler for reuse.
- Wire `/api/books` into the existing router that already handles auth + WebDAV.

## API Contract
- `GET /api/books` (auth required)
  - 200: array of books with fields: `id`, `title`, `author`, `format`, `source_path`, `missing`, `updated_at`.
  - 401: missing/invalid token.

## Error Handling
- Auth failures return 401.
- Store errors return 500 with no sensitive details.

## Testing
- Handler tests: auth required; list returns 200 with book entries.
- Router test: `/api/books` is wired.

