import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RoleAvatar } from '@/features/profile/RoleAvatar'
import { useAuthStore } from '@/features/auth/authStore'
import { useXp } from '@/features/progress/useXp'
import { useProfileRank } from '@/features/progress/useRank'

export function XpHud() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const xp = useXp()
  const rankInfo = useProfileRank()
  if (!user) return null
  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const pct = xp.forNext > 0 ? Math.max(0, Math.min(100, Math.round((xp.inLevel / xp.forNext) * 100))) : 0

  return (
    <Link
      to="/app/profile"
      className="flex items-center gap-3 border border-line-strong bg-surface-2 px-2.5 py-1.5 transition-colors hover:border-aqua/50 clip-btn"
      aria-label="Профиль и опыт"
    >
      <RoleAvatar seed={user.id} rank={rankInfo.rank} role={user.role} size={30} />
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {isStudent && <span className="text-lime">LVL {xp.level}</span>}
          {isStudent && <span className="text-ink-dim">·</span>}
          <span className="text-aqua">RANK {rankInfo.rank}</span>
        </div>
        {isStudent ? (
          <div className="mt-1 h-1 w-24 overflow-hidden bg-surface">
            <div className="h-full bg-gradient-to-r from-aqua to-lime transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        ) : (
          <div className="mt-0.5 font-mono text-[10px] text-ink-dim">
            {isTeacher ? t('profile.students_advanced', { count: rankInfo.teacherStudents }) : t('auth.role_' + user.role)}
          </div>
        )}
      </div>
    </Link>
  )
}
