import { loadReaderPrefs, saveReaderPrefs, defaultReaderPrefs } from './readerPrefs'

afterEach(() => {
  localStorage.clear()
})

test('loadReaderPrefs returns defaults when missing', () => {
  const prefs = loadReaderPrefs()
  expect(prefs).toEqual(defaultReaderPrefs)
})

test('saveReaderPrefs persists values', () => {
  const next = { ...defaultReaderPrefs, fontSize: 20 }
  saveReaderPrefs(next)
  expect(loadReaderPrefs()).toEqual(next)
})
