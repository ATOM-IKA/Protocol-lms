import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RoleAvatar } from './RoleAvatar'
import type { Role } from '@/features/auth/authStore'
import type { Rank } from '@/entities/profile/ranks'

interface Props {
  id: string
  callsign: string
  role: Role
  rank: Rank
  institutionShort?: string
  level?: number
  xp?: number
  progressPct?: number
  groupCode?: string
}

/** Компактная карточка профиля для СДО: минимум информации. */
export function ProfileMiniCard({ id, callsign, role, rank, institutionShort, level, xp, progressPct, groupCode }: Props) {
  const { t } = useTranslation()
  const isStudent = role === 'student'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="clip-hud relative w-full max-w-sm overflow-hidden border border-line-aqua bg-gradient-to-br from-surface to-bg"
    >
      <div className="flex items-center gap-3.5 p-4">
        <div className="shrink-0 border border-line-strong">
          <RoleAvatar seed={id} rank={rank} role={role} size={60} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="label-mono text-[9px] text-ink-dim">CALLSIGN</span>
          <div className="truncate font-display text-lg font-bold text-ink">{callsign}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px]">
            <span className="border border-line-strong px-1.5 py-0.5 text-aqua">{t('auth.role_' + role)}</span>
            <span className="text-aqua">◆ {rank}</span>
            {isStudent && groupCode && <span className="border border-line-strong px-1.5 py-0.5 text-lime">{groupCode}</span>}
            {institutionShort && <span className="text-ink-dim">{institutionShort}</span>}
          </div>
          {isStudent && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="font-mono text-[11px] text-lime">LVL {level ?? 1}</span>
              <div className="h-1.5 flex-1 overflow-hidden bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct ?? 0}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-aqua to-lime"
                />
              </div>
              <span className="font-mono text-[10px] text-ink-dim">{(xp ?? 0).toLocaleString('ru-RU')} XP</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
