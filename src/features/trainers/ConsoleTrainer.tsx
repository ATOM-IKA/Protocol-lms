import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X, RotateCcw } from 'lucide-react'
import { ProgressRing } from '@/shared/ui/ProgressRing'
import { cn } from '@/shared/lib/cn'

// ---- виртуальная файловая система -----------------------------------------
interface FSNode {
  type: 'dir' | 'file'
  mode: string
  content?: string
  children?: Record<string, FSNode>
}
const mkdir = (children: Record<string, FSNode> = {}): FSNode => ({ type: 'dir', mode: 'rwxr-xr-x', children })
const mkfile = (content = '', mode = 'rw-r--r--'): FSNode => ({ type: 'file', mode, content })

/** Узел по абсолютному пути ('/a/b'); null если нет. */
function getNode(root: FSNode, path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean)
  let cur: FSNode = root
  for (const p of parts) {
    if (cur.type !== 'dir' || !cur.children || !cur.children[p]) return null
    cur = cur.children[p]
  }
  return cur
}

function normalize(cwd: string[], arg: string): string[] {
  const base = arg.startsWith('/') ? [] : [...cwd]
  for (const seg of arg.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') base.pop()
    else base.push(seg)
  }
  return base
}

// ---- задания ---------------------------------------------------------------
interface TaskCheck {
  label: string
  test: (root: FSNode) => boolean
}
interface ConsoleTask {
  id: string
  title: string
  prompt: string
  init: () => FSNode
  checks: TaskCheck[]
}

const TASKS: ConsoleTask[] = [
  {
    id: 'files',
    title: 'Файлы и каталоги',
    prompt: 'Создайте каталог project, внутри — файл index.html и файл README.md с текстом Protocol. Затем перейдите в project.',
    init: () => mkdir({ home: mkdir() }),
    checks: [
      { label: 'Каталог project создан', test: (r) => getNode(r, '/project')?.type === 'dir' },
      { label: 'Есть project/index.html', test: (r) => getNode(r, '/project/index.html')?.type === 'file' },
      { label: 'README.md содержит «Protocol»', test: (r) => !!getNode(r, '/project/README.md')?.content?.includes('Protocol') },
    ],
  },
  {
    id: 'perms',
    title: 'Права доступа',
    prompt: 'Создайте файл deploy.sh и сделайте его исполняемым командой chmod +x.',
    init: () => mkdir({ home: mkdir() }),
    checks: [
      { label: 'Файл deploy.sh создан', test: (r) => getNode(r, '/deploy.sh')?.type === 'file' },
      { label: 'deploy.sh исполняемый (+x)', test: (r) => !!getNode(r, '/deploy.sh')?.mode.includes('x') },
    ],
  },
  {
    id: 'cleanup',
    title: 'Навигация и очистка',
    prompt: 'В каталоге logs уже есть файл old.log — удалите его командой rm.',
    init: () => mkdir({ logs: mkdir({ 'old.log': mkfile('...'), 'app.log': mkfile('ok') }) }),
    checks: [
      { label: 'logs/old.log удалён', test: (r) => getNode(r, '/logs/old.log') === null },
      { label: 'logs/app.log не тронут', test: (r) => getNode(r, '/logs/app.log')?.type === 'file' },
    ],
  },
  {
    id: 'nested',
    title: 'Вложенная структура',
    prompt: 'Создайте каталог src, внутри него — каталог app, а в нём файл main.ts с текстом start. Подсказка: сначала mkdir src, затем mkdir src/app.',
    init: () => mkdir({ home: mkdir() }),
    checks: [
      { label: 'Каталог src создан', test: (r) => getNode(r, '/src')?.type === 'dir' },
      { label: 'Каталог src/app создан', test: (r) => getNode(r, '/src/app')?.type === 'dir' },
      { label: 'src/app/main.ts содержит start', test: (r) => !!getNode(r, '/src/app/main.ts')?.content?.includes('start') },
    ],
  },
  {
    id: 'append',
    title: 'Дозапись в файл',
    prompt: 'В файле notes.txt уже есть строка «one». Допишите к нему строку «two» через echo two >> notes.txt (двойная стрелка — дозапись).',
    init: () => mkdir({ 'notes.txt': mkfile('one') }),
    checks: [
      { label: 'notes.txt содержит one', test: (r) => !!getNode(r, '/notes.txt')?.content?.includes('one') },
      { label: 'notes.txt содержит two', test: (r) => !!getNode(r, '/notes.txt')?.content?.includes('two') },
    ],
  },
]

interface Line { text: string; kind: 'in' | 'out' | 'err' }

export function ConsoleTrainer() {
  const [taskId, setTaskId] = useState(TASKS[0].id)
  const task = useMemo(() => TASKS.find((t) => t.id === taskId) ?? TASKS[0], [taskId])

  const rootRef = useRef<FSNode>(task.init())
  const [cwd, setCwd] = useState<string[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState('')
  const [tick, setTick] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function reset(next = task) {
    rootRef.current = next.init()
    setCwd([])
    setLines([{ text: next.prompt, kind: 'out' }])
    setInput('')
    setTick((t) => t + 1)
  }
  // сброс при смене задания
  useEffect(() => {
    reset(task)

  }, [taskId])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const prompt = '/' + cwd.join('/')

  function print(out: string[], kind: Line['kind'] = 'out') {
    if (out.length) setLines((l) => [...l, ...out.map((text) => ({ text, kind }))])
  }

  function run(raw: string) {
    const root = rootRef.current
    const cmd = raw.trim()
    setLines((l) => [...l, { text: `${prompt} $ ${cmd}`, kind: 'in' }])
    if (!cmd) return

    // разбор редиректа echo ... > file
    const redir = cmd.match(/^echo\s+(.*?)\s*(>>?)\s*(\S+)$/)
    if (redir) {
      const text = redir[1].replace(/^["']|["']$/g, '')
      const append = redir[2] === '>>'
      const path = normalize(cwd, redir[3])
      const name = path.pop()
      if (!name) return print(['echo: неверный путь'], 'err')
      const parent = getNode(root, '/' + path.join('/'))
      if (!parent || parent.type !== 'dir') return print(['echo: каталог не найден'], 'err')
      const ex = parent.children![name]
      parent.children![name] = mkfile(append && ex?.content ? ex.content + '\n' + text : text)
      return setTick((t) => t + 1)
    }

    const [name, ...args] = cmd.split(/\s+/)
    switch (name) {
      case 'help':
        return print(['команды: pwd, ls, cd, mkdir, touch, cat, echo > файл, rm [-r], chmod +x, whoami, clear'])
      case 'clear':
        return setLines([])
      case 'whoami':
        return print(['student'])
      case 'pwd':
        return print(['/' + cwd.join('/')])
      case 'ls': {
        const target = args[0] ? getNode(root, '/' + normalize(cwd, args[0]).join('/')) : getNode(root, '/' + cwd.join('/'))
        if (!target) return print([`ls: нет такого пути`], 'err')
        if (target.type === 'file') return print([args[0]])
        return print([Object.entries(target.children ?? {}).map(([k, v]) => (v.type === 'dir' ? k + '/' : k)).join('  ') || '(пусто)'])
      }
      case 'cd': {
        const path = normalize(cwd, args[0] ?? '')
        const node = getNode(root, '/' + path.join('/'))
        if (!node || node.type !== 'dir') return print([`cd: нет каталога: ${args[0] ?? ''}`], 'err')
        return setCwd(path)
      }
      case 'mkdir':
      case 'touch': {
        if (!args[0]) return print([`${name}: не указано имя`], 'err')
        const path = normalize(cwd, args[0])
        const leaf = path.pop()!
        const parent = getNode(root, '/' + path.join('/'))
        if (!parent || parent.type !== 'dir') return print([`${name}: путь не найден`], 'err')
        parent.children![leaf] = name === 'mkdir' ? mkdir() : mkfile('')
        return setTick((t) => t + 1)
      }
      case 'cat': {
        const node = args[0] ? getNode(root, '/' + normalize(cwd, args[0]).join('/')) : null
        if (!node || node.type !== 'file') return print([`cat: файл не найден`], 'err')
        return print([node.content ?? ''])
      }
      case 'rm': {
        const recursive = args.includes('-r') || args.includes('-rf')
        const target = args.find((a) => !a.startsWith('-'))
        if (!target) return print(['rm: не указан файл'], 'err')
        const path = normalize(cwd, target)
        const leaf = path.pop()!
        const parent = getNode(root, '/' + path.join('/'))
        const node = parent?.children?.[leaf]
        if (!parent || !node) return print([`rm: нет файла: ${target}`], 'err')
        if (node.type === 'dir' && !recursive) return print([`rm: ${target} — каталог, нужен флаг -r`], 'err')
        delete parent.children![leaf]
        return setTick((t) => t + 1)
      }
      case 'chmod': {
        const flag = args[0]
        const target = args[1]
        const node = target ? getNode(root, '/' + normalize(cwd, target).join('/')) : null
        if (!node) return print(['chmod: файл не найден'], 'err')
        if (flag === '+x' || flag === '755' || flag === '+rwx') node.mode = 'rwxr-xr-x'
        else if (flag === '-x' || flag === '644') node.mode = 'rw-r--r--'
        else return print(['chmod: поддерживаются +x / -x / 755 / 644'], 'err')
        return setTick((t) => t + 1)
      }
      default:
        return print([`${name}: команда не найдена (введите help)`], 'err')
    }
  }

  const passed = task.checks.map((c) => c.test(rootRef.current))
  void tick // пересчёт проверок при каждом изменении FS
  const score = Math.round((passed.filter(Boolean).length / task.checks.length) * 100)

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TASKS.map((tk) => (
          <button
            key={tk.id}
            onClick={() => setTaskId(tk.id)}
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_260px]">
        {/* терминал */}
        <div className="flex min-w-0 flex-col border border-line-strong bg-[#05070a]">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-lime/70" />
              <span className="ml-2">student@protocol</span>
            </span>
            <button onClick={() => reset()} className="flex items-center gap-1 font-mono text-[11px] text-ink-dim transition-colors hover:text-aqua">
              <RotateCcw size={12} /> сброс
            </button>
          </div>
          <div ref={scrollRef} className="h-72 overflow-auto p-3 font-mono text-[13px] leading-relaxed">
            {lines.map((l, i) => (
              <div key={i} className={cn('whitespace-pre-wrap break-words', l.kind === 'in' ? 'text-aqua' : l.kind === 'err' ? 'text-danger' : 'text-ink-soft')}>
                {l.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(input)
              setInput('')
            }}
            className="flex items-center gap-2 border-t border-line px-3 py-2 font-mono text-[13px]"
          >
            <span className="shrink-0 text-lime">{prompt} $</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              spellCheck={false}
              className="w-full bg-transparent text-ink placeholder:text-ink-dim focus:outline-none"
              placeholder="введите команду…"
            />
          </form>
        </div>

        {/* авто-оценка */}
        <div className="clip-hud flex flex-col items-center border border-line bg-surface p-5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">авто-оценка</span>
          <div className="mt-3"><ProgressRing value={score} size={92} /></div>
          <ul className="mt-4 w-full space-y-2">
            {task.checks.map((c, i) => (
              <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] items-start gap-2 text-xs">
                <span className={cn('mt-0.5 flex h-4 w-4 items-center justify-center border', passed[i] ? 'border-lime text-lime' : 'border-line-strong text-ink-dim')}>
                  {passed[i] ? <Check size={11} /> : <X size={11} />}
                </span>
                <span className={passed[i] ? 'text-ink-soft' : 'text-ink-muted'}>{c.label}</span>
              </li>
            ))}
          </ul>
          {score === 100 && <div className="mt-4 w-full border border-line-lime bg-surface-2 py-2 text-center font-mono text-xs text-lime">задание выполнено</div>}
        </div>
      </div>
    </div>
  )
}
