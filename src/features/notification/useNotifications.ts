import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/notification/service'

export function useMyNotifications(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.fetchMyNotifications(userId),
    enabled: enabled && !!userId,
    refetchInterval: 45_000, // мягкий поллинг новых уведомлений
  })
}

export function useNotifActions(userId: string) {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: ['notifications', userId] })
  return {
    read: useMutation({ mutationFn: (id: string) => api.markNotifRead(id), onSuccess: inval }),
    readAll: useMutation({ mutationFn: () => api.markAllNotifsRead(userId), onSuccess: inval }),
  }
}
