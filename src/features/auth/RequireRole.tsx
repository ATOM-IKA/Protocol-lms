import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, type Role } from './authStore'

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/app" replace />
  return <Outlet />
}
