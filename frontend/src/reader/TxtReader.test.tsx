import { render, screen } from '@testing-library/react'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

test('renders txt content', () => {
  render(
    <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
  )

  expect(screen.getByText('Hello world')).toBeInTheDocument()
})
