import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider, useI18n } from './I18nProvider'

function Demo() {
  const { t, setLocale } = useI18n()
  return (
    <div>
      <span>{t('nav.library')}</span>
      <button onClick={() => setLocale('zh-CN')}>toggle</button>
    </div>
  )
}

test('switches locale and updates translations', async () => {
  render(
    <I18nProvider>
      <Demo />
    </I18nProvider>,
  )
  expect(screen.getByText('Library')).toBeInTheDocument()
  const user = userEvent.setup()
  await user.click(screen.getByText('toggle'))
  expect(screen.getByText('书库')).toBeInTheDocument()
})
