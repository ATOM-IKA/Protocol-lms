import { useMemo, useState } from 'react'
import { Check, X, RotateCcw, Laptop, Server, ShieldCheck, Router } from 'lucide-react'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { cn } from '@/shared/lib/cn'

type NodeType = 'client' | 'server' | 'coordinator' | 'gateway'
interface NetNode { id: string; label: string; type: NodeType; x: number; y: number }
interface Link { a: string; b: string; enc: boolean }

const ICONS: Record<NodeType, typeof Laptop> = {
  client: Laptop,
  server: Server,
  coordinator: ShieldCheck,
  gateway: Router,
}

interface NetCheck {
  label: string
  test: (links: Link[]) => boolean
}
interface NetTask {
  id: string
  title: string
  prompt: string
  nodes: NetNode[]
  checks: NetCheck[]
}

function has(links: Link[], a: string, b: string): Link | undefined {
  return links.find((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))
}
const linked = (links: Link[], a: string, b: string) => !!has(links, a, b)
const secured = (links: Link[], a: string, b: string) => !!has(links, a, b)?.enc

const TASKS: NetTask[] = [
  {
    id: 'basic',
    title: 'Базовая топология',
    prompt: 'Подключите оба узла к координатору ViPNet: клиент → координатор и сервер → координатор. Соединение: кликните один узел, затем другой.',
    nodes: [
      { id: 'client', label: 'Клиент', type: 'client', x: 90, y: 60 },
      { id: 'coord', label: 'Координатор', type: 'coordinator', x: 300, y: 170 },
      { id: 'server', label: 'Сервер', type: 'server', x: 510, y: 60 },
    ],
    checks: [
      { label: 'Клиент подключён к координатору', test: (l) => linked(l, 'client', 'coord') },
      { label: 'Сервер подключён к координатору', test: (l) => linked(l, 'server', 'coord') },
    ],
  },
  {
    id: 'secure',
    title: 'Защищённый канал',
    prompt: 'Постройте сеть ViPNet: клиент и сервер подключены к координатору, а между клиентом и сервером — защищённый канал. Кликните по линии, чтобы включить шифрование (канал станет зелёным).',
    nodes: [
      { id: 'client', label: 'Клиент', type: 'client', x: 90, y: 60 },
      { id: 'coord', label: 'Координатор', type: 'coordinator', x: 300, y: 175 },
      { id: 'server', label: 'Сервер', type: 'server', x: 510, y: 60 },
    ],
    checks: [
      { label: 'Клиент ↔ координатор', test: (l) => linked(l, 'client', 'coord') },
      { label: 'Сервер ↔ координатор', test: (l) => linked(l, 'server', 'coord') },
      { label: 'Защищённый канал клиент ↔ сервер', test: (l) => secured(l, 'client', 'server') },
    ],
  },
  {
    id: 'segment',
    title: 'Сегмент со шлюзом',
    prompt: 'Локальный клиент выходит наружу через шлюз. Соедините: клиент → шлюз, шлюз → координатор, координатор → удалённый сервер. Канал шлюз ↔ удалённый сервер сделайте защищённым.',
    nodes: [
      { id: 'lan', label: 'ЛВС-клиент', type: 'client', x: 80, y: 60 },
      { id: 'gw', label: 'Шлюз', type: 'gateway', x: 230, y: 180 },
      { id: 'coord', label: 'Координатор', type: 'coordinator', x: 400, y: 60 },
      { id: 'remote', label: 'Удал. сервер', type: 'server', x: 540, y: 185 },
    ],
    checks: [
      { label: 'Клиент ↔ шлюз', test: (l) => linked(l, 'lan', 'gw') },
      { label: 'Шлюз ↔ координатор', test: (l) => linked(l, 'gw', 'coord') },
      { label: 'Координатор ↔ удал. сервер', test: (l) => linked(l, 'coord', 'remote') },
      { label: 'Защищённый канал шлюз ↔ удал. сервер', test: (l) => secured(l, 'gw', 'remote') },
    ],
  },
  {
    id: 'branch',
    title: 'Два филиала',
    prompt: 'Объедините два филиала через координатор ViPNet защищёнными каналами: офис-1 ↔ координатор и офис-2 ↔ координатор, оба канала зашифрованы.',
    nodes: [
      { id: 'o1', label: 'Офис-1', type: 'gateway', x: 90, y: 60 },
      { id: 'coord', label: 'Координатор', type: 'coordinator', x: 300, y: 175 },
      { id: 'o2', label: 'Офис-2', type: 'gateway', x: 510, y: 60 },
    ],
    checks: [
      { label: 'Защищённый канал офис-1 ↔ координатор', test: (l) => secured(l, 'o1', 'coord') },
      { label: 'Защищённый канал офис-2 ↔ координатор', test: (l) => secured(l, 'o2', 'coord') },
    ],
  },
  {
    id: 'redundant',
    title: 'Резервный координатор',
    prompt: 'Отказоустойчивость: подключите клиента к двум координаторам сразу (основной и резервный), оба канала — защищённые.',
    nodes: [
      { id: 'client', label: 'Клиент', type: 'client', x: 90, y: 120 },
      { id: 'main', label: 'Осн. координатор', type: 'coordinator', x: 420, y: 55 },
      { id: 'backup', label: 'Рез. координатор', type: 'coordinator', x: 420, y: 190 },
    ],
    checks: [
      { label: 'Защищённый канал к основному', test: (l) => secured(l, 'client', 'main') },
      { label: 'Защищённый канал к резервному', test: (l) => secured(l, 'client', 'backup') },
    ],
  },
]

export function NetworkTrainer() {
  const [taskId, setTaskId] = useState(TASKS[0].id)
  const task = useMemo(() => TASKS.find((t) => t.id === taskId) ?? TASKS[0], [taskId])
  const [links, setLinks] = useState<Link[]>([])
  const [sel, setSel] = useState<string | null>(null)

  function reset() {
    setLinks([])
    setSel(null)
  }
  function pickNode(id: string) {
    if (sel === null) return setSel(id)
    if (sel === id) return setSel(null)
    setLinks((cur) => {
      const ex = has(cur, sel, id)
      if (ex) return cur.filter((l) => l !== ex) // повторный выбор пары — убрать связь
      return [...cur, { a: sel, b: id, enc: false }]
    })
    setSel(null)
  }
  function toggleEnc(a: string, b: string) {
    setLinks((cur) => cur.map((l) => (l.a === a && l.b === b ? { ...l, enc: !l.enc } : l)))
  }

  const nodeById = (id: string) => task.nodes.find((n) => n.id === id)!
  const passed = task.checks.map((c) => c.test(links))
  const score = Math.round((passed.filter(Boolean).length / task.checks.length) * 100)

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TASKS.map((tk) => (
          <button
            key={tk.id}
            onClick={() => { setTaskId(tk.id); reset() }}
            className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', tk.id === taskId ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
          >
            {tk.title}
          </button>
        ))}
      </div>

      <div className="clip-hud mt-5 border border-line bg-surface p-5">
        <span className="font-mono text-xs uppercase tracking-widest text-lime">задание</span>
        <p className="mt-2 text-sm text-ink-soft">{task.prompt}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="border border-line-strong bg-[#05070a]">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[11px] text-ink-muted">схема сети · кликните узлы, затем линию для шифрования</span>
            <button onClick={reset} className="flex items-center gap-1 font-mono text-[11px] text-ink-dim transition-colors hover:text-aqua">
              <RotateCcw size={12} /> сброс
            </button>
          </div>
          <svg viewBox="0 0 600 240" className="w-full">
            {/* связи */}
            {links.map((l, i) => {
              const na = nodeById(l.a)
              const nb = nodeById(l.b)
              return (
                <g key={i} className="cursor-pointer" onClick={() => toggleEnc(l.a, l.b)}>
                  <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="transparent" strokeWidth={16} />
                  <line
                    x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke={l.enc ? 'var(--color-lime)' : 'var(--color-line-strong)'}
                    strokeWidth={l.enc ? 2.5 : 1.5}
                    strokeDasharray={l.enc ? '0' : '5 4'}
                  />
                  {l.enc && (
                    <text x={(na.x + nb.x) / 2} y={(na.y + nb.y) / 2 - 6} textAnchor="middle" className="fill-lime font-mono" style={{ fontSize: 9 }}>
                      🔒 VPN
                    </text>
                  )}
                </g>
              )
            })}
            {/* узлы */}
            {task.nodes.map((n) => {
              const active = sel === n.id
              return (
                <g key={n.id} className="cursor-pointer" onClick={() => pickNode(n.id)}>
                  <rect
                    x={n.x - 30} y={n.y - 22} width={60} height={44} rx={4}
                    fill="var(--color-surface)"
                    stroke={active ? 'var(--color-aqua)' : 'var(--color-line-strong)'}
                    strokeWidth={active ? 2 : 1}
                  />
                  <text x={n.x} y={n.y + 30} textAnchor="middle" className="fill-current font-mono" style={{ fontSize: 9, fill: 'var(--color-ink-muted)' }}>
                    {n.label}
                  </text>
                </g>
              )
            })}
          </svg>
          {/* иконки узлов поверх SVG невозможны как lucide — рисуем легенду */}
          <div className="flex flex-wrap gap-3 border-t border-line px-3 py-2">
            {task.nodes.map((n) => {
              const Icon = ICONS[n.type]
              return (
                <span key={n.id} className={cn('flex items-center gap-1.5 font-mono text-[11px]', sel === n.id ? 'text-aqua' : 'text-ink-muted')}>
                  <Icon size={13} /> {n.label}
                </span>
              )
            })}
          </div>
        </div>

        <div className="clip-hud flex flex-col items-center border border-line bg-surface p-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">авто-оценка</span>
          <div className="mt-3"><ProgressRing value={score} size={92} /></div>
          <ul className="mt-4 w-full space-y-2">
            {task.checks.map((c, i) => (
              <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 text-xs">
                <span className={cn('mt-0.5 flex h-4 w-4 items-center justify-center border', passed[i] ? 'border-lime text-lime' : 'border-line-strong text-ink-dim')}>
                  {passed[i] ? <Check size={11} /> : <X size={11} />}
                </span>
                <span className={passed[i] ? 'text-ink-soft' : 'text-ink-muted'}>{c.label}</span>
              </li>
            ))}
          </ul>
          {score === 100 && <div className="mt-4 w-full border border-line-lime bg-surface-2 py-2 text-center font-mono text-xs text-lime">сеть настроена верно</div>}
        </div>
      </div>
    </div>
  )
}
