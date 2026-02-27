import { RotateCcw } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";

export function Header() {
  const resetCharacter = useCharacterStore((s) => s.resetCharacter);
  const resetBuilder = useBuilderStore((s) => s.resetBuilder);

  const handleReset = () => {
    resetCharacter();
    resetBuilder();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-bold tracking-wide">⚔️ D&D 2024 Character Builder (PT-BR)</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </button>
      </div>
    </header>
  );
}
