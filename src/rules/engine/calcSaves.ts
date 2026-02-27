import { ABILITIES, type AbilityKey } from "./calcAbilityScores";

export interface SaveMod {
  ability: AbilityKey;
  total: number;
  proficient: boolean;
}

const SAVE_NAMES: Record<string, AbilityKey> = {
  "Força": "str",
  "Destreza": "dex",
  "Constituição": "con",
  "Inteligência": "int",
  "Sabedoria": "wis",
  "Carisma": "cha",
};

/**
 * Calculate saving throw modifiers.
 * savingThrows is the PT-BR list from the class, e.g. ["Força", "Constituição"]
 */
export function calcSaves(
  mods: Record<AbilityKey, number>,
  profBonus: number,
  savingThrows: string[]
): Record<AbilityKey, SaveMod> {
  const proficientAbilities = new Set<AbilityKey>();
  for (const st of savingThrows) {
    const key = SAVE_NAMES[st];
    if (key) proficientAbilities.add(key);
  }

  const result = {} as Record<AbilityKey, SaveMod>;
  for (const ab of ABILITIES) {
    const proficient = proficientAbilities.has(ab);
    result[ab] = {
      ability: ab,
      total: mods[ab] + (proficient ? profBonus : 0),
      proficient,
    };
  }

  return result;
}
