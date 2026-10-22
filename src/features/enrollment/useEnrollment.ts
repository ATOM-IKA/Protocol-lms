import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/enrollment/service'

export function useMyEnrollment(courseId: string, studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['enrollment', courseId, studentId],
    queryFn: () => api.fetchMyEnrollment(courseId, studentId),
    enabled: enabled && !!courseId && !!studentId,
  })
}

export function useEnroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { courseId: string; studentId: string }) => api.enroll(v.courseId, v.studentId),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['enrollment', v.courseId, v.studentId] })
      void qc.invalidateQueries({ queryKey: ['enrollments', v.courseId] })
      void qc.invalidateQueries({ queryKey: ['my-enrollments', v.studentId] })
    },
  })
}

export function useUnenroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; courseId: string; studentId: string }) => api.unenroll(v.id),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['enrollment', v.courseId, v.studentId] })
      void qc.invalidateQueries({ queryKey: ['enrollments', v.courseId] })
      void qc.invalidateQueries({ queryKey: ['my-enrollments', v.studentId] })
    },
  })
}

export function useMyEnrollments(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-enrollments', studentId],
    queryFn: () => api.fetchMyEnrollments(studentId),
    enabled: enabled && !!studentId,
  })
}

export function useCourseEnrollments(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: () => api.fetchCourseEnrollments(courseId),
    enabled: enabled && !!courseId,
  })
}
