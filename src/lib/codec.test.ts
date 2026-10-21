import { afterEach, describe, expect, it, vi } from 'vitest'
import { gzipSync, gunzipSync } from 'node:zlib'

import { decodeSheet, decodeSheetJson, encodeSheet, parseSheetJson } from './codec'
import { defaultSheet } from './defaultSheet'
import { longSheet, sampleSheet } from '../../tests/fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('sheet link codec', () => {
  it('preserves long Unicode data across chunks and is compatible with an independent gzip decoder', async () => {
    const sheet = longSheet()
    const payload = await encodeSheet(sheet)
    const compressed = Buffer.from(payload.slice(3), 'base64url')
    expect(compressed.length).toBeGreaterThan(32768)
    expect(gunzipSync(compressed).toString('utf8')).toBe(JSON.stringify(sheet))
    expect(await decodeSheet(payload)).toEqual(sheet)
    expect(payload).toMatch(/^gz\.[A-Za-z0-9_-]+$/)
  })

  it('reads gzip from another encoder and legacy uncompressed Base64URL links', async () => {
    const sheet = sampleSheet()
    const json = JSON.stringify(sheet)
    expect(await decodeSheet('gz.' + gzipSync(json).toString('base64url'))).toEqual(sheet)
    expect(await decodeSheet(Buffer.from(json).toString('base64url'))).toEqual(sheet)
  })

  it('verifies raw JSON without applying schema migrations', async () => {
    const sheet = sampleSheet()
    sheet.general.experience.level = 42
    expect(await decodeSheetJson(await encodeSheet(sheet))).toBe(JSON.stringify(sheet))
    expect((await decodeSheet(await encodeSheet(sheet))).general.experience.level).toBe(20)
  })

  it.each(['', 'gz.', 'gz.A', 'gz.!!', 'gz.AA AA', 'gz.AA\nAA'])('rejects malformed Base64: %j', async (payload) => {
    await expect(decodeSheet(payload)).rejects.toThrow(/Base64/)
  })

  it.each(['header', 'body', 'checksum', 'truncated'] as const)('rejects a damaged gzip %s without unhandled stream promises', async (damage) => {
    const compressed = gzipSync(JSON.stringify(sampleSheet()))
    if (damage !== 'truncated') compressed[damage === 'header' ? 0 : damage === 'body' ? 16 : compressed.length - 8]! ^= 0xff
    const bytes = damage === 'truncated' ? compressed.subarray(0, -5) : compressed
    await expect(decodeSheet('gz.' + bytes.toString('base64url'))).rejects.toThrow(/danneggiati o incompleti/)
    // Vitest also fails the suite if write/close leave an unhandled rejection.
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it('rejects invalid UTF-8 rather than silently replacing characters', async () => {
    await expect(decodeSheetJson(Buffer.from([0xff]).toString('base64url'))).rejects.toThrow(/danneggiati/)
  })

  it('explains unavailable compression while leaving JSON export possible', async () => {
    vi.stubGlobal('CompressionStream', undefined)
    await expect(encodeSheet(sampleSheet())).rejects.toThrow(/Scarica il JSON/)
    expect(parseSheetJson(JSON.stringify(sampleSheet())).identity.name).toBe('Personaggio di prova')
  })

  it('distinguishes unavailable decompression from damaged data and still reads legacy links', async () => {
    vi.stubGlobal('DecompressionStream', undefined)
    await expect(decodeSheetJson('gz.AAAA')).rejects.toThrow(/browser non supporta/)
    expect(await decodeSheet(Buffer.from(JSON.stringify(sampleSheet())).toString('base64url'))).toEqual(sampleSheet())
  })
})

describe('parseSheetJson', () => {
  it.each(['null', '[]', '42', '{"version":2}', '{"version":1,"identity":{"name":"Nome"}}'])('rejects unsupported documents: %s', (json) => {
    expect(() => parseSheetJson(json)).toThrow()
  })

  it('migrates missing legacy fields, statistic modifiers and trained abilities', () => {
    const legacy = JSON.parse(JSON.stringify(sampleSheet()))
    delete legacy.general.socialStatusAtCreation
    delete legacy.general.regionalPrivilege
    delete legacy.general.experience.level
    delete legacy.statistics[0].modifierBuckets
    legacy.statistics[0].modifiers = [{ name: 'PC', value: 2 }, { name: 'ML', value: 1 }, { name: 'invalid', value: 1 }, { name: 'MT', value: 0 }, { name: 'PB', value: 'invalid' }]
    legacy.abilities = [{ name: 'Abilità storica', ranks: 2, trained: true, category: 'restricted' }]
    const sheet = parseSheetJson(JSON.stringify(legacy))
    expect(sheet.general.socialStatusAtCreation).toBe(1)
    expect(sheet.general.regionalPrivilege.selectedTalent).toBe('')
    expect(sheet.general.experience.level).toBe(1)
    expect(sheet.statistics[0]!.modifierBuckets!.ML).toBe(1)
    expect(sheet.statistics[0]!.modifierBuckets!.PC).toBeGreaterThan(0)
    expect(sheet.abilities[0]).toMatchObject({ custom: true, isClassSkill: true, access: 'trained-only', specializations: [] })
  })
  it.each([
    (sheet: any) => { sheet.biography = {} },
    (sheet: any) => { sheet.modules = {} },
    (sheet: any) => { sheet.identity.name = {} },
    (sheet: any) => { sheet.languages = [null] },
    (sheet: any) => { sheet.abilities = [{ name: 'Acrobazia', ranks: 'due' }] },
    (sheet: any) => { sheet.general.regionalPrivilege = 'Nord' },
    (sheet: any) => { sheet.inventory[0].type = 'unsupported' },
  ])('rejects malformed structures before they can replace an open sheet', (damage) => {
    const sheet = structuredClone(defaultSheet)
    damage(sheet)
    expect(() => parseSheetJson(JSON.stringify(sheet))).toThrow()
  })
  it('limits imported character levels to 20', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.general.experience.level = 42

    expect(parseSheetJson(JSON.stringify(sheet)).general.experience.level).toBe(20)
  })

  it('adds an empty specialization list to legacy abilities', () => {
    const sheet = structuredClone(defaultSheet)
    sheet.abilities = [{
      name: 'Arrampicarsi',
      ranks: 1,
      isClassSkill: false,
      access: 'common',
      specializations: [],
    }]
    const legacyAbility = sheet.abilities[0] as Partial<(typeof sheet.abilities)[number]>
    delete legacyAbility.specializations

    expect(parseSheetJson(JSON.stringify(sheet)).abilities[0].specializations).toEqual([])
  })
})
