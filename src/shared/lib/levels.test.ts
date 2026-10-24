import { describe, expect, it } from 'vitest'
import {
  levelFromXp,
  rankFromHours,
  rankFromLevel,
  rankFromTeacherStudents,
  xpForLevel,
} from './levels'

describe('уровни и ранги', () => {
  it('первый уровень начинается с 0 XP, порог растёт', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    for (let l = 2; l < 40; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l))
  })

  it('levelFromXp считает уровень и прогресс внутри уровня', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, inLevel: 0 })
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    const r = levelFromXp(150)
    expect(r.inLevel + xpForLevel(r.level)).toBe(150)
    expect(r.forNext).toBe(xpForLevel(r.level + 1) - xpForLevel(r.level))
  })

  it('ранг по уровню: границы', () => {
    expect(rankFromLevel(1)).toBe('F')
    expect(rankFromLevel(3)).toBe('E')
    expect(rankFromLevel(10)).toBe('C')
    expect(rankFromLevel(40)).toBe('SSS')
  })

  it('ранг по часам и по числу студентов не убывает', () => {
    const order = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']
    const idx = (r: string) => order.indexOf(r)
    let prev = 0
    for (const h of [0, 50, 150, 350, 700, 1200, 2000, 3000, 4000]) {
      expect(idx(rankFromHours(h))).toBeGreaterThanOrEqual(prev)
      prev = idx(rankFromHours(h))
    }
    expect(rankFromHours(4000)).toBe('SSS')
    expect(rankFromTeacherStudents(0)).toBe('F')
    expect(rankFromTeacherStudents(240)).toBe('SSS')
  })
})
