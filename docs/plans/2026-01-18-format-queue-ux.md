# Plan: Format Queue UX + Persistence

## Goals
- Persist background format tasks in PostgreSQL for durability.
- Surface queued conversions to users with localized, low-noise UI.
- Provide clear status messaging and recovery hints for failed conversions.

## TODO
- [x] Add PostgreSQL store for tasks and wire it in when `RELITE_DATABASE_URL` is set.
- [x] Add tasks API client in the frontend.
- [x] Surface a compact queue panel in the library view with refresh control.
- [x] Localize queue strings and statuses (EN + zh-CN).
- [ ] Add a dedicated queue detail view for full history and error details.
- [ ] Filter queue list by status and expose “retry” for failed conversions.
- [ ] Plug in a conversion worker stub for non-supported formats.

## Notes
- Keep the queue panel succinct so the library remains the primary focus.
- Use task payload fields (`format`, `sourcePath`, `book_id`) to build helpful labels.
