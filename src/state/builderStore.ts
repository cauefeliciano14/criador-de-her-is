import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getChoicesRequirements } from "@/utils/choices";
import { useCharacterStore } from "./characterStore";
import type { ChoicesRequirements } from "@/utils/choices";

export type StepId =
  | "class"
  | "origin"
  | "race"
  | "abilities"
  | "equipment"
  | "choices"
  | "sheet";

export interface StepDef {
  id: StepId;
  num: number;
  label: string;
}

const BASE_STEPS: StepDef[] = [
  { id: "class", num: 1, label: "Classe" },
  { id: "origin", num: 2, label: "Origem" },
  { id: "race", num: 3, label: "Raça" },
  { id: "abilities", num: 4, label: "Geração de Atributos" },
  { id: "equipment", num: 5, label: "Equipamentos" },
  { id: "choices", num: 6, label: "Escolhas" },
  { id: "sheet", num: 7, label: "Ficha" },
];

export const STEPS: StepDef[] = BASE_STEPS;

interface BuilderState {
  currentStep: StepId;
  completedSteps: StepId[];
  requiredMissing: Record<string, string[]>;
  choicesRequirements: ChoicesRequirements | null;
  lastSavedAt: string | null;
  goToStep: (step: StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: StepId) => void;
  uncompleteStep: (step: StepId) => void;
  setMissing: (step: StepId, items: string[]) => void;
  resetBuilder: () => void;
  getVisibleSteps: () => StepDef[];
  updateChoicesRequirements: () => void;
}

const DEFAULT_BUILDER = {
  currentStep: "class" as StepId,
  completedSteps: [] as StepId[],
  requiredMissing: {} as Record<string, string[]>,
  choicesRequirements: null as ChoicesRequirements | null,
  lastSavedAt: null as string | null,
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_BUILDER,
      goToStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const s = get();
        const steps = s.getVisibleSteps();
        const idx = steps.findIndex((st) => st.id === s.currentStep);
        if (idx < steps.length - 1) set({ currentStep: steps[idx + 1].id });
      },
      prevStep: () => {
        const s = get();
        const steps = s.getVisibleSteps();
        const idx = steps.findIndex((st) => st.id === s.currentStep);
        if (idx > 0) set({ currentStep: steps[idx - 1].id });
      },
      completeStep: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step],
          lastSavedAt: new Date().toISOString(),
        })),
      uncompleteStep: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.filter((st) => st !== step),
        })),
      setMissing: (step, items) =>
        set((s) => ({
          requiredMissing: { ...s.requiredMissing, [step]: items },
        })),
      resetBuilder: () => set({ ...DEFAULT_BUILDER }),
      getVisibleSteps: () => STEPS,
      updateChoicesRequirements: () => {
        const character = useCharacterStore.getState();
        const requirements = getChoicesRequirements(character);
        set({ choicesRequirements: requirements });
      },
    }),
    { name: "dnd-builder-ui-2024" }
  )
);
