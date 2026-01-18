# Plan: Restore Reader Progress on Open

## Goals
- Resume reading at the saved progress instead of always starting at the top.
- Avoid jarring jumps once the reader is active.

## TODO
- [x] Restore scroll position when the text content loads.
- [x] Respect user-initiated scrolling and avoid overriding it.
- [x] Apply remote progress updates without disrupting active sessions.
- [x] Add internal guards for delayed text loading.

## Notes
- Applies to TXT/Markdown/HTML readers via the shared text reader.
