import type { AbilityKey } from "./calcAbilityScores";

export interface SpellStats {
  spellSaveDC: number;
  spellAttackBonus: number;
}

/**
 * Calculate spell save DC and spell attack bonus.
 */
export function calcSpellStats(
  spellcastingAbility: string | null,
  mods: Record<AbilityKey, number>,
  profBonus: number
): SpellStats {
  if (!spellcastingAbility) {
    return { spellSaveDC: 0, spellAttackBonus: 0 };
  }

  const abilityKey = mapAbilityName(spellcastingAbility);
  const abilityMod = abilityKey ? mods[abilityKey] : 0;

  return {
    spellSaveDC: 8 + profBonus + abilityMod,
    spellAttackBonus: profBonus + abilityMod,
  };
}

function mapAbilityName(name: string): AbilityKey | null {
  const map: Record<string, AbilityKey> = {
    "Inteligência": "int",
    "Sabedoria": "wis",
    "Carisma": "cha",
    "int": "int",
    "wis": "wis",
    "cha": "cha",
  };
  return map[name] ?? null;
}
