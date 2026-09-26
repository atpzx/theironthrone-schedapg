import type { InventoryItem } from './types'

export const DEFAULT_INVENTORY_ICONS: Record<InventoryItem['type'], string> = {
  item: 'https://i.imgur.com/bfqXIF9.png',
  armor: 'https://i.imgur.com/8E50q0N.png',
  shield: 'https://i.imgur.com/8E50q0N.png',
  weapon: 'https://i.imgur.com/afKjdBV.png',
  pet: 'https://i.imgur.com/pG7ZG8g.png',
}

const defaultInventoryIconUrls = new Set(Object.values(DEFAULT_INVENTORY_ICONS))

export function inventoryIconFor(type: InventoryItem['type']): string {
  return DEFAULT_INVENTORY_ICONS[type]
}

export function isDefaultInventoryIcon(iconUrl: string | undefined): boolean {
  return iconUrl ? defaultInventoryIconUrls.has(iconUrl) : false
}