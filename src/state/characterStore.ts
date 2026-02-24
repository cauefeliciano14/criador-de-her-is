import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recalcDerivedStats, type AbilityKey } from "@/utils/calculations";

export interface CharacterState {
  name: string;
  level: number;
  race: string | null;
  subrace: string | null;
  class: string | null;
  subclass: string | null;
  background: string | null;
  abilityMethod: "standard-array" | "point-buy" | null;
  abilityScores: Record<AbilityKey, number>;
  abilityMods: Record<AbilityKey, number>;
  proficiencyBonus: number;
  savingThrows: string[];
  skills: string[];
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
  features: { name: string; description: string }[];
  spells: {
    cantrips: string[];
    prepared: string[];
    slots: number[];
    spellcastingAbility: string | null;
    spellSaveDC: number;
    spellAttackBonus: number;
  };
  equipment: string[];
}

const DEFAULT_CHARACTER: CharacterState = {
  name: "",
  level: 1,
  race: null,
  subrace: null,
  class: null,
  subclass: null,
  background: null,
  abilityMethod: null,
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  proficiencyBonus: 2,
  savingThrows: [],
  skills: [],
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
};

interface CharacterActions {
  setField: <K extends keyof CharacterState>(key: K, value: CharacterState[K]) => void;
  patchCharacter: (partial: Partial<CharacterState>) => void;
  recalc: () => void;
  resetCharacter: () => void;
}

export const useCharacterStore = create<CharacterState & CharacterActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CHARACTER,
      setField: (key, value) => {
        set({ [key]: value } as Partial<CharacterState>);
        // auto recalc
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
    }),
    { name: "dnd-character-2024" }
  )
);
