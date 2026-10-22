import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, Star, Users, BookOpen, Layers, Award, TrendingUp, CalendarCheck } from 'lucide-react'
import { restoreSession } from '@/features/auth/authService'
import { Label } from '@/shared/ui/Label'
import { Coin } from '@/features/currency/Coin'
import { ProfileMiniCard } from '@/features/profile/ProfileMiniCard'
import { RankShowcase } from '@/features/profile/RankShowcase'
import { useAuthStore } from '@/features/auth/authStore'
import { useXp } from '@/features/progress/useXp'
import { useProfileRank } from '@/features/progress/useRank'
import { useMyGrades } from '@/features/submission/useSubmissions'
import { useTeacherStats, useAdminScopeStats } from '@/features/profile/useProfileStats'
import { useMyAttendance } from '@/features/attendance/useAttendance'
import { average } from '@/shared/lib/grade'
import type { ReactNode } from 'react'

function StatBlock({ icon, label, value, accent }: { icon: ReactNode; label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className={`clip-hud flex items-center gap-3 border bg-surface p-4 ${accent ? 'border-line-lime' : 'border-line'}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center border ${accent ? 'border-line-lime text-lime' : 'border-line-strong text-aqua'}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate font-display text-2xl text-ink">{value}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</div>
      </div>
    </div>
  )
}

export function AppProfilePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const xp = useXp()
  const rankInfo = useProfileRank()
  const { data: grades = [] } = useMyGrades(user?.id ?? '', user?.role === 'student')
  const isTeacher = user?.role === 'teacher'
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const scope = user?.role === 'superadmin' ? undefined : user?.institutionId
  const { data: teacherStats } = useTeacherStats(user?.id, isTeacher)
  const { data: adminStats } = useAdminScopeStats(scope, isAdmin)
  const { data: myAttendance = [] } = useMyAttendance(user?.id, user?.role === 'student')

  // обновляем запись пользователя (монеты/группа/опыт меняются на сервере)
  useEffect(() => { void restoreSession() }, [])

  if (!user) return null

  const avg = average(grades)
  const attPct = myAttendance.length
    ? Math.round((myAttendance.filter((a) => a.status !== 'absent').length / myAttendance.length) * 100)
    : -1
  const progressPct = xp.forNext > 0 ? Math.max(0, Math.min(100, Math.round((xp.inLevel / xp.forNext) * 100))) : 0
  const coins = <span className="text-[#ffd24a]">{user.coins ?? 0}</span>

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('profile.kicker')}</Label>
        <Label>{t('profile.idcard')}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('profile.title')}<span className="text-aqua">.</span></h1>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <ProfileMiniCard
          id={user.id}
          callsign={user.callsign}
          role={user.role}
          rank={rankInfo.rank}
          institutionShort={user.role === 'superadmin' ? 'Вся система' : user.institutionShort}
          level={xp.level}
          xp={xp.xp}
          progressPct={progressPct}
          groupCode={user.groupCode}
        />

        {/* инфо-блоки по роли */}
        <div className="grid gap-3 sm:grid-cols-2">
          {user.role === 'student' && (
            <>
              <StatBlock icon={<Clock size={18} />} label={t('profile.stat_hours')} value={Math.round(rankInfo.hours ?? 0)} />
              <StatBlock icon={<Star size={18} />} label={t('profile.stat_gpa')} value={avg > 0 ? avg.toFixed(2) : '—'} />
              <StatBlock icon={<CalendarCheck size={18} />} label={t('profile.stat_attendance')} value={attPct < 0 ? '—' : attPct + '%'} />
              <StatBlock icon={<TrendingUp size={18} />} label={t('profile.stat_xp')} value={xp.xp.toLocaleString('ru-RU')} />
              <StatBlock icon={<Coin size={18} />} label={t('profile.coins')} value={coins} accent />
            </>
          )}
          {isTeacher && (
            <>
              <StatBlock icon={<Users size={18} />} label={t('profile.stat_students')} value={teacherStats?.students ?? '—'} />
              <StatBlock icon={<BookOpen size={18} />} label={t('profile.stat_courses')} value={teacherStats?.courses ?? '—'} />
              <StatBlock icon={<Clock size={18} />} label={t('profile.stat_course_hours')} value={teacherStats?.hours ?? '—'} />
              <StatBlock icon={<Coin size={18} />} label={t('profile.coins')} value={coins} accent />
            </>
          )}
          {isAdmin && (
            <>
              <StatBlock icon={<Users size={18} />} label={t('profile.stat_users')} value={adminStats?.users ?? '—'} />
              <StatBlock icon={<BookOpen size={18} />} label={t('profile.stat_courses')} value={adminStats?.courses ?? '—'} />
              <StatBlock icon={<Layers size={18} />} label={t('profile.stat_groups_scope')} value={adminStats?.students ?? '—'} />
              <StatBlock icon={<Coin size={18} />} label={t('profile.coins')} value={coins} accent />
            </>
          )}
        </div>
      </div>

      {/* полный кабинет — на портале */}
      <div className="clip-hud mt-6 flex flex-wrap items-center gap-2 border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
        <Award size={15} className="text-aqua" />
        {t('profile.cabinet_hint')}
      </div>

      <div className="mt-14">
        <div className="flex items-center justify-between">
          <Label accent>{t('profile.ranks_kicker')}</Label>
          <Label>F → SSS</Label>
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl">{t('profile.ranks_title')}<span className="text-aqua">.</span></h2>
        <p className="mt-2 max-w-lg text-ink-soft">{t('profile.ranks_subtitle')}</p>
        <div className="mt-8">
          <RankShowcase seed={user.id} current={rankInfo.rank} />
        </div>
      </div>
    </div>
  )
}
