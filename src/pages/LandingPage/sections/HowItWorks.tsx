import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'

export function HowItWorks() {
  const { t } = useTranslation()
  const steps = [
    { n: '1', title: t('landing.how_1_title'), text: t('landing.how_1_text') },
    { n: '2', title: t('landing.how_2_title'), text: t('landing.how_2_text') },
    { n: '3', title: t('landing.how_3_title'), text: t('landing.how_3_text') },
  ]
  return (
    <section className="border-y border-line bg-surface py-24">
      <Container>
        <div className="flex items-center justify-between">
          <Label accent>// workflow</Label>
          <Label>03 / 03</Label>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-4xl"
        >
          {t('landing.how_title')}<span className="text-lime">.</span>
        </motion.h2>

        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-14 grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3"
        >
          {steps.map(({ n, title, text }) => (
            <motion.li key={n} variants={fadeInUp} className="relative bg-surface p-8">
              <span className="pointer-events-none absolute right-4 top-2 font-display text-7xl font-bold text-elevated select-none">
                {n}
              </span>
              <span className="label-mono text-lime">step {n}</span>
              <h3 className="mt-3 text-xl">{title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </Container>
    </section>
  )
}
