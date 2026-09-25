import { describe, expect, it } from 'vitest'

import {
  STAT_CREATION_BUDGET,
  statisticCreationCost,
  statisticExceedsCreationSoftCap,
  statisticsCreationRemaining,
  statisticsCreationSpent,
} from './calculations'
import type { Statistic } from './types'

function stat(baseValue: number): Statistic {
  return {
    key: `stat-${baseValue}`,
    name: `Stat ${baseValue}`,
    baseValue,
    color: '#000000',
    modifiers: [],
  }
}

describe('statisticCreationCost', () => {
  it('calculates costs from 8 to 18 with progressive brackets', () => {
    expect(statisticCreationCost(8)).toBe(0)
    expect(statisticCreationCost(14)).toBe(6)
    expect(statisticCreationCost(15)).toBe(8)
    expect(statisticCreationCost(16)).toBe(10)
    expect(statisticCreationCost(17)).toBe(13)
    expect(statisticCreationCost(18)).toBe(16)
  })

  it('refunds one point per step under 8', () => {
    expect(statisticCreationCost(7)).toBe(-1)
    expect(statisticCreationCost(6)).toBe(-2)
    expect(statisticCreationCost(0)).toBe(-8)
  })

  it('keeps increasing above 18 and flags soft cap overflow', () => {
    expect(statisticCreationCost(19)).toBe(19)
    expect(statisticCreationCost(20)).toBe(22)
    expect(statisticExceedsCreationSoftCap(18)).toBe(false)
    expect(statisticExceedsCreationSoftCap(19)).toBe(true)
  })
})

describe('statisticsCreation budget summary', () => {
  it('computes spent and remaining from all base values', () => {
    const values = [14, 14, 14, 8, 8, 8]
    const stats = values.map((value) => stat(value))

    expect(statisticsCreationSpent(stats)).toBe(18)
    expect(statisticsCreationRemaining(stats)).toBe(STAT_CREATION_BUDGET - 18)
  })

  it('handles overspending and refunds in the same set', () => {
    const values = [18, 18, 8, 8, 8, 6]
    const stats = values.map((value) => stat(value))

    expect(statisticsCreationSpent(stats)).toBe(30)
    expect(statisticsCreationRemaining(stats)).toBe(-5)
  })
})
