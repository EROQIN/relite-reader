# Plan: Persist WebDAV Connections in PostgreSQL

## Goals
- Persist WebDAV connections across restarts when PostgreSQL is enabled.
- Keep WebDAV sync scheduler compatible with stored connections.

## TODO
- [x] Add PostgreSQL store for WebDAV connections.
- [x] Wire Postgres store in server bootstrap when `RELITE_DATABASE_URL` is set.
- [x] Update documentation to reflect persistence behavior.
- [ ] Add migration tests for connection CRUD with Postgres.

## Notes
- Books remain in-memory for now; only connection metadata persists.
