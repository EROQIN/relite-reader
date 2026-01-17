import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import ReaderShortcuts from './ReaderShortcuts'

test('renders localized shortcuts panel', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <ReaderShortcuts open onClose={() => {}} />
    </I18nProvider>
  )
  expect(screen.getByRole('heading', { name: '快捷键' })).toBeInTheDocument()
})
