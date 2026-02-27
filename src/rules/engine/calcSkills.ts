import { ALL_SKILLS, type AbilityKey } from "@/utils/calculations";

export interface SkillMod {
  name: string;
  ability: AbilityKey;
  total: number;
  proficient: boolean;
  expertise: boolean;
  halfProf: boolean;
  bonusFromFeature: number;
}

export interface CalcSkillsOptions {
  classId?: string | null;
  level?: number;
  classFeatureChoices?: Record<string, string | string[]>;
  abilityMods?: Record<AbilityKey, number>;
}

/**
 * Calculate skill modifiers.
 * Supports: expertise, Bard Jack of All Trades (half-prof on non-proficient),
 * Cleric Taumaturgo / Druid Xamã bonuses.
 */
export function calcSkills(
  mods: Record<AbilityKey, number>,
  profBonus: number,
  proficientSkills: string[],
  expertiseSkills: string[] = [],
  options: CalcSkillsOptions = {}
): Record<string, SkillMod> {
  const { classId, level = 1, classFeatureChoices = {} } = options;
  const result: Record<string, SkillMod> = {};

  // Bard Jack of All Trades: level 2+
  const bardHalfProf = classId === "bardo" && level >= 2;
  const halfProfValue = Math.floor(profBonus / 2);

  // Cleric Taumaturgo: +max(WIS mod, 1) to Arcanismo and Religião
  const clericOrder = classId === "clerigo" ? classFeatureChoices["clerigo:ordemDivina"] : null;
  const taumaturgoBonus = clericOrder === "taumaturgo" ? Math.max(mods.wis, 1) : 0;
  const taumaturgoSkills = ["Arcanismo", "Religião"];

  // Druid Xamã: +max(WIS mod, 1) to Arcanismo and Natureza
  const druidOrder = classId === "druida" ? classFeatureChoices["druida:ordemPrimal"] : null;
  const xamaBonus = druidOrder === "xama" ? Math.max(mods.wis, 1) : 0;
  const xamaSkills = ["Arcanismo", "Natureza"];

  for (const skill of ALL_SKILLS) {
    const proficient = proficientSkills.includes(skill.name);
    const expertise = expertiseSkills.includes(skill.name);
    const abilityMod = mods[skill.ability];
    let total = abilityMod;
    let halfProf = false;
    let bonusFromFeature = 0;

    if (expertise) {
      total += profBonus * 2;
    } else if (proficient) {
      total += profBonus;
    } else if (bardHalfProf) {
      // Jack of All Trades: add half prof to non-proficient skills
      total += halfProfValue;
      halfProf = true;
    }

    // Taumaturgo bonus (Cleric)
    if (taumaturgoBonus > 0 && taumaturgoSkills.includes(skill.name)) {
      bonusFromFeature += taumaturgoBonus;
      total += taumaturgoBonus;
    }

    // Xamã bonus (Druid)
    if (xamaBonus > 0 && xamaSkills.includes(skill.name)) {
      bonusFromFeature += xamaBonus;
      total += xamaBonus;
    }

    result[skill.name] = {
      name: skill.name,
      ability: skill.ability,
      total,
      proficient: proficient || expertise,
      expertise,
      halfProf,
      bonusFromFeature,
    };
  }

  return result;
}
