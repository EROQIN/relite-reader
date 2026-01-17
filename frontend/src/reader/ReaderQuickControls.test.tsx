import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import ReaderQuickControls from './ReaderQuickControls'

test('renders localized quick controls', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <ReaderQuickControls
        onTheme={() => {}}
        onIncrease={() => {}}
        onDecrease={() => {}}
        onLayout={() => {}}
        onFocus={() => {}}
        onSettings={() => {}}
      />
    </I18nProvider>
  )
  expect(screen.getByText('主题')).toBeInTheDocument()
})
