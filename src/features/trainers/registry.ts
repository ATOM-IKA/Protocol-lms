import { Blocks, Terminal, Network, Code2, type LucideIcon } from 'lucide-react'

export type TrainerStatus = 'live' | 'soon'

export interface TrainerMeta {
  id: string
  title: string
  discipline: string
  description: string
  icon: LucideIcon
  status: TrainerStatus
}

/** Библиотека тренажёров: расширяется новыми дисциплинами. */
export const TRAINERS: TrainerMeta[] = [
  { id: 'uxui', title: 'UX/UI Конструктор', discipline: 'Дизайн', description: 'Собирай макеты из блоков: вложенность, выравнивание, цвета, размеры — с живой оценкой дизайна.', icon: Blocks, status: 'live' },
  { id: 'console', title: 'Консоль / Терминал', discipline: 'Системное администрирование', description: 'Виртуальный терминал: файлы, каталоги, права доступа. Настоящий разбор команд и авто-проверка.', icon: Terminal, status: 'live' },
  { id: 'network', title: 'Сети · ViPNet', discipline: 'Сетевые технологии', description: 'Схема сети: соединяй узлы, настраивай защищённые каналы через координатор ViPNet.', icon: Network, status: 'live' },
  { id: 'app', title: 'Разработка приложений', discipline: 'Программирование', description: 'Пиши функции на JavaScript и прогоняй их через набор тестов с мгновенной проверкой.', icon: Code2, status: 'live' },
]
