import { render, screen } from '@testing-library/react'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

vi.mock('../lib/progressStore', () => ({
  loadProgress: () => 0.25,
  saveProgress: vi.fn(),
}))

test('renders txt content', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

test('shows progress percent', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getByText('25%')).toBeInTheDocument()
})
