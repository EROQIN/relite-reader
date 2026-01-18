# Plan: Friendly Last-Opened Timestamps

## Goals
- Show last-opened timestamps in a readable, locale-aware format.

## TODO
- [x] Add localized date/time formatting for `lastOpened` in the library list.
- [x] Keep the stored timestamp unchanged (ISO), format only for display.

## Notes
- Uses the active locale to format dates via `Intl.DateTimeFormat`.
