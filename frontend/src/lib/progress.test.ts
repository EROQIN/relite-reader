import { calcProgress } from './progress'

test('calcProgress handles zero scrollable area', () => {
  expect(calcProgress(0, 100, 100)).toBe(1)
})

test('calcProgress returns ratio', () => {
  expect(calcProgress(50, 200, 100)).toBe(0.5)
})
