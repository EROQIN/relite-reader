import { useI18n } from '../components/I18nProvider'

export default function ReaderShortcuts({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const shortcuts = [
    { label: t('reader.shortcuts.cycleTheme'), keys: 'Alt + T' },
    { label: t('reader.shortcuts.toggleLayout'), keys: 'Alt + L' },
    { label: t('reader.shortcuts.focusMode'), keys: 'Alt + F' },
    { label: t('reader.shortcuts.settings'), keys: 'Alt + S' },
    { label: t('reader.shortcuts.increaseFont'), keys: 'Ctrl/Cmd + +' },
    { label: t('reader.shortcuts.decreaseFont'), keys: 'Ctrl/Cmd + -' },
    { label: t('reader.shortcuts.show'), keys: '?' },
  ]
  if (!open) return null

  return (
    <div
      className="reader-shortcuts-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="reader-shortcuts-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t('reader.shortcuts.aria')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="reader-shortcuts-header">
          <h2>{t('reader.shortcuts.title')}</h2>
          <button className="button" onClick={onClose}>
            {t('reader.shortcuts.close')}
          </button>
        </div>
        <div className="reader-shortcuts-grid">
          {shortcuts.map((shortcut) => (
            <div className="reader-shortcuts-row" key={shortcut.label}>
              <span>{shortcut.label}</span>
              <span className="reader-shortcuts-key">{shortcut.keys}</span>
            </div>
          ))}
        </div>
        <p className="muted reader-shortcuts-hint">{t('reader.shortcuts.hint')}</p>
      </div>
    </div>
  )
}
