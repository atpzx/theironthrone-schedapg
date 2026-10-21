import { describe, expect, it, vi } from 'vitest'
import { decodeSheetJson, encodeSheet } from './codec'
import { comparePublishedLink, createSheetExport, editorLinkFrom, readLinkParameters } from './sheetLinks'
import { renderSheet } from './renderSheet'
import { deferred, sampleSheet } from '../../tests/fixtures'

describe('verified exports', () => {
  it('does not export structurally invalid editor data as a supposedly valid link', async () => {
    const sheet = sampleSheet()
    sheet.identity.name = ''
    await expect(createSheetExport(sheet, 'https://example.test/')).rejects.toThrow(/identity.name/)
  })

  it('finds the marked editor link even when another class link contains sheet data', async () => {
    const sheet = sampleSheet()
    sheet.general.classes[0]!.url = 'https://other.test/#data=unrelated'
    const { html, editUrl } = await createSheetExport(sheet, "https://example.test/a'b/?x=1&y=2")
    expect(editorLinkFrom(html).href).toBe(editUrl)
    expect(() => editorLinkFrom('<a href="https://a.test/#data=a">A</a><a href="https://b.test/#data=b">B</a>')).toThrow(/più link/)
  })
  it('verifies the actual HTML link and preserves base paths, queries and module selection', async () => {
    const sheet = sampleSheet()
    Object.keys(sheet.modules).forEach((key) => { sheet.modules[key as keyof typeof sheet.modules] = key === 'biography' })
    const { html, editUrl } = await createSheetExport(sheet, 'https://example.test/project/?a=1&b=2#old')
    const url = editorLinkFrom(html)
    expect(url.href).toBe(editUrl)
    expect(url.pathname).toBe('/project/')
    expect(url.search).toBe('?a=1&b=2')
    expect(readLinkParameters(url.hash).module).toBe('biography')
    expect(await decodeSheetJson(readLinkParameters(url.hash).payload!)).toBe(JSON.stringify(sheet))
  })

  it('takes an immutable snapshot before asynchronous compression', async () => {
    const sheet = sampleSheet('Prima')
    const pending = deferred<string>()
    const task = createSheetExport(sheet, 'https://example.test/', {
      encode: async (snapshot) => { const payload = await encodeSheet(snapshot); await pending.promise; return payload },
      decodeJson: decodeSheetJson, render: renderSheet,
    })
    sheet.identity.name = 'Dopo'
    pending.resolve('done')
    const result = await task
    expect(result.html).toContain('Prima')
    expect(result.html).not.toContain('Dopo')
  })

  it('refuses a readable but altered export before rendering', async () => {
    const render = vi.fn(renderSheet)
    await expect(createSheetExport(sampleSheet(), 'https://example.test/', {
      encode: encodeSheet, decodeJson: async () => JSON.stringify(sampleSheet('Altro')), render,
    })).rejects.toThrow(/non coincidono/)
    expect(render).not.toHaveBeenCalled()
  })

  it.each([
    () => '<div>HTML senza collegamento</div>',
    (_: unknown, url?: string) => `<a href="${url?.replace('data=gz.', 'data=bad.')}">Modifica</a>`,
  ])('refuses missing or altered links in the rendered HTML', async (render) => {
    await expect(createSheetExport(sampleSheet(), 'https://example.test/', {
      encode: encodeSheet, decodeJson: decodeSheetJson, render,
    })).rejects.toThrow()
  })
})

describe('published link diagnostics', () => {
  it('recognizes identical plain links and HTML without fetching the address', async () => {
    const sheet = sampleSheet()
    const { html, editUrl } = await createSheetExport(sheet, 'https://example.test/')
    expect(await comparePublishedLink(editUrl, sheet)).toBe('identical')
    expect(await comparePublishedLink(html, sheet)).toBe('identical')
    expect(await comparePublishedLink(html, sampleSheet('Nuova versione'))).toBe('different')
  })

  it('compares legacy JSON with different whitespace or object-key order', async () => {
    const sheet = sampleSheet()
    const payload = Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(sheet).reverse()), null, 2)).toString('base64url')
    expect(await comparePublishedLink(`https://example.test/#data=${payload}`, sheet)).toBe('identical')
  })

  it.each(['https://example.test/#data=gz.bad', 'javascript:alert(1)', '<a href="https://example.test/">altro</a>'])('rejects broken links: %s', async (value) => {
    await expect(comparePublishedLink(value, sampleSheet())).rejects.toThrow()
  })

  it('accepts the legacy layer parameter but rejects ambiguous or empty data', () => {
    expect(readLinkParameters('#layer=inventory').module).toBe('inventory')
    expect(readLinkParameters('#module=unknown').module).toBeNull()
    expect(() => readLinkParameters('#data=')).toThrow()
    expect(() => readLinkParameters('#data=a&data=b')).toThrow()
  })
})
