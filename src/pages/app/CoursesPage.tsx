import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/shared/ui/Label'
import { CourseCard } from '@/features/courses/CourseCard'
import { usePublishedCourses } from '@/features/courses/useCourses'
import { cn } from '@/shared/lib/cn'

export function CoursesPage() {
  const { t } = useTranslation()
  const { data: allCourses = [], isLoading, isError, error } = usePublishedCourses()
  const courses = allCourses.filter((c) => c.status === 'published')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string>('__all__')

  const categories = useMemo(() => ['__all__', ...Array.from(new Set(courses.map((c) => c.category)))], [courses])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter(
      (c) =>
        (cat === '__all__' || c.category === cat) &&
        (!q || (c.title + ' ' + c.subtitle).toLowerCase().includes(q)),
    )
  }, [query, cat, courses])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('courses.kicker')}</Label>
        <Label>{filtered.length} / {courses.length}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('courses.title')}<span className="text-aqua">.</span></h1>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 border border-line-strong bg-surface-2 px-3 clip-btn sm:w-72">
          <Search size={16} className="text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('courses.search')}
            className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'border px-3 py-1.5 font-mono text-xs transition-colors clip-btn',
                cat === c ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink',
              )}
            >
              {c === '__all__' ? t('common.all') : c}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-16 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
      ) : isError ? (
        <div className="mt-16 text-center font-mono text-sm text-danger">
          {t('common.error')} — {String((error as Error)?.message ?? error)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center font-mono text-sm text-ink-muted">{t('common.nothing_found')}</div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}
    </div>
  )
}
