import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { EASE_LOFI } from '@/shared/lib/motion'
import { useAuthEntry } from '@/features/auth/useAuthEntry'
import { goTo } from '../parts'

/** Чертёжные направляющие на весь экран (viewBox 1000×600). */
const GUIDES = [
  ...[60, 140, 210, 270, 560, 640, 700, 760, 820, 880, 940].map((x) => `M${x} 0 V600`),
  'M0 190 H1000',
  'M0 410 H1000',
  'M20 0 L300 600',
  'M300 0 L20 600',
]
const FONT = 200
const BASELINE = 220

interface Glyph {
  ch: string
  x: number
  w: number
}

/** Финал-футер: знак P появляется сразу, остальные буквы чертятся контуром и заливаются. */
export function Finale({ onReplay }: { onReplay: () => void }) {
  const { t } = useTranslation()
  const { to } = useAuthEntry()
  const textRef = useRef<SVGTextElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, margin: '-20%' })
  const [glyphs, setGlyphs] = useState<Glyph[]>([])
  const [viewBox, setViewBox] = useState('0 0 1200 280')
  const word = t('landing.title')

  // позиции букв меряем в браузере — для окружностей-направляющих у O и C
  useEffect(() => {
    let alive = true
    void document.fonts.ready.then(() => {
      const el = textRef.current
      if (!alive || !el) return
      setGlyphs(
        Array.from(word, (ch, i) => {
          const r = el.getExtentOfChar(i)
          return { ch, x: r.x, w: r.width }
        }),
      )
      const b = el.getBBox()
      setViewBox(`${b.x - 30} ${b.y - 30} ${b.width + 60} ${b.height + 60}`)
    })
    return () => {
      alive = false
    }
  }, [word])

  const draw = (delay: number, duration = 1.2) => ({
    initial: { pathLength: 0 },
    animate: inView ? { pathLength: 1 } : undefined,
    transition: { duration, delay, ease: EASE_LOFI },
  })
  const capMid = BASELINE - FONT * 0.36

  return (
    <footer
      id="pl-finale"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-bg"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[45%] h-[70vh] w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(159,232,255,0.28),rgba(58,116,93,0.25)_40%,transparent_70%)] blur-2xl"
      />
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        {GUIDES.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            stroke="var(--color-ink)"
            strokeOpacity={0.22}
            vectorEffect="non-scaling-stroke"
            fill="none"
            {...draw(i * 0.04, 1.4)}
          />
        ))}
      </svg>

      <div
        ref={wrapRef}
        className="relative z-10 flex flex-1 items-center justify-center px-4 pt-24"
      >
        <svg
          viewBox={viewBox}
          className="w-[min(92vw,1400px)] overflow-visible"
          role="img"
          aria-label={word}
        >
          {/* направляющие по буквам */}
          {glyphs.map((g, i) =>
            i === 0 ? null : (
              <g key={i}>
                <motion.path
                  d={`M${g.x} ${BASELINE - FONT} V${BASELINE + 20}`}
                  stroke="var(--color-aqua)"
                  strokeOpacity={0.5}
                  strokeWidth={1}
                  fill="none"
                  {...draw(0.2 + i * 0.08, 0.8)}
                />
                {(g.ch === 'O' || g.ch === 'C') && (
                  <motion.circle
                    cx={g.x + g.w / 2}
                    cy={capMid}
                    r={Math.min(g.w * 0.46, FONT * 0.4)}
                    fill="none"
                    stroke="var(--color-aqua)"
                    strokeOpacity={0.6}
                    strokeDasharray="4 6"
                    {...draw(0.3 + i * 0.1, 1)}
                  />
                )}
              </g>
            ),
          )}
          <text
            ref={textRef}
            x="0"
            y={BASELINE}
            fontSize={FONT}
            fontWeight={900}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <motion.tspan
              fill="var(--color-ink)"
              initial={{ fillOpacity: 0 }}
              animate={inView ? { fillOpacity: 1 } : undefined}
              transition={{ duration: 0.5, ease: EASE_LOFI }}
            >
              {word.slice(0, 1)}
            </motion.tspan>
            <motion.tspan
              fill="var(--color-ink)"
              stroke="var(--color-ink)"
              strokeWidth={2}
              strokeDasharray="1600"
              initial={{ fillOpacity: 0, strokeDashoffset: 1600 }}
              animate={inView ? { fillOpacity: 1, strokeDashoffset: 0 } : undefined}
              transition={{
                strokeDashoffset: { duration: 1.8, delay: 0.7, ease: EASE_LOFI },
                fillOpacity: { duration: 0.9, delay: 2.2, ease: EASE_LOFI },
              }}
            >
              {word.slice(1)}
            </motion.tspan>
          </text>
        </svg>
      </div>

      <div className="relative z-10 grid gap-8 px-6 pb-8 sm:grid-cols-[1fr_auto] sm:px-12">
        <nav className="grid grid-cols-2 gap-x-12 gap-y-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted sm:grid-cols-3">
          {[
            ['pl-stage', 'top'],
            ['pl-about', 'about'],
            ['pl-vision', 'vision'],
            ['pl-workflow', 'workflow'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              className="w-fit transition-colors hover:text-aqua"
            >
              {label}
            </button>
          ))}
          <Link to="/portal" className="w-fit transition-colors hover:text-aqua">
            {t('nav.portal')}
          </Link>
          <Link to="/features" className="w-fit transition-colors hover:text-aqua">
            {t('nav.features')}
          </Link>
          <Link to="/privacy" className="w-fit transition-colors hover:text-aqua">
            {t('privacy.link')}
          </Link>
          <button
            type="button"
            onClick={onReplay}
            className="w-fit transition-colors hover:text-aqua"
          >
            ▶ intro
          </button>
        </nav>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Link to={to}>
            <Button size="lg">{t('landing.cta')} →</Button>
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            © {new Date().getFullYear()} PROTOCOL · {t('landing.footer_tagline')}
          </span>
        </div>
      </div>
    </footer>
  )
}
