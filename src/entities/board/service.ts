import { getItems, getFirst, createRec, updateRec, deleteRec, asId, relStr, relId, relNum, ownerFields, personFields } from '@/shared/api/directus'
export type CompletionStatus = 'submitted' | 'approved' | 'rejected' | 'declined'
export interface BoardTask { id: string; authorId: string; authorName: string; title: string; description: string; target: 'all' | 'group'; groupId: string; groupCode: string; rewardCoins: number; rewardXp: number; created: string }
export interface BoardCompletion { id: string; taskId: string; taskTitle: string; studentId: string; studentName: string; status: CompletionStatus; created: string }
interface TaskRec { id: unknown; author?: unknown; title: string; description?: string; target?: 'all' | 'group'; group?: unknown; reward_coins?: number; reward_xp?: number; created?: string }
interface CompRec { id: unknown; task?: unknown; student?: unknown; status?: CompletionStatus; created?: string }
// NB: код группы на доске в оригинале инлайнился через getFullYear (НЕ academicYear) — сохраняем 1-в-1.
const mapTask = (r: TaskRec): BoardTask => {
  const sy = relNum(r.group, 'start_year', 0)
  const course = sy ? Math.max(1, new Date().getFullYear() - sy + 1) : 0
  const spec = relStr(r.group, 'specialty')
  return { id: String(r.id), authorId: relId(r.author), authorName: relStr(r.author, 'full_name') || relStr(r.author, 'student_id') || '—', title: r.title, description: r.description ?? '', target: r.target ?? 'all', groupId: relId(r.group), groupCode: spec ? `${course}${relNum(r.group, 'index', 1) || 1}-${spec}` : '', rewardCoins: r.reward_coins ?? 0, rewardXp: r.reward_xp ?? 0, created: r.created ?? '' }
}
const mapComp = (r: CompRec): BoardCompletion => ({ id: String(r.id), taskId: relId(r.task), taskTitle: relStr(r.task, 'title'), studentId: relId(r.student), studentName: relStr(r.student, 'full_name') || relStr(r.student, 'student_id') || '—', status: r.status ?? 'submitted', created: r.created ?? '' })
const taskFields = () => ['*', ...personFields('author'), 'group.id', 'group.specialty', 'group.start_year', 'group.index']
const compFields = () => ['*', 'task.id', 'task.title', ...personFields('student')]

export async function fetchTasksForStudent(groupId?: string): Promise<BoardTask[]> {
  const filter = groupId ? { _or: [{ target: { _eq: 'all' } }, { group: { _eq: asId(groupId) } }] } : { target: { _eq: 'all' } }
  return (await getItems<TaskRec>('board_tasks', { filter, sort: '-created', fields: taskFields() })).map(mapTask)
}
export async function fetchTasksByAuthor(authorId: string): Promise<BoardTask[]> {
  return (await getItems<TaskRec>('board_tasks', { filter: { author: { _eq: asId(authorId) } }, sort: '-created', fields: taskFields() })).map(mapTask)
}
export interface NewBoardTask { authorId: string; title: string; description: string; target: 'all' | 'group'; groupId?: string; rewardCoins: number; rewardXp: number; institutionId?: string }
export const publishTask = (i: NewBoardTask) => createRec('board_tasks', { ...ownerFields({ author: asId(i.authorId) }), title: i.title, description: i.description, target: i.target, ...(i.target === 'group' && i.groupId ? { group: asId(i.groupId) } : {}), reward_coins: i.rewardCoins, reward_xp: i.rewardXp, ...ownerFields(i.institutionId ? { institution: asId(i.institutionId) } : {}) }).then(() => {})
export const deleteTask = (id: string) => deleteRec('board_tasks', id)
export async function fetchMyCompletions(studentId: string): Promise<BoardCompletion[]> {
  return (await getItems<CompRec>('board_completions', { filter: { student: { _eq: asId(studentId) } }, sort: '-created', fields: compFields() })).map(mapComp)
}
export const submitCompletion = (taskId: string, studentId: string) => upsert(taskId, studentId, 'submitted')
export const declineTask = (taskId: string, studentId: string) => upsert(taskId, studentId, 'declined')
export async function resetMyCompletion(taskId: string, studentId: string): Promise<void> {
  const rec = await getFirst<CompRec>('board_completions', { task: { _eq: asId(taskId) }, student: { _eq: asId(studentId) } })
  if (rec) await deleteRec('board_completions', String(rec.id))
}
async function upsert(taskId: string, studentId: string, status: CompletionStatus): Promise<void> {
  const existing = await getFirst<CompRec>('board_completions', { task: { _eq: asId(taskId) }, student: { _eq: asId(studentId) } })
  if (existing) await updateRec('board_completions', String(existing.id), { status })
  else await createRec('board_completions', { task: asId(taskId), status })
}
export async function fetchCompletionsForAuthor(authorId: string): Promise<BoardCompletion[]> {
  return (await getItems<CompRec>('board_completions', { filter: { task: { author: { _eq: asId(authorId) } } }, sort: '-created', fields: compFields() })).map(mapComp)
}
export const reviewCompletion = (id: string, status: 'approved' | 'rejected') => updateRec('board_completions', id, { status }).then(() => {})
export async function fetchMyBoardXp(studentId: string): Promise<number> {
  const list = await getItems<CompRec>('board_completions', { filter: { student: { _eq: asId(studentId) }, status: { _eq: 'approved' } }, fields: ['*', 'task.id', 'task.reward_xp'] })
  return list.reduce((s, c) => s + relNum(c.task, 'reward_xp'), 0)
}