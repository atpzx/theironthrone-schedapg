import { describe, expect, it } from 'vitest'

import { parseSheetJson } from './codec'
import { defaultSheet } from './defaultSheet'

describe('parseSheetJson', () => {
  it('limits imported character levels to 20', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.general.experience.level = 42

    expect(parseSheetJson(JSON.stringify(sheet)).general.experience.level).toBe(20)
  })

  it('adds an empty specialization list to legacy abilities', () => {
    const sheet = structuredClone(defaultSheet)
    const legacyAbility = sheet.abilities[0] as Partial<(typeof sheet.abilities)[number]>
    delete legacyAbility.specializations

    expect(parseSheetJson(JSON.stringify(sheet)).abilities[0].specializations).toEqual([])
  })
})