import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NotebookPen, Download, GraduationCap, CalendarCheck } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { usePublishedCourses, useCourse } from '@/features/courses/useCourses'
import { useCourseEnrollments } from '@/features/enrollment/useEnrollment'
import { useCourseSubmissions } from '@/features/submission/useSubmissions'
import { useCourseAttendance, useSetAttendance } from '@/features/attendance/useAttendance'
import { courseLessons } from '@/entities/course/lib'
import { gradeTone } from '@/shared/lib/grade'
import { buildStyledXls, downloadXls } from '@/shared/lib/xlsExport'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/shared/ui/toast'
import type { Lesson } from '@/entities/course/types'
import type { AttendanceStatus } from '@/entities/attendance/service'

const field = 'h-11 w-full max-w-md border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-aqua focus:outline-none'

type Mode = 'grades' | 'attendance'

// цикл отметок посещаемости по клику
const CYCLE: (AttendanceStatus | null)[] = [null, 'present', 'absent', 'late', 'excused']
const ATT_LABEL: Record<AttendanceStatus, string> = { present: 'П', absent: 'Н', late: 'О', excused: 'У' }
const ATT_TONE: Record<AttendanceStatus, string> = {
  present: 'border-line-lime text-lime',
  absent: 'border-danger text-danger',
  late: 'border-amber-500/50 text-amber-300',
  excused: 'border-line-aqua text-aqua',
}

export function JournalPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isStaffAll = user?.role === 'admin' || user?.role === 'superadmin'

  const { data: allCourses = [] } = usePublishedCourses()
  const courses = useMemo(
    () => (isStaffAll ? allCourses : allCourses.filter((c) => c.ownerId === user?.id)),
    [allCourses, isStaffAll, user?.id],
  )

  const [courseId, setCourseId] = useState('')
  const [mode, setMode] = useState<Mode>('grades')
  useEffect(() => {
    if (!courseId && courses.length) setCourseId(courses[0].id)
  }, [courses, courseId])

  const { data: course } = useCourse(courseId)
  const { data: enrollments = [] } = useCourseEnrollments(courseId, !!courseId)
  const { data: submissions = [] } = useCourseSubmissions(courseId, !!courseId)
  const { data: attendance = [] } = useCourseAttendance(courseId, !!courseId)
  const setAtt = useSetAttendance(courseId)
  const toast = useToast()
  const [busyCell, setBusyCell] = useState<string | null>(null)   // блокировка только той клетки, по которой кликнули
  const [flashCell, setFlashCell] = useState<string | null>(null)  // вспышка фона = «запись принята»

  const allLessons: Lesson[] = useMemo(() => (course ? courseLessons(course) : []), [course])
  const gradeLessons: Lesson[] = useMemo(
    () => allLessons.filter((l) => l.submission || l.type === 'practice' || l.type === 'assignment' || l.type === 'quiz'),
    [allLessons],
  )
  const lessons = mode === 'grades' ? gradeLessons : allLessons

  const gradeMap = useMemo(() => {
    const m = new Map<string, Record<string, number>>()
    for (const s of submissions) {
      if (s.grade > 0) {
        const r = m.get(s.studentId) ?? {}
        r[s.lessonId] = s.grade
        m.set(s.studentId, r)
      }
    }
    return m
  }, [submissions])

  const attMap = useMemo(() => {
    const m = new Map<string, Record<string, AttendanceStatus>>()
    for (const a of attendance) {
      const r = m.get(a.studentId) ?? {}
      r[a.lessonId] = a.status
      m.set(a.studentId, r)
    }
    return m
  }, [attendance])

  const students = useMemo(
    () => enrollments.map((e) => ({ id: e.studentId, name: e.studentName || e.studentCallsign || e.studentId })),
    [enrollments],
  )

  function avgGrade(studentId: string): number {
    const vals = Object.values(gradeMap.get(studentId) ?? {})
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  function attPercent(studentId: string): number {
    const r = attMap.get(studentId) ?? {}
    const marks = Object.values(r)
    if (!marks.length) return -1
    const attended = marks.filter((s) => s !== 'absent').length
    return Math.round((attended / marks.length) * 100)
  }

  function cycle(lessonId: string, studentId: string) {
    const key = `${lessonId}:${studentId}`
    if (busyCell === key) return                 // двойной клик по той же клетке не шлёт гонку
    const cur = attMap.get(studentId)?.[lessonId] ?? null
    const idx = CYCLE.indexOf(cur)
    const next = CYCLE[(idx + 1) % CYCLE.length]
    setBusyCell(key)
    setAtt.mutate({ lessonId, studentId, status: next }, {
      onSuccess: () => { setFlashCell(key); setTimeout(() => setFlashCell((c) => (c === key ? null : c)), 500) },
      onSettled: () => setBusyCell((c) => (c === key ? null : c)),
    })
  }

  function exportXls() {
    const title = course?.title ?? 'Журнал'
    const cols =
      mode === 'grades'
        ? [
            { header: t('journal.student'), value: (r: { id: string; name: string }) => r.name, width: 220 },
            ...gradeLessons.map((l) => ({ header: l.title, value: (r: { id: string }) => (gradeMap.get(r.id)?.[l.id] ? String(gradeMap.get(r.id)![l.id]) : '—'), width: 90 })),
            { header: t('journal.avg'), value: (r: { id: string }) => { const a = avgGrade(r.id); return a > 0 ? a.toFixed(2) : '—' }, width: 90 },
          ]
        : [
            { header: t('journal.student'), value: (r: { id: string; name: string }) => r.name, width: 220 },
            ...allLessons.map((l) => ({ header: l.title, value: (r: { id: string }) => { const s = attMap.get(r.id)?.[l.id]; return s ? ATT_LABEL[s] : '—' }, width: 70 })),
            { header: t('journal.att_pct'), value: (r: { id: string }) => { const p = attPercent(r.id); return p < 0 ? '—' : p + '%' }, width: 90 },
          ]
    const xls = buildStyledXls(students, cols, { title: t('journal.title'), subtitle: `${title} · ${mode === 'grades' ? t('journal.tab_grades') : t('journal.tab_attendance')}` })
    downloadXls(xls, `protocol-journal-${(course?.title ?? 'course').replace(/\s+/g, '_')}-${mode}.xls`)
    toast.success('Ведомость выгружена', 'готово')
  }

  const tab = (m: Mode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={cn('flex items-center gap-2 border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors clip-btn', mode === m ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('journal.kicker')}</Label>
        <Label>{t('journal.badge')}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('journal.title')}<span className="text-aqua">.</span></h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t('journal.lead')}</p>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <Label>{t('journal.course')}</Label>
          <select className={field} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.length === 0 && <option value="">—</option>}
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <Button variant="secondary" onClick={exportXls} disabled={!students.length || !lessons.length}>
          <Download size={15} /> {t('journal.export')}
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tab('grades', <GraduationCap size={14} />, t('journal.tab_grades'))}
        {tab('attendance', <CalendarCheck size={14} />, t('journal.tab_attendance'))}
      </div>

      {courses.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 border border-line bg-surface p-10 text-center text-ink-muted">
          <NotebookPen size={22} className="text-ink-dim" /> {t('journal.no_courses')}
        </div>
      ) : students.length === 0 ? (
        <div className="mt-6 border border-line bg-surface p-8 text-center text-ink-muted">{t('journal.no_students')}</div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-widest text-ink-dim">
                <th className="sticky left-0 z-10 bg-surface px-4 py-3 font-normal">{t('journal.student')}</th>
                {lessons.map((l, i) => (
                  <th key={l.id} className="px-3 py-3 text-center font-normal" title={l.title}>{i + 1}</th>
                ))}
                <th className="px-3 py-3 text-center font-normal">{mode === 'grades' ? t('journal.avg') : t('journal.att_pct')}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} className="border-b border-line last:border-b-0">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-ink">{st.name}</td>
                  {lessons.map((l) => {
                    if (mode === 'grades') {
                      const g = gradeMap.get(st.id)?.[l.id]
                      return (
                        <td key={l.id} className="px-3 py-2.5 text-center">
                          {g ? <span className={`inline-flex h-6 min-w-[1.75rem] items-center justify-center border px-1 font-mono text-xs ${gradeTone(g)}`}>{g}</span> : <span className="text-ink-dim">·</span>}
                        </td>
                      )
                    }
                    const s = attMap.get(st.id)?.[l.id]
                    return (
                      <td key={l.id} className="px-1.5 py-2 text-center">
                        <button
                          onClick={() => cycle(l.id, st.id)}
                          disabled={busyCell === `${l.id}:${st.id}`}
                          className={cn('inline-flex h-7 w-7 items-center justify-center border font-mono text-xs transition-colors', s ? ATT_TONE[s] : 'border-line-strong text-ink-dim hover:border-aqua/50', flashCell === `${l.id}:${st.id}` && 'bg-lime/10')}
                          title={t('journal.att_click')}
                        >
                          {s ? ATT_LABEL[s] : '·'}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-3 py-2.5 text-center">
                    {mode === 'grades' ? (
                      avgGrade(st.id) > 0 ? <span className={`inline-flex h-6 min-w-[2.5rem] items-center justify-center border px-1 font-mono text-xs ${gradeTone(Math.round(avgGrade(st.id)))}`}>{avgGrade(st.id).toFixed(2)}</span> : <span className="text-ink-dim">—</span>
                    ) : (
                      attPercent(st.id) < 0 ? <span className="text-ink-dim">—</span> : <span className="font-mono text-xs text-ink-soft">{attPercent(st.id)}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-dim">
        {mode === 'attendance' && (
          <span className="flex flex-wrap gap-x-3">
            <span className="text-lime">П — {t('journal.att_present')}</span>
            <span className="text-danger">Н — {t('journal.att_absent')}</span>
            <span className="text-amber-300">О — {t('journal.att_late')}</span>
            <span className="text-aqua">У — {t('journal.att_excused')}</span>
          </span>
        )}
        {lessons.length > 0 && (
          <span className="flex flex-wrap gap-x-4">
            <span>{t('journal.legend')}:</span>
            {lessons.map((l, i) => <span key={l.id}>{i + 1} — {l.title}</span>)}
          </span>
        )}
      </div>
    </div>
  )
}
