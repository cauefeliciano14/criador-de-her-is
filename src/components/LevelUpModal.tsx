import { useState, useMemo, useCallback } from "react";
import { useCharacterStore, type NormalizedFeature, type LevelingChangeSummary, type ASIOrFeatChoice } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { feats } from "@/data/feats";
import { spells as spellsData } from "@/data/spells";
import {
  ABILITIES, ABILITY_LABELS, ABILITY_SHORT, calcAbilityMod, calcProficiencyBonus,
  getFinalAbilityScores, type AbilityKey,
} from "@/utils/calculations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, AlertCircle, ChevronRight, Heart, Shield, Sparkles,
  Swords, BookOpen, ArrowUp, X, Dice1,
} from "lucide-react";

type LevelUpStep = "gains" | "hp" | "subclass" | "asi" | "spells" | "summary";

interface Props {
  onClose: () => void;
}

export function LevelUpModal({ onClose }: Props) {
  const char = useCharacterStore();
  const cls = classes.find((c) => c.id === char.class);

  const fromLevel = char.level;
  const toLevel = fromLevel + 1;

  if (!cls || toLevel > 20) {
    return (
      <Overlay onClose={onClose}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            {!cls ? "Selecione uma classe primeiro." : "Nível máximo (20) atingido."}
          </p>
          <Button className="mt-4" onClick={onClose}>Fechar</Button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <LevelUpWizard cls={cls} fromLevel={fromLevel} toLevel={toLevel} onClose={onClose} />
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border bg-card shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function LevelUpWizard({ cls, fromLevel, toLevel, onClose }: {
  cls: NonNullable<ReturnType<typeof classes.find>>;
  fromLevel: number;
  toLevel: number;
  onClose: () => void;
}) {
  const char = useCharacterStore();

  // Determine which steps are needed
  const needsSubclass = cls.subclassLevel === toLevel && cls.subclasses.length > 0 && !char.subclass;
  const needsASI = cls.asiLevels.includes(toLevel);
  const isSpellcaster = cls.spellcasting != null;

  const steps = useMemo<LevelUpStep[]>(() => {
    const s: LevelUpStep[] = ["gains", "hp"];
    if (needsSubclass) s.push("subclass");
    if (needsASI) s.push("asi");
    if (isSpellcaster) s.push("spells");
    s.push("summary");
    return s;
  }, [needsSubclass, needsASI, isSpellcaster]);

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const currentStep = steps[currentStepIdx];

  // HP state
  const [hpMethod, setHpMethod] = useState<"average" | "roll" | null>(null);
  const [hpRollResult, setHpRollResult] = useState<number | null>(null);
  const averageHP = Math.ceil(cls.hitDie / 2) + 1;

  // Subclass state
  const [selectedSubclass, setSelectedSubclass] = useState<string | null>(char.subclass);

  // ASI state
  const [asiChoice, setAsiChoice] = useState<ASIOrFeatChoice>({ type: "asi", asi: {} });

  // New features for this level
  const newClassFeatures = useMemo(() => {
    const levelData = cls.featuresByLevel.find((f) => f.level === toLevel);
    return levelData?.features ?? [];
  }, [cls, toLevel]);

  const newSubclassFeatures = useMemo(() => {
    if (!char.subclass && !selectedSubclass) return [];
    const scId = selectedSubclass || char.subclass;
    const sc = cls.subclasses.find((s) => s.id === scId);
    if (!sc) return [];
    const levelData = sc.featuresByLevel.find((f) => f.level === toLevel);
    return levelData?.features ?? [];
  }, [cls, toLevel, selectedSubclass, char.subclass]);

  // Spellcasting changes
  const spellChanges = useMemo(() => {
    if (!cls.spellcasting) return null;
    const sc = cls.spellcasting;
    const abilityMap: Record<string, AbilityKey> = {
      Força: "str", Destreza: "dex", Constituição: "con",
      Inteligência: "int", Sabedoria: "wis", Carisma: "cha",
    };
    const scKey = abilityMap[sc.ability];
    const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses);
    const scMod = scKey ? calcAbilityMod(finalScores[scKey]) : 0;

    const getCantrips = (lvl: number) => {
      let v = 0;
      for (let l = lvl; l >= 1; l--) {
        if (sc.cantripsKnownAtLevel[l] !== undefined) { v = sc.cantripsKnownAtLevel[l]; break; }
      }
      return v;
    };
    const getSlots = (lvl: number) => sc.spellSlotsByLevel[lvl] ?? {};

    const oldCantrips = getCantrips(fromLevel);
    const newCantrips = getCantrips(toLevel);
    const oldSlots = getSlots(fromLevel);
    const newSlots = getSlots(toLevel);

    let oldPrepared = 0, newPrepared = 0;
    if (sc.type === "prepared") {
      oldPrepared = Math.max(1, scMod + fromLevel);
      newPrepared = Math.max(1, scMod + toLevel);
    }

    return { oldCantrips, newCantrips, oldSlots, newSlots, oldPrepared, newPrepared };
  }, [cls, fromLevel, toLevel, char]);

  // Proficiency bonus change
  const oldProfBonus = calcProficiencyBonus(fromLevel);
  const newProfBonus = calcProficiencyBonus(toLevel);

  // CON mod for HP
  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses);
  const conMod = calcAbilityMod(finalScores.con);

  const hpGain = hpMethod === "average" ? averageHP + conMod :
    hpMethod === "roll" && hpRollResult !== null ? hpRollResult + conMod : 0;

  // Validation per step
  const isStepComplete = useCallback((step: LevelUpStep) => {
    switch (step) {
      case "gains": return true; // auto
      case "hp": return hpMethod !== null && (hpMethod === "average" || hpRollResult !== null);
      case "subclass": return !!selectedSubclass;
      case "asi": {
        if (asiChoice.type === "feat") return !!asiChoice.featId;
        if (asiChoice.type === "asi") {
          const total = Object.values(asiChoice.asi ?? {}).reduce((s, v) => s + (v ?? 0), 0);
          return total === 2;
        }
        return false;
      }
      case "spells": return true; // info only for prepared casters
      case "summary": return true;
      default: return false;
    }
  }, [hpMethod, hpRollResult, selectedSubclass, asiChoice]);

  const canAdvance = isStepComplete(currentStep);
  const isLastStep = currentStepIdx === steps.length - 1;

  const handleRollHP = () => {
    const result = Math.floor(Math.random() * cls.hitDie) + 1;
    setHpRollResult(result);
    setHpMethod("roll");
  };

  // Build changes summary
  const buildSummary = useCallback((): LevelingChangeSummary[] => {
    const changes: LevelingChangeSummary[] = [];
    changes.push({ type: "prof", label: "Nível", details: `${fromLevel} → ${toLevel}` });
    if (oldProfBonus !== newProfBonus) {
      changes.push({ type: "prof", label: "Bônus de Proficiência", details: `+${oldProfBonus} → +${newProfBonus}` });
    }
    changes.push({ type: "hp", label: "Pontos de Vida", details: `+${hpGain} (${hpMethod === "average" ? "média" : `rolagem: ${hpRollResult}`} + CON ${conMod >= 0 ? "+" : ""}${conMod})` });
    newClassFeatures.forEach((f) => {
      changes.push({ type: "feature", label: f.name, details: f.description });
    });
    newSubclassFeatures.forEach((f) => {
      changes.push({ type: "feature", label: `[Subclasse] ${f.name}`, details: f.description });
    });
    if (needsSubclass && selectedSubclass) {
      const sc = cls.subclasses.find((s) => s.id === selectedSubclass);
      changes.push({ type: "subclass", label: "Subclasse", details: sc?.name ?? selectedSubclass });
    }
    if (needsASI) {
      if (asiChoice.type === "asi") {
        const parts = Object.entries(asiChoice.asi ?? {}).filter(([, v]) => v && v > 0).map(([k, v]) => `${ABILITY_SHORT[k as AbilityKey]} +${v}`);
        changes.push({ type: "asi", label: "Aumento de Atributo", details: parts.join(", ") });
      } else if (asiChoice.type === "feat" && asiChoice.featId) {
        const feat = feats.find((f) => f.id === asiChoice.featId);
        changes.push({ type: "asi", label: "Talento", details: feat?.name ?? asiChoice.featId });
      }
    }
    if (spellChanges) {
      if (spellChanges.newCantrips !== spellChanges.oldCantrips) {
        changes.push({ type: "spell", label: "Truques", details: `${spellChanges.oldCantrips} → ${spellChanges.newCantrips}` });
      }
      const newSlotKeys = Object.keys(spellChanges.newSlots);
      if (newSlotKeys.length > 0) {
        const slotStr = newSlotKeys.map((k) => `${k}º: ${spellChanges.newSlots[Number(k)]}`).join(", ");
        changes.push({ type: "spell", label: "Espaços de Magia", details: slotStr });
      }
    }
    return changes;
  }, [fromLevel, toLevel, hpGain, hpMethod, hpRollResult, conMod, oldProfBonus, newProfBonus, newClassFeatures, newSubclassFeatures, needsSubclass, selectedSubclass, needsASI, asiChoice, spellChanges, cls]);

  // Apply level up
  const handleConfirm = () => {
    const summary = buildSummary();

    // New features
    const addedFeatures: NormalizedFeature[] = [
      ...newClassFeatures.map((f) => ({
        sourceType: "class" as const,
        sourceId: cls.id,
        name: f.name,
        description: f.description,
        level: toLevel,
      })),
      ...newSubclassFeatures.map((f) => ({
        sourceType: "subclass" as const,
        sourceId: selectedSubclass || char.subclass || "",
        name: f.name,
        description: f.description,
        level: toLevel,
      })),
    ];

    // Apply ASI bonuses
    let newAsiBonuses = { ...char.asiBonuses };
    if (needsASI && asiChoice.type === "asi" && asiChoice.asi) {
      for (const [k, v] of Object.entries(asiChoice.asi)) {
        if (v) newAsiBonuses[k as AbilityKey] = (newAsiBonuses[k as AbilityKey] ?? 0) + v;
      }
    }

    // New spells slots
    let newSlots = char.spells.slots;
    if (spellChanges) {
      const slotObj = spellChanges.newSlots;
      const maxCircle = Math.max(0, ...Object.keys(slotObj).map(Number));
      newSlots = [];
      for (let i = 0; i < maxCircle; i++) {
        newSlots.push(slotObj[i + 1] ?? 0);
      }
    }

    // Subclass features from all levels <= toLevel if just choosing subclass
    let subclassFeatures: NormalizedFeature[] = [];
    if (needsSubclass && selectedSubclass) {
      const sc = cls.subclasses.find((s) => s.id === selectedSubclass);
      if (sc) {
        sc.featuresByLevel.forEach((flvl) => {
          if (flvl.level <= toLevel) {
            flvl.features.forEach((f) => {
              // Avoid duplicates with addedFeatures
              if (!addedFeatures.some((af) => af.name === f.name && af.level === flvl.level)) {
                subclassFeatures.push({
                  sourceType: "subclass",
                  sourceId: selectedSubclass,
                  name: f.name,
                  description: f.description,
                  level: flvl.level,
                });
              }
            });
          }
        });
      }
    }

    // Build feat feature if chosen
    let featFeature: NormalizedFeature | null = null;
    if (needsASI && asiChoice.type === "feat" && asiChoice.featId) {
      const feat = feats.find((f) => f.id === asiChoice.featId);
      if (feat) {
        featFeature = {
          sourceType: "class",
          sourceId: cls.id,
          name: `Talento: ${feat.name}`,
          description: feat.description,
          level: toLevel,
          tags: ["feat"],
        };
      }
    }

    char.patchCharacter({
      level: toLevel,
      asiBonuses: newAsiBonuses,
      features: [
        ...char.features,
        ...addedFeatures,
        ...subclassFeatures,
        ...(featFeature ? [featFeature] : []),
      ],
      hitPoints: {
        max: char.hitPoints.max + hpGain,
        current: char.hitPoints.current + hpGain,
      },
      subclass: needsSubclass && selectedSubclass ? selectedSubclass : char.subclass,
      spells: {
        ...char.spells,
        slots: newSlots,
      },
      leveling: {
        pending: false,
        fromLevel,
        toLevel,
        hpMethod: hpMethod!,
        hpRolls: { ...char.leveling.hpRolls, [toLevel]: hpMethod === "roll" ? hpRollResult! : averageHP },
        choices: {
          subclassId: needsSubclass && selectedSubclass ? selectedSubclass : char.leveling.choices.subclassId,
          asiOrFeat: needsASI ? { ...char.leveling.choices.asiOrFeat, [toLevel]: asiChoice } : char.leveling.choices.asiOrFeat,
        },
        changesSummary: summary,
      },
    });

    onClose();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ArrowUp className="h-6 w-6 text-primary" />
          Level Up: Nível {fromLevel} → {toLevel}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {cls.name} — Passo {currentStepIdx + 1} de {steps.length}
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex gap-1 mb-6">
        {steps.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < currentStepIdx ? "bg-success" : i === currentStepIdx ? "bg-primary" : "bg-secondary"
          }`} />
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {currentStep === "gains" && (
          <StepGains
            newProfBonus={newProfBonus}
            oldProfBonus={oldProfBonus}
            newClassFeatures={newClassFeatures}
            newSubclassFeatures={newSubclassFeatures}
            toLevel={toLevel}
            cls={cls}
          />
        )}
        {currentStep === "hp" && (
          <StepHP
            hitDie={cls.hitDie}
            conMod={conMod}
            averageHP={averageHP}
            hpMethod={hpMethod}
            hpRollResult={hpRollResult}
            hpGain={hpGain}
            onSelectAverage={() => { setHpMethod("average"); setHpRollResult(null); }}
            onRoll={handleRollHP}
          />
        )}
        {currentStep === "subclass" && (
          <StepSubclass
            cls={cls}
            selected={selectedSubclass}
            onSelect={setSelectedSubclass}
          />
        )}
        {currentStep === "asi" && (
          <StepASI
            asiChoice={asiChoice}
            onChangeChoice={setAsiChoice}
            currentScores={finalScores}
            asiBonuses={char.asiBonuses}
          />
        )}
        {currentStep === "spells" && spellChanges && (
          <StepSpellsInfo spellChanges={spellChanges} cls={cls} />
        )}
        {currentStep === "summary" && (
          <StepSummary summary={buildSummary()} />
        )}
      </div>

      {/* Nav */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => currentStepIdx > 0 ? setCurrentStepIdx(currentStepIdx - 1) : onClose()}
        >
          {currentStepIdx === 0 ? "Cancelar" : "Voltar"}
        </Button>
        {isLastStep ? (
          <Button onClick={handleConfirm} disabled={!canAdvance} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Concluir Level Up
          </Button>
        ) : (
          <Button onClick={() => setCurrentStepIdx(currentStepIdx + 1)} disabled={!canAdvance} className="gap-1">
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Step Components ──

function StepGains({ newProfBonus, oldProfBonus, newClassFeatures, newSubclassFeatures, toLevel, cls }: any) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Ganhos Automáticos
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-secondary/30 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Bônus Prof.</p>
          <p className="text-xl font-bold">
            +{newProfBonus}
            {oldProfBonus !== newProfBonus && (
              <span className="text-sm text-success ml-1">(era +{oldProfBonus})</span>
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-secondary/30 p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Dado de Vida</p>
          <p className="text-xl font-bold">d{cls.hitDie}</p>
        </div>
      </div>

      {newClassFeatures.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">Novas Características da Classe</p>
          {newClassFeatures.map((f: any) => (
            <div key={f.name} className="rounded-lg border p-3 mb-2">
              <p className="font-medium text-sm">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
            </div>
          ))}
        </div>
      )}

      {newSubclassFeatures.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase mb-2">Novas Características da Subclasse</p>
          {newSubclassFeatures.map((f: any) => (
            <div key={f.name} className="rounded-lg border p-3 mb-2">
              <p className="font-medium text-sm">{f.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
            </div>
          ))}
        </div>
      )}

      {newClassFeatures.length === 0 && newSubclassFeatures.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma característica nova neste nível.</p>
      )}
    </div>
  );
}

function StepHP({ hitDie, conMod, averageHP, hpMethod, hpRollResult, hpGain, onSelectAverage, onRoll }: {
  hitDie: number; conMod: number; averageHP: number;
  hpMethod: "average" | "roll" | null; hpRollResult: number | null;
  hpGain: number; onSelectAverage: () => void; onRoll: () => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Heart className="h-5 w-5 text-destructive" /> Pontos de Vida
      </h3>
      <p className="text-sm text-muted-foreground">
        Escolha como determinar seus PV adicionais (d{hitDie} + CON mod {conMod >= 0 ? "+" : ""}{conMod}).
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Average */}
        <button
          onClick={onSelectAverage}
          className={`rounded-lg border p-4 text-center transition-colors ${
            hpMethod === "average" ? "border-primary bg-primary/10" : "hover:bg-secondary/50"
          }`}
        >
          <p className="text-sm font-semibold">Média</p>
          <p className="text-2xl font-bold mt-1">{averageHP}</p>
          <p className="text-xs text-muted-foreground mt-1">
            (⌈d{hitDie}/2⌉ + 1 = {averageHP})
          </p>
        </button>

        {/* Roll */}
        <button
          onClick={onRoll}
          className={`rounded-lg border p-4 text-center transition-colors ${
            hpMethod === "roll" ? "border-primary bg-primary/10" : "hover:bg-secondary/50"
          }`}
        >
          <p className="text-sm font-semibold flex items-center justify-center gap-1">
            <Dice1 className="h-4 w-4" /> Rolar
          </p>
          {hpRollResult !== null ? (
            <p className="text-2xl font-bold mt-1">{hpRollResult}</p>
          ) : (
            <p className="text-2xl font-bold mt-1 text-muted-foreground">?</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {hpRollResult !== null ? `Rolou ${hpRollResult} no d${hitDie}` : `Clique para rolar 1d${hitDie}`}
          </p>
        </button>
      </div>

      {hpMethod && (
        <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-center">
          <p className="text-sm text-success font-semibold">
            Ganho total: +{hpGain} PV
          </p>
          <p className="text-xs text-muted-foreground">
            ({hpMethod === "average" ? averageHP : hpRollResult} + {conMod >= 0 ? "+" : ""}{conMod} CON)
          </p>
        </div>
      )}
    </div>
  );
}

function StepSubclass({ cls, selected, onSelect }: {
  cls: NonNullable<ReturnType<typeof classes.find>>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" /> Escolha sua Subclasse
      </h3>
      <p className="text-sm text-muted-foreground">
        No nível {cls.subclassLevel ?? "?"}, você deve escolher uma subclasse para {cls.name}.
      </p>
      <div className="space-y-2">
        {[...cls.subclasses].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((sc) => (
          <button
            key={sc.id}
            onClick={() => onSelect(sc.id)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selected === sc.id ? "border-primary bg-primary/10" : "hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{sc.name}</p>
              {selected === sc.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{sc.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepASI({ asiChoice, onChangeChoice, currentScores, asiBonuses }: {
  asiChoice: ASIOrFeatChoice;
  onChangeChoice: (c: ASIOrFeatChoice) => void;
  currentScores: Record<AbilityKey, number>;
  asiBonuses: Record<AbilityKey, number>;
}) {
  const asiTotal = Object.values(asiChoice.asi ?? {}).reduce((s, v) => s + (v ?? 0), 0);

  const handleASIChange = (ability: AbilityKey, delta: number) => {
    const current = asiChoice.asi?.[ability] ?? 0;
    const newVal = current + delta;
    if (newVal < 0 || newVal > 2) return;
    const newAsi = { ...asiChoice.asi, [ability]: newVal };
    const newTotal = Object.values(newAsi).reduce((s, v) => s + (v ?? 0), 0);
    if (newTotal > 2) return;
    // Check cap 20
    if (currentScores[ability] + (asiBonuses[ability] ?? 0) + newVal > 20) return;
    onChangeChoice({ type: "asi", asi: newAsi });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <ArrowUp className="h-5 w-5 text-primary" /> Aumento de Atributo ou Talento
      </h3>

      {/* Toggle */}
      <div className="flex gap-2">
        <Button
          variant={asiChoice.type === "asi" ? "default" : "outline"}
          onClick={() => onChangeChoice({ type: "asi", asi: {} })}
          size="sm"
        >
          Aumento de Atributo
        </Button>
        <Button
          variant={asiChoice.type === "feat" ? "default" : "outline"}
          onClick={() => onChangeChoice({ type: "feat", featId: undefined })}
          size="sm"
        >
          Talento
        </Button>
      </div>

      {asiChoice.type === "asi" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Distribua +2 pontos entre seus atributos ({asiTotal}/2 usados). Máximo 20 por atributo.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ABILITIES.map((a) => {
              const currentVal = currentScores[a];
              const added = asiChoice.asi?.[a] ?? 0;
              const canAdd = asiTotal < 2 && currentVal + (asiBonuses[a] ?? 0) + added + 1 <= 20;
              return (
                <div key={a} className="rounded-lg border p-3 text-center">
                  <p className="text-xs uppercase text-muted-foreground">{ABILITY_LABELS[a]}</p>
                  <p className="text-lg font-bold">{currentVal}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      onClick={() => handleASIChange(a, -1)}
                      disabled={added <= 0}
                      className="rounded bg-secondary px-2 py-0.5 text-xs disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className={`text-sm font-bold w-6 text-center ${added > 0 ? "text-primary" : ""}`}>
                      {added > 0 ? `+${added}` : "—"}
                    </span>
                    <button
                      onClick={() => handleASIChange(a, 1)}
                      disabled={!canAdd}
                      className="rounded bg-secondary px-2 py-0.5 text-xs disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {asiChoice.type === "feat" && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Escolha um talento.</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...feats].filter((f) => f.type === "general").sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((feat) => (
              <button
                key={feat.id}
                onClick={() => onChangeChoice({ type: "feat", featId: feat.id })}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  asiChoice.featId === feat.id ? "border-primary bg-primary/10" : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{feat.name}</p>
                  {asiChoice.featId === feat.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{feat.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepSpellsInfo({ spellChanges, cls }: { spellChanges: any; cls: any }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" /> Mudanças de Conjuração
      </h3>

      <div className="space-y-3">
        {spellChanges.newCantrips !== spellChanges.oldCantrips && (
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Limite de Truques</p>
            <p className="text-xs text-muted-foreground">{spellChanges.oldCantrips} → <span className="text-primary font-bold">{spellChanges.newCantrips}</span></p>
          </div>
        )}

        {spellChanges.newPrepared !== spellChanges.oldPrepared && cls.spellcasting?.type === "prepared" && (
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Limite de Magias Preparadas</p>
            <p className="text-xs text-muted-foreground">{spellChanges.oldPrepared} → <span className="text-primary font-bold">{spellChanges.newPrepared}</span></p>
          </div>
        )}

        <div className="rounded-lg border p-3">
          <p className="text-sm font-medium mb-2">Espaços de Magia</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(spellChanges.newSlots).map(([circle, count]) => {
              const oldCount = spellChanges.oldSlots[Number(circle)] ?? 0;
              const changed = (count as number) !== oldCount;
              return (
                <div key={circle} className={`rounded-lg border px-3 py-1.5 text-center ${changed ? "border-primary bg-primary/10" : "bg-secondary/30"}`}>
                  <p className="text-[10px] text-muted-foreground">{circle}º</p>
                  <p className="font-bold">{count as number}</p>
                  {changed && <p className="text-[9px] text-success">(era {oldCount})</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-info/30 bg-info/10 p-3">
          <p className="text-xs text-info">
            💡 Ajuste suas magias preparadas/conhecidas na etapa "Magias" do wizard após concluir o Level Up.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepSummary({ summary }: { summary: LevelingChangeSummary[] }) {
  const icons: Record<string, React.ReactNode> = {
    feature: <BookOpen className="h-4 w-4 text-primary" />,
    hp: <Heart className="h-4 w-4 text-destructive" />,
    spell: <Sparkles className="h-4 w-4 text-info" />,
    prof: <Shield className="h-4 w-4 text-success" />,
    asi: <ArrowUp className="h-4 w-4 text-warning" />,
    subclass: <Swords className="h-4 w-4 text-primary" />,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-success" /> Resumo do Level Up
      </h3>
      <p className="text-sm text-muted-foreground">Revise todas as mudanças antes de confirmar.</p>
      <div className="space-y-2">
        {summary.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="mt-0.5 shrink-0">{icons[s.type] ?? <CheckCircle2 className="h-4 w-4" />}</div>
            <div>
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
