import { LibraryItem } from '../lib/library'

export default function TxtReader({ item }: { item: LibraryItem }) {
  return <div className="panel">TXT reader for {item.title}</div>
}
