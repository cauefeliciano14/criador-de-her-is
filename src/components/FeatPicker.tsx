import { useState, useMemo } from "react";
import { feats, type FeatData } from "@/data/feats";
import { useCharacterStore } from "@/state/characterStore";
import { checkFeatEligibility } from "@/utils/feats";
import { ABILITIES, ABILITY_LABELS, ABILITY_SHORT, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";
import {
  Search, CheckCircle2, AlertCircle, Star, ChevronDown, ChevronUp,
  Shield, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FeatSelection {
  featId: string;
  choices?: {
    abilityIncreases?: Partial<Record<AbilityKey, number>>;
  };
}

interface FeatPickerProps {
  /** Which feat types to show */
  allowedTypes?: FeatData["type"][];
  /** Currently selected feat */
  selectedFeatId?: string | null;
  /** Current ASI choices (for ASI feat) */
  asiChoices?: Partial<Record<AbilityKey, number>>;
  /** Already taken feat IDs (to disable duplicates) */
  takenFeatIds?: string[];
  /** Callback when a feat is selected */
  onSelect: (selection: FeatSelection) => void;
  /** Whether to show inline ASI controls */
  showASIControls?: boolean;
}

export function FeatPicker({
  allowedTypes = ["general", "asi"],
  selectedFeatId,
  asiChoices = {},
  takenFeatIds = [],
  onSelect,
  showASIControls = true,
}: FeatPickerProps) {
  const char = useCharacterStore();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(selectedFeatId ?? null);
  const [typeFilter, setTypeFilter] = useState<FeatData["type"] | "all">("all");

  const finalScores = useMemo(
    () => getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses),
    [char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses]
  );

  const filteredFeats = useMemo(() => {
    return feats
      .filter((f) => allowedTypes.includes(f.type))
      .filter((f) => typeFilter === "all" || f.type === typeFilter)
      .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [search, typeFilter, allowedTypes]);

  const TYPE_LABELS: Record<string, string> = {
    all: "Todos",
    asi: "ASI",
    general: "Geral",
    origin: "Origem",
    epic: "Épico",
  };

  const asiTotal = Object.values(asiChoices).reduce((s, v) => s + (v ?? 0), 0);

  const handleASIChange = (ability: AbilityKey, delta: number) => {
    const current = asiChoices[ability] ?? 0;
    const newVal = current + delta;
    if (newVal < 0 || newVal > 2) return;

    const newAsi = { ...asiChoices, [ability]: newVal };
    const newTotal = Object.values(newAsi).reduce((s, v) => s + (v ?? 0), 0);
    if (newTotal > 2) return;

    // Cap at 20
    if (finalScores[ability] + (char.asiBonuses[ability] ?? 0) + newVal > 20) return;

    // Ensure +1/+1 not on same ability (already handled by newVal > 2 check)
    onSelect({ featId: "aumentoAtributo", choices: { abilityIncreases: newAsi } });
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar talento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Type filters */}
      {allowedTypes.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {["all", ...allowedTypes].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t as any)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      )}

      {/* Feats list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filteredFeats.map((feat) => {
          const isSel = selectedFeatId === feat.id;
          const isExpanded = expandedId === feat.id;
          const eligibility = checkFeatEligibility(char, feat);
          const alreadyTaken = takenFeatIds.includes(feat.id) && feat.id !== "aumentoAtributo";
          const canSelect = eligibility.eligible && !alreadyTaken;
          const isASI = feat.id === "aumentoAtributo";

          return (
            <div
              key={feat.id}
              className={`rounded-lg border transition-colors ${
                isSel ? "border-primary bg-primary/5" : canSelect ? "" : "opacity-60"
              }`}
            >
              <button
                onClick={() => {
                  if (!canSelect) return;
                  setExpandedId(isExpanded ? null : feat.id);
                  if (!isASI) {
                    onSelect({ featId: feat.id });
                  }
                }}
                disabled={!canSelect}
                className="w-full p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {feat.type === "origin" ? (
                      <Star className="h-4 w-4 text-primary shrink-0" />
                    ) : feat.type === "asi" ? (
                      <Sparkles className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{feat.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">
                      {TYPE_LABELS[feat.type] ?? feat.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {alreadyTaken && (
                      <span className="text-[10px] text-muted-foreground">Já obtido</span>
                    )}
                    {!canSelect && !alreadyTaken && (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{feat.description}</p>
              </button>

              {/* Eligibility reasons */}
              {!eligibility.eligible && (
                <div className="px-3 pb-2">
                  <p className="text-[10px] text-destructive font-medium mb-0.5">Pré-requisitos não atendidos:</p>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5">
                    {eligibility.reasons.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Expand toggle */}
              {canSelect && (
                <button
                  onClick={() => setExpandedId(isExpanded ? null : feat.id)}
                  className="w-full flex items-center justify-center gap-1 py-1 text-[10px] text-muted-foreground hover:text-foreground border-t transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? "Ocultar" : "Detalhes"}
                </button>
              )}

              {/* Expanded details */}
              {isExpanded && canSelect && (
                <div className="px-3 pb-3 space-y-2 border-t pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>

                  {/* Effects summary */}
                  {feat.effects.abilityIncrease && !isASI && (
                    <div className="rounded-md bg-secondary/40 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Bônus de Atributo</p>
                      {feat.effects.abilityIncrease.mode === "plus1" && feat.effects.abilityIncrease.abilities && (
                        <p className="text-xs">+1 em {feat.effects.abilityIncrease.abilities.map(a => ABILITY_LABELS[a]).join(" ou ")}</p>
                      )}
                      {feat.effects.abilityIncrease.mode === "choose1" && feat.effects.abilityIncrease.abilities && (
                        <p className="text-xs">+1 em {feat.effects.abilityIncrease.abilities.map(a => ABILITY_LABELS[a]).join(" ou ")}</p>
                      )}
                    </div>
                  )}

                  {feat.effects.flags && Object.keys(feat.effects.flags).length > 0 && (
                    <div className="rounded-md bg-secondary/40 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Efeitos Especiais</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Efeitos aplicados automaticamente quando implementados no sistema.
                      </p>
                    </div>
                  )}

                  {/* ASI controls inline */}
                  {isASI && showASIControls && (
                    <ASIControls
                      asiChoices={asiChoices}
                      asiTotal={asiTotal}
                      finalScores={finalScores}
                      asiBonuses={char.asiBonuses}
                      onASIChange={handleASIChange}
                    />
                  )}

                  {!isSel && !isASI && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onSelect({ featId: feat.id })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Selecionar
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFeats.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum talento encontrado.
          </p>
        )}
      </div>
    </div>
  );
}

function ASIControls({
  asiChoices,
  asiTotal,
  finalScores,
  asiBonuses,
  onASIChange,
}: {
  asiChoices: Partial<Record<AbilityKey, number>>;
  asiTotal: number;
  finalScores: Record<AbilityKey, number>;
  asiBonuses: Record<AbilityKey, number>;
  onASIChange: (ability: AbilityKey, delta: number) => void;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Distribua +2 pontos entre seus atributos ({asiTotal}/2). Máximo 20 por atributo.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {ABILITIES.map((a) => {
          const currentVal = finalScores[a];
          const added = asiChoices[a] ?? 0;
          const canAdd = asiTotal < 2 && currentVal + (asiBonuses[a] ?? 0) + added + 1 <= 20;
          return (
            <div key={a} className="rounded-md border p-2 text-center">
              <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
              <p className="text-sm font-bold">{currentVal}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <button
                  onClick={() => onASIChange(a, -1)}
                  disabled={added <= 0}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[10px] disabled:opacity-30"
                >
                  −
                </button>
                <span className={`text-xs font-bold w-5 text-center ${added > 0 ? "text-primary" : ""}`}>
                  {added > 0 ? `+${added}` : "—"}
                </span>
                <button
                  onClick={() => onASIChange(a, 1)}
                  disabled={!canAdd}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[10px] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
