# Local TXT Reader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable local TXT imports to persist content and display inside the reader view.

**Architecture:** Store TXT content in localStorage keyed by book id. Library imports save TXT content on import, and TxtReader loads content by id for display. Other formats remain stubbed.

**Tech Stack:** React + Vite + TypeScript, Vitest, localStorage.

### Task 1: Add text store helper

**Files:**
- Create: `frontend/src/lib/textStore.ts`
- Test: `frontend/src/lib/textStore.test.ts`

**Step 1: Write failing test**

```ts
import { loadText, saveText } from './textStore'

afterEach(() => {
  localStorage.clear()
})

test('saveText persists text by id', () => {
  saveText('abc', 'hello')
  expect(loadText('abc')).toBe('hello')
})

test('loadText returns empty string when missing', () => {
  expect(loadText('missing')).toBe('')
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/lib/textStore.test.ts`
Expected: FAIL with missing module error.

**Step 3: Write minimal implementation**

```ts
const prefix = 'relite.text.'

export function saveText(id: string, text: string) {
  localStorage.setItem(`${prefix}${id}`, text)
}

export function loadText(id: string): string {
  return localStorage.getItem(`${prefix}${id}`) ?? ''
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/lib/textStore.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/textStore.ts frontend/src/lib/textStore.test.ts
git commit -m "feat: add text store for local txt"
```

### Task 2: Save TXT content on import

**Files:**
- Modify: `frontend/src/pages/LibraryPage.tsx`
- Test: `frontend/src/pages/LibraryPage.test.tsx`

**Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react'
import LibraryPage from './LibraryPage'

vi.mock('../lib/library', () => ({
  loadLibrary: () => [],
  removeLibraryItem: vi.fn(),
  upsertLibraryItem: vi.fn(),
}))

vi.mock('../lib/format', () => ({
  detectFormat: vi.fn(() => 'txt'),
}))

vi.mock('../lib/textStore', () => ({
  saveText: vi.fn(),
}))

test('renders open button for local items', () => {
  render(<LibraryPage />)
  expect(screen.getByText('Import')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/pages/LibraryPage.test.tsx`
Expected: FAIL if component changes break expectations.

**Step 3: Implement TXT import save**

```tsx
import { saveText } from '../lib/textStore'

// inside onImport loop
if (format === 'txt') {
  const text = await file.text()
  saveText(id, text)
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/pages/LibraryPage.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/pages/LibraryPage.tsx frontend/src/pages/LibraryPage.test.tsx
git commit -m "feat: persist txt imports"
```

### Task 3: Render TXT content in reader

**Files:**
- Modify: `frontend/src/reader/TxtReader.tsx`
- Test: `frontend/src/reader/TxtReader.test.tsx`

**Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

test('renders txt content', () => {
  render(
    <TxtReader
      item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }}
    />
  )

  expect(screen.getByText('Hello world')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/reader/TxtReader.test.tsx`
Expected: FAIL due to missing implementation.

**Step 3: Implement TxtReader**

```tsx
import { loadText } from '../lib/textStore'

export default function TxtReader({ item }: { item: LibraryItem }) {
  const text = loadText(item.id)
  return (
    <div className="panel">
      <h2>{item.title}</h2>
      <pre className="reader-text">{text || 'No text content found.'}</pre>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/reader/TxtReader.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/reader/TxtReader.tsx frontend/src/reader/TxtReader.test.tsx
git commit -m "feat: render txt content"
```

### Task 4: Add reader styles

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add reader text styles**

```css
.reader-text {
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 1rem;
  color: var(--ink);
  margin-top: 1rem;
}
```

**Step 2: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: style txt reader"
```
