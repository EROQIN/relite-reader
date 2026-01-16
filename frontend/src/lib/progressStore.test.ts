import { loadProgress, saveProgress } from './progressStore'

afterEach(() => {
  localStorage.clear()
})

test('saveProgress persists clamped progress', () => {
  saveProgress('id', 1.2)
  expect(loadProgress('id')).toBe(1)
})

test('loadProgress returns 0 when missing', () => {
  expect(loadProgress('missing')).toBe(0)
})
