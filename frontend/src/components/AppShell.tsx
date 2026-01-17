import { Link, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { clearToken, getToken } from '../lib/authApi'
import PwaInstallPrompt from './PwaInstallPrompt'
import { useI18n } from './I18nProvider'

export default function AppShell() {
  const [token, setToken] = useState(() => getToken())
  const { locale, setLocale, t } = useI18n()

  useEffect(() => {
    const handler = () => setToken(getToken())
    window.addEventListener('relite-auth', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('relite-auth', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          {t('nav.brand')}
        </Link>
        <nav className="app-nav">
          <Link to="/">{t('nav.library')}</Link>
          <Link to="/webdav">{t('nav.webdav')}</Link>
          <button
            className="button app-lang-toggle"
            onClick={() => setLocale(locale === 'en' ? 'zh-CN' : 'en')}
            aria-label={t('nav.localeToggle')}
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          {token ? (
            <button className="button" onClick={() => clearToken()}>
              {t('nav.logout')}
            </button>
          ) : (
            <Link to="/login">{t('nav.login')}</Link>
          )}
        </nav>
      </header>
      <main className="app-main">
        <PwaInstallPrompt />
        <Outlet />
      </main>
    </div>
  )
}
