import type { CharacterState } from "@/state/characterStore";
import { calcFinalAbilityScores, type AbilityKey } from "./calcAbilityScores";
import { calcProficiencyBonus } from "./calcProficiencyBonus";
import { calcHP, adjustCurrentHP } from "./calcHP";
import { calcAC } from "./calcAC";
import { calcAttacks } from "./calcAttacks";
import { calcSkills, type SkillMod } from "./calcSkills";
import { calcSaves, type SaveMod } from "./calcSaves";
import { calcSpellStats } from "./calcSpellStats";
import { collectWarnings, type RulesWarning } from "./calcWarnings";

export { type SkillMod } from "./calcSkills";
export { type SaveMod } from "./calcSaves";
export { type RulesWarning } from "./calcWarnings";
export { type AbilityBreakdown } from "./calcAbilityScores";

export interface RecalcResult {
  abilityMods: Record<AbilityKey, number>;
  proficiencyBonus: number;
  hitPoints: { max: number; current: number };
  armorClass: number;
  attacks: CharacterState["attacks"];
  spells: CharacterState["spells"];
  skillMods: Record<string, SkillMod>;
  saveMods: Record<AbilityKey, SaveMod>;
  warnings: RulesWarning[];
}

/**
 * Pure function: given current character state, compute all derived stats.
 * Does NOT mutate the input.
 */
export function recalcAll(char: CharacterState): RecalcResult {
  // 1) Ability scores
  const ab = calcFinalAbilityScores(char);
  const mods = ab.mods;

  // 2) Proficiency bonus
  const profBonus = calcProficiencyBonus(char.level);

  // 3) HP
  const hitDie = char.hitDie || 8;
  const hpRolls = char.leveling?.hpRolls ?? {};
  const { max: hpMax } = calcHP(hitDie, char.level, mods.con, hpRolls);
  const hpCurrent = adjustCurrentHP(char.hitPoints.current, char.hitPoints.max, hpMax);

  // 4) AC
  const acResult = calcAC(mods, char.equipped, char.flags ?? {});

  // 5) Attacks
  const attacks = calcAttacks(
    mods,
    profBonus,
    char.equipped,
    char.proficiencies.weapons,
    char.flags ?? {},
    { classId: char.class, level: char.level }
  );

  // 6) Skills (with expertise, Bard half-prof, order bonuses)
  const skillMods = calcSkills(mods, profBonus, char.skills, char.expertiseSkills ?? [], {
    classId: char.class,
    level: char.level,
    classFeatureChoices: char.classFeatureChoices ?? {},
    abilityMods: mods,
  });

  // 7) Saves
  const saveMods = calcSaves(mods, profBonus, char.savingThrows);

  // 8) Spell stats
  const spellStats = calcSpellStats(char.spells.spellcastingAbility, mods, profBonus);

  // 9) Warnings (pass updated char with derived values set)
  const updatedChar: CharacterState = {
    ...char,
    abilityMods: mods,
    proficiencyBonus: profBonus,
    hitPoints: { max: hpMax, current: hpCurrent },
    armorClass: acResult.total,
  };
  const warnings = collectWarnings(updatedChar);

  return {
    abilityMods: mods,
    proficiencyBonus: profBonus,
    hitPoints: { max: hpMax, current: hpCurrent },
    armorClass: acResult.total,
    attacks,
    spells: {
      ...char.spells,
      spellSaveDC: spellStats.spellSaveDC,
      spellAttackBonus: spellStats.spellAttackBonus,
    },
    skillMods,
    saveMods,
    warnings,
  };
}
