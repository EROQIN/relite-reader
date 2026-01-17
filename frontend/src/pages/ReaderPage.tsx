import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReaderShell from '../reader/ReaderShell'
import ReaderControls from '../reader/ReaderControls'
import ReaderQuickControls from '../reader/ReaderQuickControls'
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

const themes: ReaderPrefs['theme'][] = ['paper', 'sepia', 'night']

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

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

  const cycleTheme = () => {
    const index = themes.indexOf(prefs.theme)
    const nextTheme = themes[(index + 1) % themes.length]
    updatePrefs({ ...prefs, theme: nextTheme })
  }

  const toggleLayout = () => {
    updatePrefs({
      ...prefs,
      layoutMode: prefs.layoutMode === 'single' ? 'columns' : 'single',
    })
  }

  const toggleFocus = () => {
    updatePrefs({ ...prefs, focusMode: !prefs.focusMode })
  }

  const adjustFont = (delta: number) => {
    updatePrefs({
      ...prefs,
      fontSize: clamp(prefs.fontSize + delta, 14, 22),
    })
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }
      if (event.altKey && event.key.toLowerCase() === 't') {
        event.preventDefault()
        cycleTheme()
      }
      if (event.altKey && event.key.toLowerCase() === 'l') {
        event.preventDefault()
        toggleLayout()
      }
      if (event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFocus()
      }
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '+') {
        event.preventDefault()
        adjustFont(1)
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault()
        adjustFont(-1)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

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
      <ReaderQuickControls
        onTheme={cycleTheme}
        onIncrease={() => adjustFont(1)}
        onDecrease={() => adjustFont(-1)}
        onLayout={toggleLayout}
        onFocus={toggleFocus}
        onSettings={() => setOpen((prev) => !prev)}
      />
    </section>
  )
}
