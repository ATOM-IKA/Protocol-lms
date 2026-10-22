import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, ChevronRight, Check, Play, CheckCircle2, XCircle } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { Coin } from '@/features/currency/Coin'
import { useAuthStore } from '@/features/auth/authStore'
import { usePublishedCourses } from '@/features/courses/useCourses'
import { useConfirm } from '@/shared/ui/Confirm'
import { cn } from '@/shared/lib/cn'
import {
  useAuthorQuizzes,
  usePublishedQuizzes,
  useQuizQuestions,
  useMyAttempts,
  useQuizMutations,
} from '@/features/quiz/useQuiz'
import type { Quiz, QuestionType } from '@/entities/quiz/service'

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'

// ---- редактор вопросов одного теста ----------------------------------------
function QuestionEditor({ quiz }: { quiz: Quiz }) {
  const { t } = useTranslation()
  const { data: questions = [] } = useQuizQuestions(quiz.id)
  const m = useQuizMutations()
  const confirm = useConfirm()

  const [text, setText] = useState('')
  const [type, setType] = useState<QuestionType>('single')
  const [optionsText, setOptionsText] = useState('')
  const [correct, setCorrect] = useState<string[]>([])
  const [textAnswers, setTextAnswers] = useState('')
  const [points, setPoints] = useState(1)

  const options = useMemo(() => optionsText.split('\n').map((s) => s.trim()).filter(Boolean), [optionsText])

  function toggleCorrect(idx: string) {
    if (type === 'single') setCorrect([idx])
    else setCorrect((c) => (c.includes(idx) ? c.filter((x) => x !== idx) : [...c, idx]))
  }

  function add() {
    if (!text.trim()) return
    const correctVals = type === 'text' ? textAnswers.split('\n').map((s) => s.trim()).filter(Boolean) : correct
    if (type !== 'text' && (options.length < 2 || correctVals.length === 0)) return
    m.addQuestion.mutate(
      { quizId: quiz.id, text: text.trim(), type, options: type === 'text' ? [] : options, correct: correctVals, points, order: questions.length },
      { onSuccess: () => { setText(''); setOptionsText(''); setCorrect([]); setTextAnswers(''); setPoints(1) } },
    )
  }
  async function removeQ(id: string) {
    const ok = await confirm({ title: t('common.delete'), message: t('quiz.q_delete_confirm'), confirmLabel: t('common.delete'), danger: true })
    if (ok) m.removeQuestion.mutate(id)
  }

  return (
    <div className="border-t border-line bg-surface-2/40 p-4">
      <Label accent>{t('quiz.questions')} · {questions.length}</Label>
      <div className="mt-3 flex flex-col gap-2">
        {questions.map((q, i) => (
          <div key={q.id} className="flex items-start justify-between gap-3 border border-line bg-surface px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm text-ink">{i + 1}. {q.text}</div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-dim">{t('quiz.type_' + q.type)} · {q.points} {t('quiz.points')}</div>
            </div>
            <button onClick={() => removeQ(q.id)} className="shrink-0 p-1.5 text-ink-muted hover:text-danger" aria-label={t('common.delete')}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      {/* добавить вопрос */}
      <div className="mt-4 border border-line-lime bg-surface p-4">
        <Label>{t('quiz.add_question')}</Label>
        <textarea className={cn(field, 'mt-2 h-auto py-2')} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('quiz.q_text_ph')} />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <select className={field} value={type} onChange={(e) => { setType(e.target.value as QuestionType); setCorrect([]) }}>
            <option value="single">{t('quiz.type_single')}</option>
            <option value="multi">{t('quiz.type_multi')}</option>
            <option value="text">{t('quiz.type_text')}</option>
          </select>
          <input type="number" min={1} className={field} value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} placeholder={t('quiz.points')} />
        </div>

        {type === 'text' ? (
          <div className="mt-2">
            <Label>{t('quiz.correct_answers')}</Label>
            <textarea className={cn(field, 'mt-1 h-auto py-2')} rows={2} value={textAnswers} onChange={(e) => setTextAnswers(e.target.value)} placeholder={t('quiz.answers_ph')} />
          </div>
        ) : (
          <div className="mt-2">
            <Label>{t('quiz.options_hint')}</Label>
            <textarea className={cn(field, 'mt-1 h-auto py-2')} rows={3} value={optionsText} onChange={(e) => { setOptionsText(e.target.value); setCorrect([]) }} placeholder={t('quiz.options_ph')} />
            {options.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
                <span className="font-mono text-[11px] text-ink-dim">{t('quiz.mark_correct')}:</span>
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleCorrect(String(idx))}
                    className={cn('flex items-center gap-2 border px-3 py-1.5 text-left text-sm transition-colors', correct.includes(String(idx)) ? 'border-line-lime text-lime' : 'border-line-strong text-ink-soft hover:border-aqua/50')}
                  >
                    <span className={cn('flex h-4 w-4 items-center justify-center border', correct.includes(String(idx)) ? 'border-lime bg-lime/20' : 'border-line-strong')}>
                      {correct.includes(String(idx)) && <Check size={11} className="text-lime" />}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Button className="mt-3" size="sm" onClick={add} disabled={m.addQuestion.isPending || !text.trim()}>
          <Plus size={14} /> {t('quiz.add_question')}
        </Button>
      </div>
    </div>
  )
}

// ---- преподаватель ---------------------------------------------------------
function TeacherQuizzes() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: quizzes = [] } = useAuthorQuizzes(user?.id)
  const { data: courses = [] } = usePublishedCourses()
  const myCourses = useMemo(() => courses.filter((c) => c.ownerId === user?.id || user?.role !== 'teacher'), [courses, user])
  const m = useQuizMutations()
  const confirm = useConfirm()

  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [passScore, setPassScore] = useState(60)
  const [coins, setCoins] = useState(15)
  const [xp, setXp] = useState(30)
  const [open, setOpen] = useState<string | null>(null)

  function create() {
    if (!title.trim() || !user) return
    m.create.mutate(
      { title: title.trim(), authorId: user.id, courseId: courseId || undefined, institutionId: user.institutionId || undefined, passScore, rewardCoins: coins, rewardXp: xp, published: false },
      { onSuccess: (id) => { setTitle(''); setOpen(id) } },
    )
  }
  async function removeQuiz(id: string, name: string) {
    const ok = await confirm({ title: t('common.delete'), message: `${name} — ${t('quiz.delete_confirm')}`, confirmLabel: t('common.delete'), danger: true })
    if (ok) m.remove.mutate(id)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line-lime bg-surface p-5">
        <Label>{t('quiz.new')}</Label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className={cn(field, 'sm:col-span-2')} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('quiz.title_ph')} />
          <select className={field} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">{t('quiz.no_course')}</option>
            {myCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input type="number" min={1} max={100} className={field} value={passScore} onChange={(e) => setPassScore(Number(e.target.value) || 60)} placeholder={t('quiz.pass_score')} />
          <input type="number" min={0} className={field} value={coins} onChange={(e) => setCoins(Number(e.target.value) || 0)} placeholder={t('quiz.reward_coins')} />
          <input type="number" min={0} className={field} value={xp} onChange={(e) => setXp(Number(e.target.value) || 0)} placeholder={t('quiz.reward_xp')} />
        </div>
        <Button className="mt-3" onClick={create} disabled={m.create.isPending || !title.trim()}><Plus size={15} /> {t('quiz.create')}</Button>
      </div>

      <div className="flex flex-col gap-3">
        {quizzes.length === 0 && <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('quiz.empty_teacher')}</div>}
        {quizzes.map((q) => (
          <div key={q.id} className="border border-line bg-surface">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button onClick={() => setOpen(open === q.id ? null : q.id)} className="text-ink-muted hover:text-aqua">
                {open === q.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              <div className="min-w-40 flex-1">
                <div className="text-sm text-ink">{q.title}</div>
                <div className="font-mono text-[11px] text-ink-dim">{t('quiz.pass_score')}: {q.passScore}% · <Coin size={11} className="inline" /> {q.rewardCoins} · {q.rewardXp} XP</div>
              </div>
              <button
                onClick={() => m.update.mutate({ id: q.id, patch: { published: !q.published } })}
                className={cn('border px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors clip-btn', q.published ? 'border-line-lime text-lime' : 'border-line-strong text-ink-muted hover:text-ink')}
              >
                {q.published ? t('quiz.published') : t('quiz.draft')}
              </button>
              <button onClick={() => removeQuiz(q.id, q.title)} className="p-2 text-ink-muted hover:text-danger" aria-label={t('common.delete')}><Trash2 size={16} /></button>
            </div>
            {open === q.id && <QuestionEditor quiz={q} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- студент ---------------------------------------------------------------
function StudentQuizzes() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: quizzes = [], isLoading } = usePublishedQuizzes()
  const { data: attempts = [] } = useMyAttempts(user?.id, true)

  const bestByQuiz = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of attempts) m.set(a.quizId, Math.max(m.get(a.quizId) ?? 0, a.score))
    return m
  }, [attempts])

  if (isLoading) return <div className="p-8 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Label accent>{t('quiz.available')}</Label>
        <div className="mt-3 flex flex-col gap-3">
          {quizzes.length === 0 && <div className="border border-line bg-surface p-8 text-center text-ink-muted">{t('quiz.empty_student')}</div>}
          {quizzes.map((q) => {
            const best = bestByQuiz.get(q.id)
            return (
              <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface p-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg text-ink">{q.title}</h3>
                  {q.description && <p className="mt-1 text-sm text-ink-soft">{q.description}</p>}
                  <div className="mt-2 flex items-center gap-3 font-mono text-xs">
                    <span className="flex items-center gap-1 text-amber-300"><Coin size={14} /> +{q.rewardCoins}</span>
                    <span className="text-lime">+{q.rewardXp} XP</span>
                    <span className="text-ink-dim">{t('quiz.pass_score')} {q.passScore}%</span>
                    {best != null && <span className={best >= q.passScore ? 'text-lime' : 'text-ink-muted'}>{t('quiz.your_best')}: {best}%</span>}
                  </div>
                </div>
                <Link to={`/app/quiz/${q.id}`}>
                  <Button size="sm"><Play size={14} /> {best != null ? t('quiz.retake') : t('quiz.take')}</Button>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {attempts.length > 0 && (
        <div>
          <Label accent>{t('quiz.history')}</Label>
          <div className="mt-3 flex flex-col gap-2">
            {attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border border-line bg-surface px-4 py-2.5">
                <span className="text-sm text-ink">{a.quizTitle}</span>
                <span className={cn('flex items-center gap-1.5 font-mono text-xs', a.passed ? 'text-lime' : 'text-danger')}>
                  {a.passed ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {a.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function QuizzesPage() {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.user?.role ?? 'student')
  const isTeacher = role === 'teacher' || role === 'admin' || role === 'superadmin'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <Label accent>{t('quiz.kicker')}</Label>
        <Label>{t('quiz.badge')}</Label>
      </div>
      <h1 className="mt-3 text-3xl sm:text-4xl">{t('quiz.title')}<span className="text-aqua">.</span></h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">{isTeacher ? t('quiz.lead_teacher') : t('quiz.lead_student')}</p>
      <div className="mt-8">{isTeacher ? <TeacherQuizzes /> : <StudentQuizzes />}</div>
    </div>
  )
}
