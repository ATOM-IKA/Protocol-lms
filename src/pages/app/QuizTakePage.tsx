import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, CheckCircle2, XCircle, Send } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { useAuthStore } from '@/features/auth/authStore'
import { useQuizForTake, useQuizMutations } from '@/features/quiz/useQuiz'
import { cn } from '@/shared/lib/cn'

const field = 'h-11 w-full border border-line-strong bg-surface-2 px-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none'

export function QuizTakePage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useQuizForTake(id)
  const m = useQuizMutations()

  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  if (isLoading || !data) return <div className="mx-auto max-w-3xl px-4 py-16 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
  const { quiz, questions } = data

  function setSingle(qid: string, idx: string) {
    setAnswers((a) => ({ ...a, [qid]: idx }))
  }
  function toggleMulti(qid: string, idx: string) {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? (a[qid] as string[]) : []
      return { ...a, [qid]: cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx] }
    })
  }
  function setText(qid: string, val: string) {
    setAnswers((a) => ({ ...a, [qid]: val }))
  }

  function submit() {
    if (!user || !id) return
    m.submit.mutate(
      { quizId: id, studentId: user.id, answers },
      { onSuccess: (res) => setResult(res) },
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        {result.passed ? <CheckCircle2 size={56} className="mx-auto text-lime" /> : <XCircle size={56} className="mx-auto text-danger" />}
        <h1 className="mt-4 text-3xl">{result.passed ? t('quiz.res_passed') : t('quiz.res_failed')}</h1>
        <div className="mt-2 font-display text-5xl text-aqua">{result.score}%</div>
        <p className="mt-2 text-sm text-ink-muted">{t('quiz.pass_score')} {quiz.passScore}%</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/app/quizzes"><Button variant="secondary"><ArrowLeft size={15} /> {t('quiz.to_list')}</Button></Link>
          {!result.passed && <Button onClick={() => { setResult(null); setAnswers({}) }}>{t('quiz.retake')}</Button>}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/app/quizzes" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
        <ArrowLeft size={14} /> {t('quiz.to_list')}
      </Link>
      <h1 className="mt-4 text-3xl sm:text-4xl">{quiz.title}<span className="text-aqua">.</span></h1>
      {quiz.description && <p className="mt-2 text-ink-soft">{quiz.description}</p>}
      <p className="mt-2 font-mono text-xs text-ink-dim">{t('quiz.pass_score')} {quiz.passScore}% · {questions.length} {t('quiz.q_count')}</p>

      <div className="mt-8 flex flex-col gap-5">
        {questions.map((q, i) => (
          <div key={q.id} className="border border-line bg-surface p-5">
            <div className="flex items-start gap-2">
              <span className="font-display text-lg text-aqua">{i + 1}</span>
              <h3 className="text-lg text-ink">{q.text}</h3>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {q.type === 'text' ? (
                <input className={field} value={(answers[q.id] as string) ?? ''} onChange={(e) => setText(q.id, e.target.value)} placeholder={t('quiz.your_answer')} />
              ) : (
                q.options.map((opt, idx) => {
                  const sIdx = String(idx)
                  const selected = q.type === 'single' ? answers[q.id] === sIdx : Array.isArray(answers[q.id]) && (answers[q.id] as string[]).includes(sIdx)
                  return (
                    <button
                      key={idx}
                      onClick={() => (q.type === 'single' ? setSingle(q.id, sIdx) : toggleMulti(q.id, sIdx))}
                      className={cn('flex items-center gap-3 border px-4 py-2.5 text-left text-sm transition-colors', selected ? 'border-line-aqua text-aqua' : 'border-line-strong text-ink-soft hover:border-aqua/40')}
                    >
                      <span className={cn('flex h-5 w-5 items-center justify-center border', q.type === 'single' ? 'rounded-full' : '', selected ? 'border-aqua bg-aqua/20' : 'border-line-strong')}>
                        {selected && <Check size={12} className="text-aqua" />}
                      </span>
                      {opt}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <Button className="mt-8" onClick={submit} disabled={m.submit.isPending}>
        <Send size={15} /> {m.submit.isPending ? '…' : t('quiz.finish')}
      </Button>
    </div>
  )
}
