import { useQuery } from '@tanstack/react-query'
import { fetchTeacherStats } from '@/entities/profile/stats'
import { fetchStats } from '@/entities/admin/service'

export function useTeacherStats(teacherId?: string, enabled = true) {
  return useQuery({
    queryKey: ['profile', 'teacher-stats', teacherId ?? ''],
    queryFn: () => fetchTeacherStats(teacherId as string),
    enabled: enabled && !!teacherId,
  })
}

export function useAdminScopeStats(institution?: string, enabled = true) {
  return useQuery({
    queryKey: ['profile', 'admin-stats', institution ?? 'all'],
    queryFn: () => fetchStats(institution),
    enabled,
  })
}
