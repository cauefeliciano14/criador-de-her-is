import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recalcDerivedStats, type AbilityKey, ABILITIES } from "@/utils/calculations";
import type { InventoryEntry, EquippedState, AttackEntry } from "@/data/items";

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

const DEFAULT_ABILITY_GEN: AbilityGeneration = {
  method: null,
  rolls: null,
  rollResults: null,
  pointBuyRemaining: 27,
  standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
  confirmed: false,
};

const DEFAULT_SCORES: Record<AbilityKey, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
const DEFAULT_RACIAL: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
const DEFAULT_BG_BONUSES: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

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
  backgroundBonuses: Record<AbilityKey, number>;
  backgroundAbilityChoices: Partial<Record<AbilityKey, number>>;
  abilityMods: Record<AbilityKey, number>;
  proficiencyBonus: number;
  savingThrows: string[];
  skills: string[];
  classSkillChoices: string[];
  classEquipmentChoice: string | null;
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };
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
}

const DEFAULT_CHARACTER: CharacterState = {
  name: "",
  level: 1,
  race: null,
  subrace: null,
  class: null,
  subclass: null,
  background: null,
  abilityGeneration: { ...DEFAULT_ABILITY_GEN },
  abilityScores: { ...DEFAULT_SCORES },
  racialBonuses: { ...DEFAULT_RACIAL },
  raceAbilityChoices: {},
  backgroundBonuses: { ...DEFAULT_BG_BONUSES },
  backgroundAbilityChoices: {},
  abilityMods: { str: -1, dex: -1, con: -1, int: -1, wis: -1, cha: -1 },
  proficiencyBonus: 2,
  savingThrows: [],
  skills: [],
  classSkillChoices: [],
  classEquipmentChoice: null,
  proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
  hitDie: 8,
  hitPoints: { max: 8, current: 8 },
  armorClass: 10,
  speed: 9,
  features: [],
  spells: {
    cantrips: [],
    prepared: [],
    slots: [],
    spellcastingAbility: null,
    spellSaveDC: 0,
    spellAttackBonus: 0,
  },
  equipment: [],
  inventory: [],
  equipped: { armor: null, shield: null, weapons: [] },
  gold: { gp: 0 },
  attacks: [],
};

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
        set({ [key]: value } as Partial<CharacterState>);
        const updated = { ...get(), [key]: value };
        const derived = recalcDerivedStats(updated);
        set(derived as Partial<CharacterState & CharacterActions>);
      },
      patchCharacter: (partial) => {
        set(partial as Partial<CharacterState & CharacterActions>);
        const updated = { ...get(), ...partial };
        const derived = recalcDerivedStats(updated);
        set(derived as Partial<CharacterState & CharacterActions>);
      },
      recalc: () => {
        const derived = recalcDerivedStats(get());
        set(derived as Partial<CharacterState & CharacterActions>);
      },
      resetCharacter: () => set({ ...DEFAULT_CHARACTER }),
      resetAbilities: () => {
        set({
          abilityGeneration: { ...DEFAULT_ABILITY_GEN },
          abilityScores: { ...DEFAULT_SCORES },
        } as Partial<CharacterState & CharacterActions>);
        const updated = { ...get(), abilityScores: { ...DEFAULT_SCORES }, abilityGeneration: { ...DEFAULT_ABILITY_GEN } };
        const derived = recalcDerivedStats(updated);
        set(derived as Partial<CharacterState & CharacterActions>);
      },
    }),
    { name: "dnd-character-2024" }
  )
);

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
