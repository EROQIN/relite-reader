# Local Open + Progress Tracking Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow opening local items from the library, track lastOpened timestamp, and display it in the list.

**Architecture:** Library items already store metadata in localStorage. Add a helper to update lastOpened and use a Link button for navigation to reader routes.

**Tech Stack:** React + Vite + TypeScript, React Router, Vitest.

### Task 1: Add lastOpened update helper

**Files:**
- Modify: `frontend/src/lib/library.ts`
- Test: `frontend/src/lib/library.test.ts`

**Step 1: Write failing test**

```ts
import { loadLibrary, upsertLibraryItem, updateLastOpened } from './library'

beforeEach(() => {
  localStorage.clear()
})

test('updateLastOpened sets timestamp', () => {
  upsertLibraryItem({
    id: '1',
    title: 'Test Book',
    format: 'epub',
    source: 'local',
  })

  updateLastOpened('1', '2026-01-16T00:00:00Z')
  const items = loadLibrary()
  expect(items[0].lastOpened).toBe('2026-01-16T00:00:00Z')
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/lib/library.test.ts`
Expected: FAIL due to missing export.

**Step 3: Implement helper**

```ts
export function updateLastOpened(id: string, timestamp: string) {
  const items = loadLibrary()
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0) return
  items[idx] = { ...items[idx], lastOpened: timestamp }
  saveLibrary(items)
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/lib/library.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/library.ts frontend/src/lib/library.test.ts
git commit -m "feat: track last opened"
```

### Task 2: Add open button and timestamp display

**Files:**
- Modify: `frontend/src/pages/LibraryPage.tsx`
- Modify: `frontend/src/compare/LibraryOptimized.tsx`
- Test: `frontend/src/pages/LibraryPage.test.tsx`

**Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react'
import LibraryPage from './LibraryPage'

vi.mock('../lib/library', () => ({
  loadLibrary: () => [
    { id: '1', title: 'Local Book', format: 'txt', source: 'local' },
  ],
  removeLibraryItem: vi.fn(),
  upsertLibraryItem: vi.fn(),
  updateLastOpened: vi.fn(),
}))

vi.mock('../lib/format', () => ({
  detectFormat: vi.fn(() => 'txt'),
}))

vi.mock('../lib/textStore', () => ({
  saveText: vi.fn(),
}))

test('shows open button for local item', () => {
  render(<LibraryPage />)
  expect(screen.getByText('Open')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/pages/LibraryPage.test.tsx`
Expected: FAIL because Open button not present.

**Step 3: Implement open link and lastOpened display**

```tsx
import { Link } from 'react-router-dom'
import { updateLastOpened } from '../lib/library'

const onOpen = (id: string) => {
  updateLastOpened(id, new Date().toISOString())
}

// inside LibraryOptimized map
<Link to={`/reader/${item.id}`} onClick={() => onOpen(item.id)} className="button">
  Open
</Link>
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/pages/LibraryPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/pages/LibraryPage.tsx frontend/src/compare/LibraryOptimized.tsx frontend/src/pages/LibraryPage.test.tsx
git commit -m "feat: add open action"
```

### Task 3: Add timestamp styling

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add timestamp styles**

```css
.timestamp {
  font-size: 0.75rem;
  color: var(--ink-soft);
}
```

**Step 2: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: style last opened timestamp"
```
