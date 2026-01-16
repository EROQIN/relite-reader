# Backend Core Design (Relite Reader)

## Overview
Relite Reader will run as a single Go service that serves REST APIs and the built React frontend. The service exposes auth endpoints (email/password), issues short-lived JWT access tokens, and guards all library/reader APIs with per-user ownership checks. PostgreSQL (with pgvector) stores users, WebDAV connections, book metadata, reading progress, and preferences. WebDAV credentials are encrypted at rest using a server-side key loaded from environment variables. A background sync worker crawls each user’s WebDAV root, updates the book index, and marks additions/deletions. Reader paths stream content on demand: TXT is normalized server-side, while EPUB/PDF initially stream raw files for frontend rendering, with optional backend parsing and caching later.

## Goals
- Minimal, secure MVP: auth, WebDAV management, library index, reader progress/prefs.
- Single binary deploy with static frontend assets.
- Future-proof for embeddings via pgvector without refactoring core flows.

## Non-goals (MVP)
- Full-text search, highlights, annotations.
- Backend EPUB/PDF rendering (frontend handles initial rendering).

## Architecture
- Go HTTP server (chi or standard mux), JSON REST.
- JWT auth middleware; hashed passwords (bcrypt).
- Data access via sqlc + migrations via goose.
- Background worker for WebDAV sync with rate limiting.

## Data Model (minimum)
- users: email, password_hash, created_at.
- webdav_connections: user_id, base_url, username, encrypted_secret.
- books: user_id, title, author, format, source_path, metadata_json.
- reading_progress: user_id, book_id, location, updated_at.
- user_preferences: user_id, theme, font, background, spacing.
- embeddings (future): user_id, book_id, vector, metadata.

## API Surface (MVP)
- POST /api/auth/register, /api/auth/login
- GET/POST/DELETE /api/webdav
- GET /api/books, GET /api/books/:id
- GET /api/books/:id/content
- PUT /api/books/:id/progress
- GET/PUT /api/user/preferences

## Security
- Never log credentials or tokens.
- Encrypt WebDAV secrets at rest using env key (AES-GCM).
- Strict per-user access checks on all queries.

## Testing
- Unit tests for auth, crypto, data access.
- Integration tests for API flows with test DB.
