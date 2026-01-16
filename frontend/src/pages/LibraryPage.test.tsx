import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LibraryPage from './LibraryPage'

vi.mock('../lib/library', () => ({
  loadLibrary: () => [],
  removeLibraryItem: vi.fn(),
  upsertLibraryItem: vi.fn(),
}))

vi.mock('../lib/format', () => ({
  detectFormat: vi.fn(() => 'txt'),
}))

vi.mock('../lib/textStore', () => ({
  saveText: vi.fn(),
}))

test('saves txt content on import', async () => {
  const { saveText } = await import('../lib/textStore')
  render(<LibraryPage />)

  const file = new File(['hello'], 'note.txt', { type: 'text/plain' })
  Object.defineProperty(file, 'text', { value: () => Promise.resolve('hello') })

  const input = screen.getByLabelText('Import') as HTMLInputElement
  fireEvent.change(input, { target: { files: [file] } })

  await waitFor(() => {
    expect(saveText).toHaveBeenCalledWith(expect.any(String), 'hello')
  })
})
