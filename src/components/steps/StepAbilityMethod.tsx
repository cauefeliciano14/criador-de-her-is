import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect } from "react";

const METHODS = [
  {
    id: "standard-array" as const,
    name: "Conjunto Padrão",
    description: "Use os valores 15, 14, 13, 12, 10 e 8, distribuindo-os livremente entre os 6 atributos.",
  },
  {
    id: "point-buy" as const,
    name: "Compra de Pontos",
    description: "Gaste 27 pontos para aumentar atributos de 8 a 15, com custo progressivo.",
  },
];

export function StepAbilityMethod() {
  const method = useCharacterStore((s) => s.abilityMethod);
  const setField = useCharacterStore((s) => s.setField);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const handleSelect = (id: "standard-array" | "point-buy") => {
    setField("abilityMethod", id);
    completeStep("ability-method");
    setMissing("ability-method", []);
  };

  useEffect(() => {
    if (!method) {
      setMissing("ability-method", ["Escolher método de atributos"]);
    }
  }, [method]);

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold">1. Método de Atributos</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolha como deseja determinar os valores dos seus atributos.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {METHODS.map((m) => {
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelect(m.id)}
              className={`rounded-lg border p-5 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/10"
                  : "hover:border-muted-foreground/40 hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{m.name}</span>
                {selected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
