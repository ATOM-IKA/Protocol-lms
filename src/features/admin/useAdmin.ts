import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/admin/service'
import { fetchInstitutions } from '@/entities/institution/service'
import type { Institution } from '@/entities/institution/types'

export function useAdminStats(institution?: string) {
  return useQuery({ queryKey: ['admin', 'stats', institution ?? 'all'], queryFn: () => api.fetchStats(institution) })
}

export function useAdminUsers(institution?: string) {
  return useQuery({ queryKey: ['admin', 'users', institution ?? 'all'], queryFn: () => api.fetchUsers(institution) })
}

export function useAdminInstitutions() {
  return useQuery({ queryKey: ['admin', 'institutions'], queryFn: fetchInstitutions })
}

export function useAuditLogs() {
  return useQuery({ queryKey: ['admin', 'audit'], queryFn: api.fetchAuditLogs })
}

export function useAdminCourses(institution?: string) {
  return useQuery({ queryKey: ['admin', 'courses', institution ?? 'all'], queryFn: () => api.fetchAdminCourses(institution) })
}

export function useAdminGroups(institution?: string) {
  return useQuery({ queryKey: ['admin', 'groups', institution ?? 'all'], queryFn: () => api.fetchGroups(institution) })
}

export function useGroupMutations() {
  const qc = useQueryClient()
  const inval = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'groups'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
  }
  return {
    create: useMutation({ meta: { success: 'Группа создана' }, mutationFn: (v: api.NewGroup) => api.createGroup(v), onSuccess: inval }),
    update: useMutation({ meta: { success: 'Группа сохранена' }, mutationFn: (v: { id: string; patch: Partial<api.NewGroup> }) => api.updateGroup(v.id, v.patch), onSuccess: inval }),
    remove: useMutation({ meta: { success: 'Группа удалена' }, mutationFn: (id: string) => api.deleteGroup(id), onSuccess: inval }),
  }
}

export function useCourseModeration() {
  const qc = useQueryClient()
  const inval = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'courses'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    void qc.invalidateQueries({ queryKey: ['courses'] })
  }
  return {
    setStatus: useMutation({ meta: { success: 'Статус курса изменён' }, mutationFn: (v: { id: string; status: 'draft' | 'published' }) => api.setCourseStatus(v.id, v.status), onSuccess: inval }),
    remove: useMutation({ meta: { success: 'Курс удалён' }, mutationFn: (id: string) => api.deleteCourseAdmin(id), onSuccess: inval }),
  }
}

export function useUserMutations() {
  const qc = useQueryClient()
  const inval = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
  return {
    create: useMutation({ meta: { success: 'Пользователь создан' }, mutationFn: (v: api.NewUser) => api.createUser(v), onSuccess: inval }),
    update: useMutation({ meta: { success: 'Пользователь сохранён' }, mutationFn: (v: { id: string; patch: api.UserPatch }) => api.updateUser(v.id, v.patch), onSuccess: inval }),
    remove: useMutation({ meta: { success: 'Пользователь удалён' }, mutationFn: (id: string) => api.deleteUser(id), onSuccess: inval }),
  }
}

export function useInstitutionMutations() {
  const qc = useQueryClient()
  const inval = () => {
    void qc.invalidateQueries({ queryKey: ['admin', 'institutions'] })
    void qc.invalidateQueries({ queryKey: ['institutions'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
  }
  return {
    create: useMutation({ meta: { success: 'Учебное заведение добавлено' }, mutationFn: (v: { name: string; shortName: string }) => api.createInstitution(v.name, v.shortName), onSuccess: inval }),
    update: useMutation({ meta: { success: 'Учебное заведение сохранено' }, mutationFn: (v: { id: string; patch: Partial<Institution> }) => api.updateInstitution(v.id, v.patch), onSuccess: inval }),
    remove: useMutation({ meta: { success: 'Учебное заведение удалено' }, mutationFn: (id: string) => api.deleteInstitution(id), onSuccess: inval }),
  }
}
