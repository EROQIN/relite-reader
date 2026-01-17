const shortcuts = [
  { label: 'Cycle theme', keys: 'Alt + T' },
  { label: 'Toggle layout', keys: 'Alt + L' },
  { label: 'Focus mode', keys: 'Alt + F' },
  { label: 'Settings panel', keys: 'Alt + S' },
  { label: 'Increase font', keys: 'Ctrl/Cmd + +' },
  { label: 'Decrease font', keys: 'Ctrl/Cmd + -' },
  { label: 'Show shortcuts', keys: '?' },
]

export default function ReaderShortcuts({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
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
        aria-label="Reader shortcuts"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="reader-shortcuts-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="button" onClick={onClose}>
            Close
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
        <p className="muted reader-shortcuts-hint">Press Escape to close.</p>
      </div>
    </div>
  )
}
