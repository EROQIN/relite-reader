import { LibraryItem } from '../lib/library'

export default function MobiReader({ item }: { item: LibraryItem }) {
  return (
    <div className="panel">
      MOBI reader for {item.title}. If parsing fails, use server conversion.
    </div>
  )
}
