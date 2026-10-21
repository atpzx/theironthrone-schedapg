import { decodeSheet, parseSheetJson } from './codec'
import { defaultSheet } from './defaultSheet'
import { onlyModuleVisible, readLinkParameters } from './sheetLinks'
import { SheetHistory, type BackupReason } from './sheetHistory'
import type { CharacterSheet, ModuleKey } from './types'

/** Framework-independent document transitions, including stale async imports.
 * Invalid imports never checkpoint, mutate the current sheet or touch storage.
 */
export class SheetWorkspace {
  sheet: CharacterSheet
  module: ModuleKey | null = null
  private revision = 0
  private dirty = false

  constructor(readonly history: SheetHistory, private decode = decodeSheet) {
    const latest = history.entries[0]
    this.sheet = latest ? parseSheetJson(latest.json) : structuredClone(defaultSheet)
  }

  edit(sheet: CharacterSheet): void {
    if (JSON.stringify(sheet) === JSON.stringify(this.sheet)) return
    this.revision++
    this.sheet = structuredClone(sheet)
    this.dirty = true
  }

  flush(): void {
    if (!this.dirty) return
    this.history.save(this.sheet)
    this.dirty = false
  }

  private replace(sheet: CharacterSheet, reason: BackupReason, module: ModuleKey | null = null): void {
    this.history.save(this.sheet, reason)
    this.revision++
    this.sheet = structuredClone(sheet)
    this.module = module
    this.dirty = true
    this.flush()
  }

  importJson(json: string): void {
    const sheet = parseSheetJson(json)
    this.replace(sheet, 'import')
  }

  async importFile(readText: () => Promise<string>): Promise<boolean> {
    const revision = ++this.revision
    try {
      const json = await readText()
      if (revision !== this.revision) return false
      this.importJson(json)
      return true
    } catch (error) {
      if (revision !== this.revision) return false
      throw error
    }
  }

  reset(): void { this.replace(structuredClone(defaultSheet), 'reset') }

  restore(id: string): void {
    const backup = this.history.entries.find((entry) => entry.id === id)
    if (!backup) throw new Error('La versione selezionata non è più disponibile.')
    this.replace(parseSheetJson(backup.json), 'restore')
  }

  async openLink(hash: string): Promise<boolean> {
    const revision = ++this.revision
    try {
      const { payload, module } = readLinkParameters(hash)
      if (!payload && !module) return false
      const sheet = payload ? await this.decode(payload) : structuredClone(defaultSheet)
      if (revision !== this.revision) return false
      this.replace(module ? onlyModuleVisible(sheet, module) : sheet, 'link', module)
      return true
    } catch (error) {
      if (revision !== this.revision) return false
      throw error
    }
  }
}
