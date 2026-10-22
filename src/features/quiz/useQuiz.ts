import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/entities/quiz/service'

export function useAuthorQuizzes(authorId?: string) {
  return useQuery({ queryKey: ['quiz', 'author', authorId ?? ''], queryFn: () => api.fetchAuthorQuizzes(authorId as string), enabled: !!authorId })
}
export function usePublishedQuizzes() {
  return useQuery({ queryKey: ['quiz', 'published'], queryFn: api.fetchPublishedQuizzes })
}
export function useQuizQuestions(quizId?: string) {
  return useQuery({ queryKey: ['quiz', 'questions', quizId ?? ''], queryFn: () => api.fetchQuizQuestions(quizId as string), enabled: !!quizId })
}
export function useQuizForTake(quizId?: string) {
  return useQuery({ queryKey: ['quiz', 'take', quizId ?? ''], queryFn: () => api.fetchQuizForTake(quizId as string), enabled: !!quizId })
}
export function useMyAttempts(studentId?: string, enabled = true) {
  return useQuery({ queryKey: ['quiz', 'attempts', studentId ?? ''], queryFn: () => api.fetchMyAttempts(studentId as string), enabled: enabled && !!studentId })
}
export function useMyQuizXp(studentId?: string, enabled = true) {
  return useQuery({ queryKey: ['quiz', 'my-xp', studentId ?? ''], queryFn: () => api.fetchMyQuizXp(studentId as string), enabled: enabled && !!studentId })
}

export function useQuizMutations() {
  const qc = useQueryClient()
  const inval = () => void qc.invalidateQueries({ queryKey: ['quiz'] })
  return {
    create: useMutation({ mutationFn: (v: api.NewQuiz) => api.createQuiz(v), onSuccess: inval }),
    update: useMutation({ mutationFn: (v: { id: string; patch: Partial<api.NewQuiz> }) => api.updateQuiz(v.id, v.patch), onSuccess: inval }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteQuiz(id), onSuccess: inval }),
    addQuestion: useMutation({ mutationFn: (v: api.NewQuestion) => api.addQuestion(v), onSuccess: inval }),
    updateQuestion: useMutation({ mutationFn: (v: { id: string; patch: Partial<api.NewQuestion> }) => api.updateQuestion(v.id, v.patch), onSuccess: inval }),
    removeQuestion: useMutation({ mutationFn: (id: string) => api.deleteQuestion(id), onSuccess: inval }),
    submit: useMutation({ mutationFn: (v: { quizId: string; studentId: string; answers: Record<string, unknown> }) => api.submitAttempt(v.quizId, v.studentId, v.answers), onSuccess: inval }),
  }
}
