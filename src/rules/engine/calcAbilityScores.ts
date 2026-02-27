import type { CharacterState } from "@/state/characterStore";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface AbilityBreakdown {
  base: Record<AbilityKey, number>;
  bonuses: {
    race: Record<AbilityKey, number>;
    background: Record<AbilityKey, number>;
    asi: Record<AbilityKey, number>;
    feats: Record<AbilityKey, number>;
  };
  total: Record<AbilityKey, number>;
  mods: Record<AbilityKey, number>;
}

export function calcAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function calcFinalAbilityScores(char: CharacterState): AbilityBreakdown {
  const base = { ...char.abilityScores };
  const bonuses = {
    race: { ...char.racialBonuses },
    background: { ...(char.backgroundBonuses ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) },
    asi: { ...(char.asiBonuses ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) },
    feats: { ...(char.featAbilityBonuses ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) },
  };

  const total = {} as Record<AbilityKey, number>;
  const mods = {} as Record<AbilityKey, number>;

  for (const key of ABILITIES) {
    total[key] = Math.min(
      20,
      base[key] + bonuses.race[key] + bonuses.background[key] + bonuses.asi[key] + bonuses.feats[key]
    );
    mods[key] = calcAbilityMod(total[key]);
  }

  return { base, bonuses, total, mods };
}
