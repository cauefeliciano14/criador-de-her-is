import type { CharacterState } from "@/state/characterStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { type AbilityKey } from "@/utils/calculations";
import { getChoicesRequirements } from "@/utils/choices";

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

/**
 * Step mapping for the new wizard order:
 * 1: class, 2: origin, 3: race, 4: abilities, 5: equipment, 6: sheet
 */

export function validateCharacterCompleteness(char: CharacterState, useChoicesStep: boolean = false): ValidationResult {
  const missing: ValidationItem[] = [];
  const warnings: ValidationItem[] = [];

  const race = races.find((r) => r.id === char.race);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);

  // 1. Ability method
  if (char.level > 2) {
    missing.push({
      id: "level-unsupported",
      label: "Somente níveis 1 e 2 são suportados neste recorte",
      stepId: "sheet",
      stepNumber: 6,
      severity: "required",
    });
  }

  if (!char.abilityGeneration.method || !char.abilityGeneration.confirmed) {
    missing.push({
      id: "ability-method",
      label: "Método de atributos não selecionado ou não confirmado",
      stepId: "abilities",
      stepNumber: 4,
      severity: "required",
    });
  }

  // 2. Race
  if (!char.race) {
    missing.push({
      id: "race-select",
      label: "Raça não selecionada",
      stepId: "race",
      stepNumber: 3,
      severity: "required",
    });
  } else if (race && race.subraces.length > 0 && !char.subrace) {
    missing.push({
      id: "subrace-select",
      label: "Sub-raça obrigatória não selecionada",
      stepId: "race",
      stepNumber: 3,
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
        stepNumber: 3,
        severity: "required",
      });
    }
  }

  // Race choices (e.g., Draconato ancestralidade)
  if (char.race === "draconato" && !char.raceChoices.dragonbornHeritage) {
    missing.push({
      id: "draconato-ancestralidade",
      label: "Ancestralidade dracônica não escolhida",
      stepId: "race",
      stepNumber: 3,
      severity: "required",
    });
  }

  // 3. Class
  if (!char.class) {
    missing.push({
      id: "class-select",
      label: "Classe não selecionada",
      stepId: "class",
      stepNumber: 1,
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
        stepId: "equipment",
        stepNumber: 5,
        severity: "required",
      });
    }

    // Subclass required check
    if (
      cls.subclassLevel != null &&
      cls.subclasses.length > 0 &&
      char.level >= cls.subclassLevel &&
      !char.subclass
    ) {
      missing.push({
        id: "subclass-select",
        label: `Subclasse obrigatória no nível ${cls.subclassLevel}`,
        stepId: "class",
        stepNumber: 1,
        severity: "required",
      });
    }

    // ── Class Feature Choices ──
    const cfc = char.classFeatureChoices ?? {};

    // Cleric: Divine Order
    if (char.class === "clerigo" && !cfc["clerigo:ordemDivina"]) {
      missing.push({
        id: "clerigo-ordem-divina",
        label: "Ordem Divina não escolhida (Clérigo)",
        stepId: "class",
        stepNumber: 1,
        severity: "required",
      });
    }

    // Druid: Primal Order
    if (char.class === "druida" && !cfc["druida:ordemPrimal"]) {
      missing.push({
        id: "druida-ordem-primal",
        label: "Ordem Primal não escolhida (Druida)",
        stepId: "class",
        stepNumber: 1,
        severity: "required",
      });
    }

    // Expertise validations
    const expertiseChecks: { key: string; count: number; label: string; minLevel: number }[] = [
      { key: "ladino:especialista", count: 2, label: "Especialização do Ladino", minLevel: 1 },
      { key: "bardo:especialista", count: 2, label: "Especialização do Bardo", minLevel: 2 },
      { key: "guardiao:exploradorHabil:especialista", count: 1, label: "Explorador Hábil (Guardião)", minLevel: 2 },
      { key: "mago:academico", count: 1, label: "Acadêmico (Mago)", minLevel: 2 },
    ];

    for (const check of expertiseChecks) {
      if (char.class !== check.key.split(":")[0]) continue;
      if (char.level < check.minLevel) continue;
      const val = cfc[check.key];
      const chosen = Array.isArray(val) ? val.length : (typeof val === "string" ? 1 : 0);
      if (chosen < check.count) {
        const expertiseStepId = "equipment";
        const expertiseStepNumber = 5;
        missing.push({
          id: `expertise-${check.key}`,
          label: `${check.label}: ${chosen}/${check.count} escolhido(s)`,
          stepId: expertiseStepId,
          stepNumber: expertiseStepNumber,
          severity: "required",
        });
      }
    }
  }

  // 4. Background
  if (!char.background) {
    missing.push({
      id: "bg-select",
      label: "Antecedente não selecionado",
      stepId: "origin",
      stepNumber: 2,
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
        stepId: "abilities",
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
      missing.push({
        id: "origin-feat",
        label: "Talento de Origem não aplicado",
        stepId: "origin",
        stepNumber: 2,
        severity: "required",
      });
    }
  }


  const choicesReq = getChoicesRequirements(char);
  if (choicesReq.needsStep) {
    const pending = Object.values(choicesReq.buckets).reduce((a, b) => a + b.pendingCount, 0);
    missing.push({
      id: "choices-pending",
      label: `Escolhas obrigatórias pendentes (${pending})`,
      stepId: "equipment",
      stepNumber: 5,
      severity: "required",
    });
  }

  // 5. Equipment choice
  if (cls && cls.equipmentChoices.length > 0 && !char.classEquipmentChoice) {
    missing.push({
      id: "equipment-choice",
      label: "Equipamento inicial não escolhido",
      stepId: "equipment",
      stepNumber: 5,
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
        stepId: "equipment",
        stepNumber: 5,
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
      stepNumber: 5,
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
        stepNumber: 5,
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
        stepNumber: 5,
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
