import type { CharacterState } from "@/state/characterStore";
import { itemsById, type ArmorProperties } from "@/data/items";
import { isArmorProficient } from "@/utils/equipment";

export interface RulesWarning {
  id: string;
  severity: "warning" | "error";
  category: "armor" | "weapon" | "spell" | "ability" | "hp" | "inventory" | "general";
  message: string;
}

/**
 * Collect all rule warnings/errors for the current character state.
 */
export function collectWarnings(char: CharacterState): RulesWarning[] {
  const warnings: RulesWarning[] = [];

  // ── Armor proficiency ──
  if (char.equipped?.armor) {
    const armorItem = itemsById[char.equipped.armor];
    if (armorItem) {
      if (!isArmorProficient(armorItem, char.proficiencies.armor)) {
        warnings.push({
          id: "armor-no-prof",
          severity: "warning",
          category: "armor",
          message: `Você não tem proficiência com ${armorItem.name}. Desvantagem em testes de Força e Destreza, ataques e conjuração.`,
        });
      }
      // Strength requirement
      const props = armorItem.properties as ArmorProperties | undefined;
      if (props && "requiresStr" in props && props.requiresStr) {
        const finalStr =
          char.abilityScores.str +
          (char.racialBonuses.str ?? 0) +
          (char.backgroundBonuses?.str ?? 0) +
          (char.asiBonuses?.str ?? 0) +
          (char.featAbilityBonuses?.str ?? 0);
        if (finalStr < props.requiresStr) {
          warnings.push({
            id: "armor-str-req",
            severity: "warning",
            category: "armor",
            message: `${armorItem.name} requer Força ${props.requiresStr} (seu: ${finalStr}). Deslocamento reduzido em 3m.`,
          });
        }
      }
    } else {
      warnings.push({
        id: "armor-missing",
        severity: "error",
        category: "inventory",
        message: `Armadura equipada (${char.equipped.armor}) não encontrada no catálogo.`,
      });
    }
  }

  // ── Shield proficiency ──
  if (char.equipped?.shield) {
    const shieldItem = itemsById[char.equipped.shield];
    if (shieldItem) {
      if (!isArmorProficient(shieldItem, char.proficiencies.armor)) {
        warnings.push({
          id: "shield-no-prof",
          severity: "warning",
          category: "armor",
          message: `Você não tem proficiência com escudos. Desvantagem em testes de Força e Destreza, ataques e conjuração.`,
        });
      }
    } else {
      warnings.push({
        id: "shield-missing",
        severity: "error",
        category: "inventory",
        message: `Escudo equipado (${char.equipped.shield}) não encontrado no catálogo.`,
      });
    }
  }

  // ── Equipped items not in inventory ──
  if (char.equipped?.weapons) {
    for (const wId of char.equipped.weapons) {
      const inInv = char.inventory.some((e) => e.itemId === wId);
      if (!inInv && !itemsById[wId]) {
        warnings.push({
          id: `weapon-missing-${wId}`,
          severity: "error",
          category: "inventory",
          message: `Arma equipada "${wId}" não encontrada no catálogo.`,
        });
      }
    }
  }

  // ── HP/AC sanity ──
  if (char.hitPoints.max <= 0 || Number.isNaN(char.hitPoints.max)) {
    warnings.push({
      id: "hp-invalid",
      severity: "error",
      category: "hp",
      message: "Pontos de vida máximos inválidos.",
    });
  }

  if (Number.isNaN(char.armorClass) || char.armorClass <= 0) {
    warnings.push({
      id: "ac-invalid",
      severity: "error",
      category: "general",
      message: "Classe de armadura inválida.",
    });
  }

  // ── Ability score bounds ──
  const finalScores = [
    char.abilityScores.str, char.abilityScores.dex, char.abilityScores.con,
    char.abilityScores.int, char.abilityScores.wis, char.abilityScores.cha,
  ];
  for (const s of finalScores) {
    if (s < 1 || s > 30) {
      warnings.push({
        id: "ability-bounds",
        severity: "error",
        category: "ability",
        message: `Um ou mais atributos base estão fora do intervalo válido (1-30).`,
      });
      break;
    }
  }

  // ── Monk warnings ──
  if (char.class === "monge") {
    if (char.equipped?.armor) {
      const armorItem = itemsById[char.equipped.armor];
      if (armorItem) {
        warnings.push({
          id: "monk-armor",
          severity: "warning",
          category: "armor",
          message: `Monge com armadura equipada perde Defesa sem Armadura e pode perder Artes Marciais. Verifique os requisitos.`,
        });
      }
    }
    if (char.equipped?.shield) {
      warnings.push({
        id: "monk-shield",
        severity: "warning",
        category: "armor",
        message: `Monge perde Defesa sem Armadura com escudo equipado.`,
      });
    }
  }

  // ── Barbarian with armor warning ──
  if (char.class === "barbaro" && char.equipped?.armor) {
    const armorItem = itemsById[char.equipped.armor];
    if (armorItem) {
      warnings.push({
        id: "barbarian-armor-unarmored",
        severity: "warning",
        category: "armor",
        message: `Defesa sem Armadura do Bárbaro não se aplica com armadura equipada.`,
      });
    }
  }

  return warnings;
}
