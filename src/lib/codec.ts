import type { CharacterSheet } from './types'

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = stream.writable.getWriter()
  writer.write(Uint8Array.from(bytes).buffer)
  writer.close()
  return new Uint8Array(await new Response(stream.readable).arrayBuffer())
}

export async function encodeSheet(sheet: CharacterSheet): Promise<string> {
  const json = JSON.stringify(sheet)
  const compressed = await transform(textEncoder.encode(json), new CompressionStream('gzip'))
  return `gz.${bytesToBase64Url(compressed)}`
}

export async function decodeSheet(payload: string): Promise<CharacterSheet> {
  const isCompressed = payload.startsWith('gz.')
  const bytes = base64UrlToBytes(isCompressed ? payload.slice(3) : payload)
  const decoded = isCompressed
    ? await transform(bytes, new DecompressionStream('gzip'))
    : bytes
  return parseSheetJson(textDecoder.decode(decoded))
}

export function parseSheetJson(json: string): CharacterSheet {
  const value: unknown = JSON.parse(json)
  if (!value || typeof value !== 'object') throw new Error('Il JSON deve contenere un oggetto.')

  const sheet = value as Partial<CharacterSheet>
  if (sheet.version !== 1) throw new Error('Versione del formato non supportata.')
  if (!sheet.identity?.name) throw new Error('Il campo identity.name e obbligatorio.')
  if (!sheet.theme || !sheet.modules || !sheet.general?.experience || !Array.isArray(sheet.general.classes)) {
    throw new Error('Mancano le sezioni theme, modules o general.')
  }
  if (!sheet.biography || !sheet.armor) throw new Error('Mancano le sezioni biography o armor.')

  const lists = ['reputation', 'influence', 'talents', 'flaws', 'abilities', 'languages', 'inventory'] as const
  if (lists.some((key) => !Array.isArray(sheet[key]))) throw new Error('Una o piu collezioni della scheda non sono valide.')
  if (!Array.isArray(sheet.abilities) || !Array.isArray(sheet.inventory)) {
    throw new Error('Le collezioni abilities e inventory non sono valide.')
  }
  if (!Array.isArray(sheet.statistics) || sheet.statistics.some((statistic) => !Array.isArray(statistic.modifiers))) {
    throw new Error('Ogni statistica deve avere un array modifiers.')
  }

  if (typeof sheet.general.experience.level !== 'number') {
    sheet.general.experience.level = sheet.general.classes.reduce((total, characterClass) => {
      const level = Number(characterClass.value)
      return total + (Number.isFinite(level) ? level : 0)
    }, 0)
  }

  sheet.statistics = sheet.statistics.map((statistic) => {
    if (typeof statistic.baseValue === 'number') return statistic
    const adjustments = statistic.modifiers.reduce((total, modifier) => total + Number(modifier.value || 0), 0)
    return { ...statistic, baseValue: Number(statistic.value ?? 0) - adjustments }
  })

  sheet.abilities = sheet.abilities.map((ability) => ({
    ...ability,
    isClassSkill: ability.isClassSkill ?? ability.trained ?? false,
    access: ability.access ?? (ability.category === 'restricted' ? 'trained-only' : ability.category === 'class' ? 'uncommon' : 'common'),
  }))

  const inventoryTypes = new Set(['item', 'pet', 'weapon', 'armor', 'shield'])
  if (sheet.inventory.some((item) => !inventoryTypes.has(item.type))) {
    throw new Error('Uno o piu oggetti hanno un tipo non supportato.')
  }
  return sheet as CharacterSheet
}