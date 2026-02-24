import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { ABILITY_LABELS, STANDARD_ARRAY, type AbilityKey } from "@/utils/calculations";
import { useState, useEffect } from "react";

const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};
const POINT_BUY_TOTAL = 27;

export function StepAbilities() {
  const method = useCharacterStore((s) => s.abilityMethod);
  const scores = useCharacterStore((s) => s.abilityScores);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  // Standard array assignment state
  const [assignments, setAssignments] = useState<Record<AbilityKey, number | null>>(() => {
    // Init from current scores if they match standard array
    const init: Record<AbilityKey, number | null> = { str: null, dex: null, con: null, int: null, wis: null, cha: null };
    return init;
  });

  const isStandard = method === "standard-array";

  // Standard array: track used values
  const usedValues = Object.values(assignments).filter((v) => v !== null) as number[];
  const availableValues = STANDARD_ARRAY.filter(
    (v) => {
      const usedCount = usedValues.filter((u) => u === v).length;
      const totalCount = STANDARD_ARRAY.filter((s) => s === v).length;
      return usedCount < totalCount;
    }
  );

  // Point buy state
  const pointsSpent = isStandard
    ? 0
    : ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COSTS[scores[a]] ?? 0), 0);
  const pointsLeft = POINT_BUY_TOTAL - pointsSpent;

  const handleStandardAssign = (ability: AbilityKey, value: number | null) => {
    const newAssignments = { ...assignments, [ability]: value };
    setAssignments(newAssignments);

    const newScores = { ...scores };
    ABILITIES.forEach((a) => {
      newScores[a] = newAssignments[a] ?? 10;
    });
    patchCharacter({ abilityScores: newScores });

    const allAssigned = ABILITIES.every((a) => newAssignments[a] !== null);
    if (allAssigned) {
      completeStep("abilities");
      setMissing("abilities", []);
    } else {
      uncompleteStep("abilities");
      const missing = ABILITIES.filter((a) => newAssignments[a] === null).map(
        (a) => `Atribuir valor a ${ABILITY_LABELS[a]}`
      );
      setMissing("abilities", missing);
    }
  };

  const handlePointBuy = (ability: AbilityKey, delta: number) => {
    const current = scores[ability];
    const next = current + delta;
    if (next < 8 || next > 15) return;
    const newCost = POINT_BUY_COSTS[next] - POINT_BUY_COSTS[current];
    if (pointsLeft - newCost < 0) return;

    const newScores = { ...scores, [ability]: next };
    patchCharacter({ abilityScores: newScores });
  };

  // Check completion for point buy
  useEffect(() => {
    if (!isStandard) {
      completeStep("abilities");
      setMissing("abilities", []);
    }
  }, [isStandard]);

  if (!method) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">5. Atributos</h2>
        <p className="text-muted-foreground">Volte à Etapa 1 e escolha um método de atributos primeiro.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">5. Distribuição de Atributos</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        {isStandard
          ? "Distribua os valores 15, 14, 13, 12, 10 e 8 entre os atributos."
          : `Compra de Pontos: ${pointsLeft} de ${POINT_BUY_TOTAL} pontos restantes.`}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ABILITIES.map((ability) => (
          <div key={ability} className="rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold mb-2">{ABILITY_LABELS[ability]}</p>
            {isStandard ? (
              <select
                value={assignments[ability] ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  handleStandardAssign(ability, val);
                }}
                className="w-full rounded-md border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Escolher —</option>
                {STANDARD_ARRAY.filter(
                  (v) => v === assignments[ability] || availableValues.includes(v)
                )
                  .sort((a, b) => b - a)
                  .map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
              </select>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePointBuy(ability, -1)}
                  disabled={scores[ability] <= 8}
                  className="rounded border bg-secondary px-3 py-1 text-sm disabled:opacity-30"
                >
                  −
                </button>
                <span className="text-lg font-bold w-8 text-center">{scores[ability]}</span>
                <button
                  onClick={() => handlePointBuy(ability, 1)}
                  disabled={scores[ability] >= 15 || pointsLeft <= 0}
                  className="rounded border bg-secondary px-3 py-1 text-sm disabled:opacity-30"
                >
                  +
                </button>
                <span className="text-xs text-muted-foreground">
                  ({POINT_BUY_COSTS[scores[ability]]} pts)
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
