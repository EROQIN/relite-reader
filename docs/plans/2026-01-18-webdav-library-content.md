# Plan: WebDAV Library List + Content Streaming

## Goals
- Surface WebDAV-indexed books in the library UI.
- Stream text-based formats from WebDAV on demand.

## TODO
- [x] Add connection_id to books and persist in stores.
- [x] Add WebDAV content fetch to backend and expose `/books/{id}/content`.
- [x] Fetch WebDAV book list in frontend and show in library.
- [x] Enable TXT/Markdown/HTML readers to fetch remote content when missing.
- [x] Update tests and docs.

## Notes
- Content streaming currently targets text-based formats only.
