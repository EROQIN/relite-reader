# WebDAV PROPFIND Client Design

## Overview
Introduce a real WebDAV client that performs PROPFIND requests to list remote library contents. The client supports recursive traversal by issuing Depth:1 PROPFINDs per directory, parsing the Multi-Status XML response into file entries. This replaces the current no-op client in server wiring and enables actual sync against WebDAV servers.

## Goals
- Implement a concrete `webdav.Client` that returns file entries from a WebDAV endpoint.
- Support recursive traversal with predictable, normalized paths.
- Use basic auth credentials from stored connection data.
- Keep the implementation dependency-free (standard library only).

## Non-goals (MVP)
- Write support (PUT/DELETE/MKCOL) or uploads.
- Advanced filtering, pagination, or server-specific optimizations.
- Complex metadata extraction beyond size + modified time.

## Architecture
- `HTTPClient` in `backend/internal/webdav/http_client.go` implements `Client`.
- `List(baseURL, username, secret)` walks directories: start at base URL, issue Depth:1 PROPFIND, enqueue subdirectories, and collect file entries.
- XML parser extracts `href`, `getcontentlength`, `getlastmodified`, and `resourcetype/collection` to distinguish files vs directories.
- Paths are normalized via URL resolution against the base URL; directory self-entries are skipped.

## Data Flow
1. WebDAV sync calls `Client.List` with base URL + credentials.
2. Client performs PROPFIND Depth:1 on the base URL.
3. For each response:
   - If resource is a collection (directory), enqueue for traversal (excluding the current dir).
   - If resource is a file, produce a `webdav.Entry` with path/size/modtime.
4. Repeat until the directory queue is empty.
5. Return the aggregated entries to sync for indexing.

## Error Handling
- Non-200/207 responses are treated as errors.
- Invalid XML or parse failures return errors.
- Timestamp parse failures fall back to zero time; size parse failures default to 0.

## Testing
- Unit tests with `httptest.Server` validate:
  - Recursive listing across nested directories.
  - BasicAuth header usage.
  - Path normalization and directory skipping.

