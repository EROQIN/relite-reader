import { LibraryItem } from '../lib/library'

const descriptions: Record<string, string> = {
  cbz: 'Comic archive detected. Rendering support is queued.',
  cbr: 'Comic archive detected. Rendering support is queued.',
  cb7: 'Comic archive detected. Rendering support is queued.',
  azw: 'Kindle format detected. Conversion support is queued.',
  azw3: 'Kindle format detected. Conversion support is queued.',
  fb2: 'FictionBook format detected. Parsing support is queued.',
  rtf: 'Rich Text format detected. Parsing support is queued.',
  docx: 'Word document detected. Parsing support is queued.',
}

export default function PlaceholderReader({ item }: { item: LibraryItem }) {
  const detail = descriptions[item.format] ?? 'This format is not yet supported.'
  return (
    <div className="panel">
      <h2>{item.title}</h2>
      <p className="muted">Format: {item.format.toUpperCase()}</p>
      <p>{detail}</p>
      <p className="muted">
        Your file is indexed and safe. We will notify you once rendering is ready.
      </p>
    </div>
  )
}
