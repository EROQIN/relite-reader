# Plan: Reader Progress Controls + Pace (Design)

## Goal
Make in-reader progress adjustments easier and more informative by adding a progress scrubber and a configurable reading pace that powers time remaining estimates for text-based reading.

## UX Summary
- Add a progress slider to the TXT reader so users can jump to any point quickly.
- Surface "time remaining" using a configurable reading pace (words per minute).
- Add a reading pace control to the settings panel; stored alongside other reader preferences.

## States
- Empty text: show a fallback message and hide time estimates.
- Progress slider updates both the display and scroll position.
- Reading pace updates recalculated time remaining immediately.

## Data + Persistence
- Add `readingSpeed` (WPM) to `ReaderPrefs`, stored in local storage like other preferences.
- Merge legacy prefs with defaults on load so new fields get defaults.

## Accessibility
- Keep slider labels clear and include numeric percent alongside the slider.
- Maintain existing tap target sizes.

## Visual Notes
- Progress slider sits beneath the title/percent block within the TXT reader frame.
- Time remaining appears next to the title as a subtle secondary meta line.
