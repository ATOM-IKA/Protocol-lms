import { PlaygroundRunner } from '@/features/playground/PlaygroundRunner'
import { EXERCISES } from '@/features/playground/exercises'

export function TrainerEmbed({ exerciseId }: { exerciseId: string }) {
  const ex = EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0]
  return (
    <div className="border border-line-aqua bg-surface/40 p-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-lime">тренажёр</span>
        <span className="font-mono text-[10px] uppercase text-ink-dim">{ex.title}</span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{ex.task}</p>
      <div className="mt-4">
        <PlaygroundRunner exercise={ex} />
      </div>
    </div>
  )
}
