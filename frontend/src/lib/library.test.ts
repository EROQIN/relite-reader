import { loadLibrary, removeLibraryItem, updateLastOpened, upsertLibraryItem } from './library'

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

test('updateLastOpened sets timestamp', () => {
  upsertLibraryItem({
    id: '1',
    title: 'Test Book',
    format: 'epub',
    source: 'local',
  })

  updateLastOpened('1', '2026-01-16T00:00:00Z')
  const items = loadLibrary()
  expect(items[0].lastOpened).toBe('2026-01-16T00:00:00Z')
})
