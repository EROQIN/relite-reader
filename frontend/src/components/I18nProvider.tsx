import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectLocale, getStoredLocale, Locale, saveLocale } from '../lib/i18n'

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'nav.library': 'Library',
    'nav.webdav': 'WebDAV',
    'nav.login': 'Login',
    'nav.logout': 'Log out',
    'nav.brand': 'Relite Reader',
  },
  'zh-CN': {
    'nav.library': '书库',
    'nav.webdav': 'WebDAV',
    'nav.login': '登录',
    'nav.logout': '退出',
    'nav.brand': 'Relite Reader',
  },
}

const interpolate = (template: string, vars?: Record<string, string | number>) => {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key]
    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale() ?? detectLocale())

  useEffect(() => {
    saveLocale(locale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const template = translations[locale]?.[key] ?? translations.en[key] ?? key
      return interpolate(template, vars)
    }
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
      t,
    }),
    [locale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
