export type Locale = 'en' | 'zh-CN'

const LOCALE_KEY = 'relite.locale'
const SUPPORTED: Record<string, Locale> = {
  en: 'en',
  zh: 'zh-CN',
  'zh-CN': 'zh-CN',
}

export function normalizeLocale(input: string | null | undefined): Locale {
  if (!input) return 'en'
  return SUPPORTED[input] ?? 'en'
}

export function detectLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en'
  if (lang.startsWith('zh')) return 'zh-CN'
  return normalizeLocale(lang)
}

export function getStoredLocale(): Locale | null {
  const stored = localStorage.getItem(LOCALE_KEY)
  return stored ? normalizeLocale(stored) : null
}

export function saveLocale(locale: Locale) {
  localStorage.setItem(LOCALE_KEY, locale)
}
