import { render, screen } from '@testing-library/react'
import { I18nProvider } from './I18nProvider'
import AppShell from './AppShell'

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Outlet: () => <div>Outlet</div>,
}))

vi.mock('../lib/authApi', () => ({
  getToken: () => null,
  clearToken: vi.fn(),
}))

test('renders localized navigation', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  window.matchMedia =
    window.matchMedia ||
    (() =>
      ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as MediaQueryList)
  render(
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  )
  expect(screen.getByText('书库')).toBeInTheDocument()
  expect(screen.getByText('登录')).toBeInTheDocument()
})
