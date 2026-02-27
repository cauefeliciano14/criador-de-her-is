import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useCharacterStore } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import type { NormalizedFeature } from "@/state/characterStore";
import { replaceFeatures } from "@/state/characterStore";
import { Lock, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBuilderStore } from "@/state/builderStore";
import {
  ABILITIES,
  ABILITY_LABELS,
  ABILITY_SHORT,
  STANDARD_ARRAY,
  calcAbilityMod,
  type AbilityKey,
} from "@/utils/calculations";
import { CheckCircle2, RotateCcw, GripVertical, Info } from "lucide-react";

const MAX_SUPPORTED_LEVEL = 2;

type BonusMode = "2+1" | "1+1+1" | null;

// ── Drag & Drop Pool Chip ──
const PoolChip = memo(function PoolChip({
  value,
  onDragStart,
  onClick,
  isSelected,
}: {
  value: number;
  onDragStart: (e: React.DragEvent, value: number) => void;
  onClick: (value: number) => void;
  isSelected: boolean;
}) {
  const mod = calcAbilityMod(value);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, value)}
      onClick={() => onClick(value)}
      className={`cursor-grab active:cursor-grabbing select-none rounded-lg border-2 px-4 py-3 text-center transition-all hover:scale-105 hover:shadow-md ${
        isSelected
          ? "border-primary bg-primary/20 ring-2 ring-primary/30"
          : "border-border bg-card hover:border-primary/50"
      }`}
      role="button"
      aria-label={`Valor ${value} (modificador ${modStr})`}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-xl font-bold">{value}</span>
      </div>
      <span className={`text-xs font-medium ${mod >= 0 ? "text-success" : "text-destructive"}`}>
        {modStr}
      </span>
    </div>
  );
});

// ── Drop Zone Slot ──
const AbilitySlot = memo(function AbilitySlot({
  ability,
  assignedValue,
  bonus,
  finalValue,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  isDragOver,
}: {
  ability: AbilityKey;
  assignedValue: number | null;
  bonus: number;
  finalValue: number | null;
  onDrop: (ability: AbilityKey) => void;
  onDragOver: (e: React.DragEvent, ability: AbilityKey) => void;
  onDragLeave: () => void;
  onClick: (ability: AbilityKey) => void;
  isDragOver: boolean;
}) {
  const mod = assignedValue !== null ? calcAbilityMod(finalValue ?? assignedValue) : null;
  const modStr = mod !== null ? (mod >= 0 ? `+${mod}` : `${mod}`) : "—";
  const capped = finalValue !== null && finalValue > 20;

  return (
    <div
      onDragOver={(e) => onDragOver(e, ability)}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(ability);
      }}
      onClick={() => onClick(ability)}
      className={`rounded-lg border-2 border-dashed p-4 text-center transition-all cursor-pointer min-h-[100px] flex flex-col items-center justify-center gap-0.5 ${
        isDragOver
          ? "border-primary bg-primary/10 scale-[1.02]"
          : assignedValue !== null
          ? "border-primary/40 bg-primary/5"
          : "border-muted-foreground/30 hover:border-primary/40 hover:bg-secondary/50"
      }`}
      role="button"
      aria-label={`Slot ${ABILITY_LABELS[ability]}${assignedValue !== null ? `, valor ${assignedValue}` : ", vazio"}`}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {ABILITY_SHORT[ability]}
      </p>
      <p className="text-xs text-muted-foreground">{ABILITY_LABELS[ability]}</p>
      {assignedValue !== null ? (
        <>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-2xl font-bold">{assignedValue}</span>
            {bonus > 0 && (
              <span className="text-sm font-semibold text-primary">+{bonus}</span>
            )}
            {bonus > 0 && (
              <span className={`text-lg font-bold ${capped ? "text-destructive" : ""}`}>
                = {Math.min(20, finalValue!)}
              </span>
            )}
          </div>
          <p className={`text-xs font-semibold ${mod! >= 0 ? "text-success" : "text-destructive"}`}>
            {modStr}
          </p>
          {capped && (
            <p className="text-[9px] text-destructive font-medium">Limitado a 20</p>
          )}
        </>
      ) : (
        <p className="text-lg text-muted-foreground/40 mt-1">—</p>
      )}
    </div>
  );
});

export function StepAbilityMethod() {
  const abilityGen = useCharacterStore((s) => s.abilityGeneration);
  const scores = useCharacterStore((s) => s.abilityScores);
  const level = useCharacterStore((s) => s.level);
  const classId = useCharacterStore((s) => s.class);
  const bgId = useCharacterStore((s) => s.background);
  const backgroundBonuses = useCharacterStore((s) => s.backgroundBonuses);
  const backgroundAbilityChoices = useCharacterStore((s) => s.backgroundAbilityChoices);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const resetAbilities = useCharacterStore((s) => s.resetAbilities);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  // Background data
  const bg = useMemo(() => backgrounds.find((b) => b.id === bgId), [bgId]);
  const abilityOptions = bg?.abilityOptions ?? [];

  // Drag state
  const [dragValue, setDragValue] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<"pool" | AbilityKey | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<AbilityKey | null>(null);
  const [clickSelected, setClickSelected] = useState<{ value: number; source: "pool" | AbilityKey } | null>(null);

  // Bonus mode
  const [bonusMode, setBonusMode] = useState<BonusMode>(null);
  const [bonusPlus2, setBonusPlus2] = useState<AbilityKey | null>(null);
  const [bonusPlus1, setBonusPlus1] = useState<AbilityKey | null>(null);

  // Restore bonus state from backgroundAbilityChoices on mount/bg change
  useEffect(() => {
    if (!bg || abilityOptions.length !== 3) {
      setBonusMode(null);
      setBonusPlus2(null);
      setBonusPlus1(null);
      return;
    }
    // Detect current mode from stored bonuses
    const values = abilityOptions.map((a) => backgroundBonuses[a] ?? 0);
    const has2 = values.some((v) => v === 2);
    const has1Count = values.filter((v) => v === 1).length;
    if (has2) {
      setBonusMode("2+1");
      const p2 = abilityOptions.find((a) => (backgroundBonuses[a] ?? 0) === 2) ?? null;
      const p1 = abilityOptions.find((a) => (backgroundBonuses[a] ?? 0) === 1) ?? null;
      setBonusPlus2(p2);
      setBonusPlus1(p1);
    } else if (has1Count === 3) {
      setBonusMode("1+1+1");
      setBonusPlus2(null);
      setBonusPlus1(null);
    } else {
      setBonusMode(null);
      setBonusPlus2(null);
      setBonusPlus1(null);
    }
  }, [bgId]);

  // Auto-select "standard" method on mount if not set
  useEffect(() => {
    if (!abilityGen.method) {
      patchCharacter({
        abilityGeneration: {
          ...abilityGen,
          method: "standard",
          confirmed: false,
          standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        },
      });
    }
  }, []);

  // (Level selection is now handled in StepClass)

  // ── Assignments ──
  const assignments = abilityGen.standardAssignments;

  const usedValues = ABILITIES.map((a) => assignments[a]).filter((v): v is number => v !== null);
  const availablePoolValues = STANDARD_ARRAY.filter((v) => {
    const totalInArray = STANDARD_ARRAY.filter((s) => s === v).length;
    const usedCount = usedValues.filter((u) => u === v).length;
    return usedCount < totalInArray;
  });

  const assignValue = useCallback((ability: AbilityKey, value: number | null) => {
    const newAssignments = { ...abilityGen.standardAssignments, [ability]: value };
    const newScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    ABILITIES.forEach((a) => { newScores[a] = newAssignments[a] ?? 8; });
    patchCharacter({
      abilityScores: newScores,
      abilityGeneration: { ...abilityGen, standardAssignments: newAssignments, confirmed: true, method: "standard" },
    });
  }, [abilityGen, patchCharacter]);

  const swapValues = useCallback((from: AbilityKey, to: AbilityKey) => {
    const fromVal = assignments[from];
    const toVal = assignments[to];
    const newAssignments = { ...assignments, [from]: toVal, [to]: fromVal };
    const newScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    ABILITIES.forEach((a) => { newScores[a] = newAssignments[a] ?? 8; });
    patchCharacter({
      abilityScores: newScores,
      abilityGeneration: { ...abilityGen, standardAssignments: newAssignments, confirmed: true, method: "standard" },
    });
  }, [assignments, abilityGen, patchCharacter]);

  // ── Drag handlers ──
  const handlePoolDragStart = useCallback((e: React.DragEvent, value: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(value));
    setDragValue(value);
    setDragSource("pool");
    setClickSelected(null);
  }, []);

  const handleSlotDragStart = useCallback((e: React.DragEvent, ability: AbilityKey) => {
    const value = assignments[ability];
    if (value === null) { e.preventDefault(); return; }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(value));
    setDragValue(value);
    setDragSource(ability);
    setClickSelected(null);
  }, [assignments]);

  const handleSlotDragOver = useCallback((e: React.DragEvent, ability: AbilityKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(ability);
  }, []);

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleSlotDrop = useCallback((targetAbility: AbilityKey) => {
    setDragOverSlot(null);
    if (dragValue === null || dragSource === null) return;

    if (dragSource === "pool") {
      assignValue(targetAbility, dragValue);
    } else {
      swapValues(dragSource as AbilityKey, targetAbility);
    }

    setDragValue(null);
    setDragSource(null);
  }, [dragValue, dragSource, assignValue, swapValues]);

  const handlePoolDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dragSource && dragSource !== "pool") {
      assignValue(dragSource as AbilityKey, null);
    }
    setDragValue(null);
    setDragSource(null);
    setDragOverSlot(null);
  }, [dragSource, assignValue]);

  const handleDragEnd = useCallback(() => {
    setDragValue(null);
    setDragSource(null);
    setDragOverSlot(null);
  }, []);

  // ── Click fallback ──
  const handlePoolClick = useCallback((value: number) => {
    if (clickSelected?.source === "pool" && clickSelected.value === value) {
      setClickSelected(null);
      return;
    }
    setClickSelected({ value, source: "pool" });
  }, [clickSelected]);

  const handleSlotClick = useCallback((ability: AbilityKey) => {
    if (!clickSelected) {
      const val = assignments[ability];
      if (val !== null) {
        setClickSelected({ value: val, source: ability });
      }
      return;
    }

    if (clickSelected.source === "pool") {
      assignValue(ability, clickSelected.value);
      setClickSelected(null);
    } else {
      swapValues(clickSelected.source as AbilityKey, ability);
      setClickSelected(null);
    }
  }, [clickSelected, assignments, assignValue, swapValues]);

  // ── Reset ──
  const handleReset = useCallback(() => {
    patchCharacter({
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      abilityGeneration: {
        ...abilityGen,
        method: "standard",
        standardAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: false,
      },
      backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      backgroundAbilityChoices: {},
    });
    setClickSelected(null);
    setBonusMode(null);
    setBonusPlus2(null);
    setBonusPlus1(null);
  }, [abilityGen, patchCharacter]);

  // ── Background bonus handlers ──
  const applyBonuses = useCallback((mode: BonusMode, plus2: AbilityKey | null, plus1: AbilityKey | null) => {
    const bonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

    if (mode === "1+1+1" && abilityOptions.length === 3) {
      for (const a of abilityOptions) {
        bonuses[a] = 1;
      }
    } else if (mode === "2+1" && plus2 && plus1 && plus2 !== plus1) {
      bonuses[plus2] = 2;
      bonuses[plus1] = 1;
    }

    patchCharacter({
      backgroundBonuses: bonuses,
      backgroundAbilityChoices: mode === "1+1+1"
        ? Object.fromEntries(abilityOptions.map((a) => [a, 1]))
        : plus2 && plus1 ? { [plus2]: 2, [plus1]: 1 } : {},
    });
  }, [abilityOptions, patchCharacter]);

  const handleBonusModeChange = useCallback((mode: BonusMode) => {
    setBonusMode(mode);
    if (mode === "1+1+1") {
      setBonusPlus2(null);
      setBonusPlus1(null);
      applyBonuses("1+1+1", null, null);
    } else {
      // Reset selections for 2+1
      setBonusPlus2(null);
      setBonusPlus1(null);
      patchCharacter({
        backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        backgroundAbilityChoices: {},
      });
    }
  }, [applyBonuses, patchCharacter]);

  const handlePlus2Change = useCallback((ability: AbilityKey) => {
    setBonusPlus2(ability);
    // If plus1 is same ability, clear it
    const newPlus1 = bonusPlus1 === ability ? null : bonusPlus1;
    setBonusPlus1(newPlus1);
    if (newPlus1) {
      applyBonuses("2+1", ability, newPlus1);
    } else {
      patchCharacter({
        backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
        backgroundAbilityChoices: {},
      });
    }
  }, [bonusPlus1, applyBonuses, patchCharacter]);

  const handlePlus1Change = useCallback((ability: AbilityKey) => {
    setBonusPlus1(ability);
    if (bonusPlus2) {
      applyBonuses("2+1", bonusPlus2, ability);
    }
  }, [bonusPlus2, applyBonuses]);

  // ── Derived final scores ──
  const finalScores = useMemo(() => {
    const result: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    for (const a of ABILITIES) {
      const base = assignments[a] ?? 0;
      const bonus = backgroundBonuses[a] ?? 0;
      result[a] = base + bonus;
    }
    return result;
  }, [assignments, backgroundBonuses]);

  // Check cap 20 violations
  const capViolations = useMemo(() => {
    return ABILITIES.filter((a) => assignments[a] !== null && finalScores[a] > 20);
  }, [finalScores, assignments]);

  // ── Validation ──
  const allAssigned = ABILITIES.every((a) => assignments[a] !== null);

  const bonusComplete = useMemo(() => {
    if (!bg || abilityOptions.length !== 3) return true; // No background selected = no bonus needed (handled by bg step)
    if (!allAssigned) return false;
    if (bonusMode === "1+1+1") return true;
    if (bonusMode === "2+1" && bonusPlus2 && bonusPlus1 && bonusPlus2 !== bonusPlus1) return true;
    return false;
  }, [bg, abilityOptions, allAssigned, bonusMode, bonusPlus2, bonusPlus1]);

  useEffect(() => {
    const missing: string[] = [];
    if (!allAssigned) {
      const unassigned = ABILITIES.filter((a) => assignments[a] === null);
      missing.push(...unassigned.map((a) => `Atribuir valor a ${ABILITY_LABELS[a]}`));
    }
    if (allAssigned && bg && abilityOptions.length === 3 && !bonusComplete) {
      missing.push("Definir bônus de atributo do antecedente");
    }
    if (capViolations.length > 0) {
      missing.push("Atributo final excede 20 — ajuste a distribuição");
    }

    if (missing.length === 0 && allAssigned) {
      completeStep("abilities");
      setMissing("abilities", []);
    } else {
      uncompleteStep("abilities");
      setMissing("abilities", missing);
    }
  }, [allAssigned, assignments, bonusComplete, capViolations, bg]);

  const assignedCount = ABILITIES.filter((a) => assignments[a] !== null).length;

  return (
    <div className="p-6 max-w-4xl mx-auto" onDragEnd={handleDragEnd}>

      <h2 className="mb-1 text-2xl font-bold">4. Distribuir Atributos</h2>
      <p className="mb-2 text-sm text-muted-foreground">
        Método: <span className="font-semibold text-foreground">Conjunto Padrão</span> — arraste os valores para os atributos, ou clique para selecionar e depois clique no slot.
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Resetar Distribuição
        </button>
        <span className="text-xs text-muted-foreground">
          {assignedCount}/6 atribuídos
        </span>
      </div>

      {/* ── Pool ── */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Valores Disponíveis
        </h3>
        <div
          className="flex flex-wrap gap-3 rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 min-h-[70px]"
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
          onDrop={handlePoolDrop}
        >
          {availablePoolValues.length === 0 && allAssigned ? (
            <p className="text-sm text-success font-medium">✓ Todos os valores foram distribuídos!</p>
          ) : availablePoolValues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum valor disponível</p>
          ) : (
            availablePoolValues
              .sort((a, b) => b - a)
              .map((value, idx) => (
                <PoolChip
                  key={`${value}-${idx}`}
                  value={value}
                  onDragStart={handlePoolDragStart}
                  onClick={handlePoolClick}
                  isSelected={clickSelected?.source === "pool" && clickSelected.value === value}
                />
              ))
          )}
        </div>
        {clickSelected && (
          <p className="mt-2 text-xs text-info">
            Valor {clickSelected.value} selecionado — clique em um atributo para atribuir
            {clickSelected.source !== "pool" && ", ou em outro atributo para trocar"}
          </p>
        )}
      </section>

      {/* ── Ability Drop Zones ── */}
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Atributos
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ABILITIES.map((ability) => (
            <div
              key={ability}
              draggable={assignments[ability] !== null}
              onDragStart={(e) => handleSlotDragStart(e, ability)}
            >
              <AbilitySlot
                ability={ability}
                assignedValue={assignments[ability]}
                bonus={backgroundBonuses[ability] ?? 0}
                finalValue={assignments[ability] !== null ? finalScores[ability] : null}
                onDrop={handleSlotDrop}
                onDragOver={handleSlotDragOver}
                onDragLeave={handleSlotDragLeave}
                onClick={handleSlotClick}
                isDragOver={dragOverSlot === ability}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Background Bonus Section ── */}
      {allAssigned && bg && abilityOptions.length === 3 && (
        <section className="mt-8">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Bônus do Antecedente
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                <Info className="h-3 w-3" />
                Obrigatório
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Antecedente: <span className="font-semibold text-foreground">{bg.name}</span> — escolha como distribuir bônus entre{" "}
              {abilityOptions.map((a) => ABILITY_LABELS[a]).join(", ")}.
            </p>

            {/* Mode selection */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => handleBonusModeChange("2+1")}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  bonusMode === "2+1"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <p className="font-semibold text-sm">Modo A: +2 / +1</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  +2 em um atributo e +1 em outro (dentre os 3)
                </p>
              </button>
              <button
                onClick={() => handleBonusModeChange("1+1+1")}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  bonusMode === "1+1+1"
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                }`}
              >
                <p className="font-semibold text-sm">Modo B: +1 / +1 / +1</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  +1 em cada um dos 3 atributos
                </p>
              </button>
            </div>

            {/* +2/+1 selectors */}
            {bonusMode === "2+1" && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Escolha o atributo para +2:</p>
                  <div className="flex gap-2">
                    {abilityOptions.map((a) => {
                      const base = assignments[a] ?? 0;
                      const wouldExceed = base + 2 > 20;
                      const selected = bonusPlus2 === a;
                      return (
                        <button
                          key={a}
                          onClick={() => !wouldExceed && handlePlus2Change(a)}
                          disabled={wouldExceed}
                          className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                            selected
                              ? "border-primary bg-primary/10"
                              : wouldExceed
                              ? "border-destructive/30 bg-destructive/5 opacity-50 cursor-not-allowed"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
                          <p className="text-sm font-semibold">{ABILITY_LABELS[a]}</p>
                          <p className="text-xs text-muted-foreground">{base} → {Math.min(20, base + 2)}</p>
                          {selected && <p className="text-xs font-bold text-primary mt-0.5">+2</p>}
                          {wouldExceed && <p className="text-[9px] text-destructive">Excederia 20</p>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {bonusPlus2 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Escolha o atributo para +1:</p>
                    <div className="flex gap-2">
                      {abilityOptions.filter((a) => a !== bonusPlus2).map((a) => {
                        const base = assignments[a] ?? 0;
                        const wouldExceed = base + 1 > 20;
                        const selected = bonusPlus1 === a;
                        return (
                          <button
                            key={a}
                            onClick={() => !wouldExceed && handlePlus1Change(a)}
                            disabled={wouldExceed}
                            className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                              selected
                                ? "border-primary bg-primary/10"
                                : wouldExceed
                                ? "border-destructive/30 bg-destructive/5 opacity-50 cursor-not-allowed"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
                            <p className="text-sm font-semibold">{ABILITY_LABELS[a]}</p>
                            <p className="text-xs text-muted-foreground">{base} → {Math.min(20, base + 1)}</p>
                            {selected && <p className="text-xs font-bold text-primary mt-0.5">+1</p>}
                            {wouldExceed && <p className="text-[9px] text-destructive">Excederia 20</p>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* +1/+1/+1 summary */}
            {bonusMode === "1+1+1" && (
              <div className="rounded-lg border bg-secondary/30 p-3">
                <div className="flex gap-4">
                  {abilityOptions.map((a) => {
                    const base = assignments[a] ?? 0;
                    const final = Math.min(20, base + 1);
                    return (
                      <div key={a} className="text-center flex-1">
                        <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
                        <p className="text-sm font-semibold">{ABILITY_LABELS[a]}</p>
                        <p className="text-xs text-muted-foreground">{base} → <span className="font-bold text-foreground">{final}</span></p>
                        <p className="text-xs font-bold text-primary">+1</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bonus not selected yet */}
            {!bonusMode && (
              <p className="text-xs text-info">Selecione um modo de bônus acima.</p>
            )}
          </div>
        </section>
      )}

      {/* No background warning */}
      {allAssigned && !bg && (
        <div className="mt-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="text-sm text-warning font-medium">
              Selecione um Antecedente (etapa 2 — Origem) para aplicar os bônus de atributo.
            </p>
          </div>
        </div>
      )}

      {/* ── Status ── */}
      {!allAssigned && (
        <div className="mt-6 rounded-lg border border-info/30 bg-info/10 p-4">
          <p className="text-sm font-semibold text-info mb-1">⚠ Pendências</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {ABILITIES.filter((a) => assignments[a] === null).map((a) => (
              <li key={a}>• Atribuir valor a {ABILITY_LABELS[a]}</li>
            ))}
          </ul>
        </div>
      )}

      {allAssigned && bonusComplete && capViolations.length === 0 && (
        <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="text-sm font-medium text-success">Atributos configurados! Pode avançar.</span>
        </div>
      )}
    </div>
  );
}
