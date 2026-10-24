import { useEffect, useRef, useState, type ComponentType } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/Button'
import { Label } from '@/shared/ui/Label'
import { EASE_LOFI } from '@/shared/lib/motion'
import { useAuthEntry } from '@/features/auth/useAuthEntry'
import { Wordmark } from '../Wordmark'
import { Prism, Pluses, Tunnel, prand } from '../parts'
import { CoursesMock, JournalMock, ProgressMock, QuizMock, XpMock } from '../Mockups'

interface Slide {
  title: string
  text: string
  tags: string[]
  Mock: ComponentType
}

const STEP = 34 // угол между карточками на цилиндре, град.
const FLIP_TILES = 12 * 7

/** Ширина < 768 — другой радиус цилиндра и размер пирамиды. */
function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const on = (): void => setNarrow(window.innerWidth < 768)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return narrow
}

/** Карточка на внутренней стороне цилиндра: положение — функция «текущей» позиции pos. */
function CylinderCard({
  i,
  pos,
  enter,
  leave,
  narrow,
  slide,
}: {
  i: number
  pos: MotionValue<number>
  enter: MotionValue<number>
  leave: MotionValue<number>
  narrow: boolean
  slide: Slide
}) {
  const R = narrow ? 70 : 62 // радиус в vw
  const transform = useTransform([pos, enter, leave], (v: number[]) => {
    const [p, a, b] = v
    const th = (i - p) * STEP
    const rad = (th * Math.PI) / 180
    const x = Math.sin(rad) * R
    const z = (1 - Math.cos(rad)) * R * 0.45 - (1 - a) * 140 + b * 50
    return `perspective(1400px) translateX(${x}vw) translateZ(${z}vw) rotateY(${-th}deg)`
  })
  const opacity = useTransform([pos, enter, leave], (v: number[]) => {
    const [p, a, b] = v
    return Math.max(0, Math.min(1, 2 - Math.abs(i - p))) * a * (1 - b)
  })
  const zIndex = useTransform(pos, (p) => 50 - Math.round(Math.abs(i - p) * 10))
  const { Mock } = slide
  return (
    <motion.div
      style={{
        transform,
        opacity,
        zIndex,
        width: 'var(--cw)',
        height: 'calc(var(--cw) * 0.62)',
        left: 'calc(50% - var(--cw) / 2)',
        top: 'calc(50% - var(--cw) * 0.31)',
        containerType: 'inline-size',
      }}
      className="absolute overflow-hidden rounded-[10px] border border-line-aqua shadow-[0_0_80px_rgba(159,232,255,0.14)]"
    >
      <Mock />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-aqua/10" />
    </motion.div>
  )
}

/** Сцена 1: hero в туннеле → «FEATURES» → 3D-цилиндр витрины → стена текста и гаснущие плитки. */
export function Stage({ onReplay }: { onReplay: () => void }) {
  const { t } = useTranslation()
  const { to } = useAuthEntry()
  const narrow = useNarrow()
  const ref = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // hero → FEATURES
  const heroOut = useTransform(p, [0.05, 0.15], [0, 1])
  const heroOpacity = useTransform(heroOut, [0, 1], [1, 0])
  const heroScale = useTransform(heroOut, [0, 1], [1, 1.25])
  const heroBlur = useTransform(heroOut, (v) => `blur(${v * 16}px)`)
  const titleOpacity = useTransform(p, [0.12, 0.17, 0.25, 0.31], [0, 1, 1, 0])
  const titleScale = useTransform(p, [0.12, 0.31], [0.8, 1.35])
  const titleBlur = useTransform(
    p,
    [0.12, 0.17, 0.25, 0.31],
    ['blur(20px)', 'blur(0px)', 'blur(0px)', 'blur(14px)'],
  )

  // декор
  const tunnelScale = useTransform(p, [0, 0.3, 1], [1, 1.18, 1.3])
  const tunnelRotate = useTransform(p, [0, 1], [0, -6])
  const prismScale = useTransform(p, [0, 0.18, 0.3], [1, 1.5, 0.7])
  const prismOpacity = useTransform(p, [0.24, 0.34, 0.9, 0.96], [1, 0.35, 0.35, 0])
  const hudOpacity = useTransform(p, [0.03, 0.09], [1, 0])

  // витрина-цилиндр
  const enter = useTransform(p, [0.24, 0.35], [0, 1])
  const leave = useTransform(p, [0.89, 0.95], [0, 1])
  const pos = useTransform(p, [0.35, 0.86], [0, 4])
  const captionOpacity = useTransform([enter, leave], (v: number[]) => v[0] * (1 - v[1]))
  useMotionValueEvent(pos, 'change', (v) => setActive(Math.round(v)))

  // выход: стена текста + «гаснущие» плитки (одна CSS-переменная --flip вместо 84 motion value)
  const wallOpacity = useTransform(p, [0.9, 0.96], [0, 0.5])
  const flip = useTransform(p, [0.93, 1], [0, 1])
  useMotionValueEvent(flip, 'change', (v) =>
    stickyRef.current?.style.setProperty('--flip', v.toFixed(3)),
  )

  const slides: Slide[] = [
    {
      title: t('landing.feature_focus_title'),
      text: t('landing.feature_focus_text'),
      tags: ['college', 'access'],
      Mock: CoursesMock,
    },
    {
      title: t('landing.feature_progress_title'),
      text: t('landing.feature_progress_text'),
      tags: ['realtime', 'progress'],
      Mock: ProgressMock,
    },
    {
      title: t('landing.feature_xp_title'),
      text: t('landing.feature_xp_text'),
      tags: ['xp', 'levels', 'streak'],
      Mock: XpMock,
    },
    {
      title: t('landing.showcase_journal_title'),
      text: t('landing.showcase_journal_text'),
      tags: ['journal', 'attendance'],
      Mock: JournalMock,
    },
    {
      title: t('landing.showcase_quiz_title'),
      text: t('landing.showcase_quiz_text'),
      tags: ['quiz', 'tasks'],
      Mock: QuizMock,
    },
  ]
  const idx = Math.min(Math.max(active, 0), slides.length - 1)
  const current = slides[idx]

  return (
    <section id="pl-stage" ref={ref} className="relative h-[700vh]">
      <div
        ref={stickyRef}
        className="sticky top-0 h-[100svh] overflow-hidden [--cw:min(600px,80vw)] [--flip:0]"
      >
        <Tunnel style={{ scale: tunnelScale, rotateZ: tunnelRotate }} />
        <Pluses count={14} seed={5} className="text-aqua/50" />

        <div className="absolute inset-0 flex items-center justify-center">
          <Prism
            size={narrow ? 150 : 260}
            style={{ scale: prismScale, opacity: prismOpacity, y: '-4%' }}
          />
        </div>

        {/* HERO */}
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, filter: heroBlur }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center"
        >
          <Label className="mb-6">{t('landing.kicker')}</Label>
          <Wordmark
            text={t('landing.title')}
            play
            className="text-[clamp(2.2rem,11.2vw,10rem)] drop-shadow-[0_0_40px_rgba(159,232,255,0.35)]"
          />
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px w-11 bg-aqua" />
            <span className="font-mono text-sm text-aqua">{t('landing.hero_note')}</span>
            <span className="h-px w-11 bg-aqua" />
          </div>
          <div className="mt-8">
            <Link to={to}>
              <Button size="lg">{t('landing.cta')} →</Button>
            </Link>
          </div>
        </motion.div>

        {/* HUD hero */}
        <motion.div
          style={{ opacity: hudOpacity }}
          className="pointer-events-none absolute inset-0 z-20"
        >
          <div className="absolute right-6 top-24 flex flex-col items-end gap-2">
            <div className="pl-compass" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              sys · online
            </span>
          </div>
          <div className="pointer-events-auto absolute bottom-6 left-6 space-y-1 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            <div>protocol // lms</div>
            <div>net: college · v1.0</div>
            <button
              type="button"
              onClick={onReplay}
              className="clip-btn mt-2 border border-line-strong px-3 py-1.5 text-ink-soft transition-colors hover:border-aqua hover:text-aqua"
            >
              ▶ intro
            </button>
          </div>
          <ul className="absolute bottom-6 right-6 hidden w-72 space-y-3 text-left md:block">
            {slides.slice(0, 3).map((s, i) => (
              <li key={i} className="border-t border-line pt-2">
                <div className="font-mono text-[10px] text-aqua">/0{i + 1}</div>
                <div className="text-xs text-ink-soft">{s.title}</div>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            scroll
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="block h-8 w-px bg-gradient-to-b from-aqua to-transparent"
            />
          </div>
        </motion.div>

        {/* FEATURES */}
        <motion.div
          aria-hidden
          style={{ opacity: titleOpacity, scale: titleScale, filter: titleBlur }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <div
            data-text="FEATURES"
            data-on="true"
            className="pl-glitch relative font-display text-[clamp(2.6rem,13vw,12rem)] font-black uppercase leading-none tracking-tight text-ink/90"
          >
            FEATURES
          </div>
        </motion.div>

        {/* цилиндр */}
        <div className="absolute inset-0 z-10">
          {slides.map((s, i) => (
            <CylinderCard
              key={i}
              i={i}
              pos={pos}
              enter={enter}
              leave={leave}
              narrow={narrow}
              slide={s}
            />
          ))}
        </div>

        {/* подпись активной карточки */}
        <motion.div
          style={{ opacity: captionOpacity }}
          className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-6 p-6 sm:p-10"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.35, ease: EASE_LOFI }}
              className="max-w-md"
            >
              <div className="font-mono text-[11px] text-aqua">
                0{idx + 1} / 0{slides.length}
              </div>
              <h3 className="mt-1 text-2xl sm:text-3xl">{current.title}</h3>
              <p className="mt-1 hidden text-sm text-ink-soft sm:block">{current.text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {current.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <Link
            to="/features"
            className="shrink-0 font-mono text-xs uppercase tracking-widest text-ink-soft transition-colors hover:text-lime"
          >
            {t('landing.showcase_more')} ↗
          </Link>
        </motion.div>

        {/* выход: стена повторяющегося текста */}
        <motion.div
          aria-hidden
          style={{ opacity: wallOpacity }}
          className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-center gap-2 overflow-hidden"
        >
          {Array.from({ length: 5 }, (_, r) => (
            <div
              key={r}
              className="whitespace-nowrap font-display text-[clamp(3rem,10vw,9rem)] font-black uppercase leading-none text-aqua/40"
              style={{ transform: `translateX(${r % 2 ? -12 : -2}%)` }}
            >
              {`${t('landing.title')} `.repeat(4)}
            </div>
          ))}
        </motion.div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 grid grid-cols-12 grid-rows-7"
        >
          {Array.from({ length: FLIP_TILES }, (_, i) => (
            <div
              key={i}
              className="bg-bg"
              style={{
                opacity: `clamp(0, calc((var(--flip) - ${(prand(i + 40) * 0.7).toFixed(3)}) * 6), 1)`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
