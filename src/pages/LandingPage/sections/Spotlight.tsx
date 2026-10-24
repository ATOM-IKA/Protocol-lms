import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthEntry } from '@/features/auth/useAuthEntry'
import { usePublicStats } from '@/features/stats/useStats'
import { Pluses } from '../parts'

function useCountUp(target: number, active: boolean, duration = 1600): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number): void => {
      const p = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

function Stat({
  target,
  label,
  active,
  loading,
}: {
  target: number
  label: string
  active: boolean
  loading: boolean
}) {
  const value = useCountUp(target, active)
  return (
    <div className="border-t border-ink/25 pt-3">
      <div className="font-display text-[clamp(2rem,5vw,4rem)] font-black leading-none text-ink">
        {loading ? '…' : value.toLocaleString('ru-RU')}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-soft">
        {label}
      </div>
    </div>
  )
}

const BLOBS = [
  { c: 'bg-aqua/45', s: 'left-[-10%] top-[-10%] h-[70vh] w-[70vh]', d: '0s' },
  { c: 'bg-lime/35', s: 'right-[-8%] top-[10%] h-[60vh] w-[60vh]', d: '-4s' },
  { c: 'bg-teal/70', s: 'left-[25%] bottom-[-20%] h-[75vh] w-[75vh]', d: '-8s' },
  { c: 'bg-aqua-bright/30', s: 'right-[20%] bottom-[5%] h-[40vh] w-[40vh]', d: '-2s' },
]

/** Сцена 5: карточка раскрывается на весь экран — PROTOCOL ✦ и живая статистика. */
export function Spotlight() {
  const { t } = useTranslation()
  const { to } = useAuthEntry()
  const ref = useRef<HTMLElement>(null)
  const [on, setOn] = useState(false)
  const { data, isLoading } = usePublicStats()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const grow = useTransform(p, [0.02, 0.45], [0, 1])
  const clipPath = useTransform(grow, (g) => {
    const v = (1 - g) * 24
    const h = (1 - g) * 18
    return `inset(${h}% ${v}% ${h}% ${v}% round ${(1 - g) * 16}px)`
  })
  const rotateY = useTransform(grow, [0, 1], [-14, 0])
  const content = useTransform(p, [0.42, 0.56], [0, 1])
  const contentY = useTransform(p, [0.42, 0.56, 0.86, 1], ['6vh', '0vh', '0vh', '-8vh'])
  useMotionValueEvent(content, 'change', (v) => {
    if (v > 0.6) setOn(true)
  })
  const active = on && !isLoading

  return (
    <section id="pl-spotlight" ref={ref} className="relative h-[260vh] bg-bg">
      <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ perspective: 1400 }}>
        <motion.div
          style={{ clipPath, rotateY }}
          className="absolute inset-0 overflow-hidden bg-surface"
        >
          {BLOBS.map((b, i) => (
            <div key={i} className={`pl-blob ${b.c} ${b.s}`} style={{ animationDelay: b.d }} />
          ))}
          <Pluses count={8} seed={120} className="text-ink/50" />

          <motion.div
            style={{ opacity: content, y: contentY }}
            className="absolute inset-0 flex flex-col justify-center px-6 sm:px-[8vw]"
          >
            <div className="flex flex-wrap items-start gap-4">
              <h2 className="relative font-display text-[clamp(2.6rem,12vw,11rem)] font-black leading-none tracking-tight text-ink drop-shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
                <span
                  aria-hidden
                  className="pl-twinkle absolute -left-[0.1em] -top-[0.35em] text-[0.4em] text-ink"
                >
                  ✦
                </span>
                {t('landing.title')}
              </h2>
              <Link
                to={to}
                aria-label={t('landing.cta')}
                className="mt-[1.5vw] flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/60 text-xl text-ink transition-colors hover:bg-lime hover:text-bg sm:h-16 sm:w-16"
              >
                ↗
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-ink-soft">{t('landing.subtitle')}</p>
            {data && (
              <div className="mt-10 grid max-w-3xl grid-cols-3 gap-4 sm:gap-10">
                <Stat
                  target={data.courses}
                  label={t('landing.stats_courses')}
                  active={active}
                  loading={isLoading}
                />
                <Stat
                  target={data.students}
                  label={t('landing.stats_students')}
                  active={active}
                  loading={isLoading}
                />
                <Stat
                  target={data.hours}
                  label={t('landing.stats_hours')}
                  active={active}
                  loading={isLoading}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
