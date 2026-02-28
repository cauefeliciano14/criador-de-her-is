import { classes } from "@/data/classes";
import type { SpellData } from "@/data/spells";

const DISPLAY_TO_ID: Record<string, string> = {
  Bardo: "bardo",
  Bruxo: "bruxo",
  Clérigo: "clerigo",
  Druida: "druida",
  Feiticeiro: "feiticeiro",
  Guardião: "guardiao",
  Mago: "mago",
  Paladino: "paladino",
};

const ID_TO_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.entries(DISPLAY_TO_ID).map(([display, id]) => [id, display])
);

const SPELLCASTING_CLASS_IDS = new Set(
  classes.filter((cls) => cls.spellcasting !== null).map((cls) => cls.id)
);

const FALLBACK_LIMITS_AT_1: Record<string, { cantrips: number; prepared: number }> = {
  bardo: { cantrips: 2, prepared: 4 },
  clerigo: { cantrips: 3, prepared: 4 },
  druida: { cantrips: 2, prepared: 4 },
  feiticeiro: { cantrips: 4, prepared: 2 },
  bruxo: { cantrips: 2, prepared: 2 },
  guardiao: { cantrips: 0, prepared: 2 },
  mago: { cantrips: 3, prepared: 4 },
  paladino: { cantrips: 0, prepared: 2 },
};

function normalizeClassToken(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function getSelectedClassId(character: { class?: string | null } | null | undefined): string | null {
  if (!character?.class) return null;
  return normalizeClassToken(character.class) || null;
}

export function isSpellcastingClass(classId: string | null | undefined): boolean {
  if (!classId) return false;
  return SPELLCASTING_CLASS_IDS.has(normalizeClassToken(classId));
}

function extractSpellClassTokens(spell: SpellData): string[] {
  const sources = [
    spell.classes,
    (spell as any).classIds,
    (spell as any).classList,
    (spell as any).availableFor,
    (spell as any).availableClasses,
  ];

  return sources
    .filter(Array.isArray)
    .flat()
    .map((token) => normalizeClassToken(String(token)))
    .filter(Boolean);
}

export function spellMatchesClass(spell: SpellData, classId: string | null | undefined): boolean {
  if (!classId) return false;
  const normalizedClassId = normalizeClassToken(classId);
  if (!normalizedClassId) return false;

  const spellTokens = extractSpellClassTokens(spell);
  if (spellTokens.length === 0) return false;

  return spellTokens.some((token) => {
    if (token === normalizedClassId) return true;
    return DISPLAY_TO_ID[tokenToDisplay(token)] === normalizedClassId;
  });
}

function tokenToDisplay(token: string): string {
  const fromId = ID_TO_DISPLAY[token];
  if (fromId) return fromId;

  const entry = Object.entries(DISPLAY_TO_ID).find(([display]) => normalizeClassToken(display) === token);
  return entry?.[0] ?? token;
}

export function filterSpellsByClass(spells: SpellData[], classId: string | null | undefined): SpellData[] {
  if (!classId) return [];
  return spells.filter((spell) => spellMatchesClass(spell, classId));
}

export function formatSpellClassesForDisplay(spell: SpellData): string[] {
  const displayNames = extractSpellClassTokens(spell)
    .map((token) => ID_TO_DISPLAY[token] ?? tokenToDisplay(token))
    .filter(Boolean);

  return [...new Set(displayNames)].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function getSpellLimitsAtLevel1(classId: string | null | undefined): { cantrips: number; prepared: number } {
  const normalizedClassId = normalizeClassToken(classId);
  if (!normalizedClassId) return { cantrips: 0, prepared: 0 };
  return FALLBACK_LIMITS_AT_1[normalizedClassId] ?? { cantrips: 0, prepared: 0 };
}
