import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Users, School, ScrollText, BookOpen, Users2, FlaskConical } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { AdminOverview } from '@/features/admin/AdminOverview'
import { AdminUsers } from '@/features/admin/AdminUsers'
import { AdminGroups } from '@/features/admin/AdminGroups'
import { AdminCourses } from '@/features/admin/AdminCourses'
import { AdminInstitutions } from '@/features/admin/AdminInstitutions'
import { AdminAudit } from '@/features/admin/AdminAudit'
import { AdminQA } from '@/features/admin/AdminQA'
import { useAuthStore } from '@/features/auth/authStore'
import { cn } from '@/shared/lib/cn'

type Tab = 'overview' | 'users' | 'groups' | 'courses' | 'institutions' | 'audit' | 'qa'

export function AdminPage() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('overview')
  const user = useAuthStore((s) => s.user)
  const isSuper = user?.role === 'superadmin'
  // админ колледжа видит только свой колледж; супер-админ — всё
  const scope = isSuper ? undefined : user?.institutionId

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: t('admin.tab_overview'), icon: LayoutGrid },
    { id: 'users', label: t('admin.tab_users'), icon: Users },
    { id: 'groups', label: t('admin.tab_groups'), icon: Users2 },
    { id: 'courses', label: t('admin.tab_courses'), icon: BookOpen },
    ...(isSuper ? [{ id: 'institutions' as Tab, label: t('admin.tab_institutions'), icon: School }] : []),
    ...(isSuper ? [{ id: 'audit' as Tab, label: t('admin.tab_audit'), icon: ScrollText }] : []),
    ...(isSuper ? [{ id: 'qa' as Tab, label: t('admin.tab_qa'), icon: FlaskConical }] : []),
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('admin.kicker')}</Label>
        <Label>{isSuper ? t('admin.scope_all') : user?.institutionShort}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('admin.title')}<span className="text-aqua">.</span></h1>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((tb) => {
          const Icon = tb.icon
          const active = tab === tb.id
          return (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={cn(
                'flex items-center gap-2 border px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors clip-btn',
                active ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink',
              )}
            >
              <Icon size={14} /> {tb.label}
            </button>
          )
        })}
      </div>

      <div className="mt-8">
        {tab === 'overview' && <AdminOverview scope={scope} />}
        {tab === 'users' && <AdminUsers scope={scope} isSuper={isSuper} />}
        {tab === 'groups' && <AdminGroups scope={scope} />}
        {tab === 'courses' && <AdminCourses scope={scope} />}
        {tab === 'institutions' && isSuper && <AdminInstitutions />}
        {tab === 'audit' && isSuper && <AdminAudit />}
        {tab === 'qa' && isSuper && <AdminQA />}
      </div>
    </div>
  )
}
