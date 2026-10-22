import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollText, Download } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { useAuditLogs, useAdminUsers } from './useAdmin'
import { fetchAuditForExport } from '@/entities/admin/service'
import { buildStyledXls, downloadXls } from '@/shared/lib/xlsExport'

function fmt(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'

export function AdminAudit() {
  const { t } = useTranslation()
  const { data: logs = [], isLoading } = useAuditLogs()
  const { data: users = [] } = useAdminUsers()

  const [userId, setUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const u of users) m.set(u.id, u.fullName || u.callsign || u.studentId || u.id)
    return m
  }, [users])

  async function exportXls() {
    setExporting(true)
    try {
      const rows = await fetchAuditForExport({ user: userId || undefined, from: from || undefined, to: to || undefined })
      const subtitleParts = [
        userId ? `${t('admin.a_export_user')}: ${nameById.get(userId) || userId}` : t('admin.a_export_all'),
        from ? `${t('admin.a_export_from')}: ${from}` : null,
        to ? `${t('admin.a_export_to')}: ${to}` : null,
      ].filter(Boolean)
      const xls = buildStyledXls(
        rows,
        [
          { header: t('admin.a_when'), value: (r) => fmt(r.created), width: 140 },
          { header: t('admin.a_action'), value: (r) => r.action, width: 180 },
          { header: t('admin.a_user'), value: (r) => nameById.get(r.user) || r.user || '—', width: 200 },
          { header: t('admin.a_target'), value: (r) => r.target || '—', width: 220 },
        ],
        { title: t('admin.a_export_title'), subtitle: subtitleParts.join(' · ') },
      )
      const stamp = new Date().toISOString().slice(0, 10)
      downloadXls(xls, `protocol-audit-${userId ? (nameById.get(userId) || userId).replace(/\s+/g, '_') : 'all'}-${stamp}.xls`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      {/* панель экспорта */}
      <div className="mb-5 border border-line-lime bg-surface p-5">
        <div className="flex items-center gap-2">
          <Download size={15} className="text-lime" />
          <Label>{t('admin.a_export_title')}</Label>
        </div>
        <p className="mt-1 text-xs text-ink-muted">{t('admin.a_export_hint')}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="flex flex-col gap-1">
            <Label>{t('admin.a_export_user')}</Label>
            <select className={field} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">{t('admin.a_export_all')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName || u.callsign || u.studentId}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.a_export_from')}</Label>
            <input type="date" className={field} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('admin.a_export_to')}</Label>
            <input type="date" className={field} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={exportXls} disabled={exporting}>
            <Download size={15} /> {exporting ? '…' : t('admin.a_export_run')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-line bg-surface p-10 text-center text-ink-muted">
          <ScrollText size={22} className="text-ink-dim" />
          {t('admin.a_empty')}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-widest text-ink-dim">
                <th className="px-4 py-3 font-normal">{t('admin.a_action')}</th>
                <th className="px-4 py-3 font-normal">{t('admin.a_user')}</th>
                <th className="px-4 py-3 font-normal">{t('admin.a_target')}</th>
                <th className="px-4 py-3 font-normal">{t('admin.a_when')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-3">
                    <span className="border border-line-strong px-2 py-0.5 font-mono text-xs text-aqua">{l.action}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{nameById.get(l.user) || l.user || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{l.target || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-dim">{fmt(l.created)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
