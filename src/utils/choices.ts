import type { CharacterState } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { spellsByClassId } from "@/data/indexes";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";

export interface ChoicesRequirements {
  needsStep: boolean;
  languages: {
    /** Number of unresolved language placeholders */
    requiredCount: number;
    pendingCount: number;
    placeholders: string[];
  };
  tools: {
    /** Number of unresolved tool/instrument placeholders */
    requiredCount: number;
    pendingCount: number;
    placeholders: string[];
  };
  cantrips: {
    requiredCount: number;
    chosenSpellIds: string[];
    options: string[];
    pendingCount: number;
  };
  spells: {
    requiredCount: number;
    chosenSpellIds: string[];
    options: string[];
    pendingCount: number;
  };
}

const PLACEHOLDER_RX = /\bà\s+sua\s+escolha\b/i;
const LANGUAGE_HINT_RX = /(idioma|idiomas)/i;
const TOOL_HINT_RX = /(ferramenta|ferramentas|instrumento|instrumentos|jogo|jogos)/i;

/** Count how many individual choices a placeholder represents (e.g. "Três instrumentos" → 3) */
function countFromPlaceholder(text: string): number {
  const match = text.match(/\b(dois|duas|três|quatro|cinco)\b/i);
  if (match) {
    const map: Record<string, number> = { dois: 2, duas: 2, três: 3, quatro: 4, cinco: 5 };
    return map[match[1].toLowerCase()] ?? 1;
  }
  return 1;
}

function getPlaceholders(list: string[] | undefined, kind: "language" | "tool"): string[] {
  const src = list ?? [];
  if (kind === "language") {
    return src.filter((s) => PLACEHOLDER_RX.test(s) && LANGUAGE_HINT_RX.test(s));
  }
  return src.filter((s) => PLACEHOLDER_RX.test(s) && TOOL_HINT_RX.test(s));
}

function getCantripsLimit(table: Record<number, number> | undefined, level: number): number {
  if (!table) return 0;
  for (let l = level; l >= 1; l--) {
    if (table[l] !== undefined) return table[l];
  }
  return 0;
}

export function getChoicesRequirements(char: CharacterState): ChoicesRequirements {
  const cls = classes.find((c) => c.id === char.class);

  // ── Languages / Tools (generic placeholders) ──
  const languagePlaceholders = getPlaceholders(char.proficiencies?.languages, "language");
  const toolPlaceholders = getPlaceholders(char.proficiencies?.tools, "tool");

  // Count total pending (some placeholders mean multiple choices, e.g. "Três instrumentos musicais à sua escolha")
  const langPendingCount = languagePlaceholders.reduce((sum, p) => sum + countFromPlaceholder(p), 0);
  const toolPendingCount = toolPlaceholders.reduce((sum, p) => sum + countFromPlaceholder(p), 0);

  // ── Spellcasting (canonical: classId) ──
  let cantripsRequired = 0;
  let spellsRequired = 0;
  const cantripsChosen = char.spells?.cantrips ?? [];
  const spellsChosen = char.spells?.prepared ?? [];
  let cantripsOptions: string[] = [];
  let spellsOptions: string[] = [];

  if (cls?.spellcasting && char.class) {
    const sc = cls.spellcasting;

    // Cantrips
    let cantripsLimit = getCantripsLimit(sc.cantripsKnownAtLevel, char.level);
    const cfc = char.classFeatureChoices ?? {};
    if (char.class === "clerigo" && cfc["clerigo:ordemDivina"] === "taumaturgo") cantripsLimit += 1;
    if (char.class === "druida" && cfc["druida:ordemPrimal"] === "xama") cantripsLimit += 1;
    cantripsRequired = cantripsLimit;

    const classSpells = spellsByClassId[char.class] ?? [];
    cantripsOptions = classSpells.filter((s) => s.level === 0).map((s) => s.id);

    // Spells
    const abilityMap: Record<string, AbilityKey> = {
      Força: "str", Destreza: "dex", Constituição: "con",
      Inteligência: "int", Sabedoria: "wis", Carisma: "cha",
    };
    const scKey = abilityMap[sc.ability] ?? null;
    const finalScores = getFinalAbilityScores(
      char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses
    );
    const scMod = scKey ? calcAbilityMod(finalScores[scKey]) : 0;

    if (sc.type === "prepared") {
      spellsRequired = Math.max(1, scMod + char.level);
    } else if (sc.type === "known" || sc.type === "pact") {
      const knownTable = (sc as any).spellsKnownAtLevel as Record<number, number> | undefined;
      if (knownTable) {
        for (let l = char.level; l >= 1; l--) {
          if (knownTable[l] !== undefined) { spellsRequired = knownTable[l]; break; }
        }
      }
    }

    const maxCircle = Math.min(2, char.level);
    spellsOptions = classSpells
      .filter((s) => s.level >= 1 && s.level <= maxCircle)
      .map((s) => s.id);
  }

  const cantripsPending = Math.max(0, cantripsRequired - cantripsChosen.length);
  const spellsPending = Math.max(0, spellsRequired - spellsChosen.length);

  const needsStep =
    cantripsPending > 0 ||
    spellsPending > 0 ||
    langPendingCount > 0 ||
    toolPendingCount > 0;

  return {
    needsStep,
    languages: {
      requiredCount: langPendingCount,
      pendingCount: langPendingCount,
      placeholders: languagePlaceholders,
    },
    tools: {
      requiredCount: toolPendingCount,
      pendingCount: toolPendingCount,
      placeholders: toolPlaceholders,
    },
    cantrips: {
      requiredCount: cantripsRequired,
      chosenSpellIds: cantripsChosen,
      options: cantripsOptions,
      pendingCount: cantripsPending,
    },
    spells: {
      requiredCount: spellsRequired,
      chosenSpellIds: spellsChosen,
      options: spellsOptions,
      pendingCount: spellsPending,
    },
  };
}
