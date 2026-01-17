import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import EpubReader from './EpubReader'
import PdfReader from './PdfReader'
import MobiReader from './MobiReader'

const renderWithLocale = (ui: React.ReactNode) => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(<I18nProvider>{ui}</I18nProvider>)
}

test('localizes epub placeholder', () => {
  renderWithLocale(<EpubReader item={{ id: '1', title: '样本', format: 'epub', source: 'local' }} />)
  expect(screen.getByText('EPUB 阅读器：样本')).toBeInTheDocument()
})

test('localizes pdf placeholder', () => {
  renderWithLocale(<PdfReader item={{ id: '2', title: '示例', format: 'pdf', source: 'local' }} />)
  expect(screen.getByText('PDF 阅读器：示例')).toBeInTheDocument()
})

test('localizes mobi placeholder', () => {
  renderWithLocale(<MobiReader item={{ id: '3', title: '样章', format: 'mobi', source: 'local' }} />)
  expect(
    screen.getByText('MOBI 阅读器：样章。若解析失败，请使用服务器转换。')
  ).toBeInTheDocument()
})
