import type { Statistic } from './types'

export function statisticTotal(statistic: Statistic): number {
  return statistic.baseValue + statistic.modifiers.reduce((total, modifier) => total + modifier.value, 0)
}

export function statisticModifier(total: number): number {
  return Math.floor((total - 10) / 2)
}

export function experienceProgress(current: number, nextLevel: number): number {
  if (nextLevel <= 0) return 0
  return Math.max(0, Math.min(100, (current / nextLevel) * 100))
}