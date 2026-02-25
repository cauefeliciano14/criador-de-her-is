import { RotateCcw, ArrowUp } from "lucide-react";
import { useState } from "react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { LevelUpModal } from "@/components/LevelUpModal";

export function Header() {
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
  const resetBuilder = useBuilderStore((s) => s.resetBuilder);
  const level = useCharacterStore((s) => s.level);
  const classId = useCharacterStore((s) => s.class);
  const cls = classes.find((c) => c.id === classId);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const handleReset = () => {
    resetCharacter();
    resetBuilder();
  };

  const canLevelUp = cls && level < 20;

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-6">
        <h1 className="text-lg font-bold tracking-wide">⚔️ D&D 2024 Character Builder (PT-BR)</h1>
        <div className="flex items-center gap-2">
          {canLevelUp && (
            <button
              onClick={() => setShowLevelUp(true)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowUp className="h-4 w-4" />
              Subir Nível ({level} → {level + 1})
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>
      </header>
      {showLevelUp && <LevelUpModal onClose={() => setShowLevelUp(false)} />}
    </>
  );
}
