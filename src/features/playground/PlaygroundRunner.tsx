import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, RotateCcw, GripVertical, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { Label } from '@/shared/ui/Label'
import { cn } from '@/shared/lib/cn'
import {
  BLOCK_DEFS, TONE_HEX, flattenLeaves, newNode,
  type Align, type NodeKind, type Node, type Size, type Tone,
} from './blocks'
import { NodeView } from './NodeView'
import { scoreDesign } from './score'
import type { Exercise } from './exercises'

const AUTO_WIDTH: NodeKind[] = ['heading', 'button']
const TONES: Tone[] = ['default', 'aqua', 'lime', 'teal', 'muted']
const SIZES: Size[] = ['sm', 'md', 'lg']

function ringColor(p: number): string {
  if (p >= 90) return '#beef8d'
  if (p >= 60) return '#9fe8ff'
  if (p >= 30) return '#e8c14a'
  return '#ff5d6c'
}
function justify(a?: Align): string {
  return a === 'left' ? 'justify-start' : a === 'right' ? 'justify-end' : 'justify-center'
}

function mapTree(nodes: Node[], id: string, fn: (n: Node) => Node): Node[] {
  return nodes.map((n) => {
    if (n.id === id) return fn(n)
    if (n.kind === 'row' && n.children) return { ...n, children: mapTree(n.children, id, fn) }
    return n
  })
}
function removeTree(nodes: Node[], id: string): Node[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => (n.kind === 'row' && n.children ? { ...n, children: removeTree(n.children, id) } : n))
}
function findNode(nodes: Node[], id: string): Node | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.kind === 'row' && n.children) {
      const f = findNode(n.children, id)
      if (f) return f
    }
  }
  return null
}

export function PlaygroundRunner({ exercise }: { exercise: Exercise }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const dragIndex = useRef<number | null>(null)

  const result = useMemo(() => scoreDesign(nodes, exercise), [nodes, exercise])
  const selected = selId ? findNode(nodes, selId) : null

  function add(kind: NodeKind): void {
    const node = newNode(kind)
    const sel = selId ? findNode(nodes, selId) : null
    if (sel && sel.kind === 'row' && kind !== 'row') {
      setNodes((ns) => mapTree(ns, sel.id, (r) => ({ ...r, children: [...(r.children ?? []), node] })))
    } else {
      setNodes((ns) => [...ns, node])
    }
    setSelId(node.id)
  }
  function patch(id: string, p: Partial<Node>): void {
    setNodes((ns) => mapTree(ns, id, (n) => ({ ...n, ...p })))
  }
  function remove(id: string): void {
    setNodes((ns) => removeTree(ns, id))
    if (selId === id) setSelId(null)
  }
  function reorderTop(from: number, to: number): void {
    setNodes((ns) => {
      if (from === to || from < 0 || to < 0 || from >= ns.length || to >= ns.length) return ns
      const next = [...ns]
      const [m] = next.splice(from, 1)
      next.splice(to, 0, m)
      return next
    })
  }

  const frameW = exercise.frame === 'mobile' ? 'w-[300px]' : 'w-full'

  function renderNode(n: Node) {
    const full = !AUTO_WIDTH.includes(n.kind)
    return (
      <div className={cn('flex', justify(n.align))}>
        <div
          onClick={(e) => { e.stopPropagation(); setSelId(n.id) }}
          className={cn('relative cursor-pointer', full ? 'w-full' : '', selId === n.id && 'outline outline-2 -outline-offset-2 outline-aqua')}
        >
          <NodeView node={n} />
          {selId === n.id && (
            <button
              onClick={(e) => { e.stopPropagation(); remove(n.id) }}
              aria-label="Удалить блок"
              className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center border border-line-strong bg-surface text-ink-muted hover:text-danger"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[210px_1fr_250px]">
      {/* Палитра */}
      <div className="border border-line bg-surface p-3">
        <Label>// блоки</Label>
        <div className="mt-3 flex flex-col gap-1.5">
          {exercise.palette.map((kind) => (
            <button
              key={kind}
              onClick={() => add(kind)}
              className={cn(
                'flex h-10 items-center justify-between border px-3 text-left text-sm transition-colors',
                kind === 'row' ? 'border-line-lime text-lime hover:bg-lime/10' : 'border-line-strong text-ink-soft hover:border-aqua hover:text-aqua',
              )}
            >
              {BLOCK_DEFS[kind].label}
              <Plus size={14} />
            </button>
          ))}
        </div>
        {selected?.kind === 'row' && (
          <p className="mt-3 font-mono text-[10px] text-lime">Ряд выбран — блоки добавятся внутрь</p>
        )}
      </div>

      {/* Холст */}
      <div className="flex flex-col items-center">
        <div
          onClick={() => setSelId(null)}
          className={cn(frameW, 'mx-auto min-h-[280px] border border-line-strong bg-bg p-4')}
        >
          {nodes.length === 0 ? (
            <div className="mx-auto flex h-[240px] max-w-xs items-center justify-center text-center font-mono text-xs leading-relaxed text-ink-dim">
              Добавляйте блоки слева, перетаскивайте для порядка, выделяйте для настройки
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {nodes.map((n, i) => (
                <div
                  key={n.id}
                  draggable
                  onDragStart={() => (dragIndex.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIndex.current !== null) reorderTop(dragIndex.current, i); dragIndex.current = null }}
                  className="group flex items-start gap-1"
                >
                  <span className="mt-2 cursor-grab text-ink-dim opacity-0 transition-opacity group-hover:opacity-100"><GripVertical size={14} /></span>
                  <div className="min-w-0 flex-1">{renderNode(n)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { setNodes([]); setSelId(null) }} className="mt-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
          <RotateCcw size={13} /> сбросить
        </button>
      </div>

      {/* Панель: свойства ИЛИ оценка */}
      <div className="flex flex-col gap-4">
        {selected && selected.kind !== 'row' && (
          <div className="border border-line bg-surface p-4">
            <Label accent>// свойства</Label>
            {BLOCK_DEFS[selected.kind].hasText && (
              <div className="mt-3">
                <span className="label-mono text-[10px]">текст</span>
                <input
                  value={selected.text ?? ''}
                  onChange={(e) => patch(selected.id, { text: e.target.value })}
                  className="mt-1 h-9 w-full border border-line-strong bg-surface-2 px-2 text-sm text-ink focus:border-aqua focus:outline-none"
                />
              </div>
            )}
            <div className="mt-3">
              <span className="label-mono text-[10px]">выравнивание</span>
              <div className="mt-1 flex gap-1">
                {(['left', 'center', 'right'] as Align[]).map((a) => {
                  const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight
                  return (
                    <button key={a} onClick={() => patch(selected.id, { align: a })} aria-label={a}
                      className={cn('flex h-8 flex-1 items-center justify-center border', selected.align === a ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted')}>
                      <Icon size={15} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-3">
              <span className="label-mono text-[10px]">цвет</span>
              <div className="mt-1 flex gap-2">
                {TONES.map((tn) => (
                  <button key={tn} onClick={() => patch(selected.id, { tone: tn })} aria-label={tn}
                    className={cn('h-7 w-7 border', selected.tone === tn ? 'border-aqua' : 'border-line-strong')}
                    style={{ background: TONE_HEX[tn] }} />
                ))}
              </div>
            </div>
            <div className="mt-3">
              <span className="label-mono text-[10px]">размер</span>
              <div className="mt-1 flex gap-1">
                {SIZES.map((sz) => (
                  <button key={sz} onClick={() => patch(selected.id, { size: sz })}
                    className={cn('h-8 flex-1 border font-mono text-xs uppercase', selected.size === sz ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted')}>
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border border-line-aqua bg-surface p-4">
          <Label accent>// оценка</Label>
          <div className="mt-3 flex flex-col items-center">
            <ProgressRing value={result.percent} size={88} stroke={7} color={ringColor(result.percent)} />
            <motion.div key={result.verdict} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-center text-sm text-ink">
              {result.verdict}
            </motion.div>
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {result.checks.map((c, i) => (
              <li key={i} className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-x-2 text-xs">
                <span className={cn('mt-0.5 h-3.5 w-3.5 border', c.ok ? 'border-lime bg-lime/20' : 'border-line-strong')} />
                <span className={c.ok ? 'text-ink-soft' : 'text-ink-muted'}>
                  {c.label}
                  {!c.ok && c.tip && <span className="block text-ink-dim">→ {c.tip}</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 font-mono text-[10px] text-ink-dim">блоков: {flattenLeaves(nodes).length}</div>
        </div>
      </div>
    </div>
  )
}
