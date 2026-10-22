import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Search, BookOpen } from 'lucide-react'
import { useAdminCourses, useCourseModeration } from './useAdmin'
import { useConfirm } from '@/shared/ui/Confirm'
import { cn } from '@/shared/lib/cn'

export function AdminCourses({ scope }: { scope?: string }) {
  const { t } = useTranslation()
  const { data: courses = [], isLoading } = useAdminCourses(scope)
  const mod = useCourseModeration()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return courses.filter((c) => !q || (c.title + ' ' + c.ownerName + ' ' + c.institutionShort).toLowerCase().includes(q))
  }, [courses, query])

  async function remove(id: string, title: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${title} — ${t('admin.c_delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) mod.remove.mutate(id)
  }

  return (
    <div>
      <div className="flex items-center gap-2 border border-line-strong bg-surface-2 px-3 clip-btn sm:w-80">
        <Search size={16} className="text-ink-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.c_search')} className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none" />
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('admin.c_none')}</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong text-aqua">
                <BookOpen size={16} />
              </span>
              <div className="min-w-40 flex-1">
                <div className="truncate text-sm text-ink">{c.title}</div>
                <div className="font-mono text-[11px] text-ink-dim">
                  {c.institutionShort} · {c.ownerName} · {c.sections} {t('common.sections')} · {c.lessons} {t('common.lessons')}
                </div>
              </div>
              <button
                onClick={() => mod.setStatus.mutate({ id: c.id, status: c.status === 'published' ? 'draft' : 'published' })}
                className={cn(
                  'border px-3 py-1.5 font-mono text-[11px] uppercase transition-colors clip-btn',
                  c.status === 'published' ? 'border-line-lime text-lime' : 'border-line-strong text-ink-muted hover:text-aqua',
                )}
              >
                {c.status === 'published' ? t('admin.c_published') : t('admin.c_draft')}
              </button>
              <button onClick={() => remove(c.id, c.title)} className="p-2 text-ink-muted transition-colors hover:text-danger" aria-label={t('common.delete')}>
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
