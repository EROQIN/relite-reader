import { beforeEach, describe, expect, it, vi } from 'vitest'
import { detectLocale, getStoredLocale, normalizeLocale } from './i18n'

describe('i18n locale helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('normalizes supported locales', () => {
    expect(normalizeLocale('en')).toBe('en')
    expect(normalizeLocale('zh')).toBe('zh-CN')
    expect(normalizeLocale('zh-CN')).toBe('zh-CN')
    expect(normalizeLocale('fr')).toBe('en')
  })

  it('detects browser locale with fallback', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-CN')
    expect(detectLocale()).toBe('zh-CN')
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-FR')
    expect(detectLocale()).toBe('en')
  })

  it('reads stored locale if available', () => {
    localStorage.setItem('relite.locale', 'zh-CN')
    expect(getStoredLocale()).toBe('zh-CN')
  })
})
