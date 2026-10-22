import { Link, useNavigate } from 'react-router-dom'
import { LogOut, LayoutGrid, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { XpHud } from './XpHud'
import { NotificationBell } from '@/features/notification/NotificationBell'
import { A11yMenu } from '@/features/a11y/A11yMenu'
import { useAuthStore } from '@/features/auth/authStore'
import { logout as authLogout } from '@/features/auth/authService'
import { FEATURES } from '@/shared/config/features'

export function AppTopbar() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/app" className="flex items-center gap-2.5" aria-label="PROTOCOL">
            <span className="flex h-7 w-7 items-center justify-center bg-lime font-display font-bold text-bg clip-btn">P</span>
            <span className="hidden font-display font-semibold tracking-[0.14em] sm:inline">PROTOCOL</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/about"
            className="hidden items-center gap-1.5 border border-line-strong px-2.5 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-aqua/50 hover:text-aqua md:flex clip-btn"
            title={t('nav.landing')}
          >
            <Home size={13} /> {t('nav.landing')}
          </Link>
          {FEATURES.portal && (
            <Link
              to="/portal"
              className="flex items-center gap-1.5 border border-line-aqua px-2.5 py-1.5 font-mono text-xs uppercase tracking-widest text-aqua transition-colors hover:bg-aqua/10 clip-btn"
              title={t('nav.portal')}
            >
              <LayoutGrid size={13} /> {t('nav.portal')}
            </Link>
          )}
          <button
            onClick={() => window.dispatchEvent(new Event('protocol:cmdk'))}
            aria-label={t('nav.open_palette')}
            className="hidden items-center gap-2 border border-line-strong px-2.5 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-aqua/50 hover:text-ink sm:flex clip-btn"
          >
            ⌘K
          </button>
          {FEATURES.accessibilityMenu && <A11yMenu />}
          <NotificationBell />
          <LanguageSwitcher />
          <XpHud />
          {user && (
            <button
              onClick={() => {
                authLogout()
                navigate('/login')
              }}
              aria-label={t('nav.logout')}
              className="text-ink-muted transition-colors hover:text-danger"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
