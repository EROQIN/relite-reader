import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { loadLibrary } from '../lib/library'
import EpubReader from './EpubReader'
import PdfReader from './PdfReader'
import TxtReader from './TxtReader'
import MobiReader from './MobiReader'
import PlaceholderReader from './PlaceholderReader'
import { useI18n } from '../components/I18nProvider'

export default function ReaderShell({ readingSpeed }: { readingSpeed?: number }) {
  const { bookId } = useParams()
  const item = useMemo(() => loadLibrary().find((i) => i.id === bookId), [bookId])
  const { t } = useI18n()

  if (!item) return <p className="muted">{t('reader.shell.notFound')}</p>

  switch (item.format) {
    case 'epub':
      return <EpubReader item={item} />
    case 'pdf':
      return <PdfReader item={item} />
    case 'txt':
      return <TxtReader item={item} readingSpeed={readingSpeed} />
    case 'md':
    case 'markdown':
    case 'html':
    case 'htm':
      return <TxtReader item={item} readingSpeed={readingSpeed} />
    case 'mobi':
      return <MobiReader item={item} />
    case 'cbz':
    case 'cbr':
    case 'cb7':
    case 'azw':
    case 'azw3':
    case 'fb2':
    case 'rtf':
    case 'docx':
      return <PlaceholderReader item={item} />
    default:
      return <PlaceholderReader item={item} />
  }
}
