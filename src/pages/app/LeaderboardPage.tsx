import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Lock } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { useAuthStore } from '@/features/auth/authStore'
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard'
import { useXp } from '@/features/progress/useXp'
import { useProfileRank } from '@/features/progress/useRank'
import { useMyGrades } from '@/features/submission/useSubmissions'
import { useMyAttendance } from '@/features/attendance/useAttendance'
import { useMyAttempts } from '@/features/quiz/useQuiz'
import { average } from '@/shared/lib/grade'
import { ACHIEVEMENTS, type AchStats } from '@/features/progress/achievements'
import { cn } from '@/shared/lib/cn'

const MEDAL = ['text-amber-300', 'text-slate-300', 'text-orange-400']

function Achievements() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const xp = useXp()
  const rankInfo = useProfileRank()
  const { data: grades = [] } = useMyGrades(user?.id ?? '', true)
  const { data: attendance = [] } = useMyAttendance(user?.id, true)
  const { data: attempts = [] } = useMyAttempts(user?.id, true)

  const stats: AchStats = useMemo(() => {
    const attPct = attendance.length ? Math.round((attendance.filter((a) => a.status !== 'absent').length / attendance.length) * 100) : -1
    const passed = new Set(attempts.filter((a) => a.passed).map((a) => a.quizId)).size
    return {
      xp: xp.xp,
      level: xp.level,
      hours: rankInfo.hours ?? 0,
      coins: user?.coins ?? 0,
      avgGrade: average(grades),
      quizzesPassed: passed,
      attendancePct: attPct,
      rank: rankInfo.rank,
    }
  }, [xp, rankInfo, grades, attendance, attempts, user])

  const doneCount = ACHIEVEMENTS.filter((a) => a.done(stats)).length

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between">
        <Label accent>{t('leaderboard.ach_kicker')}</Label>
        <Label>{doneCount}/{ACHIEVEMENTS.length}</Label>
      </div>
      <h2 className="mt-3 text-2xl sm:text-3xl">{t('leaderboard.ach_title')}<span className="text-aqua">.</span></h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a) => {
          const done = a.done(stats)
          const Icon = a.icon
          return (
            <div key={a.id} className={cn('clip-hud flex items-center gap-3 border p-4 transition-colors', done ? 'border-line-lime bg-surface' : 'border-line bg-surface/50 opacity-60')}>
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center border', done ? 'border-line-lime text-lime' : 'border-line-strong text-ink-dim')}>
                {done ? <Icon size={20} /> : <Lock size={18} />}
              </span>
              <div className="min-w-0">
                <div className={cn('text-sm', done ? 'text-ink' : 'text-ink-muted')}>{t('ach.' + a.id + '_title')}</div>
                <div className="font-mono text-[11px] text-ink-dim">{t('ach.' + a.id + '_desc')}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const scope = user?.role === 'superadmin' ? undefined : user?.institutionId
  const { data: rows = [], isLoading } = useLeaderboard(scope)
  const isStudent = user?.role === 'student'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('leaderboard.kicker')}</Label>
        <Label>TOP</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('leaderboard.title')}<span className="text-aqua">.</span></h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{t('leaderboard.lead')}</p>

      {isLoading ? (
        <div className="mt-8 p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
      ) : rows.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 border border-line bg-surface p-10 text-center text-ink-muted">
          <Trophy size={22} className="text-ink-dim" /> {t('leaderboard.empty')}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-widest text-ink-dim">
                <th className="px-4 py-3 font-normal">#</th>
                <th className="px-4 py-3 font-normal">{t('leaderboard.student')}</th>
                <th className="px-4 py-3 font-normal">{t('leaderboard.group')}</th>
                <th className="px-4 py-3 text-center font-normal">{t('leaderboard.level')}</th>
                <th className="px-4 py-3 text-right font-normal">XP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const me = r.userId === user?.id
                return (
                  <tr key={r.id} className={cn('border-b border-line last:border-b-0', me && 'bg-aqua/5')}>
                    <td className="px-4 py-2.5">
                      <span className={cn('font-display text-base', i < 3 ? MEDAL[i] : 'text-ink-dim')}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-sm', me ? 'text-aqua' : 'text-ink')}>{r.name}</span>
                      <span className="ml-2 font-mono text-[10px] text-ink-dim">◆ {r.rank}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-ink-dim">{r.groupCode || '—'}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-xs text-lime">{r.level}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-ink-soft">{r.xp.toLocaleString('ru-RU')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isStudent && <Achievements />}
    </div>
  )
}
