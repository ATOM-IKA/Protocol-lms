import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/attendance/service'

export function useCourseAttendance(courseId: string, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'course', courseId],
    queryFn: () => api.fetchCourseAttendance(courseId),
    enabled: enabled && !!courseId,
  })
}

export function useMyAttendance(studentId?: string, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'mine', studentId ?? ''],
    queryFn: () => api.fetchMyAttendance(studentId as string),
    enabled: enabled && !!studentId,
  })
}

export function useSetAttendance(courseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { lessonId: string; studentId: string; status: api.AttendanceStatus | null }) =>
      api.setAttendance(courseId, v.lessonId, v.studentId, v.status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['attendance', 'course', courseId] })
    },
  })
}
