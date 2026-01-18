import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import ReaderShell from './ReaderShell'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'missing' }),
}))

vi.mock('../lib/library', () => ({
  loadLibrary: () => [],
}))

vi.mock('../lib/remoteLibrary', () => ({
  loadRemoteLibrary: () => [],
}))

test('shows not found for missing book', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <ReaderShell />
    </I18nProvider>
  )
  expect(screen.getByText('未找到图书。')).toBeInTheDocument()
})
