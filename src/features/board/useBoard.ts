import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/board/service'

export function useStudentTasks(groupId?: string) {
  return useQuery({ queryKey: ['board', 'student', groupId ?? 'none'], queryFn: () => api.fetchTasksForStudent(groupId) })
}

export function useMyBoardXp(studentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['board', 'my-xp', studentId ?? ''],
    queryFn: () => api.fetchMyBoardXp(studentId as string),
    enabled: enabled && !!studentId,
  })
}

export function useMyCompletions(studentId?: string) {
  return useQuery({
    queryKey: ['board', 'completions', 'mine', studentId ?? ''],
    queryFn: () => api.fetchMyCompletions(studentId as string),
    enabled: !!studentId,
  })
}

export function useAuthorTasks(authorId?: string) {
  return useQuery({
    queryKey: ['board', 'author', authorId ?? ''],
    queryFn: () => api.fetchTasksByAuthor(authorId as string),
    enabled: !!authorId,
  })
}

export function useAuthorCompletions(authorId?: string) {
  return useQuery({
    queryKey: ['board', 'completions', 'author', authorId ?? ''],
    queryFn: () => api.fetchCompletionsForAuthor(authorId as string),
    enabled: !!authorId,
  })
}

export function useBoardMutations() {
  const qc = useQueryClient()
  const inval = () => {
    void qc.invalidateQueries({ queryKey: ['board'] })
  }
  return {
    publish: useMutation({ mutationFn: (v: api.NewBoardTask) => api.publishTask(v), onSuccess: inval }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteTask(id), onSuccess: inval }),
    submit: useMutation({ mutationFn: (v: { taskId: string; studentId: string }) => api.submitCompletion(v.taskId, v.studentId), onSuccess: inval }),
    decline: useMutation({ mutationFn: (v: { taskId: string; studentId: string }) => api.declineTask(v.taskId, v.studentId), onSuccess: inval }),
    reset: useMutation({ mutationFn: (v: { taskId: string; studentId: string }) => api.resetMyCompletion(v.taskId, v.studentId), onSuccess: inval }),
    review: useMutation({ mutationFn: (v: { id: string; status: 'approved' | 'rejected' }) => api.reviewCompletion(v.id, v.status), onSuccess: inval }),
  }
}
