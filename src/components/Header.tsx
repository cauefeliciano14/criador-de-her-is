import { RotateCcw } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";

export function Header() {
  const resetAll = useCharacterStore((s) => s.resetAll);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-bold tracking-wide">⚔️ Criador de Personagem</h1>
      <button
        onClick={resetAll}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        Reiniciar
      </button>
    </header>
  );
}
