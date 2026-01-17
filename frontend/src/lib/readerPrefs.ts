import { loadJson, saveJson, PREFS_KEY } from './storage'

const BOOK_PREFS_KEY = 'relite.prefs.books'
const CUSTOM_PRESETS_KEY = 'relite.prefs.customPresets'

export type ReaderTheme = 'paper' | 'sepia' | 'night' | 'slate' | 'mist'
export type ReaderFont = 'sans' | 'serif' | 'mono'
export type ReaderAlign = 'left' | 'justify'
export type ReaderLayoutMode = 'single' | 'columns'

export interface ReaderPrefs {
  theme: ReaderTheme
  font: ReaderFont
  fontSize: number
  lineHeight: number
  pageWidth: number
  textAlign: ReaderAlign
  layoutMode: ReaderLayoutMode
  focusMode: boolean
  readingSpeed: number
  background: string
  brightness: number
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
  layoutMode: 'single',
  focusMode: false,
  readingSpeed: 240,
  background: '',
  brightness: 1,
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
  {
    id: 'slate',
    label: 'Slate Focus',
    prefs: { ...defaultReaderPrefs, theme: 'slate', font: 'sans', fontSize: 17 },
  },
  {
    id: 'mist',
    label: 'Mist Daylight',
    prefs: { ...defaultReaderPrefs, theme: 'mist', font: 'sans', fontSize: 18 },
  },
]

const normalizePrefs = (prefs: Partial<ReaderPrefs> | null | undefined): ReaderPrefs => {
  if (!prefs) return { ...defaultReaderPrefs }
  return {
    ...defaultReaderPrefs,
    ...prefs,
    background: prefs.background ?? defaultReaderPrefs.background,
    brightness: prefs.brightness ?? defaultReaderPrefs.brightness,
  }
}

export function loadCustomPresets(): ReaderPreset[] {
  const presets = loadJson<ReaderPreset[]>(CUSTOM_PRESETS_KEY, [])
  if (!Array.isArray(presets)) {
    return []
  }
  return presets.map((preset) => ({
    ...preset,
    prefs: normalizePrefs(preset.prefs),
  }))
}

export function saveCustomPresets(presets: ReaderPreset[]) {
  saveJson(CUSTOM_PRESETS_KEY, presets)
}

export function createCustomPreset(label: string, prefs: ReaderPrefs): ReaderPreset {
  const normalized = label.trim()
  const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return {
    id,
    label: normalized,
    prefs: { ...prefs },
  }
}

export function loadReaderPrefs(): ReaderPrefs {
  const prefs = loadJson<Partial<ReaderPrefs>>(PREFS_KEY, defaultReaderPrefs)
  return normalizePrefs(prefs)
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  saveJson(PREFS_KEY, prefs)
}

export function loadReaderPrefsForBook(bookId: string): ReaderPrefs | null {
  const map = loadJson<Record<string, ReaderPrefs>>(BOOK_PREFS_KEY, {})
  const prefs = map[bookId]
  return prefs ? normalizePrefs(prefs) : null
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
