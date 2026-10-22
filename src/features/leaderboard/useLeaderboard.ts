import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '@/entities/leaderboard/service'

export function useLeaderboard(institutionId?: string) {
  return useQuery({
    queryKey: ['leaderboard', institutionId ?? 'all'],
    queryFn: () => fetchLeaderboard(institutionId),
  })
}
