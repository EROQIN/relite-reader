# WebDAV Connections & Sync Design (Relite Reader)

## Overview
This design adds WebDAV connection management, encrypted credential storage, and library indexing for remote ebook collections. Users can create/update/delete WebDAV connections, trigger manual syncs, and rely on a periodic background scheduler for ongoing updates. Connections are scoped per user and secrets are encrypted at rest using AES-GCM and a server key from environment variables.

## Goals
- Securely store WebDAV credentials and never expose secrets in logs or API responses.
- Provide CRUD endpoints for connections and a manual sync trigger.
- Periodic background sync to keep book index up to date.
- MVP-friendly: avoid parsing all formats during sync; parse on demand in reader.

## Non-goals (MVP)
- Full recursive metadata extraction for all formats during sync.
- Cross-user shared libraries or public WebDAV shares.
- Distributed job queues or multi-node coordination.

## Architecture
- WebDAV module in the Go service with an interface-driven client.
- In-memory repository backing (MVP) with clear interface for later Postgres swap.
- Background scheduler (ticker) enqueues sync jobs.
- Sync diff logic updates the `books` index by `source_path`.

## Data Model (minimum)
- webdav_connections: id, user_id, base_url, username, encrypted_secret, created_at, updated_at,
  last_sync_at, last_sync_status, last_error
- books: user_id, title, author, format, source_path, metadata_json, missing

## API Surface (MVP)
- POST /api/webdav (create connection, validates auth)
- GET /api/webdav (list connections, no secrets)
- PUT /api/webdav/:id (update connection)
- DELETE /api/webdav/:id (remove connection)
- POST /api/webdav/:id/sync (manual sync trigger)

## Sync Flow
1. Scheduler ticks and enqueues syncs for active connections.
2. Manual sync endpoint enqueues a sync and returns 202 + job id.
3. Sync job lists WebDAV directory via PROPFIND.
4. Diff against existing `books` by `source_path`.
5. Upsert new/changed entries; mark missing when remote path disappears.

## Encryption
- AES-GCM with 32-byte key from `RELITE_WEB_DAV_KEY`.
- Random nonce per record; store nonce + ciphertext together.
- Secrets are never returned from API; sanitize error strings.

## Scheduling
- Configurable interval (default ~20m) and max concurrency.
- Exponential backoff per connection on repeated failures.
- On restart, the next tick re-enqueues jobs (no persistent queue in MVP).

## Error Handling
- WebDAV errors are recorded to `last_error` and `last_sync_status`.
- Failures are isolated to each connection.
- Ownership checks enforced for all endpoints and jobs.

## Config
- RELITE_WEB_DAV_KEY (required)
- RELITE_WEB_DAV_SYNC_INTERVAL (default 20m)
- RELITE_WEB_DAV_MAX_CONCURRENCY (default 2)

## Testing
- Crypto unit tests (round-trip encryption/decryption).
- Repository CRUD tests.
- Sync diff tests with stubbed WebDAV client.
- Handler tests: auth required, ownership enforced, validation errors.

## Rollout Notes
- MVP uses in-memory repo; swap to Postgres by implementing the same interfaces.
- Reader continues on-demand parsing; sync updates only index metadata.
