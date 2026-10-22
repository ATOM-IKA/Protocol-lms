import { Sparkles, BookOpen, ShieldCheck, LifeBuoy, type LucideIcon } from 'lucide-react'

export interface DocLink {
  id: string
  title: string
  description: string
  icon: LucideIcon
  category: string
  /** Внутренняя страница. */
  to?: string
  /** Внешняя ссылка. */
  href?: string
}

/** Документация портала — разбита по категориям. Добавляйте новые разделы сюда. */
export const PORTAL_DOCS: DocLink[] = [
  { id: 'features', title: 'Возможности', description: 'Что умеет платформа и что делает каждая роль.', icon: Sparkles, category: 'Продукт', to: '/features' },
  { id: 'about', title: 'О платформе', description: 'Идея, преимущества и как всё устроено.', icon: BookOpen, category: 'Продукт', to: '/about' },
  { id: 'privacy', title: 'Политика конфиденциальности', description: 'Как обрабатываются персональные данные (152-ФЗ).', icon: ShieldCheck, category: 'Правовое', to: '/privacy' },
  { id: 'support', title: 'Помощь и поддержка', description: 'Вопросы по доступу и работе — к администрации учебного заведения.', icon: LifeBuoy, category: 'Поддержка', to: '/features' },
]
