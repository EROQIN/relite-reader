import { render, screen } from '@testing-library/react'
import LibraryPage from './LibraryPage'

vi.mock('../lib/library', () => ({
  loadLibrary: () => [],
  removeLibraryItem: vi.fn(),
  upsertLibraryItem: vi.fn(),
}))

vi.mock('../lib/format', () => ({
  detectFormat: vi.fn(() => 'epub'),
}))

test('shows empty local library state', () => {
  render(<LibraryPage />)
  expect(screen.getByText('No local books yet.')).toBeInTheDocument()
})
