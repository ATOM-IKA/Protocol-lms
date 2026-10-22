import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { usePublicStats } from '@/features/stats/useStats'

function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number): void => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

function Stat({ target, label, index, active, loading, suffix }: {
  target: number; label: string; index: string; active: boolean; loading?: boolean; suffix?: string
}) {
  const value = useCountUp(target, active)
  return (
    <div className="p-8">
      <Label>{index}</Label>
      <div className="mt-3 font-mono text-5xl font-bold text-lime">
        {loading ? '…' : `${value.toLocaleString('ru-RU')}${suffix ?? ''}`}
      </div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </div>
  )
}

export function Stats() {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const { data, isLoading } = usePublicStats()
  const active = inView && !isLoading
  return (
    <section
      className="relative overflow-hidden py-24"
      style={{
        backgroundImage:
          'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      <Container>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-3"
        >
          <div className="bg-surface"><Stat target={data?.courses ?? 0}  label={t('landing.stats_courses')}  index="/ 01" active={active} loading={isLoading} /></div>
          <div className="bg-surface"><Stat target={data?.students ?? 0} label={t('landing.stats_students')} index="/ 02" active={active} loading={isLoading} /></div>
          <div className="bg-surface"><Stat target={data?.hours ?? 0}    label={t('landing.stats_hours')}    index="/ 03" active={active} loading={isLoading} /></div>
        </motion.div>
      </Container>
    </section>
  )
}