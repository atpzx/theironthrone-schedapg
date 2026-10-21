<script lang="ts">
  import { onMount } from 'svelte'
  import { Braces, Check, Clipboard, Code2, Download, RotateCcw, Upload } from '@lucide/svelte'
  import { comparePublishedLink, createSheetExport } from './lib/sheetLinks'
  import { SheetHistory, type SheetBackup } from './lib/sheetHistory'
  import { SheetWorkspace } from './lib/sheetWorkspace'
  import { resolveAbilities } from './lib/abilities'
  import { defaultSheet } from './lib/defaultSheet'
  import { renderPreviewDocument } from './lib/forumPreview'
  import { renderSheet } from './lib/renderSheet'
  import SheetFieldsEditor from './lib/SheetFieldsEditor.svelte'
  import type { CharacterSheet, ModuleKey } from './lib/types'

  type Tab = 'fields' | 'json' | 'html' | 'backups'

  const initialSheet = structuredClone(defaultSheet)
  const initialRenderedSheet = renderSheet(initialSheet)

  let sheet = $state<CharacterSheet>(initialSheet)
  let jsonText = $state(JSON.stringify(initialSheet, null, 2))
  let activeTab = $state<Tab>('fields')
  let notice = $state('')
  let noticeIsError = $state(false)
  let requestedModule = $state<ModuleKey | null>(null)
  let exportedHtml = $state('')
  let exportError = $state('')
  let workspace = $state.raw<SheetWorkspace>()
  let backups = $state<SheetBackup[]>([])
  let storageWarning = $state('')
  let publishedLink = $state('')
  let linkComparison = $state('')
  let comparisonIsError = $state(false)
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  let comparisonRevision = 0
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

  function currentSnapshot(): CharacterSheet {
    return structuredClone($state.snapshot(sheet))
  }

  function refreshBackups() {
    if (!workspace) return
    backups = workspace.history.entries
    storageWarning = workspace.history.warning
  }

  function captureCurrent() {
    workspace?.edit(currentSnapshot())
  }

  function flushSave() {
    window.clearTimeout(saveTimer)
    try {
      captureCurrent()
      workspace?.flush()
      refreshBackups()
    } catch (error) {
      storageWarning = `Salvataggio non riuscito: ${error instanceof Error ? error.message : 'scarica una copia JSON.'}`
    }
  }

  function applyWorkspace() {
    if (!workspace) return
    window.clearTimeout(saveTimer)
    sheet = structuredClone(workspace.sheet)
    requestedModule = workspace.module
    syncJson()
    refreshBackups()
    linkComparison = ''
    comparisonRevision++
  }

  function clearLoadedHash() {
    // Once imported, the local working copy owns subsequent edits. Replaying the
    // original URL on reload would silently replace those edits with old data.
    history.replaceState(null, '', `${location.pathname}${location.search}`)
  }

  async function createExportHtml(targetSheet: CharacterSheet): Promise<string> {
    return (await createSheetExport(targetSheet, location.href)).html
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
        exportError = ''
      }).catch((error) => {
        if (revision !== exportRevision) return
        exportedHtml = ''
        previewHtml = generatedHtml
        previewPending = false
        exportError = `Esportazione non disponibile: ${error instanceof Error ? error.message : 'verifica del link fallita.'}`
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
    queueMicrotask(() => {
      syncJson()
      captureCurrent()
      linkComparison = ''
      comparisonRevision++
      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(flushSave, 600)
    })
  }

  function applyJson() {
    try {
      captureCurrent()
      workspace?.importJson(jsonText)
      applyWorkspace()
      clearLoadedHash()
      showNotice('JSON applicato. La scheda precedente è disponibile nelle copie salvate.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'JSON non valido', true)
    }
  }

  function resetSheet() {
    try {
      captureCurrent()
      workspace?.reset()
      applyWorkspace()
      history.replaceState(null, '', `${location.pathname}${location.search}`)
      showNotice('Dati di esempio ripristinati. La scheda precedente è nelle copie salvate.')
    } catch (error) {
      showNotice(`Ripristino non eseguito: ${error instanceof Error ? error.message : 'scarica prima il JSON della scheda aperta.'}`, true)
    }
  }

  async function loadFromHash() {
    if (!workspace) return
    captureCurrent()
    try {
      if (!await workspace.openLink(location.hash)) return
      applyWorkspace()
      clearLoadedHash()
      showNotice(requestedModule ? `Aperto il modulo ${requestedModule}` : 'Scheda caricata dal link')
    } catch (error) {
      showNotice(`Link non valido: ${error instanceof Error ? error.message : 'payload illeggibile'}`, true)
      refreshBackups()
    }
  }

  function restoreBackup(id: string) {
    try {
      captureCurrent()
      workspace?.restore(id)
      applyWorkspace()
      clearLoadedHash()
      showNotice('Versione recuperata. La scheda precedente è stata conservata.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Recupero non riuscito', true)
    }
  }

  async function checkPublishedLink() {
    const revision = ++comparisonRevision
    linkComparison = 'Verifica in corso…'
    comparisonIsError = false
    try {
      const result = await comparePublishedLink(publishedLink, currentSnapshot())
      if (revision !== comparisonRevision) return
      comparisonIsError = result !== 'identical'
      linkComparison = result === 'identical'
        ? 'Il link contiene gli stessi dati della scheda aperta.'
        : 'Il link è leggibile, ma contiene dati diversi dalla scheda aperta. Potrebbe essere una versione precedente.'
    } catch (error) {
      if (revision !== comparisonRevision) return
      comparisonIsError = true
      linkComparison = error instanceof Error ? error.message : 'Link non valido.'
    }
  }

  async function prepareHtml(): Promise<string> {
    flushSave()
    const revision = ++exportRevision
    try {
      const html = await createExportHtml(currentSnapshot())
      if (revision === exportRevision) {
        exportedHtml = html
        previewHtml = html
        previewPending = false
        exportError = ''
      }
      return html
    } catch (error) {
      if (revision === exportRevision) {
        exportedHtml = ''
        exportError = error instanceof Error ? error.message : 'Verifica del link fallita.'
        previewPending = false
      }
      throw error
    }
  }

  async function copyHtml() {
    let html: string
    try { html = await prepareHtml() }
    catch (error) {
      showNotice(`HTML non copiato: ${error instanceof Error ? error.message : 'Verifica del link fallita.'}`, true)
      return
    }
    try {
      await navigator.clipboard.writeText(html)
      showNotice('HTML verificato e copiato. Conserva anche una copia JSON.')
    } catch {
      showNotice('Accesso agli appunti non disponibile. Puoi scaricare l’HTML dalla scheda HTML.', true)
    }
  }

  async function downloadHtml() {
    try { downloadFile('scheda-pg.html', await prepareHtml(), 'text/html') }
    catch (error) {
      showNotice(`HTML non scaricato: ${error instanceof Error ? error.message : 'Verifica del link fallita.'}`, true)
    }
  }

  function downloadJson() {
    flushSave()
    downloadFile('scheda-pg.json', JSON.stringify(sheet, null, 2), 'application/json')
    showNotice('Copia JSON scaricata: conservala per recuperare la scheda.')
  }

  function downloadFile(name: string, content: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function importJson(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      captureCurrent()
      if (!await workspace?.importFile(() => file.text())) return
      applyWorkspace()
      clearLoadedHash()
      showNotice('File JSON importato. La scheda precedente è nelle copie salvate.')
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Lettura del file non riuscita', true)
    } finally { input.value = '' }
  }

  onMount(() => {
    let storage: Storage | undefined
    try { storage = window.localStorage } catch { /* Keep recoverable copies in memory. */ }
    workspace = new SheetWorkspace(new SheetHistory(storage))
    applyWorkspace()
    void loadFromHash()
    const saveWhenHidden = () => { if (document.visibilityState === 'hidden') flushSave() }
    window.addEventListener('hashchange', loadFromHash)
    window.addEventListener('pagehide', flushSave)
    document.addEventListener('visibilitychange', saveWhenHidden)
    return () => {
      flushSave()
      window.removeEventListener('hashchange', loadFromHash)
      window.removeEventListener('pagehide', flushSave)
      document.removeEventListener('visibilitychange', saveWhenHidden)
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
    <button class="icon-button" type="button" onclick={resetSheet} disabled={!workspace} title="Ripristina esempio" aria-label="Ripristina esempio"><RotateCcw size={18} /></button>
    <button class="secondary-button backup-button" type="button" onclick={downloadJson} aria-label="Scarica backup JSON" title="Scarica una copia modificabile della scheda"><Download size={17} /> JSON</button>
    <button class="primary-button" type="button" onclick={copyHtml} disabled={!workspace}><Clipboard size={17} /> Copia HTML</button>
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
      <button class:active={activeTab === 'html'} type="button" onclick={() => activeTab = 'html'}><Code2 size={16} /> HTML</button>
      <button class:active={activeTab === 'backups'} type="button" onclick={() => activeTab = 'backups'}><RotateCcw size={16} /> Copie e link</button>
    </nav>

    <div class="document-status">
      <p>Conserva una copia JSON: permette di recuperare la scheda anche se il link viene alterato.</p>
      {#if storageWarning}<p class="persistent-error" role="alert">{storageWarning}</p>{/if}
      {#if exportError}<p class="persistent-error" role="alert">{exportError}</p>{/if}
    </div>

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
      {:else if activeTab === 'html'}
        <section class="code-section">
          <div class="code-toolbar"><span>HTML pronto per il forum</span><button type="button" class="text-button" onclick={copyHtml}><Clipboard size={16} /> Copia</button></div>
          <textarea class="code-editor" value={exportError ? '' : exportedHtml} readonly spellcheck="false" aria-label="HTML generato"></textarea>
          <button class="secondary-button wide" type="button" onclick={downloadHtml}><Download size={17} /> Scarica HTML</button>
        </section>
      {:else}
        <section class="backup-section">
          <h2>Copie salvate</h2>
          <p>Le modifiche applicate vengono salvate nel browser. Sono conservate fino a 10 versioni, incluse le copie precedenti a importazioni e ripristini. Il JSON non ancora applicato non viene salvato.</p>
          <button class="primary-button" type="button" onclick={downloadJson}><Download size={17} /> Scarica backup JSON</button>
          <p>Queste copie appartengono a questo browser e possono andare perse cancellando i dati del sito. Conserva anche il file JSON.</p>
          {#each backups as backup (backup.id)}
            <article class="backup-card">
              <strong>{backup.name}</strong>
              <span>{new Date(backup.savedAt).toLocaleString('it-IT')}</span>
              <span>{backup.reason === 'autosave' ? 'Salvataggio automatico' : `Prima di ${ { import: 'importare un JSON', link: 'aprire un link', reset: 'ripristinare l’esempio', restore: 'recuperare una versione' }[backup.reason]}`}</span>
              <div>
                <button class="text-button" type="button" onclick={() => restoreBackup(backup.id)}>Recupera</button>
                <button class="text-button" type="button" onclick={() => downloadFile('scheda-pg-backup.json', backup.json, 'application/json')}>Scarica JSON</button>
              </div>
            </article>
          {:else}<p>Nessuna copia salvata. Le copie compariranno quando modifichi o importi una scheda.</p>{/each}
          <h2>Verifica un link pubblicato</h2>
          <p>Incolla il link di modifica o l’HTML ripreso dal forum per confrontarlo con la scheda aperta. La verifica avviene qui, senza aprire il collegamento.</p>
          <label>Link o codice HTML<textarea rows="5" bind:value={publishedLink} oninput={() => { comparisonRevision++; linkComparison = '' }}></textarea></label>
          <button class="secondary-button" type="button" onclick={checkPublishedLink} disabled={!publishedLink.trim()}>Verifica link</button>
          {#if linkComparison}<p role="status" class:persistent-error={comparisonIsError}>{linkComparison}</p>{/if}
        </section>
      {/if}
    </div>
  </aside>

  <section class="preview-panel">
    <div class="preview-toolbar">
      <div><span class:pending={previewPending} class="live-dot"></span><strong>Anteprima live</strong><span>{previewPending ? 'In attesa…' : 'Aggiornata'}</span></div>
      <span>{sheet.statistics.length} statistiche · {resolveAbilities(sheet.abilities).length} abilita</span>
    </div>
    <div class="preview-canvas">
      <iframe bind:this={previewFrame} class="sheet-preview-frame" title="Anteprima della scheda personaggio" srcdoc={previewDocument} onload={handlePreviewLoad}></iframe>
    </div>
  </section>
</main>

{#if notice}
  <div class:error={noticeIsError} class="notice" role="status">{notice}</div>
{/if}
