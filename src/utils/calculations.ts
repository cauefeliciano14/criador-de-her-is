import type { CharacterState } from "@/state/characterStore";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Força",
  dex: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  wis: "Sabedoria",
  cha: "Carisma",
};

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: "FOR",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
export const POINT_BUY_TOTAL = 27;

export const ALL_SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: "Acrobacia", ability: "dex" },
  { name: "Adestrar Animais", ability: "wis" },
  { name: "Arcanismo", ability: "int" },
  { name: "Atletismo", ability: "str" },
  { name: "Atuação", ability: "cha" },
  { name: "Enganação", ability: "cha" },
  { name: "Furtividade", ability: "dex" },
  { name: "História", ability: "int" },
  { name: "Intimidação", ability: "cha" },
  { name: "Intuição", ability: "wis" },
  { name: "Investigação", ability: "int" },
  { name: "Medicina", ability: "wis" },
  { name: "Natureza", ability: "int" },
  { name: "Percepção", ability: "wis" },
  { name: "Persuasão", ability: "cha" },
  { name: "Prestidigitação", ability: "dex" },
  { name: "Religião", ability: "int" },
  { name: "Sobrevivência", ability: "wis" },
];

export function calcAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calcProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/** Get final scores = base + racial bonuses + background bonuses */
export function getFinalAbilityScores(
  baseScores: Record<AbilityKey, number>,
  racialBonuses: Record<AbilityKey, number>,
  backgroundBonuses?: Record<AbilityKey, number>
): Record<AbilityKey, number> {
  const result = {} as Record<AbilityKey, number>;
  for (const key of ABILITIES) {
    result[key] = baseScores[key] + (racialBonuses[key] ?? 0) + (backgroundBonuses?.[key] ?? 0);
  }
  return result;
}

export function recalcDerivedStats(
  char: CharacterState
): Partial<CharacterState> {
  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses);
  
  const mods: Record<AbilityKey, number> = {
    str: calcAbilityMod(finalScores.str),
    dex: calcAbilityMod(finalScores.dex),
    con: calcAbilityMod(finalScores.con),
    int: calcAbilityMod(finalScores.int),
    wis: calcAbilityMod(finalScores.wis),
    cha: calcAbilityMod(finalScores.cha),
  };

  const profBonus = calcProficiencyBonus(char.level);
  const hitDie = char.hitDie || 8;
  const hpMax = hitDie + mods.con + (char.level - 1) * (Math.ceil(hitDie / 2) + 1 + mods.con);

  const spellAbility = char.spells.spellcastingAbility as AbilityKey | null;
  const spellMod = spellAbility ? mods[spellAbility] ?? 0 : 0;

  return {
    abilityMods: mods,
    proficiencyBonus: profBonus,
    hitPoints: { max: Math.max(1, hpMax), current: Math.max(1, hpMax) },
    armorClass: 10 + mods.dex,
    spells: {
      ...char.spells,
      spellSaveDC: spellAbility ? 8 + profBonus + spellMod : 0,
      spellAttackBonus: spellAbility ? profBonus + spellMod : 0,
    },
  };
}

/** Roll 4d6, drop lowest, return { dice: number[4], total: number } */
export function roll4d6DropLowest(): { dice: number[]; total: number } {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const sorted = [...dice].sort((a, b) => b - a);
  const total = sorted[0] + sorted[1] + sorted[2];
  return { dice: sorted, total };
}

/** Roll a full set of 6 ability scores */
export function rollFullSet(): { allDice: number[][]; totals: number[] } {
  const results = Array.from({ length: 6 }, () => roll4d6DropLowest());
  return {
    allDice: results.map((r) => r.dice),
    totals: results.map((r) => r.total),
  };
}
