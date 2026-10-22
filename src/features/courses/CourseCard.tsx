import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Code, Terminal, Palette, BookOpen, Clock } from 'lucide-react'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { Label } from '@/shared/ui/Label'
import { useAuthStore } from '@/features/auth/authStore'
import { useMyLessonMarks } from '@/features/submission/useSubmissions'
import { courseProgress } from '@/features/progress/passed'
import { courseLessons } from '@/entities/course/lib'
import type { Course } from '@/entities/course/types'

const ICONS = { code: Code, terminal: Terminal, palette: Palette } as const
const ACCENT_HEX = { aqua: '#9fe8ff', lime: '#beef8d', teal: '#3a745d' } as const

export function CourseCard({ course }: { course: Course }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isStudent = user?.role === 'student'
  const { data: marks = {} } = useMyLessonMarks(user?.id ?? '', !!isStudent)
  const lessonIds = courseLessons(course).map((l) => l.id)
  const progress = isStudent ? courseProgress(course, marks) : 0
  const Icon = ICONS[course.icon as keyof typeof ICONS] ?? BookOpen

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }}>
      <Link
        to={`/app/courses/${course.id}`}
        className="clip-hud group block h-full border border-line bg-surface p-5 transition-colors hover:border-aqua/50"
      >
        <div className="flex items-start justify-between">
          <span className="flex h-11 w-11 items-center justify-center border border-line-strong text-aqua clip-btn">
            <Icon size={20} strokeWidth={1.75} aria-hidden />
          </span>
          <ProgressRing value={progress} size={52} color={ACCENT_HEX[course.accent]} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Label>{course.category}</Label>
        </div>
        <h3 className="mt-1 font-display text-xl leading-tight text-ink group-hover:text-aqua">{course.title}</h3>
        <p className="mt-1 text-sm text-ink-muted">{course.subtitle}</p>

        <div className="mt-4 flex items-center gap-4 font-mono text-xs text-ink-dim">
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {course.totalHours} {t('common.hours_short')}
          </span>
          <span>{lessonIds.length} {t('courses.count')}</span>
        </div>
      </Link>
    </motion.div>
  )
}
