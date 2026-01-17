import { loadJson, saveJson, PREFS_KEY } from './storage'

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

export const defaultReaderPrefs: ReaderPrefs = {
  theme: 'paper',
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.7,
  pageWidth: 720,
  textAlign: 'left',
}

export function loadReaderPrefs(): ReaderPrefs {
  return loadJson(PREFS_KEY, defaultReaderPrefs)
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  saveJson(PREFS_KEY, prefs)
}
