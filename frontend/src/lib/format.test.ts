import { detectFormat } from './format'

test('detects format by file extension', () => {
  const epub = new File(['x'], 'book.epub')
  const pdf = new File(['x'], 'book.pdf')
  const txt = new File(['x'], 'book.txt')
  const mobi = new File(['x'], 'book.mobi')
  const other = new File(['x'], 'book.bin')

  expect(detectFormat(epub)).toBe('epub')
  expect(detectFormat(pdf)).toBe('pdf')
  expect(detectFormat(txt)).toBe('txt')
  expect(detectFormat(mobi)).toBe('mobi')
  expect(detectFormat(other)).toBe('unknown')
})
