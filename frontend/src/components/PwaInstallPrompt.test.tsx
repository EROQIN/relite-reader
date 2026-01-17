import { act, render, screen } from '@testing-library/react'
import { I18nProvider } from './I18nProvider'
import PwaInstallPrompt from './PwaInstallPrompt'

test('renders localized iOS install prompt', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    configurable: true,
  })
  window.matchMedia =
    window.matchMedia ||
    (() =>
      ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as MediaQueryList)

  vi.useFakeTimers()
  render(
    <I18nProvider>
      <PwaInstallPrompt />
    </I18nProvider>
  )
  act(() => {
    vi.advanceTimersByTime(1300)
  })

  expect(screen.getByText('安装 Relite Reader')).toBeInTheDocument()
  expect(
    screen.getByText('在 iOS Safari 中点按分享 → 添加到主屏幕。')
  ).toBeInTheDocument()
  vi.useRealTimers()
})
