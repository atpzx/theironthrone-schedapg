import { describe, expect, it } from 'vitest'

import { ABILITY_ACCESS_LABELS, ABILITY_CATALOG } from './abilities'

describe('ability catalog', () => {
  it('contains unique, alphabetically ordered abilities', () => {
    const names = ABILITY_CATALOG.map((ability) => ability.ability_name)

    expect(names).toHaveLength(50)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right, 'it')))
  })

  it('uses the guide labels for every access value', () => {
    expect(ABILITY_ACCESS_LABELS).toEqual({
      common: 'Comune',
      uncommon: 'Non comune',
      'trained-only': 'Richiesta',
    })
    expect(ABILITY_CATALOG.every((ability) => ability.description.length > 0)).toBe(true)
  })
})