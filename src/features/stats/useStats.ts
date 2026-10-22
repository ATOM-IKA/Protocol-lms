import { useQuery } from '@tanstack/react-query'
import { fetchPublicStats } from '@/entities/stats/service'

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: fetchPublicStats,
    staleTime: 10 * 60_000, // витрина меняется редко — кэшируем надолго
  })
}