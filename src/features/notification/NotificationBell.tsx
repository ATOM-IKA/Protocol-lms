import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, GraduationCap, ClipboardList, Info, CheckCheck } from 'lucide-react'
import { useAuthStore } from '@/features/auth/authStore'
import { useMyNotifications, useNotifActions } from './useNotifications'
import type { NotifKind } from '@/entities/notification/service'
import { cn } from '@/shared/lib/cn'

const ICON: Record<NotifKind, typeof Bell> = { grade: GraduationCap, board: ClipboardList, system: Info }

function ago(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  if (isNaN(d)) return ''
  const m = Math.round((Date.now() - d) / 60000)
  if (m < 1) return 'только что'
  if (m < 60) return m + ' мин'
  const h = Math.round(m / 60)
  if (h < 24) return h + ' ч'
  return Math.round(h / 24) + ' дн'
}

export function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: items = [] } = useMyNotifications(user?.id ?? '', !!user)
  const actions = useNotifActions(user?.id ?? '')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!user) return null
  const unread = items.filter((n) => !n.read).length

  function openItem(id: string, link: string, read: boolean) {
    if (!read) actions.read.mutate(id)
    setOpen(false)
    if (link) navigate(link)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notif.title')}
        className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-line-strong text-ink-muted transition-colors hover:border-aqua/60 hover:text-ink"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 font-mono text-[10px] font-bold text-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="clip-hud absolute right-0 z-50 mt-2 w-80 border border-line-aqua bg-surface shadow-[0_0_30px_rgba(0,0,0,0.5)]"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-aqua">{t('notif.title')}</span>
              {unread > 0 && (
                <button onClick={() => actions.readAll.mutate()} className="flex items-center gap-1 font-mono text-[10px] text-ink-dim transition-colors hover:text-aqua">
                  <CheckCheck size={12} /> {t('notif.read_all')}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ink-muted">{t('notif.empty')}</div>
              ) : (
                items.map((n) => {
                  const Icon = ICON[n.kind]
                  return (
                    <button
                      key={n.id}
                      onClick={() => openItem(n.id, n.link, n.read)}
                      className={cn('flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2', !n.read && 'bg-aqua/[0.04]')}
                    >
                      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border', n.read ? 'border-line-strong text-ink-dim' : 'border-line-aqua text-aqua')}>
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={cn('truncate text-sm', n.read ? 'text-ink-muted' : 'text-ink')}>{n.title}</span>
                          <span className="shrink-0 font-mono text-[10px] text-ink-dim">{ago(n.created)}</span>
                        </span>
                        {n.text && <span className="mt-0.5 block truncate text-xs text-ink-muted">{n.text}</span>}
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
