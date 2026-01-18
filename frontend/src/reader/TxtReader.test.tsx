import { render, screen } from '@testing-library/react'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

vi.mock('../lib/progressStore', () => ({
  loadProgress: () => 0.25,
  saveProgress: vi.fn(),
}))

vi.mock('../lib/bookmarkApi', () => ({
  fetchBookmarks: vi.fn().mockResolvedValue([]),
  createBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}))

vi.mock('../lib/bookmarkStore', () => ({
  loadBookmarks: () => [],
  saveBookmarks: vi.fn(),
}))

vi.mock('../lib/authApi', () => ({
  getToken: () => null,
}))

test('renders txt content', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

test('shows progress percent', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getAllByText('25%').length).toBeGreaterThan(0)
})
