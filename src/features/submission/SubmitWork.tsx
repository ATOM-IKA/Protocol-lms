import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Paperclip, CheckCircle2, Clock, FileText } from 'lucide-react'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { gradeTone } from '@/shared/lib/grade'
import { validateFiles, ACCEPT_ATTR, MAX_FILES, MAX_FILE_MB } from '@/shared/lib/upload'
import { useMySubmission, useSubmitWork } from '@/features/submission/useSubmissions'

interface Props {
  courseId: string
  lessonId: string
  studentId: string
}

export function SubmitWork({ courseId, lessonId, studentId }: Props) {
  const { t } = useTranslation()
  const { data: submission } = useMySubmission(lessonId, studentId, true)
  const submit = useSubmitWork()

  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  function onPickFiles(picked: File[]) {
    const { ok, error } = validateFiles(picked)
    setFiles(ok)
    setFileError(error)
  }

  const showForm = editing || !submission
  const canSend = text.trim().length > 0 || files.length > 0

  function send() {
    if (!canSend) return
    submit.mutate(
      { id: submission?.id, courseId, lessonId, studentId, text: text.trim(), files },
      {
        onSuccess: () => {
          setEditing(false)
          setText('')
          setFiles([])
          setFileError(null)
        },
      },
    )
  }

  return (
    <div className="clip-hud border border-line-lime bg-surface p-6">
      <div className="flex items-center justify-between">
        <Label accent>// {t('submit.title')}</Label>
        {submission && (
          <span
            className={
              'inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase ' +
              (submission.status === 'graded' ? 'border-line-lime text-lime' : 'border-line-aqua text-aqua')
            }
          >
            {submission.status === 'graded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
            {submission.status === 'graded' ? t('submit.status_graded') : t('submit.status_submitted')}
          </span>
        )}
      </div>

      {submission && !editing && (
        <div className="mt-4 flex flex-col gap-4">
          {submission.text && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{t('submit.your_answer')}</div>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink-soft">{submission.text}</p>
            </div>
          )}
          {submission.fileUrls.length > 0 && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{t('submit.your_files')}</div>
              <ul className="mt-1 flex flex-col gap-1">
                {submission.fileUrls.map((url, i) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-aqua hover:underline">
                      <FileText size={14} /> {submission.files[i]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {submission.status === 'graded' && (
            <div className="border border-line-strong bg-surface-2 p-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">{t('submit.grade')}</span>
                <span className={`flex h-9 w-9 items-center justify-center border font-display text-xl ${gradeTone(submission.grade)}`}>{submission.grade}</span>
              </div>
              {submission.feedback && (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-soft">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-ink-dim">{t('submit.feedback')}: </span>
                  {submission.feedback}
                </p>
              )}
            </div>
          )}
          <div>
            <Button variant="secondary" onClick={() => setEditing(true)}>{t('submit.resend')}</Button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-ink-muted">{t('submit.desc')}</p>
          <div className="flex flex-col gap-2">
            <Label>{t('submit.answer')}</Label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('submit.answer_ph')}
              rows={5}
              className="w-full resize-y border border-line-strong bg-surface-2 p-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t('submit.files')}</Label>
            <label className={`flex cursor-pointer items-center gap-2 border border-dashed bg-surface-2 px-3 py-3 text-sm transition-colors hover:border-aqua hover:text-ink ${fileError ? 'border-danger/60 text-danger' : 'border-line-strong text-ink-muted'}`}>
              <Paperclip size={15} className="shrink-0" />
              <span className="truncate">{files.length > 0 ? files.map((f) => f.name).join(', ') : t('submit.files_hint')}</span>
              <input
                type="file"
                multiple
                accept={ACCEPT_ATTR}
                className="hidden"
                onChange={(e) => onPickFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            {fileError ? (
              <span className="font-mono text-xs text-danger">{fileError}</span>
            ) : (
              <span className="font-mono text-[11px] text-ink-dim">{t('submit.limits', { count: MAX_FILES, mb: MAX_FILE_MB })}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={send} disabled={!canSend || submit.isPending}>
              <Upload size={15} /> {submit.isPending ? t('submit.sending') : t('submit.send')}
            </Button>
            {!canSend && <span className="font-mono text-xs text-ink-dim">{t('submit.empty')}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
