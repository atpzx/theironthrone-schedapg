export type ModuleKey =
  | 'header'
  | 'general'
  | 'reputation'
  | 'influence'
  | 'statistics'
  | 'talents'
  | 'abilities'
  | 'languages'
  | 'inventory'
  | 'biography'

export interface NamedValue {
  name: string
  value: number | string
  url?: string
}

export interface Statistic {
  key: string
  name: string
  baseValue: number
  value?: number
  modifier?: number
  color: string
  iconUrl?: string
  modifiers: Array<{ name: string; value: number }>
}

export interface Ability {
  name: string
  ranks: number
  isClassSkill: boolean
  access: 'common' | 'uncommon' | 'trained-only'
  category?: 'standard' | 'class' | 'restricted'
  trained?: boolean
}

export interface DescribedItem {
  name: string
  description: string
}

export interface Language {
  name: string
  spoken: boolean
  written: boolean
}

interface InventoryItemBase {
  name: string
  iconUrl?: string
  weight?: number | string
  notes?: string
}

export interface GenericInventoryItem extends InventoryItemBase {
  type: 'item'
  quantity?: number | string
}

export interface PetInventoryItem extends InventoryItemBase {
  type: 'pet'
  hitPoints?: number | string
  baseAttackBonus?: number | string
  defense?: number | string
}

export interface WeaponInventoryItem extends InventoryItemBase {
  type: 'weapon'
  damage?: number | string
}

interface ProtectiveInventoryItemBase extends InventoryItemBase {
  damageReduction?: number | string
  testPenalty?: number | string
  hardness?: number | string
  woundPoints?: number | string
}

export interface ArmorInventoryItem extends ProtectiveInventoryItemBase {
  type: 'armor'
}

export interface ShieldInventoryItem extends ProtectiveInventoryItemBase {
  type: 'shield'
  armorBonus?: number | string
}

export type InventoryItem = GenericInventoryItem | PetInventoryItem | WeaponInventoryItem | ArmorInventoryItem | ShieldInventoryItem

export interface CharacterSheet {
  version: 1
  theme: {
    name: string
    accent: string
    accentDark: string
  }
  modules: Record<ModuleKey, boolean>
  identity: {
    name: string
    regionTitle: string
    avatarUrl: string
  }
  general: {
    religion: string
    region: string
    age: number
    socialStatus: number
    experience: { level: number; current: number; nextLevel: number }
    wealth: number
    hitPoints: number
    stun: number
    classes: NamedValue[]
  }
  reputation: NamedValue[]
  influence: NamedValue[]
  statistics: Statistic[]
  talents: DescribedItem[]
  flaws: DescribedItem[]
  abilities: Ability[]
  languages: Language[]
  inventory: InventoryItem[]
  armor: {
    head: number
    torso: number
    rightArm: number
    leftArm: number
    rightLeg: number
    leftLeg: number
    shield: number
  }
  biography: {
    physicalDescription: string
    historyAndPsychology: string
  }
}