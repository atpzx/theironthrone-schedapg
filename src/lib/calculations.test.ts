import { describe, expect, it } from 'vitest'

import {
  STAT_CREATION_BUDGET,
  MAX_CHARACTER_LEVEL,
  experienceLevelFromClasses,
  experienceNextLevelXp,
  normalizeCharacterLevel,
  socialStatusLep,
  statisticAgeModifier,
  statisticCreationCostFromStatistic,
  statisticCreationCost,
  statisticExceedsCreationSoftCap,
  statisticTotal,
  statisticsCreationRemaining,
  statisticsCreationSpent,
} from './calculations'
import type { Statistic } from './types'

function stat(pcPoints: number, extra = 0): Statistic {
  return {
    key: `stat-${pcPoints}-${extra}`,
    name: `Stat ${pcPoints}`,
    baseValue: 8,
    color: '#000000',
    modifierBuckets: {
      ME: extra,
      ML: 0,
      MT: 0,
      MV: 0,
      PB: 0,
      PC: pcPoints,
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
    expect(statisticExceedsCreationSoftCap(stat(16))).toBe(false)
    expect(statisticExceedsCreationSoftCap(stat(19))).toBe(true)
  })
})

describe('statisticsCreation budget summary', () => {
  it('computes spent and remaining from raw PC spent points', () => {
    const stats = [stat(6), stat(6), stat(6), stat(0), stat(0), stat(0)]

    expect(statisticsCreationSpent(stats)).toBe(18)
    expect(statisticsCreationRemaining(stats)).toBe(STAT_CREATION_BUDGET - 18)
  })

  it('handles overspending in the same set', () => {
    const stats = [stat(10), stat(10), stat(0), stat(0), stat(0), stat(10)]

    expect(statisticsCreationSpent(stats)).toBe(30)
    expect(statisticsCreationRemaining(stats)).toBe(-5)
  })

  it('maps PC spent points to stepped bonus on totals', () => {
    expect(statisticTotal(stat(8))).toBe(15)
    expect(statisticTotal(stat(10))).toBe(16)
  })

  it('ignores non-PC modifiers for creation budget but applies them to total stat', () => {
    const withExtra = stat(8, 3)
    const withoutExtra = stat(8, 0)

    expect(statisticCreationCostFromStatistic(withExtra)).toBe(8)
    expect(statisticsCreationSpent([withExtra])).toBe(statisticsCreationSpent([withoutExtra]))
    expect(statisticTotal(withExtra)).toBe(18)
    expect(statisticTotal(withoutExtra)).toBe(15)
  })
})

describe('statisticAgeModifier', () => {
  const strength = { ...stat(0), key: 'strength', name: 'Forza' }
  const dexterity = { ...stat(0), key: 'dexterity', name: 'Destrezza' }
  const constitution = { ...stat(0), key: 'constitution', name: 'Costituzione' }
  const intelligence = { ...stat(0), key: 'intelligence', name: 'Intelligenza' }
  const wisdom = { ...stat(0), key: 'wisdom', name: 'Saggezza' }
  const charisma = { ...stat(0), key: 'charisma', name: 'Carisma' }

  it('returns zero when age is missing or below minimum range', () => {
    expect(statisticAgeModifier(undefined, strength)).toBe(0)
    expect(statisticAgeModifier(6, strength)).toBe(0)
  })

  it('applies childhood brackets correctly', () => {
    expect(statisticAgeModifier(8, strength)).toBe(-4)
    expect(statisticAgeModifier(8, dexterity)).toBe(2)
    expect(statisticAgeModifier(11, charisma)).toBe(2)
    expect(statisticAgeModifier(13, constitution)).toBe(-2)
    expect(statisticAgeModifier(15, strength)).toBe(-1)
  })

  it('applies adult and elder brackets correctly', () => {
    expect(statisticAgeModifier(34, wisdom)).toBe(0)
    expect(statisticAgeModifier(52, intelligence)).toBe(1)
    expect(statisticAgeModifier(69, dexterity)).toBe(-3)
    expect(statisticAgeModifier(70, constitution)).toBe(-6)
    expect(statisticAgeModifier(70, charisma)).toBe(3)
  })
})

describe('experience and LEP helpers', () => {
  it('keeps character levels between 1 and 20', () => {
    expect(normalizeCharacterLevel(0)).toBe(1)
    expect(normalizeCharacterLevel(12.8)).toBe(12)
    expect(normalizeCharacterLevel(21)).toBe(MAX_CHARACTER_LEVEL)
  })

  it('derives LEP from social status', () => {
    expect(socialStatusLep(1)).toBe(0)
    expect(socialStatusLep(2)).toBe(1)
    expect(socialStatusLep(3)).toBe(2)
  })

  it('derives base level from class levels', () => {
    expect(experienceLevelFromClasses([{ name: 'Warrior', value: 1 }, { name: 'Rogue', value: 2 }])).toBe(3)
    expect(experienceLevelFromClasses([{ name: 'Unknown', value: 'x' }])).toBe(1)
    expect(experienceLevelFromClasses([{ name: 'Warrior', value: 12 }, { name: 'Rogue', value: 12 }])).toBe(MAX_CHARACTER_LEVEL)
  })

  it('computes next-level XP with LEP rule', () => {
    expect(experienceNextLevelXp(1, 1)).toBe(1000)
    expect(experienceNextLevelXp(1, 3)).toBe(6000)
    expect(experienceNextLevelXp(5, 4)).toBe(36000)
  })
})
