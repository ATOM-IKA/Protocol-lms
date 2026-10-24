import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { LanguageSwitcher } from '@/features/i18n/LanguageSwitcher'
import { useAuthStore } from '@/features/auth/authStore'
import { useAuthEntry } from '@/features/auth/useAuthEntry'
import { FEATURES } from '@/shared/config/features'
import { goTo } from './parts'

const NAV = [
  { id: 'pl-stage', label: 'features' },
  { id: 'pl-about', label: 'about' },
  { id: 'pl-vision', label: 'vision' },
  { id: 'pl-workflow', label: 'workflow' },
]

/**
 * Прозрачная шапка лендинга. Логотип и меню — отдельный fixed-слой с mix-blend-difference
 * (читаются и на тёмных, и на светлых сценах); кнопки справа — обычные, без инверсии.
 */
export function LandingHeader() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { to } = useAuthEntry()
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="fixed inset-x-0 top-0 z-50 flex h-16 items-center px-4 text-white mix-blend-difference sm:px-8"
      >
        <button
          type="button"
          onClick={() => goTo('pl-stage')}
          className="flex items-center gap-2.5"
          aria-label="PROTOCOL — наверх"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-current font-display font-bold">
            P
          </span>
          <span className="font-display font-semibold tracking-[0.14em]">PROTOCOL</span>
        </button>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 gap-8 font-mono text-[11px] uppercase tracking-widest md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => goTo(n.id)}
              className="opacity-70 transition-opacity hover:opacity-100"
            >
              {n.label}
            </button>
          ))}
        </nav>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="fixed right-4 top-0 z-50 flex h-16 items-center gap-3 sm:right-8"
      >
        {FEATURES.portal && (
          <Link
            to="/portal"
            className="hidden font-mono text-[11px] uppercase tracking-widest text-ink-soft transition-colors hover:text-aqua sm:block"
          >
            {t('nav.portal')}
          </Link>
        )}
        <LanguageSwitcher />
        <Link to={to}>
          <Button size="sm" variant="secondary">
            {user ? t('nav.enter_app') : t('auth.login')}
          </Button>
        </Link>
      </motion.div>
    </>
  )
}
