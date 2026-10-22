import { GraduationCap, ClipboardCheck, Video, Boxes, Gamepad2, type LucideIcon } from 'lucide-react'

export type ProductAccent = 'aqua' | 'lime' | 'teal'

export interface Product {
  id: string
  title: string
  description: string
  icon: LucideIcon
  accent: ProductAccent
  /** Внутренний маршрут (react-router) — для встроенной СДО. */
  to?: string
  /** Внешняя ссылка — для сторонних проектов дистанционного формата. */
  href?: string
  status: 'live' | 'soon'
}

/**
 * Продукты портала — единая точка входа.
 * Чтобы «прицепить» другой проект дистанционного формата — добавьте сюда запись
 * с внешней ссылкой (href) и status: 'live'. Портал сам покажет её карточкой.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'lms',
    title: 'PROTOCOL · СДО',
    description: 'Основная система дистанционного обучения: курсы, уроки, тренажёры, сдача работ и оценки.',
    icon: GraduationCap,
    accent: 'aqua',
    to: '/login',
    status: 'live',
  },
  {
    id: 'game',
    title: 'PROTOCOL · Игра',
    description: 'Геймификация: ежедневные задания, внутренняя валюта и награды за учёбу. Отдельный игровой блок.',
    icon: Gamepad2,
    accent: 'lime',
    status: 'soon',
  },
  // --- слоты для других проектов (пример; замените href и поставьте status: 'live') ---
  {
    id: 'exams',
    title: 'Онлайн-тестирование',
    description: 'Внешняя система экзаменов и тестирования. Подключается ссылкой.',
    icon: ClipboardCheck,
    accent: 'lime',
    status: 'soon',
  },
  {
    id: 'webinars',
    title: 'Вебинары',
    description: 'Платформа видеозанятий и трансляций. Подключается ссылкой.',
    icon: Video,
    accent: 'teal',
    status: 'soon',
  },
  {
    id: 'more',
    title: 'Ещё проект',
    description: 'Свободный слот — добавьте свой сервис дистанционного формата в конфиге продуктов.',
    icon: Boxes,
    accent: 'aqua',
    status: 'soon',
  },
]
