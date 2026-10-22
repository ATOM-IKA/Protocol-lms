import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, User, ArrowLeft, Check, Lock, Target, LogOut, PlayCircle } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { Accordion } from '@/shared/ui/Accordion'
import { useCourse } from '@/features/courses/useCourses'
import { courseLessons } from '@/entities/course/lib'
import { isPassed, courseProgress, resumeLessonId } from '@/features/progress/passed'
import { useAuthStore } from '@/features/auth/authStore'
import { useMyEnrollment, useEnroll, useUnenroll } from '@/features/enrollment/useEnrollment'
import { useMyCourseSubmissions } from '@/features/submission/useSubmissions'
import { useConfirm } from '@/shared/ui/Confirm'
import { gradeTone, average } from '@/shared/lib/grade'
import type { LessonMarks } from '@/entities/submission/service'
import type { Lesson } from '@/entities/course/types'

function isCheckpoint(l: Lesson) {
  return l.type === 'practice' || l.type === 'assignment'
}

function LessonRow({
  lesson,
  courseId,
  locked,
  passed,
  resume,
  grade,
}: {
  lesson: Lesson
  courseId: string
  locked: boolean
  passed: boolean
  resume: boolean
  grade?: number
}) {
  const { t } = useTranslation()

  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className={`truncate text-sm ${locked ? 'text-ink-muted' : passed ? 'text-ink-muted line-through' : 'text-ink transition-colors hover:text-aqua'}`}>{lesson.title}</span>
        {isCheckpoint(lesson) && (
          <span className="inline-flex shrink-0 items-center gap-1 border border-line-lime px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-lime">
            <Target size={10} /> {t('course.checkpoint')}
          </span>
        )}
        {resume && (
          <span className="inline-flex shrink-0 items-center gap-1 border border-line-aqua px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-aqua">
            <PlayCircle size={10} /> {t('course.resume')}
          </span>
        )}
      </div>
      <div className="mt-0.5 font-mono text-[11px] text-ink-dim">
        {t('course.type_' + lesson.type)} · {lesson.durationHours} {t('common.hours_short')} · +{lesson.xp} XP
      </div>
    </>
  )

  return (
    <div className={`flex items-center justify-between gap-4 border-b border-line px-5 py-3 last:border-b-0 ${resume ? 'bg-aqua/[0.04]' : ''}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center border ${passed ? 'border-lime text-lime' : 'border-line-strong text-transparent'}`}>
          <Check size={13} />
        </span>
        {locked ? <div className="min-w-0 opacity-70">{body}</div> : <Link to={`/app/courses/${courseId}/lessons/${lesson.id}`} className="min-w-0">{body}</Link>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {grade != null && grade > 0 && (
          <span className={`flex h-7 w-7 items-center justify-center border font-mono text-sm ${gradeTone(grade)}`} title={t('course.grade')}>
            {grade}
          </span>
        )}
        {locked && <Lock size={15} className="text-ink-dim" />}
      </div>
    </div>
  )
}

export function CoursePage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: course } = useCourse(id)
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === 'student'
  const { data: enrollment } = useMyEnrollment(id, user?.id ?? '', !!isStudent)
  const enroll = useEnroll()
  const unenroll = useUnenroll()
  const confirm = useConfirm()
  const enrolled = !isStudent || !!enrollment

  async function handleUnenroll() {
    if (!enrollment || !user) return
    const ok = await confirm({ title: t('course.unenroll'), message: t('course.unenroll_confirm'), confirmLabel: t('course.unenroll'), danger: true })
    if (ok) unenroll.mutate({ id: enrollment.id, courseId: id, studentId: user.id })
  }

  const { data: mySubs = [] } = useMyCourseSubmissions(id, user?.id ?? '', !!isStudent && enrolled)
  const marks: LessonMarks = {}
  const grades: Record<string, number> = {}
  const gradeValues: number[] = []
  for (const s of mySubs) if (s.status === 'graded') {
    marks[s.lessonId] = { grade: s.grade, retry: s.retry }
    grades[s.lessonId] = s.grade
    gradeValues.push(s.grade)
  }
  const avgGrade = average(gradeValues)

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl">{t('course.not_found')}</h1>
        <Link to="/app/courses" className="mt-4 inline-block font-mono text-sm text-aqua">{t('course.to_catalog')}</Link>
      </div>
    )
  }

  const lessonIds = courseLessons(course).map((l) => l.id)
  const progress = isStudent ? courseProgress(course, marks) : 0
  const resumeId = isStudent && enrolled ? resumeLessonId(course, marks) : null
  const lessonLocked = (l: Lesson) => (isStudent ? !enrolled || !l.open : false)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/app/courses" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
        <ArrowLeft size={14} />{' '}{t('course.back')}
      </Link>

      <div className="clip-hud mt-4 flex flex-col-reverse items-start justify-between gap-6 border border-line-aqua bg-surface p-6 sm:flex-row">
        <div>
          <Label accent>// {course.category}</Label>
          <h1 className="mt-2 text-3xl sm:text-4xl">{course.title}</h1>
          <p className="mt-2 text-ink-soft">{course.subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-ink-muted">
            <span className="flex items-center gap-1.5"><User size={13} /> {course.instructor}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} /> {course.totalHours} {t('common.hours_short')}</span>
            <span>{lessonIds.length} {t('course.lessons')}</span>
            {isStudent && avgGrade > 0 && (
              <span className="flex items-center gap-1.5">
                {t('course.avg_grade')}
                <span className={`inline-flex h-6 min-w-[2.75rem] items-center justify-center border px-1.5 text-sm ${gradeTone(Math.round(avgGrade))}`}>
                  {avgGrade.toFixed(2)}
                </span>
              </span>
            )}
          </div>
          {isStudent && enrolled && enrollment && (
            <button
              onClick={handleUnenroll}
              disabled={unenroll.isPending}
              className="mt-4 inline-flex items-center gap-1.5 border border-line-strong px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-danger hover:text-danger clip-btn"
            >
              <LogOut size={13} /> {t('course.unenroll')}
            </button>
          )}
        </div>
        {isStudent && <ProgressRing value={progress} size={84} />}
      </div>

      {isStudent && !enrolled && (
        <div className="clip-hud mt-6 border border-line-lime bg-surface p-6">
          <Label accent>{t('course.enroll_kicker')}</Label>
          <h3 className="mt-2 font-display text-xl text-ink">{t('course.enroll_title')}</h3>
          <p className="mt-1 max-w-lg text-sm text-ink-muted">{t('course.enroll_text')}</p>
          <Button className="mt-4" onClick={() => user && enroll.mutate({ courseId: id, studentId: user.id })} disabled={enroll.isPending}>
            {enroll.isPending ? t('course.enrolling') : t('course.enroll_btn')}
          </Button>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {course.sections.map((section) => {
          const done = section.lessons.filter((l) => isPassed(l, marks)).length
          return (
            <Accordion key={section.id} title={section.title} meta={`${done} / ${section.lessons.length}`} defaultOpen>
              {section.lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  courseId={course.id}
                  locked={lessonLocked(lesson)}
                  passed={isPassed(lesson, marks)}
                  resume={lesson.id === resumeId}
                  grade={grades[lesson.id]}
                />
              ))}
            </Accordion>
          )
        })}
      </div>
    </div>
  )
}
