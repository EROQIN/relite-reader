import { loadAnnotations, saveAnnotations } from './annotationStore'

afterEach(() => {
  localStorage.clear()
})

test('stores annotations per book', () => {
  const bookId = 'book-1'
  saveAnnotations(bookId, [
    {
      id: 'an-1',
      location: 0.42,
      quote: 'Quote',
      note: 'Note',
      color: '#ffcc00',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ])
  const items = loadAnnotations(bookId)
  expect(items).toHaveLength(1)
  expect(items[0].quote).toBe('Quote')
})
