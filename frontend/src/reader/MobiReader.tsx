import { LibraryItem } from '../lib/library'
import { useI18n } from '../components/I18nProvider'

export default function MobiReader({ item }: { item: LibraryItem }) {
  const { t } = useI18n()
  return (
    <div className="panel">
      {t('reader.format.mobi', { title: item.title })}
    </div>
  )
}
