import { describe, expect, it } from 'vitest'
import { SheetHistory } from './sheetHistory'
import { SheetWorkspace } from './sheetWorkspace'
import { deferred, sampleSheet } from '../../tests/fixtures'

describe('document transitions', () => {
  it('does not autosave example data at startup or overwrite the latest saved sheet', () => {
    const history = new SheetHistory()
    new SheetWorkspace(history).flush()
    expect(history.entries).toHaveLength(0)
    history.save(sampleSheet('Salvata'))
    const workspace = new SheetWorkspace(history)
    expect(workspace.sheet.identity.name).toBe('Salvata')
    workspace.flush()
    expect(history.entries).toHaveLength(1)
  })

  it('checkpoints before successful imports, reset and restore', () => {
    const history = new SheetHistory()
    const workspace = new SheetWorkspace(history)
    workspace.edit(sampleSheet('Prima'))
    workspace.importJson(JSON.stringify(sampleSheet('Importata')))
    expect(history.entries.map((entry) => entry.name)).toEqual(['Importata', 'Prima'])
    const originalId = history.entries[1]!.id
    workspace.reset()
    expect(history.entries.some((entry) => entry.name === 'Importata' && entry.reason === 'reset')).toBe(true)
    workspace.restore(originalId)
    expect(workspace.sheet.identity.name).toBe('Prima')
    expect(history.entries.some((entry) => entry.reason === 'restore')).toBe(true)
    expect(() => workspace.restore('missing')).toThrow(/non è più disponibile/)
  })

  it('leaves the current sheet, unapplied edits and history untouched after invalid JSON or link data', async () => {
    const history = new SheetHistory()
    const workspace = new SheetWorkspace(history)
    workspace.edit(sampleSheet('Da conservare'))
    expect(() => workspace.importJson('{}')).toThrow()
    await expect(workspace.openLink('#data=gz.bad')).rejects.toThrow()
    expect(workspace.sheet.identity.name).toBe('Da conservare')
    expect(history.entries).toHaveLength(0)
    workspace.flush()
    expect(history.entries[0]!.name).toBe('Da conservare')
  })

  it('flushes changed sheets only and does not alias the editor state', () => {
    const history = new SheetHistory()
    const workspace = new SheetWorkspace(history)
    const sheet = sampleSheet('Modificata')
    workspace.edit(sheet)
    sheet.identity.name = 'Mutazione esterna'
    workspace.flush()
    workspace.edit(structuredClone(workspace.sheet))
    workspace.flush()
    expect(history.entries).toHaveLength(1)
    expect(workspace.sheet.identity.name).toBe('Modificata')
  })

  it('supports module-only links, legacy layer and ignores unrelated hashes', async () => {
    const workspace = new SheetWorkspace(new SheetHistory())
    expect(await workspace.openLink('#layer=biography')).toBe(true)
    expect(workspace.module).toBe('biography')
    expect(Object.values(workspace.sheet.modules).filter(Boolean)).toHaveLength(1)
    expect(await workspace.openLink('#other=value')).toBe(false)
  })

  it.each(['edit', 'import', 'reset', 'new-link', 'empty-link'] as const)('ignores a slow link after %s', async (action) => {
    const pending = deferred<ReturnType<typeof sampleSheet>>()
    let calls = 0
    const workspace = new SheetWorkspace(new SheetHistory(), async () => ++calls === 1 ? pending.promise : sampleSheet('Link nuovo'))
    const task = workspace.openLink('#data=slow')
    if (action === 'edit') workspace.edit(sampleSheet('Modifica recente'))
    if (action === 'import') workspace.importJson(JSON.stringify(sampleSheet('Importazione recente')))
    if (action === 'reset') workspace.reset()
    if (action === 'new-link') await workspace.openLink('#data=new')
    if (action === 'empty-link') await workspace.openLink('')
    const current = structuredClone(workspace.sheet)
    pending.resolve(sampleSheet('Link vecchio'))
    expect(await task).toBe(false)
    expect(workspace.sheet).toEqual(current)
  })

  it('ignores stale decompression errors while reporting current errors', async () => {
    const pending = deferred<ReturnType<typeof sampleSheet>>()
    const workspace = new SheetWorkspace(new SheetHistory(), () => pending.promise)
    const task = workspace.openLink('#data=slow')
    workspace.reset()
    pending.reject(new Error('Corrotto'))
    expect(await task).toBe(false)
    await expect(workspace.openLink('#data=broken')).rejects.toThrow('Corrotto')
  })

  it('does not apply a file whose read finishes after a newer edit', async () => {
    const pending = deferred<string>()
    const workspace = new SheetWorkspace(new SheetHistory())
    const task = workspace.importFile(() => pending.promise)
    workspace.edit(sampleSheet('Modifica recente'))
    pending.resolve(JSON.stringify(sampleSheet('File vecchio')))
    expect(await task).toBe(false)
    expect(workspace.sheet.identity.name).toBe('Modifica recente')
  })

  it('imports readable files and preserves the current document when file reading fails', async () => {
    const workspace = new SheetWorkspace(new SheetHistory())
    expect(await workspace.importFile(async () => JSON.stringify(sampleSheet('File')))).toBe(true)
    await expect(workspace.importFile(async () => { throw new Error('File illeggibile') })).rejects.toThrow('File illeggibile')
    expect(workspace.sheet.identity.name).toBe('File')
  })
})
