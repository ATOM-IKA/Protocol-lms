import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Label } from '@/shared/ui/Label'
import { InstitutionSelect } from '@/features/auth/InstitutionSelect'
import { useAuthStore } from '@/features/auth/authStore'
import { fetchInstitutions } from '@/entities/institution/service'
import type { Institution } from '@/entities/institution/types'
import { commitLogin, logout, signIn } from '@/features/auth/authService'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/shared/ui/toast'

type LoginRole = 'student' | 'teacher' | 'admin'
const ROLE_TABS: LoginRole[] = ['student', 'teacher', 'admin']

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: fetchInstitutions,
    staleTime: 5 * 60_000,
  })

  const [role, setRole] = useState<LoginRole>('student')
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  if (user) return <Navigate to="/portal" replace />

  const idError = touched && !studentId.trim() ? t('auth.err_username') : undefined
  const pwError = touched && !password ? t('auth.err_password') : undefined

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setTouched(true)
    setError(null)
    if (!studentId.trim() || !password) return
    if (!consent) {
      setError(t('auth.err_consent'))
      return
    }
    setLoading(true)
    try {
      const user = await signIn(studentId.trim(), password)
      // явная проверка выбранной роли (админ-вкладка пускает admin и superadmin)
      const roleOk = role === 'admin' ? user.role === 'admin' || user.role === 'superadmin' : user.role === role
      if (!roleOk) {
        logout()
        setError(t('auth.err_wrong_role', { role: t('auth.role_' + user.role) }))
        return
      }
      if (institution && user.institutionShort && user.institutionShort !== institution.shortName) {
        logout()
        setError(t('auth.err_wrong_college'))
        return
      }
      commitLogin(user) // впускаем только после проверки роли и колледжа
      toast.success(t('auth.welcome', { defaultValue: 'Вы вошли в систему' }), 'готово')
      navigate((location.state as { from?: string } | null)?.from ?? '/portal', { replace: true })
    } catch {
      setError(t('auth.err_login'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      >
        <Container>
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
            <motion.form
              onSubmit={onSubmit}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              noValidate
              className="clip-hud w-full max-w-md border border-line-aqua bg-surface p-6 shadow-[0_0_40px_rgba(159,232,255,0.08)] sm:p-8"
            >
              <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <Label accent>// auth</Label>
                <Label>01 / login</Label>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="mt-3 text-4xl">
                {t('auth.login')}<span className="text-aqua">.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="mt-2 text-sm text-ink-muted">
                {t('auth.subtitle')}
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-6">
                <Label>{t('auth.enter_as')}</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ROLE_TABS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        'border py-2 font-mono text-xs uppercase tracking-wider transition-colors clip-btn',
                        role === r ? 'border-aqua text-aqua bg-aqua/[0.06]' : 'border-line-strong text-ink-muted hover:text-ink',
                      )}
                    >
                      {t('auth.role_' + r)}
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-6 flex flex-col gap-5">
                <InstitutionSelect
                  label={t('auth.institution')}
                  items={institutions}
                  value={institution}
                  onChange={setInstitution}
                />

                <Input
                  label={t('auth.username')}
                  placeholder={t('auth.username_ph')}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  error={idError}
                  autoComplete="username"
                />

                <Input
                  label={t('auth.password')}
                  placeholder="••••••••"
                  reveal
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={pwError}
                  autoComplete="current-password"
                />
              </motion.div>

              <motion.label
                variants={fadeInUp}
                className={`clip-btn mt-6 flex cursor-pointer items-start gap-3 border p-3 text-xs leading-relaxed transition-colors ${
                  consent ? 'border-line-aqua bg-aqua/[0.06] text-ink-soft' : 'border-line-strong text-ink-muted hover:border-line-aqua'
                }`}
              >
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="sr-only" />
                <span
                  aria-hidden
                  className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center border transition-all ${
                    consent ? 'border-lime bg-lime/15 text-lime shadow-[0_0_10px_rgba(190,239,141,0.35)]' : 'border-line-strong text-transparent'
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>
                  {t('auth.consent_pre')}{' '}
                  <Link to="/privacy" target="_blank" className="text-aqua underline-offset-2 hover:underline">
                    {t('auth.consent_link')}
                  </Link>
                  .
                </span>
              </motion.label>

              {error && (
                <motion.p variants={fadeInUp} className="mt-4 border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeInUp} className="mt-6">
                <Button type="submit" size="lg" className="w-full" disabled={loading || !consent}>
                  {loading ? t('auth.logging_in') : `${t('auth.login')} →`}
                </Button>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-5 text-center">
                <Link to="/" className="py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
                  ← protocol.lms
                </Link>
              </motion.div>
            </motion.form>
          </div>
        </Container>
      </section>
    </>
  )
}
