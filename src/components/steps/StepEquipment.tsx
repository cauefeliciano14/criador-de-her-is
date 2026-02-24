import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { useEffect } from "react";

export function StepEquipment() {
  const equipment = useCharacterStore((s) => s.equipment);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  useEffect(() => {
    if (equipment.length > 0) {
      completeStep("equipment");
      setMissing("equipment", []);
    } else {
      setMissing("equipment", ["Equipamento será preenchido pelo antecedente"]);
    }
  }, [equipment]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">8. Equipamento</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Equipamento inicial baseado no antecedente e classe selecionados.
      </p>
      {equipment.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Inventário Inicial
          </h3>
          <ul className="list-disc ml-5 text-sm space-y-1">
            {equipment.sort((a, b) => a.localeCompare(b, "pt-BR")).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Selecione um antecedente para definir o equipamento inicial.</p>
        </div>
      )}
    </div>
  );
}
