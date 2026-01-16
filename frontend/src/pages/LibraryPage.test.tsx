import { render, screen } from '@testing-library/react'
import LibraryPage from './LibraryPage'

vi.mock('../lib/library', () => ({
  loadLibrary: () => [
    { id: '1', title: 'Local Book', format: 'txt', source: 'local' },
  ],
  removeLibraryItem: vi.fn(),
  upsertLibraryItem: vi.fn(),
  updateLastOpened: vi.fn(),
}))

vi.mock('../lib/format', () => ({
  detectFormat: vi.fn(() => 'txt'),
}))

vi.mock('../lib/textStore', () => ({
  saveText: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

test('shows open button for local item', () => {
  render(<LibraryPage />)
  expect(screen.getByText('Open')).toBeInTheDocument()
})
