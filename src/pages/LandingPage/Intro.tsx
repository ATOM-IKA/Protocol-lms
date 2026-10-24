import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { EASE_LOFI } from '@/shared/lib/motion'

/** Чертёж знака «P»: направляющие, окружности, контур буквы (viewBox 1600×900). */
const GUIDES = [
  'M0 300 H1600',
  'M0 600 H1600',
  'M0 450 H1600',
  'M700 0 V900',
  'M900 0 V900',
  'M560 900 L800 100',
  'M1040 900 L800 100',
  'M700 300 L960 600',
]
const CIRCLES = [
  { cx: 830, cy: 390, r: 110 },
  { cx: 800, cy: 450, r: 260 },
]
const P_OUTLINE = 'M710 600 V280 H830 A110 110 0 0 1 830 500 H770 V600 Z'

// фазы: 0 чертёж → 1 сфера → 2 взрыв в вордмарк → 3 растворение в интерфейс
const TIMELINE = [1100, 2000, 2800, 3500]

/** Заставка поверх страницы. Сама себя убирает через onDone. */
export function Intro({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const ids = [
      setTimeout(() => setPhase(1), TIMELINE[0]),
      setTimeout(() => setPhase(2), TIMELINE[1]),
      setTimeout(() => setPhase(3), TIMELINE[2]),
      setTimeout(onDone, TIMELINE[3]),
    ]
    return () => ids.forEach(clearTimeout)
  }, [onDone])

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-bg"
      animate={{ opacity: phase >= 3 ? 0 : 1 }}
      transition={{ duration: 0.7, ease: EASE_LOFI }}
    >
      {/* 0. чертёж */}
      <motion.svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        animate={{ opacity: phase >= 1 ? 0 : 1, scale: phase >= 1 ? 1.15 : 1 }}
        transition={{ duration: 0.6, ease: EASE_LOFI }}
      >
        {GUIDES.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity={0.35}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: EASE_LOFI }}
          />
        ))}
        {CIRCLES.map((c, i) => (
          <motion.circle
            key={i}
            {...c}
            fill="none"
            stroke="var(--color-aqua)"
            strokeOpacity={0.45}
            strokeDasharray="4 6"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.25 + i * 0.1, ease: EASE_LOFI }}
          />
        ))}
        <motion.path
          d={P_OUTLINE}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: EASE_LOFI }}
        />
      </motion.svg>

      {/* 1. сфера → 2. разлёт */}
      <motion.div
        className="pl-orb absolute"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 0
            ? { scale: 0, opacity: 0 }
            : phase === 1
              ? { scale: 1, opacity: 1, filter: 'blur(0px)' }
              : { scale: 9, opacity: 0, filter: 'blur(30px)' }
        }
        transition={{ duration: phase === 1 ? 0.6 : 0.8, ease: EASE_LOFI }}
      />

      {/* вспышка */}
      <motion.div
        className="absolute inset-0 bg-aqua"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 2 ? [0, 0.35, 0] : 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* 2. вордмарк «влетает» смазанным и собирается */}
      <motion.div
        className="relative font-display text-[clamp(2.2rem,11.2vw,10rem)] font-black uppercase leading-none tracking-tight text-ink"
        initial={{ opacity: 0, scaleX: 2.6, skewX: -28, filter: 'blur(26px)' }}
        animate={
          phase >= 2
            ? { opacity: 1, scaleX: 1, skewX: 0, filter: 'blur(0px)' }
            : { opacity: 0, scaleX: 2.6, skewX: -28, filter: 'blur(26px)' }
        }
        transition={{ duration: 0.75, ease: EASE_LOFI }}
        style={{
          textShadow:
            phase === 2 ? '-6px 0 var(--color-aqua), 6px 0 var(--color-lime)' : '0 0 transparent',
        }}
      >
        {t('landing.title')}
      </motion.div>
    </motion.div>
  )
}
