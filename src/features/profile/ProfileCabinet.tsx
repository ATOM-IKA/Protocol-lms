import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { ProfileIdCard } from './ProfileIdCard'
import { useAuthStore } from '@/features/auth/authStore'
import { logout } from '@/features/auth/authService'
import { useXp } from '@/features/progress/useXp'
import { useProfileRank } from '@/features/progress/useRank'
import { useMyGrades } from '@/features/submission/useSubmissions'
import { average } from '@/shared/lib/grade'
import type { ProfileCard } from '@/entities/profile/types'

const ROLE_LABEL: Record<string, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', superadmin: 'Супер-админ' }
function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Полный личный кабинет для портала: большая карточка + личные данные. */
export function ProfileCabinet() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const xp = useXp()
  const rankInfo = useProfileRank()
  const { data: grades = [] } = useMyGrades(user?.id ?? '', user?.role === 'student')
  if (!user) return null

  const card: ProfileCard = {
    id: user.id,
    callsign: user.callsign,
    fullName: user.fullName,
    institutionShort: user.institutionShort,
    institutionName: user.institutionName,
    role: user.role,
    level: xp.level,
    xp: xp.xp,
    xpForNext: xp.forNext,
    progressPct: xp.forNext > 0 ? Math.max(0, Math.min(100, Math.round((xp.inLevel / xp.forNext) * 100))) : 0,
    rank: rankInfo.rank,
    hours: rankInfo.hours,
    teacherStudents: rankInfo.teacherStudents,
    avgGrade: average(grades),
    coins: user.coins,
    groupCode: user.groupCode,
  }

  return (
    <div className="clip-hud mb-10 grid items-start gap-6 border border-line-aqua bg-surface p-5 sm:p-6 lg:grid-cols-[22rem_1fr]">
      <ProfileIdCard card={card} />

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <Label accent>{t('profile.personal')}</Label>
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 border border-line-strong px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-danger hover:text-danger clip-btn"
          >
            <LogOut size={13} /> {t('nav.logout')}
          </button>
        </div>
        <dl className="mt-4 flex flex-col divide-y divide-line">
          {[
            { k: t('profile.full_name'), v: user.fullName || '—' },
            { k: t('profile.login'), v: user.studentId || '—' },
            { k: 'Email', v: user.email || '—' },
            { k: t('profile.role'), v: ROLE_LABEL[user.role] ?? user.role },
            { k: t('profile.institution'), v: user.role === 'superadmin' ? 'Вся система' : (user.institutionName || user.institutionShort || '—') },
            ...(user.role === 'student' ? [{ k: t('profile.group'), v: user.groupCode || '—' }] : []),
            ...(user.role === 'student' ? [{ k: t('profile.curator'), v: user.curatorName || '—' }] : []),
            { k: t('profile.registered'), v: fmtDate(user.createdAt) },
          ].map((row) => (
            <div key={row.k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{row.k}</dt>
              <dd className="min-w-0 truncate text-right text-sm text-ink-soft">{row.v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-auto border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
          {t('profile.data_rights')}{' '}
          <Link to="/privacy" className="text-aqua hover:underline">{t('privacy.link')}</Link>.
        </p>
      </div>
    </div>
  )
}
