import type { CharacterState } from "@/state/characterStore";
import type { Item, WeaponProperties, AttackEntry } from "@/data/items";
import { itemsById } from "@/data/items";
import { type AbilityKey } from "./calcAbilityScores";

/**
 * Monk Martial Arts die by level (PHB 2024).
 */
function monkMartialArtsDie(level: number): string {
  if (level >= 17) return "1d12";
  if (level >= 11) return "1d10";
  if (level >= 5) return "1d8";
  return "1d6";
}

/**
 * Check if a weapon qualifies as a Monk weapon (PHB 2024):
 * - Simple melee weapons (not two-handed unless it also has some special property)
 * - Martial melee weapons with the Light property
 */
function isMonkWeapon(item: Item): boolean {
  const cat = item.category.toLowerCase();
  const props = item.properties as WeaponProperties | undefined;
  if (!props) return false;

  // Simple melee (excluding two-handed heavy weapons)
  if (cat.includes("simples") && cat.includes("corpo")) return true;

  // Martial melee with Light
  if (cat.includes("marcial") && cat.includes("corpo") && props.light) return true;

  return false;
}

/**
 * Build attack entries for equipped weapons + unarmed strike.
 * Supports Monk Martial Arts.
 */
export function calcAttacks(
  mods: Record<AbilityKey, number>,
  profBonus: number,
  equipped: CharacterState["equipped"],
  weaponProfs: string[],
  flags: Record<string, number | boolean>,
  options?: { classId?: string | null; level?: number }
): AttackEntry[] {
  const attacks: AttackEntry[] = [];
  const strMod = mods.str;
  const dexMod = mods.dex;
  const classId = options?.classId ?? null;
  const level = options?.level ?? 1;

  const isMonk = classId === "monge";
  const martialDie = isMonk ? monkMartialArtsDie(level) : null;

  // Equipped weapons
  if (equipped?.weapons?.length) {
    for (const wId of equipped.weapons) {
      const item = itemsById[wId];
      if (!item || item.type !== "weapon") continue;
      const props = item.properties as WeaponProperties;

      let abilityMod = strMod;
      if (props.finesse) {
        abilityMod = Math.max(strMod, dexMod);
      } else if (props.range || props.ammunition) {
        abilityMod = dexMod;
      }

      // Monk: can use DEX for monk weapons
      if (isMonk && isMonkWeapon(item)) {
        abilityMod = Math.max(strMod, dexMod);
      }

      const proficient = isWeaponProficient(item, weaponProfs);
      const attackBonus = abilityMod + (proficient ? profBonus : 0);

      const dmgMod = abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`;

      // Monk: use martial arts die if higher than weapon die
      let damageDice = props.damageDice;
      if (isMonk && isMonkWeapon(item) && martialDie) {
        // Compare dice: simple heuristic - extract the number after 'd'
        const weaponDieVal = parseInt(damageDice.replace(/.*d/, ""), 10) || 0;
        const martialDieVal = parseInt(martialDie.replace(/.*d/, ""), 10) || 0;
        if (martialDieVal > weaponDieVal) {
          damageDice = martialDie;
        }
      }

      let damage = `${damageDice}${dmgMod} ${props.damageType}`;
      if (props.versatile) {
        damage += ` (versátil: ${props.versatile}${dmgMod})`;
      }

      const range = props.range ?? (props.thrown ?? "—");

      attacks.push({
        weaponId: wId,
        name: item.name,
        attackBonus,
        damage,
        range,
        proficient,
      });
    }
  }

  // Unarmed Strike
  if (isMonk) {
    // Monk unarmed: uses DEX, martial arts die
    const unarmedMod = Math.max(strMod, dexMod);
    const unarmedBonus = unarmedMod + profBonus;
    attacks.push({
      weaponId: "__unarmed__",
      name: "Ataque Desarmado",
      attackBonus: unarmedBonus,
      damage: `${martialDie}${unarmedMod >= 0 ? `+${unarmedMod}` : `${unarmedMod}`} contundente`,
      range: "—",
      proficient: true,
    });
  } else {
    const unarmedMod = strMod;
    const unarmedBonus = unarmedMod + profBonus;
    attacks.push({
      weaponId: "__unarmed__",
      name: "Ataque Desarmado",
      attackBonus: unarmedBonus,
      damage: `1${unarmedMod >= 0 ? `+${unarmedMod}` : `${unarmedMod}`} contundente`,
      range: "—",
      proficient: true,
    });
  }

  return attacks;
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
