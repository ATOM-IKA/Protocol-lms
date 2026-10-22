import { BLOCK_DEFS, flattenLeaves, type Node } from './blocks'
import type { Exercise } from './exercises'

export interface Check { label: string; ok: boolean; weight: number; tip?: string }
export interface ScoreResult { percent: number; checks: Check[]; verdict: string }

function leafCount(leaves: Node[], kind: string): number {
  return leaves.filter((n) => n.kind === kind).length
}

export function scoreDesign(nodes: Node[], ex: Exercise): ScoreResult {
  const leaves = flattenLeaves(nodes)
  const checks: Check[] = []
  const r = ex.rules

  if (ex.free) {
    // свободный режим — общая эвристика качества
    const ctas = leaves.filter((n) => BLOCK_DEFS[n.kind].cta).length
    const hasStructure = leaves.some((n) => n.kind === 'nav') || leaves.some((n) => BLOCK_DEFS[n.kind].hero)
    const hasHeading = leaves.some((n) => n.kind === 'heading' || BLOCK_DEFS[n.kind].hero)
    checks.push({ label: 'Есть смысловая структура (навигация/герой)', ok: hasStructure, weight: 2, tip: 'Добавьте навигацию или герой' })
    checks.push({ label: 'Есть заголовок', ok: hasHeading, weight: 1, tip: 'Добавьте заголовок' })
    checks.push({ label: 'Один главный CTA', ok: ctas === 1, weight: 2, tip: ctas === 0 ? 'Добавьте кнопку' : 'Оставьте одну главную кнопку' })
    checks.push({ label: 'Достаточно контента', ok: leaves.length >= 3, weight: 1, tip: 'Добавьте блоки' })
    checks.push({ label: 'Не перегружено', ok: leaves.length <= 14, weight: 1, tip: 'Уберите лишнее' })
  } else {
    for (const [kind, need] of Object.entries(ex.required)) {
      const have = leafCount(leaves, kind)
      const def = BLOCK_DEFS[kind as keyof typeof BLOCK_DEFS]
      checks.push({ label: `${def.label}: ${have}/${need}`, ok: have >= (need ?? 0), weight: 3, tip: have < (need ?? 0) ? `Добавьте «${def.label}»` : undefined })
    }
    if (r.firstShouldBe) {
      const ok = nodes[0]?.kind === r.firstShouldBe
      checks.push({ label: `Первым — «${BLOCK_DEFS[r.firstShouldBe].label}»`, ok, weight: 2, tip: ok ? undefined : 'Переместите его наверх' })
    }
    if (r.lastShouldBe) {
      const ok = nodes[nodes.length - 1]?.kind === r.lastShouldBe
      checks.push({ label: `Последним — «${BLOCK_DEFS[r.lastShouldBe].label}»`, ok, weight: 2, tip: ok ? undefined : 'Переместите его вниз' })
    }
    if (r.heroNearTop) {
      const idx = nodes.findIndex((n) => BLOCK_DEFS[n.kind].hero)
      const ok = idx >= 0 && idx <= 1
      checks.push({ label: 'Герой — в начале', ok, weight: 2, tip: ok ? undefined : 'Поднимите герой выше' })
    }
    if (r.singleCTA) {
      const ctas = leaves.filter((n) => BLOCK_DEFS[n.kind].cta).length
      checks.push({ label: 'Один главный CTA', ok: ctas === 1, weight: 2, tip: ctas === 0 ? 'Добавьте кнопку-CTA' : ctas > 1 ? 'Оставьте одну' : undefined })
    }
    if (r.minBlocks || r.maxBlocks) {
      const n = leaves.length
      const ok = (!r.minBlocks || n >= r.minBlocks) && (!r.maxBlocks || n <= r.maxBlocks)
      checks.push({ label: 'Сбалансированный объём', ok, weight: 1, tip: ok ? undefined : r.maxBlocks && n > r.maxBlocks ? 'Слишком много блоков' : 'Добавьте содержания' })
    }
  }

  const totalW = checks.reduce((s, c) => s + c.weight, 0)
  const gotW = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  const percent = totalW > 0 ? Math.round((gotW / totalW) * 100) : 0
  const verdict =
    leaves.length === 0 ? 'Начните собирать макет' : percent >= 90 ? 'Отличный дизайн' : percent >= 70 ? 'Хорошо, есть что улучшить' : percent >= 40 ? 'Неплохое начало' : 'Ещё поработать'
  return { percent, checks, verdict }
}
