import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Eye, Save } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useCourse, useCourseMutations } from '@/features/courses/useCourses'
import { BlockEditItem } from '@/features/lesson/BlockEditItem'
import { newBlock, parseContent, serializeContent, templateFor, type BlockType, type LessonBlock } from '@/entities/lesson/content'
import type { Lesson } from '@/entities/course/types'

const ADD: { type: BlockType; label: string }[] = [
  { type: 'heading', label: 'Заголовок' },
  { type: 'text', label: 'Текст' },
  { type: 'image', label: 'Изображение' },
  { type: 'callout', label: 'Заметка' },
  { type: 'divider', label: 'Разделитель' },
  { type: 'trainer', label: 'Тренажёр' },
]

function findLesson(course: ReturnType<typeof useCourse>['data'], lessonId: string): Lesson | undefined {
  return course?.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId)
}

export function LessonEditorPage() {
  const { courseId = '', lessonId = '' } = useParams()
  const { data: course, isLoading } = useCourse(courseId)
  const { updateLesson } = useCourseMutations()
  const lesson = findLesson(course, lessonId)

  const [blocks, setBlocks] = useState<LessonBlock[]>([])
  const [dirty, setDirty] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (lesson && !seeded) {
      const parsed = parseContent(lesson.content)
      setBlocks(parsed.length ? parsed : templateFor(lesson.type))
      setSeeded(true)
    }
  }, [lesson, seeded])

  if (isLoading) return <div className="mx-auto max-w-4xl px-6 py-20 text-center font-mono text-sm text-ink-muted">Загрузка…</div>
  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl">Урок не найден</h1>
        <Link to={`/app/teach/${courseId}`} className="mt-4 inline-block font-mono text-sm text-aqua">← к курсу</Link>
      </div>
    )
  }

  function change(i: number, patch: Partial<LessonBlock>): void {
    setBlocks((b) => b.map((x, idx) => (idx === i ? ({ ...x, ...patch } as LessonBlock) : x)))
    setDirty(true)
  }
  function move(i: number, dir: -1 | 1): void {
    setBlocks((b) => {
      const j = i + dir
      if (j < 0 || j >= b.length) return b
      const next = [...b]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
    setDirty(true)
  }
  function remove(i: number): void {
    setBlocks((b) => b.filter((_, idx) => idx !== i))
    setDirty(true)
  }
  function addBlock(type: BlockType): void {
    setBlocks((b) => [...b, newBlock(type)])
    setDirty(true)
  }
  function save(): void {
    updateLesson.mutate({ id: lesson!.id, patch: { content: serializeContent(blocks) } }, { onSuccess: () => setDirty(false) })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Link to={`/app/teach/${courseId}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
          <ArrowLeft size={14} /> к курсу
        </Link>
        <div className="flex items-center gap-3">
          <Link to={`/app/courses/${courseId}/lessons/${lessonId}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-aqua">
            <Eye size={14} /> предпросмотр
          </Link>
          <Button size="sm" onClick={save} disabled={updateLesson.isPending || !dirty}>
            <Save size={15} /> {dirty ? 'Сохранить' : 'Сохранено'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Label accent>// урок · {lesson.title}</Label>
        <h1 className="mt-2 text-3xl sm:text-4xl">Контент урока<span className="text-aqua">.</span></h1>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {ADD.map((a) => (
          <button key={a.type} onClick={() => addBlock(a.type)}
            className="inline-flex items-center gap-1.5 border border-line-strong px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-aqua hover:text-aqua clip-btn">
            <Plus size={13} /> {a.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {blocks.length === 0 && (
          <div className="border border-line bg-surface p-8 text-center text-ink-muted">Добавьте первый блок.</div>
        )}
        {blocks.map((b, i) => (
          <BlockEditItem key={b.id} block={b} onChange={(p) => change(i, p)} onMove={(d) => move(i, d)} onRemove={() => remove(i)} />
        ))}
      </div>
    </div>
  )
}
