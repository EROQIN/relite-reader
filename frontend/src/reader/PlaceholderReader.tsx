import { LibraryItem } from '../lib/library'
import { useI18n } from '../components/I18nProvider'

const descriptionKeys: Record<string, string> = {
  cbz: 'placeholder.comic',
  cbr: 'placeholder.comic',
  cb7: 'placeholder.comic',
  cbt: 'placeholder.comic',
  cba: 'placeholder.comic',
  azw: 'placeholder.kindle',
  azw3: 'placeholder.kindle',
  azw4: 'placeholder.kindle',
  kfx: 'placeholder.kindle',
  fb2: 'placeholder.fb2',
  rtf: 'placeholder.rtf',
  docx: 'placeholder.docx',
  md: 'placeholder.markdown',
  markdown: 'placeholder.markdown',
  html: 'placeholder.html',
  htm: 'placeholder.html',
  odt: 'placeholder.odt',
  djvu: 'placeholder.djvu',
  xps: 'placeholder.xps',
  lit: 'placeholder.lit',
  pdb: 'placeholder.pdb',
}

export default function PlaceholderReader({ item }: { item: LibraryItem }) {
  const { t } = useI18n()
  const detailKey = descriptionKeys[item.format] ?? 'placeholder.unsupported'
  const detail = t(detailKey)
  return (
    <div className="panel">
      <h2>{item.title}</h2>
      <p className="muted">
        {t('placeholder.format', { format: item.format.toUpperCase() })}
      </p>
      <p>{detail}</p>
      <p className="muted">{t('placeholder.note')}</p>
    </div>
  )
}
