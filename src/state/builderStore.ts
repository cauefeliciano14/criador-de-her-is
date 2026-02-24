import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StepId =
  | "ability-method"
  | "race"
  | "class"
  | "background"
  | "abilities"
  | "skills"
  | "spells"
  | "equipment"
  | "review";

export interface StepDef {
  id: StepId;
  num: number;
  label: string;
  conditional?: boolean; // e.g. spells only for casters
}

export const STEPS: StepDef[] = [
  { id: "ability-method", num: 1, label: "Método de Atributos" },
  { id: "race", num: 2, label: "Raça" },
  { id: "class", num: 3, label: "Classe" },
  { id: "background", num: 4, label: "Antecedente" },
  { id: "abilities", num: 5, label: "Atributos" },
  { id: "skills", num: 6, label: "Perícias & Proficiências" },
  { id: "spells", num: 7, label: "Magias", conditional: true },
  { id: "equipment", num: 8, label: "Equipamento" },
  { id: "review", num: 9, label: "Revisão Final" },
];

interface BuilderState {
  currentStep: StepId;
  completedSteps: StepId[];
  requiredMissing: Record<StepId, string[]>;
  lastSavedAt: string | null;
  // actions
  goToStep: (step: StepId) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: StepId) => void;
  uncompleteStep: (step: StepId) => void;
  setMissing: (step: StepId, items: string[]) => void;
  resetBuilder: () => void;
  getVisibleSteps: (isSpellcaster: boolean) => StepDef[];
}

const DEFAULT_BUILDER = {
  currentStep: "ability-method" as StepId,
  completedSteps: [] as StepId[],
  requiredMissing: {} as Record<StepId, string[]>,
  lastSavedAt: null as string | null,
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_BUILDER,
      goToStep: (step) => set({ currentStep: step }),
      nextStep: () => {
        const s = get();
        const steps = s.getVisibleSteps(true); // will be called with correct value
        const idx = steps.findIndex((st) => st.id === s.currentStep);
        if (idx < steps.length - 1) set({ currentStep: steps[idx + 1].id });
      },
      prevStep: () => {
        const s = get();
        const steps = s.getVisibleSteps(true);
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
      getVisibleSteps: (isSpellcaster: boolean) =>
        STEPS.filter((s) => !s.conditional || isSpellcaster),
    }),
    { name: "dnd-builder-ui-2024" }
  )
);
