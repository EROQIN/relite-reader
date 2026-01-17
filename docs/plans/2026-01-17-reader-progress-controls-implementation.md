# Plan: Reader Progress Controls + Pace (Implementation)

## Tasks
1. Extend `ReaderPrefs` with `readingSpeed` and normalize stored prefs; update tests and presets.
2. Add reading pace control to `ReaderControls` with a slider and WPM display.
3. Update `ReaderShell` and `TxtReader` to accept reading speed, render progress slider, and compute time remaining.
4. Add CSS for the progress controls and meta layout tweaks.
5. Run frontend tests and verify TXT reader behavior.
