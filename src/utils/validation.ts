import type { CharacterState } from "@/state/characterStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey, ABILITIES } from "@/utils/calculations";

export interface ValidationItem {
  id: string;
  label: string;
  stepId: string;
  stepNumber: number;
  severity: "required" | "warning";
  details?: string;
}

export interface ValidationResult {
  isComplete: boolean;
  missing: ValidationItem[];
  warnings: ValidationItem[];
}

export function validateCharacterCompleteness(char: CharacterState): ValidationResult {
  const missing: ValidationItem[] = [];
  const warnings: ValidationItem[] = [];

  const race = races.find((r) => r.id === char.race);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);

  // 1. Ability method
  if (!char.abilityGeneration.method || !char.abilityGeneration.confirmed) {
    missing.push({
      id: "ability-method",
      label: "Método de atributos não selecionado ou não confirmado",
      stepId: "ability-method",
      stepNumber: 1,
      severity: "required",
    });
  }

  // 2. Race
  if (!char.race) {
    missing.push({
      id: "race-select",
      label: "Raça não selecionada",
      stepId: "race",
      stepNumber: 2,
      severity: "required",
    });
  } else if (race && race.subraces.length > 0 && !char.subrace) {
    missing.push({
      id: "subrace-select",
      label: "Sub-raça obrigatória não selecionada",
      stepId: "race",
      stepNumber: 2,
      severity: "required",
    });
  }

  // Race ability choices
  if (race?.abilityBonuses.mode === "choose" && race.abilityBonuses.choose) {
    const choicesNeeded = race.abilityBonuses.choose.choices;
    const chosen = Object.keys(char.raceAbilityChoices).filter(
      (k) => (char.raceAbilityChoices as any)[k] > 0
    ).length;
    if (chosen < choicesNeeded) {
      missing.push({
        id: "race-ability-choices",
        label: `Bônus de atributo da raça incompletos (${chosen}/${choicesNeeded})`,
        stepId: "race",
        stepNumber: 2,
        severity: "required",
      });
    }
  }

  // 3. Class
  if (!char.class) {
    missing.push({
      id: "class-select",
      label: "Classe não selecionada",
      stepId: "class",
      stepNumber: 3,
      severity: "required",
    });
  } else if (cls) {
    // Class skill choices
    const needed = cls.skillChoices.choose;
    const chosen = char.classSkillChoices.length;
    if (chosen < needed) {
      missing.push({
        id: "class-skills",
        label: `Perícias de classe incompletas (${chosen}/${needed})`,
        stepId: "skills",
        stepNumber: 5,
        severity: "required",
      });
    }
  }

  // 4. Background
  if (!char.background) {
    missing.push({
      id: "bg-select",
      label: "Antecedente não selecionado",
      stepId: "background",
      stepNumber: 4,
      severity: "required",
    });
  }

  // Background ability choices
  if (bg?.abilityBonuses.mode === "choose" && bg.abilityBonuses.choose) {
    const choicesNeeded = bg.abilityBonuses.choose.choices;
    const chosen = Object.keys(char.backgroundAbilityChoices).filter(
      (k) => (char.backgroundAbilityChoices as any)[k] > 0
    ).length;
    if (chosen < choicesNeeded) {
      missing.push({
        id: "bg-ability-choices",
        label: `Bônus de atributo do antecedente incompletos (${chosen}/${choicesNeeded})`,
        stepId: "background",
        stepNumber: 4,
        severity: "required",
      });
    }
  }

  // Origin feat
  if (bg) {
    const hasFeat = char.features.some(
      (f) => f.sourceType === "background" && f.tags?.includes("originFeat")
    );
    if (!hasFeat) {
      warnings.push({
        id: "origin-feat",
        label: "Talento de Origem não aplicado",
        stepId: "background",
        stepNumber: 4,
        severity: "warning",
      });
    }
  }

  // 5. Equipment choice
  if (cls && cls.equipmentChoices.length > 0 && !char.classEquipmentChoice) {
    missing.push({
      id: "equipment-choice",
      label: "Equipamento inicial (A/B) não escolhido",
      stepId: "equipment",
      stepNumber: 7,
      severity: "required",
    });
  }

  // 6. Spells (if spellcaster)
  if (cls?.spellcasting) {
    const sc = cls.spellcasting;
    const abilityMap: Record<string, AbilityKey> = {
      Força: "str", Destreza: "dex", Constituição: "con",
      Inteligência: "int", Sabedoria: "wis", Carisma: "cha",
    };
    const scKey = abilityMap[sc.ability] ?? null;

    if (!char.spells.spellcastingAbility) {
      missing.push({
        id: "spell-ability",
        label: "Atributo de conjuração não definido",
        stepId: "spells",
        stepNumber: 6,
        severity: "required",
      });
    }

    // Cantrips limit
    const cantripsLimit = getCantripsLimit(sc.cantripsKnownAtLevel, char.level);
    if (cantripsLimit > 0 && char.spells.cantrips.length !== cantripsLimit) {
      missing.push({
        id: "cantrips-count",
        label: `Truques: ${char.spells.cantrips.length}/${cantripsLimit} selecionados`,
        stepId: "spells",
        stepNumber: 6,
        severity: "required",
      });
    }

    // Prepared/known limit
    const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses);
    const scMod = scKey ? calcAbilityMod(finalScores[scKey]) : 0;
    let spellLimit = 0;
    if (sc.type === "prepared") {
      spellLimit = Math.max(1, scMod + char.level);
    } else if (sc.type === "known" || sc.type === "pact") {
      const knownTable = (sc as any).spellsKnownAtLevel;
      if (knownTable) {
        for (let l = char.level; l >= 1; l--) {
          if (knownTable[l] !== undefined) { spellLimit = knownTable[l]; break; }
        }
      }
    }
    if (spellLimit > 0 && char.spells.prepared.length !== spellLimit) {
      missing.push({
        id: "spells-count",
        label: `Magias: ${char.spells.prepared.length}/${spellLimit} selecionadas`,
        stepId: "spells",
        stepNumber: 6,
        severity: "required",
      });
    }
  }

  // Inventory warning
  if (char.inventory.length === 0 && char.equipment.length === 0) {
    warnings.push({
      id: "empty-inventory",
      label: "Inventário vazio",
      stepId: "equipment",
      stepNumber: 7,
      severity: "warning",
    });
  }

  // Consistency: check equipped items exist in inventory
  if (char.equipped?.armor) {
    const exists = char.inventory.some((e) => e.itemId === char.equipped.armor);
    if (!exists) {
      warnings.push({
        id: "armor-missing-inv",
        label: "Armadura equipada não encontrada no inventário",
        stepId: "equipment",
        stepNumber: 7,
        severity: "warning",
      });
    }
  }
  if (char.equipped?.shield) {
    const exists = char.inventory.some((e) => e.itemId === char.equipped.shield);
    if (!exists) {
      warnings.push({
        id: "shield-missing-inv",
        label: "Escudo equipado não encontrado no inventário",
        stepId: "equipment",
        stepNumber: 7,
        severity: "warning",
      });
    }
  }

  return {
    isComplete: missing.length === 0,
    missing,
    warnings,
  };
}

function getCantripsLimit(table: Record<number, number>, level: number): number {
  let limit = 0;
  for (let l = level; l >= 1; l--) {
    if (table[l] !== undefined) { limit = table[l]; break; }
  }
  return limit;
}
