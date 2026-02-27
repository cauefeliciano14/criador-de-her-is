/**
 * Memoized selectors for characterStore to minimize re-renders.
 * Each selector picks only the slice a component needs.
 */
import { useCharacterStore, type CharacterState } from "./characterStore";
import { useShallow } from "zustand/shallow";

// ── Sidebar / Summary Panel ──
export function useCharSummary() {
  return useCharacterStore(
    useShallow((s) => ({
      name: s.name,
      level: s.level,
      race: s.race,
      subrace: s.subrace,
      class: s.class,
      subclass: s.subclass,
      background: s.background,
      armorClass: s.armorClass,
      hitPoints: s.hitPoints,
      speed: s.speed,
      proficiencyBonus: s.proficiencyBonus,
      abilityScores: s.abilityScores,
      abilityMods: s.abilityMods,
      racialBonuses: s.racialBonuses,
      backgroundBonuses: s.backgroundBonuses,
      asiBonuses: s.asiBonuses,
      featAbilityBonuses: s.featAbilityBonuses,
    }))
  );
}

// ── Spells step ──
export function useCharSpells() {
  return useCharacterStore(
    useShallow((s) => ({
      class: s.class,
      level: s.level,
      spells: s.spells,
      classFeatureChoices: s.classFeatureChoices,
    }))
  );
}

// ── Equipment step ──
export function useCharEquipment() {
  return useCharacterStore(
    useShallow((s) => ({
      class: s.class,
      classEquipmentChoice: s.classEquipmentChoice,
      equipment: s.equipment,
      inventory: s.inventory,
      equipped: s.equipped,
      gold: s.gold,
      proficiencies: s.proficiencies,
    }))
  );
}

// ── Skills step ──
export function useCharSkills() {
  return useCharacterStore(
    useShallow((s) => ({
      class: s.class,
      level: s.level,
      skills: s.skills,
      classSkillChoices: s.classSkillChoices,
      expertiseSkills: s.expertiseSkills,
      classFeatureChoices: s.classFeatureChoices,
      proficiencyBonus: s.proficiencyBonus,
      savingThrows: s.savingThrows,
      proficiencies: s.proficiencies,
      abilityScores: s.abilityScores,
      racialBonuses: s.racialBonuses,
      backgroundBonuses: s.backgroundBonuses,
      asiBonuses: s.asiBonuses,
      featAbilityBonuses: s.featAbilityBonuses,
      race: s.race,
      subrace: s.subrace,
      background: s.background,
    }))
  );
}

// ── Attacks / Combat ──
export function useCharCombat() {
  return useCharacterStore(
    useShallow((s) => ({
      attacks: s.attacks,
      armorClass: s.armorClass,
      hitPoints: s.hitPoints,
      equipped: s.equipped,
      skillMods: s.skillMods,
      saveMods: s.saveMods,
      warnings: s.warnings,
    }))
  );
}
