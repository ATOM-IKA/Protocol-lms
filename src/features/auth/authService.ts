import { login, logoutAuth, restoreProfile } from '@/shared/api/directus'
import { useAuthStore, type AuthUser } from './authStore'

/** Вход по email ИЛИ student_id (dev-резолв) / по email (prod). Имя функции прежнее. */
export async function loginWithStudentId(identity: string, password: string): Promise<AuthUser> {
  const user = await login(identity, password)
  useAuthStore.getState().login(user)
  return user
}

export function logout(): void {
  void logoutAuth()
  useAuthStore.getState().logout()
}

/** Проверка/обновление сессии при старте. В dev профиль уже в localStorage (authStore). */
export async function restoreSession(): Promise<AuthUser | null> {
  const fresh = await restoreProfile()
  if (fresh) { useAuthStore.getState().login(fresh); return fresh }
  return useAuthStore.getState().user
}