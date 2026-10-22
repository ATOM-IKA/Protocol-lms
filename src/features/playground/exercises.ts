import type { LeafKind, NodeKind } from './blocks'

export interface ExerciseRules {
  firstShouldBe?: LeafKind
  lastShouldBe?: LeafKind
  heroNearTop?: boolean
  singleCTA?: boolean
  minBlocks?: number
  maxBlocks?: number
}

export interface Exercise {
  id: string
  title: string
  task: string
  frame: 'mobile' | 'desktop'
  palette: NodeKind[]
  required: Partial<Record<LeafKind, number>>
  rules: ExerciseRules
  /** Свободный режим: без жёстких требований, оценка по эвристике. */
  free?: boolean
}

const FULL_PALETTE: NodeKind[] = ['row', 'nav', 'hero', 'heading', 'text', 'button', 'image', 'card', 'input', 'footer', 'spacer', 'badge', 'list', 'avatar', 'stat']

export const EXERCISES: Exercise[] = [
  {
    id: 'free',
    title: 'Свободный холст',
    task: 'Творите: собирайте любой макет. Оценка — по общим UX/UI-принципам (структура, иерархия, единый CTA, баланс).',
    frame: 'desktop',
    palette: FULL_PALETTE,
    required: {},
    rules: {},
    free: true,
  },
  {
    id: 'landing',
    title: 'Иерархия лендинга',
    task: 'Соберите лендинг: сверху навигация, крупный герой с одним CTA, контент, внизу футер. Один главный призыв к действию.',
    frame: 'desktop',
    palette: FULL_PALETTE,
    required: { nav: 1, hero: 1, button: 1, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', heroNearTop: true, singleCTA: true, minBlocks: 4, maxBlocks: 12 },
  },
  {
    id: 'cards',
    title: 'Карточный каталог',
    task: 'Каталог: навигация, заголовок, три карточки (можно в один ряд), футер. Ровный ритм.',
    frame: 'desktop',
    palette: FULL_PALETTE,
    required: { nav: 1, heading: 1, card: 3, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', minBlocks: 5, maxBlocks: 14 },
  },
  {
    id: 'mobile-form',
    title: 'Мобильная форма',
    task: 'Экран входа для мобильного: навигация, заголовок, два поля, кнопка, футер. Компактно.',
    frame: 'mobile',
    palette: ['nav', 'heading', 'text', 'input', 'button', 'footer', 'spacer'],
    required: { nav: 1, heading: 1, input: 2, button: 1, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', singleCTA: true, minBlocks: 5, maxBlocks: 10 },
  },
  {
    id: 'article',
    title: 'Читаемая статья',
    task: 'Статья: навигация, заголовок, обложка, абзацы текста, футер. Комфортная типографика.',
    frame: 'desktop',
    palette: ['nav', 'heading', 'image', 'text', 'card', 'footer', 'spacer'],
    required: { nav: 1, heading: 1, image: 1, text: 2, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', minBlocks: 5, maxBlocks: 14 },
  },
  {
    id: 'dashboard',
    title: 'Дашборд с метриками',
    task: 'Панель: навигация, заголовок, ряд из 3 метрик, список активности, футер. Данные — на первом экране.',
    frame: 'desktop',
    palette: FULL_PALETTE,
    required: { nav: 1, heading: 1, stat: 3, list: 1, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', minBlocks: 6, maxBlocks: 16 },
  },
  {
    id: 'pricing',
    title: 'Тарифы',
    task: 'Страница тарифов: навигация, заголовок, три карточки-тарифа с бейджем и кнопкой, футер. Один акцентный тариф.',
    frame: 'desktop',
    palette: FULL_PALETTE,
    required: { nav: 1, heading: 1, card: 3, badge: 1, button: 3, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', minBlocks: 6, maxBlocks: 18 },
  },
  {
    id: 'profile',
    title: 'Профиль пользователя',
    task: 'Экран профиля: навигация, аватар, заголовок-имя, список данных, кнопка «Редактировать», футер.',
    frame: 'mobile',
    palette: FULL_PALETTE,
    required: { nav: 1, avatar: 1, heading: 1, list: 1, button: 1, footer: 1 },
    rules: { firstShouldBe: 'nav', lastShouldBe: 'footer', singleCTA: true, minBlocks: 5, maxBlocks: 12 },
  },
]

export interface CustomSpec {
  task: string
  required: Partial<Record<LeafKind, number>>
  firstNav?: boolean
  lastFooter?: boolean
  singleCTA?: boolean
  frame?: 'mobile' | 'desktop'
}

/** Собрать своё задание с критериями авто-проверки (режим преподавателя). */
export function makeCustomExercise(spec: CustomSpec | string): Exercise {
  // обратная совместимость: строка = свободный режим с описанием
  if (typeof spec === 'string') {
    return { id: 'custom', title: 'Своё задание', task: spec || 'Соберите макет по заданию преподавателя.', frame: 'desktop', palette: FULL_PALETTE, required: {}, rules: {}, free: true }
  }
  const hasCriteria = Object.values(spec.required).some((n) => (n ?? 0) > 0) || spec.firstNav || spec.lastFooter || spec.singleCTA
  return {
    id: 'custom',
    title: 'Своё задание',
    task: spec.task || 'Соберите макет по заданию преподавателя.',
    frame: spec.frame ?? 'desktop',
    palette: FULL_PALETTE,
    required: spec.required,
    rules: {
      firstShouldBe: spec.firstNav ? 'nav' : undefined,
      lastShouldBe: spec.lastFooter ? 'footer' : undefined,
      singleCTA: spec.singleCTA,
    },
    free: !hasCriteria, // без критериев — свободная эвристика
  }
}
