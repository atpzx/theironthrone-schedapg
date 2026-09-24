<script lang="ts">
  import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from '@lucide/svelte'
  import { experienceProgress, statisticModifier, statisticTotal } from './calculations'
  import type { CharacterSheet, InventoryItem, ModuleKey } from './types'

  let { sheet = $bindable(), onChange, openModule = null }: { sheet: CharacterSheet; onChange: () => void; openModule?: ModuleKey | null } = $props()

  const moduleLabels: Record<ModuleKey, string> = {
    header: 'Intestazione', general: 'Informazioni', reputation: 'Reputazione', influence: 'Influenza',
    statistics: 'Statistiche', talents: 'Talenti e difetti', abilities: 'Abilita', languages: 'Linguaggi',
    inventory: 'Inventario', biography: 'Biografia',
  }
  const moduleKeys = Object.keys(moduleLabels) as ModuleKey[]
  const territories = [
    'Altopiano', 'Baia degli Schiavisti', 'Città Libere', 'Dorne', 'Dothraki', "Isole dell'Estate",
    'Isole di Ferro', 'Nord', 'Qarth', 'Terre della Corona', 'Terre dei Fiumi', "Terre dell'Ovest",
    'Terre della Tempesta', 'Terre Selvagge', 'Valle di Arryn', 'Yi Ti',
  ]
  const inventoryLabels: Record<InventoryItem['type'], string> = {
    item: 'Oggetto', weapon: 'Arma', armor: 'Armatura', shield: 'Scudo', pet: 'Animale o cavalcatura',
  }
  const armorLabels: Array<[keyof CharacterSheet['armor'], string]> = [
    ['head', 'Testa'], ['torso', 'Torso'], ['rightArm', 'Braccio destro'], ['leftArm', 'Braccio sinistro'],
    ['rightLeg', 'Gamba destra'], ['leftLeg', 'Gamba sinistra'], ['shield', 'Scudo'],
  ]
  let lastOpenModule: ModuleKey | null | undefined
  let statisticOpen = $state<Record<string, boolean>>({})
  let sectionOpen = $state({
    header: true,
    general: true,
    reputation: false,
    statistics: false,
    talents: false,
    abilities: false,
    languages: false,
    inventory: false,
    biography: false,
    visibility: false,
  })

  $effect.pre(() => {
    sheet.statistics.forEach((statistic, index) => {
      if (statisticOpen[statistic.key] === undefined) statisticOpen[statistic.key] = index === 0
    })
  })

  $effect(() => {
    if (openModule === lastOpenModule) return
    lastOpenModule = openModule
    sectionOpen.header = openModule ? openModule === 'header' : true
    sectionOpen.general = openModule ? openModule === 'general' : true
    sectionOpen.reputation = openModule === 'reputation' || openModule === 'influence'
    sectionOpen.statistics = openModule === 'statistics'
    sectionOpen.talents = openModule === 'talents'
    sectionOpen.abilities = openModule === 'abilities'
    sectionOpen.languages = openModule === 'languages'
    sectionOpen.inventory = openModule === 'inventory'
    sectionOpen.biography = openModule === 'biography'
    sectionOpen.visibility = false
  })

  function removeItem<T>(items: T[], index: number) {
    items.splice(index, 1)
    onChange()
  }

  function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    onChange()
  }

  function setModuleVisibility(key: ModuleKey, event: Event) {
    sheet.modules = { ...sheet.modules, [key]: (event.currentTarget as HTMLInputElement).checked }
    onChange()
  }

  function setAllModules(visible: boolean) {
    sheet.modules = Object.fromEntries(moduleKeys.map((key) => [key, visible])) as CharacterSheet['modules']
    onChange()
  }

  function setTerritory(value: string) {
    const territory = value === '__other' ? '' : value
    sheet.identity.regionTitle = territory
    sheet.general.region = territory
    onChange()
  }

  function setCustomTerritory(value: string) {
    sheet.identity.regionTitle = value
    sheet.general.region = value
    onChange()
  }

  function createInventoryItem(type: InventoryItem['type']): InventoryItem {
    const base = { name: '', iconUrl: '', weight: '', notes: '' }
    switch (type) {
      case 'weapon': return { ...base, type, damage: '' }
      case 'armor': return { ...base, type, damageReduction: '', testPenalty: '', hardness: '', woundPoints: '' }
      case 'shield': return { ...base, type, damageReduction: '', armorBonus: '', testPenalty: '', hardness: '', woundPoints: '' }
      case 'pet': return { ...base, type, hitPoints: '', baseAttackBonus: '', defense: '' }
      case 'item': return { ...base, type, quantity: 1 }
    }
  }

  function changeInventoryType(index: number, event: Event) {
    const type = (event.currentTarget as HTMLSelectElement).value as InventoryItem['type']
    const current = sheet.inventory[index]
    sheet.inventory[index] = { ...createInventoryItem(type), name: current.name, iconUrl: current.iconUrl, weight: current.weight, notes: current.notes } as InventoryItem
    onChange()
  }

</script>

<details class="editor-module" bind:open={sectionOpen.header}>
  <summary><span>01</span><strong>Identita</strong></summary>
  <div class="module-fields">
    <label>Nome del personaggio<input bind:value={sheet.identity.name} oninput={onChange} /></label>
    <label>Territorio<select value={territories.includes(sheet.identity.regionTitle) ? sheet.identity.regionTitle : '__other'} onchange={(event) => setTerritory(event.currentTarget.value)}>{#each territories as territory}<option value={territory}>{territory}</option>{/each}<option value="__other">Altro</option></select></label>
    {#if !territories.includes(sheet.identity.regionTitle)}<label>Territorio personalizzato<input value={sheet.identity.regionTitle} oninput={(event) => setCustomTerritory(event.currentTarget.value)} placeholder="Inserisci il territorio" /></label>{/if}
    <label>URL ritratto<input type="url" bind:value={sheet.identity.avatarUrl} oninput={onChange} /></label>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.general}>
  <summary><span>02</span><strong>Informazioni generali</strong></summary>
  <div class="module-fields">
    <div class="two-columns">
      <label>Religione<input bind:value={sheet.general.religion} oninput={onChange} /></label>
      <label>Eta<input type="number" bind:value={sheet.general.age} oninput={onChange} /></label>
      <label>Status sociale<input type="number" bind:value={sheet.general.socialStatus} oninput={onChange} /></label>
      <label>Ricchezza<input type="number" bind:value={sheet.general.wealth} oninput={onChange} /></label>
      <label>Punti ferita<input type="number" bind:value={sheet.general.hitPoints} oninput={onChange} /></label>
      <label>Stordimento<input type="number" bind:value={sheet.general.stun} oninput={onChange} /></label>
    </div>

    <h3>Esperienza</h3>
    <div class="three-columns">
      <label>Livello<input type="number" min="0" bind:value={sheet.general.experience.level} oninput={onChange} /></label>
      <label>XP attuali<input type="number" min="0" bind:value={sheet.general.experience.current} oninput={onChange} /></label>
      <label>XP prossimo livello<input type="number" min="0" bind:value={sheet.general.experience.nextLevel} oninput={onChange} /></label>
    </div>
    <div class="progress-line"><span style={`width:${experienceProgress(sheet.general.experience.current, sheet.general.experience.nextLevel)}%`}></span></div>
    <small class="calculation-note">{experienceProgress(sheet.general.experience.current, sheet.general.experience.nextLevel).toFixed(1)}% verso la soglia indicata</small>

    <div class="subsection-heading"><h3>Classi</h3><button class="add-button" type="button" onclick={() => { sheet.general.classes.push({ name: '', value: 1, url: '' }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list">
      {#each sheet.general.classes as characterClass, index}
        <div class="repeat-card">
          <div class="row-actions">
            <button type="button" title="Sposta su" aria-label="Sposta classe su" onclick={() => moveItem(sheet.general.classes, index, -1)} disabled={index === 0}><ArrowUp size={15} /></button>
            <button type="button" title="Sposta giu" aria-label="Sposta classe giu" onclick={() => moveItem(sheet.general.classes, index, 1)} disabled={index === sheet.general.classes.length - 1}><ArrowDown size={15} /></button>
            <button class="danger" type="button" title="Elimina" aria-label="Elimina classe" onclick={() => removeItem(sheet.general.classes, index)}><Trash2 size={15} /></button>
          </div>
          <div class="class-values"><label>Nome<input bind:value={characterClass.name} oninput={onChange} /></label><label>Livello<input type="number" min="0" bind:value={characterClass.value} oninput={onChange} /></label></div>
          <label>URL discussione<input bind:value={characterClass.url} oninput={onChange} /></label>
        </div>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.reputation}>
  <summary><span>03</span><strong>Reputazione e influenza</strong><em>{sheet.reputation.length + sheet.influence.length}</em></summary>
  <div class="module-fields">
    <div class="subsection-heading"><h3>Reputazioni e punti bonus</h3><button class="add-button" type="button" onclick={() => { sheet.reputation.push({ name: '', value: 0 }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list compact">
      {#each sheet.reputation as item, index}
        <div class="repeat-card inline-card">
          <label>Nome<input bind:value={item.name} oninput={onChange} /></label><label>Valore<input bind:value={item.value} oninput={onChange} /></label>
          <button class="danger row-delete" type="button" aria-label="Elimina reputazione" onclick={() => removeItem(sheet.reputation, index)}><Trash2 size={15} /></button>
        </div>
      {/each}
    </div>

    <div class="subsection-heading spaced"><h3>Influenza e affinita</h3><button class="add-button" type="button" onclick={() => { sheet.influence.push({ name: '', value: 0 }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list compact">
      {#each sheet.influence as item, index}
        <div class="repeat-card inline-card">
          <label>Nome<input bind:value={item.name} oninput={onChange} /></label><label>Valore<input bind:value={item.value} oninput={onChange} /></label>
          <button class="danger row-delete" type="button" aria-label="Elimina influenza" onclick={() => removeItem(sheet.influence, index)}><Trash2 size={15} /></button>
        </div>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.statistics}>
  <summary><span>04</span><strong>Statistiche</strong><em>{sheet.statistics.length}</em></summary>
  <div class="module-fields">
    <p class="section-help statistics-help">Il totale e il modificatore vengono calcolati automaticamente.</p>
    <div class="repeat-list">
      {#each sheet.statistics as stat, statIndex}
        <details class="repeat-card nested-details" bind:open={statisticOpen[stat.key]}>
          <summary><span class="stat-swatch" style={`--stat-color:${stat.color}`}></span><strong>{stat.name}</strong><b>{statisticTotal(stat)}</b><small>mod. {statisticModifier(statisticTotal(stat)) >= 0 ? '+' : ''}{statisticModifier(statisticTotal(stat))}</small></summary>
          <div class="nested-fields">
            <label class="stat-base-field">Valore base<input type="number" bind:value={stat.baseValue} oninput={onChange} /></label>
            <div class="subsection-heading"><h3>Modificatori</h3><button class="add-button" type="button" onclick={() => { stat.modifiers.push({ name: '', value: 0 }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
            <div class="repeat-list compact">
              {#each stat.modifiers as modifier, modifierIndex}
                <div class="repeat-card inline-card modifier-row"><label>Nome o sigla<input bind:value={modifier.name} oninput={onChange} /></label><label>Valore<input type="number" bind:value={modifier.value} oninput={onChange} /></label><button class="danger row-delete" type="button" aria-label="Elimina modificatore" onclick={() => removeItem(stat.modifiers, modifierIndex)}><Trash2 size={15} /></button></div>
              {/each}
            </div>
          </div>
        </details>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.talents}>
  <summary><span>05</span><strong>Talenti e difetti</strong><em>{sheet.talents.length + sheet.flaws.length}</em></summary>
  <div class="module-fields">
    <div class="subsection-heading"><h3>Talenti</h3><button class="add-button" type="button" onclick={() => { sheet.talents.push({ name: '', description: '' }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list">
      {#each sheet.talents as item, index}
        <div class="repeat-card"><div class="row-actions"><button class="danger" type="button" aria-label="Elimina talento" onclick={() => removeItem(sheet.talents, index)}><Trash2 size={15} /></button></div><label>Nome<input bind:value={item.name} oninput={onChange} /></label><label>Descrizione<textarea rows="3" bind:value={item.description} oninput={onChange}></textarea></label></div>
      {/each}
    </div>
    <div class="subsection-heading spaced"><h3>Difetti</h3><button class="add-button" type="button" onclick={() => { sheet.flaws.push({ name: '', description: '' }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list">
      {#each sheet.flaws as item, index}
        <div class="repeat-card"><div class="row-actions"><button class="danger" type="button" aria-label="Elimina difetto" onclick={() => removeItem(sheet.flaws, index)}><Trash2 size={15} /></button></div><label>Nome<input bind:value={item.name} oninput={onChange} /></label><label>Descrizione<textarea rows="3" bind:value={item.description} oninput={onChange}></textarea></label></div>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.abilities}>
  <summary><span>06</span><strong>Abilita</strong><em>{sheet.abilities.length}</em></summary>
  <div class="module-fields">
    <div class="subsection-heading"><p class="section-help">Nome e proprieta sono sempre liberi.</p><button class="add-button" type="button" onclick={() => { sheet.abilities.push({ name: '', ranks: 0, isClassSkill: false, access: 'common' }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list compact">
      {#each sheet.abilities as ability, index}
        <div class="repeat-card ability-card">
          <div class="ability-name-row"><label>Nome<input bind:value={ability.name} oninput={onChange} /></label><button class="danger row-delete" type="button" aria-label="Elimina abilita" onclick={() => removeItem(sheet.abilities, index)}><Trash2 size={15} /></button></div>
          <div class="ability-values"><label>Gradi<input type="number" min="0" bind:value={ability.ranks} oninput={onChange} /></label><label>Accesso<select bind:value={ability.access} onchange={onChange}><option value="common">Comune</option><option value="uncommon">Uso non comune</option><option value="trained-only">Richiede gradi</option></select></label></div>
          <label class="check-field"><input type="checkbox" bind:checked={ability.isClassSkill} onchange={onChange} /> Abilita di classe</label>
        </div>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.languages}>
  <summary><span>07</span><strong>Linguaggi</strong><em>{sheet.languages.length}</em></summary>
  <div class="module-fields">
    <div class="subsection-heading"><p class="section-help">Aggiungi qualsiasi lingua o dialetto.</p><button class="add-button" type="button" onclick={() => { sheet.languages.push({ name: '', spoken: true, written: false }); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list compact">
      {#each sheet.languages as language, index}
        <div class="repeat-card language-card"><label>Nome<input bind:value={language.name} oninput={onChange} /></label><div class="check-row"><label class="check-field"><input type="checkbox" bind:checked={language.spoken} onchange={onChange} /> Parlato</label><label class="check-field"><input type="checkbox" bind:checked={language.written} onchange={onChange} /> Scritto</label></div><button class="danger row-delete" type="button" aria-label="Elimina linguaggio" onclick={() => removeItem(sheet.languages, index)}><Trash2 size={15} /></button></div>
      {/each}
    </div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.inventory}>
  <summary><span>08</span><strong>Equipaggiamento</strong><em>{sheet.inventory.length}</em></summary>
  <div class="module-fields">
    <div class="subsection-heading"><p class="section-help">Scegli solo la struttura dell'oggetto, poi inserisci liberamente i valori.</p><button class="add-button" type="button" onclick={() => { sheet.inventory.push(createInventoryItem('item')); onChange() }}><Plus size={15} /> Aggiungi</button></div>
    <div class="repeat-list">
      {#each sheet.inventory as item, index}
        <details class="repeat-card nested-details">
          <summary><strong>{item.name || 'Nuovo oggetto'}</strong><small>{inventoryLabels[item.type]}</small></summary>
          <div class="nested-fields">
            <div class="row-actions"><button type="button" aria-label="Sposta oggetto su" onclick={() => moveItem(sheet.inventory, index, -1)} disabled={index === 0}><ArrowUp size={15} /></button><button type="button" aria-label="Sposta oggetto giu" onclick={() => moveItem(sheet.inventory, index, 1)} disabled={index === sheet.inventory.length - 1}><ArrowDown size={15} /></button><button class="danger" type="button" aria-label="Elimina oggetto" onclick={() => removeItem(sheet.inventory, index)}><Trash2 size={15} /></button></div>
            <div class="two-columns"><label>Tipo<select value={item.type} onchange={(event) => changeInventoryType(index, event)}>{#each Object.entries(inventoryLabels) as [value, label]}<option {value}>{label}</option>{/each}</select></label><label>Nome<input bind:value={item.name} oninput={onChange} /></label><label>Peso<input bind:value={item.weight} oninput={onChange} /></label><label>URL icona<input bind:value={item.iconUrl} oninput={onChange} /></label></div>
            {#if item.type === 'item'}<label>Quantita<input bind:value={item.quantity} oninput={onChange} /></label>{/if}
            {#if item.type === 'weapon'}<label>Danno<input bind:value={item.damage} oninput={onChange} /></label>{/if}
            {#if item.type === 'armor' || item.type === 'shield'}
              <div class="two-columns"><label>Riduzione danno<input bind:value={item.damageReduction} oninput={onChange} /></label><label>Penalita alla prova<input bind:value={item.testPenalty} oninput={onChange} /></label><label>Durezza<input bind:value={item.hardness} oninput={onChange} /></label><label>Punti ferita<input bind:value={item.woundPoints} oninput={onChange} /></label>{#if item.type === 'shield'}<label>Bonus armatura<input bind:value={item.armorBonus} oninput={onChange} /></label>{/if}</div>
            {/if}
            {#if item.type === 'pet'}<div class="three-columns"><label>Punti ferita<input bind:value={item.hitPoints} oninput={onChange} /></label><label>BAB<input bind:value={item.baseAttackBonus} oninput={onChange} /></label><label>Difesa<input bind:value={item.defense} oninput={onChange} /></label></div>{/if}
            <label>Annotazioni<textarea rows="3" bind:value={item.notes} oninput={onChange}></textarea></label>
          </div>
        </details>
      {/each}
    </div>

    <div class="subsection-heading spaced"><h3>Pannello armatura</h3></div>
    <div class="armor-editor">{#each armorLabels as [key, label]}<label>{label}<input type="number" bind:value={sheet.armor[key]} oninput={onChange} /></label>{/each}</div>
  </div>
</details>

<details class="editor-module" bind:open={sectionOpen.biography}>
  <summary><span>09</span><strong>Biografia</strong></summary>
  <div class="module-fields"><label>Descrizione fisica<textarea rows="6" bind:value={sheet.biography.physicalDescription} oninput={onChange}></textarea></label><label>Storia e psicologia<textarea rows="10" bind:value={sheet.biography.historyAndPsychology} oninput={onChange}></textarea></label></div>
</details>

<details class="editor-module" bind:open={sectionOpen.visibility}>
  <summary><span>10</span><strong>Moduli visibili</strong></summary>
  <div class="module-fields"><div class="visibility-actions"><span>Visibilità rapida</span><div><button type="button" title="Mostra tutti i moduli" aria-label="Mostra tutti i moduli" onclick={() => setAllModules(true)}><Eye size={17} /></button><button type="button" title="Nascondi tutti i moduli" aria-label="Nascondi tutti i moduli" onclick={() => setAllModules(false)}><EyeOff size={17} /></button></div></div><div class="toggle-grid">{#each moduleKeys as key}<label class="toggle"><input type="checkbox" checked={sheet.modules[key]} onchange={(event) => setModuleVisibility(key, event)} /><span></span>{moduleLabels[key]}</label>{/each}</div></div>
</details>
