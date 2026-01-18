# Plan: Postgres Store Tests

## Goals
- Provide migration/CRUD coverage for Postgres-backed stores.

## TODO
- [x] Add test helper to open a pooled connection from `RELITE_TEST_DATABASE_URL`.
- [x] Add CRUD tests for annotations, bookmarks, books, preferences, progress, tasks, and WebDAV stores.
- [ ] Document the required test database setup in README.

## Notes
- Tests skip when `RELITE_TEST_DATABASE_URL` is not set.
