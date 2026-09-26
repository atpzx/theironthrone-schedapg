import type { CharacterSheet } from './types'

export const defaultSheet: CharacterSheet = {
  version: 1,
  theme: {
    name: 'Tema standard',
    accent: '#b68a3a',
    accentDark: '#58301f',
  },
  modules: {
    header: true,
    general: true,
    reputation: true,
    influence: true,
    statistics: true,
    talents: true,
    abilities: true,
    languages: true,
    inventory: true,
    biography: true,
  },
  identity: {
    name: 'Nome del Personaggio',
    regionTitle: 'Nord',
    avatarUrl: 'https://placehold.co/500x500/58301F/F0DAC5?text=Avatar',
  },
  general: {
    religion: 'Religione del personaggio',
    region: 'Nord',
    age: 18,
    socialStatusAtCreation: 1,
    socialStatus: 1,
    experience: { level: 1, current: 0, nextLevel: 1000 },
    wealth: 1,
    hitPoints: 10,
    stun: 4,
    classes: [
      { name: 'Classe di esempio', value: 1, url: '' },
    ],
  },
  reputation: [
    { name: 'Reputazione di esempio', value: 0 },
    { name: 'Punti Bonus', value: 0 },
  ],
  influence: [
    { name: 'Punti Influenza da spendere', value: 0 },
    { name: 'Affinità di esempio', value: 0 },
  ],
  statistics: [
    { key: 'strength', name: 'Forza', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/fp5BM9F.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
    { key: 'intelligence', name: 'Intelligenza', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/dtl1KhW.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
    { key: 'dexterity', name: 'Destrezza', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/quNQYlD.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
    { key: 'wisdom', name: 'Saggezza', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/lCEIrHf.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
    { key: 'constitution', name: 'Costituzione', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/HyilJR1.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
    { key: 'charisma', name: 'Carisma', baseValue: 8, color: '#58301f', iconUrl: 'https://i.imgur.com/Zc6bMqm.png', modifierBuckets: { ME: 0, ML: 0, MT: 0, MV: 0, PB: 0, PC: 0 }, modifiers: [] },
  ],
  talents: [
    { name: 'Talento di esempio', description: 'Sostituisci questo testo con la descrizione completa del talento scelto.' },
  ],
  flaws: [
    { name: 'Difetto di esempio', description: 'Sostituisci questo testo con la descrizione completa del difetto scelto, oppure elimina la voce.' },
  ],
  abilities: [],
  languages: [
    { name: 'Lingua madre', spoken: true, written: false },
  ],
  inventory: [
    { type: 'item', name: 'Oggetto di esempio', iconUrl: 'https://i.imgur.com/bfqXIF9.png', weight: 1, quantity: 1, notes: 'Sostituisci o elimina questa voce.' },
  ],
  armor: { head: 0, torso: 0, rightArm: 0, leftArm: 0, rightLeg: 0, leftLeg: 0, shield: 0 },
  biography: {
    physicalDescription: 'Inserisci qui aspetto, altezza, corporatura, abbigliamento e segni particolari del personaggio.',
    historyAndPsychology: 'Inserisci qui la storia, le motivazioni, il carattere e gli eventi importanti del personaggio.',
  },
}