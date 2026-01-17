# WebDAV Sync & Book Index Design

## Overview
This design adds a minimal WebDAV sync pipeline that converts remote directory listings into a per-user book index, plus a background scheduler to keep it fresh. The WebDAV client interface is extended to return entries (path, size, mod time), which the sync service uses to upsert book records and mark missing items. A lightweight in-memory books store mirrors the current MVP pattern (similar to users/webdav stores) and keeps the system testable without introducing Postgres yet.

## Goals
- Maintain a per-user book index derived from WebDAV listings.
- Support manual sync (existing endpoint) and periodic sync (ticker).
- Record missing files without deleting history.
- Keep interfaces small and easy to swap to Postgres later.

## Non-goals (MVP)
- Deep metadata extraction or format parsing during sync.
- Full WebDAV adapter implementation (use stubbed client in tests).
- Cross-user sharing or public library features.

## Architecture
- `books` package: in-memory store, `Book` model, upsert + mark-missing operations.
- `webdav` package: extend `Client` to return `[]Entry`; `Service.Sync` updates book index and sync status.
- `webdav` scheduler: ticker-driven loop that calls `SyncAll` over all connections.
- `main`: wire books store + scheduler, read `RELITE_WEB_DAV_SYNC_INTERVAL` with a sane default.

## Data Model (in-memory MVP)
- `Book`: `ID`, `UserID`, `Title`, `Author`, `Format`, `SourcePath`, `Missing`, `UpdatedAt`.
- `Connection`: add `LastSyncAt` for visibility.

## Sync Flow
1. Fetch connection by ID.
2. Decrypt secret.
3. Client lists entries (paths + metadata).
4. Upsert books by `SourcePath`, derive `Title` from filename, `Format` from extension.
5. Mark missing any existing books not present in the latest listing.
6. Update `LastSyncStatus`, `LastError`, `LastSyncAt`.

## Error Handling
- Decryption/list failures mark sync status as `error` and retain last error message.
- Sync continues per-connection; scheduler isolates failures.

## Testing
- Books store CRUD/upsert/missing tests.
- Sync diff tests with fake client entries.
- Scheduler test with injected tick channel.

