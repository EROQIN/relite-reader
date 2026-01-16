import { loadText, saveText } from './textStore'

afterEach(() => {
  localStorage.clear()
})

test('saveText persists text by id', () => {
  saveText('abc', 'hello')
  expect(loadText('abc')).toBe('hello')
})

test('loadText returns empty string when missing', () => {
  expect(loadText('missing')).toBe('')
})
