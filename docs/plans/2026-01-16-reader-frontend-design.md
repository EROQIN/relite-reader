# Reader Frontend Design

**Goal:** Deliver a mobile-first PWA shell with login, library list, and a reader view that supports local imports (EPUB, PDF, TXT) plus MOBI with a client-first and server-fallback flow.

## Scope
- PWA shell with installable manifest and offline shell fallback.
- Login screen (UI only at first; auth API integration later).
- Library list that merges WebDAV and local items with source badges and filters.
- Local import flow for EPUB/PDF/TXT; attempt MOBI in browser first.
- Reader view with theme, font, background, and spacing controls.
- Persist reading progress and preferences locally; prepare for backend sync.

## Non-Goals (for this slice)
- Full backend auth and WebDAV index implementation.
- Deep offline caching of remote WebDAV content.
- LLM/embeddings features.

## UX and Information Architecture
- **Login:** minimalist form with status feedback; CTA to skip for local-only use.
- **Library:** two sections: WebDAV Library and Local Imports; search box and format filter; item actions: open, remove local copy.
- **Reader:** paginated or scroll layout per format; settings drawer for theme and typography; progress indicator.
- UI improvements follow the AGENTS style prompt and are implemented in a new comparison file (no overwrite), to allow before/after review.

## Data Flow
- Local import: user selects file -> detect format -> parse -> store metadata in local storage keyed by a stable hash (name + size + lastModified) -> open reader -> update progress.
- WebDAV: user config -> backend validates -> backend indexes -> frontend lists entries -> open reader by streaming from backend.
- MOBI: client attempts parse; on failure or WebDAV source, call backend conversion endpoint and read returned EPUB.

## Error Handling
- Unsupported format: show message and skip import.
- Parsing failure: show retry plus fallback action for MOBI.
- WebDAV errors: non-blocking banner with retry.
- Conversion failure: clear error message and keep the item in library.

## Testing Strategy
- Unit tests for format detection and metadata extraction.
- Component tests for settings UI state and progress updates.
- Integration tests for local import -> open -> save progress.
- Fixture set: small EPUB/PDF/TXT and one broken MOBI to validate fallback.

## Dependencies and Risks
- Client EPUB: use a stable renderer (e.g., epubjs).
- PDF: use pdfjs-dist.
- MOBI: best-effort client parser; fallback to backend using ebook-convert (calibre).
- PWA: minimal manifest + service worker for offline shell only.

## Milestones
1) PWA shell + login + library list UI.
2) Local import + EPUB/PDF/TXT reader.
3) MOBI fallback flow via backend conversion API.
4) Preferences persistence and reader polish.
