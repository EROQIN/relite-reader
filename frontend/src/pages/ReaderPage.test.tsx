import { render, screen } from '@testing-library/react'
import ReaderPage from './ReaderPage'

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
  },
  loadReaderPrefs: () => ({
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
  }),
  saveReaderPrefs: vi.fn(),
}))

vi.mock('../reader/ReaderControls', () => ({
  default: () => <div>Controls</div>,
}))

test('renders reader settings toggle', () => {
  render(<ReaderPage />)
  expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
})
