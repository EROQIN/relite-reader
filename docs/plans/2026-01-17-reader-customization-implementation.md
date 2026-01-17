# Reader UX & Customization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a customizable reader experience with a settings panel and persistent preferences.

**Architecture:** Introduce a reader preferences store in `frontend/src/lib`, wire a settings panel into `ReaderPage`, and apply CSS variables to the reader surface for live customization. Add a compare-only optimized reader component per UI guidance.

**Tech Stack:** React + TypeScript (Vite), localStorage via existing storage helpers, CSS variables in `index.css`.

### Task 1: Reader preferences store

**Files:**
- Create: `frontend/src/lib/readerPrefs.ts`
- Create: `frontend/src/lib/readerPrefs.test.ts`

**Step 1: Write the failing test**

```ts
import { loadReaderPrefs, saveReaderPrefs, defaultReaderPrefs } from './readerPrefs'

afterEach(() => {
  localStorage.clear()
})

test('loadReaderPrefs returns defaults when missing', () => {
  const prefs = loadReaderPrefs()
  expect(prefs).toEqual(defaultReaderPrefs)
})

test('saveReaderPrefs persists values', () => {
  const next = { ...defaultReaderPrefs, fontSize: 20 }
  saveReaderPrefs(next)
  expect(loadReaderPrefs()).toEqual(next)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run frontend/src/lib/readerPrefs.test.ts`
Expected: FAIL with undefined symbols

**Step 3: Write minimal implementation**

```ts
import { loadJson, saveJson, PREFS_KEY } from './storage'

export type ReaderTheme = 'paper' | 'sepia' | 'night'
export type ReaderFont = 'sans' | 'serif' | 'mono'
export type ReaderAlign = 'left' | 'justify'

export interface ReaderPrefs {
  theme: ReaderTheme
  font: ReaderFont
  fontSize: number
  lineHeight: number
  pageWidth: number
  textAlign: ReaderAlign
}

export const defaultReaderPrefs: ReaderPrefs = {
  theme: 'paper',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.7,
  pageWidth: 720,
  textAlign: 'left',
}

export function loadReaderPrefs(): ReaderPrefs {
  return loadJson(PREFS_KEY, defaultReaderPrefs)
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  saveJson(PREFS_KEY, prefs)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run frontend/src/lib/readerPrefs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/readerPrefs.ts frontend/src/lib/readerPrefs.test.ts
git commit -m "feat: add reader preferences store"
```

### Task 2: Reader controls + layout wiring

**Files:**
- Create: `frontend/src/reader/ReaderControls.tsx`
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/reader/TxtReader.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import ReaderPage from './ReaderPage'

vi.mock('../reader/ReaderShell', () => ({
  default: () => <div>Shell</div>,
}))

test('renders reader settings toggle', () => {
  render(<ReaderPage />)
  expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run frontend/src/pages/ReaderPage.test.tsx`
Expected: FAIL with missing ReaderPage test

**Step 3: Write minimal implementation**

```tsx
import { useMemo, useState } from 'react'
import ReaderShell from '../reader/ReaderShell'
import ReaderControls from '../reader/ReaderControls'
import {
  defaultReaderPrefs,
  loadReaderPrefs,
  ReaderPrefs,
  saveReaderPrefs,
} from '../lib/readerPrefs'

const fontMap: Record<string, string> = {
  sans: "'IBM Plex Sans', 'Noto Sans SC', 'PingFang SC', sans-serif",
  serif: "'Fraunces', 'Noto Serif SC', 'Source Han Serif SC', serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

export default function ReaderPage() {
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadReaderPrefs())
  const [open, setOpen] = useState(true)

  const style = useMemo(
    () => ({
      ['--reader-font' as never]: fontMap[prefs.font],
      ['--reader-size' as never]: `${prefs.fontSize}px`,
      ['--reader-line' as never]: String(prefs.lineHeight),
      ['--reader-width' as never]: `${prefs.pageWidth}px`,
      ['--reader-align' as never]: prefs.textAlign,
    }),
    [prefs]
  )

  const updatePrefs = (next: ReaderPrefs) => {
    setPrefs(next)
    saveReaderPrefs(next)
  }

  return (
    <section className="reader-page" data-theme={prefs.theme} style={style}>
      <header className="reader-toolbar">
        <div>
          <span className="overline">Reader</span>
          <h1>Reading Studio</h1>
        </div>
        <button
          className="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          Settings
        </button>
      </header>
      <div className="reader-layout">
        <div className="reader-surface">
          <ReaderShell />
        </div>
        <aside className={`reader-settings ${open ? 'open' : ''}`}>
          <ReaderControls
            prefs={prefs}
            onChange={updatePrefs}
            onReset={() => updatePrefs(defaultReaderPrefs)}
          />
        </aside>
      </div>
    </section>
  )
}
```

Create controls:

```tsx
import { ReaderPrefs } from '../lib/readerPrefs'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export default function ReaderControls({
  prefs,
  onChange,
  onReset,
}: {
  prefs: ReaderPrefs
  onChange: (prefs: ReaderPrefs) => void
  onReset: () => void
}) {
  return (
    <div className="panel reader-panel">
      <div className="reader-panel-header">
        <h2>Customize</h2>
        <button className="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <label className="field">
        Theme
        <select
          value={prefs.theme}
          onChange={(event) => onChange({ ...prefs, theme: event.target.value as ReaderPrefs['theme'] })}
        >
          <option value="paper">Paper</option>
          <option value="sepia">Sepia</option>
          <option value="night">Night</option>
        </select>
      </label>
      <label className="field">
        Font
        <select
          value={prefs.font}
          onChange={(event) => onChange({ ...prefs, font: event.target.value as ReaderPrefs['font'] })}
        >
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="mono">Mono</option>
        </select>
      </label>
      <label className="field">
        Font size
        <input
          type="range"
          min={14}
          max={22}
          value={prefs.fontSize}
          onChange={(event) =>
            onChange({ ...prefs, fontSize: clamp(Number(event.target.value), 14, 22) })
          }
        />
        <span className="field-value">{prefs.fontSize}px</span>
      </label>
      <label className="field">
        Line height
        <input
          type="range"
          min={1.4}
          max={2}
          step={0.05}
          value={prefs.lineHeight}
          onChange={(event) =>
            onChange({ ...prefs, lineHeight: clamp(Number(event.target.value), 1.4, 2) })
          }
        />
        <span className="field-value">{prefs.lineHeight.toFixed(2)}</span>
      </label>
      <label className="field">
        Page width
        <input
          type="range"
          min={520}
          max={900}
          step={20}
          value={prefs.pageWidth}
          onChange={(event) =>
            onChange({ ...prefs, pageWidth: clamp(Number(event.target.value), 520, 900) })
          }
        />
        <span className="field-value">{prefs.pageWidth}px</span>
      </label>
      <label className="field">
        Alignment
        <select
          value={prefs.textAlign}
          onChange={(event) =>
            onChange({ ...prefs, textAlign: event.target.value as ReaderPrefs['textAlign'] })
          }
        >
          <option value="left">Left</option>
          <option value="justify">Justify</option>
        </select>
      </label>
    </div>
  )
}
```

Update `TxtReader` to use the new surface classes (remove panel wrapper):

```tsx
return (
  <div className="reader-frame">
    <div className="reader-meta">
      <h2>{item.title}</h2>
      <span className="reader-progress">{Math.round(progress * 100)}%</span>
    </div>
    <div className="reader-scroll" onScroll={onScroll}>
      <pre className="reader-text">{text || 'No text content found.'}</pre>
    </div>
  </div>
)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run frontend/src/pages/ReaderPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/reader/ReaderControls.tsx frontend/src/pages/ReaderPage.tsx frontend/src/reader/TxtReader.tsx frontend/src/pages/ReaderPage.test.tsx
git commit -m "feat: add reader customization panel"
```

### Task 3: Styles + compare assets

**Files:**
- Modify: `frontend/src/index.css`
- Create: `frontend/src/compare/ReaderExperienceOptimized.tsx`
- Create: `frontend/src/compare/ReaderExperienceOptimized.notes.md`

**Step 1: Write the failing test**

(No tests; visual changes.)

**Step 2: Write minimal implementation**

Add reader theme variables and layout styles:

```css
.reader-page {
  display: grid;
  gap: 1.5rem;
}

.reader-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-end;
}

.reader-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 1.5rem;
  align-items: start;
}

.reader-surface {
  max-width: var(--reader-width, 720px);
  margin: 0 auto;
  width: 100%;
}

.reader-frame {
  background: var(--reader-bg);
  border: 1px solid var(--reader-border);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

.reader-text {
  font-family: var(--reader-font);
  font-size: var(--reader-size);
  line-height: var(--reader-line);
  text-align: var(--reader-align);
}

.reader-settings {
  position: sticky;
  top: 1rem;
  transition: transform 220ms ease, opacity 220ms ease;
}

.reader-settings:not(.open) {
  transform: translateY(-8px);
  opacity: 0.5;
}

.reader-panel {
  display: grid;
  gap: 1rem;
}

.reader-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field {
  display: grid;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.field-value {
  color: var(--ink-soft);
  font-size: 0.8rem;
}

.reader-page[data-theme='paper'] {
  --reader-bg: #fffdf7;
  --reader-ink: #1b1916;
  --reader-border: #e6ded4;
}

.reader-page[data-theme='sepia'] {
  --reader-bg: #f4eadc;
  --reader-ink: #2c251d;
  --reader-border: #d9c8b5;
}

.reader-page[data-theme='night'] {
  --reader-bg: #141313;
  --reader-ink: #f4efe7;
  --reader-border: #2b2520;
}

.reader-page[data-theme='night'] .reader-frame {
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}

.reader-page[data-theme='night'] .reader-text,
.reader-page[data-theme='night'] .reader-meta,
.reader-page[data-theme='night'] .reader-progress {
  color: var(--reader-ink);
}

@media (max-width: 960px) {
  .reader-layout {
    grid-template-columns: 1fr;
  }

  .reader-settings {
    position: static;
  }
}
```

Add compare component and notes with inspirations and workflow summary.

**Step 3: Run tests**

Optional: `npm test -- --run`

**Step 4: Commit**

```bash
git add frontend/src/index.css frontend/src/compare/ReaderExperienceOptimized.tsx frontend/src/compare/ReaderExperienceOptimized.notes.md
git commit -m "style: add reader customization layout"
```

### Task 4: Full frontend verification

**Files:**
- Modify: none

**Step 1: Run frontend test suite**

Run: `npm test -- --run`
Expected: PASS (if dependencies installed)

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify reader customization"
```
