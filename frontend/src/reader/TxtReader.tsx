import { useEffect, useMemo, useRef, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { calcProgress } from '../lib/progress'
import { loadProgress, saveProgress } from '../lib/progressStore'
import { loadText } from '../lib/textStore'
import { fetchProgress, saveProgressRemote } from '../lib/progressApi'
import { getToken } from '../lib/authApi'

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

  return (
    <div className="reader-frame">
      <div className="reader-meta">
        <div>
          <h2>{item.title}</h2>
          {minutesLeft !== null && totalMinutes !== null && (
            <span className="reader-time">
              {minutesLeft} min left · {totalMinutes} min total
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
          aria-label="Reading progress"
        />
        <div className="reader-progress-meta">
          <span>0%</span>
          <span>{Math.round(progress * 100)}%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="reader-scroll" ref={scrollRef} onScroll={onScroll}>
        <pre className="reader-text">{text || 'No text content found.'}</pre>
      </div>
    </div>
  )
}
