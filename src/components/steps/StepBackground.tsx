import { useCharacterStore, mergeUnique, replaceFeatures, type NormalizedFeature } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { backgrounds, type Background } from "@/data/backgrounds";
import { ABILITIES, ABILITY_LABELS, ABILITY_SHORT, type AbilityKey } from "@/utils/calculations";
import { CheckCircle2, Search, Info, Star, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export function StepBackground() {
  const [search, setSearch] = useState("");
  const [featExpanded, setFeatExpanded] = useState(true);

  const bgId = useCharacterStore((s) => s.background);
  const backgroundAbilityChoices = useCharacterStore((s) => s.backgroundAbilityChoices);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...backgrounds]
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedBg = backgrounds.find((b) => b.id === bgId);

  // --- Validation ---
  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!bgId) {
      missing.push("Escolher antecedente");
      return missing;
    }
    const bg = backgrounds.find((b) => b.id === bgId);
    if (!bg) return missing;

    // Check ability bonus choices
    if (bg.abilityBonuses.mode === "choose" && bg.abilityBonuses.choose) {
      const needed = bg.abilityBonuses.choose.choices;
      const chosen = Object.keys(backgroundAbilityChoices).length;
      if (chosen < needed) {
        missing.push("Definir bônus de atributo do antecedente");
      }
    }

    // Origin feat is auto-applied, but verify
    const state = useCharacterStore.getState();
    const hasFeat = state.features.some(
      (f) => f.sourceType === "background" && f.tags?.includes("originFeat")
    );
    if (!hasFeat) {
      missing.push("Talento de Origem não aplicado");
    }

    return missing;
  }, [bgId, backgroundAbilityChoices]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("background", missing);
    if (missing.length === 0 && bgId) {
      completeStep("background");
    } else {
      uncompleteStep("background");
    }
  }, [bgId, backgroundAbilityChoices]);

  // --- Select background ---
  const handleSelect = (id: string) => {
    if (id === bgId) return;
    const bg = backgrounds.find((b) => b.id === id)!;
    const state = useCharacterStore.getState();

    // Remove old background features
    const features = replaceFeatures(state.features, ["background"], [
      {
        sourceType: "background",
        sourceId: bg.id,
        name: bg.originFeat.name,
        description: bg.originFeat.description,
        level: 1,
        tags: ["originFeat"],
      },
    ]);

    // Compute background bonuses
    let bgBonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (bg.abilityBonuses.mode === "fixed" && bg.abilityBonuses.fixed) {
      for (const key of ABILITIES) {
        bgBonuses[key] = bg.abilityBonuses.fixed[key] ?? 0;
      }
    }

    // Merge equipment: keep class equipment, add background
    const classEquipItems = state.classEquipmentChoice ? state.equipment : [];
    const mergedEquipment = mergeUnique(classEquipItems, bg.equipment.items);

    patchCharacter({
      background: id,
      backgroundAbilityChoices: {},
      backgroundBonuses: bgBonuses,
      features,
      equipment: mergedEquipment,
      // We don't overwrite proficiencies wholesale - we merge
      proficiencies: {
        ...state.proficiencies,
        tools: mergeUnique(state.proficiencies.tools, bg.tools),
        languages: mergeUnique(state.proficiencies.languages, bg.languages),
      },
      skills: mergeUnique(state.skills, bg.skills),
    });
  };

  // --- Ability choice toggle ---
  const handleAbilityChoice = (ability: AbilityKey) => {
    if (!selectedBg || selectedBg.abilityBonuses.mode !== "choose" || !selectedBg.abilityBonuses.choose) return;
    const { choices, bonus, maxPerAbility } = selectedBg.abilityBonuses.choose;

    const current = { ...backgroundAbilityChoices };
    if (current[ability] !== undefined) {
      delete current[ability];
    } else {
      if (Object.keys(current).length >= choices) return;
      if ((current[ability] ?? 0) >= maxPerAbility) return;
      current[ability] = bonus;
    }

    // Build bonuses from choices
    const bgBonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    for (const [k, v] of Object.entries(current)) {
      bgBonuses[k as AbilityKey] = v as number;
    }

    patchCharacter({
      backgroundAbilityChoices: current,
      backgroundBonuses: bgBonuses,
    });
  };

  return (
    <div className="flex gap-0 h-full">
      {/* Left - list */}
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">4. Antecedente</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar antecedente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          {sorted.map((bg) => {
            const isSelected = bgId === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bg.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {bg.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right - details */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedBg ? (
          <BackgroundDetails
            bg={selectedBg}
            backgroundAbilityChoices={backgroundAbilityChoices}
            featExpanded={featExpanded}
            onToggleFeat={() => setFeatExpanded(!featExpanded)}
            onAbilityChoice={handleAbilityChoice}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione um antecedente na lista ao lado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Details ───

interface BackgroundDetailsProps {
  bg: Background;
  backgroundAbilityChoices: Partial<Record<AbilityKey, number>>;
  featExpanded: boolean;
  onToggleFeat: () => void;
  onAbilityChoice: (ability: AbilityKey) => void;
}

function BackgroundDetails({
  bg,
  backgroundAbilityChoices,
  featExpanded,
  onToggleFeat,
  onAbilityChoice,
}: BackgroundDetailsProps) {
  const isChoose = bg.abilityBonuses.mode === "choose" && bg.abilityBonuses.choose;
  const chosenCount = Object.keys(backgroundAbilityChoices).length;
  const neededCount = bg.abilityBonuses.choose?.choices ?? 0;

  return (
    <div>
      <h2 className="text-2xl font-bold">{bg.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {bg.description}
      </p>

      <div className="mt-6 space-y-4">
        {/* Ability Bonuses */}
        <Section
          title="Bônus de Atributos"
          badge={
            isChoose && chosenCount < neededCount ? (
              <RequiredBadge label={`Escolha ${neededCount}`} />
            ) : null
          }
        >
          {bg.abilityBonuses.mode === "fixed" && bg.abilityBonuses.fixed ? (
            <div className="flex flex-wrap gap-2">
              {ABILITIES.filter((a) => (bg.abilityBonuses.fixed?.[a] ?? 0) > 0).map((a) => (
                <span key={a} className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm font-medium">
                  {ABILITY_SHORT[a]} +{bg.abilityBonuses.fixed![a]}
                </span>
              ))}
            </div>
          ) : isChoose ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                Escolha {neededCount} atributo(s) para receber +{bg.abilityBonuses.choose!.bonus}:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {bg.abilityBonuses.choose!.from.map((a) => {
                  const selected = backgroundAbilityChoices[a] !== undefined;
                  const disabled = !selected && chosenCount >= neededCount;
                  return (
                    <button
                      key={a}
                      onClick={() => onAbilityChoice(a)}
                      disabled={disabled}
                      className={`rounded-md border p-2 text-center transition-colors ${
                        selected
                          ? "border-primary bg-primary/10 font-medium"
                          : disabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:border-muted-foreground/40 hover:bg-secondary"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{ABILITY_SHORT[a]}</p>
                      <p className="text-sm font-medium">{ABILITY_LABELS[a]}</p>
                      {selected && (
                        <p className="text-xs text-primary font-medium mt-0.5">+{bg.abilityBonuses.choose!.bonus}</p>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {chosenCount}/{neededCount} selecionados
              </p>
            </>
          ) : null}
        </Section>

        {/* Skills */}
        <Section title="Perícias Concedidas">
          <div className="flex flex-wrap gap-2">
            {bg.skills.sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
              <span key={s} className="rounded bg-secondary px-2 py-1 text-sm">
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* Tools */}
        {bg.tools.length > 0 && (
          <Section title="Ferramentas Concedidas">
            <div className="flex flex-wrap gap-2">
              {bg.tools.sort((a, b) => a.localeCompare(b, "pt-BR")).map((t) => (
                <span key={t} className="rounded bg-secondary px-2 py-1 text-sm">
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {bg.languages.length > 0 && (
          <Section title="Idiomas Concedidos">
            <div className="flex flex-wrap gap-2">
              {bg.languages.sort((a, b) => a.localeCompare(b, "pt-BR")).map((l) => (
                <span key={l} className="rounded bg-secondary px-2 py-1 text-sm">
                  {l}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Origin Feat */}
        <Section title="Talento de Origem" badge={<FeatBadge />}>
          <div className="rounded-md border bg-secondary/40">
            <button
              onClick={onToggleFeat}
              className="flex w-full items-center justify-between p-3"
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{bg.originFeat.name}</span>
              </div>
              {featExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {featExpanded && (
              <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">
                {bg.originFeat.description}
              </p>
            )}
          </div>
        </Section>

        {/* Equipment */}
        <Section title="Equipamento">
          {bg.equipment.items.length > 0 && (
            <ul className="list-disc ml-5 text-sm space-y-1 mb-2">
              {bg.equipment.items.sort((a, b) => a.localeCompare(b, "pt-BR")).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          {bg.equipment.gold > 0 && (
            <p className="text-sm text-muted-foreground">
              <Package className="inline h-3.5 w-3.5 mr-1" />
              {bg.equipment.gold} PO
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}

// ─── Helpers ───

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {badge}
      </div>
      <div>{children}</div>
    </div>
  );
}

function RequiredBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
      <Info className="h-3 w-3" />
      {label}
    </span>
  );
}

function FeatBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      <Star className="h-3 w-3" />
      Automático
    </span>
  );
}
