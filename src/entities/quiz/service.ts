import { getItems, getItem, createRec, updateRec, deleteRec, asId, parseJson, relStr, relNum } from '@/shared/api/directus'
export type QuestionType = 'single' | 'multi' | 'text'
export interface Quiz { id: string; courseId: string; lessonId: string; authorId: string; title: string; description: string; timeLimit: number; passScore: number; rewardCoins: number; rewardXp: number; published: boolean }
export interface Question { id: string; quizId: string; text: string; type: QuestionType; options: string[]; correct: string[]; points: number; order: number }
export interface Attempt { id: string; quizId: string; quizTitle: string; studentId: string; score: number; passed: boolean; created: string }
interface QuizRec { id: unknown; course?: unknown; lesson?: unknown; author?: unknown; title: string; description?: string; time_limit?: number; pass_score?: number; reward_coins?: number; reward_xp?: number; published?: boolean }
interface QRec { id: unknown; quiz?: unknown; text: string; type?: QuestionType; options?: unknown; correct?: unknown; points?: number; order?: number }
interface ARec { id: unknown; quiz?: unknown; student?: unknown; answers?: unknown; score?: number; passed?: boolean; created?: string }
const rid = (v: unknown) => String(typeof v === 'object' && v ? (v as { id?: unknown }).id : v ?? '')
const mapQuiz = (r: QuizRec): Quiz => ({ id: String(r.id), courseId: rid(r.course), lessonId: rid(r.lesson), authorId: rid(r.author), title: r.title, description: r.description ?? '', timeLimit: r.time_limit ?? 0, passScore: r.pass_score ?? 60, rewardCoins: r.reward_coins ?? 0, rewardXp: r.reward_xp ?? 0, published: !!r.published })
const mapQ = (r: QRec, withCorrect: boolean): Question => ({ id: String(r.id), quizId: rid(r.quiz), text: r.text, type: (r.type ?? 'single') as QuestionType, options: parseJson<string[]>(r.options, []), correct: withCorrect ? parseJson<string[]>(r.correct, []) : [], points: r.points ?? 1, order: r.order ?? 0 })

export async function fetchAuthorQuizzes(authorId: string): Promise<Quiz[]> {
  return (await getItems<QuizRec>('quizzes', { filter: { author: { _eq: asId(authorId) } }, sort: '-created', fields: ['*'] })).map(mapQuiz)
}
export interface NewQuiz { courseId?: string; authorId: string; institutionId?: string; title: string; description?: string; timeLimit?: number; passScore?: number; rewardCoins?: number; rewardXp?: number; published?: boolean }
export async function createQuiz(input: NewQuiz): Promise<string> {
  const rec = await createRec<QuizRec>('quizzes', { ...(input.courseId ? { course: asId(input.courseId) } : {}), author: asId(input.authorId), ...(input.institutionId ? { institution: asId(input.institutionId) } : {}), title: input.title, description: input.description ?? '', time_limit: input.timeLimit ?? 0, pass_score: input.passScore ?? 60, reward_coins: input.rewardCoins ?? 0, reward_xp: input.rewardXp ?? 0, published: !!input.published, created: new Date().toISOString() })
  return String(rec.id)
}
export async function updateQuiz(id: string, patch: Partial<NewQuiz>): Promise<void> {
  const b: Record<string, unknown> = {}
  if (patch.courseId !== undefined) b.course = asId(patch.courseId)
  if (patch.title !== undefined) b.title = patch.title
  if (patch.description !== undefined) b.description = patch.description
  if (patch.timeLimit !== undefined) b.time_limit = patch.timeLimit
  if (patch.passScore !== undefined) b.pass_score = patch.passScore
  if (patch.rewardCoins !== undefined) b.reward_coins = patch.rewardCoins
  if (patch.rewardXp !== undefined) b.reward_xp = patch.rewardXp
  if (patch.published !== undefined) b.published = patch.published
  await updateRec('quizzes', id, b)
}
export const deleteQuiz = (id: string) => deleteRec('quizzes', id)
export async function fetchQuizQuestions(quizId: string): Promise<Question[]> {
  return (await getItems<QRec>('quiz_questions', { filter: { quiz: { _eq: asId(quizId) } }, sort: 'order', fields: ['*'] })).map((r) => mapQ(r, true))
}
export interface NewQuestion { quizId: string; text: string; type: QuestionType; options: string[]; correct: string[]; points: number; order: number }
export const addQuestion = (i: NewQuestion) => createRec('quiz_questions', { quiz: asId(i.quizId), text: i.text, type: i.type, options: i.options, correct: i.correct, points: i.points, order: i.order }).then(() => {})
export async function updateQuestion(id: string, patch: Partial<NewQuestion>): Promise<void> {
  const b: Record<string, unknown> = {}
  if (patch.text !== undefined) b.text = patch.text
  if (patch.type !== undefined) b.type = patch.type
  if (patch.options !== undefined) b.options = patch.options
  if (patch.correct !== undefined) b.correct = patch.correct
  if (patch.points !== undefined) b.points = patch.points
  if (patch.order !== undefined) b.order = patch.order
  await updateRec('quiz_questions', id, b)
}
export const deleteQuestion = (id: string) => deleteRec('quiz_questions', id)
export async function fetchPublishedQuizzes(): Promise<Quiz[]> {
  return (await getItems<QuizRec>('quizzes', { filter: { published: { _eq: true } }, sort: '-created', fields: ['*'] })).map(mapQuiz)
}
export async function fetchQuizForTake(quizId: string): Promise<{ quiz: Quiz; questions: Question[] }> {
  const quiz = mapQuiz(await getItem<QuizRec>('quizzes', quizId))
  const qlist = await getItems<QRec>('quiz_questions', { filter: { quiz: { _eq: asId(quizId) } }, sort: 'order', fields: ['*'] })
  return { quiz, questions: qlist.map((r) => mapQ(r, false)) }
}
/** NB: score/passed считает серверный хук (шаг 2). Сейчас возвращаем 0/false. */
export async function submitAttempt(quizId: string, studentId: string, answers: Record<string, unknown>): Promise<{ score: number; passed: boolean }> {
  const rec = await createRec<ARec>('quiz_attempts', { quiz: asId(quizId), student: asId(studentId), answers, created: new Date().toISOString() })
  return { score: rec.score ?? 0, passed: !!rec.passed }
}
export async function fetchMyAttempts(studentId: string): Promise<Attempt[]> {
  const list = await getItems<ARec>('quiz_attempts', { filter: { student: { _eq: asId(studentId) } }, sort: '-created', fields: ['*', 'quiz.id', 'quiz.title'] })
  return list.map((r) => ({ id: String(r.id), quizId: rid(r.quiz), quizTitle: relStr(r.quiz, 'title'), studentId: rid(r.student), score: r.score ?? 0, passed: !!r.passed, created: r.created ?? '' }))
}
export async function fetchMyQuizXp(studentId: string): Promise<number> {
  const list = await getItems<ARec>('quiz_attempts', { filter: { student: { _eq: asId(studentId) }, passed: { _eq: true } }, fields: ['*', 'quiz.id', 'quiz.reward_xp'] })
  const seen = new Set<string>(); let xp = 0
  for (const a of list) { const qid = rid(a.quiz); if (seen.has(qid)) continue; seen.add(qid); xp += relNum(a.quiz, 'reward_xp') }
  return xp
}