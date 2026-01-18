# Plan: Annotations Backend (Highlights + Notes)

## Goals
- Persist highlights/notes per book with timestamps.
- Provide CRUD APIs for annotations.

## TODO
- [x] Add annotations model + store interface.
- [x] Implement memory + Postgres stores.
- [x] Add annotations HTTP handler + routes.
- [x] Add backend tests for handlers and stores.
- [x] Update API docs.

## Notes
- Requires auth; payload must include a quote or note.
