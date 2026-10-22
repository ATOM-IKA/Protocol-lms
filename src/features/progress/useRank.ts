import { useAuthStore, type Role } from '@/features/auth/authStore'
import { useXp } from './useXp'
import { useTeacherPassedStudents } from '@/features/submission/useSubmissions'
import { rankFromHours, rankFromTeacherStudents } from '@/shared/lib/levels'
import type { Rank } from '@/entities/profile/ranks'

export interface RoleRank {
  rank: Rank
  role: Role
  hours: number // накопленные часы (студент)
  teacherStudents: number // студентов продвинул (преподаватель)
}

/** Ранг с учётом роли: студент — по часам, препод — по числу продвинутых студентов, админ — SSS, супер — SSS+. */
export function useProfileRank(): RoleRank {
  const user = useAuthStore((s) => s.user)
  const role: Role = user?.role ?? 'student'
  const xp = useXp()
  const { data: teacherStudents = 0 } = useTeacherPassedStudents(user?.id ?? '', role === 'teacher')

  let rank: Rank
  if (role === 'superadmin') rank = 'SSS+'
  else if (role === 'admin') rank = 'SSS'
  else if (role === 'teacher') rank = rankFromTeacherStudents(teacherStudents)
  else rank = rankFromHours(xp.hours)

  return { rank, role, hours: xp.hours, teacherStudents }
}
