import { fireEvent, render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import LoginPage from './LoginPage'

vi.mock('../lib/authApi', () => ({
  authenticate: vi.fn().mockResolvedValue('token'),
}))

const renderWithLocale = () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  return render(
    <I18nProvider>
      <LoginPage />
    </I18nProvider>,
  )
}

test('renders login form', () => {
  renderWithLocale()
  expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument()
})

test('toggles to register', () => {
  renderWithLocale()
  fireEvent.click(screen.getByRole('button', { name: '需要账号？' }))
  expect(
    screen.getByRole('heading', { name: '创建账号' })
  ).toBeInTheDocument()
})
