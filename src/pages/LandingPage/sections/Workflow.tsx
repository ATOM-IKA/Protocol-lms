import { useRef, type ComponentType } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { NoiseFilter, Pluses } from '../parts'
import { CoursesMock, LoginMock, ProgressMock } from '../Mockups'

const WORDS = ['login', 'learn', 'level up']
const MOCKS: ComponentType[] = [LoginMock, CoursesMock, ProgressMock]

function StepPanel({
  i,
  pos,
  title,
  text,
}: {
  i: number
  pos: MotionValue<number>
  title: string
  text: string
}) {
  const d = useTransform(pos, (p) => i - p)
  const opacity = useTransform(d, (v) => Math.max(0, 1 - Math.abs(v) * 1.8))
  const cardX = useTransform(d, (v) => `${v * 70}vw`)
  const cardRotate = useTransform(d, (v) => -16 + v * 30)
  const textX = useTransform(d, (v) => `${v * 35}vw`)
  const wordX = useTransform(d, (v) => `${v * 22 - 4}vw`)
  const pointerEvents = useTransform(d, (v) => (Math.abs(v) < 0.5 ? 'auto' : 'none'))
  const Mock = MOCKS[i]
  return (
    <motion.div style={{ opacity, pointerEvents }} className="absolute inset-0">
      <motion.div
        aria-hidden
        style={{ x: wordX }}
        data-text={WORDS[i]}
        data-on="true"
        className="pl-glitch pl-serif absolute bottom-[5%] left-0 whitespace-nowrap text-[clamp(5rem,20vw,18rem)] italic leading-none text-ink/80"
      >
        {WORDS[i]}
      </motion.div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 md:flex-row md:justify-between md:px-[6vw]">
        <motion.div
          style={{
            x: cardX,
            rotateY: cardRotate,
            transformPerspective: 1200,
            containerType: 'inline-size',
          }}
          className="aspect-[16/10] w-[88vw] overflow-hidden rounded-[10px] border border-line-aqua shadow-[0_0_80px_rgba(159,232,255,0.15)] md:w-[46vw]"
        >
          <Mock />
        </motion.div>
        <motion.div style={{ x: textX }} className="w-full max-w-sm">
          <div className="font-mono text-[11px] uppercase tracking-widest text-aqua">
            step 0{i + 1} / 03
          </div>
          <h3 className="mt-3 text-3xl sm:text-4xl">{title}</h3>
          <p className="mt-4 text-ink-soft">{text}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}

/** Сцена 4: гигантское WORKFLOW «собирается» из шума, затем три шага с карточками. */
export function Workflow() {
  const { t } = useTranslation()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const noise = useTransform(p, [0, 0.12], [140, 0])
  const giantOpacity = useTransform(p, [0, 0.1, 0.9, 1], [0, 0.08, 0.08, 0])
  const giantX = useTransform(p, [0, 1], ['0%', '-30%'])
  const pos = useTransform(p, [0.14, 0.92], [0, 2])

  const steps = [
    { title: t('landing.how_1_title'), text: t('landing.how_1_text') },
    { title: t('landing.how_2_title'), text: t('landing.how_2_text') },
    { title: t('landing.how_3_title'), text: t('landing.how_3_text') },
  ]

  return (
    <section id="pl-workflow" ref={ref} className="relative h-[420vh]">
      <NoiseFilter id="pl-noise-wf" strength={noise} />
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-bg">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(var(--pl-aqua-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--pl-aqua-rgb),0.07) 1px, transparent 1px)',
            backgroundSize: '120px 120px',
          }}
        />
        <Pluses count={16} seed={90} className="text-ink/40" />
        <motion.div
          aria-hidden
          style={{ opacity: giantOpacity, x: giantX, filter: 'url(#pl-noise-wf)' }}
          className="absolute inset-y-0 left-0 flex flex-col justify-center font-display text-[clamp(5rem,22vw,20rem)] font-black uppercase leading-[0.85] text-ink"
        >
          <span className="whitespace-nowrap">WORKFLOW WORKFLOW</span>
          <span className="whitespace-nowrap pl-[18vw]">WORKFLOW WORKFLOW</span>
        </motion.div>
        <div className="absolute left-6 top-24 font-mono text-[11px] uppercase tracking-widest text-aqua sm:left-12">
          {'// '}
          {t('landing.how_title')}
        </div>
        {steps.map((s, i) => (
          <StepPanel key={i} i={i} pos={pos} title={s.title} text={s.text} />
        ))}
      </div>
    </section>
  )
}
