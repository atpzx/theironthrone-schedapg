import type { Statistic } from './types'

export const STAT_CREATION_BASE_VALUE = 8
export const STAT_CREATION_BUDGET = 25
export const STAT_CREATION_SOFT_CAP = 18

function normalizedInteger(value: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return STAT_CREATION_BASE_VALUE
  return Math.trunc(parsed)
}

export function statisticTotal(statistic: Statistic): number {
  return statistic.baseValue + statistic.modifiers.reduce((total, modifier) => total + modifier.value, 0)
}

export function statisticModifier(total: number): number {
  return Math.floor((total - 10) / 2)
}

export function statisticCreationCost(baseValue: number): number {
  const score = normalizedInteger(baseValue)
  if (score <= STAT_CREATION_BASE_VALUE) {
    return score - STAT_CREATION_BASE_VALUE
  }

  let total = 0
  total += Math.min(score, 14) - STAT_CREATION_BASE_VALUE
  if (score > 14) total += (Math.min(score, 16) - 14) * 2
  if (score > 16) total += (Math.min(score, STAT_CREATION_SOFT_CAP) - 16) * 3
  if (score > STAT_CREATION_SOFT_CAP) total += (score - STAT_CREATION_SOFT_CAP) * 3
  return total
}

export function statisticExceedsCreationSoftCap(baseValue: number): boolean {
  return normalizedInteger(baseValue) > STAT_CREATION_SOFT_CAP
}

export function statisticsCreationSpent(statistics: Statistic[]): number {
  return statistics.reduce((total, stat) => total + statisticCreationCost(stat.baseValue), 0)
}

export function statisticsCreationRemaining(statistics: Statistic[]): number {
  return STAT_CREATION_BUDGET - statisticsCreationSpent(statistics)
}

export function experienceProgress(current: number, nextLevel: number): number {
  if (nextLevel <= 0) return 0
  return Math.max(0, Math.min(100, (current / nextLevel) * 100))
}