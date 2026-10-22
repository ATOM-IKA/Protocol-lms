interface Props {
  value: number // 0..100
  size?: number
  stroke?: number
  color?: string
  label?: string
}

export function ProgressRing({ value, size = 56, stroke = 5, color = '#9fe8ff', label }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Прогресс ${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#232838" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#eaf2f0" fontSize={size * 0.26} fontFamily="'JetBrains Mono', monospace">
        {label ?? `${value}%`}
      </text>
    </svg>
  )
}
