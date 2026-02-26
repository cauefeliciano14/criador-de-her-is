import { create } from "zustand";
import { persist } from "zustand/middleware";

export type StepId =
  | "ability-method"
  | "race"
  | "class"
  | "background"
  | "skills"
  | "spells"
  | "equipment"
  | "review";

export interface StepDef {
  id: StepId;
  num: number;
  label: string;
  conditional?: boolean;
}

export const STEPS: StepDef[] = [
  { id: "ability-method", num: 1, label: "Método de Atributos" },
  { id: "race", num: 2, label: "Raça" },
  { id: "class", num: 3, label: "Classe" },
  { id: "background", num: 4, label: "Antecedente" },
  { id: "skills", num: 5, label: "Perícias & Proficiências" },
  { id: "spells", num: 6, label: "Magias", conditional: true },
  { id: "equipment", num: 7, label: "Equipamento" },
  { id: "review", num: 8, label: "Revisão Final" },
];

interface BuilderState {
  currentStep: StepId;
  completedSteps: StepId[];
  requiredMissing: Record<string, string[]>;
  lastSavedAt: string | null;
  goToStep: (step: StepId) => void;
  nextStep: (isSpellcaster?: boolean) => void;
  prevStep: (isSpellcaster?: boolean) => void;
  completeStep: (step: StepId) => void;
  uncompleteStep: (step: StepId) => void;
  setMissing: (step: StepId, items: string[]) => void;
  resetBuilder: () => void;
  getVisibleSteps: (isSpellcaster: boolean) => StepDef[];
}

const DEFAULT_BUILDER = {
  currentStep: "ability-method" as StepId,
  completedSteps: [] as StepId[],
  requiredMissing: {} as Record<string, string[]>,
  lastSavedAt: null as string | null,
};

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_BUILDER,
      goToStep: (step) => set({ currentStep: step }),
      nextStep: (isSpellcaster?: boolean) => {
        const s = get();
        const steps = s.getVisibleSteps(isSpellcaster ?? false);
        const idx = steps.findIndex((st) => st.id === s.currentStep);
        if (idx < steps.length - 1) set({ currentStep: steps[idx + 1].id });
      },
      prevStep: (isSpellcaster?: boolean) => {
        const s = get();
        const steps = s.getVisibleSteps(isSpellcaster ?? false);
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
