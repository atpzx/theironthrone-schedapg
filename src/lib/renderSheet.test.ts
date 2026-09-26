import { describe, expect, it } from 'vitest'

import { defaultSheet } from './defaultSheet'
import { renderSheet } from './renderSheet'

describe('renderSheet statistic modifiers', () => {
  it('shows PC points spent instead of the derived bonus', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.statistics[0].modifierBuckets!.PC = 8
    sheet.statistics[0].modifiers = [{ name: 'PC', value: 7 }]

    const html = renderSheet(sheet)

    expect(html).toContain('<div class="name">PC</div><div class="value">8</div>')
    expect(html).not.toContain('<div class="name">PC</div><div class="value">7</div>')
  })
})

describe('renderSheet ability specializations', () => {
  it('shows an accessible target tooltip only for non-empty specializations', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.abilities = [{
      name: 'Arrampicarsi',
      ranks: 2,
      isClassSkill: false,
      access: 'common',
      specializations: ['Muri', 'Corde & nodi', ''],
    }]

    const html = renderSheet(sheet)

    expect(html).toContain('title="Specializzazioni: Muri, Corde &amp; nodi"')
    expect(html).toContain('aria-label="Specializzazioni: Muri, Corde &amp; nodi"')
    expect(html).toContain('>◎</abbr> Arrampicarsi')

    sheet.abilities[0].specializations = []
    expect(renderSheet(sheet)).not.toContain('>◎</abbr>')
  })

  it('keeps the specialization target and uncommon ability name in one colored wrapper', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.abilities = [{
      name: 'Acrobazia',
      ranks: 1,
      isClassSkill: false,
      access: 'uncommon',
      specializations: ['Combattimento'],
    }]

    const html = renderSheet(sheet)

    expect(html).toContain('<div class="name"><span style="color:orange"><abbr')
    expect(html).toContain('>◎</abbr> Acrobazia</span>')
    expect(html).not.toContain('<span style="color:orange"><span')
  })
})