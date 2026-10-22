import type { LessonType } from '@/entities/course/types'

export type CalloutTone = 'info' | 'tip' | 'warn'

export type LessonBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'image'; url: string; caption?: string }
  | { id: string; type: 'callout'; tone: CalloutTone; text: string }
  | { id: string; type: 'divider' }
  | { id: string; type: 'trainer'; exerciseId: string }

export type BlockType = LessonBlock['type']

export function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

export function newBlock(type: BlockType): LessonBlock {
  switch (type) {
    case 'heading':
      return { id: uid(), type, text: 'Заголовок' }
    case 'text':
      return { id: uid(), type, text: 'Текст урока…' }
    case 'image':
      return { id: uid(), type, url: '', caption: '' }
    case 'callout':
      return { id: uid(), type, tone: 'info', text: 'Важная заметка' }
    case 'divider':
      return { id: uid(), type }
    case 'trainer':
      return { id: uid(), type, exerciseId: 'free' }
  }
}

export function parseContent(raw: string | undefined): LessonBlock[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? (v as LessonBlock[]) : []
  } catch {
    return []
  }
}

export function serializeContent(blocks: LessonBlock[]): string {
  return JSON.stringify(blocks)
}

/** Стартовый шаблон блоков по типу урока. */
export function templateFor(type: LessonType): LessonBlock[] {
  switch (type) {
    case 'lecture':
      return [
        { id: uid(), type: 'heading', text: 'Введение' },
        { id: uid(), type: 'text', text: 'Опишите тему лекции и ключевые идеи…' },
      ]
    case 'video':
      return [
        { id: uid(), type: 'heading', text: 'Видео-занятие' },
        { id: uid(), type: 'callout', tone: 'info', text: 'Материалы и конспект к видео' },
        { id: uid(), type: 'text', text: 'Краткое содержание…' },
      ]
    case 'practice':
      return [
        { id: uid(), type: 'heading', text: 'Практика' },
        { id: uid(), type: 'text', text: 'Что нужно сделать в тренажёре…' },
        { id: uid(), type: 'trainer', exerciseId: 'free' },
      ]
    case 'quiz':
      return [
        { id: uid(), type: 'heading', text: 'Проверка знаний' },
        { id: uid(), type: 'callout', tone: 'tip', text: 'Ответьте на вопросы по теме' },
      ]
    case 'assignment':
      return [
        { id: uid(), type: 'heading', text: 'Задание' },
        { id: uid(), type: 'callout', tone: 'tip', text: 'Условие задания: соберите макет по требованиям.' },
        { id: uid(), type: 'trainer', exerciseId: 'landing' },
      ]
  }
}
