import { Info, Lightbulb, AlertTriangle } from 'lucide-react'
import { TrainerEmbed } from './TrainerEmbed'
import type { CalloutTone, LessonBlock } from '@/entities/lesson/content'

const CALLOUT: Record<CalloutTone, { border: string; icon: typeof Info; color: string }> = {
  info: { border: 'border-line-aqua', icon: Info, color: 'text-aqua' },
  tip: { border: 'border-line-lime', icon: Lightbulb, color: 'text-lime' },
  warn: { border: 'border-warning/50', icon: AlertTriangle, color: 'text-warning' },
}

export function BlockView({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="mt-6 text-2xl [overflow-wrap:anywhere]">{block.text}</h2>
    case 'text':
      return <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-ink-soft">{block.text}</p>
    case 'image':
      return block.url ? (
        <figure>
          <img src={block.url} alt={block.caption ?? ''} className="w-full border border-line" />
          {block.caption && <figcaption className="mt-1 text-center font-mono text-xs text-ink-muted">{block.caption}</figcaption>}
        </figure>
      ) : (
        <div className="flex h-40 items-center justify-center border border-dashed border-line-strong font-mono text-xs text-ink-dim">нет изображения</div>
      )
    case 'callout': {
      const c = CALLOUT[block.tone]
      const Icon = c.icon
      return (
        <div className={`flex items-start gap-3 border ${c.border} bg-surface p-4`}>
          <Icon size={18} className={`${c.color} mt-0.5 shrink-0`} />
          <p className="text-sm text-ink-soft">{block.text}</p>
        </div>
      )
    }
    case 'divider':
      return <hr className="border-line" />
    case 'trainer':
      return <TrainerEmbed exerciseId={block.exerciseId} />
  }
}
