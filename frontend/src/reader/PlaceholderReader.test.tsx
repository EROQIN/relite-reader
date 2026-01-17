import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import PlaceholderReader from './PlaceholderReader'

test('renders localized placeholder message', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <PlaceholderReader
        item={{ id: '1', title: 'Kindle Sample', format: 'azw', source: 'local' }}
      />
    </I18nProvider>
  )
  expect(screen.getByText('检测到 Kindle 格式，转换支持已排队。')).toBeInTheDocument()
})
