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
    'auth.overline': 'Account',
    'auth.title.login': 'Sign in',
    'auth.title.register': 'Create account',
    'auth.helper.login': 'Use your Relite account to sync preferences across devices.',
    'auth.helper.register': 'Create a Relite account to save preferences and progress.',
    'auth.toggle.register': 'Need an account?',
    'auth.toggle.login': 'Have an account?',
    'auth.label.email': 'Email',
    'auth.label.password': 'Password',
    'auth.placeholder.email': 'you@example.com',
    'auth.submit.loading': 'Working...',
    'auth.submit.login': 'Sign in',
    'auth.submit.register': 'Create account',
    'auth.message.missing': 'Please enter both email and password.',
    'auth.message.success': 'Signed in successfully. You can return to your library.',
    'auth.message.error': 'Unable to sign in. Check your credentials or try again.',
    'auth.footnote': 'Local-only reading is available without login.',
  },
  'zh-CN': {
    'nav.library': '书库',
    'nav.webdav': 'WebDAV',
    'nav.login': '登录',
    'nav.logout': '退出',
    'nav.brand': 'Relite Reader',
    'auth.overline': '账号',
    'auth.title.login': '登录',
    'auth.title.register': '创建账号',
    'auth.helper.login': '使用 Relite 账号同步偏好设置。',
    'auth.helper.register': '创建 Relite 账号以保存偏好与进度。',
    'auth.toggle.register': '需要账号？',
    'auth.toggle.login': '已有账号？',
    'auth.label.email': '邮箱',
    'auth.label.password': '密码',
    'auth.placeholder.email': 'you@example.com',
    'auth.submit.loading': '处理中…',
    'auth.submit.login': '登录',
    'auth.submit.register': '创建账号',
    'auth.message.missing': '请输入邮箱和密码。',
    'auth.message.success': '登录成功，可返回书库。',
    'auth.message.error': '登录失败，请检查凭据或稍后再试。',
    'auth.footnote': '无需登录也可本地阅读。',
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
