/**
 * Test fixtures: minimal character states for testing.
 */
import type { CharacterState } from "@/state/characterStore";
import type { AbilityKey } from "@/utils/calculations";

const BASE_SCORES: Record<AbilityKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const ZERO_BONUSES: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
const ZERO_MODS: Record<AbilityKey, number> = { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 };

function makeCharacter(overrides: Partial<CharacterState> = {}): CharacterState {
  return {
    name: "", level: 1, race: null, subrace: null, class: null, subclass: null, background: null,
    abilityGeneration: {
      method: null, rolls: null, rollResults: null, pointBuyRemaining: 27,
      standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
      confirmed: false,
    },
    abilityScores: { ...BASE_SCORES },
    racialBonuses: { ...ZERO_BONUSES },
    raceAbilityChoices: {},
    raceChoices: {},
    backgroundBonuses: { ...ZERO_BONUSES },
    backgroundAbilityChoices: {},
    asiBonuses: { ...ZERO_BONUSES },
    abilityMods: { ...ZERO_MODS },
    proficiencyBonus: 2,
    savingThrows: [], skills: [], classSkillChoices: [], classEquipmentChoice: null, backgroundEquipmentChoice: null,
    proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
    hitDie: 8, hitPoints: { max: 8, current: 8 }, armorClass: 10, speed: 9,
    features: [],
    spells: { cantrips: [], prepared: [], slots: [], spellcastingAbility: null, spellSaveDC: 0, spellAttackBonus: 0 },
    equipment: [], inventory: [],
    equipped: { armor: null, shield: null, weapons: [] },
    gold: { gp: 0 }, attacks: [],
    appliedFeats: [],
    featAbilityBonuses: { ...ZERO_BONUSES },
    flags: {}, classFeatureChoices: {},
    choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
    expertiseSkills: [],
    skillMods: {},
    saveMods: {} as any, warnings: [],
    leveling: {
      pending: false, fromLevel: 1, toLevel: 1, hpMethod: null, hpRolls: {},
      choices: { subclassId: null, asiOrFeat: {} }, changesSummary: [],
    },
    ...overrides,
  };
}

/** Level 1 Fighter (Human): STR 15, DEX 14, CON 13, INT 12, WIS 10, CHA 8 */
export const FIGHTER_HUMAN_L1 = makeCharacter({
  name: "Kael",
  level: 1,
  race: "humano",
  class: "guerreiro",
  background: "soldado",
  abilityGeneration: {
    method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
    standardAssignments: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    confirmed: true,
  },
  abilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  racialBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  hitDie: 10,
  savingThrows: ["Força", "Constituição"],
  proficiencies: {
    armor: ["Armaduras Leves", "Armaduras Médias", "Armaduras Pesadas", "Escudos"],
    weapons: ["Armas Simples", "Armas Marciais"],
    tools: [],
    languages: ["Comum"],
  },
  classSkillChoices: ["Atletismo", "Intimidação"],
  skills: ["Atletismo", "Intimidação"],
  classEquipmentChoice: "A", backgroundEquipmentChoice: null,
  equipped: { armor: "cotaDeMalhaFull", shield: null, weapons: ["espadaLonga"] },
  inventory: [
    { itemId: "cotaDeMalhaFull", quantity: 1, equipped: true, notes: "" },
    { itemId: "espadaLonga", quantity: 1, equipped: true, notes: "" },
  ],
  speed: 9,
});

/** Level 1 Wizard (Elf): INT 15, DEX 14, CON 13 */
export const WIZARD_ELF_L1 = makeCharacter({
  name: "Aelindra",
  level: 1,
  race: "elfo",
  subrace: null,
  class: "mago",
  background: "sabio",
  abilityGeneration: {
    method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
    standardAssignments: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    confirmed: true,
  },
  abilityScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
  racialBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  hitDie: 6,
  savingThrows: ["Inteligência", "Sabedoria"],
  spells: {
    cantrips: ["rajada-de-fogo", "luz", "mao-arcana"],
    prepared: ["misseis-magicos", "escudo-arcano", "detectar-magia"],
    slots: [2],
    spellcastingAbility: "Inteligência",
    spellSaveDC: 0,
    spellAttackBonus: 0,
  },
  proficiencies: {
    armor: [],
    weapons: ["Adaga", "Dardo", "Bordão"],
    tools: [],
    languages: ["Comum", "Élfico"],
  },
  classSkillChoices: ["Arcanismo", "Investigação"],
  skills: ["Arcanismo", "Investigação"],
  classEquipmentChoice: "A", backgroundEquipmentChoice: null,
  speed: 9,
});

/** Level 2 Wizard (Elf): INT 15+1=16, DEX 14+2=16, CON 13 */
export const WIZARD_ELF_L2 = makeCharacter({
  name: "Aelindra",
  level: 2,
  race: "elfo",
  subrace: null,
  class: "mago",
  background: "sabio",
  abilityGeneration: {
    method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
    standardAssignments: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
    rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    confirmed: true,
  },
  abilityScores: { str: 8, dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
  racialBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  hitDie: 6,
  savingThrows: ["Inteligência", "Sabedoria"],
  spells: {
    cantrips: ["rajada-de-fogo", "luz", "mao-arcana"],
    prepared: ["misseis-magicos", "escudo-arcano", "detectar-magia", "graxa"],
    slots: [3],
    spellcastingAbility: "Inteligência",
    spellSaveDC: 0,
    spellAttackBonus: 0,
  },
  proficiencies: {
    armor: [],
    weapons: ["Adaga", "Dardo", "Bordão"],
    tools: [],
    languages: ["Comum", "Élfico"],
  },
  classSkillChoices: ["Arcanismo", "Investigação"],
  skills: ["Arcanismo", "Investigação"],
  classEquipmentChoice: "A", backgroundEquipmentChoice: null,
  speed: 9,
});

/** Level 1 Barbarian (Human) for unarmored defense tests */
export const BARBARIAN_HUMAN_L1 = makeCharacter({
  name: "Throg",
  level: 1,
  race: "humano",
  class: "barbaro",
  background: "soldado",
  abilityGeneration: {
    method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
    standardAssignments: { str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 },
    rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    confirmed: true,
  },
  abilityScores: { str: 15, dex: 14, con: 13, int: 8, wis: 10, cha: 12 },
  racialBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  hitDie: 12,
  savingThrows: ["Força", "Constituição"],
  proficiencies: {
    armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
    weapons: ["Armas Simples", "Armas Marciais"],
    tools: [],
    languages: ["Comum"],
  },
  flags: { unarmoredDefenseBarbarian: true },
  equipped: { armor: null, shield: null, weapons: ["machadao"] },
  inventory: [
    { itemId: "machadao", quantity: 1, equipped: true, notes: "" },
  ],
  classSkillChoices: ["Atletismo", "Intimidação"],
  skills: ["Atletismo", "Intimidação"],
  classEquipmentChoice: "A", backgroundEquipmentChoice: null,
  speed: 9,
});

/** Minimal incomplete character for validation tests */
export const INCOMPLETE_CHAR = makeCharacter({
  name: "",
  level: 1,
});

/** Character with all base fields but missing subrace */
export const MISSING_SUBRACE = makeCharacter({
  name: "Test",
  level: 1,
  race: "anao", // has no subraces or raceChoice
  class: "guerreiro",
  background: "soldado",
  abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
    standardAssignments: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
    confirmed: true },
  abilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
  subrace: null, // deliberately missing (but anao has no subraces)
});

export { makeCharacter };
