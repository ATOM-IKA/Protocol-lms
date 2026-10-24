import type { ReactNode } from 'react'
import { Check, Flame, Trophy, Star, Zap, BookOpen, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/**
 * Мини-макеты экранов портала для витрины. Размеры в cqw — масштабируются вместе с карточкой
 * (родитель задаёт container-type: inline-size).
 */
function Frame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col bg-bg text-[2.4cqw] text-ink">
      <div className="flex items-center gap-[1cqw] border-b border-line px-[2.5cqw] py-[1.6cqw]">
        <span className="h-[1.4cqw] w-[1.4cqw] rounded-full bg-danger/70" />
        <span className="h-[1.4cqw] w-[1.4cqw] rounded-full bg-warning/70" />
        <span className="h-[1.4cqw] w-[1.4cqw] rounded-full bg-lime/70" />
        <span className="ml-[2cqw] truncate font-mono text-[1.9cqw] text-ink-dim">
          protocol.app/{url}
        </span>
      </div>
      <div className="relative min-h-0 flex-1 p-[3.5cqw]">{children}</div>
    </div>
  )
}

const Bar = ({ w, lime }: { w: number; lime?: boolean }) => (
  <div className="h-[1cqw] w-full overflow-hidden rounded-full bg-elevated">
    <div
      className={cn('h-full rounded-full', lime ? 'bg-lime' : 'bg-aqua')}
      style={{ width: `${w}%` }}
    />
  </div>
)

export function CoursesMock() {
  const items = [
    { t: 'Python', n: '12 / 18', w: 66, lime: true },
    { t: 'Web / React', n: '7 / 20', w: 35 },
    { t: 'SQL', n: '15 / 15', w: 100, lime: true },
    { t: 'Linux', n: '3 / 14', w: 21 },
  ]
  return (
    <Frame url="courses">
      <div className="grid h-full grid-cols-2 gap-[2.5cqw]">
        {items.map((c) => (
          <div
            key={c.t}
            className="flex flex-col justify-between rounded-[1.2cqw] border border-line bg-surface p-[2.5cqw]"
          >
            <div className="flex items-center justify-between">
              <BookOpen
                className={cn('h-[3.4cqw] w-[3.4cqw]', c.lime ? 'text-lime' : 'text-aqua')}
              />
              <span className="font-mono text-[1.8cqw] text-ink-muted">{c.n}</span>
            </div>
            <div className="font-display text-[3.2cqw] font-semibold">{c.t}</div>
            <Bar w={c.w} lime={c.lime} />
          </div>
        ))}
      </div>
    </Frame>
  )
}

export function ProgressMock() {
  const done = [true, true, true, false, false]
  return (
    <Frame url="progress">
      <div className="flex h-full items-center gap-[5cqw]">
        <div className="relative h-[34cqw] w-[34cqw] shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-elevated)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-lime)"
              strokeWidth="8"
              strokeDasharray="264"
              strokeDashoffset="85"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[7cqw] font-black">68%</span>
            <span className="font-mono text-[1.8cqw] text-ink-muted">course</span>
          </div>
        </div>
        <ul className="flex-1 space-y-[2cqw]">
          {done.map((d, i) => (
            <li key={i} className="flex items-center gap-[2cqw] border-b border-line pb-[1.6cqw]">
              <span
                className={cn(
                  'flex h-[3.4cqw] w-[3.4cqw] items-center justify-center rounded-full border',
                  d ? 'border-lime bg-lime text-bg' : 'border-line-strong',
                )}
              >
                {d && <Check className="h-[2.4cqw] w-[2.4cqw]" />}
              </span>
              <span
                className="h-[1.2cqw] rounded-full bg-elevated"
                style={{ width: `${40 + prand2(i) * 45}%` }}
              />
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  )
}

const prand2 = (i: number): number => ((i * 37 + 11) % 17) / 17

export function XpMock() {
  const icons = [Trophy, Star, Zap, Flame, Trophy, Star]
  return (
    <Frame url="profile">
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center gap-[3cqw]">
          <div className="flex h-[16cqw] w-[16cqw] items-center justify-center rounded-[2cqw] border border-line-lime bg-surface font-display text-[5.5cqw] font-black text-lime">
            07
          </div>
          <div className="flex-1">
            <div className="flex justify-between font-mono text-[2cqw] text-ink-muted">
              <span>LVL 07</span>
              <span>840 / 1200 XP</span>
            </div>
            <div className="mt-[1.5cqw]">
              <Bar w={70} lime />
            </div>
          </div>
          <div className="flex items-center gap-[1cqw] font-display text-[4cqw] font-bold text-aqua">
            <Flame className="h-[4cqw] w-[4cqw]" /> 12
          </div>
        </div>
        <div className="grid grid-cols-6 gap-[2cqw]">
          {icons.map((Icon, i) => (
            <div
              key={i}
              className={cn(
                'flex aspect-square items-center justify-center rounded-[1.4cqw] border',
                i < 4 ? 'border-line-aqua bg-surface text-aqua' : 'border-line text-ink-dim',
              )}
            >
              <Icon className="h-[4cqw] w-[4cqw]" />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function JournalMock() {
  const marks = [
    ['5', '4', '5', 'н', '5', '4'],
    ['4', '4', 'н', '5', '5', '5'],
    ['5', '5', '5', '5', '4', '5'],
    ['3', 'н', '4', '4', '5', '4'],
  ]
  return (
    <Frame url="journal">
      <table className="h-full w-full border-collapse font-mono text-[2.2cqw]">
        <thead>
          <tr className="text-ink-muted">
            <th className="text-left font-normal">#</th>
            {['01', '02', '03', '04', '05', '06'].map((d) => (
              <th key={d} className="font-normal">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {marks.map((row, r) => (
            <tr key={r} className="border-t border-line">
              <td className="text-ink-soft">{`S-${(r + 1).toString().padStart(2, '0')}`}</td>
              {row.map((m, c) => (
                <td key={c} className="text-center">
                  <span
                    className={cn(
                      'inline-flex h-[4.4cqw] w-[4.4cqw] items-center justify-center rounded-[1cqw]',
                      m === 'н'
                        ? 'bg-danger/15 text-danger'
                        : m === '5'
                          ? 'bg-lime/15 text-lime'
                          : 'bg-aqua/10 text-aqua',
                    )}
                  >
                    {m}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  )
}

export function QuizMock() {
  return (
    <Frame url="quiz/3">
      <div className="flex h-full flex-col gap-[2.4cqw]">
        <div className="flex items-center justify-between font-mono text-[2cqw] text-ink-muted">
          <span>Q 03 / 10</span>
          <span className="flex items-center gap-[1cqw] text-aqua">
            <Clock className="h-[2.4cqw] w-[2.4cqw]" /> 00:42
          </span>
        </div>
        <div className="h-[2cqw] w-4/5 rounded-full bg-elevated" />
        <div className="h-[2cqw] w-3/5 rounded-full bg-elevated" />
        <div className="mt-auto grid grid-cols-2 gap-[2cqw]">
          {['A', 'B', 'C', 'D'].map((o) => (
            <div
              key={o}
              className={cn(
                'flex items-center gap-[2cqw] rounded-[1.4cqw] border px-[2.5cqw] py-[2.4cqw]',
                o === 'C' ? 'border-lime bg-lime/10 text-lime' : 'border-line text-ink-soft',
              )}
            >
              <span className="font-mono">{o}</span>
              <span className="h-[1.4cqw] flex-1 rounded-full bg-current opacity-30" />
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

export function LoginMock() {
  return (
    <Frame url="login">
      <div className="flex h-full items-center justify-center">
        <div className="w-3/5 space-y-[2.6cqw] rounded-[1.6cqw] border border-line bg-surface p-[4cqw]">
          <div className="flex items-center gap-[1.6cqw]">
            <span className="flex h-[5cqw] w-[5cqw] items-center justify-center rounded-[1cqw] bg-lime font-display text-[3cqw] font-bold text-bg">
              P
            </span>
            <span className="font-display text-[2.6cqw] tracking-[0.14em]">PROTOCOL</span>
          </div>
          <div className="h-[6cqw] rounded-[1cqw] border border-line-strong" />
          <div className="h-[6cqw] rounded-[1cqw] border border-line-strong" />
          <div className="flex h-[6cqw] items-center justify-center rounded-[1cqw] bg-lime font-mono text-[2.2cqw] font-bold text-bg">
            →
          </div>
        </div>
      </div>
    </Frame>
  )
}
