# ReaderExperienceOptimized Design Notes

## PRFAQ (press release + FAQ)

### Press Release
Relite Reader announces Reading Studio, a focused environment built for people who read daily and want control without complexity. Reading Studio introduces a live customization panel that lets readers adjust typography, spacing, and theme as they read. Changes apply immediately, so readers can tune the page for morning light, long sessions, or small screens without leaving the book. The experience keeps progress visible and preserves calm: controls are grouped, labeled, and designed to recede once configured. The default layout centers the text in a comfortable width, reduces visual noise, and respects the reader’s sense of tempo. Reading Studio is available across formats in the MVP and stores preferences locally so the experience stays consistent between sessions. This is a step toward the product’s long-term goal: a personal library that feels as crafted as a favorite notebook—quiet, legible, and deeply customizable.

### FAQ
**Q: Who is this for?**
A: Readers who spend time with long-form content and want the page to match their eyes, posture, and environment.

**Q: What can be customized today?**
A: Theme, font family, font size, line height, page width, and text alignment.

**Q: Are preferences saved?**
A: Yes, preferences are stored locally and applied across sessions.

**Q: Does this affect EPUB/PDF/MOBI?**
A: The settings apply at the reader container level now. Formats that support reflow benefit most; fixed formats will still gain layout and theme consistency.

**Q: Can I save multiple presets?**
A: Not yet. The MVP focuses on a single global preference set.

**Q: Will this sync across devices?**
A: Not in the MVP. Future versions will add server-backed preferences.

**Q: Why not offer every typographic toggle?**
A: The goal is to keep the panel usable and predictable. We prioritize the controls that most affect comfort and legibility.

## Requirements (explicit and implicit)
- **User roles:** casual reader, daily reader, accessibility-focused reader.
- **Use cases:** adjust size for night reading, expand line height for eye comfort, widen page on desktop, switch to sepia for glare reduction.
- **Core task path:** open reader → toggle settings → adjust a control → see instant change → continue reading.
- **Edge cases:** missing preferences (use defaults), invalid localStorage (fallback to defaults), small screens (panel moves below content).

## PRD (MoSCoW)
- **Must:** settings toggle, live updates, local persistence, three themes, three fonts, size/line/width sliders, alignment toggle.
- **Should:** reset to defaults, sticky panel on desktop, mobile-friendly layout.
- **Could:** presets, per-book preferences, color temperature slider.
- **Won’t (now):** server sync, advanced typography controls, per-section themes.

## Information Architecture (sketch)
- Reader toolbar
  - Title, progress, settings toggle
- Reader surface
  - Content area, centered width
- Settings panel
  - Theme, font, size, line height, width, alignment

## Interaction States
- Default: panel open, controls visible
- Hover: buttons lift subtly, inputs highlight
- Active: selected theme highlighted via data-theme
- Disabled: none in MVP
- Error: none in MVP
- Loading: none in MVP

## Accessibility
- All controls have labels, slider values visible.
- Keyboard navigation supported by native inputs.
- Contrast preserved for paper, sepia, night themes.

## Motion
- 200–300ms transitions for panel and buttons.
- Disabled with prefers-reduced-motion.

## Responsive Strategy
- Desktop: two-column layout, sticky panel.
- Tablet: single column, panel below content.
- Mobile: controls remain full-width with spacing.

## Design Tokens (excerpt)
- `--reader-bg`, `--reader-ink`, `--reader-border`
- `--reader-font`, `--reader-size`, `--reader-line`, `--reader-width`
- `--shadow` from existing system

## Wireframe Notes
- **Toolbar:** left-aligned brand and title, right-aligned settings toggle.
- **Reading surface:** centered, wide enough for comfortable line length.
- **Settings panel:** grouped controls with compact labels and visible values.

## Inspirations (translated, not imitated)
- Dieter Rams: calm surfaces, reduced controls, obvious hierarchy.
- Josef Müller-Brockmann: grid discipline and consistent spacing.

These notes describe mood transfer only; no layouts or brand elements are replicated.
