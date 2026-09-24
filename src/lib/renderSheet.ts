import type { CharacterSheet, DescribedItem, InventoryItem, NamedValue } from './types'
import { statisticModifier, statisticTotal } from './calculations'

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const richText = (value: string): string => escapeHtml(value).replaceAll('\n', '<br>')
const signed = (value: number): string => value > 0 ? `+${value}` : String(value)
const safeColor = (value: string): string => /^#[0-9a-f]{6}$/i.test(value) ? value : '#58301f'

function safeUrl(value: string | undefined, allowRelative = false): string {
  if (!value) return ''
  if (allowRelative && /^(?:[?#]|\.{0,2}\/)/.test(value)) return escapeHtml(value)
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.href) : ''
  } catch {
    return ''
  }
}

function renderNamedValues(items: NamedValue[]): string {
  return items.map((item) => {
    const url = safeUrl(item.url, true)
    const name = url
      ? `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>`
      : `<span>${escapeHtml(item.name)}</span>`
    return `<div class="button"><div class="name">${name}</div><div class="value"><span>${escapeHtml(item.value)}</span></div></div>`
  }).join('\n')
}

function renderDescribedItems(items: DescribedItem[]): string {
  return items.map((item) => `<div class="box-item"><div class="name"><span>${escapeHtml(item.name)}</span></div><div class="annotation"><span>${richText(item.description)}</span></div></div>`).join('\n')
}

function renderInventoryItem(item: InventoryItem): string {
  const icon = safeUrl(item.iconUrl) ? `<div class="icon"><img width="30" src="${safeUrl(item.iconUrl)}" alt=""></div>` : ''
  const name = `<div class="name"><span>${escapeHtml(item.name)}</span></div>`
  const weight = `<div class="weight"><span>${escapeHtml(item.weight)}</span></div>`
  const notes = `<div class="annotation"><span>${escapeHtml(item.notes)}</span></div>`
  switch (item.type) {
    case 'weapon':
      return `<div class="box-item tag-weapon">${icon}${name}${weight}<div class="damage"><span>${escapeHtml(item.damage)}</span></div>${notes}</div>`
    case 'armor':
      return `<div class="box-item tag-armor">${icon}${name}${weight}<div class="dmg-reduction"><span>${escapeHtml(item.damageReduction)}</span></div><div class="test-penalty"><span>${escapeHtml(item.testPenalty)}</span></div><div class="hardness"><span>${escapeHtml(item.hardness)}</span></div><div class="wound-points"><span>${escapeHtml(item.woundPoints)}</span></div>${notes}</div>`
    case 'shield':
      return `<div class="box-item tag-shield">${icon}${name}${weight}<div class="dmg-reduction"><span>${escapeHtml(item.damageReduction)}</span></div><div class="armor-bonus"><span>${escapeHtml(item.armorBonus)}</span></div><div class="test-penalty"><span>${escapeHtml(item.testPenalty)}</span></div><div class="hardness"><span>${escapeHtml(item.hardness)}</span></div><div class="wound-points"><span>${escapeHtml(item.woundPoints)}</span></div>${notes}</div>`
    case 'pet':
      return `<div class="box-item tag-pet">${icon}${name}<div class="hitpoints"><span>${escapeHtml(item.hitPoints)}</span></div><div class="bab"><span>${escapeHtml(item.baseAttackBonus)}</span></div><div class="def"><span>${escapeHtml(item.defense)}</span></div>${notes}</div>`
    case 'item':
      return `<div class="box-item">${icon}${name}${weight}<div class="quantity"><span>${escapeHtml(item.quantity)}</span></div>${notes}</div>`
  }
}

export function renderSheet(sheet: CharacterSheet, editUrl?: string): string {
  const parts: string[] = [
    `<div class="scheda-pg no-br iron-theme" style="--sheet-accent:${safeColor(sheet.theme.accent)};--sheet-accent-dark:${safeColor(sheet.theme.accentDark)}">`,
    `<span class="r-comment" title="version">${sheet.version}</span>`,
  ]

  if (sheet.modules.header) {
    parts.push(`<div class="pg-header-container module no-show"><div class="module pg-header no-title" title="${escapeHtml(sheet.identity.regionTitle)}"><span class="avatar"><img style="top:0;left:0" src="${safeUrl(sheet.identity.avatarUrl)}" alt=""></span><span class="name"><h1>${escapeHtml(sheet.identity.name)}</h1></span></div></div>`)
  }

  if (sheet.modules.general) {
    const general = sheet.general
    parts.push(`<div class="module general" title="Informazioni Generali"><div class="info-container">
      <dl class="inline-textbox"><dt>Religione</dt><dd>${escapeHtml(general.religion)}</dd></dl>
      <dl class="inline-textbox"><dt>Regione</dt><dd>${escapeHtml(general.region)}</dd></dl>
      <dl class="inline-valuebox"><dt>Età</dt><dd>${general.age}</dd></dl>
      <dl class="inline-valuebox"><dt>Status Sociale</dt><dd>${general.socialStatus}</dd></dl>
      <dl class="inline-valuebox"><dt>Esperienza</dt><dd>LV. ${general.experience.level} (${general.experience.current}/${general.experience.nextLevel})</dd></dl>
      <dl class="inline-valuebox"><dt>Ricchezza</dt><dd>${general.wealth}</dd></dl>
      <div class="divisor"></div>
      <div class="vitals-grid" style="display:grid;grid-template-columns:50% auto;width:100%">
        <div class="reduced-ironbox" style="grid-template-areas:'name' 'value';grid-template-columns:auto"><div class="name"><span>Punti Ferita</span></div><div class="value"><span>${general.hitPoints}</span></div></div>
        <div class="reduced-ironbox" style="grid-template-areas:'name' 'value';grid-template-columns:auto"><div class="name"><span>Valore di Stordimento</span></div><div class="value"><span>${general.stun}</span></div></div>
      </div>
      <div class="reduced-ironbox classes"><div class="name"><span>Classi</span></div><div class="modifier-list">${general.classes.map((item) => {
        const url = safeUrl(item.url, true)
        return `<div><div class="name">${url ? `<a href="${url}" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>` : escapeHtml(item.name)}</div><div class="value">${escapeHtml(item.value)}</div></div>`
      }).join('')}</div></div>
    </div></div>`)
  }

  if (sheet.modules.reputation) {
    parts.push(`<div class="module perks no-show" title="Reputazioni e Punti Bonus"><div class="info-container"><dl class="simple-container"><dt>Reputazioni e Punti Bonus</dt><dd>${renderNamedValues(sheet.reputation)}</dd></dl></div></div>`)
  }

  if (sheet.modules.influence) {
    parts.push(`<div class="module perks no-show" title="Influenza e Affinità"><div class="info-container"><dl class="simple-container"><dt>Influenza e Affinità</dt><dd>${renderNamedValues(sheet.influence)}</dd></dl></div></div>`)
  }

  if (sheet.modules.statistics) {
    parts.push(`<div class="module pg-stats" title="Statistiche"><div class="info-container">${sheet.statistics.map((stat) => {
      const icon = safeUrl(stat.iconUrl)
      const total = statisticTotal(stat)
      const modifiers = stat.modifiers.map((modifier) => `<div><div class="name">${escapeHtml(modifier.name)}</div><div class="value${modifier.value < 0 ? ' negative' : ''}">${Math.abs(modifier.value)}</div></div>`).join('')
      return `<div class="simple-ironbox"><div class="icon"><span style="display:inline-block;width:50px;height:50px;border-radius:50%;background:${safeColor(stat.color)}"></span></div>${icon ? `<div class="icon"><img width="50" src="${icon}" alt=""></div>` : ''}<div class="name"><span>${escapeHtml(stat.name)}</span></div><div class="value"><span>${total}</span></div><div class="modifier-box"><div class="modifier"><span>${signed(statisticModifier(total))}</span></div><div class="modifier-list">${modifiers}</div></div></div>`
    }).join('')}</div></div>`)
  }

  if (sheet.modules.talents) {
    parts.push(`<div class="module talents no-show" title="Talenti e Difetti"><div class="info-container">
      <dl class="simple-container no-value"><dt>Talenti</dt><dd>${renderDescribedItems(sheet.talents)}</dd></dl>
      <dl class="simple-container"><dt>Difetti</dt><dd>${renderDescribedItems(sheet.flaws)}</dd></dl>
    </div></div>`)
  }

  if (sheet.modules.abilities) {
    const abilities = sheet.abilities.map((ability) => {
      let name = escapeHtml(ability.name)
      if (ability.isClassSkill) name = `<u>${name}</u>`
      if (ability.access !== 'common') name = `<span style="color:${ability.access === 'uncommon' ? 'orange' : 'red'}">${name}</span>`
      return `<div class="button"><div class="name"><span>${name}</span></div><div class="value"><span>${ability.ranks}</span></div></div>`
    }).join('')
    parts.push(`<div class="module perks no-show" title="Abilità"><div class="info-container"><dl class="simple-container"><dt>Abilità</dt><dd>${abilities}</dd></dl></div></div>`)
  }

  if (sheet.modules.languages) {
    const languages = sheet.languages.map((language) => `<div class="box-item"><div class="name"><span>${escapeHtml(language.name)}</span></div>${language.spoken ? '<div class="speak"></div>' : ''}${language.written ? '<div class="write"></div>' : ''}</div>`).join('')
    parts.push(`<div class="module language-skill no-show" data-title="Languages"><div class="info-container"><dl class="simple-container"><dt>Linguaggi Conosciuti</dt><dd>${languages}</dd></dl></div></div>`)
  }

  if (sheet.modules.inventory) {
    const armor = sheet.armor
    parts.push(`<div class="module inventory no-show" data-title="Equipaggiamento e Oggetti"><div class="info-container"><dl class="simple-container"><dt>Equipaggiamento</dt><dd>
      <div class="inventory-panel">${sheet.inventory.map(renderInventoryItem).join('')}</div>
      <div class="armor-panel"><div class="silhouette"><div class="head"><span>${armor.head}</span></div><div class="torso"><span>${armor.torso}</span></div><div class="right-arm"><span>${armor.rightArm}</span></div><div class="left-arm"><span>${armor.leftArm}</span></div><div class="right-leg"><span>${armor.rightLeg}</span></div><div class="left-leg"><span>${armor.leftLeg}</span></div><div class="shield"><span>${armor.shield}</span></div></div></div>
    </dd></dl></div></div>`)
  }

  if (sheet.modules.biography) {
    parts.push(`<div class="module biography" title="Biografia"><div class="info-container">
      <dl class="text-area"><dt>Descrizione Fisica</dt><dd>${richText(sheet.biography.physicalDescription)}</dd></dl>
      <dl class="text-area"><dt>Storia e Psicologia</dt><dd>${richText(sheet.biography.historyAndPsychology)}</dd></dl>
    </div></div>`)
  }

  const safeEditUrl = safeUrl(editUrl)
  if (safeEditUrl) {
    parts.push(`<div class="button no-value sheet-editor-link" style="margin-top:1em"><div class="name" style="padding:0;text-align:center"><a href="${safeEditUrl}" target="_blank" rel="noreferrer" style="display:block;width:100%"><span>Modifica questa scheda</span></a></div></div>`)
  }

  parts.push('</div>')
  return parts.join('\n')
}
