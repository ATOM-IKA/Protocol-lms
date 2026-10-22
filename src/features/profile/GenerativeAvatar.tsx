import { useId, useMemo } from 'react'
import { RANK_STYLES, type Rank } from '@/entities/profile/ranks'

function hash(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Полярная точка: угол 0 = вверх, центр (50,50). */
function polar(angle: number, r: number): string {
  return `${(50 + Math.sin(angle) * r).toFixed(1)},${(50 - Math.cos(angle) * r).toFixed(1)}`
}

interface Petal {
  points: string
  fill: string
  opacity: number
}

/**
 * Уникальный голографический аватар: радиально-симметричная эмблема,
 * детерминированная по `seed` (ID). «Крутость» растёт с рангом (F→SSS).
 */
export function GenerativeAvatar({
  seed,
  rank,
  size = 96,
  className,
}: {
  seed: string
  rank: Rank
  size?: number
  className?: string
}) {
  const gid = useId().replace(/:/g, '')
  const st = RANK_STYLES[rank]

  const model = useMemo(() => {
    const rnd = makeRng(hash(seed) ^ (rank.length * 2654435761))
    // Порядок симметрии — чётко геометричный
    const sym = [4, 5, 6, 8][Math.floor(rnd() * 4)]
    const motifCount = Math.max(1, Math.round(st.shapes / 4))
    const petals: Petal[] = []
    for (let m = 0; m < motifCount; m++) {
      const rOuter = 40 - m * 8 - rnd() * 4
      const rInner = 7 + rnd() * 6
      const rMid = rInner + (rOuter - rInner) * (0.5 + rnd() * 0.2)
      const width = (Math.PI / sym) * (0.55 + rnd() * 0.35)
      // лепесток-ромб, зеркально-симметричный относительно своей оси
      const points = [polar(0, rInner), polar(width, rMid), polar(0, rOuter), polar(-width, rMid)].join(' ')
      petals.push({
        points,
        fill: st.palette[(m + 1) % st.palette.length],
        opacity: 0.62 - m * 0.14,
      })
    }
    const orbR = 9 + rnd() * 5
    const orbColor = st.palette[Math.floor(rnd() * Math.min(2, st.palette.length))]
    return { sym, petals, orbR, orbColor }
  }, [seed, rank, st])

  const accent = st.palette[0]
  const glowFilter = st.glow > 0 ? `drop-shadow(0 0 ${Math.round(st.glow * 9)}px ${st.halo})` : undefined

  const hexPts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${(50 + Math.cos(a) * 44).toFixed(1)},${(50 + Math.sin(a) * 44).toFixed(1)}`
  }).join(' ')

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Цифровой аватар, ранг ${rank}`}
      style={glowFilter ? { filter: glowFilter } : undefined}
    >
      <rect x="0" y="0" width="100" height="100" fill="#0e1119" />

      {/* концентрические кольца */}
      {Array.from({ length: st.rings }, (_, i) => (
        <circle key={`r${i}`} cx="50" cy="50" r={20 + i * 9} fill="none" stroke={accent} strokeWidth="0.5" opacity={0.25 + i * 0.12} />
      ))}

      {/* симметричный глиф: каждый лепесток размножен по кругу */}
      {model.petals.map((p, mi) =>
        Array.from({ length: model.sym }, (_, k) => (
          <polygon
            key={`${mi}-${k}`}
            points={p.points}
            fill={p.fill}
            opacity={p.opacity}
            transform={`rotate(${((360 / model.sym) * k).toFixed(2)} 50 50)`}
          />
        )),
      )}

      {/* ядро */}
      <defs>
        <radialGradient id={`orb-${gid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor={model.orbColor} />
          <stop offset="100%" stopColor="#0b0d12" />
        </radialGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r={model.orbR}
        fill={`url(#orb-${gid})`}
        style={st.pulse ? { animation: 'protocol-pulse 2.4s ease-in-out infinite' } : undefined}
      />

      {/* вращающееся внешнее кольцо (A+) */}
      {st.spin && (
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'protocol-spin 9s linear infinite' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke={accent} strokeWidth="0.6" strokeDasharray="3 5" opacity="0.7" />
        </g>
      )}

      {/* рамки */}
      {st.frame === 'ticks' && (
        <g stroke={accent} strokeWidth="1.4">
          <path d="M6 6 h10 M6 6 v10" />
          <path d="M94 6 h-10 M94 6 v10" />
          <path d="M6 94 h10 M6 94 v-10" />
          <path d="M94 94 h-10 M94 94 v-10" />
        </g>
      )}
      {(st.frame === 'hex' || st.frame === 'double' || st.frame === 'crown') && (
        <polygon points={hexPts} fill="none" stroke={accent} strokeWidth="0.9" opacity="0.85" />
      )}
      {st.frame === 'double' && (
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'protocol-spin-rev 14s linear infinite' }}>
          <polygon points={hexPts} fill="none" stroke={st.palette[1] ?? accent} strokeWidth="0.5" opacity="0.5" transform="scale(0.82)" style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
        </g>
      )}
      {st.frame === 'crown' && (
        <g fill={st.halo}>
          {[-1, 0, 1].map((d) => (
            <polygon key={d} points={`${50 + d * 10},4 ${47 + d * 10},11 ${53 + d * 10},11`} />
          ))}
        </g>
      )}

      {/* орбитальные частицы (S+) */}
      {st.particles > 0 && (
        <g style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: 'protocol-spin 7s linear infinite' }}>
          {Array.from({ length: st.particles }, (_, i) => {
            const a = (Math.PI * 2 * i) / st.particles
            return (
              <circle key={i} cx={(50 + Math.cos(a) * 43).toFixed(1)} cy={(50 + Math.sin(a) * 43).toFixed(1)} r="1.6" fill={st.palette[i % st.palette.length]} />
            )
          })}
        </g>
      )}
    </svg>
  )
}
