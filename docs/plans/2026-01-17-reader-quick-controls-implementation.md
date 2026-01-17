# Reader Quick Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a floating quick-control bar and keyboard shortcuts to adjust reading preferences quickly.

**Architecture:** Introduce a `ReaderQuickControls` component, wire it into `ReaderPage`, and implement keyboard shortcuts that map to existing preference updates. Style the quick bar in `index.css`.

**Tech Stack:** React + TypeScript, CSS.

### Task 1: Quick controls component + ReaderPage wiring

**Files:**
- Create: `frontend/src/reader/ReaderQuickControls.tsx`
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

vi.mock('../reader/ReaderQuickControls', () => ({
  default: () => <div>Quick</div>,
}))

test('renders quick controls', () => {
  render(<ReaderPage />)
  expect(screen.getByText('Quick')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: FAIL with missing component

**Step 3: Write minimal implementation**

```tsx
export default function ReaderQuickControls({
  onTheme,
  onIncrease,
  onDecrease,
  onLayout,
  onFocus,
  onSettings,
}: {
  onTheme: () => void
  onIncrease: () => void
  onDecrease: () => void
  onLayout: () => void
  onFocus: () => void
  onSettings: () => void
}) {
  return (
    <div className="reader-quick">
      <button className="button" onClick={onTheme}>Theme</button>
      <button className="button" onClick={onDecrease}>A-</button>
      <button className="button" onClick={onIncrease}>A+</button>
      <button className="button" onClick={onLayout}>Layout</button>
      <button className="button" onClick={onFocus}>Focus</button>
      <button className="button" onClick={onSettings}>Settings</button>
    </div>
  )
}
```

Update `ReaderPage` to render `<ReaderQuickControls />` with callbacks to preference updates.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/pages/ReaderPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/reader/ReaderQuickControls.tsx frontend/src/pages/ReaderPage.tsx frontend/src/pages/ReaderPage.test.tsx
git commit -m "feat: add reader quick controls"
```

### Task 2: Keyboard shortcuts

**Files:**
- Modify: `frontend/src/pages/ReaderPage.tsx`

**Step 1: Write minimal implementation**

Add `useEffect` for `keydown` handling and guard against inputs. Map shortcuts:
- Alt+T: theme cycle
- Alt+L: layout toggle
- Alt+F: focus toggle
- Alt+S: settings toggle
- Ctrl/Cmd + +/-: font size adjust

**Step 2: Commit**

```bash
git add frontend/src/pages/ReaderPage.tsx
git commit -m "feat: add reader keyboard shortcuts"
```

### Task 3: Quick control styling

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Write minimal implementation**

```css
.reader-quick {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 999px;
  background: rgba(251, 247, 241, 0.9);
  border: 1px solid var(--line);
  backdrop-filter: blur(8px);
  z-index: 6;
}

.reader-quick .button {
  min-height: 36px;
  padding: 0.3rem 0.9rem;
  font-size: 0.85rem;
}

@media (max-width: 600px) {
  .reader-quick {
    flex-wrap: wrap;
    left: 1rem;
    right: 1rem;
    justify-content: center;
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add reader quick controls"
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
git commit -m "test: verify reader quick controls"
```
