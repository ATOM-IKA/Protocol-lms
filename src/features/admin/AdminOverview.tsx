import { useTranslation } from 'react-i18next'
import { Users, GraduationCap, Shield, School, BookOpen, ClipboardList, FileCheck, UserCog } from 'lucide-react'
import { useAdminStats } from './useAdmin'
import type { AdminStats } from '@/entities/admin/service'

export function AdminOverview({ scope }: { scope?: string }) {
  const { t } = useTranslation()
  const { data, isLoading } = useAdminStats(scope)

  const cards: { key: keyof AdminStats; label: string; icon: typeof Users; accent: string }[] = [
    { key: 'users', label: t('admin.st_users'), icon: Users, accent: 'text-aqua' },
    { key: 'students', label: t('admin.st_students'), icon: GraduationCap, accent: 'text-lime' },
    { key: 'teachers', label: t('admin.st_teachers'), icon: UserCog, accent: 'text-aqua' },
    { key: 'admins', label: t('admin.st_admins'), icon: Shield, accent: 'text-lime' },
    { key: 'institutions', label: t('admin.st_institutions'), icon: School, accent: 'text-aqua' },
    { key: 'courses', label: t('admin.st_courses'), icon: BookOpen, accent: 'text-lime' },
    { key: 'enrollments', label: t('admin.st_enrollments'), icon: ClipboardList, accent: 'text-aqua' },
    { key: 'submissions', label: t('admin.st_submissions'), icon: FileCheck, accent: 'text-lime' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.key} className="clip-hud border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center border border-line-strong clip-btn ${c.accent}`}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="font-display text-3xl text-ink">{isLoading || !data ? '—' : data[c.key]}</span>
            </div>
            <div className="mt-3 font-mono text-[11px] uppercase tracking-widest text-ink-dim">{c.label}</div>
          </div>
        )
      })}
    </div>
  )
}
