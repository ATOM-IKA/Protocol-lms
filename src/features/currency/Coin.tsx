/** Монета внутренней валюты PROTOCOL — шестигранная фигура с гранями и знаком ◈. */
export function Coin({ size = 20, className }: { size?: number; className?: string }) {
  const gid = 'coin' + Math.round(size)
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${(50 + Math.cos(a) * 46).toFixed(1)},${(50 + Math.sin(a) * 46).toFixed(1)}`
  }).join(' ')
  const inner = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `${(50 + Math.cos(a) * 33).toFixed(1)},${(50 + Math.sin(a) * 33).toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Монета">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#ffd24a" />
          <stop offset="100%" stopColor="#e0a41f" />
        </linearGradient>
      </defs>
      <polygon points={hex} fill={`url(#${gid})`} stroke="#8a6a12" strokeWidth="2" />
      <polygon points={inner} fill="none" stroke="#8a6a12" strokeWidth="1.5" opacity="0.6" />
      <text x="50" y="63" textAnchor="middle" fontSize="34" fontWeight="700" fill="#6b4e0d" style={{ fontFamily: 'Unbounded Variable, sans-serif' }}>
        ◈
      </text>
    </svg>
  )
}
