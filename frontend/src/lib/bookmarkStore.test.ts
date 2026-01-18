import { loadBookmarks, saveBookmarks } from './bookmarkStore'

afterEach(() => {
  localStorage.clear()
})

test('bookmark store saves and loads', () => {
  saveBookmarks('book-1', [
    { id: 'b1', label: 'Intro', location: 0.2, createdAt: 'now' },
  ])
  const loaded = loadBookmarks('book-1')
  expect(loaded).toHaveLength(1)
  expect(loaded[0].label).toBe('Intro')
})
