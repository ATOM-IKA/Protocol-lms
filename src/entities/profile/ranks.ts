export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'SSS+'

/** Ранги прокачки студента (F→SSS). SSS+ — только у супер-админа. */
export const RANKS: Rank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']

export type FrameKind = 'none' | 'ticks' | 'hex' | 'double' | 'crown'

export interface RankStyle {
  /** Палитра геометрии аватара. */
  palette: string[]
  /** Кол-во полигонов глифа. */
  shapes: number
  /** Кол-во концентрических колец. */
  rings: number
  /** Сила свечения 0..1. */
  glow: number
  /** Цвет ореола/свечения. */
  halo: string
  frame: FrameKind
  /** Вращение внешнего кольца. */
  spin: boolean
  /** Пульсация ядра. */
  pulse: boolean
  /** Кол-во орбитальных частиц. */
  particles: number
  /** Подпись-девиз ранга. */
  motto: string
}

export const RANK_STYLES: Record<Rank, RankStyle> = {
  F:   { palette: ['#5a6474', '#3a4560'], shapes: 2, rings: 0, glow: 0,    halo: '#5a6474', frame: 'none',   spin: false, pulse: false, particles: 0, motto: 'INIT' },
  E:   { palette: ['#4d7f92', '#3a4560'], shapes: 3, rings: 1, glow: 0,    halo: '#4d7f92', frame: 'none',   spin: false, pulse: false, particles: 0, motto: 'BOOT' },
  D:   { palette: ['#3a745d', '#4d7f92'], shapes: 4, rings: 1, glow: 0.15, halo: '#3a745d', frame: 'none',   spin: false, pulse: false, particles: 0, motto: 'SYNC' },
  C:   { palette: ['#4d7f92', '#9fe8ff', '#3a745d'], shapes: 5, rings: 2, glow: 0.3, halo: '#9fe8ff', frame: 'hex', spin: false, pulse: false, particles: 0, motto: 'LINK' },
  B:   { palette: ['#9fe8ff', '#3a745d', '#4d7f92'], shapes: 6, rings: 2, glow: 0.4, halo: '#9fe8ff', frame: 'hex', spin: false, pulse: true,  particles: 0, motto: 'FLOW' },
  A:   { palette: ['#9fe8ff', '#beef8d', '#3a745d'], shapes: 7, rings: 2, glow: 0.55, halo: '#9fe8ff', frame: 'hex', spin: true,  pulse: true,  particles: 0, motto: 'CORE' },
  S:   { palette: ['#9fe8ff', '#beef8d', '#c4f2ff'], shapes: 8, rings: 3, glow: 0.72, halo: '#9fe8ff', frame: 'hex', spin: true,  pulse: true,  particles: 3, motto: 'APEX' },
  SS:  { palette: ['#c4f2ff', '#beef8d', '#9fe8ff', '#d2f7a8'], shapes: 9, rings: 3, glow: 0.86, halo: '#c4f2ff', frame: 'double', spin: true, pulse: true, particles: 5, motto: 'PRIME' },
  SSS: { palette: ['#ffe08a', '#ffd24a', '#c4f2ff', '#beef8d', '#ff9de6'], shapes: 10, rings: 3, glow: 1, halo: '#ffd24a', frame: 'crown', spin: true, pulse: true, particles: 7, motto: 'ASCENDANT' },
  'SSS+': { palette: ['#ff3b57', '#ff6b6b', '#ff9de6', '#ffd24a', '#ffffff'], shapes: 10, rings: 3, glow: 1, halo: '#ff3b57', frame: 'crown', spin: true, pulse: true, particles: 9, motto: 'OVERLORD' },
}
