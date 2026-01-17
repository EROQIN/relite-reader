import { useEffect, useMemo, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'relite.pwa.dismissed'

const isStandalone = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  return Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

const isSafari = () =>
  /safari/i.test(navigator.userAgent) && !/chrome|crios|android/i.test(navigator.userAgent)

export default function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(() =>
    Boolean(localStorage.getItem(DISMISS_KEY))
  )

  const showIos = useMemo(() => isIos() && isSafari(), [])

  useEffect(() => {
    if (dismissed || isStandalone()) return
    const timer = window.setTimeout(() => setReady(true), 1200)
    return () => window.clearTimeout(timer)
  }, [dismissed])

  useEffect(() => {
    if (dismissed) return
    const handler = (event: Event) => {
      event.preventDefault()
      setDeferred(event as InstallPromptEvent)
    }
    const installed = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', handler as EventListener)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
      window.removeEventListener('appinstalled', installed)
    }
  }, [dismissed])

  if (!ready || dismissed || isStandalone()) return null

  const installSupported = Boolean(deferred)
  const showBanner = installSupported || showIos

  if (!showBanner) return null

  const handleInstall = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <div>
        <strong>Install Relite Reader</strong>
        <p className="muted">
          {installSupported
            ? 'Add this app to your home screen for offline-friendly reading.'
            : 'On iOS Safari, tap Share → Add to Home Screen.'}
        </p>
      </div>
      <div className="pwa-actions">
        {installSupported && (
          <button className="button" onClick={handleInstall}>
            Install
          </button>
        )}
        <button className="button" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
