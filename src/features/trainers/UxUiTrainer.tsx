import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { PlaygroundRunner } from '@/features/playground/PlaygroundRunner'
import { EXERCISES, makeCustomExercise, type CustomSpec } from '@/features/playground/exercises'
import { BLOCK_DEFS, type LeafKind } from '@/features/playground/blocks'
import { cn } from '@/shared/lib/cn'

// блоки, доступные как критерии в конструкторе задания
const CRITERIA_BLOCKS: LeafKind[] = ['nav', 'hero', 'heading', 'text', 'button', 'image', 'card', 'input', 'footer', 'badge', 'list', 'avatar', 'stat']

export function UxUiTrainer() {
  const [exId, setExId] = useState(EXERCISES[0].id)
  const isCustom = exId === 'custom'

  // конструктор своего задания
  const [task, setTask] = useState('')
  const [required, setRequired] = useState<Partial<Record<LeafKind, number>>>({})
  const [frame, setFrame] = useState<'desktop' | 'mobile'>('desktop')
  const [firstNav, setFirstNav] = useState(false)
  const [lastFooter, setLastFooter] = useState(false)
  const [singleCTA, setSingleCTA] = useState(false)

  const bump = (k: LeafKind, d: number) =>
    setRequired((r) => {
      const v = Math.max(0, Math.min(6, (r[k] ?? 0) + d))
      const next = { ...r }
      if (v === 0) delete next[k]
      else next[k] = v
      return next
    })

  const exercise = useMemo(() => {
    if (!isCustom) return EXERCISES.find((e) => e.id === exId) ?? EXERCISES[0]
    const spec: CustomSpec = { task, required, frame, firstNav, lastFooter, singleCTA }
    return makeCustomExercise(spec)
  }, [exId, isCustom, task, required, frame, firstNav, lastFooter, singleCTA])

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {EXERCISES.map((e) => (
          <button
            key={e.id}
            onClick={() => setExId(e.id)}
            className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', e.id === exId ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
          >
            {e.title}
          </button>
        ))}
        <button
          onClick={() => setExId('custom')}
          className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', isCustom ? 'border-lime text-lime' : 'border-line-lime text-lime/70 hover:text-lime')}
        >
          + Своё задание
        </button>
      </div>

      {isCustom ? (
        <div className="clip-hud mt-5 border border-line-lime bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-lime">конструктор задания</span>
            <div className="flex gap-1">
              {(['desktop', 'mobile'] as const).map((f) => (
                <button key={f} onClick={() => setFrame(f)} className={cn('border px-2 py-1 font-mono text-[10px] uppercase clip-btn', frame === f ? 'border-aqua text-aqua' : 'border-line-strong text-ink-dim')}>
                  {f === 'desktop' ? 'десктоп' : 'мобайл'}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Опишите задание для студентов: что собрать, на что обратить внимание…"
            rows={2}
            className="mt-3 w-full resize-y border border-line-strong bg-surface-2 p-2 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none"
          />

          <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-dim">Обязательные блоки (авто-проверка)</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CRITERIA_BLOCKS.map((k) => {
              const n = required[k] ?? 0
              return (
                <div key={k} className={cn('flex items-center justify-between border px-2 py-1.5', n > 0 ? 'border-line-lime' : 'border-line-strong')}>
                  <span className="truncate text-xs text-ink-soft">{BLOCK_DEFS[k].label}</span>
                  <span className="flex items-center gap-1.5">
                    <button onClick={() => bump(k, -1)} className="text-ink-dim transition-colors hover:text-aqua" aria-label="меньше"><Minus size={12} /></button>
                    <span className={cn('w-4 text-center font-mono text-xs', n > 0 ? 'text-lime' : 'text-ink-dim')}>{n}</span>
                    <button onClick={() => bump(k, 1)} className="text-ink-dim transition-colors hover:text-aqua" aria-label="больше"><Plus size={12} /></button>
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { on: firstNav, set: setFirstNav, label: 'Навигация первой' },
              { on: lastFooter, set: setLastFooter, label: 'Футер последним' },
              { on: singleCTA, set: setSingleCTA, label: 'Один CTA' },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => o.set(!o.on)}
                className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', o.on ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
              >
                {o.on ? '✓ ' : ''}{o.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="clip-hud mt-5 border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-lime">задание</span>
            <span className="font-mono text-[10px] uppercase text-ink-dim">{exercise.frame}</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{exercise.task}</p>
        </div>
      )}

      <div className="mt-6">
        <PlaygroundRunner key={exId + (isCustom ? frame : '')} exercise={exercise} />
      </div>
    </div>
  )
}
