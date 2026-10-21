import { describe, expect, it, vi } from 'vitest'
import { AUTOSAVE_INTERVAL_MS, HISTORY_KEY, HISTORY_LIMIT, SheetHistory, parseHistory } from './sheetHistory'
import { sampleSheet } from '../../tests/fixtures'

function memoryStorage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

describe('recoverable sheet history', () => {
  it('persists snapshots without retaining mutable references', () => {
    const storage = memoryStorage()
    const history = new SheetHistory(storage)
    const sheet = sampleSheet('Originale')
    history.save(sheet)
    sheet.identity.name = 'Modificato'
    const entries = history.entries
    entries[0]!.name = 'Esterno'
    expect(history.entries[0]!.name).toBe('Originale')
    expect(JSON.parse(new SheetHistory(storage).entries[0]!.json).identity.name).toBe('Originale')
  })

  it('coalesces autosaves in fixed minute buckets without losing periodic versions during continuous editing', () => {
    let time = 0
    const history = new SheetHistory(memoryStorage(), () => new Date(time))
    for (let i = 0; i < 125; i++) {
      history.save(sampleSheet(String(i)))
      time += 1000
    }
    expect(history.entries).toHaveLength(3)
    expect(history.entries.map((entry) => entry.name)).toEqual(['124', '119', '59'])
  })

  it('pins a pre-import snapshot even if it is identical to the latest autosave', () => {
    const history = new SheetHistory(memoryStorage(), () => new Date(0))
    history.save(sampleSheet('Prima'))
    history.save(sampleSheet('Prima'), 'import')
    history.save(sampleSheet('Dopo'))
    expect(history.entries.map(({ name, reason }) => [name, reason])).toEqual([['Dopo', 'autosave'], ['Prima', 'import']])
  })

  it('bounds history and does not write duplicate autosaves', () => {
    const storage = memoryStorage()
    const write = vi.spyOn(storage, 'setItem')
    let time = 0
    const history = new SheetHistory(storage, () => new Date(time))
    for (let i = 0; i < HISTORY_LIMIT + 4; i++) {
      history.save(sampleSheet(String(i)))
      time += AUTOSAVE_INTERVAL_MS
    }
    expect(history.entries).toHaveLength(HISTORY_LIMIT)
    const count = write.mock.calls.length
    history.save(sampleSheet(String(HISTORY_LIMIT + 3)))
    expect(write).toHaveBeenCalledTimes(count)
  })

  it('retains versions saved by another tab before the next write', () => {
    const storage = memoryStorage()
    const a = new SheetHistory(storage)
    const b = new SheetHistory(storage)
    a.save(sampleSheet('A'), 'import')
    b.save(sampleSheet('B'), 'reset')
    expect(b.entries.map((entry) => entry.name)).toEqual(['B', 'A'])
  })

  it('keeps copies in memory when localStorage is unavailable', () => {
    const history = new SheetHistory()
    history.save(sampleSheet())
    expect(history.entries).toHaveLength(1)
    expect(history.warning).toContain('solo in questa sessione')
  })

  it.each(['quota', 'denied'])('preserves persisted data and in-memory recovery on write failure: %s', (failure) => {
    const storage = memoryStorage()
    const history = new SheetHistory(storage)
    history.save(sampleSheet('Persistita'), 'import')
    const raw = storage.getItem(HISTORY_KEY)
    storage.setItem = () => { throw new DOMException('Failure', failure === 'quota' ? 'QuotaExceededError' : 'SecurityError') }
    history.save(sampleSheet('Recente'))
    expect(storage.getItem(HISTORY_KEY)).toBe(raw)
    expect(history.entries[0]!.name).toBe('Recente')
    expect(history.warning).toContain('Salvataggio locale non riuscito')
    history.save(sampleSheet('Ancora più recente'), 'reset')
    expect(history.entries.some((entry) => entry.name === 'Recente')).toBe(true)
  })

  it.each(['not JSON', '{"version":2,"entries":[]}', '{"version":1,"entries":[{}]}'])('never overwrites damaged or future-format history: %s', (raw) => {
    const storage = memoryStorage()
    storage.setItem(HISTORY_KEY, raw)
    const history = new SheetHistory(storage)
    history.save(sampleSheet())
    expect(storage.getItem(HISTORY_KEY)).toBe(raw)
    expect(history.entries).toHaveLength(1)
    expect(history.warning).toContain('non verranno sovrascritti')
  })

  it('handles storage access failing during startup or after startup', () => {
    const storage = memoryStorage()
    const history = new SheetHistory(storage)
    storage.getItem = () => { throw new DOMException('Denied', 'SecurityError') }
    history.save(sampleSheet())
    expect(history.warning).not.toBe('')
    expect(new SheetHistory(storage).warning).not.toBe('')
  })

  it('rejects invalid dates, duplicate ids, malformed documents and unknown reasons', () => {
    const history = new SheetHistory(memoryStorage())
    history.save(sampleSheet())
    const entry = history.entries[0]!
    for (const entries of [
      [{ ...entry, savedAt: 'invalid' }], [entry, entry],
      [{ ...entry, json: '{}' }], [{ ...entry, reason: 'unknown' }],
    ]) expect(() => parseHistory(JSON.stringify({ version: 1, entries }))).toThrow()
  })
})
