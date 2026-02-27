import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { type AbilityKey, ABILITIES } from "@/utils/calculations";
import { recalcAll, type SkillMod, type SaveMod, type RulesWarning } from "@/rules/engine/recalcAll";
import type { InventoryEntry, EquippedState, AttackEntry } from "@/data/items";
import type { DragonbornHeritageId, ElfLineageId, GnomeLineageId, GiantAncestryId, InfernalLegacyId } from "@/data/races";
import { perfTime } from "@/utils/perf";

// ── Types ──

export type AbilityMethod = "standard" | "pointBuy" | "roll" | null;

export interface AbilityGeneration {
  method: AbilityMethod;
  rolls: number[][] | null;
  rollResults: number[] | null;
  pointBuyRemaining: number;
  standardAssignments: Record<AbilityKey, number | null>;
  rollAssignments: Record<AbilityKey, number | null>;
  confirmed: boolean;
}

export interface NormalizedFeature {
  sourceType: "race" | "subrace" | "class" | "subclass" | "background" | "other";
  sourceId: string;
  name: string;
  description: string;
  level?: number;
  tags?: string[];
}

export interface LevelingChangeSummary {
  type: "feature" | "hp" | "spell" | "prof" | "asi" | "subclass";
  label: string;
  details: string;
}

export interface ASIOrFeatChoice {
  type: "asi" | "feat";
  featId?: string;
  asi?: Partial<Record<AbilityKey, number>>;
}

export interface LevelingState {
  pending: boolean;
  fromLevel: number;
  toLevel: number;
  hpMethod: "average" | "roll" | null;
  hpRolls: Record<number, number>;
  choices: {
    subclassId: string | null;
    asiOrFeat: Record<number, ASIOrFeatChoice>;
  };
  changesSummary: LevelingChangeSummary[];
}

// ── Defaults ──

const DEFAULT_ABILITY_GEN: AbilityGeneration = {
  method: null, rolls: null, rollResults: null, pointBuyRemaining: 27,
  standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  confirmed: false,
};

const DEFAULT_SCORES: Record<AbilityKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const DEFAULT_RACIAL: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
const DEFAULT_BG_BONUSES: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
const DEFAULT_ASI_BONUSES: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

const DEFAULT_LEVELING: LevelingState = {
  pending: false, fromLevel: 1, toLevel: 1, hpMethod: null, hpRolls: {},
  choices: { subclassId: null, asiOrFeat: {} }, changesSummary: [],
};

export interface AppliedFeat {
  featId: string;
  levelTaken: number;
  source: "levelUp" | "background";
  choices?: { abilityIncreases?: Partial<Record<AbilityKey, number>> };
}

export interface RaceChoicesState {
  dragonbornHeritage?: DragonbornHeritageId;
  elfLineage?: ElfLineageId;
  gnomeLineage?: GnomeLineageId;
  giantAncestry?: GiantAncestryId;
  infernalLegacy?: InfernalLegacyId;
  raceChoice?: { kind: string; optionId: string };
}

export interface CharacterState {
  name: string;
  level: number;
  race: string | null;
  subrace: string | null;
  class: string | null;
  subclass: string | null;
  background: string | null;
  abilityGeneration: AbilityGeneration;
  abilityScores: Record<AbilityKey, number>;
  racialBonuses: Record<AbilityKey, number>;
  raceAbilityChoices: Partial<Record<AbilityKey, number>>;
  raceChoices: RaceChoicesState;
  backgroundBonuses: Record<AbilityKey, number>;
  backgroundAbilityChoices: Partial<Record<AbilityKey, number>>;
  asiBonuses: Record<AbilityKey, number>;
  abilityMods: Record<AbilityKey, number>;
  proficiencyBonus: number;
  savingThrows: string[];
  skills: string[];
  classSkillChoices: string[];
  classEquipmentChoice: string | null;
  proficiencies: { armor: string[]; weapons: string[]; tools: string[]; languages: string[] };
  hitDie: number;
  hitPoints: { max: number; current: number };
  armorClass: number;
  speed: number;
  features: NormalizedFeature[];
  spells: {
    cantrips: string[];
    prepared: string[];
    slots: number[];
    spellcastingAbility: string | null;
    spellSaveDC: number;
    spellAttackBonus: number;
  };
  equipment: string[];
  inventory: InventoryEntry[];
  equipped: EquippedState;
  gold: { gp: number };
  attacks: AttackEntry[];
  appliedFeats: AppliedFeat[];
  featAbilityBonuses: Record<AbilityKey, number>;
  flags: Record<string, number | boolean>;
  classFeatureChoices: Record<string, string | string[]>;
  expertiseSkills: string[];
  skillMods: Record<string, SkillMod>;
  saveMods: Record<AbilityKey, SaveMod>;
  warnings: RulesWarning[];
  leveling: LevelingState;
}

const DEFAULT_CHARACTER: CharacterState = {
  name: "", level: 1, race: null, subrace: null, class: null, subclass: null, background: null,
  abilityGeneration: { ...DEFAULT_ABILITY_GEN },
  abilityScores: { ...DEFAULT_SCORES },
  racialBonuses: { ...DEFAULT_RACIAL },
  raceAbilityChoices: {},
  raceChoices: {},
  backgroundBonuses: { ...DEFAULT_BG_BONUSES },
  backgroundAbilityChoices: {},
  asiBonuses: { ...DEFAULT_ASI_BONUSES },
  abilityMods: { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 },
  proficiencyBonus: 2,
  savingThrows: [], skills: [], classSkillChoices: [], classEquipmentChoice: null,
  proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
  hitDie: 8,
  hitPoints: { max: 8, current: 8 },
  armorClass: 10, speed: 9,
  features: [],
  spells: { cantrips: [], prepared: [], slots: [], spellcastingAbility: null, spellSaveDC: 0, spellAttackBonus: 0 },
  equipment: [], inventory: [],
  equipped: { armor: null, shield: null, weapons: [] },
  gold: { gp: 0 }, attacks: [],
  appliedFeats: [],
  featAbilityBonuses: { ...DEFAULT_ASI_BONUSES },
  flags: {}, classFeatureChoices: {}, expertiseSkills: [],
  skillMods: {},
  saveMods: {} as Record<AbilityKey, SaveMod>,
  warnings: [],
  leveling: { ...DEFAULT_LEVELING },
};

// ── Throttled localStorage storage ──

function createThrottledStorage(key: string, throttleMs = 1000) {
  let pendingWrite: ReturnType<typeof setTimeout> | null = null;
  let latestValue: string | null = null;

  const flushNow = () => {
    if (latestValue !== null) {
      try { localStorage.setItem(key, latestValue); } catch { /* quota exceeded */ }
      latestValue = null;
    }
    if (pendingWrite) { clearTimeout(pendingWrite); pendingWrite = null; }
  };

  return {
    getItem: (name: string): StorageValue<CharacterState & CharacterActions> | null => {
      const raw = localStorage.getItem(name);
      return raw ? JSON.parse(raw) : null;
    },
    setItem: (name: string, value: StorageValue<CharacterState & CharacterActions>) => {
      latestValue = JSON.stringify(value);
      if (!pendingWrite) {
        pendingWrite = setTimeout(flushNow, throttleMs);
      }
    },
    removeItem: (name: string) => {
      flushNow();
      localStorage.removeItem(name);
    },
    /** Force immediate write (e.g. before unload) */
    flush: flushNow,
  };
}

const throttledStorage = createThrottledStorage("dnd-character-2024");

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => throttledStorage.flush());
}

// ── Instrumented recalc ──

function instrumentedRecalc(char: CharacterState) {
  return perfTime("recalcAll", () => recalcAll(char));
}

// ── Store ──

interface CharacterActions {
  setField: <K extends keyof CharacterState>(key: K, value: CharacterState[K]) => void;
  patchCharacter: (partial: Partial<CharacterState>) => void;
  recalc: () => void;
  resetCharacter: () => void;
  resetAbilities: () => void;
}

export const useCharacterStore = create<CharacterState & CharacterActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CHARACTER,
      setField: (key, value) => {
        const updated = { ...get(), [key]: value };
        const derived = instrumentedRecalc(updated);
        set({ [key]: value, ...derived } as Partial<CharacterState & CharacterActions>);
      },
      patchCharacter: (partial) => {
        const updated = { ...get(), ...partial };
        const derived = instrumentedRecalc(updated);
        set({ ...partial, ...derived } as Partial<CharacterState & CharacterActions>);
      },
      recalc: () => {
        const derived = instrumentedRecalc(get());
        set(derived as Partial<CharacterState & CharacterActions>);
      },
      resetCharacter: () => set({ ...DEFAULT_CHARACTER }),
      resetAbilities: () => {
        const updated = { ...get(), abilityScores: { ...DEFAULT_SCORES }, abilityGeneration: { ...DEFAULT_ABILITY_GEN } };
        const derived = instrumentedRecalc(updated);
        set({
          abilityGeneration: { ...DEFAULT_ABILITY_GEN },
          abilityScores: { ...DEFAULT_SCORES },
          ...derived,
        } as Partial<CharacterState & CharacterActions>);
      },
    }),
    {
      name: "dnd-character-2024",
      storage: throttledStorage,
    }
  )
);

// ── Helpers ──

/** Merge arrays with unique values */
export function mergeUnique<T>(...arrays: T[][]): T[] {
  return [...new Set(arrays.flat())];
}

/** Remove features by sourceType, then add new ones */
export function replaceFeatures(
  current: NormalizedFeature[],
  removeTypes: Array<"race" | "subrace" | "class" | "subclass" | "background">,
  add: NormalizedFeature[]
): NormalizedFeature[] {
  const filtered = current.filter((f) => !removeTypes.includes(f.sourceType as any));
  return [...filtered, ...add];
}
