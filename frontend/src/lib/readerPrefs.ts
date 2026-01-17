import { loadJson, saveJson, PREFS_KEY } from './storage'

const BOOK_PREFS_KEY = 'relite.prefs.books'

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

export interface ReaderPreset {
  id: string
  label: string
  prefs: ReaderPrefs
}

export const defaultReaderPrefs: ReaderPrefs = {
  theme: 'paper',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.7,
  pageWidth: 720,
  textAlign: 'left',
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

export function loadReaderPrefs(): ReaderPrefs {
  return loadJson(PREFS_KEY, defaultReaderPrefs)
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  saveJson(PREFS_KEY, prefs)
}

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
