import { parseSheetJson } from './codec'
import type { CharacterSheet } from './types'

export const HISTORY_KEY = 'ironthrone.sheet-history.v1'
export const HISTORY_LIMIT = 10
export const AUTOSAVE_INTERVAL_MS = 60_000
export type BackupReason = 'autosave' | 'import' | 'link' | 'reset' | 'restore'
export interface SheetBackup {
  id: string
  savedAt: string
  name: string
  reason: BackupReason
  json: string
}
export interface HistoryStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
const reasons = new Set<BackupReason>(['autosave', 'import', 'link', 'reset', 'restore'])

export function parseHistory(raw: string | null): SheetBackup[] {
  if (raw === null) return []
  const value = JSON.parse(raw)
  if (value?.version !== 1 || !Array.isArray(value.entries) || value.entries.length > HISTORY_LIMIT) {
    throw new Error('Formato della cronologia non valido.')
  }
  const ids = new Set<string>()
  for (const entry of value.entries) {
    if (!entry || typeof entry.id !== 'string' || ids.has(entry.id)
      || typeof entry.name !== 'string' || typeof entry.savedAt !== 'string'
      || !Number.isFinite(Date.parse(entry.savedAt)) || !reasons.has(entry.reason)
      || typeof entry.json !== 'string') throw new Error('Versione salvata non valida.')
    parseSheetJson(entry.json)
    ids.add(entry.id)
  }
  return value.entries
}

/** A single localStorage write commits the complete history. On failure, keep
 * every new backup in memory and leave the previous persisted value untouched.
 * A damaged/unknown history is never overwritten automatically.
 */
export class SheetHistory {
  private backups: SheetBackup[] = []
  private blocked = false
  warning = ''

  constructor(
    private storage?: HistoryStorage,
    private now: () => Date = () => new Date(),
    private id: () => string = () => crypto.randomUUID(),
  ) {
    if (!storage) {
      this.warning = 'Salvataggio locale non disponibile. Le copie restano solo in questa sessione: scarica il JSON prima di chiudere.'
      return
    }
    try { this.backups = parseHistory(storage.getItem(HISTORY_KEY)) }
    catch {
      this.blocked = true
      this.warning = 'Cronologia locale illeggibile o non accessibile. I dati presenti non verranno sovrascritti. Le nuove copie restano in questa sessione: scarica il JSON.'
    }
  }

  get entries(): SheetBackup[] { return structuredClone(this.backups) }

  save(sheet: CharacterSheet, reason: BackupReason = 'autosave'): void {
    const json = JSON.stringify(sheet)
    parseSheetJson(json)
    // Reload before writing so changes saved by another tab are retained.
    if (this.storage && !this.blocked && !this.warning) {
      try { this.backups = parseHistory(this.storage.getItem(HISTORY_KEY)) }
      catch {
        this.blocked = true
        this.warning = 'Cronologia locale modificata o illeggibile. Le nuove copie restano in questa sessione: scarica il JSON.'
      }
    }
    const latest = this.backups[0]
    const now = this.now()
    if (latest?.json === json) {
      // Pin a boundary even when the last autosave already contains this data.
      // The next autosave must not coalesce away the pre-import/reset copy.
      if (reason === 'autosave' || latest.reason === reason) return
      this.backups[0] = { ...latest, reason }
    } else {
      const entry: SheetBackup = { id: this.id(), savedAt: now.toISOString(), name: sheet.identity.name, reason, json }
      const coalesce = reason === 'autosave' && latest?.reason === 'autosave'
        && Math.floor(now.getTime() / AUTOSAVE_INTERVAL_MS) === Math.floor(Date.parse(latest.savedAt) / AUTOSAVE_INTERVAL_MS)
      this.backups = [entry, ...this.backups.slice(coalesce ? 1 : 0)].slice(0, HISTORY_LIMIT)
    }
    if (!this.storage || this.blocked) return
    try {
      this.storage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, entries: this.backups }))
      this.warning = ''
    } catch {
      this.warning = 'Salvataggio locale non riuscito (spazio esaurito o accesso negato). Le copie recenti restano in questa sessione: scarica il JSON prima di chiudere.'
    }
  }
}
