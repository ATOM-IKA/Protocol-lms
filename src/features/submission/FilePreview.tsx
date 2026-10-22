import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ChevronDown, ChevronRight, Download } from 'lucide-react'

const IMG = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif']
const CODE = [
  'txt', 'md', 'markdown', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'htm', 'css', 'scss',
  'json', 'csv', 'tsv', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'php', 'sql', 'xml',
  'yml', 'yaml', 'sh', 'rb', 'kt', 'swift', 'vue', 'log',
]

function ext(name: string): string {
  const m = name.split('.').pop()
  return (m || '').toLowerCase()
}

/** Инлайн-просмотр сданного файла: изображение, PDF или код/текст — без скачивания. */
export function FilePreview({ url, name }: { url: string; name: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [err, setErr] = useState(false)
  const e = ext(name)
  const kind = IMG.includes(e) ? 'image' : e === 'pdf' ? 'pdf' : CODE.includes(e) ? 'code' : 'other'

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && kind === 'code' && text === null) {
      try {
        const r = await fetch(url)
        setText(await r.text())
      } catch {
        setErr(true)
      }
    }
  }

  return (
    <div className="border border-line-strong">
      <div className="flex items-center justify-between gap-2 bg-surface-2 px-3 py-2">
        <button onClick={toggle} className="flex min-w-0 items-center gap-2 text-sm text-ink transition-colors hover:text-aqua">
          {open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          <FileText size={14} className="shrink-0 text-ink-muted" />
          <span className="truncate">{name}</span>
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-ink-muted transition-colors hover:text-aqua" title={t('review.download')}>
          <Download size={14} />
        </a>
      </div>
      {open && (
        <div className="border-t border-line bg-bg p-2">
          {kind === 'image' && <img src={url} alt={name} className="mx-auto max-h-[70vh] w-auto border border-line" />}
          {kind === 'pdf' && <iframe src={url} title={name} className="h-[70vh] w-full border border-line bg-white" />}
          {kind === 'code' &&
            (err ? (
              <p className="p-3 text-sm text-ink-dim">{t('review.cannot_preview')}</p>
            ) : text === null ? (
              <p className="p-3 font-mono text-xs text-ink-dim">…</p>
            ) : (
              <pre className="max-h-[70vh] overflow-auto p-3 font-mono text-xs leading-relaxed text-ink-soft">
                <code>{text}</code>
              </pre>
            ))}
          {kind === 'other' && <p className="p-3 text-sm text-ink-dim">{t('review.cannot_preview')}</p>}
        </div>
      )}
    </div>
  )
}
