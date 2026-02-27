import type { CharacterState } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { spellsByClassId } from "@/data/indexes";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";

export interface ChoicesRequirements {
  needsStep: boolean;
  skills: {
    requiredCount: number;
    chosenIds: string[];
    options: { id: string; name: string; source: string }[];
    pendingCount: number;
  };
  languages: {
    /** Number of unresolved language placeholders (e.g. "Um idioma adicional à sua escolha") */
    requiredCount: number;
    pendingCount: number;
    placeholders: string[];
  };
  tools: {
    /** Number of unresolved tool/instrument placeholders (e.g. "Um instrumento musical à sua escolha") */
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

function getPlaceholders(list: string[] | undefined, kind: "language" | "tool"): string[] {
  const src = list ?? [];
  if (kind === "language") {
    return src.filter((s) => PLACEHOLDER_RX.test(s) && LANGUAGE_HINT_RX.test(s));
  }
  // tool/instrument/game
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

  // ── Skills ──
  let skillsRequired = 0;
  const skillsChosen = char.classSkillChoices ?? [];
  let skillsOptions: { id: string; name: string; source: string }[] = [];

  if (cls?.skillChoices) {
    skillsRequired = cls.skillChoices.choose;
    if (Array.isArray(cls.skillChoices.from)) {
      skillsOptions = cls.skillChoices.from.map((id) => ({ id, name: id, source: "Classe" }));
    }
  }

  const skillsPending = Math.max(0, skillsRequired - skillsChosen.length);

  // ── Languages / Tools (generic placeholders) ──
  // The sources (race/background/class/feat) ultimately materialize into `char.proficiencies`.
  // We detect unresolved placeholders in the current state. This keeps the engine generic
  // without hardcoding lists that would diverge from the book.
  const languagePlaceholders = getPlaceholders(char.proficiencies?.languages, "language");
  const toolPlaceholders = getPlaceholders(char.proficiencies?.tools, "tool");

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
    // Special cases encoded in class features choices (kept as-is)
    const cfc = char.classFeatureChoices ?? {};
    if (char.class === "clerigo" && cfc["clerigo:ordemDivina"] === "taumaturgo") cantripsLimit += 1;
    if (char.class === "druida" && cfc["druida:ordemPrimal"] === "xama") cantripsLimit += 1;
    cantripsRequired = cantripsLimit;

    const classSpells = spellsByClassId[char.class] ?? [];
    cantripsOptions = classSpells.filter((s) => s.level === 0).map((s) => s.id);

    // Spells
    const abilityMap: Record<string, AbilityKey> = {
      Força: "str",
      Destreza: "dex",
      Constituição: "con",
      Inteligência: "int",
      Sabedoria: "wis",
      Carisma: "cha",
    };
    const scKey = abilityMap[sc.ability] ?? null;
    const finalScores = getFinalAbilityScores(
      char.abilityScores,
      char.racialBonuses,
      char.backgroundBonuses,
      char.asiBonuses,
      char.featAbilityBonuses
    );
    const scMod = scKey ? calcAbilityMod(finalScores[scKey]) : 0;

    if (sc.type === "prepared") {
      spellsRequired = Math.max(1, scMod + char.level);
    } else if (sc.type === "known" || sc.type === "pact") {
      const knownTable = (sc as any).spellsKnownAtLevel as Record<number, number> | undefined;
      if (knownTable) {
        for (let l = char.level; l >= 1; l--) {
          if (knownTable[l] !== undefined) {
            spellsRequired = knownTable[l];
            break;
          }
        }
      }
    }

    const maxCircle = Math.min(2, char.level); // start level 1–2 only
    spellsOptions = classSpells
      .filter((s) => s.level >= 1 && s.level <= maxCircle)
      .map((s) => s.id);
  }

  const cantripsPending = Math.max(0, cantripsRequired - cantripsChosen.length);
  const spellsPending = Math.max(0, spellsRequired - spellsChosen.length);

  const needsStep =
    skillsPending > 0 ||
    cantripsPending > 0 ||
    spellsPending > 0 ||
    languagePlaceholders.length > 0 ||
    toolPlaceholders.length > 0;

  return {
    needsStep,
    skills: {
      requiredCount: skillsRequired,
      chosenIds: skillsChosen,
      options: skillsOptions,
      pendingCount: skillsPending,
    },
    languages: {
      requiredCount: languagePlaceholders.length,
      pendingCount: languagePlaceholders.length,
      placeholders: languagePlaceholders,
    },
    tools: {
      requiredCount: toolPlaceholders.length,
      pendingCount: toolPlaceholders.length,
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
