import type { CharacterSheet } from './types'
import { MODULE_KEYS } from './types'
import { abilityDefinition, isConfiguredAbility } from './abilities'
import {
  STAT_CREATION_BASE_VALUE,
  STAT_MODIFIER_CODES,
  experienceLevelFromClasses,
  normalizeCharacterLevel,
  normalizeStatisticModifierBuckets,
  statisticCreationCost,
  statisticModifierValue,
} from './calculations'

const textEncoder = new TextEncoder()

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!value || !/^[A-Za-z0-9_+/-]+={0,2}$/.test(value) || value.replace(/=+$/, '').length % 4 === 1) {
    throw new Error('Il link contiene dati Base64 non validi o incompleti.')
  }
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const source = new Blob([Uint8Array.from(bytes).buffer]).stream()
  return new Uint8Array(await new Response(source.pipeThrough(stream)).arrayBuffer())
}

export async function encodeSheet(sheet: CharacterSheet): Promise<string> {
  if (typeof CompressionStream === 'undefined') throw new Error('Questo browser non supporta la compressione dei link. Scarica il JSON o usa un browser aggiornato.')
  const json = JSON.stringify(sheet)
  const compressed = await transform(textEncoder.encode(json), new CompressionStream('gzip'))
  return `gz.${bytesToBase64Url(compressed)}`
}

// Keep the original JSON separate from schema migrations: export verification must
// compare the exact serialized data, including legacy or unconfigured fields.
export async function decodeSheetJson(payload: string): Promise<string> {
  const isCompressed = payload.startsWith('gz.')
  if (isCompressed && typeof DecompressionStream === 'undefined') {
    throw new Error('Questo browser non supporta la decompressione dei link. Importa il JSON o usa un browser aggiornato.')
  }
  const bytes = base64UrlToBytes(isCompressed ? payload.slice(3) : payload)
  try {
    const decoded = isCompressed
      ? await transform(bytes, new DecompressionStream('gzip'))
      : bytes
    return new TextDecoder('utf-8', { fatal: true }).decode(decoded)
  } catch (cause) {
    throw new Error('I dati del link sono danneggiati o incompleti. Importa una copia JSON o recupera una versione salvata.', { cause })
  }
}

export async function decodeSheet(payload: string): Promise<CharacterSheet> {
  return parseSheetJson(await decodeSheetJson(payload))
}

export function parseSheetJson(json: string): CharacterSheet {
  const value: unknown = JSON.parse(json)
  if (!value || typeof value !== 'object') throw new Error('Il JSON deve contenere un oggetto.')

  const sheet = value as Partial<CharacterSheet>
  if (sheet.version !== 1) throw new Error('Versione del formato non supportata.')
  if (typeof sheet.identity?.name !== 'string' || !sheet.identity.name.trim()) throw new Error('Il campo identity.name e obbligatorio.')
  if (!sheet.theme || !sheet.modules || !sheet.general?.experience || !Array.isArray(sheet.general.classes)) {
    throw new Error('Mancano le sezioni theme, modules o general.')
  }
  if (!sheet.biography || !sheet.armor) throw new Error('Mancano le sezioni biography o armor.')

  const lists = ['reputation', 'influence', 'talents', 'flaws', 'abilities', 'languages', 'inventory'] as const
  if (lists.some((key) => !Array.isArray(sheet[key]))) throw new Error('Una o piu collezioni della scheda non sono valide.')
  if (!Array.isArray(sheet.abilities) || !Array.isArray(sheet.inventory)) {
    throw new Error('Le collezioni abilities e inventory non sono valide.')
  }
  if (!Array.isArray(sheet.statistics)) {
    throw new Error('La sezione statistics non e valida.')
  }

  // Reject malformed sections before applying migrations or replacing an open
  // document. Keep explicitly supported legacy fields optional below.
  const strings = (object: unknown, keys: string[]): boolean => !!object && typeof object === 'object'
    && keys.every((key) => typeof (object as Record<string, unknown>)[key] === 'string')
  const numbers = (object: unknown, keys: string[]): boolean => !!object && typeof object === 'object'
    && keys.every((key) => typeof (object as Record<string, unknown>)[key] === 'number' && Number.isFinite((object as Record<string, unknown>)[key]))
  const namedValues = (items: unknown[]): boolean => items.every((item) => strings(item, ['name'])
    && (typeof (item as Record<string, unknown>).value === 'string' || numbers(item, ['value'])))
  const objectItems = [...sheet.reputation!, ...sheet.influence!, ...sheet.talents!, ...sheet.flaws!, ...sheet.abilities, ...sheet.languages!, ...sheet.inventory, ...sheet.statistics, ...sheet.general.classes]
  if (objectItems.some((item) => !item || typeof item !== 'object')) throw new Error('Le collezioni contengono elementi non validi.')
  if (!strings(sheet.identity, ['regionTitle', 'avatarUrl']) || !strings(sheet.theme, ['name', 'accent', 'accentDark'])
    || MODULE_KEYS.some((key) => typeof (sheet.modules as Record<string, unknown>)[key] !== 'boolean')
    || !strings(sheet.general, ['religion', 'region']) || !numbers(sheet.general, ['age', 'wealth', 'hitPoints', 'stun'])
    || (sheet.general.regionalPrivilege != null && !strings(sheet.general.regionalPrivilege, ['classSkillSpecialization', 'selectedTalent']))
    || !numbers(sheet.general.experience, ['current', 'nextLevel'])
    || !numbers(sheet.armor, ['head', 'torso', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg', 'shield'])
    || !strings(sheet.biography, ['physicalDescription', 'historyAndPsychology'])
    || !namedValues([...sheet.reputation!, ...sheet.influence!, ...sheet.general.classes])
    || [...sheet.talents!, ...sheet.flaws!].some((item) => !strings(item, ['name', 'description']))
    || sheet.statistics.some((item) => !strings(item, ['key', 'name', 'color']))
    || sheet.abilities.some((item) => !strings(item, ['name']) || !numbers(item, ['ranks']))
    || sheet.languages!.some((item) => !strings(item, ['name']) || typeof item.spoken !== 'boolean' || typeof item.written !== 'boolean')
    || sheet.inventory.some((item) => !strings(item, ['name']))) {
    throw new Error('La scheda contiene campi mancanti o di tipo non valido.')
  }

  if (typeof sheet.general.socialStatusAtCreation !== 'number') {
    const currentSocialStatus = Number(sheet.general.socialStatus)
    sheet.general.socialStatusAtCreation = Number.isFinite(currentSocialStatus) ? Math.trunc(currentSocialStatus) : 1
  }

  if (!sheet.general.regionalPrivilege) {
    sheet.general.regionalPrivilege = { classSkillSpecialization: '', selectedTalent: '' }
  }

  sheet.general.experience.level = normalizeCharacterLevel(
    typeof sheet.general.experience.level === 'number'
      ? sheet.general.experience.level
      : experienceLevelFromClasses(sheet.general.classes),
  )

  sheet.statistics = sheet.statistics.map((statistic) => {
    const legacyModifiers = Array.isArray(statistic.modifiers) ? statistic.modifiers : []
    const hasBuckets = !!statistic.modifierBuckets
    const buckets = normalizeStatisticModifierBuckets({ ...statistic, modifiers: legacyModifiers })

    if (!hasBuckets) {
      for (const modifier of legacyModifiers) {
        const code = String(modifier.name || '').trim().toUpperCase()
        if (!STAT_MODIFIER_CODES.includes(code as typeof STAT_MODIFIER_CODES[number])) continue
        const numericValue = Number(modifier.value || 0)
        if (!Number.isFinite(numericValue) || numericValue === 0) continue

        if (code === 'PC') {
          const pcDelta = Math.trunc(numericValue)
          buckets.PC = Math.max(0, statisticCreationCost(STAT_CREATION_BASE_VALUE + pcDelta))
        } else {
          buckets[code as typeof STAT_MODIFIER_CODES[number]] += Math.trunc(numericValue)
        }
      }
    }

    const normalizedModifiers = STAT_MODIFIER_CODES
      .map((code) => ({ name: code, value: statisticModifierValue({ ...statistic, modifierBuckets: buckets, modifiers: legacyModifiers }, code) }))
      .filter((modifier) => modifier.value !== 0)

    return {
      ...statistic,
      baseValue: STAT_CREATION_BASE_VALUE,
      modifierBuckets: buckets,
      modifiers: normalizedModifiers,
    }
  })

  sheet.abilities = sheet.abilities.map((ability) => {
    const definition = abilityDefinition(ability.name)
    return {
      ...ability,
      custom: ability.custom === true || !definition ? true as const : undefined,
      isClassSkill: ability.isClassSkill ?? ability.trained ?? false,
      access: definition?.access ?? ability.access ?? (ability.category === 'restricted' ? 'trained-only' : ability.category === 'class' ? 'uncommon' : 'common'),
      specializations: Array.isArray(ability.specializations)
        ? ability.specializations.filter((specialization) => typeof specialization === 'string')
        : [],
    }
  }).filter(isConfiguredAbility)

  const inventoryTypes = new Set(['item', 'pet', 'weapon', 'armor', 'shield'])
  if (sheet.inventory.some((item) => !inventoryTypes.has(item.type))) {
    throw new Error('Uno o piu oggetti hanno un tipo non supportato.')
  }
  return sheet as CharacterSheet
}
