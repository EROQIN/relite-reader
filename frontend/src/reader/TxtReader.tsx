import { useEffect, useMemo, useRef, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { calcProgress } from '../lib/progress'
import { loadProgress, saveProgress } from '../lib/progressStore'
import { loadText } from '../lib/textStore'
import { createBookmark, deleteBookmark, fetchBookmarks } from '../lib/bookmarkApi'
import { loadBookmarks, saveBookmarks } from '../lib/bookmarkStore'
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
    if (!token) return
    let active = true
    void fetchProgress(item.id, token).then((remote) => {
      if (!active || !remote) return
      const next = Math.max(progress, remote.location)
      if (next !== progress) {
        setProgress(next)
        saveProgress(item.id, next)
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

  const onScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      <div className="reader-scroll" ref={scrollRef} onScroll={onScroll}>
        <pre className="reader-text">{text || t('reader.text.empty')}</pre>
      </div>
    </div>
  )
}
