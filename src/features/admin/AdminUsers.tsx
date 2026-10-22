import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Search, X, Upload } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { ActionButton } from '@/shared/ui/ActionButton'
import { useToast } from '@/shared/ui/toast'
import { GenerativeAvatar } from '@/features/profile/GenerativeAvatar'
import { useAdminUsers, useAdminInstitutions, useUserMutations, useAdminGroups } from './useAdmin'
import { createUser } from '@/entities/admin/service'
import { useConfirm } from '@/shared/ui/Confirm'
import type { UserRole } from '@/entities/user/types'
import type { NewUser } from '@/entities/admin/service'
import { cn } from '@/shared/lib/cn'

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'

const EMPTY: NewUser = { email: '', password: '', fullName: '', studentId: '', callsign: '', role: 'student', institutionId: '' }

export function AdminUsers({ scope, isSuper }: { scope?: string; isSuper: boolean }) {
  const { t } = useTranslation()
  const { data: users = [], isLoading } = useAdminUsers(scope)
  const { data: institutions = [] } = useAdminInstitutions()
  const { data: groups = [] } = useAdminGroups(scope)
  const m = useUserMutations()
  const confirm = useConfirm()
  const qc = useQueryClient()
  const toast = useToast()

  // импорт из таблицы
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)

  async function runImport() {
    setImporting(true)
    const lines = importText.split('\n').map((l) => l.trim()).filter(Boolean)
    let ok = 0
    const errors: string[] = []
    for (const line of lines) {
      const cols = line.split(/[;,\t]/).map((c) => c.trim())
      const [login, fullName, email, password] = cols
      if (!login || !email || !password || password.length < 8) {
        errors.push(`${login || '?'}: нужны логин, ФИО, email и пароль ≥8`)
        continue
      }
      try {
        await createUser({ email, password, fullName: fullName || '', studentId: login, callsign: login, role: 'student', institutionId: scope ?? institutions[0]?.id ?? '' })
        ok++
      } catch (e) {
        errors.push(`${login}: ${(e as Error).message || 'ошибка'}`)
      }
    }
    setImporting(false)
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
    const summary = `Создано: ${ok}${errors.length ? ` · Ошибок: ${errors.length}` : ''}`
    if (errors.length) toast.error([summary, ...errors.slice(0, 5)].join('\n'), 'импорт с ошибками')
    else toast.success(summary, 'импорт завершён')
    if (ok > 0) setImportText('')
  }

  // супер-админ — любые роли; админ колледжа — только студенты и преподаватели
  const ROLES: UserRole[] = isSuper ? ['student', 'teacher', 'admin', 'superadmin'] : ['student', 'teacher']

  async function remove(id: string, name: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${name} — ${t('admin.u_delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) m.remove.mutate(id, {
      onSuccess: () => toast.success('Удалено', 'готово'),
      onError: (e) => toast.error((e as Error).message || 'не удалено', 'ошибка'),
    })
  }

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<NewUser>(() => ({ ...EMPTY, institutionId: scope ?? '' }))
  const [error, setError] = useState<string | null>(null)

  const roleLabel = (r: UserRole) => t('auth.role_' + r)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        (roleFilter === 'all' || u.role === roleFilter) &&
        (!q || (u.fullName + ' ' + u.studentId + ' ' + u.email + ' ' + u.callsign).toLowerCase().includes(q)),
    )
  }, [users, query, roleFilter])

  function create() {
    setError(null)
    const institutionId = isSuper ? form.institutionId : scope ?? ''
    const needInst = form.role !== 'superadmin' // супер-админ не привязан к колледжу
    if (!form.email.trim() || !form.studentId.trim() || form.password.length < 8 || (needInst && !institutionId)) {
      setError('Заполните email, логин, пароль (от 8 символов)' + (needInst ? ' и заведение.' : '.'))
      return
    }
    m.create.mutate(
      { ...form, institutionId, email: form.email.trim(), studentId: form.studentId.trim(), fullName: form.fullName.trim() },
      { onSuccess: () => { setForm({ ...EMPTY, institutionId: scope ?? '' }); setAdding(false); toast.success('Пользователь создан', 'готово') },
        onError: (e) => { const msg = (e as Error).message || t('admin.err'); setError(msg); toast.error(msg, 'ошибка') }, }
    )
  }

  return (
    <div>
      {/* панель фильтров */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 border border-line-strong bg-surface-2 px-3 clip-btn sm:w-80">
          <Search size={16} className="text-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.u_search')} className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', ...ROLES] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', roleFilter === r ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
            >
              {r === 'all' ? t('admin.u_all_roles') : roleLabel(r)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setImportOpen((v) => !v); setAdding(false) }} className="flex items-center gap-2 border border-line-strong px-3 py-2 font-mono text-xs text-ink-muted transition-colors hover:text-aqua clip-btn">
            <Upload size={14} /> {t('admin.u_import')}
          </button>
          <button onClick={() => { setAdding((v) => !v); setImportOpen(false) }} className="flex items-center gap-2 border border-line-lime px-3 py-2 font-mono text-xs text-lime transition-colors hover:bg-lime/10 clip-btn">
            {adding ? <X size={14} /> : <Plus size={14} />} {t('admin.u_add')}
          </button>
        </div>
      </div>

      {/* импорт из таблицы */}
      {importOpen && (
        <div className="mt-4 border border-line-strong bg-surface p-5">
          <Label>{t('admin.u_import')}</Label>
          <p className="mt-1 text-xs text-ink-muted">{t('admin.u_import_hint')}</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
            placeholder={'ivanov;Иванов Иван;ivanov@mail.ru;pass1234\npetrov;Петров Пётр;petrov@mail.ru;pass5678'}
            className="mt-3 w-full resize-y border border-line-strong bg-surface-2 p-3 font-mono text-xs text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <ActionButton onClick={runImport} pending={importing} disabled={!importText.trim()} icon={<Upload size={15} />}>
              {t('admin.u_import_run')}
            </ActionButton>
          </div>
        </div>
      )}

      {/* форма создания */}
      {adding && (
        <div className="mt-4 grid gap-3 border border-line-lime bg-surface p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label>{t('admin.u_email')}</Label>
            <input className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.u_login')}</Label>
            <input className={field} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="2024-1043" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.u_password')}</Label>
            <input className={field} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="мин. 8 символов" />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.u_full_name')}</Label>
            <input className={field} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.u_role')}</Label>
            <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
          </div>
          {isSuper && (
            <div className="flex flex-col gap-1">
              <Label>{t('admin.u_institution')}</Label>
              <select className={field} value={form.institutionId} onChange={(e) => setForm({ ...form, institutionId: e.target.value })}>
                <option value="">—</option>
                {institutions.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
              </select>
            </div>
          )}
          {form.role === 'student' && (
            <div className="flex flex-col gap-1">
              <Label>{t('admin.u_group')}</Label>
              <select className={field} value={form.groupId ?? ''} onChange={(e) => setForm({ ...form, groupId: e.target.value || undefined })}>
                <option value="">{t('admin.g_none')}</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}
              </select>
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
            <ActionButton onClick={create} pending={m.create.isPending} error={m.create.error} icon={<Plus size={15} />}>{t('admin.u_create')}</ActionButton>
            {error && <span className="font-mono text-xs text-danger">{error}</span>}
          </div>
        </div>
      )}

      {/* список */}
      <div className="mt-5 flex flex-col gap-2">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('admin.u_none')}</div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
              <GenerativeAvatar seed={u.id} rank="F" size={38} />
              <div className="min-w-40 flex-1">
                <div className="truncate text-sm text-ink">{u.fullName || u.callsign || u.studentId}</div>
                <div className="font-mono text-[11px] text-ink-dim">{u.studentId} · {u.email || '—'} · {t('admin.u_level')} {u.level}</div>
              </div>
              <select
                className="h-9 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
                value={u.role}
                onChange={(e) => m.update.mutate({ id: u.id, patch: { role: e.target.value as UserRole } })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              {u.role === 'student' && (
                <select
                  className="h-9 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
                  value={u.groupId}
                  onChange={(e) => m.update.mutate({ id: u.id, patch: { groupId: e.target.value } })}
                  title={t('admin.u_group')}
                >
                  <option value="">{t('admin.g_none')}</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}
                </select>
              )}
              {isSuper ? (
                <select
                  className="h-9 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
                  value={u.institutionId}
                  onChange={(e) => m.update.mutate({ id: u.id, patch: { institutionId: e.target.value } })}
                >
                  <option value="">—</option>
                  {institutions.map((i) => <option key={i.id} value={i.id}>{i.shortName}</option>)}
                </select>
              ) : (
                <span className="font-mono text-[11px] text-ink-dim">{u.institutionShort || '—'}</span>
              )}
              <button
                onClick={() => remove(u.id, u.fullName || u.callsign || u.studentId)}
                className="p-2 text-ink-muted transition-colors hover:text-danger"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
