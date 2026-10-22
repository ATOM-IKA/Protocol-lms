import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'

/**
 * Единая точка правды для кнопок «Войти / Войти в СДО / Продолжить».
 * Различает зону, чтобы кнопка не вела сама на себя:
 *   • гость                      → /login   (форма входа)
 *   • залогинен НА витрине        → /app     (уйти в рабочее пространство)
 *   • залогинен В ХАБЕ/профиле    → /about   (открыть витрину СДО со статистикой)
 * Витрина считается по обоим известным путям ('/' и '/about') — см. допущение ниже.
 */
const LANDING_PATHS = new Set(['/', '/about'])

export function useAuthEntry() {
  const loggedIn = useAuthStore((s) => !!s.user)
  const { pathname } = useLocation()
  if (!loggedIn) return { loggedIn: false, to: '/login' }
  if (LANDING_PATHS.has(pathname)) return { loggedIn: true, to: '/app' }
  return { loggedIn: true, to: '/about' }
}