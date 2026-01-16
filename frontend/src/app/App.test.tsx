import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    RouterProvider: () => <div>Router</div>,
  }
})

test('renders app router', () => {
  render(<App />)
  expect(screen.getByText('Router')).toBeInTheDocument()
})
