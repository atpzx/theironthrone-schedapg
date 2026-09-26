import { describe, expect, it } from 'vitest'

import { parseSheetJson } from './codec'
import { defaultSheet } from './defaultSheet'

describe('parseSheetJson', () => {
  it('limits imported character levels to 20', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.general.experience.level = 42

    expect(parseSheetJson(JSON.stringify(sheet)).general.experience.level).toBe(20)
  })
})