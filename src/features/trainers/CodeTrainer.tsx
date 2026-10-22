import { useMemo, useState } from 'react'
import { Check, X, Play, RotateCcw } from 'lucide-react'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { cn } from '@/shared/lib/cn'

interface CodeTest { args: unknown[]; expected: unknown }
interface CodeTask {
  id: string
  title: string
  prompt: string
  fn: string
  starter: string
  tests: CodeTest[]
}

const TASKS: CodeTask[] = [
  {
    id: 'sum',
    title: 'Сумма массива',
    fn: 'sumArray',
    prompt: 'Реализуйте функцию sumArray(nums), возвращающую сумму чисел массива. Для пустого массива — 0.',
    starter: 'function sumArray(nums) {\n  // ваш код\n  return 0\n}',
    tests: [
      { args: [[1, 2, 3]], expected: 6 },
      { args: [[]], expected: 0 },
      { args: [[-5, 5, 10]], expected: 10 },
      { args: [[100]], expected: 100 },
    ],
  },
  {
    id: 'reverse',
    title: 'Переворот строки',
    fn: 'reverseStr',
    prompt: 'Реализуйте функцию reverseStr(s), возвращающую строку, записанную в обратном порядке.',
    starter: 'function reverseStr(s) {\n  // ваш код\n  return s\n}',
    tests: [
      { args: ['protocol'], expected: 'locotorp' },
      { args: [''], expected: '' },
      { args: ['a'], expected: 'a' },
      { args: ['UX/UI'], expected: 'IU/XU' },
    ],
  },
  {
    id: 'palindrome',
    title: 'Палиндром',
    fn: 'isPalindrome',
    prompt: 'Реализуйте функцию isPalindrome(s): true, если строка читается одинаково в обе стороны, иначе false.',
    starter: 'function isPalindrome(s) {\n  // ваш код\n  return false\n}',
    tests: [
      { args: ['level'], expected: true },
      { args: ['radar'], expected: true },
      { args: ['protocol'], expected: false },
      { args: [''], expected: true },
    ],
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    fn: 'fizzbuzz',
    prompt: 'Реализуйте fizzbuzz(n): массив 1..n, где кратные 3 → "Fizz", кратные 5 → "Buzz", кратные 15 → "FizzBuzz", остальные — само число.',
    starter: 'function fizzbuzz(n) {\n  // ваш код\n  return []\n}',
    tests: [
      { args: [5], expected: [1, 2, 'Fizz', 4, 'Buzz'] },
      { args: [3], expected: [1, 2, 'Fizz'] },
      { args: [15], expected: [1, 2, 'Fizz', 4, 'Buzz', 'Fizz', 7, 8, 'Fizz', 'Buzz', 11, 'Fizz', 13, 14, 'FizzBuzz'] },
    ],
  },
  {
    id: 'max',
    title: 'Максимум массива',
    fn: 'maxOf',
    prompt: 'Реализуйте maxOf(nums) — наибольшее число массива. Для пустого массива верните null.',
    starter: 'function maxOf(nums) {\n  // ваш код\n  return null\n}',
    tests: [
      { args: [[3, 7, 2, 9, 4]], expected: 9 },
      { args: [[-5, -1, -8]], expected: -1 },
      { args: [[42]], expected: 42 },
      { args: [[]], expected: null },
    ],
  },
  {
    id: 'vowels',
    title: 'Счётчик гласных',
    fn: 'countVowels',
    prompt: 'Реализуйте countVowels(s) — количество гласных латиницы (a, e, i, o, u) в строке, без учёта регистра.',
    starter: 'function countVowels(s) {\n  // ваш код\n  return 0\n}',
    tests: [
      { args: ['protocol'], expected: 3 },
      { args: ['SKY'], expected: 0 },
      { args: ['Education'], expected: 5 },
      { args: [''], expected: 0 },
    ],
  },
  {
    id: 'factorial',
    title: 'Факториал',
    fn: 'factorial',
    prompt: 'Реализуйте factorial(n) — произведение чисел от 1 до n. factorial(0) = 1.',
    starter: 'function factorial(n) {\n  // ваш код\n  return 1\n}',
    tests: [
      { args: [0], expected: 1 },
      { args: [1], expected: 1 },
      { args: [5], expected: 120 },
      { args: [7], expected: 5040 },
    ],
  },
]

interface Result { ok: boolean; got: string; error?: string }
const show = (v: unknown) => {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
const eq = (a: unknown, b: unknown) => show(a) === show(b)

export function CodeTrainer() {
  const [taskId, setTaskId] = useState(TASKS[0].id)
  const task = useMemo(() => TASKS.find((t) => t.id === taskId) ?? TASKS[0], [taskId])
  const [code, setCode] = useState(task.starter)
  const [results, setResults] = useState<Result[] | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)

  function selectTask(id: string) {
    const next = TASKS.find((t) => t.id === id) ?? TASKS[0]
    setTaskId(id)
    setCode(next.starter)
    setResults(null)
    setCompileError(null)
  }

  function runTests() {
    setCompileError(null)
    let fn: ((...a: unknown[]) => unknown) | null = null
    try {
      // песочница: код выполняется в изолированной функции в браузере студента
      const factory = new Function(`${code}\n;return typeof ${task.fn} === 'function' ? ${task.fn} : null;`)
      fn = factory() as ((...a: unknown[]) => unknown) | null
    } catch (e) {
      setResults(null)
      setCompileError((e as Error).message)
      return
    }
    if (!fn) {
      setResults(null)
      setCompileError(`Функция ${task.fn}(...) не найдена — проверьте название.`)
      return
    }
    const res: Result[] = task.tests.map((t) => {
      try {
        const got = fn!(...t.args)
        return { ok: eq(got, t.expected), got: show(got) }
      } catch (e) {
        return { ok: false, got: '—', error: (e as Error).message }
      }
    })
    setResults(res)
  }

  const passedCount = results ? results.filter((r) => r.ok).length : 0
  const score = results ? Math.round((passedCount / task.tests.length) * 100) : 0

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TASKS.map((tk) => (
          <button
            key={tk.id}
            onClick={() => selectTask(tk.id)}
            className={cn('border px-3 py-1.5 font-mono text-xs transition-colors clip-btn', tk.id === taskId ? 'border-aqua text-aqua' : 'border-line-strong text-ink-muted hover:text-ink')}
          >
            {tk.title}
          </button>
        ))}
      </div>

      <div className="clip-hud mt-5 border border-line bg-surface p-5">
        <span className="font-mono text-xs uppercase tracking-widest text-lime">задание</span>
        <p className="mt-2 text-sm text-ink-soft">{task.prompt}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="flex min-w-0 flex-col border border-line-strong bg-[#05070a]">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="font-mono text-[11px] text-ink-muted">editor.js</span>
            <div className="flex items-center gap-3">
              <button onClick={() => { setCode(task.starter); setResults(null); setCompileError(null) }} className="flex items-center gap-1 font-mono text-[11px] text-ink-dim transition-colors hover:text-aqua">
                <RotateCcw size={12} /> сброс
              </button>
              <button onClick={runTests} className="flex items-center gap-1.5 border border-line-lime px-2.5 py-1 font-mono text-[11px] text-lime transition-colors hover:bg-lime/10 clip-btn">
                <Play size={12} /> запустить
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={14}
            className="w-full resize-y bg-transparent p-3 font-mono text-[13px] leading-relaxed text-ink-soft focus:outline-none"
          />
          {compileError && <div className="border-t border-line px-3 py-2 font-mono text-xs text-danger">Ошибка: {compileError}</div>}
        </div>

        <div className="clip-hud flex flex-col items-center border border-line bg-surface p-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">тесты</span>
          <div className="mt-3"><ProgressRing value={score} size={92} /></div>
          <ul className="mt-4 w-full space-y-2">
            {task.tests.map((t, i) => {
              const r = results?.[i]
              return (
                <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 text-xs">
                  <span className={cn('mt-0.5 flex h-4 w-4 items-center justify-center border', !r ? 'border-line-strong text-ink-dim' : r.ok ? 'border-lime text-lime' : 'border-danger text-danger')}>
                    {r ? r.ok ? <Check size={11} /> : <X size={11} /> : ''}
                  </span>
                  <span className="min-w-0 break-words font-mono text-ink-muted">
                    {task.fn}({t.args.map(show).join(', ').replace(/^\[|\]$/g, '')}) → {show(t.expected)}
                    {r && !r.ok && <span className="text-danger"> · получено {r.error ? '⚠ ' + r.error : r.got}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
          {score === 100 && <div className="mt-4 w-full border border-line-lime bg-surface-2 py-2 text-center font-mono text-xs text-lime">все тесты пройдены</div>}
        </div>
      </div>
    </div>
  )
}
