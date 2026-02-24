import { useState, useEffect, useCallback } from "react";
import { useCharacterStore, type AbilityMethod } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import {
  ABILITIES,
  ABILITY_LABELS,
  ABILITY_SHORT,
  STANDARD_ARRAY,
  POINT_BUY_COSTS,
  POINT_BUY_TOTAL,
  calcAbilityMod,
  rollFullSet,
  type AbilityKey,
} from "@/utils/calculations";
import {
  CheckCircle2,
  Circle,
  Dices,
  RotateCcw,
  AlertTriangle,
  Minus,
  Plus,
} from "lucide-react";

const METHOD_INFO = [
  {
    id: "standard" as const,
    name: "Conjunto Padrão",
    icon: "📊",
    description: "Distribua os valores 15, 14, 13, 12, 10 e 8 entre os atributos.",
  },
  {
    id: "pointBuy" as const,
    name: "Compra de Pontos",
    icon: "🛒",
    description: "Gaste 27 pontos para comprar valores de 8 a 15 com custo progressivo.",
  },
  {
    id: "roll" as const,
    name: "Rolagem 4d6",
    icon: "🎲",
    description: "Role 4d6, descarte o menor dado, some os 3 maiores. Repita 6 vezes.",
  },
];

export function StepAbilityMethod() {
  const abilityGen = useCharacterStore((s) => s.abilityGeneration);
  const scores = useCharacterStore((s) => s.abilityScores);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const resetAbilities = useCharacterStore((s) => s.resetAbilities);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const method = abilityGen.method;

  const [showMethodWarning, setShowMethodWarning] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<AbilityMethod>(null);

  // Validation
  const getValidation = useCallback((): { valid: boolean; missing: string[] } => {
    if (!method) return { valid: false, missing: ["Escolher método de atributos"] };

    if (method === "standard") {
      const assignments = abilityGen.standardAssignments;
      const unassigned = ABILITIES.filter((a) => assignments[a] === null);
      if (unassigned.length > 0) {
        return {
          valid: false,
          missing: unassigned.map((a) => `Atribuir valor a ${ABILITY_LABELS[a]}`),
        };
      }
      return { valid: true, missing: [] };
    }

    if (method === "pointBuy") {
      return { valid: true, missing: [] };
    }

    if (method === "roll") {
      if (!abilityGen.rollResults) {
        return { valid: false, missing: ["Rolar os dados"] };
      }
      const assignments = abilityGen.rollAssignments;
      const unassigned = ABILITIES.filter((a) => assignments[a] === null);
      if (unassigned.length > 0) {
        return {
          valid: false,
          missing: unassigned.map((a) => `Atribuir valor a ${ABILITY_LABELS[a]}`),
        };
      }
      return { valid: true, missing: [] };
    }

    return { valid: false, missing: ["Configuração inválida"] };
  }, [method, abilityGen]);

  // Sync validation with builder
  useEffect(() => {
    const { valid, missing } = getValidation();
    if (valid) {
      completeStep("ability-method");
      setMissing("ability-method", []);
    } else {
      uncompleteStep("ability-method");
      setMissing("ability-method", missing);
    }
  }, [method, abilityGen.standardAssignments, abilityGen.rollAssignments, abilityGen.rollResults, scores, getValidation]);

  // Select method
  const handleSelectMethod = (newMethod: AbilityMethod) => {
    if (method && method !== newMethod && abilityGen.confirmed) {
      setPendingMethod(newMethod);
      setShowMethodWarning(true);
      return;
    }
    applyMethod(newMethod);
  };

  const applyMethod = (newMethod: AbilityMethod) => {
    resetAbilities();
    const baseScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    if (newMethod === "pointBuy") {
      // Point buy starts at 8 each
    }
    patchCharacter({
      abilityScores: baseScores,
      abilityGeneration: {
        method: newMethod,
        rolls: null,
        rollResults: null,
        pointBuyRemaining: POINT_BUY_TOTAL,
        standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: false,
      },
    });
    setShowMethodWarning(false);
    setPendingMethod(null);
  };

  const confirmMethodChange = () => {
    if (pendingMethod) applyMethod(pendingMethod);
  };

  // === STANDARD ARRAY ===
  const handleStandardAssign = (ability: AbilityKey, value: number | null) => {
    const newAssignments = { ...abilityGen.standardAssignments, [ability]: value };
    const newScores = { ...scores };
    ABILITIES.forEach((a) => {
      newScores[a] = newAssignments[a] ?? 8;
    });
    patchCharacter({
      abilityScores: newScores,
      abilityGeneration: { ...abilityGen, standardAssignments: newAssignments, confirmed: true },
    });
  };

  const usedStandardValues = Object.values(abilityGen.standardAssignments).filter((v) => v !== null) as number[];
  const availableStandardValues = STANDARD_ARRAY.filter((v) => {
    const usedCount = usedStandardValues.filter((u) => u === v).length;
    const totalCount = STANDARD_ARRAY.filter((s) => s === v).length;
    return usedCount < totalCount;
  });

  // === POINT BUY ===
  const pointsSpent = ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COSTS[scores[a]] ?? 0), 0);
  const pointsRemaining = POINT_BUY_TOTAL - pointsSpent;

  const handlePointBuy = (ability: AbilityKey, delta: number) => {
    const current = scores[ability];
    const next = current + delta;
    if (next < 8 || next > 15) return;
    const costDiff = (POINT_BUY_COSTS[next] ?? 0) - (POINT_BUY_COSTS[current] ?? 0);
    if (pointsRemaining - costDiff < 0) return;
    const newScores = { ...scores, [ability]: next };
    patchCharacter({
      abilityScores: newScores,
      abilityGeneration: { ...abilityGen, pointBuyRemaining: pointsRemaining - costDiff, confirmed: true },
    });
  };

  // === ROLL ===
  const handleRoll = () => {
    const { allDice, totals } = rollFullSet();
    patchCharacter({
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      abilityGeneration: {
        ...abilityGen,
        rolls: allDice,
        rollResults: totals,
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: false,
      },
    });
  };

  const handleRollAssign = (ability: AbilityKey, value: number | null) => {
    const newAssignments = { ...abilityGen.rollAssignments, [ability]: value };
    const newScores = { ...scores };
    ABILITIES.forEach((a) => {
      newScores[a] = newAssignments[a] ?? 8;
    });
    patchCharacter({
      abilityScores: newScores,
      abilityGeneration: { ...abilityGen, rollAssignments: newAssignments, confirmed: true },
    });
  };

  const usedRollValues = Object.values(abilityGen.rollAssignments).filter((v) => v !== null) as number[];

  const handleResetAttributes = () => {
    if (method === "standard") {
      patchCharacter({
        abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
        abilityGeneration: {
          ...abilityGen,
          standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
          confirmed: false,
        },
      });
    } else if (method === "pointBuy") {
      patchCharacter({
        abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
        abilityGeneration: { ...abilityGen, pointBuyRemaining: POINT_BUY_TOTAL, confirmed: false },
      });
    } else if (method === "roll") {
      patchCharacter({
        abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
        abilityGeneration: {
          ...abilityGen,
          rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
          confirmed: false,
        },
      });
    }
  };

  const { valid, missing } = getValidation();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="mb-1 text-2xl font-bold">1. Método de Geração de Atributos</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Escolha como deseja determinar os valores base dos seus atributos.
      </p>

      {/* Method Warning Dialog */}
      {showMethodWarning && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-2 mb-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold text-sm">Mudar Método</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Ao mudar o método, todos os atributos atuais serão resetados. Deseja continuar?
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmMethodChange}
              className="rounded-md bg-warning px-3 py-1.5 text-sm font-medium text-warning-foreground hover:bg-warning/90"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setShowMethodWarning(false); setPendingMethod(null); }}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Method Selection */}
      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        {METHOD_INFO.map((m) => {
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMethod(m.id)}
              className={`rounded-lg border p-4 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "hover:border-muted-foreground/40 hover:bg-secondary"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{m.icon}</span>
                {selected ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className="font-semibold text-sm">{m.name}</span>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </button>
          );
        })}
      </div>

      {/* Method-specific UI */}
      {method && (
        <>
          {/* Action buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleResetAttributes}
              className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Resetar Atributos
            </button>
            {method === "roll" && (
              <button
                onClick={handleRoll}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Dices className="h-4 w-4" />
                {abilityGen.rollResults ? "Rolar Novamente" : "Rolar Atributos"}
              </button>
            )}
          </div>

          {/* Point Buy header */}
          {method === "pointBuy" && (
            <div className="mb-6 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Pontos Disponíveis</p>
                  <p className="text-xs text-muted-foreground">Todos os atributos começam em 8</p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-bold ${pointsRemaining === 0 ? "text-success" : pointsRemaining < 0 ? "text-destructive" : "text-primary"}`}>
                    {pointsRemaining}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">/ {POINT_BUY_TOTAL}</span>
                </div>
              </div>
              {/* Cost table */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.entries(POINT_BUY_COSTS).map(([score, cost]) => (
                  <span key={score} className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    {score}→{cost}pts
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roll results */}
          {method === "roll" && abilityGen.rolls && abilityGen.rollResults && (
            <div className="mb-6 rounded-lg border bg-card p-4">
              <p className="text-sm font-semibold mb-3">Resultados da Rolagem</p>
              <div className="grid grid-cols-6 gap-2">
                {abilityGen.rollResults.map((total, i) => {
                  const dice = abilityGen.rolls![i];
                  const minDie = Math.min(...dice);
                  const isUsed = usedRollValues.includes(total) &&
                    usedRollValues.filter((v) => v === total).length > 
                    abilityGen.rollResults!.slice(0, i).filter((t) => t === total && usedRollValues.includes(t)).length;
                  
                  return (
                    <div key={i} className={`rounded-lg border p-2 text-center ${isUsed ? "opacity-40" : ""}`}>
                      <p className="text-lg font-bold">{total}</p>
                      <div className="flex justify-center gap-0.5 mt-1">
                        {dice.map((d, j) => (
                          <span
                            key={j}
                            className={`inline-block w-5 h-5 rounded text-[10px] leading-5 text-center ${
                              d === minDie && j === dice.lastIndexOf(minDie)
                                ? "bg-destructive/20 text-destructive line-through"
                                : "bg-secondary"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ability Score Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ABILITIES.map((ability) => {
              const score = scores[ability];
              const mod = calcAbilityMod(score);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

              return (
                <div key={ability} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-sm">{ABILITY_LABELS[ability]}</p>
                      <p className="text-[11px] text-muted-foreground">{ABILITY_SHORT[ability]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{score}</p>
                      <p className={`text-xs font-medium ${mod >= 0 ? "text-success" : "text-destructive"}`}>
                        {modStr}
                      </p>
                    </div>
                  </div>

                  {/* Standard Array */}
                  {method === "standard" && (
                    <select
                      value={abilityGen.standardAssignments[ability] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        handleStandardAssign(ability, val);
                      }}
                      className="w-full rounded-md border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">— Escolher —</option>
                      {STANDARD_ARRAY.filter(
                        (v) => v === abilityGen.standardAssignments[ability] || availableStandardValues.includes(v)
                      )
                        .sort((a, b) => b - a)
                        .map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                  )}

                  {/* Point Buy */}
                  {method === "pointBuy" && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handlePointBuy(ability, -1)}
                        disabled={score <= 8}
                        className="rounded-md border bg-secondary p-2 disabled:opacity-30 hover:bg-muted transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="text-center">
                        <span className="text-xs text-muted-foreground">
                          Custo: {POINT_BUY_COSTS[score] ?? 0} pts
                        </span>
                      </div>
                      <button
                        onClick={() => handlePointBuy(ability, 1)}
                        disabled={score >= 15 || pointsRemaining - ((POINT_BUY_COSTS[score + 1] ?? 0) - (POINT_BUY_COSTS[score] ?? 0)) < 0}
                        className="rounded-md border bg-secondary p-2 disabled:opacity-30 hover:bg-muted transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Roll Assignment */}
                  {method === "roll" && abilityGen.rollResults && (
                    <select
                      value={abilityGen.rollAssignments[ability] ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        handleRollAssign(ability, val);
                      }}
                      className="w-full rounded-md border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">— Escolher —</option>
                      {abilityGen.rollResults
                        .filter((v, i) => {
                          // Available if: currently assigned to this ability, or not used
                          if (v === abilityGen.rollAssignments[ability]) return true;
                          const timesInResults = abilityGen.rollResults!.filter((t) => t === v).length;
                          const timesUsed = Object.values(abilityGen.rollAssignments).filter((a) => a === v).length;
                          return timesUsed < timesInResults;
                        })
                        .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe for display
                        .sort((a, b) => b - a)
                        .map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                    </select>
                  )}

                  {method === "roll" && !abilityGen.rollResults && (
                    <p className="text-xs text-muted-foreground text-center">Role os dados primeiro</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Validation message */}
          {!valid && missing.length > 0 && (
            <div className="mt-6 rounded-lg border border-info/30 bg-info/10 p-4">
              <p className="text-sm font-semibold text-info mb-1">⚠ Pendências</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {missing.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </div>
          )}

          {valid && (
            <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-success">Atributos configurados! Pode avançar.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
