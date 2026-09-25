import type { Statistic, StatisticModifierBuckets, StatisticModifierCode } from './types'
import type { NamedValue } from './types'

export const STAT_CREATION_BASE_VALUE = 8
export const STAT_CREATION_BUDGET = 25
export const STAT_CREATION_SOFT_CAP = 18
export const STAT_MODIFIER_CODES: StatisticModifierCode[] = ['PC', 'ME', 'ML', 'MT', 'MV', 'PB']
export const EXPERIENCE_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 1000,
  3: 3000,
  4: 6000,
  5: 10000,
  6: 15000,
  7: 21000,
  8: 28000,
  9: 36000,
  10: 45000,
  11: 55000,
  12: 66000,
  13: 78000,
  14: 91000,
  15: 105000,
  16: 120000,
  17: 136000,
  18: 153000,
  19: 171000,
  20: 190000,
}
const MAX_EXPERIENCE_LEVEL = 20

export const STAT_MODIFIER_LABELS: Record<StatisticModifierCode, string> = {
  PC: 'Punti Creazione',
  ME: "Modificatore d'eta",
  ML: 'Modificatore di Livello',
  MT: 'Modificatore Temporaneo',
  MV: 'Modificatore Vari',
  PB: 'Punti Bonus',
}

type AgeAffectedStatistic = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma'

function statisticKind(statistic: Statistic): AgeAffectedStatistic | null {
  const key = String(statistic.key || '').toLowerCase()
  const name = String(statistic.name || '').toLowerCase()

  if (key.includes('strength') || name.includes('forza')) return 'strength'
  if (key.includes('dexterity') || name.includes('destrezza')) return 'dexterity'
  if (key.includes('constitution') || name.includes('costituzione')) return 'constitution'
  if (key.includes('intelligence') || name.includes('intelligenza')) return 'intelligence'
  if (key.includes('wisdom') || name.includes('saggezza')) return 'wisdom'
  if (key.includes('charisma') || name.includes('carisma')) return 'charisma'

  return null
}

function ageModifierByKind(age: number, kind: AgeAffectedStatistic): number {
  if (!Number.isFinite(age)) return 0
  const normalizedAge = Math.trunc(age)
  if (normalizedAge < 7) return 0

  if (normalizedAge <= 8) {
    if (kind === 'strength') return -4
    if (kind === 'dexterity') return 2
    if (kind === 'constitution') return -3
    if (kind === 'charisma') return 2
    return 0
  }
  if (normalizedAge <= 11) {
    if (kind === 'strength') return -3
    if (kind === 'dexterity') return 2
    if (kind === 'constitution') return -3
    if (kind === 'charisma') return 2
    return 0
  }
  if (normalizedAge <= 13) {
    if (kind === 'strength') return -2
    if (kind === 'dexterity') return 1
    if (kind === 'constitution') return -2
    if (kind === 'charisma') return 1
    return 0
  }
  if (normalizedAge <= 15) {
    if (kind === 'strength') return -1
    if (kind === 'constitution') return -1
    return 0
  }
  if (normalizedAge <= 34) return 0

  if (normalizedAge <= 52) {
    if (kind === 'strength' || kind === 'dexterity' || kind === 'constitution') return -1
    if (kind === 'intelligence' || kind === 'wisdom' || kind === 'charisma') return 1
    return 0
  }
  if (normalizedAge <= 69) {
    if (kind === 'strength' || kind === 'dexterity' || kind === 'constitution') return -3
    if (kind === 'intelligence' || kind === 'wisdom' || kind === 'charisma') return 2
    return 0
  }

  if (kind === 'strength' || kind === 'dexterity' || kind === 'constitution') return -6
  if (kind === 'intelligence' || kind === 'wisdom' || kind === 'charisma') return 3
  return 0
}

export function statisticAgeModifier(age: number | null | undefined, statistic: Statistic): number {
  if (age === undefined || age === null) return 0
  const kind = statisticKind(statistic)
  if (!kind) return 0
  return ageModifierByKind(age, kind)
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

export function socialStatusLep(socialStatus: number): number {
  const normalized = normalizedInteger(socialStatus)
  return Math.max(0, normalized - 1)
}

function clampExperienceLevel(level: number): number {
  return Math.max(1, Math.min(MAX_EXPERIENCE_LEVEL, normalizedIntegerWithFallback(level, 1)))
}

export function experienceLevelFromClasses(classes: NamedValue[]): number {
  const total = classes.reduce((sum, characterClass) => {
    const classLevel = Number(characterClass.value)
    if (!Number.isFinite(classLevel)) return sum
    return sum + Math.max(0, Math.trunc(classLevel))
  }, 0)
  return Math.max(1, total)
}

export function experienceTargetLevel(baseLevel: number, socialStatus: number): number {
  const normalizedLevel = clampExperienceLevel(baseLevel)
  const lep = socialStatusLep(socialStatus)
  return clampExperienceLevel(normalizedLevel + lep + 1)
}

export function experienceNextLevelXp(baseLevel: number, socialStatus: number): number {
  return EXPERIENCE_BY_LEVEL[experienceTargetLevel(baseLevel, socialStatus)]
}

export function experienceProgress(current: number, nextLevel: number): number {
  if (nextLevel <= 0) return 0
  return Math.max(0, Math.min(100, (current / nextLevel) * 100))
}