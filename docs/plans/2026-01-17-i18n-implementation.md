# i18n (English + Chinese) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add English + Chinese localization to the frontend with auto-detect, manual switching, and persistence via localStorage and `/api/preferences`.

**Architecture:** Add a lightweight frontend i18n module and context provider, extend server preferences with a `locale` field, and ensure reader preference saves include locale. Use translation keys across UI components.

**Tech Stack:** React + Vite, Vitest, Go (net/http), PostgreSQL (preferences storage), localStorage.

### Task 1: Backend locale normalization in preferences

**Files:**
- Create: `backend/internal/preferences/preferences_test.go`
- Modify: `backend/internal/preferences/preferences.go`

**Step 1: Write the failing test**

```go
package preferences

import "testing"

func TestNormalizeUserPreferencesLocale(t *testing.T) {
	tests := []struct {
		name   string
		input  string
		expect string
	}{
		{"default", "", "en"},
		{"english", "en", "en"},
		{"chinese", "zh-CN", "zh-CN"},
		{"chinese-short", "zh", "zh-CN"},
		{"invalid", "fr", "en"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := NormalizeUserPreferences(UserPreferences{Locale: tc.input})
			if got.Locale != tc.expect {
				t.Fatalf("expected %q, got %q", tc.expect, got.Locale)
			}
		})
	}
}
```

**Step 2: Run test to verify it fails**

Run: `go test ./internal/preferences -run TestNormalizeUserPreferencesLocale`
Expected: FAIL (missing `Locale` field / normalize behavior)

**Step 3: Write minimal implementation**

```go
type UserPreferences struct {
	Locale string `json:"locale"`
	Reader ReaderPreferences `json:"reader"`
}

var allowedLocales = map[string]string{
	"en":    "en",
	"zh":    "zh-CN",
	"zh-CN": "zh-CN",
}

func normalizeLocale(input string) string {
	if value, ok := allowedLocales[input]; ok {
		return value
	}
	return "en"
}

func DefaultUserPreferences() UserPreferences {
	return UserPreferences{Locale: "en", Reader: DefaultReaderPreferences()}
}

func NormalizeUserPreferences(input UserPreferences) UserPreferences {
	return UserPreferences{
		Locale: normalizeLocale(input.Locale),
		Reader: NormalizeReaderPreferences(input.Reader),
	}
}
```

**Step 4: Run test to verify it passes**

Run: `go test ./internal/preferences -run TestNormalizeUserPreferencesLocale`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/preferences/preferences.go backend/internal/preferences/preferences_test.go
git commit -m "feat: add locale to user preferences"
```

### Task 2: Preferences handler returns locale

**Files:**
- Modify: `backend/internal/http/handlers/preferences_test.go`

**Step 1: Write the failing test**

Update expected JSON to include locale:

```go
func TestPreferencesHandlerGetDefaults(t *testing.T) {
	// ...
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
	var payload preferences.UserPreferences
	if err := json.NewDecoder(rec.Body).Decode(&payload); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if payload.Locale != "en" {
		t.Fatalf("expected locale en, got %q", payload.Locale)
	}
}
```

And in `TestPreferencesHandlerPutUpdates`, include locale in the PUT payload and assert it round-trips.

**Step 2: Run test to verify it fails**

Run: `go test ./internal/http/handlers -run TestPreferencesHandler`
Expected: FAIL (missing locale in response or mismatch)

**Step 3: Write minimal implementation**

If handler already serializes `UserPreferences`, no code changes should be needed beyond Task 1. Only adjust tests.

**Step 4: Run test to verify it passes**

Run: `go test ./internal/http/handlers -run TestPreferencesHandler`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/internal/http/handlers/preferences_test.go
git commit -m "test: cover locale in preferences handler"
```

### Task 3: Frontend i18n utilities (locale detection + storage)

**Files:**
- Create: `frontend/src/lib/i18n.ts`
- Create: `frontend/src/lib/i18n.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectLocale, normalizeLocale, getStoredLocale } from './i18n'

describe('i18n locale helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('normalizes supported locales', () => {
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('zh')).toBe('zh-CN')
    expect(normalizeLocale('zh-CN')).toBe('zh-CN')
    expect(normalizeLocale('fr')).toBe('en')
  })

  it('detects browser locale with fallback', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN')
    expect(detectLocale()).toBe('zh-CN')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    expect(detectLocale()).toBe('en')
  })

  it('reads stored locale if available', () => {
    localStorage.setItem('relite.locale', 'zh-CN')
    expect(getStoredLocale()).toBe('zh-CN')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/i18n.test.ts`
Expected: FAIL (module missing)

**Step 3: Write minimal implementation**

```ts
export type Locale = 'en' | 'zh-CN'

const LOCALE_KEY = 'relite.locale'
const SUPPORTED: Record<string, Locale> = { en: 'en', zh: 'zh-CN', 'zh-CN': 'zh-CN' }

export function normalizeLocale(input: string | null | undefined): Locale {
  if (!input) return 'en'
  return SUPPORTED[input] ?? 'en'
}

export function detectLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (lang.startsWith('zh')) return 'zh-CN'
  return normalizeLocale(lang)
}

export function getStoredLocale(): Locale | null {
  const stored = localStorage.getItem(LOCALE_KEY)
  return stored ? normalizeLocale(stored) : null
}

export function saveLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale)
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/i18n.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/i18n.ts frontend/src/lib/i18n.test.ts
git commit -m "feat: add i18n locale helpers"
```

### Task 4: I18n provider + language switcher

**Files:**
- Create: `frontend/src/components/I18nProvider.tsx`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Create: `frontend/src/components/I18nProvider.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { I18nProvider, useI18n } from './I18nProvider'

function Demo() {
  const { t, setLocale } = useI18n()
  return (
    <div>
      <span>{t('nav.library')}</span>
      <button onClick={() => setLocale('zh-CN')}>toggle</button>
    </div>
  )
}

test('switches locale and updates translations', () => {
  render(
    <I18nProvider>
      <Demo />
    </I18nProvider>,
  )
  expect(screen.getByText('Library')).toBeInTheDocument()
  screen.getByText('toggle').click()
  expect(screen.getByText('书库')).toBeInTheDocument()
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/I18nProvider.test.tsx`
Expected: FAIL (provider missing)

**Step 3: Write minimal implementation**

Create a provider that:
- Holds `locale` state (from storage/detect).
- Exposes `t(key)` and `setLocale`.
- Updates `document.documentElement.lang` and saves locale.

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/I18nProvider.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/components/I18nProvider.tsx frontend/src/components/I18nProvider.test.tsx frontend/src/main.tsx frontend/src/components/AppShell.tsx
git commit -m "feat: add i18n provider and switcher"
```

### Task 5: Preferences API supports locale + ReaderPage sync

**Files:**
- Create: `frontend/src/lib/userPreferences.ts`
- Modify: `frontend/src/lib/preferencesApi.ts`
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/pages/ReaderPage.test.tsx`

**Step 1: Write the failing test**

Update ReaderPage test to assert `savePreferences` receives locale:

```tsx
expect(savePreferences).toHaveBeenCalledWith(expect.any(String), {
  locale: 'en',
  reader: expect.any(Object),
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/pages/ReaderPage.test.tsx`
Expected: FAIL (savePreferences signature mismatch)

**Step 3: Write minimal implementation**

```ts
export interface UserPreferences {
  locale: string
  reader: ReaderPrefs
}

export async function fetchPreferences(token: string): Promise<UserPreferences | null> {
  // return { locale, reader }
}

export async function savePreferences(token: string, prefs: UserPreferences) {
  // PUT { locale, reader }
}
```

In `ReaderPage`, load `UserPreferences`, apply `reader` to state, and include `locale` from the i18n context when saving.

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/pages/ReaderPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/lib/userPreferences.ts frontend/src/lib/preferencesApi.ts frontend/src/pages/ReaderPage.tsx frontend/src/pages/ReaderPage.test.tsx
git commit -m "feat: sync locale via preferences"
```

### Task 6: Translate UI strings

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/LibraryPage.tsx`
- Modify: `frontend/src/pages/WebDavPage.tsx`
- Modify: `frontend/src/pages/ReaderPage.tsx`
- Modify: `frontend/src/reader/ReaderControls.tsx`
- Modify: `frontend/src/reader/ReaderQuickControls.tsx`
- Modify: `frontend/src/reader/TxtReader.tsx`
- Modify: `frontend/src/reader/PlaceholderReader.tsx`
- Modify: `frontend/src/components/PwaInstallPrompt.tsx`
- Modify: `frontend/src/lib/readerPrefs.ts`
- Modify tests that assert English text:
  - `frontend/src/pages/LoginPage.test.tsx`
  - `frontend/src/pages/LibraryPage.test.tsx`
  - `frontend/src/pages/WebDavPage.test.tsx`
  - `frontend/src/pages/ReaderPage.test.tsx`

**Step 1: Write the failing test**

Update one test at a time to assert translated strings via `t()` (or provide locale context).

**Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/pages/LoginPage.test.tsx`
Expected: FAIL (strings replaced)

**Step 3: Write minimal implementation**

Replace hardcoded strings with `t('key')`. Add English and Chinese strings in the dictionary.

**Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/pages/LoginPage.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx frontend/src/pages/LoginPage.test.tsx
git commit -m "feat: localize login page"
```

Repeat the same pattern for each page/component, committing after each component or pair.

### Task 7: README update

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

Documentation only; no test.

**Step 2: Update README**

Add:
- i18n setup and supported locales
- How locale is detected and persisted
- Notes on editing translation strings

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document i18n support"
```

