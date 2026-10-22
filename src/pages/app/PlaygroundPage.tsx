import { useState, type ComponentType } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { TRAINERS } from '@/features/trainers/registry'
import { UxUiTrainer } from '@/features/trainers/UxUiTrainer'
import { ConsoleTrainer } from '@/features/trainers/ConsoleTrainer'
import { NetworkTrainer } from '@/features/trainers/NetworkTrainer'
import { CodeTrainer } from '@/features/trainers/CodeTrainer'
import { cn } from '@/shared/lib/cn'

const TRAINER_COMPONENTS: Record<string, ComponentType> = {
  uxui: UxUiTrainer,
  console: ConsoleTrainer,
  network: NetworkTrainer,
  app: CodeTrainer,
}

export function PlaygroundPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = TRAINERS.find((t) => t.id === openId)
  const Trainer = open ? TRAINER_COMPONENTS[open.id] : undefined

  if (open && Trainer) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <button
          onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua"
        >
          <ArrowLeft size={14} /> все тренажёры
        </button>
        <h1 className="mt-4 text-3xl sm:text-4xl">{open.title}<span className="text-aqua">.</span></h1>
        <p className="mt-2 max-w-2xl text-ink-soft">{open.description}</p>
        <div className="mt-6">
          <Trainer />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>// тренажёры</Label>
        <Label>library</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">Библиотека тренажёров<span className="text-aqua">.</span></h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Интерактивные тренажёры по разным дисциплинам — с живой авто-оценкой. Открывайте и практикуйтесь.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TRAINERS.map((tr) => {
          const Icon = tr.icon
          const live = tr.status === 'live'
          return (
            <button
              key={tr.id}
              onClick={() => live && setOpenId(tr.id)}
              disabled={!live}
              className={cn(
                'clip-hud flex flex-col border bg-surface p-5 text-left transition-colors',
                live ? 'border-line-aqua hover:border-aqua' : 'cursor-default border-line opacity-70',
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center border clip-btn', live ? 'border-line-strong text-aqua' : 'border-line text-ink-muted')}>
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className={cn('font-mono text-[10px] uppercase tracking-widest', live ? 'text-lime' : 'text-ink-dim')}>
                  {live ? 'доступен' : 'скоро'}
                </span>
              </div>
              <span className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-dim">{tr.discipline}</span>
              <h3 className="mt-1 font-display text-lg text-ink">{tr.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{tr.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
