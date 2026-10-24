import { describe, expect, it } from 'vitest'
import { academicYear, groupCode } from './group'

describe('учебный год и код группы', () => {
  it('учебный год начинается 1 сентября', () => {
    expect(academicYear(new Date(2026, 6, 15))).toBe(2025) // июль
    expect(academicYear(new Date(2026, 8, 1))).toBe(2026) // 1 сентября
    expect(academicYear(new Date(2026, 0, 10))).toBe(2025) // январь
  })

  it('код группы: курс + номер + специальность', () => {
    const y = academicYear()
    expect(groupCode('ИСиП', y, 1)).toBe('11-ИСиП') // поступил в этом году — 1 курс
    expect(groupCode('ИСиП', y - 1, 2)).toBe('22-ИСиП') // год назад — 2 курс
    expect(groupCode('ИСиП', y + 5, 1)).toBe('11-ИСиП') // будущий год не уходит в минус
  })
})
