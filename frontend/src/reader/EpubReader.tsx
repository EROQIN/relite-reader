import { LibraryItem } from '../lib/library'

export default function EpubReader({ item }: { item: LibraryItem }) {
  return <div className="panel">EPUB reader for {item.title}</div>
}
