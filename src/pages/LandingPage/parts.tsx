import { useEffect, useRef, useState } from 'react'
import { motion, useInView, type MotionStyle } from 'framer-motion'
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

// ───── туннель ─────
// Плоская перспективная сетка (вложенные рамки + лучи), а не четыре 3D-стены: один слой, который
// видеокарта масштабирует почти бесплатно. Мерцает горстка ячеек — только прозрачностью.
const TW = 1600
const TH = 900
const DEPTHS = [1, 0.74, 0.55, 0.41, 0.3, 0.22, 0.16, 0.12, 0.085, 0.06]
type Pt = [number, number]
const frameAt = (f: number) => ({
  x: (TW - TW * f) / 2,
  y: (TH - TH * f) / 2,
  w: TW * f,
  h: TH * f,
})
/** точка на периметре рамки: сторона 0..3 (верх, право, низ, лево) и доля t вдоль стороны */
const edgePoint = (f: number, side: number, t: number): Pt => {
  const r = frameAt(f)
  if (side === 0) return [r.x + r.w * t, r.y]
  if (side === 1) return [r.x + r.w, r.y + r.h * t]
  if (side === 2) return [r.x + r.w * (1 - t), r.y + r.h]
  return [r.x, r.y + r.h * (1 - t)]
}
const TUNNEL_RAYS: string[] = []
for (let side = 0; side < 4; side++) {
  for (const t of [0, 0.25, 0.5, 0.75]) {
    const a = edgePoint(DEPTHS[0], side, t)
    const b = edgePoint(DEPTHS[DEPTHS.length - 1], side, t)
    TUNNEL_RAYS.push(`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`)
  }
}
const TUNNEL_CELLS = Array.from({ length: 22 }, (_, i) => {
  const k = Math.floor(prand(i + 11) * (DEPTHS.length - 2))
  const side = Math.floor(prand(i * 3 + 5) * 4)
  const seg = Math.floor(prand(i * 7 + 2) * 4)
  const t0 = seg / 4
  const t1 = (seg + 1) / 4
  const pts = [
    edgePoint(DEPTHS[k], side, t0),
    edgePoint(DEPTHS[k], side, t1),
    edgePoint(DEPTHS[k + 1], side, t1),
    edgePoint(DEPTHS[k + 1], side, t0),
  ]
  return {
    points: pts.map((p) => p.join(',')).join(' '),
    hot: prand(i + 33) > 0.78,
    delay: (prand(i + 4) * 6).toFixed(2),
    duration: (3 + prand(i + 9) * 4).toFixed(2),
  }
})

/** Туннель из сетки — фон hero и витрины. В лёгком режиме без мерцающих ячеек. */
export function Tunnel({ style, lite = false }: { style?: MotionStyle; lite?: boolean }) {
  return (
    <motion.div aria-hidden className="pl-tunnel" style={style}>
      <svg
        viewBox={`0 0 ${TW} ${TH}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke="rgba(159,232,255,0.2)" strokeWidth="1">
          {DEPTHS.map((f) => {
            const r = frameAt(f)
            return <rect key={f} x={r.x} y={r.y} width={r.w} height={r.h} />
          })}
          {TUNNEL_RAYS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {!lite &&
          TUNNEL_CELLS.map((c, i) => (
            <polygon
              key={i}
              points={c.points}
              className={cn('pl-cell', c.hot && 'pl-cell-hot')}
              style={{ animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s` }}
            />
          ))}
      </svg>
      <div className="pl-tunnel-core" />
    </motion.div>
  )
}

/**
 * Стеклянная пирамида. Раньше это были три 3D-грани с clip-path — браузер пересчитывал их каждый кадр
 * (самый дорогой элемент сцены). Теперь это плоский SVG с гранями-градиентами: выглядит так же «гранёно»,
 * движется только transform'ом (слой на видеокарте), покачивание включается лишь при spin.
 */
export function Prism({
  size,
  className,
  style,
  spin = true,
}: {
  size: number
  className?: string
  style?: MotionStyle
  spin?: boolean
}) {
  const h = size * 1.35
  return (
    <motion.div
      aria-hidden
      className={cn('pl-prism-wrap', className)}
      style={{ width: size, height: h, ...style }}
    >
      <svg
        viewBox="0 0 100 135"
        className={cn('pl-prism', spin && 'pl-prism-sway')}
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="pl-f1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="var(--color-aqua)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--color-lime)" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="pl-f2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-aqua)" stopOpacity="0.38" />
            <stop offset="0.6" stopColor="var(--color-aqua)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--color-lime)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="pl-f3" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="1" stopColor="var(--color-aqua)" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points="50,2 6,128 50,108" fill="url(#pl-f1)" />
        <polygon points="50,2 94,128 50,108" fill="url(#pl-f2)" />
        <polygon points="6,128 94,128 50,108" fill="url(#pl-f3)" />
        <polyline
          points="50,2 6,128 50,108 50,2 94,128 50,108"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.45"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <line
          x1="6"
          y1="128"
          x2="94"
          y2="128"
          stroke="#fff"
          strokeOpacity="0.35"
          strokeWidth="0.6"
        />
      </svg>
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
 * «Лёгкий» режим: телефон, тач-экран или слабое устройство (≤4 ядер). Тут отключаем самое дорогое —
 * вращение и мерцание фона, крупное размытие. Реагирует на поворот экрана и смену размера окна.
 */
const LITE_QUERY = '(max-width: 767px), (pointer: coarse)'
const detectLite = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia(LITE_QUERY).matches || (navigator.hardwareConcurrency ?? 8) <= 4)
export function useLite(): boolean {
  const [lite, setLite] = useState(detectLite)
  useEffect(() => {
    const mq = window.matchMedia(LITE_QUERY)
    const on = (): void => setLite(detectLite())
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return lite
}

/**
 * Цвет шапки и рельса: на светлых сценах — тёмный, на тёмных — светлый. Вместо mix-blend-mode (он заставляет
 * браузер пересчитывать всё под закреплёнными слоями каждый кадр) — один атрибут на <html>, который меняет цвет.
 */
const sceneTone: Record<string, 'light' | 'dark'> = {}
let activeScene = ''
const applyTone = (): void => {
  document.documentElement.setAttribute('data-pl-tone', sceneTone[activeScene] ?? 'dark')
}
/** Задать тон сцены (может меняться при прокрутке — например, Vision темнеет к концу). */
export const setSceneTone = (id: string, tone: 'light' | 'dark'): void => {
  sceneTone[id] = tone
  applyTone()
}
/** Следит, какая сцена сейчас под шапкой (узкая полоса у верхнего края экрана). */
export function useHeaderTone(ids: readonly string[]): void {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            activeScene = e.target.id
            applyTone()
          }
        }
      },
      { rootMargin: '0px 0px -94% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => {
      io.disconnect()
      document.documentElement.removeAttribute('data-pl-tone')
    }
  }, [ids])
}

/** Статичная «зернистость»: рисуется один раз (SVG-текстура), потом только меняется прозрачность. */
export function Grain({ className, style }: { className?: string; style?: MotionStyle }) {
  return <motion.div aria-hidden className={cn('pl-grain', className)} style={style} />
}
