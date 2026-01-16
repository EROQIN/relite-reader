import { LibraryItem } from '../lib/library'
import { loadText } from '../lib/textStore'

export default function TxtReader({ item }: { item: LibraryItem }) {
  const text = loadText(item.id)
  return (
    <div className="panel">
      <h2>{item.title}</h2>
      <pre className="reader-text">{text || 'No text content found.'}</pre>
    </div>
  )
}
