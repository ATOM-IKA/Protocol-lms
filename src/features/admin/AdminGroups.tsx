import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, Users2 } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useAdminGroups, useGroupMutations, useAdminUsers } from './useAdmin'
import { useConfirm } from '@/shared/ui/Confirm'

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'
const CUR_YEAR = new Date().getFullYear()

export function AdminGroups({ scope }: { scope?: string }) {
  const { t } = useTranslation()
  const { data: groups = [] } = useAdminGroups(scope)
  const { data: users = [] } = useAdminUsers(scope)
  const teachers = users.filter((u) => u.role === 'teacher')
  const m = useGroupMutations()
  const confirm = useConfirm()

  const [specialty, setSpecialty] = useState('')
  const [index, setIndex] = useState(1)
  const [startYear, setStartYear] = useState(CUR_YEAR)
  const [curatorId, setCuratorId] = useState('')

  function create() {
    if (!specialty.trim()) return
    m.create.mutate(
      { specialty: specialty.trim(), index, startYear, curatorId: curatorId || undefined, institutionId: scope },
      { onSuccess: () => { setSpecialty(''); setIndex(1); setCuratorId('') } },
    )
  }
  async function remove(id: string, code: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${code} — ${t('admin.g_delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) m.remove.mutate(id)
  }

  return (
    <div>
      <div className="grid gap-3 border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="lg:col-span-2 flex flex-col gap-1">
          <Label>{t('admin.g_specialty')}</Label>
          <input className={field} value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="ИСиП-ИИ" />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t('admin.g_index')}</Label>
          <input type="number" min={1} className={field} value={index} onChange={(e) => setIndex(Number(e.target.value) || 1)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t('admin.g_start_year')}</Label>
          <input type="number" min={2000} className={field} value={startYear} onChange={(e) => setStartYear(Number(e.target.value) || CUR_YEAR)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t('admin.g_curator')}</Label>
          <select className={field} value={curatorId} onChange={(e) => setCuratorId(e.target.value)}>
            <option value="">—</option>
            {teachers.map((tch) => <option key={tch.id} value={tch.id}>{tch.fullName || tch.studentId}</option>)}
          </select>
        </div>
        <div className="lg:col-span-5">
          <Button onClick={create} disabled={m.create.isPending || !specialty.trim()}><Plus size={15} /> {t('admin.g_create')}</Button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {groups.length === 0 && <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('admin.g_none')}</div>}
        {groups.map((g) => (
          <div key={g.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong text-aqua"><Users2 size={16} /></span>
            <div className="min-w-40 flex-1">
              <div className="text-sm text-ink">{g.code}</div>
              <div className="font-mono text-[11px] text-ink-dim">
                {t('admin.g_specialty')}: {g.specialty} · {t('admin.g_start_year')}: {g.startYear}
              </div>
            </div>
            <select
              className="h-9 border border-line-strong bg-surface-2 px-2 text-xs text-ink focus:border-aqua focus:outline-none"
              value={g.curatorId}
              onChange={(e) => m.update.mutate({ id: g.id, patch: { curatorId: e.target.value } })}
            >
              <option value="">{t('admin.g_no_curator')}</option>
              {teachers.map((tch) => <option key={tch.id} value={tch.id}>{tch.fullName || tch.studentId}</option>)}
            </select>
            <button onClick={() => remove(g.id, g.code)} className="p-2 text-ink-muted transition-colors hover:text-danger" aria-label={t('common.delete')}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
