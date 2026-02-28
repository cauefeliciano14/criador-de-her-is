import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { type AbilityKey } from "@/utils/calculations";
import { recalcAll, type SkillMod, type SaveMod, type RulesWarning } from "@/rules/engine/recalcAll";
import type { InventoryEntry, EquippedState, AttackEntry } from "@/data/items";
import { perfTime } from "@/utils/perf";
import { getChoicesRequirements } from "@/utils/choices";
import { toast } from "@/hooks/use-toast";
import { commonLanguages } from "@/data/languagesCommon";

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

export type RaceChoicesState = Record<string, string>;

export interface ChoiceSelectionsState {
  classSkills: string[];
  languages: string[];
  tools: string[];
  instruments: string[];
  cantrips: string[];
  spells: string[];
  raceChoice: string | null;
  classFeats: string[];
  /** @deprecated legacy key */
  skills?: string[];
}

export interface CharacterState {
  lastSavedAt: string | null;
  persistError: string | null;
  name: string;
  level: number;
  race: string | null;
  raceLineage: string | null;
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
  backgroundEquipmentChoice: string | null;
  backgroundEquipmentItems: string[];
  backgroundGold: number;
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
  selectedCantrips: string[];
  selectedSpells: string[];
  equipment: string[];
  inventory: InventoryEntry[];
  equipped: EquippedState;
  gold: { gp: number };
  attacks: AttackEntry[];
  appliedFeats: AppliedFeat[];
  featAbilityBonuses: Record<AbilityKey, number>;
  flags: Record<string, number | boolean>;
  classFeatureChoices: Record<string, string | string[]>;
  choiceSelections: ChoiceSelectionsState;
  expertiseSkills: string[];
  skillMods: Record<string, SkillMod>;
  saveMods: Record<AbilityKey, SaveMod>;
  warnings: RulesWarning[];
  leveling: LevelingState;
}

const DEFAULT_CHARACTER: CharacterState = {
  lastSavedAt: null,
  persistError: null,
  name: "", level: 1, race: null, raceLineage: null, subrace: null, class: null, subclass: null, background: null,
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
  savingThrows: [], skills: [], classSkillChoices: [], classEquipmentChoice: null, backgroundEquipmentChoice: null,
  backgroundEquipmentItems: [],
  backgroundGold: 0,
  proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
  hitDie: 8,
  hitPoints: { max: 8, current: 8 },
  armorClass: 10, speed: 9,
  features: [],
  spells: { cantrips: [], prepared: [], slots: [], spellcastingAbility: null, spellSaveDC: 0, spellAttackBonus: 0 },
  selectedCantrips: [],
  selectedSpells: [],
  equipment: [], inventory: [],
  equipped: { armor: null, shield: null, weapons: [] },
  gold: { gp: 0 }, attacks: [],
  appliedFeats: [],
  featAbilityBonuses: { ...DEFAULT_ASI_BONUSES },
  flags: {}, classFeatureChoices: {},
  choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
  expertiseSkills: [],
  skillMods: {},
  saveMods: {} as Record<AbilityKey, SaveMod>,
  warnings: [],
  leveling: { ...DEFAULT_LEVELING },
};

// ── Throttled localStorage storage ──

function createThrottledStorage(key: string, throttleMs = 1000) {
  let pendingWrite: ReturnType<typeof setTimeout> | null = null;
  let latestValue: string | null = null;
  let hasPersistedSnapshot = false;

  const setPersistError = (message: string | null) => {
    useCharacterStore.setState({ persistError: message });
  };

  const recordSaveSuccess = () => {
    useCharacterStore.setState({ persistError: null });
  };

  const flushNow = () => {
    if (latestValue !== null) {
      try {
        localStorage.setItem(key, latestValue);
        recordSaveSuccess();
      } catch {
        setPersistError("Não foi possível salvar automaticamente (espaço do navegador esgotado). Libere armazenamento e tente novamente.");
      }
      latestValue = null;
    }
    if (pendingWrite) { clearTimeout(pendingWrite); pendingWrite = null; }
  };

  return {
    getItem: (name: string): StorageValue<CharacterState & CharacterActions> | null => {
      const raw = localStorage.getItem(name);
      hasPersistedSnapshot = Boolean(raw);
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
    hasPersistedSnapshot: () => hasPersistedSnapshot,
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


function sanitizeChoiceSelections(char: CharacterState): CharacterState {
  const req = getChoicesRequirements(char);
  const buckets = req.buckets;
  const nextSelections = {
    classSkills: buckets.classSkills.selectedIds,
    languages: buckets.languages.selectedIds,
    tools: buckets.tools.selectedIds,
    instruments: buckets.instruments.selectedIds,
    cantrips: buckets.cantrips.selectedIds,
    spells: buckets.spells.selectedIds,
    raceChoice: buckets.raceChoice.selectedIds[0] ?? null,
    classFeats: buckets.classFeats.selectedIds,
  };

  const commonLanguageNamesById = new Map(commonLanguages.map((lang) => [lang.id, lang.name] as const));
  const selectedLanguageNames = nextSelections.languages
    .map((id) => commonLanguageNamesById.get(id))
    .filter(Boolean) as string[];
  const fixedKnownLanguages = (char.proficiencies.languages ?? []).filter((language) => !/idioma.+escolha/i.test(language));
  const ensuredCommon = ["Comum", ...fixedKnownLanguages];
  const nextKnownLanguages = mergeUnique(ensuredCommon, selectedLanguageNames);

  return {
    ...char,
    choiceSelections: nextSelections,
    classSkillChoices: nextSelections.classSkills,
    raceLineage: nextSelections.raceChoice,
    selectedCantrips: nextSelections.cantrips,
    selectedSpells: nextSelections.spells,
    proficiencies: { ...char.proficiencies, languages: nextKnownLanguages },
    spells: { ...char.spells, cantrips: nextSelections.cantrips, prepared: nextSelections.spells },
  };
}

// ── Store ──

interface CharacterActions {
  setField: <K extends keyof CharacterState>(key: K, value: CharacterState[K]) => void;
  patchCharacter: (partial: Partial<CharacterState>) => void;
  recalc: () => void;
  resetCharacter: () => void;
  resetAbilities: () => void;
  selectRace: (raceId: string | null) => void;
  selectRaceLineage: (lineageId: string | null) => void;
  toggleCantrip: (spellId: string) => void;
  toggleSpell: (spellId: string) => void;
}

function markSavedMeta(): Pick<CharacterState, "lastSavedAt" | "persistError"> {
  return {
    lastSavedAt: new Date().toISOString(),
    persistError: null,
  };
}

export const useCharacterStore = create<CharacterState & CharacterActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CHARACTER,
      setField: (key, value) => {
        if (Object.is(get()[key], value)) return;
        const updated = sanitizeChoiceSelections({ ...get(), [key]: value } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
      patchCharacter: (partial) => {
        const current = get();
        const hasChanges = Object.entries(partial).some(([key, value]) => !Object.is((current as any)[key], value));
        if (!hasChanges) return;
        const updated = sanitizeChoiceSelections({ ...get(), ...partial } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
      recalc: () => {
        const derived = instrumentedRecalc(sanitizeChoiceSelections(get() as CharacterState));
        set(derived as Partial<CharacterState & CharacterActions>);
      },
      resetCharacter: () => set({ ...DEFAULT_CHARACTER }),
      resetAbilities: () => {
        const updated = sanitizeChoiceSelections({ ...get(), abilityScores: { ...DEFAULT_SCORES }, abilityGeneration: { ...DEFAULT_ABILITY_GEN } } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({
          abilityGeneration: { ...DEFAULT_ABILITY_GEN },
          abilityScores: { ...DEFAULT_SCORES },
          ...derived,
          ...markSavedMeta(),
        } as Partial<CharacterState & CharacterActions>);
      },
      selectRace: (raceId) => {
        const current = get();
        const shouldClearLineage = raceId !== "elfo";
        const nextRaceChoices = shouldClearLineage
          ? Object.fromEntries(Object.entries(current.raceChoices).filter(([k]) => k !== "elvenLineage"))
          : current.raceChoices;
        const updated = sanitizeChoiceSelections({
          ...current,
          race: raceId,
          raceLineage: shouldClearLineage ? null : current.raceLineage,
          raceChoices: nextRaceChoices,
        } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
      selectRaceLineage: (lineageId) => {
        const current = get();
        const nextRaceChoices = lineageId
          ? { ...current.raceChoices, elvenLineage: lineageId }
          : Object.fromEntries(Object.entries(current.raceChoices).filter(([k]) => k !== "elvenLineage"));
        const updated = sanitizeChoiceSelections({
          ...current,
          raceLineage: lineageId,
          raceChoices: nextRaceChoices,
        } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
      toggleCantrip: (spellId) => {
        const current = get();
        const selected = new Set(current.spells.cantrips);
        if (selected.has(spellId)) selected.delete(spellId);
        else selected.add(spellId);
        const next = [...selected];
        const updated = sanitizeChoiceSelections({
          ...current,
          selectedCantrips: next,
          choiceSelections: {
            ...current.choiceSelections,
            cantrips: next,
          },
          spells: { ...current.spells, cantrips: next },
        } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
      toggleSpell: (spellId) => {
        const current = get();
        const selected = new Set(current.spells.prepared);
        if (selected.has(spellId)) selected.delete(spellId);
        else selected.add(spellId);
        const next = [...selected];
        const updated = sanitizeChoiceSelections({
          ...current,
          selectedSpells: next,
          choiceSelections: {
            ...current.choiceSelections,
            spells: next,
          },
          spells: { ...current.spells, prepared: next },
        } as CharacterState);
        const derived = instrumentedRecalc(updated);
        set({ ...updated, ...derived, ...markSavedMeta() } as Partial<CharacterState & CharacterActions>);
      },
    }),
    {
      name: "dnd-character-2024",
      version: 4,
      migrate: (persistedState: any, version) => {
        if (!persistedState || version >= 4) return persistedState;
        try {
          const legacy = persistedState as CharacterState;
          const old = legacy.choiceSelections as any;
          legacy.choiceSelections = {
            classSkills: old?.classSkills ?? old?.skills ?? legacy.classSkillChoices ?? [],
            languages: old?.languages ?? [],
            tools: old?.tools ?? [],
            instruments: old?.instruments ?? [],
            cantrips: old?.cantrips ?? legacy.spells?.cantrips ?? [],
            spells: old?.spells ?? legacy.spells?.prepared ?? [],
            raceChoice: old?.raceChoice ?? (legacy.raceChoices as any)?.raceChoice?.optionId ?? null,
            classFeats: old?.classFeats ?? [],
          };
          const legacyRaceState: any = legacy.raceChoices ?? {};
          const legacyRaceChoices: Record<string, string> = { ...(legacyRaceState ?? {}) };
          if (legacyRaceState?.dragonbornHeritage) legacyRaceChoices.draconicAncestry = legacyRaceState.dragonbornHeritage;
          if (legacyRaceState?.elfLineage) legacyRaceChoices.elvenLineage = legacyRaceState.elfLineage;
          if (legacyRaceState?.gnomeLineage) legacyRaceChoices.gnomishLineage = legacyRaceState.gnomeLineage;
          if (legacyRaceState?.giantAncestry) legacyRaceChoices.giantAncestry = legacyRaceState.giantAncestry;
          if (legacyRaceState?.infernalLegacy) legacyRaceChoices.infernalLegacy = legacyRaceState.infernalLegacy;
          if (legacyRaceState?.raceChoice?.kind && legacyRaceState?.raceChoice?.optionId) {
            legacyRaceChoices[legacyRaceState.raceChoice.kind] = legacyRaceState.raceChoice.optionId;
          }
          legacy.raceChoices = legacyRaceChoices;
          legacy.raceLineage = legacy.choiceSelections.raceChoice;
          legacy.selectedCantrips = legacy.choiceSelections.cantrips;
          legacy.selectedSpells = legacy.choiceSelections.spells;
          return legacy;
        } catch {
          return { ...DEFAULT_CHARACTER };
        }
      },
      storage: throttledStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Falha ao restaurar dados salvos. Verifique o armazenamento do navegador.");
          return;
        }

        if (state && throttledStorage.hasPersistedSnapshot()) {
          toast({
            title: "Sessão restaurada",
            description: "Continuando de onde você parou.",
          });
        }
      },
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
