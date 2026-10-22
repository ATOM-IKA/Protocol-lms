import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { usePublishedCourses, useCourseMutations } from '@/features/courses/useCourses'
import { courseLessons } from '@/entities/course/lib'

export function TeachPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: allCourses = [], isLoading } = usePublishedCourses()
  const courses = allCourses.filter((c) => c.ownerId === user?.id)
  const { createCourse, updateCourse, deleteCourse } = useCourseMutations()
  const navigate = useNavigate()

  function onCreate(): void {
    if (!user) return
    createCourse.mutate(
      { ownerId: user.id, instructor: user.fullName, institutionId: user.institutionId },
      { onSuccess: (id) => navigate(`/app/teach/${id}`) },
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('teach.kicker')}</Label>
        <Label>{t('teach.courses_count', { count: courses.length })}</Label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl">{t('teach.title')}<span className="text-aqua">.</span></h1>
        <Button size="sm" onClick={onCreate} disabled={createCourse.isPending}>
          <Plus size={16} /> {t('teach.create')}
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-10 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
      ) : courses.length === 0 ? (
        <div className="mt-10 border border-line bg-surface p-10 text-center text-ink-muted">{t('teach.empty')}</div>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {courses.map((c) => {
            const lessons = courseLessons(c).length
            const published = c.status === 'published'
            return (
              <li key={c.id} className="clip-hud flex flex-col gap-4 border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="truncate font-display text-lg text-ink">{c.title}</h3>
                    <span className={'shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase ' + (published ? 'border-line-lime text-lime' : 'border-line-strong text-ink-muted')}>
                      {published ? t('teach.published') : t('teach.draft')}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-ink-dim">
                    {c.category} · {t('teach.meta', { sections: c.sections.length, lessons })}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to={`/app/teach/${c.id}`}>
                    <Button size="sm" variant="secondary"><Pencil size={15} /> {t('teach.edit')}</Button>
                  </Link>
                  <button
                    onClick={() => updateCourse.mutate({ id: c.id, patch: { status: published ? 'draft' : 'published' } })}
                    aria-label={published ? t('teach.unpublish') : t('teach.publish')}
                    className="border border-line-strong p-2 text-ink-muted transition-colors hover:text-aqua clip-btn"
                  >
                    {published ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => deleteCourse.mutate(c.id)}
                    aria-label={t('teach.delete')}
                    className="border border-line-strong p-2 text-ink-muted transition-colors hover:text-danger clip-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
