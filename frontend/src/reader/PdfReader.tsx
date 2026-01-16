import { LibraryItem } from '../lib/library'

export default function PdfReader({ item }: { item: LibraryItem }) {
  return <div className="panel">PDF reader for {item.title}</div>
}
