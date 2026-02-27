/**
 * Pre-built indexes for fast filtering of spells and items.
 * Built once at module load time — no repeated computation.
 */
import { spells, type SpellData } from "./spells";
import { classes } from "./classes";
import { items, type Item } from "./items";

// ── Spell indexes ──

/** Spells grouped by class name */
export const spellsByClassName: Record<string, SpellData[]> = {};

/** Spells grouped by class id (canonical for app state) */
export const spellsByClassId: Record<string, SpellData[]> = {};

/** Spells grouped by level (0 = cantrips) */
export const spellsByLevel: Record<number, SpellData[]> = {};

/** Spells grouped by school */
export const spellsBySchool: Record<string, SpellData[]> = {};

// Build spell indexes

const classNameToId: Record<string, string> = Object.fromEntries(
  classes.map((c) => [c.name, c.id])
);

for (const spell of spells) {
  // By class
  for (const cls of spell.classes) {
    (spellsByClassName[cls] ??= []).push(spell);
    const classId = classNameToId[cls];
    if (classId) (spellsByClassId[classId] ??= []).push(spell);
  }
  // By level
  (spellsByLevel[spell.level] ??= []).push(spell);
  // By school
  (spellsBySchool[spell.school] ??= []).push(spell);
}

/** Get spells available to a class, optionally filtered by max level */
export function getSpellsForClass(className: string, maxLevel?: number): SpellData[] {
  const classSpells = spellsByClassName[className] ?? [];
  if (maxLevel === undefined) return classSpells;
  return classSpells.filter((s) => s.level <= maxLevel);
}



 /** Get spells available to a class id (canonical), optionally filtered by max level */
export function getSpellsForClassId(classId: string, maxLevel?: number): SpellData[] {
  const classSpells = spellsByClassId[classId] ?? [];
  if (maxLevel === undefined) return classSpells;
  return classSpells.filter((s) => s.level <= maxLevel);
}

// ── Item indexes ──

/** Items grouped by type */
export const itemsByType: Record<string, Item[]> = {};

/** Items grouped by category */
export const itemsByCategory: Record<string, Item[]> = {};

// Build item indexes
for (const item of items) {
  (itemsByType[item.type] ??= []).push(item);
  (itemsByCategory[item.category] ??= []).push(item);
}

/** Get unique item categories */
export const itemCategories: string[] = Object.keys(itemsByCategory).sort((a, b) =>
  a.localeCompare(b, "pt-BR")
);

/** Get unique item types */
export const itemTypes: string[] = Object.keys(itemsByType).sort((a, b) =>
  a.localeCompare(b, "pt-BR")
);