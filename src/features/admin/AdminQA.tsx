import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Trash2, FlaskConical } from 'lucide-react'
import { GenerativeAvatar } from '@/features/profile/GenerativeAvatar'
import { useConfirm } from '@/shared/ui/Confirm'
import { fetchQaReports, fetchQaScreenshots, deleteQaReport } from '@/entities/qa/service'

const ROLE_RU: Record<string, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', superadmin: 'Супер-админ' }
const ST_MARK: Record<string, string> = { ok: '✓', bad: '✗', na: '–', none: '·' }
function fmt(iso: string) {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

function ReportDetails({ reportId, sections }: { reportId: string; sections: import('@/entities/qa/service').QaSectionSummary[] }) {
  const { data: shots = [] } = useQuery({ queryKey: ['admin', 'qa-shots', reportId], queryFn: () => fetchQaScreenshots(reportId) })
  return (
    <div className="border-t border-line bg-surface-2/40 p-4">
      {sections.map((s) => (
        <div key={s.role} className="mb-5 last:mb-0">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm text-ink">{s.title}</span>
            <span className="font-mono text-[11px] text-ink-dim">✓ {s.ok} · ✗ {s.bad} · – {s.na} / {s.total}</span>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {s.items.filter((it) => it.status !== 'none' || it.add || it.improve || it.problems).map((it) => {
              const itemShots = shots.filter((sh) => sh.item.startsWith(it.id + ' '))
              return (
                <div key={it.id} className="border border-line bg-surface p-2.5">
                  <div className="text-xs text-ink"><span className="font-mono text-ink-dim">{ST_MARK[it.status] ?? '·'}</span> {it.text}</div>
                  {it.add && <div className="mt-1 text-[11px] text-lime">+ добавить: {it.add}</div>}
                  {it.improve && <div className="mt-0.5 text-[11px] text-aqua">↑ улучшить: {it.improve}</div>}
                  {it.problems && <div className="mt-0.5 text-[11px] text-danger">! проблема: {it.problems}</div>}
                  {itemShots.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {itemShots.map((sh, i) => (
                        <a key={i} href={sh.url} target="_blank" rel="noreferrer">
                          <img src={sh.url} alt="" className="h-16 w-16 border border-line-strong object-cover transition-opacity hover:opacity-80" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {s.note?.trim() && <div className="mt-2 text-xs text-ink-soft"><span className="text-ink-dim">Общее по роли:</span> {s.note}</div>}
        </div>
      ))}
    </div>
  )
}

export function AdminQA() {
  const { data: reports = [], isLoading } = useQuery({ queryKey: ['admin', 'qa'], queryFn: fetchQaReports })
  const qc = useQueryClient()
  const del = useMutation({ meta: { success: 'Отчёт удалён' }, mutationFn: (id: string) => deleteQaReport(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'qa'] }) })
  const confirm = useConfirm()
  const [open, setOpen] = useState<string | null>(null)

  async function remove(id: string) {
    const ok = await confirm({ title: 'Удалить', message: 'Удалить отчёт тестирования?', confirmLabel: 'Удалить', danger: true })
    if (ok) del.mutate(id)
  }

  if (isLoading) return <div className="p-8 text-center font-mono text-sm text-ink-muted">Загрузка…</div>
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border border-line bg-surface p-10 text-center text-ink-muted">
        <FlaskConical size={22} className="text-ink-dim" /> Отчётов по тестированию пока нет.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((r) => (
        <div key={r.id} className="border border-line bg-surface">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-ink-muted hover:text-aqua">
              {open === r.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            <GenerativeAvatar seed={r.reporterId} rank="F" size={36} />
            <div className="min-w-40 flex-1">
              <div className="text-sm text-ink">{r.name || '—'} <span className="font-mono text-[11px] text-ink-dim">· {ROLE_RU[r.role] ?? r.role}</span></div>
              <div className="font-mono text-[11px] text-ink-dim">{fmt(r.created)}</div>
            </div>
            <span className={`border px-2 py-0.5 font-mono text-xs ${r.score === 100 ? 'border-line-lime text-lime' : 'border-line-strong text-aqua'}`}>{r.score}%</span>
            {r.problems > 0 && <span className="border border-line-strong px-2 py-0.5 font-mono text-xs text-danger">проблем: {r.problems}</span>}
            <button onClick={() => remove(r.id)} className="p-2 text-ink-muted hover:text-danger" aria-label="Удалить"><Trash2 size={16} /></button>
          </div>
          {open === r.id && <ReportDetails reportId={r.id} sections={r.sections} />}
        </div>
      ))}
    </div>
  )
}
