<script lang="ts">
  import { onMount } from 'svelte'
  import { Braces, Check, Clipboard, Code2, Download, RotateCcw, Upload } from '@lucide/svelte'
  import { decodeSheet, encodeSheet, parseSheetJson } from './lib/codec'
  import { defaultSheet } from './lib/defaultSheet'
  import { renderPreviewDocument } from './lib/forumPreview'
  import { renderSheet } from './lib/renderSheet'
  import SheetFieldsEditor from './lib/SheetFieldsEditor.svelte'
  import type { CharacterSheet, ModuleKey } from './lib/types'

  type Tab = 'fields' | 'json' | 'html'

  const moduleKeys: ModuleKey[] = ['header', 'general', 'reputation', 'influence', 'statistics', 'talents', 'abilities', 'languages', 'inventory', 'biography']
  const initialSheet = structuredClone(defaultSheet)
  const initialRenderedSheet = renderSheet(initialSheet)

  let sheet = $state<CharacterSheet>(initialSheet)
  let jsonText = $state(JSON.stringify(initialSheet, null, 2))
  let activeTab = $state<Tab>('fields')
  let notice = $state('')
  let noticeIsError = $state(false)
  let requestedModule = $state<ModuleKey | null>(null)
  let exportedHtml = $state('')
  let previewHtml = $state(initialRenderedSheet)
  let previewPending = $state(false)
  let exportRevision = 0
  let fileInput = $state<HTMLInputElement>()
  let previewFrame = $state<HTMLIFrameElement>()
  let previewScrollX = 0
  let previewScrollY = 0
  let detachPreviewScroll: (() => void) | undefined
  let generatedHtml = $derived(renderSheet(sheet))
  let previewDocument = $derived(renderPreviewDocument(previewHtml))

  function parseModuleParameter(params: URLSearchParams): ModuleKey | null {
    const value = params.get('module') ?? params.get('layer')
    return moduleKeys.includes(value as ModuleKey) ? value as ModuleKey : null
  }

  function onlyModuleVisible(targetSheet: CharacterSheet, module: ModuleKey): CharacterSheet {
    return {
      ...targetSheet,
      modules: Object.fromEntries(moduleKeys.map((key) => [key, key === module])) as CharacterSheet['modules'],
    }
  }

  function singleVisibleModule(targetSheet: CharacterSheet): ModuleKey | null {
    const visible = moduleKeys.filter((key) => targetSheet.modules[key])
    return visible.length === 1 ? visible[0] : null
  }

  async function createExportHtml(targetSheet: CharacterSheet): Promise<string> {
    const payload = await encodeSheet(targetSheet)
    const params = new URLSearchParams({ data: payload })
    const module = singleVisibleModule(targetSheet)
    if (module) params.set('module', module)
    const editUrl = `${location.origin}${location.pathname}${location.search}#${params}`
    return renderSheet(targetSheet, editUrl)
  }

  $effect(() => {
    generatedHtml
    const revision = ++exportRevision
    const snapshot = structuredClone($state.snapshot(sheet))
    previewPending = true
    const timer = window.setTimeout(() => {
      createExportHtml(snapshot).then((html) => {
        if (revision !== exportRevision) return
        exportedHtml = html
        previewHtml = html
        previewPending = false
      }).catch(() => {
        if (revision !== exportRevision) return
        exportedHtml = generatedHtml
        previewHtml = generatedHtml
        previewPending = false
      })
    }, 400)
    return () => window.clearTimeout(timer)
  })

  function rememberPreviewScroll() {
    const frameWindow = previewFrame?.contentWindow
    if (frameWindow) {
      previewScrollX = frameWindow.scrollX
      previewScrollY = frameWindow.scrollY
    }
    detachPreviewScroll?.()
    detachPreviewScroll = undefined
  }

  function handlePreviewLoad() {
    const frameWindow = previewFrame?.contentWindow
    if (!frameWindow) return

    const restoreScroll = () => frameWindow.scrollTo(previewScrollX, previewScrollY)
    restoreScroll()
    requestAnimationFrame(restoreScroll)

    const trackScroll = () => {
      previewScrollX = frameWindow.scrollX
      previewScrollY = frameWindow.scrollY
    }
    frameWindow.addEventListener('scroll', trackScroll, { passive: true })
    detachPreviewScroll = () => frameWindow.removeEventListener('scroll', trackScroll)
  }

  $effect.pre(() => {
    previewDocument
    rememberPreviewScroll()
  })

  function showNotice(message: string, isError = false) {
    notice = message
    noticeIsError = isError
    window.setTimeout(() => { if (notice === message) notice = '' }, 3500)
  }

  function syncJson() {
    jsonText = JSON.stringify(sheet, null, 2)
  }

  function scheduleJsonSync() {
    queueMicrotask(syncJson)
  }

  function applyJson() {
    try {
      sheet = structuredClone(parseSheetJson(jsonText))
      requestedModule = null
      syncJson()
      showNotice('JSON applicato alla scheda')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'JSON non valido', true)
    }
  }

  function resetSheet() {
    sheet = structuredClone(defaultSheet)
    requestedModule = null
    syncJson()
    history.replaceState(null, '', `${location.pathname}${location.search}`)
    showNotice('Dati di esempio ripristinati')
  }

  async function loadFromHash() {
    const params = new URLSearchParams(location.hash.slice(1))
    const payload = params.get('data')
    const module = parseModuleParameter(params)
    if (!payload && !module) {
      requestedModule = null
      return
    }
    try {
      const loadedSheet = payload ? await decodeSheet(payload) : structuredClone(defaultSheet)
      sheet = structuredClone(module ? onlyModuleVisible(loadedSheet, module) : loadedSheet)
      requestedModule = module
      syncJson()
      showNotice(module ? `Aperto il modulo ${module}` : 'Scheda caricata dal link')
    } catch (error) {
      showNotice(`Link non valido: ${error instanceof Error ? error.message : 'payload illeggibile'}`, true)
    }
  }

  async function copyHtml() {
    try {
      const html = await createExportHtml(structuredClone($state.snapshot(sheet)))
      exportedHtml = html
      previewHtml = html
      previewPending = false
      await navigator.clipboard.writeText(html)
      showNotice('HTML copiato negli appunti')
    } catch {
      showNotice('Accesso agli appunti non disponibile', true)
    }
  }

  async function downloadHtml() {
    const html = await createExportHtml(structuredClone($state.snapshot(sheet)))
    exportedHtml = html
    previewHtml = html
    previewPending = false
    downloadFile('scheda-pg.html', html, 'text/html')
  }

  function downloadFile(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    jsonText = await file.text()
    applyJson()
    input.value = ''
  }

  onMount(() => {
    loadFromHash()
    window.addEventListener('hashchange', loadFromHash)
    return () => {
      window.removeEventListener('hashchange', loadFromHash)
      detachPreviewScroll?.()
    }
  })
</script>

<svelte:head>
  <meta name="description" content="Editor statico per creare e condividere schede personaggio da JSON." />
</svelte:head>

<header class="app-header">
  <div class="brand-mark" aria-hidden="true">IT</div>
  <div class="brand-copy"><strong>Configuratore Scheda PG</strong><span>Generatore di schede</span></div>
  <div class="header-actions">
    <button class="icon-button" type="button" onclick={resetSheet} title="Ripristina esempio" aria-label="Ripristina esempio"><RotateCcw size={18} /></button>
    <button class="secondary-button" type="button" onclick={() => downloadFile('scheda-pg.json', JSON.stringify(sheet, null, 2), 'application/json')}><Download size={17} /> JSON</button>
    <button class="primary-button" type="button" onclick={copyHtml}><Clipboard size={17} /> Copia HTML</button>
  </div>
</header>

<main class="workspace">
  <aside class="editor-panel">
    <div class="panel-heading">
      <div><span class="eyebrow">Sorgente dati</span><h1>{sheet.identity.name}</h1></div>
      <span class="version">v{sheet.version}</span>
    </div>

    <nav class="tabs" aria-label="Modalita editor">
      <button class:active={activeTab === 'fields'} type="button" onclick={() => activeTab = 'fields'}><Code2 size={16} /> Campi</button>
      <button class:active={activeTab === 'json'} type="button" onclick={() => activeTab = 'json'}><Braces size={16} /> JSON</button>
      <button class:active={activeTab === 'html'} type="button" onclick={() => activeTab = 'html'}><Clipboard size={16} /> HTML</button>
    </nav>

    <div class="editor-scroll">
      {#if activeTab === 'fields'}
        <SheetFieldsEditor bind:sheet onChange={scheduleJsonSync} openModule={requestedModule} />
      {:else if activeTab === 'json'}
        <section class="code-section">
          <div class="code-toolbar"><span>scheda-pg.json</span><button type="button" class="text-button" onclick={() => fileInput?.click()}><Upload size={16} /> Importa</button></div>
          <textarea class="code-editor" bind:value={jsonText} spellcheck="false" aria-label="JSON della scheda"></textarea>
          <input class="visually-hidden" bind:this={fileInput} type="file" accept="application/json,.json" onchange={importJson} />
          <button class="primary-button wide" type="button" onclick={applyJson}><Check size={17} /> Applica JSON</button>
        </section>
      {:else}
        <section class="code-section">
          <div class="code-toolbar"><span>HTML pronto per il forum</span><button type="button" class="text-button" onclick={copyHtml}><Clipboard size={16} /> Copia</button></div>
          <textarea class="code-editor" value={exportedHtml || generatedHtml} readonly spellcheck="false" aria-label="HTML generato"></textarea>
          <button class="secondary-button wide" type="button" onclick={downloadHtml}><Download size={17} /> Scarica HTML</button>
        </section>
      {/if}
    </div>
  </aside>

  <section class="preview-panel">
    <div class="preview-toolbar">
      <div><span class:pending={previewPending} class="live-dot"></span><strong>Anteprima live</strong><span>{previewPending ? 'In attesa…' : 'Aggiornata'}</span></div>
      <span>{sheet.statistics.length} statistiche · {sheet.abilities.length} abilita</span>
    </div>
    <div class="preview-canvas">
      <iframe bind:this={previewFrame} class="sheet-preview-frame" title="Anteprima della scheda personaggio" srcdoc={previewDocument} onload={handlePreviewLoad}></iframe>
    </div>
  </section>
</main>

{#if notice}
  <div class:error={noticeIsError} class="notice" role="status">{notice}</div>
{/if}
