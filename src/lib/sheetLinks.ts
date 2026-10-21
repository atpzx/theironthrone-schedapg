import { decodeSheetJson, encodeSheet, parseSheetJson } from './codec'
import { renderSheet } from './renderSheet'
import type { CharacterSheet, ModuleKey } from './types'
import { MODULE_KEYS as moduleKeys } from './types'

export { moduleKeys }

export function readLinkParameters(hash: string): { payload: string | null; module: ModuleKey | null } {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  if (params.getAll('data').length > 1) throw new Error('Il link contiene più parametri data.')
  const value = params.get('module') ?? params.get('layer')
  const payload = params.get('data')
  if (payload === '') throw new Error('Il link contiene un parametro data vuoto.')
  return { payload, module: moduleKeys.includes(value as ModuleKey) ? value as ModuleKey : null }
}

export function onlyModuleVisible(sheet: CharacterSheet, module: ModuleKey): CharacterSheet {
  return { ...sheet, modules: Object.fromEntries(moduleKeys.map((key) => [key, key === module])) as CharacterSheet['modules'] }
}

interface ExportDependencies {
  encode: typeof encodeSheet
  decodeJson: typeof decodeSheetJson
  render: typeof renderSheet
}

const exportDependencies: ExportDependencies = { encode: encodeSheet, decodeJson: decodeSheetJson, render: renderSheet }

// Also accepts the actual HTML copied back from a forum. Decode the HTML attribute
// once, preserving percent escapes and Base64 characters in the URL itself.
export function editorLinkFrom(value: string): URL {
  const hrefs = [...value.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)]
  const marked = value.match(/\bclass\s*=\s*["'][^"']*\bsheet-editor-link\b[^"']*["'][\s\S]*?\bhref\s*=\s*["']([^"']+)["']/i)?.[1]
  const candidates = hrefs.map((match) => match[1]!).filter((href) => /#(?:[^#]*&(?:amp;)?)?data=/.test(href))
  if (!marked && candidates.length > 1) throw new Error('Sono presenti più link con dati: incolla il solo link di modifica da verificare.')
  const candidate = marked ?? (hrefs.length ? candidates[0] : value.trim())
  if (!candidate) throw new Error('Non è presente un link di modifica con i dati della scheda.')
  let url: URL
  const entities: Record<string, string> = { amp: '&', quot: '"', apos: "'", '#039': "'", '#39': "'", '#38': '&' }
  try { url = new URL(candidate.replace(/&(amp|quot|apos|#039|#39|#38);/g, (_, entity: string) => entities[entity]!)) }
  catch { throw new Error('Inserisci un indirizzo completo o il codice HTML che contiene il link di modifica.') }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Il link deve usare HTTP o HTTPS.')
  if (!readLinkParameters(url.hash).payload) throw new Error('Il link non contiene i dati della scheda.')
  return url
}

export async function createSheetExport(
  sheet: CharacterSheet,
  baseUrl: string,
  dependencies: ExportDependencies = exportDependencies,
): Promise<{ html: string; editUrl: string }> {
  // Snapshot before the first await so a concurrent edit cannot change what is
  // verified or rendered while compression is running.
  const snapshot = structuredClone(sheet)
  const json = JSON.stringify(snapshot)
  parseSheetJson(json)
  const payload = await dependencies.encode(snapshot)
  const url = new URL(baseUrl)
  const params = new URLSearchParams({ data: payload })
  const visible = moduleKeys.filter((key) => snapshot.modules[key])
  if (visible.length === 1) params.set('module', visible[0]!)
  url.hash = params.toString()
  const roundtrip = readLinkParameters(url.hash).payload
  if (roundtrip !== payload || await dependencies.decodeJson(roundtrip) !== json) {
    throw new Error('Verifica del link fallita: i dati esportati non coincidono con la scheda. Scarica una copia JSON.')
  }
  const html = dependencies.render(snapshot, url.href)
  let embedded: URL
  try { embedded = editorLinkFrom(html) }
  catch (cause) { throw new Error('Verifica HTML fallita: il link di modifica è mancante o alterato. Scarica una copia JSON.', { cause }) }
  if (embedded.href !== url.href || readLinkParameters(embedded.hash).payload !== payload) {
    throw new Error('Verifica HTML fallita: il link di modifica è mancante o alterato. Scarica una copia JSON.')
  }
  return { html, editUrl: url.href }
}

export async function comparePublishedLink(value: string, sheet: CharacterSheet): Promise<'identical' | 'different'> {
  const url = editorLinkFrom(value)
  const json = await decodeSheetJson(readLinkParameters(url.hash).payload!)
  // Compare objects, allowing another exporter to use different JSON spacing.
  const sort = (value: unknown): unknown => Array.isArray(value)
    ? value.map(sort)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, sort(item)]))
      : value
  return JSON.stringify(sort(JSON.parse(json))) === JSON.stringify(sort(sheet)) ? 'identical' : 'different'
}
