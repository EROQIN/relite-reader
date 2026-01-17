# Plan: PWA Install UX + Friendly Guidance (Design)

## Goal
Help users add Relite Reader as a web app on mobile with lightweight, non-intrusive guidance.

## UX Summary
- Show a slim, dismissible install banner when the browser supports PWA install.
- Provide iOS-specific guidance ("Add to Home Screen") when running in Safari.
- Store dismissal in local storage to avoid repeated prompts.

## Behavior
- Auto-hide when running in standalone display mode.
- Only surface after a short delay and when not dismissed.

## Visual Notes
- Keep banner compact, using existing panel styling.
- Include one-sentence instructions.
