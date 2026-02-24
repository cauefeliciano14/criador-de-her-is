import { useBuilderStore } from "@/state/builderStore";
import { useEffect } from "react";

export function StepSpells() {
  const completeStep = useBuilderStore((s) => s.completeStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  useEffect(() => {
    // Placeholder: auto-complete for now
    completeStep("spells");
    setMissing("spells", []);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">7. Magias</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sua classe é conjuradora. Aqui você escolherá truques e magias preparadas.
      </p>
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>🧙‍♂️ Seleção de magias será implementada em breve.</p>
        <p className="text-xs mt-2">Esta etapa está marcada como concluída automaticamente por enquanto.</p>
      </div>
    </div>
  );
}
