import type { CharacterState, NormalizedFeature } from "@/state/characterStore";
import { races } from "@/data/races";

const RACE_CHOICE_KEY_BY_KIND: Record<string, string> = {
  dragonAncestry: "draconicAncestry",
  elfLineage: "elvenLineage",
  gnomeLineage: "gnomishLineage",
  giantAncestry: "giantAncestry",
  infernalLegacy: "infernalLegacy",
  sizeChoice: "height",
};

export function applyRaceEffects(char: CharacterState): Partial<CharacterState> {
  const race = races.find((r) => r.id === char.race);
  if (!race || !race.raceChoice) return {};

  const key = RACE_CHOICE_KEY_BY_KIND[race.raceChoice.kind] ?? race.raceChoice.kind;
  const optionId = char.raceChoices[key];
  if (!optionId) return {};

  const option = race.raceChoice.options.find((o) => o.id === optionId);
  if (!option) return {};

  const updates: Partial<CharacterState> = {};

  if (option.effects.traits) {
    const choiceFeatures: NormalizedFeature[] = option.effects.traits.map((t) => ({
      sourceType: "race" as const,
      sourceId: `${race.id}-${key}-${optionId}`,
      name: t.name,
      description: t.description,
    }));
    updates.features = [...(char.features || []), ...choiceFeatures];
  }

  if (option.effects.languages) {
    updates.proficiencies = {
      ...char.proficiencies,
      languages: [...new Set([...char.proficiencies.languages, ...option.effects.languages])],
    };
  }

  if (option.effects.speed) updates.speed = option.effects.speed;

  if (option.effects.spellsGranted) {
    const newCantrips = option.effects.spellsGranted.filter((s) => s.level === 0).map((s) => s.spellId);
    const newPrepared = option.effects.spellsGranted.filter((s) => s.level > 0).map((s) => s.spellId);
    updates.spells = {
      ...char.spells,
      cantrips: [...new Set([...char.spells.cantrips, ...newCantrips])],
      prepared: [...new Set([...char.spells.prepared, ...newPrepared])],
    };
  }

  return updates;
}
