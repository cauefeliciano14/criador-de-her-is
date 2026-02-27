import type { CharacterState } from "@/state/characterStore";
import type { ArmorProperties, ShieldProperties } from "@/data/items";
import { itemsById } from "@/data/items";
import { calcAbilityMod, type AbilityKey } from "./calcAbilityScores";

export interface ACResult {
  total: number;
  base: number;
  armorName: string | null;
  shieldBonus: number;
  dexBonus: number;
  overrideUsed: string | null;
}

/**
 * Calculate AC from equipped armor/shield + ability mods + override flags.
 */
export function calcAC(
  mods: Record<AbilityKey, number>,
  equipped: CharacterState["equipped"],
  flags: Record<string, number | boolean>
): ACResult {
  const dexMod = mods.dex;

  // Base (no armor)
  let base = 10 + dexMod;
  let dexBonus = dexMod;
  let armorName: string | null = null;

  // Equipped armor
  const equippedArmor = equipped?.armor ? itemsById[equipped.armor] : null;
  if (equippedArmor && equippedArmor.type === "armor") {
    const props = equippedArmor.properties as ArmorProperties;
    dexBonus = props.dexCap !== null ? Math.min(dexMod, props.dexCap) : dexMod;
    base = props.baseAC + dexBonus;
    armorName = equippedArmor.name;
  }

  // Shield
  let shieldBonus = 0;
  const equippedShield = equipped?.shield ? itemsById[equipped.shield] : null;
  if (equippedShield && equippedShield.type === "shield") {
    shieldBonus = (equippedShield.properties as ShieldProperties).acBonus;
  }

  let total = base + shieldBonus;
  let overrideUsed: string | null = null;

  // Unarmored Defense overrides (only if no armor equipped)
  if (!equippedArmor) {
    const overrides: { name: string; ac: number }[] = [];

    // Barbarian: 10 + DEX + CON
    if (flags.unarmoredDefenseBarbarian) {
      overrides.push({
        name: "Defesa sem Armadura (Bárbaro)",
        ac: 10 + mods.dex + mods.con + shieldBonus,
      });
    }

    // Monk: 10 + DEX + WIS
    if (flags.unarmoredDefenseMonk) {
      overrides.push({
        name: "Defesa sem Armadura (Monge)",
        ac: 10 + mods.dex + mods.wis + shieldBonus,
      });
    }

    // Draconic Resilience: 13 + DEX
    if (flags.draconicResilience) {
      overrides.push({
        name: "Resiliência Dracônica",
        ac: 13 + mods.dex + shieldBonus,
      });
    }

    // Pick the best override
    if (overrides.length > 0) {
      const best = overrides.reduce((a, b) => (b.ac > a.ac ? b : a));
      if (best.ac > total) {
        total = best.ac;
        overrideUsed = best.name;
      }
    }
  }

  return { total, base, armorName, shieldBonus, dexBonus, overrideUsed };
}
