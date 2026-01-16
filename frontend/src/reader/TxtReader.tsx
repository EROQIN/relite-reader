import { useState } from 'react'
import { LibraryItem } from '../lib/library'
import { calcProgress } from '../lib/progress'
import { loadProgress, saveProgress } from '../lib/progressStore'
import { loadText } from '../lib/textStore'

export default function TxtReader({ item }: { item: LibraryItem }) {
  const text = loadText(item.id)
  const [progress, setProgress] = useState(() => loadProgress(item.id))

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget
    const next = calcProgress(target.scrollTop, target.scrollHeight, target.clientHeight)
    setProgress(next)
    saveProgress(item.id, next)
  }

  return (
    <div className="panel">
      <div className="reader-meta">
        <h2>{item.title}</h2>
        <span className="reader-progress">{Math.round(progress * 100)}%</span>
      </div>
      <div className="reader-scroll" onScroll={onScroll}>
        <pre className="reader-text">{text || 'No text content found.'}</pre>
      </div>
    </div>
  )
}
