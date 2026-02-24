import type { CharacterState } from "@/state/characterStore";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Força",
  dex: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  wis: "Sabedoria",
  cha: "Carisma",
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

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

export function recalcDerivedStats(
  char: CharacterState
): Partial<CharacterState> {
  const mods: Record<AbilityKey, number> = {
    str: calcAbilityMod(char.abilityScores.str),
    dex: calcAbilityMod(char.abilityScores.dex),
    con: calcAbilityMod(char.abilityScores.con),
    int: calcAbilityMod(char.abilityScores.int),
    wis: calcAbilityMod(char.abilityScores.wis),
    cha: calcAbilityMod(char.abilityScores.cha),
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
