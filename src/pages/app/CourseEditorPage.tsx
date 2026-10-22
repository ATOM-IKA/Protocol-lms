import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2, FileText, ClipboardCheck, Eye, EyeOff, Paperclip } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { GenerativeAvatar } from '@/features/profile/GenerativeAvatar'
import { useCourse, useCourseMutations } from '@/features/courses/useCourses'
import { useCourseEnrollments } from '@/features/enrollment/useEnrollment'
import type { CourseAccent, CourseStatus, LessonType } from '@/entities/course/types'
import { useConfirm } from '@/shared/ui/Confirm'

const LESSON_TYPES: LessonType[] = ['lecture', 'practice']
const ACCENTS: CourseAccent[] = ['aqua', 'lime', 'teal']
const CATEGORIES = ['Разработка', 'Программирование', 'Дизайн', 'Аналитика', 'Языки']

const fieldCls =
  'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-aqua focus:outline-none'

export function CourseEditorPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: course, isLoading } = useCourse(id)
  const m = useCourseMutations()
  const { data: students = [] } = useCourseEnrollments(id, true)
  const confirm = useConfirm()

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl">{t('editor.not_found')}</h1>
        <Link to="/app/teach" className="mt-4 inline-block font-mono text-sm text-aqua">{t('editor.to_my')}</Link>
      </div>
    )
  }
  const c = course

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Link to="/app/teach" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
          <ArrowLeft size={14} />{' '}{t('editor.back')}
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={`/app/teach/${c.id}/submissions`}
            className="inline-flex items-center gap-2 border border-line-strong px-3 py-1.5 font-mono text-xs uppercase text-ink-muted transition-colors hover:border-aqua hover:text-aqua clip-btn"
          >
            <ClipboardCheck size={14} /> {t('review.open_review')}
          </Link>
          <button
            onClick={() => m.updateCourse.mutate({ id: c.id, patch: { status: (c.status === 'published' ? 'draft' : 'published') as CourseStatus } })}
            className={'border px-3 py-1.5 font-mono text-xs uppercase transition-colors clip-btn ' + (c.status === 'published' ? 'border-line-lime text-lime' : 'border-line-strong text-ink-muted hover:text-aqua')}
          >
            {c.status === 'published' ? t('editor.status_published') : t('editor.status_draft')}
          </button>
        </div>
      </div>

      <h1 className="mt-4 text-3xl sm:text-4xl">{t('editor.title')}<span className="text-aqua">.</span></h1>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
      <div className="grid gap-5 border border-line bg-surface p-6 sm:grid-cols-2">
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Label>{t('editor.field_title')}</Label>
          <input className={fieldCls} defaultValue={c.title} onBlur={(e) => m.updateCourse.mutate({ id: c.id, patch: { title: e.target.value } })} />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-2">
          <Label>{t('editor.field_subtitle')}</Label>
          <input className={fieldCls} defaultValue={c.subtitle} onBlur={(e) => m.updateCourse.mutate({ id: c.id, patch: { subtitle: e.target.value } })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('editor.field_category')}</Label>
          <select className={fieldCls} defaultValue={c.category} onChange={(e) => m.updateCourse.mutate({ id: c.id, patch: { category: e.target.value } })}>
            {CATEGORIES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('editor.field_accent')}</Label>
          <select className={fieldCls} defaultValue={c.accent} onChange={(e) => m.updateCourse.mutate({ id: c.id, patch: { accent: e.target.value as CourseAccent } })}>
            {ACCENTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('editor.field_hours')}</Label>
          <input type="number" min={0} className={fieldCls} defaultValue={c.totalHours} onBlur={(e) => m.updateCourse.mutate({ id: c.id, patch: { totalHours: Number(e.target.value) } })} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('editor.field_instructor')}</Label>
          <input className={fieldCls} defaultValue={c.instructor} onBlur={(e) => m.updateCourse.mutate({ id: c.id, patch: { instructor: e.target.value } })} />
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-2xl">{t('editor.structure')}</h2>
        <button
          onClick={() => m.addSection.mutate({ courseId: c.id, order: c.sections.length })}
          className="flex items-center gap-2 border border-line-strong px-3 py-2 text-sm text-ink transition-colors hover:border-aqua clip-btn"
        >
          <Plus size={15} /> {t('editor.section')}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {c.sections.length === 0 && (
          <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('editor.no_sections')}</div>
        )}
        {c.sections.map((sec, si) => (
          <div key={sec.id} className="border border-line bg-surface">
            <div className="flex items-center gap-3 border-b border-line p-4">
              <span className="font-mono text-xs text-ink-dim">{String(si + 1).padStart(2, '0')}</span>
              <input
                className="h-9 flex-1 border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-aqua focus:outline-none"
                defaultValue={sec.title}
                onBlur={(e) => m.updateSection.mutate({ id: sec.id, title: e.target.value })}
              />
              <button onClick={async () => { const ok = await confirm({ title: t('common.delete'), message: `${sec.title} — удалить раздел? Все уроки внутри будут отвязаны.`, confirmLabel: t('common.delete'), danger: true }); if (ok) m.deleteSection.mutate(sec.id) }} aria-label={t('editor.del_section')} className="p-2 text-ink-muted transition-colors hover:text-danger">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex flex-col divide-y divide-line">
              {sec.lessons.map((l) => (
                <div key={l.id} className="flex flex-wrap items-center gap-2 p-3">
                  <input
                    className="h-9 min-w-40 flex-1 border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-aqua focus:outline-none"
                    defaultValue={l.title}
                    onBlur={(e) => m.updateLesson.mutate({ id: l.id, patch: { title: e.target.value } })}
                  />
                  <select
                    className="h-9 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
                    defaultValue={l.type}
                    onChange={(e) => m.updateLesson.mutate({ id: l.id, patch: { type: e.target.value as LessonType } })}
                  >
                    {LESSON_TYPES.map((lt) => <option key={lt} value={lt}>{t('course.type_' + lt)}</option>)}
                  </select>
                  <input
                    type="number" min={0} step={0.5} aria-label={t('editor.field_hours')}
                    className="h-9 w-16 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
                    defaultValue={l.durationHours}
                    onBlur={(e) => m.updateLesson.mutate({ id: l.id, patch: { durationHours: Number(e.target.value) } })}
                  />
                  <input
                    type="number" min={0} aria-label="XP"
                    className="h-9 w-16 border border-line-strong bg-surface-2 px-2 text-xs text-lime focus:border-aqua focus:outline-none"
                    defaultValue={l.xp}
                    onBlur={(e) => m.updateLesson.mutate({ id: l.id, patch: { xp: Number(e.target.value) } })}
                  />
                  <button
                    onClick={() => m.updateLesson.mutate({ id: l.id, patch: { submission: !l.submission } })}
                    title={l.submission ? t('editor.submission_on') : t('editor.submission_off')}
                    className={`p-2 transition-colors ${l.submission ? 'text-lime hover:text-lime/70' : 'text-ink-dim hover:text-aqua'}`}
                  >
                    <Paperclip size={15} />
                  </button>
                  <button
                    onClick={() => m.updateLesson.mutate({ id: l.id, patch: { open: !l.open } })}
                    title={l.open ? t('editor.close_lesson') : t('editor.open_lesson')}
                    className={`p-2 transition-colors ${l.open ? 'text-lime hover:text-lime/70' : 'text-ink-dim hover:text-aqua'}`}
                  >
                    {l.open ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <Link to={`/app/teach/${c.id}/lessons/${l.id}`} aria-label="Контент урока" className="p-2 text-ink-muted transition-colors hover:text-aqua">
                    <FileText size={15} />
                  </Link>
                  <button onClick={async () => { const ok = await confirm({ title: t('common.delete'), message: `${l.title} — удалить урок?`, confirmLabel: t('common.delete'), danger: true }); if (ok) m.deleteLesson.mutate(l.id) }} aria-label={t('editor.del_lesson')} className="p-2 text-ink-muted transition-colors hover:text-danger">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => m.addLesson.mutate({ courseId: c.id, sectionId: sec.id, order: sec.lessons.length })}
                className="flex items-center gap-2 p-3 text-left font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua"
              >
                <Plus size={14} /> {t('editor.add_lesson')}
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>

      <aside className="lg:sticky lg:top-20">
        <div className="border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line p-4">
            <h2 className="font-display text-lg">{t('teach.students')}</h2>
            <Label>{students.length}</Label>
          </div>
          {students.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-muted">{t('teach.no_students')}</div>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {students.map((st) => (
                <li key={st.id} className="flex items-center gap-3 p-4">
                  <GenerativeAvatar seed={st.studentId} rank="F" size={38} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{st.studentCallsign || st.studentName || st.studentId}</span>
                    {st.studentName && st.studentCallsign && <span className="block truncate font-mono text-[11px] text-ink-dim">{st.studentName}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-lime">{st.progressPercent}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      </div>
    </div>
  )
}
