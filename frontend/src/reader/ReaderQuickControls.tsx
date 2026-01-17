import { useI18n } from '../components/I18nProvider'

export default function ReaderQuickControls({
  onTheme,
  onIncrease,
  onDecrease,
  onLayout,
  onFocus,
  onSettings,
}: {
  onTheme: () => void
  onIncrease: () => void
  onDecrease: () => void
  onLayout: () => void
  onFocus: () => void
  onSettings: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="reader-quick">
      <button className="button" onClick={onTheme}>
        {t('reader.quick.theme')}
      </button>
      <button className="button" onClick={onDecrease}>
        A-
      </button>
      <button className="button" onClick={onIncrease}>
        A+
      </button>
      <button className="button" onClick={onLayout}>
        {t('reader.quick.layout')}
      </button>
      <button className="button" onClick={onFocus}>
        {t('reader.quick.focus')}
      </button>
      <button className="button" onClick={onSettings}>
        {t('reader.quick.settings')}
      </button>
    </div>
  )
}
