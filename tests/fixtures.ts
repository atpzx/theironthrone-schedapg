import { defaultSheet } from '../src/lib/defaultSheet'
import type { CharacterSheet } from '../src/lib/types'

export function sampleSheet(name = 'Personaggio di prova'): CharacterSheet {
  const sheet = structuredClone(defaultSheet)
  sheet.identity.name = name
  sheet.biography.physicalDescription = 'Descrizione fittizia per i test: è un’esploratrice immaginaria. 🐉 日本語 <b>& "\'\n\nSecondo paragrafo.'
  sheet.biography.historyAndPsychology = 'Questo personaggio esiste soltanto per i test automatici.\n\nUn ricordo inventato, con accenti: à è ì ò ù.'
  return sheet
}

export function longSheet(): CharacterSheet {
  const sheet = sampleSheet('Scheda lunga 🐉')
  let seed = 124213
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed.toString(36) }
  sheet.biography.historyAndPsychology = Array.from({ length: 8_000 }, (_, i) => `${i}: ${random()} ${random()} ${random()} È l’avventura 🐉 & < > " '`).join('\n')
  return sheet
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
