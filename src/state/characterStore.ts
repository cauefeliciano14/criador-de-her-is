import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CharacterState {
  draft: {
    classId: string | null;
  };
  completed: {
    step1Class: boolean;
  };
  selectClass: (id: string) => void;
  confirmClass: () => void;
  resetAll: () => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      draft: { classId: null },
      completed: { step1Class: false },
      selectClass: (id) =>
        set({
          draft: { ...get().draft, classId: id },
          completed: { ...get().completed, step1Class: false },
        }),
      confirmClass: () => {
        if (get().draft.classId) {
          set({ completed: { ...get().completed, step1Class: true } });
        }
      },
      resetAll: () =>
        set({
          draft: { classId: null },
          completed: { step1Class: false },
        }),
    }),
    { name: "dnd-character-draft" }
  )
);
