import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'
import { Button } from '@/shared/ui/Button'
import { Label } from '@/shared/ui/Label'
import { useAuthEntry } from '@/features/auth/useAuthEntry'

export function Cta() {
  const { t } = useTranslation()
  const { to } = useAuthEntry()
  return (
    <section
      className="relative overflow-hidden pb-28"
      style={{
        backgroundImage:
          'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[20px] border border-line-lime bg-surface px-8 py-16 text-center shadow-[0_0_40px_rgba(205,245,68,0.08)]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                'linear-gradient(#181b16 1px, transparent 1px), linear-gradient(90deg, #181b16 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          <div className="relative flex flex-col items-center">
            <Label accent>// ready</Label>
            <h2 className="mt-4 max-w-2xl text-4xl">
              {t('landing.cta_title')}
            </h2>
            <p className="mt-4 max-w-lg text-ink-soft">{t('landing.cta_text')}</p>
            <Link to={to} className="mt-8">
              <Button size="lg">{t('landing.cta')} →</Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
