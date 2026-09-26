import type { Ability, AbilityAccess, AbilityDefinition } from './types'

export const ABILITY_ACCESS_LABELS: Record<AbilityAccess, string> = {
  common: 'Comune',
  uncommon: 'Non comune',
  'trained-only': 'Richiesta',
}

export const ABILITY_CATALOG: AbilityDefinition[] = ([
  {
    ability_name: 'Acrobazia',
    access: 'uncommon',
    description: 'Permette di muoversi agilmente e in maniera spettacolare, ridurre i danni da caduta e, con almeno 5 gradi, ottenere un bonus alla difesa combattendo sulla difensiva o in difesa totale.',
  },
  {
    ability_name: 'Addestrare Animali',
    access: 'uncommon',
    description: 'Serve a gestire gli animali, impartire ordini gia appresi, spingerli a compiere azioni insolite e addestrarli a nuovi compiti.',
  },
  {
    ability_name: 'Arrampicarsi',
    access: 'common',
    description: 'Permette di scalare superfici piu o meno verticali, con o senza attrezzatura, a un quarto della velocita base.',
  },
  {
    ability_name: 'Artigianato alchimia',
    access: 'trained-only',
    description: 'Serve a sintetizzare veleni, antidoti e droghe e a creare miscele come l\'altofuoco.',
  },
  {
    ability_name: 'Artigianato generale',
    access: 'trained-only',
    description: 'Permette di lavorare diversi materiali per realizzare e riparare oggetti di uso quotidiano.',
  },
  {
    ability_name: 'Artigianato Fabbro',
    access: 'trained-only',
    description: 'Serve a fondere e dare forma al ferro lavorandolo con incudine e martello.',
  },
  {
    ability_name: 'Artigianato Carpentiere',
    access: 'trained-only',
    description: 'Serve a riparare o costruire strutture di legno.',
  },
  {
    ability_name: 'Artigianato Lavori domestici',
    access: 'uncommon',
    description: 'Serve a gestire e mandare avanti una casa.',
  },
  {
    ability_name: 'Artigianato Arco e Frecce',
    access: 'uncommon',
    description: 'Serve a riparare e realizzare armi da lancio.',
  },
  {
    ability_name: 'Artista della fuga',
    access: 'common',
    description: 'Serve a liberarsi da corde e impedimenti fisici, infilarsi in spazi angusti o tentare di scappare passando attraverso le gambe di un avversario.',
  },
  {
    ability_name: 'Ascoltare',
    access: 'common',
    description: 'Permette di captare i rumori. Si oppone a Muoversi Silenziosamente.',
  },
  {
    ability_name: 'Bluff',
    access: 'uncommon',
    description: 'Serve a far sembrare vero il falso. Si contrappone a Percepire Intenzioni e puo essere usato per fintare, creare diversivi o trasmettere messaggi segreti.',
  },
  {
    ability_name: 'Camuffarsi',
    access: 'uncommon',
    description: 'Serve a modificare il proprio aspetto o comportamento per non essere riconosciuti o sembrare un\'altra persona. Si contrappone a Osservare.',
  },
  {
    ability_name: 'Cavalcare',
    access: 'common',
    description: 'Permette di cavalcare e compiere manovre pericolose, combattere in sella, attutire cadute, saltare ostacoli, spronare o controllare la cavalcatura.',
  },
  {
    ability_name: 'Cercare',
    access: 'common',
    description: 'Permette di individuare oggetti nascosti, comprese le trappole.',
  },
  {
    ability_name: 'Conoscenza Amministrazione',
    access: 'trained-only',
    description: 'Indica la capacita di organizzare efficientemente e governare feudi, attivita e organizzazioni.',
  },
  {
    ability_name: 'Conoscenza Arcana',
    access: 'trained-only',
    description: 'Indica la conoscenza della magia, della sua storia, delle leggende e delle filosofie dei popoli.',
  },
  {
    ability_name: 'Conoscenza Architettura',
    access: 'trained-only',
    description: 'Indica la conoscenza dei metodi di costruzione, progettazione e ingegneria e puo aiutare negli assedi o nella distruzione di strutture.',
  },
  {
    ability_name: 'Conoscenza Bassifondi',
    access: 'trained-only',
    description: 'Indica la capacita di muoversi nei vicoli di una citta, trovare un posto sicuro e conoscere il comportamento e le regole della strada.',
  },
  {
    ability_name: 'Conoscenza Culture straniere',
    access: 'trained-only',
    description: 'Indica la conoscenza di uno specifico popolo. Puo essere acquisita piu volte per conoscere altre regioni e culture.',
  },
  {
    ability_name: 'Conoscenza Guerra',
    access: 'trained-only',
    description: 'Indica la capacita di organizzare armate, addestrare soldati e chiamare alle armi la popolazione; influenza anche il combattimento tra armate.',
  },
  {
    ability_name: 'Conoscenza Leggende',
    access: 'trained-only',
    description: 'Indica la conoscenza del folklore delle varie regioni e dei vari popoli.',
  },
  {
    ability_name: 'Conoscenza Locali',
    access: 'uncommon',
    description: 'Indica la conoscenza della geografia e dei popoli di una singola regione. Puo essere selezionata piu volte.',
  },
  {
    ability_name: 'Conoscenza Natura',
    access: 'trained-only',
    description: 'Indica la conoscenza del mondo naturale attraverso gli studi accademici.',
  },
  {
    ability_name: 'Conoscenza Nobiltà',
    access: 'trained-only',
    description: 'Indica la conoscenza della nobilta, dei protocolli, del potere delle casate e della loro influenza.',
  },
  {
    ability_name: 'Conoscenza Orientamento',
    access: 'trained-only',
    description: 'Indica la capacita di leggere mappe e usare strumenti di navigazione, stelle e punti di riferimento per orientarsi.',
  },
  {
    ability_name: 'Conoscenza Religioni',
    access: 'trained-only',
    description: 'Indica la conoscenza delle varie religioni e dei rituali a esse legati.',
  },
  {
    ability_name: 'Conoscenza Storia',
    access: 'trained-only',
    description: 'Indica la conoscenza della storia.',
  },
  {
    ability_name: 'Decifrare Scritture',
    access: 'trained-only',
    description: 'Serve a interpretare scritti in lingue straniere, decifrare messaggi in codice, risolvere puzzle e leggere mappe straniere.',
  },
  {
    ability_name: 'Diplomazia',
    access: 'uncommon',
    description: 'Serve ad affrontare interazioni sociali e negoziati e a persuadere qualcuno. Puo richiedere tempo per fare effetto.',
  },
  {
    ability_name: 'Disattivare Congegni',
    access: 'trained-only',
    description: 'Serve a rendere inefficaci trappole, bloccare serrature, sabotare meccanismi, risolvere enigmi meccanici e riparare oggetti meccanici.',
  },
  {
    ability_name: 'Equilibrio',
    access: 'common',
    description: 'Serve a valutare terreni avversi. Con almeno 5 gradi il personaggio non e colto di sorpresa a causa di una posizione precaria.',
  },
  {
    ability_name: 'Falsificare',
    access: 'uncommon',
    description: 'Serve a contraffare scritti, documenti di identita e registri.',
  },
  {
    ability_name: 'Guarire',
    access: 'trained-only',
    description: 'Serve a trattare ferite o altre debilitazioni. Il primo soccorso riguarda le cure sul campo senza gli strumenti di un maestro.',
  },
  {
    ability_name: 'Intimidire',
    access: 'common',
    description: 'Serve a cambiare l\'atteggiamento degli altri. In combattimento puo demoralizzare un avversario e renderlo scosso per un turno.',
  },
  {
    ability_name: 'Intrattenere',
    access: 'uncommon',
    description: 'Permette di intrattenere un pubblico e suscitare reazioni emotive. Si sceglie un ramo artistico e puo essere acquisita piu volte.',
  },
  {
    ability_name: 'Muoversi Silenziosamente',
    access: 'common',
    description: 'Permette di muoversi senza fare rumore. Per evitare penalita bisogna muoversi a meta della velocita base. Si oppone ad Ascoltare.',
  },
  {
    ability_name: 'Nascondersi',
    access: 'uncommon',
    description: 'Serve a nascondere alla vista se stessi o oggetti. Muoversi mentre ci si nasconde puo comportare penalita. Si contrappone a Osservare.',
  },
  {
    ability_name: 'Nuoto',
    access: 'common',
    description: 'Indica la capacita di muoversi in acqua.',
  },
  {
    ability_name: 'Osservare',
    access: 'common',
    description: 'Permette di individuare oggetti e individui. Di solito si contrappone ai tiri per nascondersi e camuffarsi.',
  },
  {
    ability_name: 'Parlare linguaggi',
    access: 'trained-only',
    description: 'Permette di parlare lingue diverse da quella nativa. Ogni grado equivale a una lingua e non insegna a scriverla.',
  },
  {
    ability_name: 'Percepire Intenzioni',
    access: 'common',
    description: 'Permette di capire se qualcuno e disonesto o cerca di celare le proprie emozioni. Si contrappone a Bluff.',
  },
  {
    ability_name: 'Professione',
    access: 'trained-only',
    description: 'Permette di svolgere le mansioni di una professione specifica. Puo essere acquisita piu volte per coprire professioni diverse.',
  },
  {
    ability_name: 'Raccogliere informazioni',
    access: 'common',
    description: 'Serve a raccogliere indizi e informazioni parlando con le persone.',
  },
  {
    ability_name: 'Rapidità di mano',
    access: 'uncommon',
    description: 'Permette di far sparire piccoli oggetti senza dare nell\'occhio. Si contrappone a Osservare.',
  },
  {
    ability_name: 'Saltare',
    access: 'common',
    description: 'Serve a compiere balzi.',
  },
  {
    ability_name: 'Scassinare',
    access: 'trained-only',
    description: 'Permette di scassinare serrature senza la chiave. Agire senza arnesi da scasso comporta una penalita.',
  },
  {
    ability_name: 'Sopravvivenza',
    access: 'uncommon',
    description: 'Permette di procurarsi cibo e acqua, resistere ai climi avversi, prevedere il tempo e seguire tracce in ambiente naturale.',
  },
  {
    ability_name: 'Usare corde',
    access: 'common',
    description: 'Permette di usare corde per vari scopi. Se usata per legare qualcuno, si oppone ad Artista della fuga.',
  },
  {
    ability_name: 'Valutare',
    access: 'uncommon',
    description: 'Serve a stabilire il valore degli oggetti e a determinare se siano comuni, esotici o di valore storico.',
  },
] satisfies AbilityDefinition[]).sort((left, right) => left.ability_name.localeCompare(right.ability_name, 'it'))

const definitionByName = new Map(ABILITY_CATALOG.map((definition) => [definition.ability_name, definition]))

export function abilityDefinition(name: string): AbilityDefinition | undefined {
  return definitionByName.get(name)
}

export function createCatalogAbility(definition: AbilityDefinition): Ability {
  return {
    name: definition.ability_name,
    ranks: 0,
    isClassSkill: false,
    access: definition.access,
    specializations: [],
  }
}

export function isConfiguredAbility(ability: Ability): boolean {
  return ability.custom === true
    || Number(ability.ranks) !== 0
    || ability.isClassSkill
    || ability.specializations.length > 0
}

export function resolveAbilities(storedAbilities: Ability[]): Ability[] {
  const catalogOverrides = new Map(
    storedAbilities
      .filter((ability) => ability.custom !== true && definitionByName.has(ability.name))
      .map((ability) => [ability.name, ability]),
  )
  const catalogAbilities = ABILITY_CATALOG.map((definition) => {
    const override = catalogOverrides.get(definition.ability_name)
    return override
      ? { ...override, access: definition.access, custom: undefined }
      : createCatalogAbility(definition)
  })
  const customAbilities = storedAbilities
    .filter((ability) => ability.custom === true || !definitionByName.has(ability.name))
    .map((ability) => ({ ...ability, custom: true as const }))

  return [...catalogAbilities, ...customAbilities]
}

export function storeAbility(storedAbilities: Ability[], ability: Ability, previousName = ability.name): Ability[] {
  if (ability.custom === true) {
    const index = storedAbilities.findIndex((stored) =>
      (stored.custom === true || !definitionByName.has(stored.name)) && stored.name === previousName,
    )
    if (index < 0) return [...storedAbilities, ability]
    return storedAbilities.map((stored, storedIndex) => storedIndex === index ? ability : stored)
  }

  const definition = definitionByName.get(ability.name)
  if (!definition) return [...storedAbilities, { ...ability, custom: true }]
  const withoutCurrent = storedAbilities.filter((stored) => stored.custom === true || stored.name !== ability.name)
  if (!isConfiguredAbility(ability)) return withoutCurrent
  return [...withoutCurrent, { ...ability, access: definition.access, custom: undefined }]
}