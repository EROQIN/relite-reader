import {
  defaultReaderPrefs,
  loadReaderPrefs,
  saveReaderPrefs,
  loadReaderPrefsForBook,
  saveReaderPrefsForBook,
  clearReaderPrefsForBook,
  readerPresets,
  loadCustomPresets,
  saveCustomPresets,
  createCustomPreset,
} from './readerPrefs'

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

test('reader presets include night', () => {
  const ids = readerPresets.map((preset) => preset.id)
  expect(ids).toContain('night')
})

test('book prefs override is stored and cleared', () => {
  const bookId = 'book-1'
  saveReaderPrefsForBook(bookId, { ...defaultReaderPrefs, fontSize: 21 })
  expect(loadReaderPrefsForBook(bookId)?.fontSize).toBe(21)
  clearReaderPrefsForBook(bookId)
  expect(loadReaderPrefsForBook(bookId)).toBeNull()
})

test('custom presets persist and trim labels', () => {
  const created = createCustomPreset('  Calm  ', {
    ...defaultReaderPrefs,
    fontSize: 20,
  })
  saveCustomPresets([created])
  const loaded = loadCustomPresets()
  expect(loaded).toHaveLength(1)
  expect(loaded[0].label).toBe('Calm')
  expect(loaded[0].prefs.fontSize).toBe(20)
})

test('reader prefs include layout and focus fields', () => {
  const prefs = loadReaderPrefs()
  expect(prefs.layoutMode).toBeDefined()
  expect(prefs.focusMode).toBeDefined()
  expect(defaultReaderPrefs.layoutMode).toBe('single')
})
