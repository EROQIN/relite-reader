# Reader Presets & Per-Book Preferences Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add presets and per-book preference overrides to the reader customization system.

**Architecture:** Extend `readerPrefs` to store book-specific overrides and built-in presets. Update `ReaderPage` and `ReaderControls` to switch scopes and apply presets, while persisting to the correct storage bucket.

**Tech Stack:** React + TypeScript, localStorage helpers.

### Task 1: Extend readerPrefs store (presets + book overrides)

**Files:**
- Modify: `frontend/src/lib/readerPrefs.ts`
- Modify: `frontend/src/lib/readerPrefs.test.ts`

**Step 1: Write the failing test**

```ts
import {
  defaultReaderPrefs,
  loadReaderPrefsForBook,
  saveReaderPrefsForBook,
  clearReaderPrefsForBook,
  readerPresets,
} from './readerPrefs'

afterEach(() => {
  localStorage.clear()
})

test('reader presets include night', () => {
  const ids = readerPresets.map((preset) => preset.id)
  expect(ids).toContain('night')
})

test('book prefs override is stored and cleared', () => {
  const bookId = 'book-1'
  saveReaderPrefsForBook(bookId, { ...defaultReaderPrefs, fontSize: 21 })
  expect(loadReaderPrefsForBook(bookId)?.fontSize).toBe(21)
  clearReaderPrefsForBook(bookId)
  expect(loadReaderPrefsForBook(bookId)).toBeNull()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/readerPrefs.test.ts`
Expected: FAIL with undefined symbols

**Step 3: Write minimal implementation**

```ts
import { loadJson, saveJson, PREFS_KEY } from './storage'

const BOOK_PREFS_KEY = 'relite.prefs.books'

export interface ReaderPreset {
  id: string
  label: string
  prefs: ReaderPrefs
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

export function loadReaderPrefsForBook(bookId: string): ReaderPrefs | null {
  const map = loadJson<Record<string, ReaderPrefs>>(BOOK_PREFS_KEY, {})
  return map[bookId] ?? null
}

export function saveReaderPrefsForBook(bookId: string, prefs: ReaderPrefs) {
  const map = loadJson<Record<string, ReaderPrefs>>(BOOK_PREFS_KEY, {})
  map[bookId] = prefs
  saveJson(BOOK_PREFS_KEY, map)
}

export function clearReaderPrefsForBook(bookId: string) {
  const map = loadJson<Record<string, ReaderPrefs>>(BOOK_PREFS_KEY, {})
  delete map[bookId]
  saveJson(BOOK_PREFS_KEY, map)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/readerPrefs.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/readerPrefs.ts frontend/src/lib/readerPrefs.test.ts
git commit -m "feat: add reader presets and book prefs"
```

### Task 2: Reader controls scope + preset selector

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

vi.mock('../reader/ReaderControls', () => ({
  default: () => <div>Controls</div>,
}))

vi.mock('../lib/readerPrefs', () => ({
  defaultReaderPrefs: {
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
  },
  loadReaderPrefs: () => ({
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
  }),
  loadReaderPrefsForBook: () => null,
  saveReaderPrefs: vi.fn(),
  saveReaderPrefsForBook: vi.fn(),
  clearReaderPrefsForBook: vi.fn(),
  readerPresets: [
    { id: 'paper', label: 'Paper Focus', prefs: { theme: 'paper' } },
  ],
}))

test('renders preset selector label', () => {
  render(<ReaderPage />)
  expect(screen.getByText(/preset/i)).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: FAIL with missing preset label

**Step 3: Write minimal implementation**

Update ReaderControls to accept presets and scope toggle:

```tsx
import { ReaderPrefs, ReaderPreset } from '../lib/readerPrefs'

export default function ReaderControls({
  prefs,
  presets,
  activePreset,
  bookScoped,
  onScopeChange,
  onApplyPreset,
  onChange,
  onReset,
}: {
  prefs: ReaderPrefs
  presets: ReaderPreset[]
  activePreset: string
  bookScoped: boolean
  onScopeChange: (next: boolean) => void
  onApplyPreset: (presetId: string) => void
  onChange: (prefs: ReaderPrefs) => void
  onReset: () => void
}) {
  // ... existing controls
  <label className="field">
    Preset
    <select value={activePreset} onChange={(event) => onApplyPreset(event.target.value)}>
      <option value="custom">Custom</option>
      {presets.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.label}
        </option>
      ))}
    </select>
  </label>
  <label className="field toggle">
    <input
      type="checkbox"
      checked={bookScoped}
      onChange={(event) => onScopeChange(event.target.checked)}
    />
    Apply to this book
  </label>
}
```

Update ReaderPage to read bookId and persist based on scope:

```tsx
import { useParams } from 'react-router-dom'
import {
  loadReaderPrefsForBook,
  saveReaderPrefsForBook,
  clearReaderPrefsForBook,
  readerPresets,
} from '../lib/readerPrefs'

const findPreset = (prefs: ReaderPrefs) =>
  readerPresets.find((preset) =>
    JSON.stringify(preset.prefs) === JSON.stringify(prefs)
  )?.id ?? 'custom'

const { bookId } = useParams()
const bookPrefs = bookId ? loadReaderPrefsForBook(bookId) : null
const [bookScoped, setBookScoped] = useState(Boolean(bookPrefs))
const [prefs, setPrefs] = useState<ReaderPrefs>(() => bookPrefs ?? loadReaderPrefs())

const updatePrefs = (next: ReaderPrefs) => {
  setPrefs(next)
  if (bookScoped && bookId) {
    saveReaderPrefsForBook(bookId, next)
  } else {
    saveReaderPrefs(next)
  }
}

const toggleScope = (next: boolean) => {
  setBookScoped(next)
  if (next && bookId) {
    saveReaderPrefsForBook(bookId, prefs)
  }
  if (!next && bookId) {
    clearReaderPrefsForBook(bookId)
    saveReaderPrefs(prefs)
  }
}

const applyPreset = (presetId: string) => {
  const preset = readerPresets.find((item) => item.id === presetId)
  if (preset) updatePrefs(preset.prefs)
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/reader/ReaderControls.tsx frontend/src/pages/ReaderPage.tsx frontend/src/pages/ReaderPage.test.tsx
git commit -m "feat: add reader presets and book scope"
```

### Task 3: Full frontend verification

**Files:**
- Modify: none

**Step 1: Run frontend test suite**

Run: `npm test -- --run`
Expected: PASS

**Step 2: Commit (if any adjustments)**

```bash
git add -A
git commit -m "test: verify reader presets"
```
