import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, GraduationCap, UserCog, Shield, Cpu, ChevronRight } from 'lucide-react'
import { Header } from '@/widgets/Header'
import { Container } from '@/shared/ui/Container'
import { Button } from '@/shared/ui/Button'
import { Label } from '@/shared/ui/Label'
import { staggerContainer, fadeInUp } from '@/shared/lib/motion'

interface Role {
  icon: typeof GraduationCap
  glyph: string
  title: string
  tag: string
  accent: 'aqua' | 'lime' | 'ink'
  items: string[]
}

const ROLES: Role[] = [
  {
    icon: GraduationCap,
    glyph: '◈',
    title: 'Студент',
    tag: 'student · доступ к учёбе',
    accent: 'aqua',
    items: [
      'Вход по своему колледжу, выбор учебного заведения',
      'Каталог курсов только своего колледжа',
      'Запись на курс и отписка от него',
      'Прохождение уроков, которые открыл преподаватель, — старт с последнего места',
      'Сдача работ на любом уроке: текст + файлы (до 3, по 10 МБ) — уходит в проверку',
      'Прохождение подтверждает преподаватель оценкой: 3–5 — пройдено, 2 — нет',
      'Опыт зависит от оценки (5 — полный, 4/3 — меньше); пересдача двойки — потолок как у 4',
      'Ранг растёт по часам обучения: F → SSS (≈4000 ч — «выпускник»)',
      'Средний балл по курсу и по всем предметам',
      'Тренажёры с живой авто-проверкой',
      'Своя цифровая ID-карта профиля',
    ],
  },
  {
    icon: UserCog,
    glyph: '◇',
    title: 'Преподаватель',
    tag: 'teacher · всё как у студента + кабинет',
    accent: 'lime',
    items: [
      'Создание и редактирование своих курсов',
      'Разделы и уроки, блочный супер-редактор контента',
      'Два формата урока: лекция и практическая работа',
      'Пошаговое открытие уроков студентам',
      'Проверка сдач и оценки 2–5 — они определяют прохождение и опыт студента',
      'Просмотр файлов в проверке: PDF, код, изображения — прямо на месте',
      'Список записанных студентов, их прогресс и оценки',
      'Свой ранг растёт от числа студентов, прошедших уроки; особый аватар-рамка',
    ],
  },
  {
    icon: Shield,
    glyph: '▣',
    title: 'Администратор',
    tag: 'admin / superadmin · панель управления',
    accent: 'aqua',
    items: [
      'Админ колледжа управляет только своим колледжем; супер-админ — всеми',
      'Обзор: статистика по пользователям, курсам, записям, сдачам',
      'Пользователи: создание, смена роли и заведения, удаление',
      'Учебные заведения и журнал аудита (у супер-админа)',
      'Модерация курсов: публикация и удаление',
      'Ранг SSS у админов, SSS+ с красным неоном у супер-админа',
    ],
  },
  {
    icon: Cpu,
    glyph: '⌘',
    title: 'Системные',
    tag: 'общее · для всех и «под капотом»',
    accent: 'ink',
    items: [
      'Изоляция данных по колледжам и ролям на стороне сервера',
      'Оценки и опыт защищены сервером — подделать нельзя',
      'Особые аватары-рамки: сразу видно преподавателя, админа, супер-админа',
      'HTTPS и security-заголовки (CSP, HSTS)',
      '152-ФЗ: согласие на обработку ПДн + политика конфиденциальности',
      'Двуязычный интерфейс RU / EN, палитра ⌘K',
      'Адаптив: телефон, планшет, десктоп',
    ],
  },
]

const ACCENT: Record<Role['accent'], { border: string; text: string; mk: string }> = {
  aqua: { border: 'border-line-aqua', text: 'text-aqua', mk: 'text-aqua' },
  lime: { border: 'border-line-lime', text: 'text-lime', mk: 'text-lime' },
  ink: { border: 'border-line-strong', text: 'text-ink', mk: 'text-ink-muted' },
}

const CHIPS = [
  'Тренажёры: конструктор своих заданий + UX/UI, консоль, сети/ViPNet, код',
  'Ранги: студент по часам, препод по студентам, SSS/SSS+ у админов',
  'Оценка = прохождение (3–5), опыт зависит от оценки',
  'Directus · HTTPS · 152-ФЗ',
]

export function FeaturesPage() {
  return (
    <>
      <Header />
      <section
        className="relative"
        style={{
          backgroundImage:
            'linear-gradient(#11141d 1px, transparent 1px), linear-gradient(90deg, #11141d 1px, transparent 1px)',
          backgroundSize: '34px 34px',
        }}
      >
        <Container>
          <div className="py-14">
            <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
              <ArrowLeft size={14} /> на главную
            </Link>

            <div className="mt-6">
              <Label accent>// сводка возможностей</Label>
            </div>
            <h1 className="mt-3 text-4xl sm:text-5xl">Роли и права<span className="text-aqua">.</span></h1>
            <p className="mt-4 max-w-2xl text-ink-soft">
              PROTOCOL — система дистанционного обучения для колледжа: курсы своего учебного заведения,
              прохождение уроков, сдача и проверка работ, тренажёры с авто-оценкой, опыт и ранги.
              Ниже — что делает каждая роль и что обеспечивает система.
            </p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mt-10 grid gap-5 lg:grid-cols-2"
            >
              {ROLES.map((role) => {
                const a = ACCENT[role.accent]
                const Icon = role.icon
                return (
                  <motion.div key={role.title} variants={fadeInUp} className={`clip-hud border ${a.border} bg-surface p-6`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center border border-line-strong ${a.text}`}>
                        <Icon size={20} strokeWidth={1.75} />
                      </span>
                      <div>
                        <h2 className="font-display text-xl text-ink">{role.title}</h2>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{role.tag}</span>
                      </div>
                    </div>
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {role.items.map((it) => (
                        <li key={it} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2.5 text-sm text-ink-soft">
                          <ChevronRight size={13} className={`mt-1 ${a.mk}`} />
                          <span className="leading-snug">{it}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </motion.div>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {CHIPS.map((c) => (
                <span key={c} className="border border-line bg-surface-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <Link to="/login">
                <Button size="lg">Войти в систему →</Button>
              </Link>
              <Link to="/privacy" className="font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-aqua">
                политика конфиденциальности
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
