import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { A11yMenu } from '@/features/a11y/A11yMenu'
import { useAuthStore } from '@/features/auth/authStore'
import { FEATURES } from '@/shared/config/features'
import { useAuthEntry } from '@/features/auth/useAuthEntry'

export function Header() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { to } = useAuthEntry()
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md"
    >
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="PROTOCOL — на главную">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-lime font-display font-bold text-bg">
            P
          </span>
          <span className="font-display font-semibold tracking-[0.14em]">PROTOCOL</span>
        </Link>
        <div className="flex items-center gap-3">
          {FEATURES.portal && (
            <Link
              to="/portal"
              className="hidden font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua sm:block"
            >
              {t('nav.portal')}
            </Link>
          )}
          <Link
            to="/features"
            className="hidden font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua sm:block"
          >
            {t('nav.features')}
          </Link>
          {FEATURES.accessibilityMenu && <A11yMenu />}
          <button
            onClick={() => window.dispatchEvent(new Event('protocol:cmdk'))}
            aria-label={t('nav.open_palette')}
            className="hidden items-center gap-2 rounded-[8px] border border-line-strong px-2.5 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-lime/60 hover:text-ink sm:flex"
          >
            <span>⌘K</span>
          </button>
          <LanguageSwitcher />
          <Link to={to}>
            <Button size="sm" variant="secondary">{user ? t('nav.enter_app') : t('auth.login')}</Button>
          </Link>
        </div>
      </Container>
    </motion.header>
  )
}
