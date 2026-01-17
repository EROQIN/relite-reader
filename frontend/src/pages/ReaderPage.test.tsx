import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import { savePreferences } from '../lib/preferencesApi'
import ReaderPage from './ReaderPage'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ bookId: 'book-1' }),
}))

vi.mock('../reader/ReaderShell', () => ({
  default: () => <div>Shell</div>,
}))

vi.mock('../lib/readerPrefs', () => ({
  defaultReaderPrefs: {
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
    readingSpeed: 240,
    background: '',
    brightness: 1,
  },
  loadReaderPrefs: () => ({
    theme: 'paper',
    font: 'serif',
    fontSize: 18,
    lineHeight: 1.7,
    pageWidth: 720,
    textAlign: 'left',
    layoutMode: 'single',
    focusMode: false,
    readingSpeed: 240,
    background: '',
    brightness: 1,
  }),
  loadReaderPrefsForBook: () => null,
  loadCustomPresets: () => [],
  saveReaderPrefs: vi.fn(),
  saveCustomPresets: vi.fn(),
  saveReaderPrefsForBook: vi.fn(),
  clearReaderPrefsForBook: vi.fn(),
  createCustomPreset: (label: string, prefs: unknown) => ({
    id: `custom-${label}`,
    label,
    prefs,
  }),
  readerPresets: [
    {
      id: 'paper',
      label: 'Paper Focus',
      prefs: {
        theme: 'paper',
        font: 'serif',
        fontSize: 18,
        lineHeight: 1.7,
        pageWidth: 720,
        textAlign: 'left',
        layoutMode: 'single',
        focusMode: false,
        readingSpeed: 240,
        background: '',
        brightness: 1,
      },
    },
  ],
}))

vi.mock('../reader/ReaderQuickControls', () => ({
  default: () => <div>Quick</div>,
}))

vi.mock('../lib/preferencesApi', () => ({
  getAuthToken: () => 'token',
  fetchPreferences: vi.fn().mockResolvedValue(null),
  savePreferences: vi.fn(),
}))

test('renders quick controls and syncs locale preferences', () => {
  vi.useFakeTimers()
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <ReaderPage />
    </I18nProvider>
  )
  expect(screen.getByText('Quick')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: '阅读空间' })).toBeInTheDocument()
  vi.runAllTimers()
  expect(savePreferences).toHaveBeenCalledWith(
    'token',
    expect.objectContaining({
      locale: 'zh-CN',
      reader: expect.any(Object),
    })
  )
  vi.useRealTimers()
})
