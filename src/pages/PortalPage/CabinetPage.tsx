import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { ProfileCabinet } from '@/features/profile/ProfileCabinet'
import { useAuthStore } from '@/features/auth/authStore'
import { restoreSession } from '@/features/auth/authService'

export function CabinetPage() {
  const user = useAuthStore((s) => s.user)
  useEffect(() => { void restoreSession() }, [])
  if (!user) return <Navigate to="/login" replace />

  return (
    <>
      <Header />
      <Container>
        <div className="py-10 sm:py-14">
          <Link to="/portal" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
            <ArrowLeft size={14} /> Портал
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <Label accent>// личный кабинет</Label>
            <Label>id-карта</Label>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl">Профиль<span className="text-aqua">.</span></h1>
          <div className="mt-8">
            <ProfileCabinet />
          </div>
        </div>
      </Container>
    </>
  )
}
