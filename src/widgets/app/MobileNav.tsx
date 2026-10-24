import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  { to: '/app/teach', key: 'nav.teach_short', icon: GraduationCap, roles: ['teacher', 'admin', 'superadmin'] },
  { to: '/app/journal', key: 'nav.journal', icon: NotebookPen, roles: ['teacher', 'admin', 'superadmin'] },
  { to: '/app/admin', key: 'nav.admin', icon: Shield, roles: ['admin', 'superadmin'] },
]

export function MobileNav() {
  const { t } = useTranslation()
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const role = useAuthStore((s) => s.user?.role ?? 'student')
  const items = ITEMS.filter(
    (i) =>
      (!i.roles || i.roles.includes(role)) &&
      (i.key !== 'nav.playground' || FEATURES.trainers) &&
      (i.key !== 'nav.board' || FEATURES.gamification),
  )

  // у преподавателя и админа пунктов до 10 — меню прокручивается, активный пункт всегда в поле зрения
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [pathname])

  return (
    <nav
      ref={navRef}
      className="no-scrollbar fixed inset-x-0 bottom-0 z-40 flex snap-x overflow-x-auto border-t border-line bg-bg/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label={t('nav.label')}
    >
      {items.map(({ to, key, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex min-w-[4.5rem] flex-1 shrink-0 snap-start flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-mono uppercase tracking-wide transition-colors',
              isActive ? 'text-aqua' : 'text-ink-muted',
            )
          }
        >
          <Icon size={20} strokeWidth={1.75} aria-hidden />
          <span className="max-w-full truncate">{t(key)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
