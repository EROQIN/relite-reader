import { useEffect, useState } from 'react'
import { LibraryItem } from '../lib/library'
import { useI18n } from '../components/I18nProvider'
import { fetchBookBlob } from '../lib/bookContentApi'
import { getToken } from '../lib/authApi'

export default function PdfReader({ item }: { item: LibraryItem }) {
  const { t } = useI18n()
  const [token, setToken] = useState(() => getToken())
  const [src, setSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    const handler = () => setToken(getToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  useEffect(() => {
    if (item.source !== 'webdav') return
    if (!token) return
    let active = true
    setStatus('loading')
    void fetchBookBlob(item.id, token).then((blob) => {
      if (!active) return
      if (!blob) {
        setStatus('error')
        return
      }
      const url = URL.createObjectURL(blob)
      setSrc(url)
      setStatus('idle')
    })
    return () => {
      active = false
    }
  }, [item.id, item.source, token])

  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src)
    }
  }, [src])

  if (item.source !== 'webdav') {
    return <div className="panel">{t('reader.format.pdf', { title: item.title })}</div>
  }

  if (!token) {
    return <div className="panel">{t('reader.format.webdavAuth')}</div>
  }

  if (status === 'loading') {
    return <div className="panel">{t('reader.format.loading')}</div>
  }

  if (status === 'error' || !src) {
    return <div className="panel">{t('reader.format.error')}</div>
  }

  return (
    <div className="panel reader-pdf">
      <iframe title={item.title} src={src} />
    </div>
  )
}
