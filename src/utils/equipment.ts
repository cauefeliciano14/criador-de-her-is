import type { CharacterState } from "@/state/characterStore";
import type { Item, ArmorProperties, ShieldProperties, WeaponProperties, AttackEntry } from "@/data/items";
import { itemsById } from "@/data/items";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";

/**
 * Calculate AC based on equipped armor/shield + ability mods.
 * Does NOT apply class overrides (e.g. Barbarian Unarmored Defense) – use applyACOverrides for that.
 */
export function calcArmorClass(char: CharacterState): number {
  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses);
  const dexMod = calcAbilityMod(finalScores.dex);

  let ac = 10 + dexMod; // no armor default

  const equippedArmor = char.equipped?.armor ? itemsById[char.equipped.armor] : null;
  if (equippedArmor && equippedArmor.type === "armor") {
    const props = equippedArmor.properties as ArmorProperties;
    const cappedDex = props.dexCap !== null ? Math.min(dexMod, props.dexCap) : dexMod;
    ac = props.baseAC + cappedDex;
  }

  const equippedShield = char.equipped?.shield ? itemsById[char.equipped.shield] : null;
  if (equippedShield && equippedShield.type === "shield") {
    const props = equippedShield.properties as ShieldProperties;
    ac += props.acBonus;
  }

  return ac;
}

/** Hook for future class-specific AC overrides (Barbarian Unarmored Defense, Monk, etc.) */
export function applyACOverrides(_char: CharacterState, baseAC: number): number {
  // Future: check class features and apply overrides
  return baseAC;
}

/**
 * Build attack entries for all equipped weapons.
 */
export function buildAttacks(char: CharacterState): AttackEntry[] {
  if (!char.equipped?.weapons?.length) return [];

  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses);
  const strMod = calcAbilityMod(finalScores.str);
  const dexMod = calcAbilityMod(finalScores.dex);
  const profBonus = char.proficiencyBonus;
  const weaponProfs = char.proficiencies.weapons;

  return char.equipped.weapons
    .map((wId) => {
      const item = itemsById[wId];
      if (!item || item.type !== "weapon") return null;
      const props = item.properties as WeaponProperties;

      // Determine ability mod
      let abilityMod = strMod;
      if (props.finesse) {
        abilityMod = Math.max(strMod, dexMod);
      } else if (props.range || props.ammunition) {
        abilityMod = dexMod;
      }

      // Determine proficiency
      const proficient = isWeaponProficient(item, weaponProfs);
      const attackBonus = abilityMod + (proficient ? profBonus : 0);

      // Damage string
      const dmgMod = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;
      let damage = `${props.damageDice}${dmgMod} ${props.damageType}`;
      if (props.versatile) {
        const vDmg = `${props.versatile}${dmgMod}`;
        damage += ` (versátil: ${vDmg})`;
      }

      const range = props.range ?? (props.thrown ?? "—");

      return {
        weaponId: wId,
        name: item.name,
        attackBonus,
        damage,
        range,
        proficient,
      } as AttackEntry;
    })
    .filter(Boolean) as AttackEntry[];
}

function isWeaponProficient(item: Item, profs: string[]): boolean {
  const cat = item.category.toLowerCase();
  for (const p of profs) {
    const pl = p.toLowerCase();
    if (pl === "armas simples" && cat.includes("simples")) return true;
    if (pl === "armas marciais" && cat.includes("marcial")) return true;
    if (item.name.toLowerCase().includes(pl)) return true;
    if (pl.includes(item.name.toLowerCase())) return true;
  }
  return false;
}

/** Check if character is proficient with a specific armor */
export function isArmorProficient(item: Item, armorProfs: string[]): boolean {
  const cat = item.category.toLowerCase();
  for (const p of armorProfs) {
    const pl = p.toLowerCase();
    if (pl === "armaduras leves" && cat.includes("leve")) return true;
    if (pl === "armaduras médias" && cat.includes("média")) return true;
    if (pl === "armaduras pesadas" && cat.includes("pesada")) return true;
    if (pl === "escudos" && item.type === "shield") return true;
  }
  return false;
}
