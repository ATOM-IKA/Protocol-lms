import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

const LANGS = ['ru', 'en'] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage ?? 'ru'

  return (
    <div
      className="relative inline-flex items-center rounded-full border border-line-strong p-0.5"
      role="group"
      aria-label="Язык / Language"
    >
      {LANGS.map((lng) => {
        const active = current === lng
        return (
          <button
            key={lng}
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={cn(
              'relative z-10 rounded-full px-2.5 py-1 font-mono text-xs uppercase transition-colors duration-200',
              active ? 'text-bg' : 'text-ink-muted hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 -z-10 rounded-full bg-lime"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
            {lng}
          </button>
        )
      })}
    </div>
  )
}
