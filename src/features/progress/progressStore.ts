import { create } from 'zustand'

const KEY = 'protocol-progress'

function readInitial(): Record<string, boolean> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

interface ProgressState {
  completed: Record<string, boolean>
  toggle: (lessonId: string) => void
  isDone: (lessonId: string) => boolean
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  completed: readInitial(),
  toggle: (lessonId) =>
    set((s) => {
      const completed = { ...s.completed, [lessonId]: !s.completed[lessonId] }
      if (!completed[lessonId]) delete completed[lessonId]
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(completed))
      return { completed }
    }),
  isDone: (lessonId) => !!get().completed[lessonId],
}))
