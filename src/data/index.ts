/**
 * Centralized data index.
 * All datasets are exported here with lookup maps for cross-referencing.
 */

// ── Raw data ──
export { classes, classesById, type ClassData, type SubclassData, type SpellcastingData, type EquipmentChoice } from "./classes";
export { races, racesById, type RaceData, type Subrace, type RaceTrait } from "./races";
export { backgrounds, backgroundsById, type Background, type OriginFeat } from "./backgrounds";
export { spells, getSpellSchools, type SpellData } from "./spells";
export { items, itemsById, type Item, type AttackEntry, type InventoryEntry, type EquippedState } from "./items";
export { feats, featsById, type FeatData, type FeatPrerequisite, type FeatEffects } from "./feats";
export { skills, skillsById, skillsByName, type SkillData } from "./skills";
export { sources, sourcesById, type Source } from "./sources";

// ── Pre-built indexes for fast filtering ──
export {
  spellsByClassName, spellsByLevel, spellsBySchool, getSpellsForClass,
  itemsByType, itemsByCategory, itemCategories, itemTypes,
} from "./indexes";

// ── Validation (dev only) ──
import { validateAllData, logValidation } from "@/utils/validateData";
import { classes } from "./classes";
import { races } from "./races";
import { backgrounds } from "./backgrounds";
import { spells } from "./spells";
import { items } from "./items";
import { feats } from "./feats";

if (import.meta.env.DEV) {
  const issues = validateAllData({ classes, races, backgrounds, spells, items, feats });
  logValidation(issues);
}
