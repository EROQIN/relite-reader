import { fireEvent, render, screen } from '@testing-library/react'
import LoginPage from './LoginPage'

vi.mock('../lib/authApi', () => ({
  authenticate: vi.fn().mockResolvedValue('token'),
}))

test('renders login form', () => {
  render(<LoginPage />)
  expect(screen.getByText('Sign in')).toBeInTheDocument()
})

test('toggles to register', () => {
  render(<LoginPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Need an account?' }))
  expect(screen.getByText('Create account')).toBeInTheDocument()
})
