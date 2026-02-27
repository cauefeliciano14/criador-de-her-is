import type { CharacterState } from "@/state/characterStore";

/**
 * Calculate HP max.
 * Level 1: hitDie + CON mod
 * Levels 2+: sum increments from leveling.hpRolls OR average (ceil(hitDie/2)+1)
 */
export function calcHP(
  hitDie: number,
  level: number,
  conMod: number,
  hpRolls: Record<number, number>
): { max: number } {
  let hpMax = hitDie + conMod; // level 1

  for (let lv = 2; lv <= level; lv++) {
    const roll = hpRolls[lv];
    const increment = roll != null ? roll : Math.ceil(hitDie / 2) + 1;
    hpMax += increment + conMod;
  }

  return { max: Math.max(1, hpMax) };
}

/**
 * Adjust current HP: if current > max, clamp to max.
 * If current was previously equal to old max (full health), set to new max.
 */
export function adjustCurrentHP(
  currentHP: number,
  oldMax: number,
  newMax: number
): number {
  if (currentHP >= oldMax) return newMax;
  return Math.min(currentHP, newMax);
}
