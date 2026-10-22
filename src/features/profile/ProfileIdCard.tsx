import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RoleAvatar } from './RoleAvatar'
import { Coin } from '@/features/currency/Coin'
import { gradeTone } from '@/shared/lib/grade'
import type { ProfileCard } from '@/entities/profile/types'

export function ProfileIdCard({ card }: { card: ProfileCard }) {
  const { t } = useTranslation()
  const isStudent = card.role === 'student'
  const pct = card.progressPct ?? Math.max(0, Math.min(100, Math.round((card.xp / card.xpForNext) * 100)))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="clip-hud relative w-full max-w-md overflow-hidden border border-line-aqua bg-gradient-to-br from-surface to-bg shadow-[0_0_40px_rgba(159,232,255,0.10)]"
    >
      {/* голо-блик */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(110deg, transparent 20%, rgba(159,232,255,0.10) 40%, rgba(190,239,141,0.10) 55%, transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'protocol-holo 4.5s linear infinite',
        }}
      />
      {/* скан-линия */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 h-10"
        style={{
          background: 'linear-gradient(rgba(159,232,255,0.14), transparent)',
          animation: 'protocol-scan 3.6s linear infinite',
        }}
      />

      <div className="relative flex gap-4 p-5">
        <div className="shrink-0 self-start border border-line-strong">
          {card.photoUrl ? (
            <img src={card.photoUrl} alt={t('profile.avatar_alt')} className="h-24 w-24 object-cover" />
          ) : (
            <RoleAvatar seed={card.id} rank={card.rank} role={card.role} size={96} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="label-mono text-[10px] text-ink-dim">CALLSIGN</span>
          <div className="truncate font-display text-2xl font-bold text-ink">{card.callsign}</div>
          <div className="mt-1 font-mono text-xs text-ink-muted">
            {card.institutionShort} · {card.institutionName}
          </div>

          {isStudent ? (
            <>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-xs text-lime">LVL {card.level}</span>
                <div className="h-1.5 flex-1 overflow-hidden bg-surface-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-gradient-to-r from-aqua to-lime"
                  />
                </div>
                <span className="font-mono text-xs text-ink-dim">{card.xp.toLocaleString('ru-RU')} XP</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-ink-dim">
                <span>{t('profile.hours', { count: Math.round(card.hours ?? 0) })}</span>
                {card.groupCode && <span className="border border-line-strong px-1.5 py-0.5 text-aqua">{card.groupCode}</span>}
                {card.avgGrade != null && card.avgGrade > 0 && (
                  <span className="flex items-center gap-1.5">
                    {t('profile.gpa')}
                    <span className={`inline-flex h-5 min-w-[2.5rem] items-center justify-center border px-1 text-xs ${gradeTone(Math.round(card.avgGrade))}`}>
                      {card.avgGrade.toFixed(2)}
                    </span>
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Coin size={18} />
                <span className="font-display text-lg text-[#ffd24a]">{card.coins ?? 0}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{t('profile.coins')}</span>
              </div>
            </>
          ) : (
            <div className="mt-3 font-mono text-xs text-ink-muted">
              <span className="border border-line-strong px-2 py-0.5 text-aqua">{t('auth.role_' + card.role)}</span>
              {card.role === 'teacher' && (
                <span className="ml-2 text-ink-dim">{t('profile.students_advanced', { count: card.teacherStudents ?? 0 })}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-line px-5 py-2.5 font-mono">
        <span className="text-[10px] text-ink-dim">ID · {card.id}</span>
        <span className="jp text-xs text-ink-dim">認証済</span>
        <span className="text-[10px] text-aqua">◆ RANK {card.rank}</span>
      </div>
    </motion.div>
  )
}
