import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import TxtReader from './TxtReader'

vi.mock('../lib/textStore', () => ({
  loadText: () => 'Hello world',
}))

vi.mock('../lib/progressStore', () => ({
  loadProgress: () => 0.25,
  saveProgress: vi.fn(),
}))

vi.mock('../lib/bookmarkApi', () => ({
  fetchBookmarks: vi.fn().mockResolvedValue([]),
  createBookmark: vi.fn(),
  deleteBookmark: vi.fn(),
}))

vi.mock('../lib/bookmarkStore', () => ({
  loadBookmarks: () => [],
  saveBookmarks: vi.fn(),
}))

vi.mock('../lib/authApi', () => ({
  getToken: () => null,
}))

const renderWithLocale = () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <TxtReader item={{ id: '1', title: 'Test', format: 'txt', source: 'local' }} />
    </I18nProvider>
  )
}

test('renders txt content', () => {
  renderWithLocale()

  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

test('shows progress percent', () => {
  renderWithLocale()

  expect(screen.getAllByText('25%').length).toBeGreaterThan(0)
  expect(screen.getByLabelText('阅读进度')).toBeInTheDocument()
})
