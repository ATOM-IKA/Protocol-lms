import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/course/service'
import type { Course, Lesson } from '@/entities/course/types'

const KEY = ['courses'] as const

export function usePublishedCourses() {
  return useQuery({ queryKey: KEY, queryFn: api.fetchCourses, staleTime: 30_000 })
}

export function useCourse(id: string) {
  return useQuery({ queryKey: ['course', id], queryFn: () => api.fetchCourse(id), enabled: !!id })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: KEY })
    void qc.invalidateQueries({ queryKey: ['course'] })
  }
}

export function useCourseMutations() {
  const invalidate = useInvalidate()
  const opts = { onSuccess: invalidate }

  const createCourse = useMutation({ meta: { success: 'Курс создан' },
    mutationFn: (v: { ownerId: string; instructor: string; institutionId: string }) =>
      api.createCourse(v.ownerId, v.instructor, v.institutionId),
    onSuccess: invalidate,
  })
  const updateCourse = useMutation({ meta: { success: 'Сохранено' }, mutationFn: (v: { id: string; patch: Partial<Course> }) => api.updateCourse(v.id, v.patch), ...opts })
  const deleteCourse = useMutation({ meta: { success: 'Курс удалён' }, mutationFn: (id: string) => api.deleteCourse(id), ...opts })
  const addSection = useMutation({ meta: { success: 'Раздел добавлен' }, mutationFn: (v: { courseId: string; order: number }) => api.addSection(v.courseId, v.order), ...opts })
  const updateSection = useMutation({ meta: { success: 'Сохранено' }, mutationFn: (v: { id: string; title: string }) => api.updateSection(v.id, v.title), ...opts })
  const deleteSection = useMutation({ meta: { success: 'Раздел удалён' }, mutationFn: (id: string) => api.deleteSection(id), ...opts })
  const addLesson = useMutation({ meta: { success: 'Урок добавлен' }, mutationFn: (v: { courseId: string; sectionId: string; order: number }) => api.addLesson(v.courseId, v.sectionId, v.order), ...opts })
  const updateLesson = useMutation({ meta: { success: 'Сохранено' }, mutationFn: (v: { id: string; patch: Partial<Lesson> }) => api.updateLesson(v.id, v.patch), ...opts })
  const deleteLesson = useMutation({ meta: { success: 'Урок удалён' }, mutationFn: (id: string) => api.deleteLesson(id), ...opts })

  return { createCourse, updateCourse, deleteCourse, addSection, updateSection, deleteSection, addLesson, updateLesson, deleteLesson }
}
