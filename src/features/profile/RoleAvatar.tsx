import { GraduationCap, Shield, Crown } from 'lucide-react'
import { GenerativeAvatar } from './GenerativeAvatar'
import type { Rank } from '@/entities/profile/ranks'
import type { Role } from '@/features/auth/authStore'
import { cn } from '@/shared/lib/cn'

const BADGE = {
  teacher: { Icon: GraduationCap, cls: 'border-line-lime text-lime' },
  admin: { Icon: Shield, cls: 'border-line-aqua text-aqua' },
  superadmin: { Icon: Crown, cls: 'border-danger text-danger shadow-[0_0_8px_rgba(255,59,87,0.55)]' },
} as const

/** Аватар с ролевой рамкой и значком: сразу видно преподавателя, админа, супер-админа. */
export function RoleAvatar({
  seed,
  rank,
  role,
  size = 96,
  className,
}: {
  seed: string
  rank: Rank
  role: Role
  size?: number
  className?: string
}) {
  const badge = role !== 'student' ? BADGE[role] : null
  const iconSize = Math.max(9, Math.round(size * 0.2))
  const ring =
    role === 'superadmin'
      ? 'ring-1 ring-danger/70'
      : role === 'admin'
        ? 'ring-1 ring-aqua/50'
        : role === 'teacher'
          ? 'ring-1 ring-lime/50'
          : ''

  return (
    <span className={cn('relative inline-block leading-none', className)} style={{ width: size, height: size }}>
      <GenerativeAvatar seed={seed} rank={rank} size={size} className={ring} />
      {badge && (
        <span
          className={cn('absolute -bottom-1 -right-1 flex items-center justify-center border bg-bg', badge.cls)}
          style={{ width: Math.round(size * 0.4), height: Math.round(size * 0.4) }}
        >
          <badge.Icon size={iconSize} />
        </span>
      )}
    </span>
  )
}
