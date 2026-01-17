import { LibraryItem } from '../lib/library'
import { useI18n } from '../components/I18nProvider'

export default function EpubReader({ item }: { item: LibraryItem }) {
  const { t } = useI18n()
  return <div className="panel">{t('reader.format.epub', { title: item.title })}</div>
}
