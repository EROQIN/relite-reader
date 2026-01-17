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
    'library.overline': 'Relite Reader',
    'library.hero.title': 'Curate your quiet library.',
    'library.hero.subtitle': 'Blend local files and WebDAV shelves into a single reading space.',
    'library.hero.import': 'Import',
    'library.webdav.title': 'WebDAV Library',
    'library.webdav.subtitle': 'Connect to sync your remote shelves.',
    'library.local.title': 'Local Imports',
    'library.local.empty': 'No local books yet.',
    'library.item.lastOpened': 'Last opened {time}',
    'library.item.open': 'Open',
    'library.item.remove': 'Remove',
    'webdav.title': 'WebDAV Library',
    'webdav.signin.helper': 'Sign in to manage your WebDAV connections.',
    'webdav.signin.cta': 'Go to login',
    'webdav.overline': 'Storage',
    'webdav.subtitle': 'Add your WebDAV server to index and stream your library.',
    'webdav.refresh': 'Refresh',
    'webdav.form.add': 'Add connection',
    'webdav.form.edit': 'Edit connection',
    'webdav.form.baseUrl': 'Base URL',
    'webdav.form.baseUrl.placeholder': 'https://dav.example.com/remote.php/dav/files/user',
    'webdav.form.username': 'Username',
    'webdav.form.username.placeholder': 'user',
    'webdav.form.secret': 'Password / app token',
    'webdav.form.secret.placeholder': '••••••••',
    'webdav.form.save': 'Save connection',
    'webdav.form.update': 'Update connection',
    'webdav.form.cancel': 'Cancel edit',
    'webdav.form.tip': 'Tip: Some providers require an app-specific password.',
    'webdav.list.title': 'Connections',
    'webdav.list.loading': 'Loading...',
    'webdav.list.empty': 'No connections yet. Add one to get started.',
    'webdav.action.sync': 'Sync',
    'webdav.action.edit': 'Edit',
    'webdav.action.remove': 'Remove',
    'webdav.status.idle': 'idle',
    'webdav.status.success': 'success',
    'webdav.status.error': 'error',
    'webdav.status.syncing': 'syncing',
    'webdav.message.loadError': 'Unable to load WebDAV connections.',
    'webdav.message.saveError': 'Unable to save connection. Please check the details.',
    'webdav.message.removeError': 'Unable to remove this connection.',
    'webdav.message.syncStart': 'Sync started. Refresh in a moment to see updates.',
    'webdav.message.syncError': 'Unable to start sync.',
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
    'library.overline': 'Relite Reader',
    'library.hero.title': '整理你的安静书库。',
    'library.hero.subtitle': '将本地文件与 WebDAV 书架整合到同一阅读空间。',
    'library.hero.import': '导入',
    'library.webdav.title': 'WebDAV 书库',
    'library.webdav.subtitle': '连接以同步远程书架。',
    'library.local.title': '本地导入',
    'library.local.empty': '暂无本地图书。',
    'library.item.lastOpened': '上次打开 {time}',
    'library.item.open': '打开',
    'library.item.remove': '移除',
    'webdav.title': 'WebDAV 书库',
    'webdav.signin.helper': '请登录以管理 WebDAV 连接。',
    'webdav.signin.cta': '前往登录',
    'webdav.overline': '存储',
    'webdav.subtitle': '添加 WebDAV 服务器以索引并流式读取书库。',
    'webdav.refresh': '刷新',
    'webdav.form.add': '添加连接',
    'webdav.form.edit': '编辑连接',
    'webdav.form.baseUrl': '基础地址',
    'webdav.form.baseUrl.placeholder': 'https://dav.example.com/remote.php/dav/files/user',
    'webdav.form.username': '用户名',
    'webdav.form.username.placeholder': 'user',
    'webdav.form.secret': '密码 / 应用令牌',
    'webdav.form.secret.placeholder': '••••••••',
    'webdav.form.save': '保存连接',
    'webdav.form.update': '更新连接',
    'webdav.form.cancel': '取消编辑',
    'webdav.form.tip': '提示：部分服务需要应用专用密码。',
    'webdav.list.title': '连接',
    'webdav.list.loading': '加载中…',
    'webdav.list.empty': '暂无连接，添加一个开始使用。',
    'webdav.action.sync': '同步',
    'webdav.action.edit': '编辑',
    'webdav.action.remove': '移除',
    'webdav.status.idle': '空闲',
    'webdav.status.success': '成功',
    'webdav.status.error': '错误',
    'webdav.status.syncing': '同步中',
    'webdav.message.loadError': '无法加载 WebDAV 连接。',
    'webdav.message.saveError': '无法保存连接，请检查信息。',
    'webdav.message.removeError': '无法移除此连接。',
    'webdav.message.syncStart': '已开始同步，稍后刷新查看更新。',
    'webdav.message.syncError': '无法开始同步。',
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
