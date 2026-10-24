import { useRef } from 'react'
import {
  motion,
  useInView,
  useMotionValueEvent,
  type MotionStyle,
  type MotionValue,
} from 'framer-motion'
import { cn } from '@/shared/lib/cn'
import { EASE_LOFI } from '@/shared/lib/motion'

/** Строка в тёмной плашке: плашка «вытирается» слева направо, затем проявляется текст. */
export function MarkLine({ text, i, className }: { text: string; i: number; className?: string }) {
  // видимость меряем по обёртке: у плашки со scaleX(0) нулевая площадь, IntersectionObserver её «не видит»
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  return (
    <span ref={ref} className={cn('relative block w-fit', className)}>
      <motion.span
        aria-hidden
        className="absolute inset-0 origin-left bg-bg"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : undefined}
        transition={{ duration: 0.6, delay: i * 0.18, ease: EASE_LOFI }}
      />
      <motion.span
        className="relative block px-[0.4em] py-[0.06em] text-ink"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 0.3, delay: i * 0.18 + 0.35 }}
      >
        {text}
      </motion.span>
    </span>
  )
}

/** Псевдослучайное 0…1 без Math.random — стабильно между рендерами. */
export const prand = (i: number): number => ((i * 9301 + 49297) % 233280) / 233280

/** Событие навигации по сценам (обрабатывает LandingPage через lenis). */
export const goTo = (id: string): void => {
  window.dispatchEvent(new CustomEvent('pl:goto', { detail: id }))
}

type Side = 'l' | 'r' | 't' | 'b'
const WALL: Record<Side, { cols: number; rows: number; seed: number }> = {
  l: { cols: 7, rows: 8, seed: 0 },
  r: { cols: 7, rows: 8, seed: 100 },
  t: { cols: 10, rows: 5, seed: 200 },
  b: { cols: 10, rows: 5, seed: 300 },
}

function Wall({ side }: { side: Side }) {
  const { cols, rows, seed } = WALL[side]
  return (
    <div
      className={`pl-wall pl-wall-${side}`}
      style={{
        gridTemplateColumns: `repeat(${cols},1fr)`,
        gridTemplateRows: `repeat(${rows},1fr)`,
      }}
    >
      {Array.from({ length: cols * rows }, (_, i) => {
        const r = prand(i + seed)
        const kind = r > 0.93 ? 'pl-tile-hot' : r < 0.08 ? 'pl-tile-void' : ''
        return (
          <div
            key={i}
            className={cn('pl-tile', kind)}
            style={{
              animationDelay: `${(r * 6).toFixed(2)}s`,
              animationDuration: `${(3 + prand(i * 7 + seed) * 4).toFixed(2)}s`,
            }}
          />
        )
      })}
    </div>
  )
}

/** Туннель из мерцающих плиток (4 стены в перспективе) — фон hero и витрины. */
export function Tunnel({ style }: { style?: MotionStyle }) {
  return (
    <motion.div aria-hidden className="pl-tunnel" style={style}>
      <Wall side="t" />
      <Wall side="b" />
      <Wall side="l" />
      <Wall side="r" />
      <div className="pl-tunnel-core" />
    </motion.div>
  )
}

/** Стеклянная трёхгранная пирамида, медленно вращается. */
export function Prism({
  size,
  className,
  style,
}: {
  size: number
  className?: string
  style?: MotionStyle
}) {
  const h = size * 1.35
  const r = size * 0.2887 // радиус вписанной окружности основания
  const tilt = (Math.atan(r / h) * 180) / Math.PI
  const slant = Math.hypot(h, r)
  return (
    <motion.div
      aria-hidden
      className={cn('pl-prism-wrap', className)}
      style={{ width: size, height: h, ...style }}
    >
      <div className="pl-prism">
        {[0, 120, 240].map((a) => (
          <div
            key={a}
            className="pl-prism-face"
            style={{
              width: size,
              height: slant,
              left: 0,
              bottom: 0,
              transform: `rotateY(${a}deg) translateZ(${r}px) rotateX(${tilt}deg)`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

/** Россыпь HUD-крестиков по сетке. */
export function Pluses({
  count,
  seed,
  className,
}: {
  count: number
  seed: number
  className?: string
}) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="pl-plus"
          style={{ left: `${6 + prand(i + seed) * 88}%`, top: `${8 + prand(i * 3 + seed) * 84}%` }}
        />
      ))}
    </div>
  )
}

/**
 * SVG-фильтр «рассыпания» (турбулентность + смещение). Силу задаёт motion value;
 * атрибут пишем напрямую — у motion-компонентов проп `scale` занят трансформацией.
 */
export function NoiseFilter({ id, strength }: { id: string; strength: MotionValue<number> }) {
  const ref = useRef<SVGFEDisplacementMapElement>(null)
  useMotionValueEvent(strength, 'change', (v) => ref.current?.setAttribute('scale', v.toFixed(1)))
  return (
    <svg aria-hidden className="absolute h-0 w-0">
      <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={4} />
        <feDisplacementMap
          ref={ref}
          in="SourceGraphic"
          scale={strength.get()}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}
