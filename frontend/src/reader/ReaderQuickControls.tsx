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
  return (
    <div className="reader-quick">
      <button className="button" onClick={onTheme}>
        Theme
      </button>
      <button className="button" onClick={onDecrease}>
        A-
      </button>
      <button className="button" onClick={onIncrease}>
        A+
      </button>
      <button className="button" onClick={onLayout}>
        Layout
      </button>
      <button className="button" onClick={onFocus}>
        Focus
      </button>
      <button className="button" onClick={onSettings}>
        Settings
      </button>
    </div>
  )
}
