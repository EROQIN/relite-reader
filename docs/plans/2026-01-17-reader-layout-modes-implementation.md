# Reader Layout Modes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add layout mode and focus mode customization to the reader.

**Architecture:** Extend reader prefs with layout and focus fields, expose toggles in the reader controls, and apply CSS classes/variables for columns and focus mode. Persist values via existing reader prefs storage.

**Tech Stack:** React + TypeScript, CSS variables, localStorage.

### Task 1: Extend reader prefs for layout + focus

**Files:**
- Modify: `frontend/src/lib/readerPrefs.ts`
- Modify: `frontend/src/lib/readerPrefs.test.ts`

**Step 1: Write the failing test**

```ts
import { loadReaderPrefs, defaultReaderPrefs } from './readerPrefs'

test('reader prefs include layout and focus fields', () => {
  const prefs = loadReaderPrefs()
  expect(prefs.layoutMode).toBeDefined()
  expect(prefs.focusMode).toBeDefined()
  expect(defaultReaderPrefs.layoutMode).toBe('single')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/readerPrefs.test.ts`
Expected: FAIL with missing fields

**Step 3: Write minimal implementation**

```ts
export type ReaderLayoutMode = 'single' | 'columns'

export interface ReaderPrefs {
  // ... existing
  layoutMode: ReaderLayoutMode
  focusMode: boolean
}

export const defaultReaderPrefs: ReaderPrefs = {
  // ... existing
  layoutMode: 'single',
  focusMode: false,
}

export const readerPresets: ReaderPreset[] = [
  {
    id: 'paper',
    label: 'Paper Focus',
    prefs: { ...defaultReaderPrefs },
  },
  {
    id: 'sepia',
    label: 'Sepia Calm',
    prefs: { ...defaultReaderPrefs, theme: 'sepia', fontSize: 17 },
  },
  {
    id: 'night',
    label: 'Night Studio',
    prefs: { ...defaultReaderPrefs, theme: 'night', fontSize: 19, lineHeight: 1.8 },
  },
]
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/readerPrefs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/readerPrefs.ts frontend/src/lib/readerPrefs.test.ts
git commit -m "feat: add reader layout and focus prefs"
```

### Task 2: Controls + focus toggle

**Files:**
- Modify: `frontend/src/reader/ReaderControls.tsx`
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/pages/ReaderPage.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import ReaderPage from './ReaderPage'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'book-1' }),
}))

vi.mock('../reader/ReaderShell', () => ({
  default: () => <div>Shell</div>,
}))

vi.mock('../lib/readerPrefs', () => ({
  defaultReaderPrefs: {
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
  },
  loadReaderPrefs: () => ({
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
  }),
  loadReaderPrefsForBook: () => null,
  saveReaderPrefs: vi.fn(),
  saveReaderPrefsForBook: vi.fn(),
  clearReaderPrefsForBook: vi.fn(),
  readerPresets: [{ id: 'paper', label: 'Paper Focus', prefs: { theme: 'paper' } }],
}))

test('renders focus mode label', () => {
  render(<ReaderPage />)
  expect(screen.getByText(/focus mode/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: FAIL with missing label

**Step 3: Write minimal implementation**

Update ReaderControls to include layout + focus toggles:

```tsx
<label className="field">
  Layout
  <select
    value={prefs.layoutMode}
    onChange={(event) =>
      onChange({
        ...prefs,
        layoutMode: event.target.value as ReaderPrefs['layoutMode'],
      })
    }
  >
    <option value="single">Single</option>
    <option value="columns">Columns</option>
  </select>
</label>
<label className="field toggle">
  <input
    type="checkbox"
    checked={prefs.focusMode}
    onChange={(event) =>
      onChange({
        ...prefs,
        focusMode: event.target.checked,
      })
    }
  />
  Focus mode
</label>
```

Update ReaderPage wrapper to apply classes:

```tsx
<section
  className={`reader-page ${prefs.focusMode ? 'focus' : ''}`}
  data-theme={prefs.theme}
  style={style}
>
```

Add a floating exit button when focus mode is on.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/reader/ReaderControls.tsx frontend/src/pages/ReaderPage.tsx frontend/src/pages/ReaderPage.test.tsx
git commit -m "feat: add reader layout and focus controls"
```

### Task 3: CSS for layout + focus

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Write minimal implementation**

```css
.reader-page.focus .reader-toolbar,
.reader-page.focus .reader-settings {
  display: none;
}

.reader-page.focus .reader-surface {
  max-width: min(920px, 100%);
}

.reader-focus-exit {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 5;
}

.reader-text.columns {
  column-count: 2;
  column-gap: 2.5rem;
}

@media (max-width: 900px) {
  .reader-text.columns {
    column-count: 1;
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add reader layout modes"
```

### Task 4: Full frontend verification

**Files:**
- Modify: none

**Step 1: Run frontend test suite**

Run: `npm test -- --run`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify reader layout modes"
```
