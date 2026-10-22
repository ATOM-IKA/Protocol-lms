import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { CourseCard } from '@/features/courses/CourseCard'
import { useAuthStore } from '@/features/auth/authStore'
import { useXp } from '@/features/progress/useXp'
import { usePublishedCourses } from '@/features/courses/useCourses'
import { useMyEnrollments } from '@/features/enrollment/useEnrollment'
import { useMyLessonMarks } from '@/features/submission/useSubmissions'
import { courseProgress } from '@/features/progress/passed'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'
import type { LessonMarks } from '@/entities/submission/service'
import type { Course } from '@/entities/course/types'

function ContinueCard({ courses, marks }: { courses: Course[]; marks: LessonMarks }) {
  const { t } = useTranslation()
  const { course, progress } = useMemo(() => {
    if (courses.length === 0) return { course: null, progress: 0 }
    const withP = courses.map((c) => ({ c, p: courseProgress(c, marks) }))
    const inProgress = withP.find((x) => x.p > 0 && x.p < 100)
    const pick = inProgress ?? withP[0]
    return { course: pick.c, progress: pick.p }
  }, [courses, marks])

  if (!course) {
    return (
      <div className="clip-hud border border-line bg-surface p-6 text-ink-muted">{t('dashboard.empty')}</div>
    )
  }

  return (
    <Link
      to={`/app/courses/${course.id}`}
      className="clip-hud flex flex-col-reverse items-start justify-between gap-5 border border-line-aqua bg-surface p-6 transition-colors hover:border-aqua sm:flex-row sm:items-center"
    >
      <div>
        <Label accent>{t('dashboard.continue')}</Label>
        <h3 className="mt-2 font-display text-2xl text-ink">{course.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{course.subtitle}</p>
        <span className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-aqua">
          {t('dashboard.continue_btn')} <ArrowRight size={15} />
        </span>
      </div>
      <ProgressRing value={progress} size={72} />
    </Link>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <div className="font-mono text-3xl font-bold text-lime">{value}</div>
      <div className="mt-1 text-sm text-ink-muted">{label}</div>
    </div>
  )
}

export function DashboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === 'student'
  const xp = useXp()
  const { data: allCourses = [] } = usePublishedCourses()
  const { data: myEnrollments = [] } = useMyEnrollments(user?.id ?? '', !!isStudent)
  const { data: marks = {} } = useMyLessonMarks(user?.id ?? '', !!isStudent)
  const published = allCourses.filter((c) => c.status === 'published')
  // студент видит только курсы, на которые записан; преподаватель/админ — все опубликованные
  const enrolledIds = new Set(myEnrollments.map((e) => e.courseId))
  const courses = isStudent ? published.filter((c) => enrolledIds.has(c.id)) : published

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('dashboard.kicker')}</Label>
        <Label>{user?.institutionShort}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">
        {t('dashboard.hello')}, {user?.callsign}<span className="text-aqua">.</span>
      </h1>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-8 grid gap-5 lg:grid-cols-3">
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <ContinueCard courses={courses} marks={marks} />
        </motion.div>
        <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <Stat value={String(xp.completedCount)} label={t('dashboard.stat_lessons')} />
          <Stat value={`${xp.xp.toLocaleString('ru-RU')}`} label={t('dashboard.stat_xp')} />
        </motion.div>
      </motion.div>

      <div className="mt-14 flex items-center justify-between">
        <h2 className="text-2xl">{t('dashboard.my_courses')}</h2>
        <Link to="/app/courses" className="font-mono text-sm text-aqua hover:text-aqua-bright">
          {t('dashboard.all_catalog')}
        </Link>
      </div>
      {courses.length === 0 ? (
        <div className="mt-6 clip-hud border border-line bg-surface p-8 text-center text-ink-muted">
          {t('dashboard.no_enrolled')}{' '}
          <Link to="/app/courses" className="text-aqua hover:underline">{t('dashboard.to_catalog')}</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
