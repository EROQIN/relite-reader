import { loadLibrary, removeLibraryItem, upsertLibraryItem } from './library'

beforeEach(() => {
  localStorage.clear()
})

test('loadLibrary returns empty by default', () => {
  expect(loadLibrary()).toEqual([])
})

test('upsertLibraryItem adds item', () => {
  upsertLibraryItem({
    id: '1',
    title: 'Test Book',
    format: 'epub',
    source: 'local',
  })

  const items = loadLibrary()
  expect(items).toHaveLength(1)
  expect(items[0].title).toBe('Test Book')
})

test('removeLibraryItem removes item', () => {
  upsertLibraryItem({
    id: '1',
    title: 'Test Book',
    format: 'epub',
    source: 'local',
  })
  removeLibraryItem('1')
  expect(loadLibrary()).toEqual([])
})
