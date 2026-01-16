# Frontend Shell + Local Reader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the React + Vite frontend shell with login, library list, and a local-import reader for EPUB/PDF/TXT plus MOBI client attempt with server fallback.

**Architecture:** A PWA React app with route-based pages (login, library, reader). Local library metadata and preferences are stored in localStorage. Format-specific readers are modular (EPUB/PDF/TXT), while MOBI tries a client parser and falls back to a backend conversion endpoint.

**Tech Stack:** React + Vite + TypeScript, React Router, vitest + Testing Library, epubjs, pdfjs-dist, @lingo-reader/mobi-parser (client attempt), vite-plugin-pwa.

### Task 1: Initialize frontend app and dependencies

**Files:**
- Create: `frontend/` (Vite app scaffold)
- Modify: `frontend/package.json`

**Step 1: Remove placeholder frontend directory if empty**

Run: `rmdir frontend`
Expected: No output.

**Step 2: Create Vite React TS app**

Run: `npm create vite@latest frontend -- --template react-ts`
Expected: Vite scaffolds app, prompts may appear; accept defaults.

**Step 3: Install runtime deps**

Run: `cd frontend && npm install react-router-dom epubjs pdfjs-dist @lingo-reader/mobi-parser`
Expected: Packages installed.

**Step 4: Install dev/test deps**

Run: `cd frontend && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom vite-plugin-pwa`
Expected: Packages installed.

**Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src
git commit -m "chore: scaffold frontend app"
```

### Task 2: Configure PWA + testing

**Files:**
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/setupTests.ts`
- Modify: `frontend/package.json`

**Step 1: Add PWA + Vitest config**

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Relite Reader',
        short_name: 'Relite',
        start_url: '/',
        display: 'standalone',
        background_color: '#f6f3ee',
        theme_color: '#1f1d1a',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts']
  }
});
```

**Step 2: Add test setup**

```ts
// frontend/src/setupTests.ts
import '@testing-library/jest-dom';
```

**Step 3: Add test scripts**

Add to `frontend/package.json` scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 4: Run tests to confirm config**

Run: `cd frontend && npm test -- --run`
Expected: No tests found (exit 0).

**Step 5: Commit**

```bash
git add frontend/vite.config.ts frontend/src/setupTests.ts frontend/package.json
git commit -m "chore: configure pwa and test setup"
```

### Task 3: Create app routes and base layout

**Files:**
- Create: `frontend/src/app/App.tsx`
- Create: `frontend/src/app/routes.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/LibraryPage.tsx`
- Create: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/components/AppShell.tsx`

**Step 1: Create router**

```tsx
// frontend/src/app/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import AppShell from '../components/AppShell';
import LoginPage from '../pages/LoginPage';
import LibraryPage from '../pages/LibraryPage';
import ReaderPage from '../pages/ReaderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'reader/:bookId', element: <ReaderPage /> }
    ]
  }
]);
```

**Step 2: Wire App and main**

```tsx
// frontend/src/app/App.tsx
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

export default function App() {
  return <RouterProvider router={router} />;
}
```

```tsx
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 3: Base shell**

```tsx
// frontend/src/components/AppShell.tsx
import { Outlet, Link } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">Relite Reader</Link>
        <nav className="app-nav">
          <Link to="/">Library</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 4: Minimal pages**

```tsx
// frontend/src/pages/LoginPage.tsx
export default function LoginPage() {
  return (
    <section className="panel">
      <h1>Sign in</h1>
      <form className="form">
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" />
        </label>
        <button type="submit">Sign in</button>
      </form>
      <p className="muted">Local-only reading is available without login.</p>
    </section>
  );
}
```

```tsx
// frontend/src/pages/LibraryPage.tsx
export default function LibraryPage() {
  return (
    <section>
      <h1>Your Library</h1>
      <div className="library-grid">
        <div className="panel">WebDAV Library (coming soon)</div>
        <div className="panel">Local Imports (coming soon)</div>
      </div>
    </section>
  );
}
```

```tsx
// frontend/src/pages/ReaderPage.tsx
export default function ReaderPage() {
  return (
    <section className="panel">
      <h1>Reader</h1>
      <p>Select a book from your library.</p>
    </section>
  );
}
```

**Step 5: Base styles**

```css
/* frontend/src/index.css */
:root {
  font-family: 'Alegreya', Georgia, serif;
  color: #1f1d1a;
  background: #f6f3ee;
}

body {
  margin: 0;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}

.app-header {
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.app-main {
  padding: 1.5rem;
}

.panel {
  background: #fffdf8;
  border: 1px solid #e7e1d7;
  padding: 1.5rem;
  border-radius: 16px;
}

.library-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.muted {
  color: #6b645c;
}
```

**Step 6: Add a basic render test**

```tsx
// frontend/src/app/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    RouterProvider: () => <div>Router</div>
  };
});

test('renders app router', () => {
  render(<App />);
  expect(screen.getByText('Router')).toBeInTheDocument();
});
```

**Step 7: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS

**Step 8: Commit**

```bash
git add frontend/src frontend/src/app frontend/src/pages frontend/src/components frontend/src/index.css
git commit -m "feat: add app shell and routes"
```

### Task 4: Implement local library model

**Files:**
- Create: `frontend/src/lib/library.ts`
- Create: `frontend/src/lib/format.ts`
- Create: `frontend/src/lib/storage.ts`
- Modify: `frontend/src/pages/LibraryPage.tsx`
- Test: `frontend/src/lib/format.test.ts`

**Step 1: Add format detection**

```ts
// frontend/src/lib/format.ts
export type BookFormat = 'epub' | 'pdf' | 'txt' | 'mobi' | 'unknown';

export function detectFormat(file: File): BookFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith('.epub')) return 'epub';
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.mobi')) return 'mobi';
  return 'unknown';
}
```

**Step 2: Add storage helpers**

```ts
// frontend/src/lib/storage.ts
const LIBRARY_KEY = 'relite.library';
const PREFS_KEY = 'relite.prefs';

export function loadJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export { LIBRARY_KEY, PREFS_KEY };
```

**Step 3: Library model**

```ts
// frontend/src/lib/library.ts
import { BookFormat } from './format';
import { LIBRARY_KEY, loadJson, saveJson } from './storage';

export type LibrarySource = 'local' | 'webdav';

export interface LibraryItem {
  id: string;
  title: string;
  author?: string;
  format: BookFormat;
  source: LibrarySource;
  fileName?: string;
  lastOpened?: string;
}

export function loadLibrary(): LibraryItem[] {
  return loadJson<LibraryItem[]>(LIBRARY_KEY, []);
}

export function saveLibrary(items: LibraryItem[]) {
  saveJson(LIBRARY_KEY, items);
}

export function upsertLibraryItem(item: LibraryItem) {
  const items = loadLibrary();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.unshift(item);
  saveLibrary(items);
}

export function removeLibraryItem(id: string) {
  const items = loadLibrary().filter((i) => i.id !== id);
  saveLibrary(items);
}
```

**Step 4: Add format test**

```ts
// frontend/src/lib/format.test.ts
import { detectFormat } from './format';

test('detects format by file extension', () => {
  const epub = new File(['x'], 'book.epub');
  const pdf = new File(['x'], 'book.pdf');
  const txt = new File(['x'], 'book.txt');
  const mobi = new File(['x'], 'book.mobi');
  const other = new File(['x'], 'book.bin');

  expect(detectFormat(epub)).toBe('epub');
  expect(detectFormat(pdf)).toBe('pdf');
  expect(detectFormat(txt)).toBe('txt');
  expect(detectFormat(mobi)).toBe('mobi');
  expect(detectFormat(other)).toBe('unknown');
});
```

**Step 5: Update library page with local import**

```tsx
// frontend/src/pages/LibraryPage.tsx
import { useMemo, useState } from 'react';
import { detectFormat } from '../lib/format';
import { loadLibrary, removeLibraryItem, upsertLibraryItem } from '../lib/library';

export default function LibraryPage() {
  const [items, setItems] = useState(() => loadLibrary());

  const localItems = useMemo(() => items.filter((i) => i.source === 'local'), [items]);

  const onImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const next = [...items];

    for (const file of files) {
      const format = detectFormat(file);
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      if (format === 'unknown') continue;

      const item = {
        id,
        title: file.name.replace(/\.[^.]+$/, ''),
        format,
        source: 'local' as const,
        fileName: file.name
      };
      upsertLibraryItem(item);
      next.unshift(item);
    }

    setItems(next);
  };

  const onRemove = (id: string) => {
    removeLibraryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section>
      <header className="section-header">
        <div>
          <h1>Your Library</h1>
          <p className="muted">Import local books or connect WebDAV.</p>
        </div>
        <label className="button">
          Import
          <input type="file" multiple hidden onChange={onImport} />
        </label>
      </header>
      <div className="library-grid">
        <div className="panel">
          <h2>WebDAV Library</h2>
          <p className="muted">Coming soon.</p>
        </div>
        <div className="panel">
          <h2>Local Imports</h2>
          {localItems.length === 0 ? (
            <p className="muted">No local books yet.</p>
          ) : (
            <ul className="book-list">
              {localItems.map((item) => (
                <li key={item.id} className="book-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="chip">{item.format.toUpperCase()}</span>
                  </div>
                  <button onClick={() => onRemove(item.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
```

**Step 6: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS

**Step 7: Commit**

```bash
git add frontend/src/lib frontend/src/pages/LibraryPage.tsx
git commit -m "feat: add local library model"
```

### Task 5: Reader shell and format stubs

**Files:**
- Create: `frontend/src/reader/ReaderShell.tsx`
- Create: `frontend/src/reader/EpubReader.tsx`
- Create: `frontend/src/reader/PdfReader.tsx`
- Create: `frontend/src/reader/TxtReader.tsx`
- Create: `frontend/src/reader/MobiReader.tsx`
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Test: `frontend/src/reader/ReaderShell.test.tsx`

**Step 1: Reader shell**

```tsx
// frontend/src/reader/ReaderShell.tsx
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { loadLibrary } from '../lib/library';
import EpubReader from './EpubReader';
import PdfReader from './PdfReader';
import TxtReader from './TxtReader';
import MobiReader from './MobiReader';

export default function ReaderShell() {
  const { bookId } = useParams();
  const item = useMemo(() => loadLibrary().find((i) => i.id === bookId), [bookId]);

  if (!item) return <p className="muted">Book not found.</p>;

  switch (item.format) {
    case 'epub':
      return <EpubReader item={item} />;
    case 'pdf':
      return <PdfReader item={item} />;
    case 'txt':
      return <TxtReader item={item} />;
    case 'mobi':
      return <MobiReader item={item} />;
    default:
      return <p className="muted">Unsupported format.</p>;
  }
}
```

**Step 2: Format stubs**

```tsx
// frontend/src/reader/EpubReader.tsx
import { LibraryItem } from '../lib/library';

export default function EpubReader({ item }: { item: LibraryItem }) {
  return <div className="panel">EPUB reader for {item.title}</div>;
}
```

```tsx
// frontend/src/reader/PdfReader.tsx
import { LibraryItem } from '../lib/library';

export default function PdfReader({ item }: { item: LibraryItem }) {
  return <div className="panel">PDF reader for {item.title}</div>;
}
```

```tsx
// frontend/src/reader/TxtReader.tsx
import { LibraryItem } from '../lib/library';

export default function TxtReader({ item }: { item: LibraryItem }) {
  return <div className="panel">TXT reader for {item.title}</div>;
}
```

```tsx
// frontend/src/reader/MobiReader.tsx
import { LibraryItem } from '../lib/library';

export default function MobiReader({ item }: { item: LibraryItem }) {
  return (
    <div className="panel">
      MOBI reader for {item.title}. If parsing fails, use server conversion.
    </div>
  );
}
```

**Step 3: Reader page uses shell**

```tsx
// frontend/src/pages/ReaderPage.tsx
import ReaderShell from '../reader/ReaderShell';

export default function ReaderPage() {
  return (
    <section>
      <h1>Reader</h1>
      <ReaderShell />
    </section>
  );
}
```

**Step 4: Add test**

```tsx
// frontend/src/reader/ReaderShell.test.tsx
import { render, screen } from '@testing-library/react';
import ReaderShell from './ReaderShell';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'missing' })
}));

vi.mock('../lib/library', () => ({
  loadLibrary: () => []
}));

test('shows not found for missing book', () => {
  render(<ReaderShell />);
  expect(screen.getByText('Book not found.')).toBeInTheDocument();
});
```

**Step 5: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS

**Step 6: Commit**

```bash
git add frontend/src/reader frontend/src/pages/ReaderPage.tsx
git commit -m "feat: add reader shell"
```

### Task 6: Add optimized UI variant (comparison file)

**Files:**
- Create: `frontend/src/compare/LibraryOptimized.tsx`
- Modify: `frontend/src/pages/LibraryPage.tsx`

**Step 1: Create optimized UI file (for comparison)**

```tsx
// frontend/src/compare/LibraryOptimized.tsx
import { LibraryItem } from '../lib/library';

interface Props {
  localItems: LibraryItem[];
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
}

export default function LibraryOptimized({ localItems, onImport, onRemove }: Props) {
  return (
    <section className="library-optimized">
      <header className="hero">
        <div>
          <span className="overline">Relite Reader</span>
          <h1>Curate your quiet library.</h1>
          <p className="muted">Blend local files and WebDAV shelves into a single reading space.</p>
        </div>
        <label className="button primary">
          Import
          <input type="file" multiple hidden onChange={onImport} />
        </label>
      </header>
      <div className="split-grid">
        <section className="panel">
          <h2>WebDAV Library</h2>
          <p className="muted">Connect to sync your remote shelves.</p>
        </section>
        <section className="panel">
          <h2>Local Imports</h2>
          {localItems.length === 0 ? (
            <p className="muted">No local books yet.</p>
          ) : (
            <ul className="book-list">
              {localItems.map((item) => (
                <li key={item.id} className="book-row">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="chip">{item.format.toUpperCase()}</span>
                  </div>
                  <button onClick={() => onRemove(item.id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
```

**Step 2: Use optimized UI while keeping comparison file**

```tsx
// frontend/src/pages/LibraryPage.tsx
import LibraryOptimized from '../compare/LibraryOptimized';

// ...inside component return
return (
  <LibraryOptimized localItems={localItems} onImport={onImport} onRemove={onRemove} />
);
```

**Step 3: Run tests**

Run: `cd frontend && npm test -- --run`
Expected: PASS

**Step 4: Commit**

```bash
git add frontend/src/compare/LibraryOptimized.tsx frontend/src/pages/LibraryPage.tsx
git commit -m "feat: add optimized library layout"
```
