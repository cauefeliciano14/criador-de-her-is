import type { CharacterState, NormalizedFeature } from "@/state/characterStore";
import { races } from "@/data/races";

/**
 * Apply race choice effects to the character state.
 * This should be called after selecting a race and race choice.
 * Returns updated features, proficiencies, etc.
 */
export function applyRaceEffects(char: CharacterState): Partial<CharacterState> {
  const race = races.find((r) => r.id === char.race);
  if (!race || !race.raceChoice) return {};

  const choice = char.raceChoices.raceChoice;
  if (!choice) return {};

  const option = race.raceChoice.options.find((o) => o.id === choice.optionId);
  if (!option) return {};

  const updates: Partial<CharacterState> = {};

  // Apply effects
  if (option.effects.traits) {
    const choiceFeatures: NormalizedFeature[] = option.effects.traits.map((t) => ({
      sourceType: "race" as const,
      sourceId: `${race.id}-${choice.kind}-${choice.optionId}`,
      name: t.name,
      description: t.description,
    }));
    updates.features = [...(char.features || []), ...choiceFeatures];
  }

  if (option.effects.languages) {
    updates.proficiencies = {
      ...char.proficiencies,
      languages: [...char.proficiencies.languages, ...option.effects.languages],
    };
  }

  if (option.effects.proficiencies) {
    const profUpdates: any = {};
    if (option.effects.proficiencies.skills && option.effects.proficiencies.skills.length > 0) {
      profUpdates.skills = [...(char.skills || []), ...option.effects.proficiencies.skills];
    }
    if (option.effects.proficiencies.tools && option.effects.proficiencies.tools.length > 0) {
      profUpdates.proficiencies = {
        ...char.proficiencies,
        tools: [...char.proficiencies.tools, ...option.effects.proficiencies.tools],
      };
    }
    if (option.effects.proficiencies.weapons && option.effects.proficiencies.weapons.length > 0) {
      profUpdates.proficiencies = {
        ...profUpdates.proficiencies,
        ...char.proficiencies,
        weapons: [...char.proficiencies.weapons, ...option.effects.proficiencies.weapons],
      };
    }
    if (option.effects.proficiencies.armor && option.effects.proficiencies.armor.length > 0) {
      profUpdates.proficiencies = {
        ...profUpdates.proficiencies,
        ...char.proficiencies,
        armor: [...char.proficiencies.armor, ...option.effects.proficiencies.armor],
      };
    }
    Object.assign(updates, profUpdates);
  }

  if (option.effects.speed) {
    updates.speed = option.effects.speed;
  }

  if (option.effects.size) {
    // Size is not directly in state, but could affect other things
  }

  if (option.effects.resistances) {
    // Resistances are handled via traits, assume already in effects
  }

  if (option.effects.breathWeapon) {
    // Breath weapon is handled via traits
  }

  if (option.effects.spellsGranted) {
    // Spells granted - need to add to spells
    const newCantrips = option.effects.spellsGranted
      .filter((s) => s.level === 0)
      .map((s) => s.spellId);
    const newPrepared = option.effects.spellsGranted
      .filter((s) => s.level > 0)
      .map((s) => s.spellId);

    updates.spells = {
      ...char.spells,
      cantrips: [...char.spells.cantrips, ...newCantrips],
      prepared: [...char.spells.prepared, ...newPrepared],
    };
  }

  return updates;
}