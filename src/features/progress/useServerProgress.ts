import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/progress/service'

export function useServerProgress(courseId: string, studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['server-progress', courseId, studentId],
    queryFn: () => api.fetchServerProgress(courseId, studentId),
    enabled: enabled && !!courseId && !!studentId,
  })
}

/** Пишет отметку о прохождении на сервер (дублируя локальный стор). */
export function useSyncLesson() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { courseId: string; studentId: string; lessonId: string; done: boolean }) =>
      api.setLessonDone(v.courseId, v.studentId, v.lessonId, v.done),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['server-progress', v.courseId, v.studentId] })
      void qc.invalidateQueries({ queryKey: ['enrollments', v.courseId] })
    },
  })
}
