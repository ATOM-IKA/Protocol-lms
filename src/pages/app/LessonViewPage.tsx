import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Lock, Target, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/shared/ui/Label'
import { useCourse } from '@/features/courses/useCourses'
import { useAuthStore } from '@/features/auth/authStore'
import { SubmitWork } from '@/features/submission/SubmitWork'
import { BlockView } from '@/features/lesson/BlockView'
import { parseContent } from '@/entities/lesson/content'
import type { Lesson } from '@/entities/course/types'

function findLesson(course: ReturnType<typeof useCourse>['data'], lessonId: string): Lesson | undefined {
  return course?.sections.flatMap((s) => s.lessons).find((l) => l.id === lessonId)
}

/** Читаемая колонка для текста, выровнена по левому краю; тренажёр — на всю ширину. */
const READ = 'w-full max-w-3xl'

export function LessonViewPage() {
  const { t } = useTranslation()
  const { courseId = '', lessonId = '' } = useParams()
  const { data: course, isLoading } = useCourse(courseId)
  const lesson = findLesson(course, lessonId)
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === 'student'
  const isCheckpoint = lesson?.type === 'practice' || lesson?.type === 'assignment'

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-20 text-center font-mono text-sm text-ink-muted">Загрузка…</div>
  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl">Урок не найден</h1>
        <Link to={`/app/courses/${courseId}`} className="mt-4 inline-block font-mono text-sm text-aqua">← к курсу</Link>
      </div>
    )
  }
  // урок закрыт преподавателем — студенту доступ закрыт
  if (isStudent && !lesson.open) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center border border-line-strong text-ink-dim">
          <Lock size={22} />
        </span>
        <h1 className="mt-5 text-2xl">{t('course.locked')}</h1>
        <p className="mt-2 font-mono text-sm text-ink-muted">{t('course.locked_hint')}</p>
        <Link to={`/app/courses/${courseId}`} className="mt-5 inline-block font-mono text-sm text-aqua">← {t('course.back')}</Link>
      </div>
    )
  }

  const blocks = parseContent(lesson.content)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className={READ}>
        <Link to={`/app/courses/${courseId}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
          <ArrowLeft size={14} /> к курсу
        </Link>
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <Label accent>// {isCheckpoint ? t('course.checkpoint') : 'урок'}</Label>
            {isCheckpoint && (
              <span className="inline-flex items-center gap-1 border border-line-lime px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
                <Target size={11} /> {t('course.checkpoint')}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl">{lesson.title}</h1>
          <div className="mt-2 font-mono text-xs text-ink-muted">+{lesson.xp} XP · {lesson.durationHours} ч</div>
        </div>
      </div>

      <article className="mt-8 flex flex-col gap-4">
        {blocks.length === 0 ? (
          <div className={`${READ} border border-dashed border-line-strong p-8 text-center font-mono text-sm text-ink-dim`}>
            Материалы урока скоро появятся
          </div>
        ) : (
          blocks.map((b) =>
            b.type === 'trainer' ? (
              <BlockView key={b.id} block={b} />
            ) : (
              <div key={b.id} className={READ}>
                <BlockView block={b} />
              </div>
            ),
          )
        )}
      </article>

      {isStudent && user && (
        <div className={`${READ} mt-8`}>
          <SubmitWork courseId={courseId} lessonId={lessonId} studentId={user.id} />
        </div>
      )}

      {isStudent && (
        <div className={`${READ} mt-8 flex items-center gap-2 border-t border-line pt-6 font-mono text-xs text-ink-muted`}>
          <Info size={14} className="text-ink-dim" />
          {t('lesson.status_by_grade')}
        </div>
      )}
    </div>
  )
}
