import type { FeatData, FeatPrerequisite } from "@/data/feats";
import type { CharacterState } from "@/state/characterStore";
import { getFinalAbilityScores, type AbilityKey, ABILITIES } from "@/utils/calculations";

export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}

const ABILITY_LABELS_PT: Record<string, string> = {
  str: "Força", dex: "Destreza", con: "Constituição",
  int: "Inteligência", wis: "Sabedoria", cha: "Carisma",
};

export function checkFeatEligibility(
  char: CharacterState,
  feat: FeatData
): EligibilityResult {
  const reasons: string[] = [];

  if (!feat.prerequisites || feat.prerequisites.length === 0) {
    return { eligible: true, reasons: [] };
  }

  const finalScores = getFinalAbilityScores(
    char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses
  );

  for (const prereq of feat.prerequisites) {
    switch (prereq.type) {
      case "level":
        if (prereq.min && char.level < prereq.min) {
          reasons.push(`Nível mínimo: ${prereq.min} (atual: ${char.level})`);
        }
        break;
      case "ability":
        if (prereq.ability && prereq.min) {
          const score = finalScores[prereq.ability];
          if (score < prereq.min) {
            reasons.push(
              `${ABILITY_LABELS_PT[prereq.ability] ?? prereq.ability} ≥ ${prereq.min} (atual: ${score})`
            );
          }
        }
        break;
      case "class":
        if (prereq.ids && prereq.ids.length > 0) {
          if (!char.class || !prereq.ids.includes(char.class)) {
            reasons.push(`Classe necessária: ${prereq.ids.join(", ")}`);
          }
        }
        break;
      case "spellcasting":
        if (prereq.required && !char.spells.spellcastingAbility) {
          reasons.push("Necessário ser conjurador");
        }
        break;
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

/** Compute ability bonuses from all applied feats */
export function computeFeatAbilityBonuses(
  appliedFeats: CharacterState["appliedFeats"],
): Record<AbilityKey, number> {
  const bonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

  for (const af of appliedFeats) {
    if (!af.choices?.abilityIncreases) continue;
    for (const [key, val] of Object.entries(af.choices.abilityIncreases)) {
      if (ABILITIES.includes(key as AbilityKey)) {
        bonuses[key as AbilityKey] += val as number;
      }
    }
  }

  return bonuses;
}

/** Collect all flags from applied feats */
export function collectFeatFlags(
  appliedFeats: CharacterState["appliedFeats"],
  featsById: Record<string, FeatData>
): Record<string, number | boolean> {
  const flags: Record<string, number | boolean> = {};

  for (const af of appliedFeats) {
    const feat = featsById[af.featId];
    if (!feat?.effects.flags) continue;
    for (const [k, v] of Object.entries(feat.effects.flags)) {
      flags[k] = v;
    }
  }

  return flags;
}
