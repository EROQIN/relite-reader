import { loadJson, saveJson, LIBRARY_KEY } from './storage'

afterEach(() => {
  localStorage.clear()
})

test('loadJson returns fallback when missing', () => {
  const value = loadJson(LIBRARY_KEY, [])
  expect(value).toEqual([])
})

test('saveJson persists value', () => {
  saveJson(LIBRARY_KEY, { count: 2 })
  const value = loadJson(LIBRARY_KEY, { count: 0 })
  expect(value).toEqual({ count: 2 })
})
