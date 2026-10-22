export type LeafKind =
  | 'nav' | 'hero' | 'heading' | 'text' | 'button' | 'image' | 'card' | 'input' | 'footer' | 'spacer'
  | 'badge' | 'list' | 'avatar' | 'stat'
export type NodeKind = LeafKind | 'row'

export type Align = 'left' | 'center' | 'right'
export type Tone = 'default' | 'aqua' | 'lime' | 'teal' | 'muted'
export type Size = 'sm' | 'md' | 'lg'

export interface Node {
  id: string
  kind: NodeKind
  text?: string
  align?: Align
  tone?: Tone
  size?: Size
  children?: Node[] // только для 'row'
}

export interface BlockDef {
  kind: NodeKind
  label: string
  cta?: boolean
  hero?: boolean
  /** Поддерживает редактируемый текст. */
  hasText?: boolean
  container?: boolean
}

export const BLOCK_DEFS: Record<NodeKind, BlockDef> = {
  row: { kind: 'row', label: 'Ряд (контейнер)', container: true },
  nav: { kind: 'nav', label: 'Навигация' },
  hero: { kind: 'hero', label: 'Герой', hero: true, hasText: true },
  heading: { kind: 'heading', label: 'Заголовок', hasText: true },
  text: { kind: 'text', label: 'Текст', hasText: true },
  button: { kind: 'button', label: 'Кнопка (CTA)', cta: true, hasText: true },
  image: { kind: 'image', label: 'Изображение' },
  card: { kind: 'card', label: 'Карточка', hasText: true },
  input: { kind: 'input', label: 'Поле ввода' },
  footer: { kind: 'footer', label: 'Футер' },
  spacer: { kind: 'spacer', label: 'Отступ' },
  badge: { kind: 'badge', label: 'Бейдж', hasText: true },
  list: { kind: 'list', label: 'Список' },
  avatar: { kind: 'avatar', label: 'Аватар' },
  stat: { kind: 'stat', label: 'Метрика', hasText: true },
}

export const TONE_HEX: Record<Tone, string> = {
  default: '#eaf2f0',
  aqua: '#9fe8ff',
  lime: '#beef8d',
  teal: '#3a745d',
  muted: '#7a8699',
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function newNode(kind: NodeKind): Node {
  const base: Node = { id: uid(), kind, align: 'center', tone: 'default', size: 'md' }
  if (kind === 'row') base.children = []
  if (BLOCK_DEFS[kind].hasText) {
    base.text =
      kind === 'button' ? 'Кнопка' : kind === 'heading' ? 'Заголовок' : kind === 'hero' ? 'Заголовок героя'
        : kind === 'card' ? 'Карточка' : kind === 'badge' ? 'NEW' : kind === 'stat' ? '128' : 'Текстовый блок'
  }
  return base
}

/** Все листовые блоки дерева (для оценки). */
export function flattenLeaves(nodes: Node[]): Node[] {
  const out: Node[] = []
  for (const n of nodes) {
    if (n.kind === 'row') out.push(...(n.children ?? []))
    else out.push(n)
  }
  return out
}
