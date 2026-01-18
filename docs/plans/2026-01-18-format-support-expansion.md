# Plan: Expand Format Support

## Goals
- Accept a wider range of ebook/document formats across WebDAV indexing and local imports.
- Provide clear placeholder messaging for newly indexed formats.
- Keep format detection consistent between backend and frontend.

## TODO
- [x] Add new formats to backend detection list.
- [x] Extend frontend format detection and types.
- [x] Add localized placeholders for new formats.
- [x] Update docs and tests.
- [ ] Map select formats to richer readers (markdown/html rendering).
- [ ] Add conversion worker for queued formats (kfx/azw4/djvu/xps).

## Notes
- Formats added: cbt, cba, azw4, kfx, odt, md/markdown, html/htm, djvu, xps, lit, pdb.
