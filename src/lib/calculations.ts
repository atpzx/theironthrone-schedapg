import type { Statistic, StatisticModifierBuckets, StatisticModifierCode } from './types'

export const STAT_CREATION_BASE_VALUE = 8
export const STAT_CREATION_BUDGET = 25
export const STAT_CREATION_SOFT_CAP = 18
export const STAT_MODIFIER_CODES: StatisticModifierCode[] = ['PC', 'ME', 'ML', 'MT', 'MV', 'PB']

export const STAT_MODIFIER_LABELS: Record<StatisticModifierCode, string> = {
  PC: 'Punti Creazione',
  ME: "Modificatore d'eta",
  ML: 'Modificatore di Livello',
  MT: 'Modificatore Temporaneo',
  MV: 'Modificatore Vari',
  PB: 'Punti Bonus',
}

function normalizedInteger(value: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.trunc(parsed)
}

function normalizedIntegerWithFallback(value: number, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.trunc(parsed)
}

function emptyBuckets(): StatisticModifierBuckets {
  return {
    PC: 0,
    ME: 0,
    ML: 0,
    MT: 0,
    MV: 0,
    PB: 0,
  }
}

export function normalizeStatisticModifierBuckets(statistic: Statistic): StatisticModifierBuckets {
  const source = statistic.modifierBuckets
  const buckets = emptyBuckets()
  if (!source) return buckets
  for (const code of STAT_MODIFIER_CODES) {
    const values = source[code]
    if (values === undefined || values === null) continue
    if (typeof values === 'number') {
      buckets[code] = normalizedInteger(values)
      continue
    }
    if (typeof values === 'object') {
      const oldPositive = normalizedInteger((values as { positive?: number }).positive ?? 0)
      const oldNegative = normalizedInteger((values as { negative?: number }).negative ?? 0)
      buckets[code] = Math.max(0, oldPositive) - Math.max(0, oldNegative)
    }
  }
  return buckets
}

export function statisticModifierValue(statistic: Statistic, code: StatisticModifierCode): number {
  const buckets = normalizeStatisticModifierBuckets(statistic)
  if (code === 'PC') return statisticCreationBonusFromSpentPoints(buckets.PC)
  return buckets[code]
}

function statisticLegacyModifierTotal(statistic: Statistic): number {
  return statistic.modifiers.reduce((total, modifier) => total + normalizedInteger(modifier.value), 0)
}

function statisticLegacyPcDelta(statistic: Statistic): number {
  const pcModifier = statistic.modifiers.find((modifier) => String(modifier.name || '').trim().toUpperCase() === 'PC')
  return normalizedInteger(pcModifier?.value ?? 0)
}

export function statisticModifierTotal(statistic: Statistic): number {
  if (!statistic.modifierBuckets) return statisticLegacyModifierTotal(statistic)
  return STAT_MODIFIER_CODES.reduce((total, code) => total + statisticModifierValue(statistic, code), 0)
}

export function statisticCreationScore(statistic: Statistic): number {
  return STAT_CREATION_BASE_VALUE + statisticCreationBonusFromSpentPoints(statisticCreationSpentPointsFromStatistic(statistic))
}

export function statisticTotal(statistic: Statistic): number {
  return normalizedIntegerWithFallback(statistic.baseValue, STAT_CREATION_BASE_VALUE) + statisticModifierTotal(statistic)
}

export function statisticModifier(total: number): number {
  return Math.floor((total - 10) / 2)
}

export function statisticCreationCost(score: number): number {
  const normalizedScore = normalizedIntegerWithFallback(score, STAT_CREATION_BASE_VALUE)
  if (normalizedScore <= STAT_CREATION_BASE_VALUE) {
    return normalizedScore - STAT_CREATION_BASE_VALUE
  }

  let total = 0
  total += Math.min(normalizedScore, 14) - STAT_CREATION_BASE_VALUE
  if (normalizedScore > 14) total += (Math.min(normalizedScore, 16) - 14) * 2
  if (normalizedScore > 16) total += (Math.min(normalizedScore, STAT_CREATION_SOFT_CAP) - 16) * 3
  if (normalizedScore > STAT_CREATION_SOFT_CAP) total += (normalizedScore - STAT_CREATION_SOFT_CAP) * 3
  return total
}

export function statisticCreationBonusFromSpentPoints(points: number): number {
  const normalizedPoints = Math.max(0, normalizedInteger(points))
  let bonus = 0
  while (statisticCreationCost(STAT_CREATION_BASE_VALUE + bonus + 1) <= normalizedPoints) {
    bonus += 1
  }
  return bonus
}

export function statisticCreationSpentPointsFromStatistic(statistic: Statistic): number {
  if (!statistic.modifierBuckets) {
    const legacyPcDelta = statisticLegacyPcDelta(statistic)
    const legacyScore = normalizedIntegerWithFallback(statistic.baseValue, STAT_CREATION_BASE_VALUE) + legacyPcDelta
    return Math.max(0, statisticCreationCost(legacyScore))
  }
  const buckets = normalizeStatisticModifierBuckets(statistic)
  return Math.max(0, normalizedInteger(buckets.PC))
}

export function statisticCreationCostFromStatistic(statistic: Statistic): number {
  return statisticCreationSpentPointsFromStatistic(statistic)
}

export function statisticExceedsCreationSoftCap(statistic: Statistic): boolean {
  return statisticCreationScore(statistic) > STAT_CREATION_SOFT_CAP
}

export function statisticsCreationSpent(statistics: Statistic[]): number {
  return statistics.reduce((total, statistic) => total + statisticCreationSpentPointsFromStatistic(statistic), 0)
}

export function statisticsCreationRemaining(statistics: Statistic[]): number {
  return STAT_CREATION_BUDGET - statisticsCreationSpent(statistics)
}

export function experienceProgress(current: number, nextLevel: number): number {
  if (nextLevel <= 0) return 0
  return Math.max(0, Math.min(100, (current / nextLevel) * 100))
}