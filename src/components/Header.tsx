import { RotateCcw, ArrowUp, Sword } from "lucide-react";
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
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card/95 backdrop-blur-md px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15">
            <Sword className="h-4 w-4 text-primary" />
          </div>
          <h1 className="heading-display text-base tracking-wide text-foreground">
            Criador de Heróis
            <span className="ml-2 text-[10px] font-normal font-sans text-muted-foreground tracking-normal uppercase">
              D&D 2024
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {canLevelUp && (
            <button
              onClick={() => setShowLevelUp(true)}
              className="btn-gradient flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
            >
              <ArrowUp className="h-4 w-4" />
              Nível {level} → {level + 1}
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
