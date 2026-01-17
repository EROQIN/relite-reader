import { useMemo, useState } from 'react'
import ReaderShell from '../reader/ReaderShell'
import ReaderControls from '../reader/ReaderControls'
import {
  defaultReaderPrefs,
  loadReaderPrefs,
  ReaderPrefs,
  saveReaderPrefs,
} from '../lib/readerPrefs'

const fontMap: Record<ReaderPrefs['font'], string> = {
  sans: "'IBM Plex Sans', 'Noto Sans SC', 'PingFang SC', sans-serif",
  serif: "'Fraunces', 'Noto Serif SC', 'Source Han Serif SC', serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

export default function ReaderPage() {
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => loadReaderPrefs())
  const [open, setOpen] = useState(true)

  const style = useMemo(
    () => ({
      ['--reader-font' as never]: fontMap[prefs.font],
      ['--reader-size' as never]: `${prefs.fontSize}px`,
      ['--reader-line' as never]: String(prefs.lineHeight),
      ['--reader-width' as never]: `${prefs.pageWidth}px`,
      ['--reader-align' as never]: prefs.textAlign,
    }),
    [prefs]
  )

  const updatePrefs = (next: ReaderPrefs) => {
    setPrefs(next)
    saveReaderPrefs(next)
  }

  return (
    <section className="reader-page" data-theme={prefs.theme} style={style}>
      <header className="reader-toolbar">
        <div>
          <span className="overline">Reader</span>
          <h1>Reading Studio</h1>
        </div>
        <button
          className="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
        >
          Settings
        </button>
      </header>
      <div className="reader-layout">
        <div className="reader-surface">
          <ReaderShell />
        </div>
        <aside className={`reader-settings ${open ? 'open' : ''}`}>
          <ReaderControls
            prefs={prefs}
            onChange={updatePrefs}
            onReset={() => updatePrefs(defaultReaderPrefs)}
          />
        </aside>
      </div>
    </section>
  )
}
