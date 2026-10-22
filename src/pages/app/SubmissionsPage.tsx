import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { GenerativeAvatar } from '@/features/profile/GenerativeAvatar'
import { FilePreview } from '@/features/submission/FilePreview'
import { useCourse } from '@/features/courses/useCourses'
import { useCourseSubmissions, useGradeSubmission } from '@/features/submission/useSubmissions'
import { gradeTone } from '@/shared/lib/grade'
import type { Submission } from '@/entities/submission/service'

const GRADES = [2, 3, 4, 5]

function GradeCard({ s, courseId }: { s: Submission; courseId: string }) {
  const { t } = useTranslation()
  const grade = useGradeSubmission(courseId)
  const [value, setValue] = useState<number>(s.grade || 0)
  const [feedback, setFeedback] = useState(s.feedback)

  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex items-center gap-3">
          <GenerativeAvatar seed={s.studentId} rank="F" size={38} />
          <div className="min-w-0">
            <div className="truncate text-sm text-ink">{s.studentCallsign || s.studentName || s.studentId}</div>
            <div className="font-mono text-[11px] text-ink-dim">{s.lessonTitle}</div>
          </div>
        </div>
        <span
          className={
            'inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase ' +
            (s.status === 'graded' ? 'border-line-lime text-lime' : 'border-line-aqua text-aqua')
          }
        >
          {s.status === 'graded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {s.status === 'graded' ? t('review.graded') : t('review.awaiting')}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{t('review.answer')}</div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-soft">{s.text || t('review.no_answer')}</p>
        </div>

        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{t('review.files')}</div>
          {s.fileUrls.length === 0 ? (
            <p className="mt-1 text-sm text-ink-dim">{t('review.no_files')}</p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {s.fileUrls.map((url, i) => (
                <FilePreview key={url} url={url} name={s.files[i]} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
          <div className="flex flex-col gap-1">
            <Label>{t('review.grade_ph')}</Label>
            <div className="flex gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setValue(g)}
                  className={`flex h-11 w-11 items-center justify-center border font-mono text-base transition-colors ${
                    value === g ? gradeTone(g) + ' bg-surface-2' : 'border-line-strong text-ink-dim hover:text-ink'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('review.feedback_ph')}
            rows={2}
            className="min-w-48 flex-1 resize-y border border-line-strong bg-surface-2 p-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none"
          />
          <Button
            onClick={() => grade.mutate({ id: s.id, grade: value, feedback: feedback.trim() })}
            disabled={grade.isPending || value === 0}
          >
            {grade.isPending ? '…' : t('review.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function SubmissionsPage() {
  const { t } = useTranslation()
  const { courseId = '' } = useParams()
  const { data: course } = useCourse(courseId)
  const { data: submissions = [], isLoading } = useCourseSubmissions(courseId, true)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to={`/app/teach/${courseId}`} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
        <ArrowLeft size={14} /> {t('review.back')}
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <Label accent>// {course?.title ?? ''}</Label>
          <h1 className="mt-2 text-3xl sm:text-4xl">{t('review.title')}<span className="text-aqua">.</span></h1>
        </div>
        <Label>{t('review.count', { count: submissions.length })}</Label>
      </div>

      {isLoading ? (
        <div className="mt-16 text-center font-mono text-sm text-ink-muted">{t('common.loading')}</div>
      ) : submissions.length === 0 ? (
        <div className="mt-10 border border-line bg-surface p-10 text-center text-ink-muted">{t('review.empty')}</div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {submissions.map((s) => (
            <GradeCard key={s.id} s={s} courseId={courseId} />
          ))}
        </div>
      )}
    </div>
  )
}
