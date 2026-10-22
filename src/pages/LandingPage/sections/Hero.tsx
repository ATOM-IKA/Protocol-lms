import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'
import { Button } from '@/shared/ui/Button'
import { Label } from '@/shared/ui/Label'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'
import { useAuthEntry } from '@/features/auth/useAuthEntry'

export function Hero() {
  const { t } = useTranslation()
  const { to } = useAuthEntry()
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* HUD-сетка */}
      {/* угловые скобки */}
      <div aria-hidden className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l-2 border-t-2 border-aqua" />
      <div aria-hidden className="pointer-events-none absolute right-4 top-4 h-6 w-6 border-r-2 border-t-2 border-aqua" />

      <Container className="relative">
        <div className="flex items-center justify-between pt-8">
          <Label>{t('landing.kicker')}</Label>
          <Label accent>ID_NET · 0x2F</Label>
        </div>

        <div className="flex gap-6 py-16 sm:py-24">
          {/* катакана-акцент */}
          <div aria-hidden className="jp hidden select-none text-sm text-ink-dim sm:block" style={{ writingMode: 'vertical-rl' }}>
            プロトコル・ネット
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex-1">
            <motion.h1
              variants={fadeInUp}
              className="glitch max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
            >
              {t('landing.hero_line1')}{' '}
              <span className="mark-lime">{t('landing.hero_line2')}</span>
              <span className="text-aqua">.</span>
            </motion.h1>

            <motion.div variants={fadeInUp} className="mt-5 flex items-center gap-3">
              <span className="h-px w-11 bg-aqua" />
              <span className="font-mono text-sm text-aqua">{t('landing.hero_note')}</span>
            </motion.div>

            <motion.p variants={fadeInUp} className="mt-6 max-w-xl text-lg text-ink-soft">
              {t('landing.subtitle')}
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-9 flex items-center gap-3">
              <Link to={to}>
                <Button size="lg">{t('landing.cta')} →</Button>
              </Link>
              <span className="clip-btn border border-line-strong px-4 py-3 font-mono text-sm text-ink-muted">
                [ ⌘K ]
              </span>
            </motion.div>
          </motion.div>

          {/* hex-индексы */}
          <div aria-hidden className="hidden flex-col gap-2 pt-2 text-right font-mono text-xs text-ink-dim md:flex">
            <span className="text-aqua">01 —</span>
            <span>02 —</span>
            <span>03 —</span>
            <span>04 —</span>
          </div>
        </div>
      </Container>
    </section>
  )
}
