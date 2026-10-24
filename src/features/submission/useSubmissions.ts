import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/submission/service'

export function useMySubmission(lessonId: string, studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['submission', lessonId, studentId],
    queryFn: () => api.fetchMySubmission(lessonId, studentId),
    enabled: enabled && !!lessonId && !!studentId,
  })
}

export function useSubmitWork() {
  const qc = useQueryClient()
  return useMutation({ meta: { success: 'Работа отправлена на проверку' },
    mutationFn: (input: api.SubmitInput) => api.submitWork(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['submission', v.lessonId, v.studentId] })
      void qc.invalidateQueries({ queryKey: ['submissions', v.courseId] })
      void qc.invalidateQueries({ queryKey: ['my-submissions', v.courseId, v.studentId] })
      void qc.invalidateQueries({ queryKey: ['my-marks', v.studentId] })
      void qc.invalidateQueries({ queryKey: ['my-grades', v.studentId] })
    },
  })
}

export function useMyGrades(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-grades', studentId],
    queryFn: () => api.fetchMyGrades(studentId),
    enabled: enabled && !!studentId,
  })
}

export function useMyLessonMarks(studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-marks', studentId],
    queryFn: () => api.fetchMyLessonMarks(studentId),
    enabled: enabled && !!studentId,
  })
}

export function useTeacherPassedStudents(teacherId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['teacher-passed', teacherId],
    queryFn: () => api.fetchTeacherPassedStudents(teacherId),
    enabled: enabled && !!teacherId,
  })
}

export function useMyCourseSubmissions(courseId: string, studentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['my-submissions', courseId, studentId],
    queryFn: () => api.fetchMyCourseSubmissions(courseId, studentId),
    enabled: enabled && !!courseId && !!studentId,
  })
}

export function useCourseSubmissions(courseId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['submissions', courseId],
    queryFn: () => api.fetchCourseSubmissions(courseId),
    enabled: enabled && !!courseId,
  })
}

export function useGradeSubmission(courseId: string) {
  const qc = useQueryClient()
  return useMutation({ meta: { success: 'Оценка сохранена' },
    mutationFn: (v: { id: string; grade: number; feedback: string }) => api.gradeSubmission(v.id, v.grade, v.feedback),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['submissions', courseId] })
    },
  })
}
