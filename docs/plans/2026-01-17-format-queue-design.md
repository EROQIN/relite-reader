# Plan: Format Expansion + Task Queue (Design)

## Goal
Add a lightweight background task queue to process format-related work and expand supported ebook formats across the app.

## Scope
- Backend task queue with in-memory + file store.
- Format registry used by WebDAV sync and task handlers.
- API to list task status for users.
- Frontend detection + placeholder readers for additional formats.

## Task Flow
- WebDAV sync enqueues a `format` task per book.
- Worker marks task as running/success/error.

## Formats
Add support for: cbz, cbr, cb7, azw, azw3, fb2, rtf, docx.

## UI
- Allow import of these formats.
- Reader displays a clean placeholder for formats without a renderer.
