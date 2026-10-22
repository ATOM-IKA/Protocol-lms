import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, BookOpen, Blocks, User, GraduationCap, Shield, ClipboardList, NotebookPen, FileQuestion, Trophy } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { FEATURES } from '@/shared/config/features'
import { cn } from '@/shared/lib/cn'

interface Item {
  to: string
  key: string
  icon: typeof BookOpen
  roles?: Array<'student' | 'teacher' | 'admin' | 'superadmin'>
  end?: boolean
}

const ITEMS: Item[] = [
  { to: '/app', key: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/courses', key: 'nav.courses', icon: BookOpen },
  { to: '/app/playground', key: 'nav.playground', icon: Blocks },
  { to: '/app/board', key: 'nav.board', icon: ClipboardList },
  { to: '/app/quizzes', key: 'nav.quizzes', icon: FileQuestion },
  { to: '/app/leaderboard', key: 'nav.leaderboard', icon: Trophy },
  { to: '/app/profile', key: 'nav.profile', icon: User },
  { to: '/app/teach', key: 'nav.teach', icon: GraduationCap, roles: ['teacher', 'admin', 'superadmin'] },
  { to: '/app/journal', key: 'nav.journal', icon: NotebookPen, roles: ['teacher', 'admin', 'superadmin'] },
  { to: '/app/admin', key: 'nav.admin', icon: Shield, roles: ['admin', 'superadmin'] },
]

export function Sidebar() {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.user?.role ?? 'student')
  const items = ITEMS.filter(
    (i) =>
      (!i.roles || i.roles.includes(role)) &&
      (i.key !== 'nav.playground' || FEATURES.trainers) &&
      (i.key !== 'nav.board' || FEATURES.gamification),
  )

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-3">
        <span className="label-mono px-3 py-2 text-[10px]">{t('nav.label')}</span>
        {items.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors',
                isActive ? 'bg-surface-2 text-aqua' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden />
            {t(key)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
