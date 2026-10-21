import { test as base, expect, type Page } from '@playwright/test'
import { gzipSync, gunzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import { HISTORY_KEY } from '../../src/lib/sheetHistory'
import { longSheet, sampleSheet } from '../fixtures'

const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await use(errors)
    expect(errors, 'No uncaught errors or unhandled stream promises').toEqual([])
  }, { auto: true }],
})

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => route.request().url().startsWith('http://127.0.0.1:4173') ? route.continue() : route.abort())
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (html: string) => { (window as unknown as { copiedHtml: string }).copiedHtml = html } },
    })
  })
})

async function appliedJson(page: Page) {
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  return JSON.parse(await page.getByRole('textbox', { name: 'JSON della scheda' }).inputValue())
}

async function applySheet(page: Page, name: string) {
  await page.getByRole('button', { name: 'JSON', exact: true }).click()
  await page.getByRole('textbox', { name: 'JSON della scheda' }).fill(JSON.stringify(sampleSheet(name)))
  await page.getByRole('button', { name: 'Applica JSON' }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

test('loads a long independently compressed Unicode link and exports verified HTML', async ({ page }) => {
  const source = longSheet()
  const payload = 'gz.' + gzipSync(JSON.stringify(source)).toString('base64url')
  await page.goto('/#' + new URLSearchParams({ data: payload }))
  await expect(page.getByRole('heading', { name: source.identity.name, exact: true })).toBeVisible()
  expect((await appliedJson(page)).biography).toEqual(source.biography)
  await page.getByRole('button', { name: 'Copia HTML', exact: true }).first().click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { copiedHtml?: string }).copiedHtml ?? '')).toContain('Modifica questa scheda')
  const html = await page.evaluate(() => (window as unknown as { copiedHtml: string }).copiedHtml)
  const href = html.match(/href="([^"]+#data=[^"]+)"/)![1]!.replaceAll('&amp;', '&')
  const exportedPayload = new URLSearchParams(new URL(href).hash.slice(1)).get('data')!
  const decoded = JSON.parse(gunzipSync(Buffer.from(exportedPayload.slice(3), 'base64url')).toString())
  expect(decoded).toEqual(await appliedJson(page))
})

test('autosaves field edits and restores them after reloading', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Nome del personaggio', exact: true }).fill('Salvata automaticamente')
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{"entries":[]}').entries[0]?.name, HISTORY_KEY)).toBe('Salvata automaticamente')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Salvata automaticamente', exact: true })).toBeVisible()
})

test('reloading an edited imported link does not replay its original stale payload', async ({ page }) => {
  const payload = 'gz.' + gzipSync(JSON.stringify(sampleSheet('Dal link'))).toString('base64url')
  await page.goto('/#' + new URLSearchParams({ data: payload }))
  await expect(page.getByRole('heading', { name: 'Dal link', exact: true })).toBeVisible()
  expect(new URL(page.url()).hash).toBe('')
  await page.getByRole('textbox', { name: 'Nome del personaggio', exact: true }).fill('Modificata dopo il link')
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).entries[0].name, HISTORY_KEY)).toBe('Modificata dopo il link')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Modificata dopo il link', exact: true })).toBeVisible()
})

test('flushes recent edits on pagehide without waiting for the debounce', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Nome del personaggio', exact: true }).fill('Ultima modifica')
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).entries[0].name, HISTORY_KEY)).toBe('Ultima modifica')
})

test('an invalid link at startup retains the saved document and its history', async ({ page }) => {
  await page.goto('/')
  await applySheet(page, 'Scheda protetta')
  const before = await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)
  await page.goto('/#data=gz.bad')
  await expect(page.getByRole('heading', { name: 'Scheda protetta', exact: true })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Link non valido')
  expect(await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)).toBe(before)
})

for (const damage of ['body', 'checksum', 'truncated'] as const) {
  test(`a damaged GZIP ${damage} never replaces an open sheet or leaks stream promises`, async ({ page }) => {
    await page.goto('/')
    await applySheet(page, 'Da conservare')
    const before = await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)
    const compressed = gzipSync(JSON.stringify(longSheet()))
    if (damage === 'body') compressed[Math.floor(compressed.length / 2)]! ^= 0xff
    if (damage === 'checksum') compressed[compressed.length - 8]! ^= 0xff
    const bytes = damage === 'truncated' ? compressed.subarray(0, -10) : compressed
    await page.evaluate((payload) => { location.hash = new URLSearchParams({ data: payload }).toString() }, 'gz.' + bytes.toString('base64url'))
    await expect(page.getByRole('status')).toContainText('Link non valido')
    await expect(page.getByRole('heading', { name: 'Da conservare', exact: true })).toBeVisible()
    expect(await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)).toBe(before)
  })
}

test('an incomplete editor field cannot produce a broken export or an uncaught reset error', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Nome del personaggio', exact: true }).fill('')
  await page.getByRole('button', { name: 'Copia HTML', exact: true }).first().click()
  await expect(page.getByRole('status')).toContainText('HTML non copiato')
  await page.getByRole('button', { name: 'Ripristina esempio', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Ripristino non eseguito')
  await expect(page.getByRole('textbox', { name: 'Nome del personaggio', exact: true })).toHaveValue('')
})

test('invalid JSON and malformed sections never replace the current document', async ({ page }) => {
  await page.goto('/')
  await applySheet(page, 'Da proteggere')
  const before = await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)
  for (const json of ['{', '{}', JSON.stringify({ ...sampleSheet(), biography: {} })]) {
    await page.getByRole('textbox', { name: 'JSON della scheda' }).fill(json)
    await page.getByRole('button', { name: 'Applica JSON' }).click()
    await expect(page.getByRole('heading', { name: 'Da proteggere', exact: true })).toBeVisible()
  }
  expect(await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)).toBe(before)
})

test('imports a file and recovers the pre-import and pre-reset documents', async ({ page }) => {
  await page.goto('/')
  await applySheet(page, 'Prima del file')
  await page.locator('input[type=file]').setInputFiles({ name: 'scheda.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(sampleSheet('Dal file'))) })
  await expect(page.getByRole('heading', { name: 'Dal file', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ripristina esempio', exact: true }).click()
  await page.getByRole('button', { name: 'Copie e link', exact: true }).click()
  const backup = page.locator('.backup-card').filter({ has: page.getByText('Prima del file', { exact: true }) })
  await backup.getByRole('button', { name: 'Recupera', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Prima del file', exact: true })).toBeVisible()
  await expect(page.locator('.backup-card').filter({ has: page.getByText('Dal file', { exact: true }) })).toBeVisible()
})

test('JSON downloads contain the complete editable sheet and Unicode biography', async ({ page }) => {
  await page.goto('/')
  await applySheet(page, 'Copia indipendente')
  const expected = await appliedJson(page)
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica backup JSON', exact: true }).first().click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('scheda-pg.json')
  expect(JSON.parse(await readFile((await download.path())!, 'utf8'))).toEqual(expected)
})

test('compares HTML copied back from a forum and detects alterations', async ({ page }) => {
  await page.goto('/')
  await applySheet(page, 'Confronto')
  await page.getByRole('button', { name: 'Copia HTML', exact: true }).first().click()
  await expect.poll(() => page.evaluate(() => (window as unknown as { copiedHtml?: string }).copiedHtml)).toBeTruthy()
  const html = await page.evaluate(() => (window as unknown as { copiedHtml: string }).copiedHtml)
  await page.getByRole('button', { name: 'Copie e link', exact: true }).click()
  await page.getByRole('textbox', { name: 'Link o codice HTML' }).fill(html)
  await page.getByRole('button', { name: 'Verifica link', exact: true }).click()
  await expect(page.getByText('Il link contiene gli stessi dati della scheda aperta.', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Link o codice HTML' }).fill(html.replace('data=gz.', 'data=broken.'))
  await page.getByRole('button', { name: 'Verifica link', exact: true }).click()
  await expect(page.locator('.backup-section .persistent-error')).toBeVisible()
})

test('unavailable storage keeps session backups and the JSON download available', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError') } }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Salvataggio locale non disponibile')
  await applySheet(page, 'Solo in memoria')
  await page.getByRole('button', { name: 'Copie e link', exact: true }).click()
  await expect(page.locator('.backup-card').filter({ has: page.getByText('Solo in memoria', { exact: true }) })).toBeVisible()
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica backup JSON', exact: true }).first().click()
  expect((await event).suggestedFilename()).toBe('scheda-pg.json')
})

test('damaged local history is left untouched and reported persistently', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'damaged original'), HISTORY_KEY)
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('non verranno sovrascritti')
  await applySheet(page, 'Nuova scheda')
  expect(await page.evaluate((key) => localStorage.getItem(key), HISTORY_KEY)).toBe('damaged original')
})

test('compression failure blocks HTML export but preserves JSON and gives a persistent error', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'CompressionStream', { value: undefined }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Esportazione non disponibile')
  await page.getByRole('button', { name: 'Copia HTML', exact: true }).first().click()
  await expect(page.getByRole('status')).toContainText('HTML non copiato')
  expect(await page.evaluate(() => (window as unknown as { copiedHtml?: string }).copiedHtml)).toBeUndefined()
  await page.getByRole('button', { name: 'HTML', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'HTML generato' })).toHaveValue('')
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica backup JSON', exact: true }).first().click()
  expect((await event).suggestedFilename()).toBe('scheda-pg.json')
})

test('distinguishes denied clipboard access from failed export verification', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied') } } }))
  await page.getByRole('button', { name: 'Copia HTML', exact: true }).first().click()
  await expect(page.getByRole('status')).toContainText('Accesso agli appunti non disponibile')
  await page.getByRole('button', { name: 'HTML', exact: true }).click()
  const event = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Scarica HTML', exact: true }).click()
  const download = await event
  expect(await readFile((await download.path())!, 'utf8')).toContain('Modifica questa scheda')
})

test('keeps the JSON backup action visible on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Scarica backup JSON', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
