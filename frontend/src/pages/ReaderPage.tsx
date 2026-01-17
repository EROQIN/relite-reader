import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import ReaderShell from '../reader/ReaderShell'
import ReaderControls from '../reader/ReaderControls'
import ReaderQuickControls from '../reader/ReaderQuickControls'
import ReaderShortcuts from '../reader/ReaderShortcuts'
import {
  defaultReaderPrefs,
  createCustomPreset,
  loadCustomPresets,
  loadReaderPrefs,
  loadReaderPrefsForBook,
  ReaderPrefs,
  ReaderPreset,
  readerPresets,
  saveCustomPresets,
  saveReaderPrefs,
  saveReaderPrefsForBook,
  clearReaderPrefsForBook,
} from '../lib/readerPrefs'
import { fetchPreferences, getAuthToken, savePreferences } from '../lib/preferencesApi'
import { normalizeLocale } from '../lib/i18n'
import { useI18n } from '../components/I18nProvider'

const fontMap: Record<ReaderPrefs['font'], string> = {
  sans: "'IBM Plex Sans', 'Noto Sans SC', 'PingFang SC', sans-serif",
  serif: "'Fraunces', 'Noto Serif SC', 'Source Han Serif SC', serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
}

const themes: ReaderPrefs['theme'][] = ['paper', 'sepia', 'night', 'slate', 'mist']

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const matchPreset = (prefs: ReaderPrefs, presets: ReaderPreset[]) => {
  const found = presets.find(
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
  const [customPresets, setCustomPresets] = useState(() => loadCustomPresets())
  const [open, setOpen] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [token, setToken] = useState(() => getAuthToken())
  const { locale, setLocale, t } = useI18n()

  const allPresets = useMemo(
    () => [...readerPresets, ...customPresets],
    [customPresets]
  )

  const style = useMemo(() => {
    const base: CSSProperties = {
      ['--reader-font']: fontMap[prefs.font],
      ['--reader-size']: `${prefs.fontSize}px`,
      ['--reader-line']: String(prefs.lineHeight),
      ['--reader-width']: `${prefs.pageWidth}px`,
      ['--reader-align']: prefs.textAlign,
      ['--reader-brightness']: String(prefs.brightness),
    }
    if (prefs.background) {
      base['--reader-custom-bg'] = prefs.background
    }
    return base
  }, [prefs])

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
    const preset = allPresets.find((item) => item.id === presetId)
    if (preset) {
      updatePrefs(preset.prefs)
    }
  }

  const savePreset = (label: string) => {
    const trimmed = label.trim()
    if (!trimmed) {
      return
    }
    setCustomPresets((prev) => {
      const existing = prev.find(
        (preset) => preset.label.toLowerCase() === trimmed.toLowerCase()
      )
      const next = existing
        ? prev.map((preset) =>
            preset.id === existing.id ? { ...preset, prefs: { ...prefs } } : preset
          )
        : [...prev, createCustomPreset(trimmed, prefs)]
      saveCustomPresets(next)
      return next
    })
  }

  const renamePreset = (presetId: string, label: string) => {
    const trimmed = label.trim()
    if (!trimmed) {
      return
    }
    setCustomPresets((prev) => {
      const next = prev.map((preset) =>
        preset.id === presetId ? { ...preset, label: trimmed } : preset
      )
      saveCustomPresets(next)
      return next
    })
  }

  const deletePreset = (presetId: string) => {
    setCustomPresets((prev) => {
      const next = prev.filter((preset) => preset.id !== presetId)
      saveCustomPresets(next)
      return next
    })
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
    const handler = () => setToken(getAuthToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    if (!token || bookScoped) {
      return
    }
    let active = true
    void fetchPreferences(token).then((remote) => {
      if (!active || !remote) return
      setPrefs(remote.reader)
      saveReaderPrefs(remote.reader)
      const nextLocale = normalizeLocale(remote.locale)
      if (nextLocale !== locale) {
        setLocale(nextLocale)
      }
    })
    return () => {
      active = false
    }
  }, [token, bookScoped, locale, setLocale])

  useEffect(() => {
    if (!token || bookScoped) return
    const handle = window.setTimeout(() => {
      void savePreferences(token, { locale, reader: prefs })
    }, 400)
    return () => window.clearTimeout(handle)
  }, [token, prefs, bookScoped, locale])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showShortcuts) {
        event.preventDefault()
        setShowShortcuts(false)
        return
      }
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return
      }
      if (event.key === '?') {
        event.preventDefault()
        setShowShortcuts((prev) => !prev)
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
          <span className="overline">{t('reader.page.overline')}</span>
          <h1>{t('reader.page.title')}</h1>
        </div>
        <div className="reader-actions">
          <button className="button" onClick={() => setShowShortcuts(true)}>
            {t('reader.page.shortcuts')}
          </button>
          <button
            className="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            {t('reader.page.settings')}
          </button>
        </div>
      </header>
      <div className="reader-layout">
        <div className="reader-surface">
          <ReaderShell readingSpeed={prefs.readingSpeed} />
        </div>
        <aside className={`reader-settings ${open ? 'open' : ''}`}>
          <ReaderControls
            prefs={prefs}
            presets={allPresets}
            activePreset={matchPreset(prefs, allPresets)}
            bookScoped={bookScoped}
            customPresets={customPresets}
            onScopeChange={toggleScope}
            onApplyPreset={applyPreset}
            onSavePreset={savePreset}
            onRenamePreset={renamePreset}
            onDeletePreset={deletePreset}
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
          {t('reader.page.exitFocus')}
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
      <ReaderShortcuts
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </section>
  )
}
