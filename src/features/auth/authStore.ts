import { create } from 'zustand'

export type Role = 'student' | 'teacher' | 'admin' | 'superadmin'

export interface AuthUser {
  id: string
  callsign: string
  fullName: string
  role: Role
  institutionShort: string
  institutionName: string
  institutionId: string
  coins: number
  groupCode: string
  groupId: string
  curatorName: string
  studentId: string  
  email: string      
  createdAt: string
}

const KEY = 'protocol-auth'

function readInitial(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

interface AuthState {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readInitial(),
  login: (user) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(user))
    set({ user })
  },
  logout: () => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
    set({ user: null })
  },
}))
