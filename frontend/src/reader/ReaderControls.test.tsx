import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../components/I18nProvider'
import { defaultReaderPrefs } from '../lib/readerPrefs'
import ReaderControls from './ReaderControls'

test('renders localized reader controls', () => {
  localStorage.setItem('relite.locale', 'zh-CN')
  render(
    <I18nProvider>
      <ReaderControls
        prefs={defaultReaderPrefs}
        presets={[]}
        activePreset="custom"
        bookScoped={false}
        customPresets={[]}
        onScopeChange={() => {}}
        onApplyPreset={() => {}}
        onSavePreset={() => {}}
        onRenamePreset={() => {}}
        onDeletePreset={() => {}}
        onChange={() => {}}
        onReset={() => {}}
      />
    </I18nProvider>
  )
  expect(screen.getByRole('heading', { name: '自定义' })).toBeInTheDocument()
})
