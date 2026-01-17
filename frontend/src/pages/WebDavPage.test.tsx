import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../components/I18nProvider'
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
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <MemoryRouter>
        <WebDavPage />
      </MemoryRouter>
    </I18nProvider>
  )
  expect(screen.getByText('请登录以管理 WebDAV 连接。')).toBeInTheDocument()
})
