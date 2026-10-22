import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Terminal, Activity, Trophy } from 'lucide-react'
import { Container } from '@/shared/ui/Container'
import { Card } from '@/shared/ui/Card'
import { Label } from '@/shared/ui/Label'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'

export function Features() {
  const { t } = useTranslation()
  const items = [
    { n: '01', icon: Terminal, title: t('landing.feature_focus_title'), text: t('landing.feature_focus_text') },
    { n: '02', icon: Activity, title: t('landing.feature_progress_title'), text: t('landing.feature_progress_text'), accent: true },
    { n: '03', icon: Trophy, title: t('landing.feature_xp_title'), text: t('landing.feature_xp_text') },
  ]
  return (
    <section className="py-24">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-5 sm:grid-cols-3"
        >
          {items.map(({ n, icon: Icon, title, text, accent }) => (
            <motion.div key={n} variants={fadeInUp}>
              <Card reveal hoverable accent={accent} className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line-strong text-lime">
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                  </span>
                  <Label>{n} / feature</Label>
                </div>
                <h3 className="mt-5 text-xl">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{text}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
