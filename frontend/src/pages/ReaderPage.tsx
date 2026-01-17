import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReaderShell from '../reader/ReaderShell'
import ReaderControls from '../reader/ReaderControls'
import {
  defaultReaderPrefs,
  loadReaderPrefs,
  loadReaderPrefsForBook,
  ReaderPrefs,
  readerPresets,
  saveReaderPrefs,
  saveReaderPrefsForBook,
  clearReaderPrefsForBook,
} from '../lib/readerPrefs'

const fontMap: Record<ReaderPrefs['font'], string> = {
  sans: "'IBM Plex Sans', 'Noto Sans SC', 'PingFang SC', sans-serif",
  serif: "'Fraunces', 'Noto Serif SC', 'Source Han Serif SC', serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

const matchPreset = (prefs: ReaderPrefs) => {
  const found = readerPresets.find(
    (preset) => JSON.stringify(preset.prefs) === JSON.stringify(prefs)
  )
  return found?.id ?? 'custom'
}

export default function ReaderPage() {
  const { bookId } = useParams()
  const initialBookPrefs = bookId ? loadReaderPrefsForBook(bookId) : null
  const [bookScoped, setBookScoped] = useState(Boolean(initialBookPrefs))
  const [prefs, setPrefs] = useState<ReaderPrefs>(
    () => initialBookPrefs ?? loadReaderPrefs()
  )
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
    if (bookScoped && bookId) {
      saveReaderPrefsForBook(bookId, next)
      return
    }
    saveReaderPrefs(next)
  }

  const toggleScope = (next: boolean) => {
    setBookScoped(next)
    if (next && bookId) {
      saveReaderPrefsForBook(bookId, prefs)
      return
    }
    if (!next && bookId) {
      clearReaderPrefsForBook(bookId)
      saveReaderPrefs(prefs)
    }
  }

  const applyPreset = (presetId: string) => {
    const preset = readerPresets.find((item) => item.id === presetId)
    if (preset) {
      updatePrefs(preset.prefs)
    }
  }

  return (
    <section
      className={`reader-page ${
        prefs.focusMode ? 'focus' : ''
      } ${prefs.layoutMode === 'columns' ? 'columns' : ''}`}
      data-theme={prefs.theme}
      style={style}
    >
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
            presets={readerPresets}
            activePreset={matchPreset(prefs)}
            bookScoped={bookScoped}
            onScopeChange={toggleScope}
            onApplyPreset={applyPreset}
            onChange={updatePrefs}
            onReset={() => updatePrefs(defaultReaderPrefs)}
          />
        </aside>
      </div>
      {prefs.focusMode && (
        <button
          className="button reader-focus-exit"
          onClick={() => updatePrefs({ ...prefs, focusMode: false })}
        >
          Exit focus
        </button>
      )}
    </section>
  )
}
