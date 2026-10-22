import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Minus, Copy, RotateCcw, ArrowLeft, ArrowRight, FlaskConical, Send, ImagePlus } from 'lucide-react'
import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Label } from '@/shared/ui/Label'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/features/auth/authStore'
import { useProfileRank } from '@/features/progress/useRank'
import { RoleAvatar } from '@/features/profile/RoleAvatar'
import { submitQaReport, uploadQaScreenshot, type QaSectionSummary, type ItemStatus } from '@/entities/qa/service'

const ROLE_RU: Record<string, string> = { student: 'Студент', teacher: 'Преподаватель', admin: 'Администратор', superadmin: 'Супер-админ' }

type Status = 'ok' | 'bad' | 'na' | undefined

interface Item {
  id: string
  text: string
  how: string // подробно: что куда и как делать
  link?: string // прямая ссылка на нужный раздел
  linkLabel?: string
}
interface Section {
  role: string
  title: string
  accent: string
  items: Item[]
}

const SECTIONS: Section[] = [
  {
    role: 'student',
    title: 'Студент',
    accent: 'text-aqua',
    items: [
      { id: 's1', text: 'Единый вход с портала', how: 'Открой protocol-lms.ru — должен открыться Портал. Войди один раз. Перейди в карточку «PROTOCOL · СДО» — попадаешь на лендинг СДО БЕЗ повторного ввода логина/пароля. Проверь, что имя/позывной вверху совпадает с твоим.', link: '/portal', linkLabel: 'Открыть портал' },
      { id: 's2', text: 'Лендинг СДО → в приложение', how: 'С лендинга СДО нажми «В приложение» (кнопка справа вверху). Должен открыться дашборд. Из дашборда пройди в «Курсы», «Профиль», «Доска», «Тесты», «Рейтинг» — все пункты меню слева (на телефоне — снизу) открываются без ошибок.', link: '/about', linkLabel: 'Открыть лендинг СДО' },
      { id: 's3', text: 'Возврат на портал/лендинг без выхода', how: 'В шапке приложения нажми «Портал» — вернёшься на портал, оставаясь в аккаунте. Затем «Лендинг» — на лендинг СДО. Ни разу не должно просить войти заново.', link: '/app', linkLabel: 'Открыть дашборд' },
      { id: 's4', text: 'Каталог и запись на курс (без авто-записи)', how: 'Зайди в «Курсы». Новый студент НЕ должен быть автоматически записан ни на один курс (в «Мои курсы» на дашборде пусто). Открой курс → нажми «Записаться». После записи курс появляется в «Мои курсы».', link: '/app/courses', linkLabel: 'Открыть курсы' },
      { id: 's5', text: 'Прохождение урока и сдача работы', how: 'Открой записанный курс → первый открытый урок. Прочитай контент. На практическом уроке прикрепи файл (проверь лимит: до 3 файлов, до 10 МБ) и текст → «Отправить на проверку». Статус меняется на «На проверке».', link: '/app/courses', linkLabel: 'Открыть курсы' },
      { id: 's6', text: 'Гейтинг: старт с непройденного урока', how: 'Убедись, что закрытые уроки недоступны (замок), пока преподаватель не открыл. После оценки 3–5 урок считается пройденным; при оценке 2 — нет. Кнопка «Продолжить» ведёт на первый непройденный урок.', link: '/app', linkLabel: 'Открыть дашборд' },
      { id: 's7', text: 'Доска: вкладки и действия', how: 'Открой «Доска». Во вкладке «Все задачи» нажми «Выполнил» на задании — оно уходит во вкладку «Мои активные». Нажми «Отказаться» на другом — уходит в «Отменённые», оттуда «Вернуть на доску» возвращает его в «Все задачи». Проверь счётчики на вкладках.', link: '/app/board', linkLabel: 'Открыть доску' },
      { id: 's8', text: 'Тесты: прохождение и результат', how: 'Открой «Тесты» → «Пройти» на опубликованном тесте. Ответь на вопросы (один верный / несколько / ввод текста) → «Завершить тест». Сразу показывается результат в % и «Сдал/Не сдал». Проверь «Пройти снова».', link: '/app/quizzes', linkLabel: 'Открыть тесты' },
      { id: 's9', text: 'Начисление монет и опыта', how: 'После оценки за урок, принятия задания с доски и сдачи теста — зайди в «Профиль» (или «Рейтинг»): опыт (XP) и монеты должны вырасти. Если не обновилось сразу — обнови страницу профиля (баланс подтягивается заново).', link: '/app/profile', linkLabel: 'Открыть профиль' },
      { id: 's10', text: 'Профиль: полнота данных', how: 'В «Профиль» проверь мини-карточку (позывной, роль, ранг, группа, уровень) и блоки: часы, средний балл, посещаемость, опыт, монеты. Полный кабинет (все личные данные + куратор) — на портале, кнопка «Профиль».', link: '/cabinet', linkLabel: 'Открыть кабинет' },
      { id: 's11', text: 'Рейтинг и достижения', how: 'Открой «Рейтинг» — ты есть в списке (после первой активности), топ-3 с медалями, ты подсвечен. Ниже — достижения: выполненные подсвечены, невыполненные с замком. Проверь, что счётчик «выполнено/всего» верный.', link: '/app/leaderboard', linkLabel: 'Открыть рейтинг' },
      { id: 's12', text: 'Уведомления и переходы по ним', how: 'Колокольчик вверху: после оценки/принятия задания/открытия урока появляется уведомление с бейджем непрочитанных. Клик по уведомлению ведёт на нужную страницу (урок/доску). «Отметить всё прочитанным» гасит бейдж.', link: '/app', linkLabel: 'Открыть дашборд' },
    ],
  },
  {
    role: 'teacher',
    title: 'Преподаватель',
    accent: 'text-lime',
    items: [
      { id: 't1', text: 'Создание курса и уроков', how: 'Меню «Преподавание» → «Создать курс». Внутри добавь разделы и уроки, задай тип (лекция/практика), часы, XP. В блочном редакторе урока добавь блоки (текст, код, изображение и т.д.) и сохрани. Открой предпросмотр.', link: '/app/teach', linkLabel: 'Открыть преподавание' },
      { id: 't2', text: 'Открытие уроков студентам', how: 'В курсе переключи урок в «открыт». Проверь под студентом, что урок стал доступен, и что студентам пришло уведомление «Открыт новый урок».', link: '/app/teach', linkLabel: 'Открыть преподавание' },
      { id: 't3', text: 'Проверка и оценка работ', how: 'Открой «Проверка работ» курса. Открой сдачу студента: файлы (PDF/код/картинки) видны прямо на странице. Поставь оценку 2–5 и опыт, добавь комментарий. Убедись, что студенту ушло уведомление и обновились XP/монеты.', link: '/app/teach', linkLabel: 'Открыть преподавание' },
      { id: 't4', text: 'Доска: публикация и модерация', how: 'В «Доска» опубликуй задание: выбери «всем» или конкретной группе, укажи награду (монеты + опыт). Проверь, что студентам пришло уведомление. Когда студент выполнит — во вкладке проверки прими или отклони; тебе приходит уведомление о выполнении/отказе.', link: '/app/board', linkLabel: 'Открыть доску' },
      { id: 't5', text: 'Тесты: конструктор', how: '«Тесты» → «Создать тест» (название, курс, порог сдачи %, награды). Раскрой тест → добавь вопросы всех типов, отметь правильные ответы, задай баллы. Переключи тест в «Опубликован». Проверь под студентом прохождение.', link: '/app/quizzes', linkLabel: 'Открыть тесты' },
      { id: 't6', text: 'Журнал: оценки и посещаемость', how: '«Журнал» → выбери курс. Вкладка «Оценки»: сетка студенты×уроки с цветными оценками и средним баллом. Вкладка «Посещаемость»: клик по клетке циклично меняет отметку П→Н→О→У→снять; считается %. Нажми «Экспорт в Excel» — файл открывается со стилями.', link: '/app/journal', linkLabel: 'Открыть журнал' },
      { id: 't7', text: 'Уведомления преподавателя', how: 'Проверь, что приходят: «Новая работа на проверку», «Задание выполнено», «Отказ от задания». Клик ведёт на нужную страницу.', link: '/app', linkLabel: 'Открыть дашборд' },
      { id: 't8', text: 'Монеты за успехи студентов', how: 'После того как студенты прошли уроки/сдали тесты по твоим курсам, у тебя в профиле растут монеты (по правилу за успехи студентов). Проверь баланс в «Профиль».', link: '/app/profile', linkLabel: 'Открыть профиль' },
      { id: 't9', text: 'Кураторство группы', how: 'Убедись, что назначенная тебе (админом) группа отражается: у студентов этой группы в профиле ты указан куратором. Понятно, чей это студент и из какой группы.', link: '/app/profile', linkLabel: 'Открыть профиль' },
      { id: 't10', text: 'Права доступа', how: 'Проверь, что как преподаватель ты НЕ видишь админ-панель и чужие курсы для редактирования; видишь и правишь только свои.', link: '/app', linkLabel: 'Открыть дашборд' },
    ],
  },
  {
    role: 'admin',
    title: 'Админ / Супер-админ',
    accent: 'text-danger',
    items: [
      { id: 'a1', text: 'Пользователи: CRUD и роли', how: 'Админ-панель → «Пользователи». Создай студента (логин, ФИО, email, пароль ≥8, группа). Смени роль в строке. Удали тестового. Проверь, что супер-админ видит все колледжи, админ — только свой.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a2', text: 'Импорт студентов из таблицы', how: '«Пользователи» → «Импорт из таблицы». Вставь строки формата логин;ФИО;email;пароль (по одной на студента) → «Импортировать». Проверь отчёт (создано/ошибок) и что студенты появились в списке.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a3', text: 'Группы и кураторы', how: 'Вкладка «Группы» → создай группу (специальность, номер, год поступления, куратор). Проверь код вида «11-ИСиП-ИИ». Назначь/смени куратора в строке. Проверь, что у студентов группы куратор виден.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a4', text: 'Учебные заведения (супер-админ)', how: 'Вкладка «Заведения»: создай/переименуй/удали заведение. Проверь, что у супер-админа в профиле «Вся система», привязки к колледжу нет.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a5', text: 'Модерация курсов', how: 'Вкладка «Курсы»: опубликуй/сними с публикации/удали курс. Проверь, что снятый с публикации курс исчезает у студентов.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a6', text: 'Аудит и экспорт', how: 'Вкладка «Аудит»: события (вход, оценки, открытие уроков и т.д.) пишутся. В панели экспорта выбери пользователя и период → «Скачать .xls». Проверь, что файл стилизован и содержит нужные записи.', link: '/app/admin', linkLabel: 'Открыть админ-панель' },
      { id: 'a7', text: 'Супер-админ: ранг и охват', how: 'У супер-админа ранг SSS+ (красный неон), особая рамка. Доступ ко всем колледжам, пользователям и настройкам.', link: '/cabinet', linkLabel: 'Открыть кабинет' },
    ],
  },
  {
    role: 'edge',
    title: 'Общее и неожиданные моменты',
    accent: 'text-ink',
    items: [
      { id: 'e1', text: 'Обновление страницы в любом разделе', how: 'Нажми F5 на портале, в профиле, в курсе, в тесте. Нигде не должно быть «404» или выброса на вход. Если появилась старая версия — страница должна сама перезагрузиться на свежую.' },
      { id: 'e2', text: 'Кнопка «Назад» браузера', how: 'Пройди несколько экранов и жми «Назад»/«Вперёд». Навигация не должна ломаться, аккаунт не слетает.' },
      { id: 'e3', text: 'Прямая ссылка на закрытую страницу', how: 'Выйди из аккаунта и вставь в адрес /app или /cabinet — должно перекинуть на вход. Под студентом открой /app/admin — не должно пускать.' },
      { id: 'e4', text: 'Двойные и повторные действия', how: 'Дважды быстро нажми «Записаться», «Отправить», «Завершить тест». Не должно создаваться дублей и падать с ошибкой.' },
      { id: 'e5', text: 'Пустые состояния', how: 'Новый аккаунт без данных: пустые «Мои курсы», пустой рейтинг, нет уведомлений, нет тестов. Везде понятные надписи-заглушки, не пусто/не ошибка.' },
      { id: 'e6', text: 'Длинные имена и тексты', how: 'Создай пользователя/курс/тест с очень длинным названием. Проверь, что вёрстка не разъезжается, текст обрезается или переносится.' },
      { id: 'e7', text: 'Мобильный и планшет', how: 'Открой сайт на телефоне (или сузь окно). Нижнее меню, карточки, таблицы (журнал, рейтинг, аудит) прокручиваются по горизонтали и читаемы.' },
      { id: 'e8', text: 'Переключение языка RU/EN', how: 'Переключи язык в шапке. Все подписи меняются, ничего не остаётся «ключом» вида quiz.title. Вернись на RU.' },
      { id: 'e9', text: 'Меню доступности', how: 'Открой меню доступности (иконка в шапке): крупный шрифт, высокий контраст, для дальтоников, уменьшить движение. Каждая опция реально меняет вид и описана понятным текстом.' },
      { id: 'e10', text: 'Смена роли/аккаунта', how: 'Выйди и зайди под другой ролью. Меню и доступы меняются корректно, данные предыдущего пользователя не «залипают».' },
      { id: 'e11', text: 'Проверка входа по ролям', how: 'На форме входа выбери вкладку роли, не совпадающую с аккаунтом (например, «Админ» для студента) — вход не должен пускать/должен предупредить.' },
      { id: 'e12', text: 'HTTPS и корректная ссылка', how: 'Адрес открывается по https, замочек есть. Одна и та же ссылка всегда ведёт в одно место (не «то портал, то СДО»).' },
    ],
  },
]

const KEY = 'protocol-qa'
interface ItemComment {
  add: string
  improve: string
  problems: string
}
interface Store {
  checks: Record<string, Status>
  notes: Record<string, string>
  comments: Record<string, ItemComment>
}
function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<Store>
      return { checks: s.checks ?? {}, notes: s.notes ?? {}, comments: s.comments ?? {} }
    }
  } catch {
    /* ignore */
  }
  return { checks: {}, notes: {}, comments: {} }
}
const EMPTY_COMMENT: ItemComment = { add: '', improve: '', problems: '' }

function SectionProgress({ ok, bad, na, total }: { ok: number; bad: number; na: number; total: number }) {
  // соответствие считаем среди применимых пунктов (без «недоступно»)
  const applicable = total - na
  const okPct = applicable > 0 ? Math.round((ok / applicable) * 100) : 0
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between font-mono text-[11px] text-ink-dim">
        <span>Соответствие аудиту</span>
        <span className={okPct === 100 && applicable > 0 ? 'text-lime' : 'text-ink-soft'}>{okPct}%</span>
      </div>
      <div className="mt-1 flex h-2 w-full overflow-hidden bg-surface-2">
        <div className="h-full bg-lime transition-all duration-500" style={{ width: `${total ? (ok / total) * 100 : 0}%` }} />
        <div className="h-full bg-danger transition-all duration-500" style={{ width: `${total ? (bad / total) * 100 : 0}%` }} />
        <div className="h-full bg-ink-dim/40 transition-all duration-500" style={{ width: `${total ? (na / total) * 100 : 0}%` }} />
      </div>
      <div className="mt-1 font-mono text-[10px] text-ink-dim">проверено {ok + bad + na} из {total} · проблем {bad} · недоступно {na}</div>
    </div>
  )
}

export function QAChecklistPage() {
  const [store, setStore] = useState<Store>(load)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [files, setFiles] = useState<Record<string, File[]>>({})
  const user = useAuthStore((s) => s.user)
  const rank = useProfileRank()

  function comment(id: string): ItemComment {
    return store.comments[id] ?? EMPTY_COMMENT
  }
  function setComment(id: string, patch: Partial<ItemComment>) {
    setStore((st) => ({ ...st, comments: { ...st.comments, [id]: { ...(st.comments[id] ?? EMPTY_COMMENT), ...patch } } }))
  }
  function addFiles(id: string, list: FileList | null) {
    if (!list || !list.length) return
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'))
    setFiles((f) => ({ ...f, [id]: [...(f[id] ?? []), ...arr] }))
  }
  function removeFile(id: string, idx: number) {
    setFiles((f) => ({ ...f, [id]: (f[id] ?? []).filter((_, i) => i !== idx) }))
  }

  function buildSections(): QaSectionSummary[] {
    return SECTIONS.map((sec) => ({
      role: sec.role,
      title: sec.title,
      ok: sec.items.filter((i) => store.checks[i.id] === 'ok').length,
      bad: sec.items.filter((i) => store.checks[i.id] === 'bad').length,
      na: sec.items.filter((i) => store.checks[i.id] === 'na').length,
      total: sec.items.length,
      note: store.notes[sec.role] ?? '',
      items: sec.items.map((i) => {
        const c = comment(i.id)
        return { id: i.id, text: i.text, status: (store.checks[i.id] ?? 'none') as ItemStatus, add: c.add, improve: c.improve, problems: c.problems }
      }),
    }))
  }
  async function sendReport() {
    if (!user) return
    setSending(true)
    try {
      const secs = buildSections()
      const okAll = secs.reduce((n, s) => n + s.ok, 0)
      const naAll = secs.reduce((n, s) => n + s.na, 0)
      const totalAll = secs.reduce((n, s) => n + s.total, 0)
      const badAll = secs.reduce((n, s) => n + s.bad, 0)
      const appl = totalAll - naAll
      const reportId = await submitQaReport({
        reporterId: user.id,
        name: user.callsign,
        role: user.role,
        score: appl > 0 ? Math.round((okAll / appl) * 100) : 0,
        problems: badAll,
        sections: secs,
      })
      // загрузка скриншотов по пунктам
      for (const sec of SECTIONS) {
        for (const it of sec.items) {
          for (const file of files[it.id] ?? []) {
            try { await uploadQaScreenshot(reportId, `${it.id} · ${it.text}`, file) } catch { /* пропускаем битый файл */ }
          }
        }
      }
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store))
    } catch {
      /* ignore */
    }
  }, [store])

  function setStatus(id: string, s: Status) {
    setStore((st) => ({ ...st, checks: { ...st.checks, [id]: st.checks[id] === s ? undefined : s } }))
  }
  function setNote(role: string, v: string) {
    setStore((st) => ({ ...st, notes: { ...st.notes, [role]: v } }))
  }
  function reset() {
    setStore({ checks: {}, notes: {}, comments: {} })
    setFiles({})
  }
  function copyReport() {
    const lines: string[] = ['PROTOCOL — отчёт по тестированию', '']
    for (const sec of SECTIONS) {
      const ok = sec.items.filter((i) => store.checks[i.id] === 'ok').length
      lines.push(`## ${sec.title} — ${Math.round((ok / sec.items.length) * 100)}%`)
      for (const it of sec.items) {
        const st = store.checks[it.id]
        const mark = st === 'ok' ? '[✓]' : st === 'bad' ? '[✗]' : st === 'na' ? '[–]' : '[ ]'
        lines.push(`${mark} ${it.text}`)
      }
      if (store.notes[sec.role]?.trim()) lines.push('', 'Пожелания/чего не хватает:', store.notes[sec.role].trim())
      lines.push('')
    }
    navigator.clipboard?.writeText(lines.join('\n')).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000) },
      () => {},
    )
  }

  const total = SECTIONS.reduce((n, s) => n + s.items.length, 0)
  const okCount = Object.values(store.checks).filter((s) => s === 'ok').length
  const badCount = Object.values(store.checks).filter((s) => s === 'bad').length
  const naCount = Object.values(store.checks).filter((s) => s === 'na').length
  const applicable = total - naCount
  const overall = applicable > 0 ? Math.round((okCount / applicable) * 100) : 0

  return (
    <>
      <Header />
      <section
        className="relative min-h-screen"
        style={{
          backgroundImage: 'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      >
        <Container>
          <div className="py-10 sm:py-14">
            <Link to="/portal" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
              <ArrowLeft size={14} /> Портал
            </Link>
            <div className="mt-4 flex items-center gap-2">
              <FlaskConical size={16} className="text-lime" />
              <Label accent>// тест-режим (временно)</Label>
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl">Чек-лист тестирования<span className="text-aqua">.</span></h1>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Пройдите систему под каждой ролью строго по инструкциям. Раздел «Общее» — краевые и неожиданные ситуации.
              Прогресс сохраняется в браузере.
            </p>

            {/* легенда чекбоксов */}
            <div className="mt-5 flex flex-wrap gap-4 border border-line bg-surface p-4 text-xs text-ink-soft">
              <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center border border-lime bg-lime/15 text-lime"><Check size={13} /></span> работает — функция есть и работает верно</span>
              <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center border border-danger bg-danger/15 text-danger"><X size={13} /></span> не работает — ошибка или работает не так</span>
              <span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center border border-ink-dim bg-ink-dim/20 text-ink-soft"><Minus size={13} /></span> недоступно — не смог проверить (напр. не вошёл)</span>
            </div>

            {/* общий прогресс */}
            <div className="clip-hud mt-6 border border-line-aqua bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">Общее соответствие</span>
                <span className={cn('font-display text-2xl', overall === 100 && applicable > 0 ? 'text-lime' : 'text-aqua')}>{overall}%</span>
              </div>
              <div className="mt-2 flex h-2.5 w-full overflow-hidden bg-surface-2">
                <div className="h-full bg-lime transition-all duration-500" style={{ width: `${total ? (okCount / total) * 100 : 0}%` }} />
                <div className="h-full bg-danger transition-all duration-500" style={{ width: `${total ? (badCount / total) * 100 : 0}%` }} />
                <div className="h-full bg-ink-dim/40 transition-all duration-500" style={{ width: `${total ? (naCount / total) * 100 : 0}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="border border-line-lime px-3 py-1.5 font-mono text-xs text-lime clip-btn">Работает: {okCount}</span>
                <span className="border border-line-strong px-3 py-1.5 font-mono text-xs text-danger clip-btn">Проблемы: {badCount}</span>
                <span className="border border-line px-3 py-1.5 font-mono text-xs text-ink-dim clip-btn">Недоступно: {naCount}</span>
                <span className="border border-line px-3 py-1.5 font-mono text-xs text-ink-muted clip-btn">Всего: {total}</span>
                <Button size="sm" variant="secondary" onClick={copyReport}><Copy size={14} /> {copied ? 'Скопировано' : 'Скопировать отчёт'}</Button>
                <button onClick={reset} className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-danger">
                  <RotateCcw size={13} /> Сбросить
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-8">
              {SECTIONS.map((sec) => {
                const ok = sec.items.filter((i) => store.checks[i.id] === 'ok').length
                const bad = sec.items.filter((i) => store.checks[i.id] === 'bad').length
                const na = sec.items.filter((i) => store.checks[i.id] === 'na').length
                return (
                  <div key={sec.role} className="clip-hud border border-line bg-surface p-5 sm:p-6">
                    <h2 className={cn('font-display text-xl', sec.accent)}>{sec.title}</h2>
                    <SectionProgress ok={ok} bad={bad} na={na} total={sec.items.length} />
                    <div className="mt-4 flex flex-col divide-y divide-line">
                      {sec.items.map((it) => {
                        const st = store.checks[it.id]
                        const c = comment(it.id)
                        const shots = files[it.id] ?? []
                        return (
                          <div key={it.id} className="py-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className={cn('text-sm font-medium', st === 'bad' ? 'text-danger' : st === 'ok' ? 'text-ink' : 'text-ink-soft')}>{it.text}</div>
                                <div className="mt-1 text-xs leading-relaxed text-ink-muted">{it.how}</div>
                                {it.link && (
                                  <Link to={it.link} className="mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] text-aqua transition-colors hover:underline">
                                    {it.linkLabel ?? 'Открыть раздел'} <ArrowRight size={12} />
                                  </Link>
                                )}
                              </div>
                              <div className="flex shrink-0 gap-1.5">
                                <button onClick={() => setStatus(it.id, 'ok')} className={cn('flex h-8 w-8 items-center justify-center border transition-colors', st === 'ok' ? 'border-lime bg-lime/15 text-lime' : 'border-line-strong text-ink-dim hover:border-lime/50')} aria-label="Работает"><Check size={15} /></button>
                                <button onClick={() => setStatus(it.id, 'bad')} className={cn('flex h-8 w-8 items-center justify-center border transition-colors', st === 'bad' ? 'border-danger bg-danger/15 text-danger' : 'border-line-strong text-ink-dim hover:border-danger/50')} aria-label="Не работает"><X size={15} /></button>
                                <button onClick={() => setStatus(it.id, 'na')} className={cn('flex h-8 w-8 items-center justify-center border transition-colors', st === 'na' ? 'border-ink-dim bg-ink-dim/20 text-ink-soft' : 'border-line-strong text-ink-dim hover:border-ink-soft/50')} aria-label="Недоступно"><Minus size={15} /></button>
                              </div>
                            </div>

                            {/* поля по пункту */}
                            <div className="mt-3 grid gap-2 lg:grid-cols-3">
                              <textarea value={c.add} onChange={(e) => setComment(it.id, { add: e.target.value })} rows={2} placeholder="Что добавить" className="resize-y border border-line-strong bg-surface-2 p-2 text-xs text-ink placeholder:text-lime/60 focus:border-lime focus:outline-none" />
                              <textarea value={c.improve} onChange={(e) => setComment(it.id, { improve: e.target.value })} rows={2} placeholder="Что улучшить" className="resize-y border border-line-strong bg-surface-2 p-2 text-xs text-ink placeholder:text-aqua/60 focus:border-aqua focus:outline-none" />
                              <textarea value={c.problems} onChange={(e) => setComment(it.id, { problems: e.target.value })} rows={2} placeholder="Проблемы / ошибки" className="resize-y border border-line-strong bg-surface-2 p-2 text-xs text-ink placeholder:text-danger/60 focus:border-danger focus:outline-none" />
                            </div>

                            {/* скриншоты */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1.5 border border-line-strong px-2.5 py-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:border-aqua hover:text-aqua clip-btn">
                                <ImagePlus size={13} /> Скриншот
                                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(it.id, e.target.files); e.target.value = '' }} />
                              </label>
                              {shots.map((f, idx) => (
                                <span key={idx} className="group relative">
                                  <img src={URL.createObjectURL(f)} alt="" className="h-12 w-12 border border-line-strong object-cover" />
                                  <button onClick={() => removeFile(it.id, idx)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center border border-line-strong bg-bg text-ink-muted hover:text-danger" aria-label="Удалить"><X size={11} /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4">
                      <Label>Пожелания / чего не хватает</Label>
                      <textarea
                        value={store.notes[sec.role] ?? ''}
                        onChange={(e) => setNote(sec.role, e.target.value)}
                        rows={3}
                        placeholder="Что улучшить, добавить, что неудобно…"
                        className="mt-2 w-full resize-y border border-line-strong bg-surface-2 p-3 text-sm text-ink placeholder:text-ink-dim focus:border-aqua focus:outline-none"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Отправка отчёта суперадминистратору */}
            <div className="clip-hud mt-10 border border-line-lime bg-surface p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-lime" />
                <Label accent>// отправить отчёт суперадминистратору</Label>
              </div>
              {user ? (
                <>
                  <div className="mt-4 flex items-center gap-3.5">
                    <RoleAvatar seed={user.id} rank={rank.rank} role={user.role} size={48} />
                    <div>
                      <div className="font-display text-lg text-ink">{user.callsign}</div>
                      <div className="font-mono text-[11px] text-ink-dim">
                        {ROLE_RU[user.role] ?? user.role} · RANK {rank.rank} · соответствие {overall}% · проблем {badCount}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-ink-muted">
                    Отчёт с вашими отметками и пожеланиями уйдёт суперадминистратору в раздел «Тесты» админ-панели.
                    Указывается, кто тестировал и по какой роли.
                  </p>
                  <Button className="mt-4" onClick={sendReport} disabled={sending || sent}>
                    <Send size={15} /> {sent ? 'Отчёт отправлен' : sending ? '…' : 'Отправить отчёт'}
                  </Button>
                </>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  Войдите в аккаунт, чтобы отправить отчёт (в нём будет указано, кто и по какой роли тестировал).
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
