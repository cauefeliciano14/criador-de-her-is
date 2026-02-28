import { useCharacterStore, mergeUnique, replaceFeatures, type NormalizedFeature } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { backgrounds, type Background } from "@/data/backgrounds";
import { ABILITY_LABELS, ABILITY_SHORT, type AbilityKey } from "@/utils/calculations";
import { CheckCircle2, Search, Info, Star, Package, ChevronDown, ChevronUp } from "lucide-react";
import { getChoicesRequirements } from "@/utils/choices";
import { useState, useEffect, useCallback, useMemo } from "react";
import { commonLanguages } from "@/data/languagesCommon";

export function StepBackground() {
  const [search, setSearch] = useState("");
  const [featExpanded, setFeatExpanded] = useState(true);

  const bgId = useCharacterStore((s) => s.background);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...backgrounds]
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedBg = backgrounds.find((b) => b.id === bgId);
  const char = useCharacterStore();
  const datasetsVersion = `${backgrounds.length}`;
  const requirements = useMemo(() => getChoicesRequirements(char), [char.class, char.race, char.background, char.level, char.choiceSelections, datasetsVersion]);
  const bgLanguageSource = requirements.buckets.languages.sources.find((s) => s.startsWith("background:"));
  const bgLanguageRequired = bgLanguageSource ? Number(bgLanguageSource.split(":").pop()) || 0 : 0;
  const baseLanguageChoices = 2;

  // --- Validation (simplified — bonus moved to ability step) ---
  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!bgId) {
      missing.push("Escolher antecedente");
      return missing;
    }
    const state = useCharacterStore.getState();
    const hasFeat = state.features.some(
      (f) => f.sourceType === "background" && f.tags?.includes("originFeat")
    );
    if (!hasFeat) {
      missing.push("Talento de Origem não aplicado");
    }
    if (requirements.buckets.languages.pendingCount > 0) {
      missing.push(`Escolher idiomas (${requirements.buckets.languages.selectedIds.length}/${requirements.buckets.languages.requiredCount})`);
    }
    return missing;
  }, [bgId, requirements.buckets.languages.pendingCount, requirements.buckets.languages.requiredCount, requirements.buckets.languages.selectedIds.length]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("origin", missing);
    if (missing.length === 0 && bgId) {
      completeStep("origin");
    } else {
      uncompleteStep("origin");
    }
  }, [bgId, computeMissing, completeStep, setMissing, uncompleteStep]);

  // --- Select background ---
  const handleSelect = (id: string) => {
    if (id === bgId) return;
    const bg = backgrounds.find((b) => b.id === id)!;
    const state = useCharacterStore.getState();

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

    patchCharacter({
      background: id,
      backgroundEquipmentChoice: null,
      backgroundAbilityChoices: {},
      backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      features,
      proficiencies: {
        ...state.proficiencies,
        tools: mergeUnique(state.proficiencies.tools, bg.tools),
        languages: mergeUnique(state.proficiencies.languages, bg.languages),
      },
      skills: mergeUnique(state.skills, bg.skills),
    });
  };


  const toggleLanguage = (languageId: string) => {
    const current = new Set(char.choiceSelections.languages ?? []);
    if (current.has(languageId)) current.delete(languageId);
    else if (current.size < requirements.buckets.languages.requiredCount) current.add(languageId);
    patchCharacter({ choiceSelections: { ...char.choiceSelections, languages: [...current] } });
  };

  return (
    <div className="flex flex-col md:flex-row gap-0">
      {/* Left - list */}
      <div className="w-full md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">2. Origem</h2>
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedBg ? (
          <BackgroundDetails
            bg={selectedBg}
            featExpanded={featExpanded}
            onToggleFeat={() => setFeatExpanded(!featExpanded)}
            bgLanguageRequired={bgLanguageRequired}
            baseLanguageChoices={baseLanguageChoices}
            languageOptions={requirements.buckets.languages.options}
            selectedLanguages={char.choiceSelections.languages ?? []}
            selectedCount={requirements.buckets.languages.selectedIds.length}
            totalRequiredLanguages={requirements.buckets.languages.requiredCount}
            onToggleLanguage={toggleLanguage}
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
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
  featExpanded: boolean;
  onToggleFeat: () => void;
  bgLanguageRequired: number;
  baseLanguageChoices: number;
  languageOptions: { id: string; name: string }[];
  selectedLanguages: string[];
  selectedCount: number;
  totalRequiredLanguages: number;
  onToggleLanguage: (id: string) => void;
}

function BackgroundDetails({ bg, featExpanded, onToggleFeat, bgLanguageRequired, baseLanguageChoices, languageOptions, selectedLanguages, selectedCount, totalRequiredLanguages, onToggleLanguage }: BackgroundDetailsProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{bg.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{bg.description}</p>

      <div className="mt-6 space-y-4">
        {/* Ability Options info */}
        {bg.abilityOptions && bg.abilityOptions.length === 3 && (
          <Section title="Bônus de Atributos">
            <p className="text-sm text-muted-foreground mb-2">
              Este antecedente permite bônus em: 
            </p>
            <div className="flex gap-2">
              {bg.abilityOptions.map((a) => (
                <span key={a} className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm font-medium">
                  {ABILITY_SHORT[a]} — {ABILITY_LABELS[a]}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-info">
              <Info className="inline h-3 w-3 mr-1" />
              A distribuição dos bônus (+2/+1 ou +1/+1/+1) é feita na etapa "Distribuir Atributos".
            </p>
          </Section>
        )}

        {/* Skills */}
        <Section title="Perícias Concedidas">
          <div className="flex flex-wrap gap-2">
            {[...bg.skills].sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
              <span key={s} className="rounded bg-secondary px-2 py-1 text-sm">{s}</span>
            ))}
          </div>
        </Section>

        {/* Tools */}
        {bg.tools.length > 0 && (
          <Section title="Ferramentas Concedidas">
            <div className="flex flex-wrap gap-2">
              {[...bg.tools].sort((a, b) => a.localeCompare(b, "pt-BR")).map((t) => (
                <span key={t} className="rounded bg-secondary px-2 py-1 text-sm">{t}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {bg.languages.length > 0 && (
          <Section title="Idiomas Concedidos">
            <div className="flex flex-wrap gap-2">
              {[...bg.languages].sort((a, b) => a.localeCompare(b, "pt-BR")).map((l) => (
                <span key={l} className="rounded bg-secondary px-2 py-1 text-sm">{l}</span>
              ))}
            </div>
          </Section>
        )}

        <Section title="Idiomas">
          <p className="text-sm text-muted-foreground mb-2">Comum (fixo)</p>
          <p className="text-xs text-muted-foreground mb-3">
            Escolha mais {baseLanguageChoices} idiomas comuns{bgLanguageRequired > 0 ? ` (+${bgLanguageRequired} do antecedente)` : ""}. Selecionados: {selectedCount}/{totalRequiredLanguages}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {languageOptions
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((l) => {
                const selected = selectedLanguages.includes(l.id);
                const languageInfo = commonLanguages.find((lang) => lang.id === l.id);
                const disabled = !selected && selectedLanguages.length >= totalRequiredLanguages;
                return (
                  <button
                    key={l.id}
                    onClick={() => onToggleLanguage(l.id)}
                    disabled={disabled}
                    className={`rounded border px-2 py-1 text-sm text-left ${selected ? "border-primary bg-primary/10" : disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary"}`}
                  >
                    <span className="font-medium">{l.name}</span>
                    {languageInfo?.origin && (
                      <span className="ml-1 text-xs text-muted-foreground">• {languageInfo.origin}</span>
                    )}
                  </button>
                );
              })}
          </div>
        </Section>

        {/* Origin Feat */}
        <Section title="Talento de Origem" badge={<FeatBadge />}>
          <div className="rounded-md border bg-secondary/40">
            <button onClick={onToggleFeat} className="flex w-full items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{bg.originFeat.name}</span>
              </div>
              {featExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {featExpanded && (
              <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{bg.originFeat.description}</p>
            )}
          </div>
        </Section>

        {/* Equipment */}
        <Section title="Equipamento">
          {bg.equipmentChoices && bg.equipmentChoices.length > 0 ? (
            <div className="space-y-3">
              {bg.equipmentChoices.map((choice) => (
                <div key={choice.id} className="rounded border bg-secondary/30 p-3">
                  <p className="text-sm font-medium mb-1">{choice.label}</p>
                  {choice.items.length > 0 && (
                    <ul className="list-disc ml-5 text-sm space-y-1 mb-1">
                      {choice.items.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}
                  {choice.gold > 0 && (
                    <p className="text-sm text-muted-foreground">
                      <Package className="inline h-3.5 w-3.5 mr-1" />{choice.gold} PO
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {bg.equipment.items.length > 0 && (
                <ul className="list-disc ml-5 text-sm space-y-1 mb-2">
                  {[...bg.equipment.items].sort((a, b) => a.localeCompare(b, "pt-BR")).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {bg.equipment.gold > 0 && (
                <p className="text-sm text-muted-foreground">
                  <Package className="inline h-3.5 w-3.5 mr-1" />{bg.equipment.gold} PO
                </p>
              )}
            </>
          )}
          <p className="text-xs text-info mt-2">
            <Info className="inline h-3 w-3 mr-1" />
            O equipamento do antecedente será aplicado na etapa 5: Equipamentos.
          </p>
        </Section>
      </div>
    </div>
  );
}

// ─── Helpers ───

function Section({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {badge}
      </div>
      <div>{children}</div>
    </div>
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
