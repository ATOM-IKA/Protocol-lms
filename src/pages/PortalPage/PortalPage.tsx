import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, IdCard, LogOut, FlaskConical } from 'lucide-react'
import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { RoleAvatar } from '@/features/profile/RoleAvatar'
import { useAuthStore } from '@/features/auth/authStore'
import { useProfileRank } from '@/features/progress/useRank'
import { logout } from '@/features/auth/authService'
import { PRODUCTS, type Product } from '@/shared/config/products'
import { CHANGELOG } from '@/shared/config/changelog'
import { PORTAL_DOCS } from '@/shared/config/portalDocs'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'
import { cn } from '@/shared/lib/cn'
import { useAuthEntry } from '@/features/auth/useAuthEntry'

const ACCENT: Record<Product['accent'], string> = {
  aqua: 'border-line-aqua text-aqua',
  lime: 'border-line-lime text-lime',
  teal: 'border-line-strong text-ink',
}

function ProductCard({ p, loggedIn }: { p: Product; loggedIn: boolean }) {
  const Icon = p.icon
  const live = p.status === 'live'
  // залогинен → СДО открывается со своего лендинга (без повторного входа)
  const { to: entryTo } = useAuthEntry()
  const to = p.to === '/login' ? entryTo : p.to
  const a = ACCENT[p.accent]

  const inner = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn('flex h-12 w-12 items-center justify-center border clip-btn', live ? a : 'border-line text-ink-muted')}>
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <span className={cn('font-mono text-[10px] uppercase tracking-widest', live ? 'text-lime' : 'text-ink-dim')}>
          {live ? 'доступен' : 'скоро'}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{p.title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{p.description}</p>
      {live && (
        <span className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-aqua">
          {p.to === '/login' && loggedIn ? 'продолжить' : 'войти'} {p.href ? <ExternalLink size={14} /> : <ArrowRight size={14} />}
        </span>
      )}
    </>
  )

  const cls = cn('clip-hud block h-full border bg-surface p-6 transition-colors', live ? 'border-line-aqua hover:border-aqua' : 'cursor-default border-line opacity-70')
  if (!live) return <div className={cls}>{inner}</div>
  if (p.href) return <a href={p.href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  return <Link to={to ?? '/login'} className={cls}>{inner}</Link>
}

const ROLE_LABEL: Record<string, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', superadmin: 'Супер-админ' }

/** Компактная плашка аккаунта — только навигация (данные на странице «Профиль»). */
function AccountBar() {
  const user = useAuthStore((s) => s.user)
  const rank = useProfileRank()
  if (!user) return null
  return (
    <div className="clip-hud mb-10 flex flex-wrap items-center justify-between gap-4 border border-line-aqua bg-surface p-4 sm:p-5">
      <div className="flex items-center gap-3.5">
        <RoleAvatar seed={user.id} rank={rank.rank} role={user.role} size={48} />
        <div className="min-w-0">
          <div className="truncate font-display text-lg text-ink">{user.callsign}</div>
          <div className="font-mono text-[11px] text-ink-dim">
            {ROLE_LABEL[user.role] ?? user.role} · {user.role === 'superadmin' ? 'Вся система' : (user.institutionShort || '—')} · RANK {rank.rank}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/cabinet" className="inline-flex items-center gap-2 border border-line-aqua px-3 py-2 font-mono text-xs uppercase tracking-widest text-aqua transition-colors hover:bg-aqua/10 clip-btn">
          <IdCard size={14} /> Профиль
        </Link>
        <button onClick={() => logout()} className="inline-flex items-center gap-2 border border-line-strong px-3 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-danger hover:text-danger clip-btn">
          <LogOut size={14} /> Выйти
        </button>
      </div>
    </div>
  )
}

export function PortalPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <>
      <Header />
      <section
        className="relative"
        style={{
          backgroundImage: 'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      >
        <Container>
          <div className="py-14">
            {user && <AccountBar />}

            <Label accent>// единая точка входа</Label>
            <h1 className="mt-3 text-4xl sm:text-5xl">Портал <span className="text-aqua">PROTOCOL</span>.</h1>
            <p className="mt-4 max-w-2xl text-ink-soft">
              Один вход — доступ ко всем системам дистанционного формата. Отсюда вы попадаете
              в СДО и другие образовательные проекты, не выходя из аккаунта.
            </p>

            {/* Тест-режим (временно) */}
            <Link
              to="/qa"
              className="clip-hud mt-6 flex flex-wrap items-center justify-between gap-3 border border-line-lime bg-surface p-4 transition-colors hover:bg-lime/5"
            >
              <div className="flex items-center gap-3">
                <FlaskConical size={18} className="text-lime" />
                <div>
                  <div className="font-display text-ink">Чек-лист тестирования</div>
                  <div className="font-mono text-[11px] text-ink-dim">временный раздел — отметьте, что работает, и оставьте пожелания</div>
                </div>
              </div>
              <ArrowRight size={16} className="text-lime" />
            </Link>

            {/* Продукты */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PRODUCTS.map((p) => (
                <motion.div key={p.id} variants={fadeInUp}>
                  <ProductCard p={p} loggedIn={!!user} />
                </motion.div>
              ))}
            </motion.div>

            {/* Обновления */}
            <div className="mt-16">
              <div className="flex items-center justify-between">
                <Label accent>// обновления</Label>
                <Label>changelog</Label>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl">Что нового<span className="text-aqua">.</span></h2>
              <div className="mt-6 flex flex-col divide-y divide-line border border-line bg-surface">
                {CHANGELOG.map((c, i) => (
                  <div key={i} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-5">
                    <div className="flex shrink-0 items-center gap-2 sm:w-56">
                      <span className="font-mono text-[11px] text-ink-dim">{c.date}</span>
                      <span className="border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-aqua">{c.area}</span>
                    </div>
                    <p className="text-sm text-ink-soft">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Документация */}
            <div className="mt-16">
              <div className="flex items-center justify-between">
                <Label accent>// документация</Label>
                <Label>docs</Label>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl">Разделы и материалы<span className="text-aqua">.</span></h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PORTAL_DOCS.map((d) => {
                  const Icon = d.icon
                  const body = (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center border border-line-strong text-aqua clip-btn">
                          <Icon size={18} strokeWidth={1.75} />
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{d.category}</span>
                      </div>
                      <h3 className="mt-3 font-display text-base text-ink">{d.title}</h3>
                      <p className="mt-1 text-xs text-ink-muted">{d.description}</p>
                    </>
                  )
                  const cls = 'clip-hud block h-full border border-line bg-surface p-4 transition-colors hover:border-aqua/50'
                  return d.href ? (
                    <a key={d.id} href={d.href} target="_blank" rel="noreferrer" className={cls}>{body}</a>
                  ) : (
                    <Link key={d.id} to={d.to ?? '/'} className={cls}>{body}</Link>
                  )
                })}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
