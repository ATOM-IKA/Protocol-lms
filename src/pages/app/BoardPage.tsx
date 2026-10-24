import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Plus, Trash2, Check, X, Send, Clock, CheckCircle2, XCircle, Ban, RotateCcw } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { Coin } from '@/features/currency/Coin'
import { useAuthStore } from '@/features/auth/authStore'
import { useAdminGroups } from '@/features/admin/useAdmin'
import { useConfirm } from '@/shared/ui/Confirm'
import { cn } from '@/shared/lib/cn'
import {
  useStudentTasks,
  useMyCompletions,
  useAuthorTasks,
  useAuthorCompletions,
  useBoardMutations,
} from '@/features/board/useBoard'
import type { CompletionStatus } from '@/entities/board/service'
import type { BoardTask } from '@/entities/board/service'

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'

function RewardBadges({ coins, xp }: { coins: number; xp: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      {coins > 0 && (
        <span className="flex items-center gap-1 text-amber-300"><Coin size={16} /> +{coins}</span>
      )}
      {xp > 0 && <span className="text-lime">+{xp} {t('board.xp')}</span>}
    </div>
  )
}

// ---- студент ----------------------------------------------------------------
type StudentTab = 'all' | 'active' | 'done' | 'declined'

function TaskCard({ task, actions, badge }: { task: BoardTask; actions?: ReactNode; badge?: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-aqua">
              {task.target === 'all' ? t('board.for_all') : task.groupCode || t('board.for_group')}
            </span>
            <span className="font-mono text-[11px] text-ink-dim">{task.authorName}</span>
          </div>
          <h3 className="mt-2 text-lg text-ink">{task.title}</h3>
          {task.description && <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{task.description}</p>}
          <div className="mt-3"><RewardBadges coins={task.rewardCoins} xp={task.rewardXp} /></div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {badge}
          {actions}
        </div>
      </div>
    </div>
  )
}

function StudentBoard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useStudentTasks(user?.groupId)
  const { data: mine = [] } = useMyCompletions(user?.id)
  const m = useBoardMutations()
  const [tab, setTab] = useState<StudentTab>('all')

  const statusByTask = useMemo(() => {
    const map = new Map<string, CompletionStatus>()
    for (const c of mine) map.set(c.taskId, c.status)
    return map
  }, [mine])

  const buckets = useMemo(() => {
    const all: BoardTask[] = []
    const active: BoardTask[] = []
    const done: BoardTask[] = []
    const declined: BoardTask[] = []
    for (const task of tasks) {
      const st = statusByTask.get(task.id)
      if (st === 'submitted') active.push(task)
      else if (st === 'approved') done.push(task)
      else if (st === 'declined') declined.push(task)
      else all.push(task) // не тронуто или отклонено преподавателем (можно переделать)
    }
    return { all, active, done, declined }
  }, [tasks, statusByTask])

  const sid = user?.id
  const submit = (id: string) => sid && m.submit.mutate({ taskId: id, studentId: sid })
  const decline = (id: string) => sid && m.decline.mutate({ taskId: id, studentId: sid })
  const reset = (id: string) => sid && m.reset.mutate({ taskId: id, studentId: sid })

  const TABS: { id: StudentTab; label: string; count: number }[] = [
    { id: 'all', label: t('board.tab_all'), count: buckets.all.length },
    { id: 'active', label: t('board.tab_active'), count: buckets.active.length },
    { id: 'done', label: t('board.tab_done'), count: buckets.done.length },
    { id: 'declined', label: t('board.tab_declined'), count: buckets.declined.length },
  ]

  if (isLoading) return <div className="p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>

  const list = buckets[tab]

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn('flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors clip-btn', tab === tb.id ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
          >
            {tb.label} <span className="text-ink-dim">{tb.count}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-line bg-surface p-10 text-center text-ink-muted">
          <ClipboardList size={22} className="text-ink-dim" /> {t('board.empty_' + tab)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((task) => {
            const st = statusByTask.get(task.id)
            if (tab === 'all') {
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  badge={st === 'rejected' ? <span className="flex items-center gap-1.5 font-mono text-xs text-danger"><XCircle size={15} /> {t('board.st_rejected')}</span> : undefined}
                  actions={
                    <div className="flex flex-col items-end gap-2">
                      <Button size="sm" onClick={() => submit(task.id)} disabled={m.submit.isPending}>
                        <Send size={14} /> {st === 'rejected' ? t('board.retry') : t('board.submit')}
                      </Button>
                      <button onClick={() => decline(task.id)} disabled={m.decline.isPending} className="flex items-center gap-1 py-2.5 font-mono text-[11px] text-ink-muted transition-colors hover:text-danger">
                        <Ban size={13} /> {t('board.decline')}
                      </button>
                    </div>
                  }
                />
              )
            }
            if (tab === 'active') {
              return <TaskCard key={task.id} task={task} badge={<span className="flex items-center gap-1.5 font-mono text-xs text-ink-muted"><Clock size={15} /> {t('board.st_submitted')}</span>} />
            }
            if (tab === 'done') {
              return <TaskCard key={task.id} task={task} badge={<span className="flex items-center gap-1.5 font-mono text-xs text-lime"><CheckCircle2 size={15} /> {t('board.st_approved')}</span>} />
            }
            return (
              <TaskCard
                key={task.id}
                task={task}
                badge={<span className="flex items-center gap-1.5 font-mono text-xs text-ink-muted"><Ban size={15} /> {t('board.st_declined')}</span>}
                actions={
                  <button onClick={() => reset(task.id)} disabled={m.reset.isPending} className="flex items-center gap-1 py-2.5 font-mono text-[11px] text-aqua transition-colors hover:underline">
                    <RotateCcw size={13} /> {t('board.return')}
                  </button>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- преподаватель / админ --------------------------------------------------
function TeacherBoard() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const scope = user?.role === 'superadmin' ? undefined : user?.institutionId
  const { data: groups = [] } = useAdminGroups(scope)
  const { data: tasks = [] } = useAuthorTasks(user?.id)
  const { data: completions = [] } = useAuthorCompletions(user?.id)
  const m = useBoardMutations()
  const confirm = useConfirm()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState<'all' | 'group'>('all')
  const [groupId, setGroupId] = useState('')
  const [coins, setCoins] = useState(10)
  const [xp, setXp] = useState(20)

  const pending = completions.filter((c) => c.status === 'submitted')

  function publish() {
    if (!title.trim() || !user) return
    if (target === 'group' && !groupId) return
    m.publish.mutate(
      {
        authorId: user.id,
        title: title.trim(),
        description: description.trim(),
        target,
        groupId: target === 'group' ? groupId : undefined,
        rewardCoins: coins,
        rewardXp: xp,
        institutionId: user.institutionId || undefined,
      },
      { onSuccess: () => { setTitle(''); setDescription(''); setCoins(10); setXp(20) } },
    )
  }
  async function remove(id: string, name: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${name} — ${t('board.delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) m.remove.mutate(id)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* публикация */}
      <div className="border border-line-lime bg-surface p-5">
        <div className="flex items-center gap-2"><Plus size={15} className="text-lime" /><Label>{t('board.publish_title')}</Label></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label>{t('board.f_title')}</Label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('board.f_title_ph')} />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <Label>{t('board.f_desc')}</Label>
            <textarea className={field + ' h-auto py-2'} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('board.f_target')}</Label>
            <select className={field} value={target} onChange={(e) => setTarget(e.target.value as 'all' | 'group')}>
              <option value="all">{t('board.for_all')}</option>
              <option value="group">{t('board.for_group')}</option>
            </select>
          </div>
          {target === 'group' && (
            <div className="flex flex-col gap-1">
              <Label>{t('board.f_group')}</Label>
              <select className={field} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                <option value="">—</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.code}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Label>{t('board.f_coins')}</Label>
            <input type="number" min={0} className={field} value={coins} onChange={(e) => setCoins(Number(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label>{t('board.f_xp')}</Label>
            <input type="number" min={0} className={field} value={xp} onChange={(e) => setXp(Number(e.target.value) || 0)} />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={publish} disabled={m.publish.isPending || !title.trim() || (target === 'group' && !groupId)}>
            <Plus size={15} /> {t('board.publish')}
          </Button>
        </div>
      </div>

      {/* заявки на проверку */}
      <div>
        <Label accent>{t('board.review_title')}</Label>
        <div className="mt-3 flex flex-col gap-2">
          {pending.length === 0 ? (
            <div className="border border-line bg-surface p-6 text-center text-sm text-ink-muted">{t('board.review_empty')}</div>
          ) : (
            pending.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
                <div className="min-w-40 flex-1">
                  <div className="text-sm text-ink">{c.studentName}</div>
                  <div className="font-mono text-[11px] text-ink-dim">{c.taskTitle}</div>
                </div>
                <button onClick={() => m.review.mutate({ id: c.id, status: 'approved' })} className="flex items-center gap-1.5 border border-line-lime px-3 py-1.5 font-mono text-xs text-lime transition-colors hover:bg-lime/10 clip-btn">
                  <Check size={14} /> {t('board.approve')}
                </button>
                <button onClick={() => m.review.mutate({ id: c.id, status: 'rejected' })} className="flex items-center gap-1.5 border border-line-strong px-3 py-1.5 font-mono text-xs text-danger transition-colors hover:bg-danger/10 clip-btn">
                  <X size={14} /> {t('board.reject')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* мои задания */}
      <div>
        <Label accent>{t('board.my_tasks')}</Label>
        <div className="mt-3 flex flex-col gap-2">
          {tasks.length === 0 ? (
            <div className="border border-line bg-surface p-6 text-center text-sm text-ink-muted">{t('board.empty_teacher')}</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3">
                <span className="border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-aqua">
                  {task.target === 'all' ? t('board.for_all') : task.groupCode || t('board.for_group')}
                </span>
                <div className="min-w-40 flex-1">
                  <div className="text-sm text-ink">{task.title}</div>
                  <div className="mt-1"><RewardBadges coins={task.rewardCoins} xp={task.rewardXp} /></div>
                </div>
                <button onClick={() => remove(task.id, task.title)} className="p-2 text-ink-muted transition-colors hover:text-danger" aria-label={t('common.delete')}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function BoardPage() {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.user?.role ?? 'student')
  const isTeacher = role === 'teacher' || role === 'admin' || role === 'superadmin'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Label accent>{t('board.kicker')}</Label>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('board.title')}<span className="text-aqua">.</span></h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{isTeacher ? t('board.lead_teacher') : t('board.lead_student')}</p>
      <div className="mt-8">{isTeacher ? <TeacherBoard /> : <StudentBoard />}</div>
    </div>
  )
}
