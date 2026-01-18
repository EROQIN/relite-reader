import { useEffect, useMemo, useRef, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { calcProgress } from '../lib/progress'
import { loadProgress, saveProgress } from '../lib/progressStore'
import { loadText } from '../lib/textStore'
import { createBookmark, deleteBookmark, fetchBookmarks } from '../lib/bookmarkApi'
import { loadBookmarks, saveBookmarks } from '../lib/bookmarkStore'
import {
  createAnnotation,
  deleteAnnotation,
  fetchAnnotations,
} from '../lib/annotationApi'
import {
  loadAnnotations,
  saveAnnotations,
  Annotation,
} from '../lib/annotationStore'
import { fetchProgress, saveProgressRemote } from '../lib/progressApi'
import { getToken } from '../lib/authApi'
import { useI18n } from '../components/I18nProvider'

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export default function TxtReader({
  item,
  readingSpeed = 240,
}: {
  item: LibraryItem
  readingSpeed?: number
}) {
  const text = loadText(item.id)
  const [progress, setProgress] = useState(() => loadProgress(item.id))
  const scrollRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState(() => getToken())
  const [bookmarkLabel, setBookmarkLabel] = useState('')
  const [bookmarks, setBookmarks] = useState(() => loadBookmarks(item.id))
  const [annotationQuote, setAnnotationQuote] = useState('')
  const [annotationNote, setAnnotationNote] = useState('')
  const [annotationColor, setAnnotationColor] = useState('#f5c26b')
  const [annotations, setAnnotations] = useState<Annotation[]>(() =>
    loadAnnotations(item.id)
  )
  const pendingScrollRef = useRef<number | null>(null)
  const hasUserScrolledRef = useRef(false)
  const { t } = useI18n()

  const wordCount = useMemo(() => {
    if (!text) return 0
    return text.trim().split(/\s+/).filter(Boolean).length
  }, [text])

  const totalMinutes = useMemo(() => {
    if (!wordCount || readingSpeed <= 0) return null
    return Math.max(1, Math.ceil(wordCount / readingSpeed))
  }, [wordCount, readingSpeed])

  const minutesLeft = useMemo(() => {
    if (!wordCount || readingSpeed <= 0) return null
    return Math.max(1, Math.ceil(((1 - progress) * wordCount) / readingSpeed))
  }, [progress, wordCount, readingSpeed])

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    hasUserScrolledRef.current = true
    pendingScrollRef.current = null
    const next = calcProgress(target.scrollTop, target.scrollHeight, target.clientHeight)
    setProgress(next)
    saveProgress(item.id, next)
  }

  useEffect(() => {
    const handler = () => setToken(getToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    hasUserScrolledRef.current = false
    pendingScrollRef.current = progress
  }, [item.id])

  const applyScroll = (location: number) => {
    const target = scrollRef.current
    if (!target) {
      pendingScrollRef.current = location
      return
    }
    const maxScroll = target.scrollHeight - target.clientHeight
    target.scrollTop = maxScroll * location
  }

  useEffect(() => {
    if (!text) return
    if (pendingScrollRef.current !== null) {
      applyScroll(pendingScrollRef.current)
      pendingScrollRef.current = null
    }
  }, [text])

  useEffect(() => {
    if (!token) return
    let active = true
    void fetchProgress(item.id, token).then((remote) => {
      if (!active || !remote) return
      const next = Math.max(progress, remote.location)
      if (next !== progress) {
        setProgress(next)
        saveProgress(item.id, next)
        if (!hasUserScrolledRef.current) {
          applyScroll(next)
        }
      }
    })
    return () => {
      active = false
    }
  }, [token, item.id])

  useEffect(() => {
    if (!token) return
    const handle = window.setTimeout(() => {
      void saveProgressRemote(item.id, progress, token)
    }, 600)
    return () => window.clearTimeout(handle)
  }, [token, item.id, progress])

  useEffect(() => {
    if (!token) return
    let active = true
    void fetchBookmarks(item.id, token).then((remote) => {
      if (!active || !remote) return
      const mapped = remote.map((entry) => ({
        id: entry.id,
        label: entry.label,
        location: entry.location,
        createdAt: entry.created_at,
      }))
      setBookmarks(mapped)
      saveBookmarks(item.id, mapped)
    })
    return () => {
      active = false
    }
  }, [token, item.id])

  useEffect(() => {
    if (!token) return
    let active = true
    void fetchAnnotations(item.id, token).then((remote) => {
      if (!active || !remote) return
      const mapped = remote.map((entry) => ({
        id: entry.id,
        location: entry.location,
        quote: entry.quote,
        note: entry.note,
        color: entry.color,
        createdAt: entry.created_at,
      }))
      setAnnotations(mapped)
      saveAnnotations(item.id, mapped)
    })
    return () => {
      active = false
    }
  }, [token, item.id])

  const onScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    hasUserScrolledRef.current = true
    pendingScrollRef.current = null
    const next = clamp(Number(event.target.value) / 100, 0, 1)
    const target = scrollRef.current
    if (target) {
      const maxScroll = target.scrollHeight - target.clientHeight
      target.scrollTop = maxScroll * next
    }
    setProgress(next)
    saveProgress(item.id, next)
  }

  const jumpTo = (location: number) => {
    hasUserScrolledRef.current = true
    pendingScrollRef.current = null
    const target = scrollRef.current
    if (target) {
      const maxScroll = target.scrollHeight - target.clientHeight
      target.scrollTop = maxScroll * location
    }
    setProgress(location)
    saveProgress(item.id, location)
  }

  const handleAddBookmark = async () => {
    const fallbackLabel = t('reader.bookmarks.defaultLabel', {
      percent: Math.round(progress * 100),
    })
    const label = bookmarkLabel.trim() || fallbackLabel
    const createdAt = new Date().toISOString()
    let newBookmark = {
      id: `local-${createdAt}`,
      label,
      location: progress,
      createdAt,
    }
    if (token) {
      const remote = await createBookmark(item.id, label, progress, token)
      if (remote) {
        newBookmark = {
          id: remote.id,
          label: remote.label,
          location: remote.location,
          createdAt: remote.created_at,
        }
      }
    }
    const next = [newBookmark, ...bookmarks]
    setBookmarks(next)
    saveBookmarks(item.id, next)
    setBookmarkLabel('')
  }

  const handleDeleteBookmark = async (id: string) => {
    if (token) {
      await deleteBookmark(item.id, id, token)
    }
    const next = bookmarks.filter((bookmark) => bookmark.id !== id)
    setBookmarks(next)
    saveBookmarks(item.id, next)
  }

  const handleCaptureSelection = () => {
    const selection = window.getSelection()?.toString().trim() ?? ''
    if (selection) {
      setAnnotationQuote(selection)
    }
  }

  const handleAddAnnotation = async () => {
    const quote = annotationQuote.trim()
    const note = annotationNote.trim()
    if (!quote && !note) return
    const createdAt = new Date().toISOString()
    let newAnnotation: Annotation = {
      id: `local-${createdAt}`,
      location: progress,
      quote,
      note,
      color: annotationColor,
      createdAt,
    }
    if (token) {
      const remote = await createAnnotation(
        item.id,
        progress,
        quote,
        note,
        annotationColor,
        token
      )
      if (remote) {
        newAnnotation = {
          id: remote.id,
          location: remote.location,
          quote: remote.quote,
          note: remote.note,
          color: remote.color,
          createdAt: remote.created_at,
        }
      }
    }
    const next = [newAnnotation, ...annotations]
    setAnnotations(next)
    saveAnnotations(item.id, next)
    setAnnotationQuote('')
    setAnnotationNote('')
  }

  const handleDeleteAnnotation = async (id: string) => {
    if (token) {
      await deleteAnnotation(item.id, id, token)
    }
    const next = annotations.filter((annotation) => annotation.id !== id)
    setAnnotations(next)
    saveAnnotations(item.id, next)
  }

  const handleExportAnnotations = () => {
    const payload = {
      bookId: item.id,
      title: item.title,
      exportedAt: new Date().toISOString(),
      annotations,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${item.title}-annotations.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="reader-frame">
      <div className="reader-meta">
        <div>
          <h2>{item.title}</h2>
          {minutesLeft !== null && totalMinutes !== null && (
            <span className="reader-time">
              {t('reader.meta.time', { left: minutesLeft, total: totalMinutes })}
            </span>
          )}
        </div>
        <span className="reader-progress">{Math.round(progress * 100)}%</span>
      </div>
      <div className="reader-progress-controls">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(progress * 100)}
          onChange={onScrub}
          aria-label={t('reader.progress.label')}
        />
        <div className="reader-progress-meta">
          <span>0%</span>
          <span>{Math.round(progress * 100)}%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="reader-bookmarks">
        <div className="reader-bookmarks-header">
          <strong>{t('reader.bookmarks.title')}</strong>
          <span className="muted">{t('reader.bookmarks.subtitle')}</span>
        </div>
        <div className="reader-bookmarks-create">
          <input
            type="text"
            placeholder={t('reader.bookmarks.placeholder')}
            value={bookmarkLabel}
            onChange={(event) => setBookmarkLabel(event.target.value)}
            aria-label={t('reader.bookmarks.label')}
          />
          <button className="button" onClick={handleAddBookmark}>
            {t('reader.bookmarks.add')}
          </button>
        </div>
        {bookmarks.length === 0 ? (
          <p className="muted">{t('reader.bookmarks.empty')}</p>
        ) : (
          <div className="reader-bookmarks-list">
            {bookmarks.map((bookmark) => (
              <div className="reader-bookmark-row" key={bookmark.id}>
                <button
                  className="button"
                  onClick={() => jumpTo(bookmark.location)}
                >
                  {bookmark.label}
                </button>
                <span className="muted">
                  {Math.round(bookmark.location * 100)}%
                </span>
                <button
                  className="button"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                >
                  {t('reader.bookmarks.remove')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="reader-annotations">
        <div className="reader-annotations-header">
          <strong>{t('reader.annotations.title')}</strong>
          <div className="reader-annotations-actions">
            <button className="button" onClick={handleCaptureSelection}>
              {t('reader.annotations.capture')}
            </button>
            <button className="button" onClick={handleExportAnnotations}>
              {t('reader.annotations.export')}
            </button>
          </div>
        </div>
        <p className="muted">{t('reader.annotations.subtitle')}</p>
        <div className="reader-annotations-create">
          <input
            type="text"
            placeholder={t('reader.annotations.quote.placeholder')}
            value={annotationQuote}
            onChange={(event) => setAnnotationQuote(event.target.value)}
            aria-label={t('reader.annotations.quote.label')}
          />
          <textarea
            placeholder={t('reader.annotations.note.placeholder')}
            value={annotationNote}
            onChange={(event) => setAnnotationNote(event.target.value)}
            aria-label={t('reader.annotations.note.label')}
          />
          <div className="reader-annotations-controls">
            <label className="muted">
              {t('reader.annotations.color')}
              <input
                type="color"
                value={annotationColor}
                onChange={(event) => setAnnotationColor(event.target.value)}
              />
            </label>
            <button
              className="button"
              onClick={handleAddAnnotation}
              disabled={!annotationQuote.trim() && !annotationNote.trim()}
            >
              {t('reader.annotations.add')}
            </button>
          </div>
        </div>
        {annotations.length === 0 ? (
          <p className="muted">{t('reader.annotations.empty')}</p>
        ) : (
          <div className="reader-annotations-list">
            {annotations.map((annotation) => (
              <div className="reader-annotation-row" key={annotation.id}>
                <div>
                  {annotation.quote ? (
                    <p className="reader-annotation-quote">“{annotation.quote}”</p>
                  ) : null}
                  {annotation.note ? (
                    <p className="muted">{annotation.note}</p>
                  ) : null}
                  <span className="muted">
                    {Math.round(annotation.location * 100)}%
                  </span>
                </div>
                <div className="reader-annotation-actions">
                  <span
                    className="annotation-color"
                    style={{ background: annotation.color || '#f5c26b' }}
                    aria-hidden
                  />
                  <button
                    className="button"
                    onClick={() => jumpTo(annotation.location)}
                  >
                    {t('reader.annotations.jump')}
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDeleteAnnotation(annotation.id)}
                  >
                    {t('reader.annotations.remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="reader-scroll" ref={scrollRef} onScroll={onScroll}>
        <pre className="reader-text">{text || t('reader.text.empty')}</pre>
      </div>
    </div>
  )
}
