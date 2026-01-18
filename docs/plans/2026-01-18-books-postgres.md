# Plan: Persist Books in PostgreSQL

## Goals
- Persist indexed book metadata across restarts when PostgreSQL is enabled.
- Keep WebDAV sync indexing compatible with stored metadata.

## TODO
- [x] Add PostgreSQL store for books.
- [x] Wire Postgres store in server bootstrap when `RELITE_DATABASE_URL` is set.
- [x] Update documentation to reflect persistence behavior.
- [ ] Add migration tests for book CRUD with Postgres.

## Notes
- Book content streaming remains WebDAV-based.
