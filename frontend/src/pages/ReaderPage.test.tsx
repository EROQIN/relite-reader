import { render, screen } from '@testing-library/react'
import ReaderPage from './ReaderPage'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'book-1' }),
}))

vi.mock('../reader/ReaderShell', () => ({
  default: () => <div>Shell</div>,
}))

vi.mock('../lib/readerPrefs', () => ({
  defaultReaderPrefs: {
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
  },
  loadReaderPrefs: () => ({
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
  }),
  loadReaderPrefsForBook: () => null,
  saveReaderPrefs: vi.fn(),
  saveReaderPrefsForBook: vi.fn(),
  clearReaderPrefsForBook: vi.fn(),
  readerPresets: [{ id: 'paper', label: 'Paper Focus', prefs: { theme: 'paper' } }],
}))

test('renders focus mode label', () => {
  render(<ReaderPage />)
  expect(screen.getByText(/focus mode/i)).toBeInTheDocument()
})
