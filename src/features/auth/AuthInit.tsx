import { useEffect } from 'react'
import { restoreSession } from './authService'

/** Проверяет/обновляет сессию PocketBase при старте приложения. */
export function AuthInit() {
  useEffect(() => {
    void restoreSession()
  }, [])
  return null
}
