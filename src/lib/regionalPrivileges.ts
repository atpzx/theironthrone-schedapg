import type { DescribedItem } from './types'

export interface RegionalClassSkill {
  abilityName: string
  label: string
  specializationOptions?: string[]
}

export interface RegionalPrivilegeDefinition {
  region: string
  classSkill: RegionalClassSkill
  bonuses: string[]
  talentChoices: string[]
  restrictions: DescribedItem[]
}

export const REGIONAL_PRIVILEGES: RegionalPrivilegeDefinition[] = [
  {
    region: 'Altopiano',
    classSkill: { abilityName: 'Cavalcare', label: 'Cavalcare' },
    bonuses: ['+2 ai check di Conoscenza Nobiltà e Conoscenza Guerra', '+2 ai tiri salvezza quando si è in sella'],
    talentChoices: ['Devoto', 'Finanza', 'Lingua d’argento', 'Perspicace', 'Robusta Costituzione', 'Sangue degli Andali'],
    restrictions: [],
  },
  {
    region: 'Baia degli Schiavisti',
    classSkill: { abilityName: 'Professione', label: 'Professione', specializationOptions: ['Schiavista', 'Schiavo'] },
    bonuses: ['+2 ai check di Diplomazia e Intimidire', '+1 ai tiri salvezza su Volontà'],
    talentChoices: ['Finanza', 'Lingua d’argento', 'Schiavo'],
    restrictions: [],
  },
  {
    region: 'Città Libere',
    classSkill: { abilityName: 'Bluff', label: 'Bluff' },
    bonuses: ['+2 ai check di Diplomazia e Conoscenza Culture straniere', '+1 ai tiri salvezza su Volontà'],
    talentChoices: ['Finanza', 'Lingua d’argento', 'Perspicace', 'Sangue degli Andali', 'Sangue del Drago', 'Sangue della Rhoyne', 'Nato Dothraki'],
    restrictions: [{ name: 'Retaggio limitato', description: 'È possibile selezionare un solo talento di sangue, coerente con la città di origine e il background e approvato dallo staff.' }],
  },
  {
    region: 'Dorne',
    classSkill: { abilityName: 'Sopravvivenza', label: 'Sopravvivenza' },
    bonuses: ['+2 ai check di Cavalcare', '+1 ai tiri per colpire portati in sella', '+2 ai tiri salvezza su Tempra'],
    talentChoices: ['Finanza', 'Robusta Costituzione', 'Sangue dei Rhoyne', 'Tenace'],
    restrictions: [],
  },
  {
    region: 'Dothraki',
    classSkill: { abilityName: 'Cavalcare', label: 'Cavalcare' },
    bonuses: ['+1 ai check di Addestrare Animali inerenti ai cavalli', '+1 ai tiri per colpire portati in sella', '+1 ai tiri salvezza su Riflessi'],
    talentChoices: ['Nato Dothraki', 'Tenace'],
    restrictions: [
      { name: 'Nessuna competenza difensiva', description: 'Al primo livello il personaggio non ha competenze nelle armature o negli scudi e non può avere gradi in Nuoto.' },
      { name: 'Analfabetismo', description: 'Il personaggio è analfabeta finché non acquisisce l’apposito talento.' },
    ],
  },
  {
    region: 'Isole di Ferro',
    classSkill: { abilityName: 'Nuoto', label: 'Nuoto' },
    bonuses: ['+2 ai check di Intimidire e Professione (Marinaio)', 'I personaggi ignorano i bonus di reputazione usati dagli stranieri'],
    talentChoices: ['Artigiano', 'Robusta Costituzione', 'Sangue Ironborn', 'Tenace'],
    restrictions: [{ name: 'Nessuna esperienza equestre', description: 'Al primo livello il personaggio non può avere gradi in Cavalcare.' }],
  },
  {
    region: 'Nord',
    classSkill: { abilityName: 'Sopravvivenza', label: 'Sopravvivenza' },
    bonuses: ['+2 ai check di Addestrare Animali e Intimidire', '+2 ai tiri salvezza su Tempra contro il freddo'],
    talentChoices: ['Animo Nobile', 'Artigiano', 'Sangue dei Primi uomini', 'Sangue di gigante', 'Sogni'],
    restrictions: [],
  },
  {
    region: 'Qarth',
    classSkill: { abilityName: 'Professione', label: 'Professione (Mercante)' },
    bonuses: ['+2 ai check di Bluff e Diplomazia', '+1 ai check di Saggezza per l’utilizzo della magia'],
    talentChoices: ['Artigiano', 'Finanza', 'Lingua d’argento', 'Sangue dei Qaathi'],
    restrictions: [],
  },
  {
    region: 'Terre della Corona',
    classSkill: { abilityName: 'Conoscenza Bassifondi', label: 'Conoscenza Bassifondi' },
    bonuses: ['+2 ai check di Percepire Intenzioni', '+2 ai tiri salvezza su Tempra contro le malattie'],
    talentChoices: ['Finanza', 'Lingua d’argento', 'Sangue degli Andali'],
    restrictions: [],
  },
  {
    region: 'Terre dei Fiumi',
    classSkill: { abilityName: 'Nuoto', label: 'Nuoto' },
    bonuses: ['+2 ai check di Artigianato (qualsiasi) e Professione (Marinaio)', '+2 ai tiri salvezza su Tempra contro i danni dell’acqua e l’annegamento'],
    talentChoices: ['Artigiano', 'Devoto', 'Finanza', 'Lingua d’argento', 'Perspicace', 'Sangue degli Andali', 'Tenace'],
    restrictions: [],
  },
  {
    region: "Terre dell'Ovest",
    classSkill: { abilityName: 'Professione', label: 'Professione (qualsiasi)' },
    bonuses: ['+2 ai check di Diplomazia e Valutare', '+4 ai check di Bluff o Percepire Intenzioni relativi alle transazioni monetarie'],
    talentChoices: ['Devoto', 'Finanza', 'Lingua d’argento', 'Sangue degli Andali', 'Sangue di Gigante'],
    restrictions: [],
  },
  {
    region: 'Terre della Tempesta',
    classSkill: { abilityName: 'Conoscenza Guerra', label: 'Conoscenza Guerra' },
    bonuses: ['+2 ai check di Percepire Intenzioni', '+1 ai check di Ascoltare e Osservare relativi alle imboscate', '+1 ai tiri salvezza su Tempra, con un ulteriore +1 per gli sforzi prolungati'],
    talentChoices: ['Animo Nobile', 'Devoto', 'Sangue degli Andali', 'Sangue di gigante', 'Tenace'],
    restrictions: [],
  },
  {
    region: 'Terre Selvagge',
    classSkill: { abilityName: 'Sopravvivenza', label: 'Sopravvivenza' },
    bonuses: ['+2 ai check di Sopravvivenza e Arrampicarsi', '+2 ai tiri salvezza su Tempra contro il freddo'],
    talentChoices: ['Sangue dei Primi uomini', 'Sangue di gigante', 'Sogni'],
    restrictions: [
      { name: 'Conoscenze limitate', description: 'Il personaggio non può iniziare con Conoscenza Nobiltà o Conoscenza Storia.' },
      { name: 'Analfabetismo', description: 'Il personaggio è analfabeta nella lingua comune, ma utilizza un rudimentale alfabeto runico.' },
    ],
  },
  {
    region: 'Valle di Arryn',
    classSkill: { abilityName: 'Arrampicarsi', label: 'Arrampicarsi' },
    bonuses: ['+2 ai check di Diplomazia ed Equilibrio', '+2 ai tiri salvezza su Riflessi e ai check di Arrampicarsi, Equilibrio e Sopravvivenza in ambiente montano'],
    talentChoices: ['Animo Nobile', 'Devoto', 'Finanza', 'Lingua d’argento', 'Sangue degli Andali', 'Sangue di gigante'],
    restrictions: [],
  },
  {
    region: "Isole dell'Estate",
    classSkill: { abilityName: 'Nuoto', label: 'Nuoto' },
    bonuses: ['+2 ai check di Professione (Marinaio)', '+1 ai tiri per colpire con archi', '+1 ai check di Ascoltare e Osservare'],
    talentChoices: ['Artigiano', 'Lingua d’Argento', 'Robusta Costituzione', 'Sangue dell’Estate'],
    restrictions: [],
  },
  {
    region: 'Yi Ti',
    classSkill: { abilityName: 'Professione', label: 'Professione (Mercante)' },
    bonuses: ['+2 ai check di Diplomazia e Conoscenza Culture straniere', '+4 ai check di Diplomazia e Valutare relativi alle transazioni commerciali'],
    talentChoices: ['Devoto', 'Finanza', 'Perspicace', 'Sangue dell’Alba'],
    restrictions: [],
  },
]

const privilegeByRegion = new Map(REGIONAL_PRIVILEGES.map((privilege) => [privilege.region, privilege]))

export function regionalPrivilegeFor(region: string): RegionalPrivilegeDefinition | undefined {
  return privilegeByRegion.get(region)
}

export function regionalClassSkillLabel(privilege: RegionalPrivilegeDefinition, specialization: string): string {
  return privilege.classSkill.specializationOptions?.includes(specialization)
    ? `${privilege.classSkill.label} (${specialization})`
    : privilege.classSkill.label
}

export function isRegionalClassSkill(region: string, abilityName: string): boolean {
  return regionalPrivilegeFor(region)?.classSkill.abilityName === abilityName
}