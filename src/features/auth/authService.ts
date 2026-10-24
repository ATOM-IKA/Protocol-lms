import { login, logoutAuth, restoreProfile } from '@/shared/api/directus'
import { useAuthStore, type AuthUser } from './authStore'

/**
 * Шаг 1 входа: проверить логин/пароль и получить профиль, НЕ сохраняя его в приложении.
 * Так экран входа успевает проверить роль и колледж, и только потом «впустить» (commitLogin).
 * Студенту его собственный номер читать запрещено, поэтому подставляем введённый при входе.
 */
export async function signIn(identity: string, password: string): Promise<AuthUser> {
  const user = await login(identity, password)
  const typed = identity.trim()
  return user.studentId || typed.includes('@') ? user : { ...user, studentId: typed }
}

/** Шаг 2: впустить пользователя в приложение. */
export function commitLogin(user: AuthUser): void {
  useAuthStore.getState().login(user)
}

/** Вход по номеру или почте за один шаг (когда проверок роли не нужно). */
export async function loginWithStudentId(identity: string, password: string): Promise<AuthUser> {
  const user = await signIn(identity, password)
  commitLogin(user)
  return user
}

export function logout(): void {
  void logoutAuth()
  useAuthStore.getState().logout()
}

/**
 * Проверка сессии при старте. Токена нет или он недействителен — выходим из кэшированного профиля
 * (иначе интерфейс показывал бы «залогиненного», а все запросы падали); сервер недоступен — остаёмся на кэше.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const r = await restoreProfile()
  if (r.status === 'ok') {
    const cached = useAuthStore.getState().user
    // собственный номер студент прочитать не может — берём из кэша, если это тот же человек
    const user = cached?.id === r.user.id && !r.user.studentId ? { ...r.user, studentId: cached.studentId } : r.user
    useAuthStore.getState().login(user)
    return user
  }
  if (r.status === 'anonymous') { useAuthStore.getState().logout(); return null }
  return useAuthStore.getState().user
}
