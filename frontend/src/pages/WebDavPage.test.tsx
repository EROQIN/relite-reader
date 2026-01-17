import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WebDavPage from './WebDavPage'

vi.mock('../lib/authApi', () => ({
  getToken: () => null,
}))

vi.mock('../lib/webdavApi', () => ({
  listConnections: vi.fn().mockResolvedValue([]),
  createConnection: vi.fn(),
  updateConnection: vi.fn(),
  deleteConnection: vi.fn(),
  syncConnection: vi.fn(),
}))

test('requires login when missing token', () => {
  render(
    <MemoryRouter>
      <WebDavPage />
    </MemoryRouter>
  )
  expect(
    screen.getByText('Sign in to manage your WebDAV connections.')
  ).toBeInTheDocument()
})
