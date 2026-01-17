# Plan: Auth UI + Preference Sync (Design)

## Goal
Provide a production-ready login/register flow that stores JWTs and enables backend preference sync.

## UX Summary
- Combine sign-in and sign-up into a single clean form with a toggle.
- Show inline validation and friendly error messages.
- Persist the JWT to local storage and update navigation state.

## Behavior
- On successful auth, store token in `relite.auth.token`.
- Provide a log out action in the header.
- Preference sync uses the token for `/api/preferences`.

## Visual Notes
- Keep the form minimal, with muted helper text and a clear primary button.
