# Plan: WebDAV Connections UI (Design)

## Goal
Provide a production-ready interface for managing WebDAV connections and sync status.

## UX Summary
- A connection form with fields for base URL, username, and secret.
- List existing connections with last sync status and quick actions.
- Inline edit mode for updating a connection.
- Clear guidance for required fields and example URL hints.

## Behavior
- Require login (JWT) to access the page.
- Show loading and error states for API calls.
- Keep the interface minimal and consistent with the rest of the UI.
