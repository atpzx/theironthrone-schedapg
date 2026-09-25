import { describe, expect, it } from 'vitest'

import {
  STAT_CREATION_BUDGET,
  statisticCreationCostFromStatistic,
  statisticCreationCost,
  statisticExceedsCreationSoftCap,
  statisticTotal,
  statisticsCreationRemaining,
  statisticsCreationSpent,
} from './calculations'
import type { Statistic } from './types'

function stat(pcDelta: number, extra = 0): Statistic {
  return {
    key: `stat-${pcDelta}-${extra}`,
    name: `Stat ${pcDelta}`,
    baseValue: 8,
    color: '#000000',
    modifierBuckets: {
      ME: extra,
      ML: 0,
      MT: 0,
      MV: 0,
      PB: 0,
      PC: pcDelta,
    },
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
    expect(statisticExceedsCreationSoftCap(stat(10))).toBe(false)
    expect(statisticExceedsCreationSoftCap(stat(11))).toBe(true)
  })
})

describe('statisticsCreation budget summary', () => {
  it('computes spent and remaining only from PC deltas', () => {
    const stats = [stat(6), stat(6), stat(6), stat(0), stat(0), stat(0)]

    expect(statisticsCreationSpent(stats)).toBe(18)
    expect(statisticsCreationRemaining(stats)).toBe(STAT_CREATION_BUDGET - 18)
  })

  it('handles overspending and refunds in the same set', () => {
    const stats = [stat(10), stat(10), stat(0), stat(0), stat(0), stat(-2)]

    expect(statisticsCreationSpent(stats)).toBe(30)
    expect(statisticsCreationRemaining(stats)).toBe(-5)
  })

  it('ignores non-PC modifiers for creation budget but applies them to total stat', () => {
    const withExtra = stat(2, 3)
    const withoutExtra = stat(2, 0)

    expect(statisticCreationCostFromStatistic(withExtra)).toBe(statisticCreationCost(10))
    expect(statisticsCreationSpent([withExtra])).toBe(statisticsCreationSpent([withoutExtra]))
    expect(statisticTotal(withExtra)).toBe(13)
    expect(statisticTotal(withoutExtra)).toBe(10)
  })
})
