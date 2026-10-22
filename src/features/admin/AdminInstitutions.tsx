import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, School } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useAdminInstitutions, useInstitutionMutations } from './useAdmin'
import { useConfirm } from '@/shared/ui/Confirm'

const field = 'h-11 border border-line-strong bg-surface-2 px-3 text-sm text-ink focus:border-aqua focus:outline-none'

export function AdminInstitutions() {
  const { t } = useTranslation()
  const { data: list = [] } = useAdminInstitutions()
  const m = useInstitutionMutations()
  const confirm = useConfirm()
  const [name, setName] = useState('')
  const [short, setShort] = useState('')

  async function remove(id: string, label: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${label} — ${t('admin.i_delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) m.remove.mutate(id)
  }

  function create() {
    if (!name.trim() || !short.trim()) return
    m.create.mutate({ name: name.trim(), shortName: short.trim() }, { onSuccess: () => { setName(''); setShort('') } })
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 border border-line bg-surface p-4">
        <div className="flex min-w-56 flex-1 flex-col gap-1">
          <Label>{t('admin.i_name')}</Label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Белгородский индустриальный колледж" />
        </div>
        <div className="flex w-32 flex-col gap-1">
          <Label>{t('admin.i_short')}</Label>
          <input className={field} value={short} onChange={(e) => setShort(e.target.value)} placeholder="БИК" />
        </div>
        <Button onClick={create} disabled={m.create.isPending || !name.trim() || !short.trim()}>
          <Plus size={15} /> {t('admin.i_create')}
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {list.length === 0 && (
          <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('admin.i_none')}</div>
        )}
        {list.map((i) => (
          <div key={i.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-strong text-aqua">
              <School size={16} />
            </span>
            <input
              className={`${field} min-w-48 flex-1`}
              defaultValue={i.name}
              onBlur={(e) => e.target.value.trim() && e.target.value !== i.name && m.update.mutate({ id: i.id, patch: { name: e.target.value.trim() } })}
            />
            <input
              className={`${field} w-28`}
              defaultValue={i.shortName}
              onBlur={(e) => e.target.value.trim() && e.target.value !== i.shortName && m.update.mutate({ id: i.id, patch: { shortName: e.target.value.trim() } })}
            />
            <button
              onClick={() => remove(i.id, i.name)}
              className="p-2 text-ink-muted transition-colors hover:text-danger"
              aria-label={t('common.delete')}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
