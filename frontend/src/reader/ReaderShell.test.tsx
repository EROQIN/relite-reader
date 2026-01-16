import { render, screen } from '@testing-library/react'
import ReaderShell from './ReaderShell'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'missing' }),
}))

vi.mock('../lib/library', () => ({
  loadLibrary: () => [],
}))

test('shows not found for missing book', () => {
  render(<ReaderShell />)
  expect(screen.getByText('Book not found.')).toBeInTheDocument()
})
