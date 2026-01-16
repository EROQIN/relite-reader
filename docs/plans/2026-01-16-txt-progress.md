# TXT Progress Tracking Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track and display reading progress for TXT books based on scroll position.

**Architecture:** Store progress in localStorage per book id. The TxtReader computes progress from scroll metrics and persists it on scroll. A lightweight progress bar and percentage are displayed in the reader header.

**Tech Stack:** React + Vite + TypeScript, Vitest, localStorage.

### Task 1: Add progress store helper

**Files:**
- Create: `frontend/src/lib/progressStore.ts`
- Test: `frontend/src/lib/progressStore.test.ts`

**Step 1: Write failing test**

```ts
import { loadProgress, saveProgress } from './progressStore'

afterEach(() => {
  localStorage.clear()
})

test('saveProgress persists clamped progress', () => {
  saveProgress('id', 1.2)
  expect(loadProgress('id')).toBe(1)
})

test('loadProgress returns 0 when missing', () => {
  expect(loadProgress('missing')).toBe(0)
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/lib/progressStore.test.ts`
Expected: FAIL due to missing module.

**Step 3: Implement helper**

```ts
const prefix = 'relite.progress.'

function clamp(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function saveProgress(id: string, progress: number) {
  localStorage.setItem(`${prefix}${id}`, String(clamp(progress)))
}

export function loadProgress(id: string): number {
  const raw = localStorage.getItem(`${prefix}${id}`)
  if (!raw) return 0
  const parsed = Number(raw)
  return clamp(parsed)
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/lib/progressStore.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/progressStore.ts frontend/src/lib/progressStore.test.ts
git commit -m "feat: add progress store"
```

### Task 2: Add progress calculation helper

**Files:**
- Create: `frontend/src/lib/progress.ts`
- Test: `frontend/src/lib/progress.test.ts`

**Step 1: Write failing test**

```ts
import { calcProgress } from './progress'

test('calcProgress handles zero scrollable area', () => {
  expect(calcProgress(0, 100, 100)).toBe(1)
})

test('calcProgress returns ratio', () => {
  expect(calcProgress(50, 200, 100)).toBe(0.5)
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/lib/progress.test.ts`
Expected: FAIL due to missing module.

**Step 3: Implement helper**

```ts
export function calcProgress(scrollTop: number, scrollHeight: number, clientHeight: number) {
  const maxScroll = scrollHeight - clientHeight
  if (maxScroll <= 0) return 1
  return Math.min(1, Math.max(0, scrollTop / maxScroll))
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/lib/progress.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/lib/progress.ts frontend/src/lib/progress.test.ts
git commit -m "feat: add progress calculation"
```

### Task 3: Update TxtReader to persist progress

**Files:**
- Modify: `frontend/src/reader/TxtReader.tsx`
- Modify: `frontend/src/reader/TxtReader.test.tsx`

**Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

vi.mock('../lib/progressStore', () => ({
  loadProgress: () => 0.25,
  saveProgress: vi.fn(),
}))

test('shows progress percent', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getByText('25%')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --run src/reader/TxtReader.test.tsx`
Expected: FAIL until progress UI added.

**Step 3: Implement progress UI and scroll handler**

```tsx
import { loadProgress, saveProgress } from '../lib/progressStore'
import { calcProgress } from '../lib/progress'

const [progress, setProgress] = useState(() => loadProgress(item.id))

const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
  const target = event.currentTarget
  const next = calcProgress(target.scrollTop, target.scrollHeight, target.clientHeight)
  setProgress(next)
  saveProgress(item.id, next)
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- --run src/reader/TxtReader.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add frontend/src/reader/TxtReader.tsx frontend/src/reader/TxtReader.test.tsx
git commit -m "feat: track txt progress"
```

### Task 4: Add reader progress styles

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add progress styles**

```css
.reader-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.reader-progress {
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.reader-scroll {
  max-height: 60vh;
  overflow: auto;
}
```

**Step 2: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS.

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: style reader progress"
```
