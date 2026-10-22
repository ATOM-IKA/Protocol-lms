import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { EXERCISES } from '@/features/playground/exercises'
import type { CalloutTone, LessonBlock } from '@/entities/lesson/content'

const fieldCls = 'w-full border border-line-strong bg-surface-2 px-2 py-1.5 text-sm text-ink focus:border-aqua focus:outline-none'

const TYPE_LABEL: Record<LessonBlock['type'], string> = {
  heading: 'Заголовок',
  text: 'Текст',
  image: 'Изображение',
  callout: 'Заметка',
  divider: 'Разделитель',
  trainer: 'Тренажёр',
}

interface Props {
  block: LessonBlock
  onChange: (patch: Partial<LessonBlock>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}

export function BlockEditItem({ block, onChange, onMove, onRemove }: Props) {
  return (
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">{TYPE_LABEL[block.type]}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} aria-label="Выше" className="p-1 text-ink-muted hover:text-aqua"><ChevronUp size={15} /></button>
          <button onClick={() => onMove(1)} aria-label="Ниже" className="p-1 text-ink-muted hover:text-aqua"><ChevronDown size={15} /></button>
          <button onClick={onRemove} aria-label="Удалить блок" className="p-1 text-ink-muted hover:text-danger"><Trash2 size={15} /></button>
        </div>
      </div>
      <div className="p-3">
        {block.type === 'heading' && (
          <input className={fieldCls} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
        )}
        {block.type === 'text' && (
          <textarea className={fieldCls} rows={3} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
        )}
        {block.type === 'image' && (
          <div className="flex flex-col gap-2">
            <input className={fieldCls} placeholder="URL изображения (https://…)" value={block.url} onChange={(e) => onChange({ url: e.target.value })} />
            <input className={fieldCls} placeholder="Подпись (необязательно)" value={block.caption ?? ''} onChange={(e) => onChange({ caption: e.target.value })} />
          </div>
        )}
        {block.type === 'callout' && (
          <div className="flex flex-col gap-2">
            <select className={fieldCls} value={block.tone} onChange={(e) => onChange({ tone: e.target.value as CalloutTone })}>
              <option value="info">Инфо</option>
              <option value="tip">Совет</option>
              <option value="warn">Внимание</option>
            </select>
            <input className={fieldCls} value={block.text} onChange={(e) => onChange({ text: e.target.value })} />
          </div>
        )}
        {block.type === 'divider' && <div className="text-center font-mono text-xs text-ink-dim">— разделитель —</div>}
        {block.type === 'trainer' && (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase text-ink-muted">задание тренажёра</span>
            <select className={fieldCls} value={block.exerciseId} onChange={(e) => onChange({ exerciseId: e.target.value })}>
              {EXERCISES.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
