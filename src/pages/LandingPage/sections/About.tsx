import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { EASE_LOFI } from '@/shared/lib/motion'
import { MarkLine, Pluses, setSceneTone } from '../parts'

const MARK = 'M120 340 V60 H230 A100 100 0 0 1 230 260 H180 V340 Z'

/** Сцена 2: светлая «шторка» волной накрывает тёмную сцену; текст в тёмных плашках. */
export function About() {
  const { t } = useTranslation()
  useEffect(() => setSceneTone('pl-about', 'light'), [])
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  // чем ближе секция к верху экрана, тем площе волна
  const wave = useTransform(scrollYProgress, (v) => {
    const c = (1 - v) * 180
    return `M0,200 L0,${200 - c * 0.35} C420,${200 - c * 1.1} 980,${200 - c * 0.9} 1440,${200 - c * 0.2} L1440,200 Z`
  })
  const lines = [t('landing.about_1'), t('landing.about_2'), t('landing.about_3')]

  return (
    <section id="pl-about" ref={ref} className="relative z-10 bg-ink text-bg">
      <svg
        aria-hidden
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[24vh] w-full -translate-y-[calc(100%-1px)]"
      >
        <motion.path d={wave} fill="var(--color-ink)" />
      </svg>
      <Pluses count={10} seed={70} className="text-bg/25" />

      <svg
        aria-hidden
        viewBox="0 0 400 400"
        className="pointer-events-none absolute right-[5%] top-1/2 hidden h-[64vh] -translate-y-1/2 md:block"
      >
        <motion.circle
          cx="230"
          cy="160"
          r="100"
          fill="none"
          stroke="var(--color-bg)"
          strokeOpacity={0.15}
          strokeDasharray="3 6"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: EASE_LOFI }}
        />
        <motion.path
          d={MARK}
          fill="none"
          stroke="var(--color-bg)"
          strokeOpacity={0.18}
          strokeWidth={1.5}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, delay: 0.3, ease: EASE_LOFI }}
        />
      </svg>

      <div className="relative mx-auto flex min-h-[110svh] max-w-6xl flex-col justify-center px-6 py-32">
        <div className="mb-10 font-mono text-[11px] uppercase tracking-[0.3em] text-bg/50">
          — about
        </div>
        <h2 className="font-display text-[clamp(1.6rem,4.4vw,3.6rem)] font-bold leading-[1.25]">
          {lines.map((line, i) => (
            <MarkLine key={i} text={line} i={i} />
          ))}
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={{ duration: 0.6, delay: 0.8, ease: EASE_LOFI }}
          className="mt-10 max-w-md font-mono text-xs leading-relaxed text-bg/55"
        >
          {t('landing.about_sub')}
        </motion.p>
      </div>
    </section>
  )
}
