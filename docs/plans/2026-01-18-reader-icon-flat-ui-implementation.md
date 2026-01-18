# Reader Icon + Flat UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace default app icon assets and remove card-style UI surfaces for a flatter, cleaner reading experience.

**Architecture:** Add new favicon/PWA icon assets in `frontend/public`, update Vite PWA manifest links, and adjust global CSS to remove card-like surfaces in favor of flat, line-separated sections. Keep functional structure intact while simplifying visuals.

**Tech Stack:** React + Vite, Vite PWA plugin, global CSS.

### Task 1: Replace app icon assets and wiring

**Files:**
- Create: `frontend/public/favicon.svg`
- Create: `frontend/public/pwa-192.png`
- Create: `frontend/public/pwa-512.png`
- Create: `frontend/scripts/generate-icons.mjs`
- Modify: `frontend/index.html`
- Modify: `frontend/vite.config.ts`

**Step 1: Write the icon generator script (no tests available)**

```js
// frontend/scripts/generate-icons.mjs
```

**Step 2: Run the generator to create PNGs**

Run: `node frontend/scripts/generate-icons.mjs`
Expected: `frontend/public/pwa-192.png` and `frontend/public/pwa-512.png` exist

**Step 3: Add SVG favicon and wire up HTML + manifest**

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/pwa-192.png" />
```

**Step 4: Run frontend tests**

Run: `npm run test:run`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/public/favicon.svg frontend/public/pwa-192.png frontend/public/pwa-512.png frontend/scripts/generate-icons.mjs frontend/index.html frontend/vite.config.ts
git commit -m "feat: replace app icon assets"
```

### Task 2: Flatten card-style UI surfaces

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Update panel and list styles (no tests available)**

```css
.panel { /* flatten */ }
.webdav-card { /* list row style */ }
.book-row { /* list row style */ }
```

**Step 2: Run frontend tests**

Run: `npm run test:run`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: remove card-like surfaces"
```

### Task 3: Verify baseline

**Files:**
- None

**Step 1: Run backend tests (ensure no regressions)**

Run: `go test ./...` (with `GOPATH/GOMODCACHE/GOCACHE` set locally if needed)
Expected: PASS

**Step 2: Run frontend tests**

Run: `npm run test:run`
Expected: PASS

**Step 3: Commit summary (if any follow-ups)**

```bash
# Only if changes were required

git add -A
git commit -m "chore: verify icon + ui refresh"
```
