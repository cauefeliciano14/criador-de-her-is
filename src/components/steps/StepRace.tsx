import { useState, useEffect, useCallback, useMemo } from "react";
import { useCharacterStore, mergeUnique, replaceFeatures, type NormalizedFeature } from "@/state/characterStore";
import { applyRaceEffects } from "@/rules/engine/applyRaceEffects";
import { useBuilderStore } from "@/state/builderStore";
import { races, hasPlannedRaceContent, type RaceData, type Subrace } from "@/data/races";
import { ABILITY_LABELS, ABILITY_SHORT, type AbilityKey } from "@/utils/calculations";
import { CheckCircle2, Search, Info, ChevronDown, ChevronUp } from "lucide-react";
import { getChoicesRequirements } from "@/utils/choices";
import { Badge } from "@/components/ui/badge";

export function StepRace() {
  const [search, setSearch] = useState("");
  const [expandedTraits, setExpandedTraits] = useState<Record<string, boolean>>({});

  const raceId = useCharacterStore((s) => s.race);
  const subraceId = useCharacterStore((s) => s.subrace);
  const raceAbilityChoices = useCharacterStore((s) => s.raceAbilityChoices);
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...races]
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedRace = races.find((r) => r.id === raceId);
  const selectedSubrace = selectedRace?.subraces.find((sr) => sr.id === subraceId);
  const requirements = useMemo(() => getChoicesRequirements(char), [char.class, char.race, char.background, char.level, char.choiceSelections]);
  const raceLanguageSource = requirements.buckets.languages.sources.find((s) => s.startsWith("race:"));
  const raceLanguageRequired = raceLanguageSource ? Number(raceLanguageSource.split(":").pop()) || 0 : 0;
  const raceChoiceSource = requirements.buckets.raceChoice.sources[0] ?? "";
  const raceChoiceKey = raceChoiceSource.split(":").pop() ?? "";

  // === Compute combined bonuses from fixed race + subrace + choices ===
  const computeRacialBonuses = useCallback(
    (race: RaceData | undefined, subrace: Subrace | undefined, choices: Partial<Record<AbilityKey, number>>) => {
      const bonuses: Record<AbilityKey, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

      // Race fixed bonuses
      if (race?.abilityBonuses.mode === "fixed" && race.abilityBonuses.fixed) {
        for (const [key, val] of Object.entries(race.abilityBonuses.fixed)) {
          if (key in bonuses) bonuses[key as AbilityKey] += val;
        }
      }

      // Race choose bonuses
      if (race?.abilityBonuses.mode === "choose") {
        for (const [key, val] of Object.entries(choices)) {
          if (key in bonuses && val) bonuses[key as AbilityKey] += val;
        }
      }

      // Subrace fixed bonuses
      if (subrace?.abilityBonuses.mode === "fixed" && subrace.abilityBonuses.fixed) {
        for (const [key, val] of Object.entries(subrace.abilityBonuses.fixed)) {
          if (key in bonuses) bonuses[key as AbilityKey] += val;
        }
      }

      // Subrace choose bonuses (future)
      if (subrace?.abilityBonuses.mode === "choose") {
        // Would need separate subrace choices tracking
      }

      return bonuses;
    },
    []
  );

  // === Select Race ===
  const handleSelectRace = (id: string) => {
    const race = races.find((r) => r.id === id)!;
    const currentState = useCharacterStore.getState();

    // Normalize race traits
    const raceFeatures: NormalizedFeature[] = race.traits.map((t) => ({
      sourceType: "race" as const,
      sourceId: race.id,
      name: t.name,
      description: t.description,
    }));

    // Merge proficiencies (keeping non-race items)
    const existingProf = currentState.proficiencies;
    const newFeatures = replaceFeatures(currentState.features, ["race", "subrace"], raceFeatures);

    const newBonuses = computeRacialBonuses(race, undefined, {});

    patchCharacter({
      race: id,
      subrace: null,
      raceAbilityChoices: {},
      raceChoices: {},
      speed: race.speed,
      racialBonuses: newBonuses,
      features: newFeatures,
      proficiencies: {
        armor: mergeUnique(
          existingProf.armor.filter((a) => true), // Keep all for now; class step manages its own
          race.proficiencies.armor
        ),
        weapons: mergeUnique(existingProf.weapons, race.proficiencies.weapons),
        tools: mergeUnique(existingProf.tools, race.proficiencies.tools),
        languages: [...race.languages],
      },
    });
  };

  // === Select Subrace ===
  const handleSelectSubrace = (subId: string) => {
    if (!selectedRace) return;
    const subrace = selectedRace.subraces.find((sr) => sr.id === subId)!;
    const currentState = useCharacterStore.getState();

    // Remove old subrace features, add new
    const subraceFeatures: NormalizedFeature[] = subrace.traits.map((t) => ({
      sourceType: "subrace" as const,
      sourceId: subrace.id,
      name: t.name,
      description: t.description,
    }));
    const withoutOldSubrace = currentState.features.filter((f) => f.sourceType !== "subrace");
    const newFeatures = [...withoutOldSubrace, ...subraceFeatures];

    // Merge languages
    const raceLangs = selectedRace.languages;
    const subLangs = subrace.languages;
    const mergedLangs = mergeUnique(raceLangs, subLangs);

    // Merge proficiencies
    const mergedProf = {
      armor: mergeUnique(selectedRace.proficiencies.armor, subrace.proficiencies.armor),
      weapons: mergeUnique(selectedRace.proficiencies.weapons, subrace.proficiencies.weapons),
      tools: mergeUnique(selectedRace.proficiencies.tools, subrace.proficiencies.tools),
      languages: mergedLangs,
    };

    const newBonuses = computeRacialBonuses(selectedRace, subrace, currentState.raceAbilityChoices);

    patchCharacter({
      subrace: subId,
      racialBonuses: newBonuses,
      features: newFeatures,
      proficiencies: mergedProf,
    });
  };

  // === Ability Bonus Choice ===
  const handleAbilityChoice = (ability: AbilityKey) => {
    if (!selectedRace) return;
    const chooseConfig = selectedRace.abilityBonuses.mode === "choose" ? selectedRace.abilityBonuses.choose : null;
    if (!chooseConfig) return;

    const currentChoices = { ...raceAbilityChoices };
    const currentCount = Object.values(currentChoices).filter((v): v is number => v !== undefined && v > 0).length;

    if (currentChoices[ability]) {
      // Remove choice
      delete currentChoices[ability];
    } else {
      // Add choice if under limit
      if (currentCount >= chooseConfig.choices) return;
      currentChoices[ability] = chooseConfig.bonus;
    }

    const newBonuses = computeRacialBonuses(selectedRace, selectedSubrace, currentChoices);
    patchCharacter({
      raceAbilityChoices: currentChoices,
      racialBonuses: newBonuses,
    });
  };

  // === Validation ===
  const getValidation = useCallback((): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];

    if (!raceId) {
      return { valid: false, missing: ["Escolher raça"] };
    }

    const race = races.find((r) => r.id === raceId);
    if (!race) return { valid: false, missing: ["Raça inválida"] };

    // Subrace required?
    if (race.subraces.length > 0 && !subraceId) {
      missing.push("Escolher sub-raça");
    }

    // Race ability bonus choices
    if (race.abilityBonuses.mode === "choose" && race.abilityBonuses.choose) {
      const choiceCount = Object.values(raceAbilityChoices).filter((v): v is number => v !== undefined && v > 0).length;
      if (choiceCount < race.abilityBonuses.choose.choices) {
        missing.push(`Definir bônus de atributo (${choiceCount}/${race.abilityBonuses.choose.choices})`);
      }
    }

    if (requirements.buckets.raceChoice.pendingCount > 0) {
      missing.push("Escolha racial obrigatória pendente");
    }
    if (raceLanguageRequired > 0 && requirements.buckets.languages.pendingCount > 0) {
      missing.push(`Escolher idiomas (${requirements.buckets.languages.selectedIds.length}/${requirements.buckets.languages.requiredCount})`);
    }

    return { valid: missing.length === 0, missing };
  }, [raceId, subraceId, raceAbilityChoices, char.raceChoices, requirements.buckets.raceChoice.pendingCount, requirements.buckets.languages.pendingCount, requirements.buckets.languages.selectedIds.length, requirements.buckets.languages.requiredCount, raceLanguageRequired]);

  // Sync validation
  useEffect(() => {
    const { valid, missing } = getValidation();
    if (valid) {
      completeStep("race");
      setMissing("race", []);
    } else {
      uncompleteStep("race");
      setMissing("race", missing);
    }
  }, [raceId, subraceId, raceAbilityChoices, getValidation]);

  // Apply race choice effects
  useEffect(() => {
    if (selectedRace?.raceChoice && requirements.buckets.raceChoice.pendingCount === 0) {
      const effects = applyRaceEffects(char);
      if (Object.keys(effects).length > 0) {
        patchCharacter(effects);
      }
    }
  }, [selectedRace?.id, requirements.buckets.raceChoice.pendingCount, char.raceChoices]);

  const toggleTrait = (name: string) => {
    setExpandedTraits((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const { valid, missing } = getValidation();

  // Choose mode config
  const chooseConfig = selectedRace?.abilityBonuses.mode === "choose" ? selectedRace.abilityBonuses.choose : null;
  const choiceCount = Object.values(raceAbilityChoices).filter((v): v is number => v !== undefined && v > 0).length;

  return (
    <div className="flex gap-0 h-full">
      {/* Left: Race list */}
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">3. Escolha sua Raça</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar raça..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          {sorted.map((r) => {
            const isSelected = raceId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRace(r.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
              </button>
            );
          })}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma raça encontrada.</p>
          )}
        </div>
      </div>

      {/* Right: Details */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedRace ? (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold">{selectedRace.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {selectedRace.description}
            </p>

            <div className="mt-6 space-y-4">
              {/* Basic Info */}
              <Section title="Informações Básicas">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Deslocamento: </span>
                    <span className="font-medium">{selectedRace.speed}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tamanho: </span>
                    <span className="font-medium">{selectedRace.size}</span>
                  </div>
                </div>
              </Section>

              {/* Ability Bonuses */}
              <Section title="Bônus de Atributo">
                {selectedRace.abilityBonuses.mode === "fixed" && selectedRace.abilityBonuses.fixed && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedRace.abilityBonuses.fixed)
                      .filter(([, v]) => v !== 0)
                      .map(([k, v]) => (
                        <span key={k} className="rounded-md bg-primary/15 border border-primary/30 px-3 py-1.5 text-sm font-medium">
                          {ABILITY_SHORT[k as AbilityKey] ?? k.toUpperCase()} +{v}
                        </span>
                      ))}
                  </div>
                )}
                {selectedRace.abilityBonuses.mode === "choose" && chooseConfig && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-info" />
                      <span className="text-sm text-info font-medium">
                        Escolha {chooseConfig.choices} atributo(s) para receber +{chooseConfig.bonus}
                        {choiceCount < chooseConfig.choices && (
                          <span className="text-muted-foreground ml-1">
                            ({choiceCount}/{chooseConfig.choices})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {chooseConfig.from
                        .sort((a, b) => ABILITY_LABELS[a as AbilityKey].localeCompare(ABILITY_LABELS[b as AbilityKey], "pt-BR"))
                        .map((ability) => {
                          const key = ability as AbilityKey;
                          const isChosen = !!raceAbilityChoices[key];
                          const isFull = choiceCount >= chooseConfig.choices && !isChosen;
                          return (
                            <button
                              key={key}
                              onClick={() => handleAbilityChoice(key)}
                              disabled={isFull}
                              className={`rounded-lg border p-3 text-center transition-all ${
                                isChosen
                                  ? "border-primary bg-primary/15 ring-1 ring-primary/30"
                                  : isFull
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:border-muted-foreground/40 hover:bg-secondary cursor-pointer"
                              }`}
                            >
                              <p className="text-[10px] uppercase text-muted-foreground">
                                {ABILITY_SHORT[key]}
                              </p>
                              <p className="text-sm font-bold mt-0.5">
                                {isChosen ? `+${chooseConfig.bonus}` : "—"}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {ABILITY_LABELS[key]}
                              </p>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
                {/* Show subrace bonuses too */}
                {selectedSubrace?.abilityBonuses.mode === "fixed" && selectedSubrace.abilityBonuses.fixed && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Bônus da sub-raça ({selectedSubrace.name}):</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedSubrace.abilityBonuses.fixed)
                        .filter(([, v]) => v !== 0)
                        .map(([k, v]) => (
                          <span key={k} className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium">
                            {ABILITY_SHORT[k as AbilityKey] ?? k.toUpperCase()} +{v}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* Languages */}
              <Section title="Idiomas">
                <div className="flex flex-wrap gap-2">
                  {selectedRace.languages
                    .sort((a, b) => a.localeCompare(b, "pt-BR"))
                    .map((l) => (
                      <span key={l} className="rounded bg-secondary px-2 py-1 text-sm">{l}</span>
                    ))}
                  {selectedSubrace && selectedSubrace.languages.length > 0 && (
                    selectedSubrace.languages.map((l) => (
                      <span key={l} className="rounded bg-secondary px-2 py-1 text-sm">{l}</span>
                    ))
                  )}
                </div>
              </Section>

              {/* Proficiencies */}
              {(
                selectedRace.proficiencies.skills.length > 0 ||
                selectedRace.proficiencies.weapons.length > 0 ||
                selectedRace.proficiencies.armor.length > 0 ||
                selectedRace.proficiencies.tools.length > 0
              ) && (
                <Section title="Proficiências">
                  {selectedRace.proficiencies.skills.length > 0 && (
                    <ProfList label="Perícias" items={selectedRace.proficiencies.skills} />
                  )}
                  {mergeUnique(selectedRace.proficiencies.weapons, selectedSubrace?.proficiencies.weapons ?? []).length > 0 && (
                    <ProfList
                      label="Armas"
                      items={mergeUnique(selectedRace.proficiencies.weapons, selectedSubrace?.proficiencies.weapons ?? [])}
                    />
                  )}
                  {mergeUnique(selectedRace.proficiencies.armor, selectedSubrace?.proficiencies.armor ?? []).length > 0 && (
                    <ProfList
                      label="Armaduras"
                      items={mergeUnique(selectedRace.proficiencies.armor, selectedSubrace?.proficiencies.armor ?? [])}
                    />
                  )}
                  {selectedRace.proficiencies.tools.length > 0 && (
                    <ProfList label="Ferramentas" items={selectedRace.proficiencies.tools} />
                  )}
                </Section>
              )}

              {/* Traits (accordion) */}
              <Section title="Traços Raciais">
                <div className="space-y-2">
                  {selectedRace.traits.map((t) => {
                    const isExpanded = expandedTraits[t.name] ?? false;
                    return (
                      <div key={t.name} className="rounded-md border bg-secondary/40">
                        <button
                          onClick={() => toggleTrait(t.name)}
                          className="w-full flex items-center justify-between p-3 text-left"
                        >
                          <span className="font-medium text-sm">{t.name}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>

              {/* Subrace Traits */}
              {selectedSubrace && selectedSubrace.traits.length > 0 && (
                <Section title={`Traços — ${selectedSubrace.name}`}>
                  <div className="space-y-2">
                    {selectedSubrace.traits.map((t) => {
                      const key = `sub-${t.name}`;
                      const isExpanded = expandedTraits[key] ?? false;
                      return (
                        <div key={key} className="rounded-md border bg-secondary/40">
                          <button
                            onClick={() => toggleTrait(key)}
                            className="w-full flex items-center justify-between p-3 text-left"
                          >
                            <span className="font-medium text-sm">{t.name}</span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3">
                              <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Subrace Selection */}
              {selectedRace.subraces.length > 0 && (
                <Section title="Escolha sua Sub-raça">
                  {!subraceId && (
                    <div className="flex items-center gap-2 mb-3 text-info">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Obrigatório — selecione uma sub-raça</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selectedRace.subraces
                      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                      .map((sr) => {
                        const isSel = subraceId === sr.id;
                        return (
                          <button
                            key={sr.id}
                            onClick={() => handleSelectSubrace(sr.id)}
                            className={`w-full rounded-lg border p-4 text-left transition-all ${
                              isSel
                                ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                : "hover:border-muted-foreground/40 hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">{sr.name}</span>
                              {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{sr.description}</p>
                            {sr.abilityBonuses.mode === "fixed" && sr.abilityBonuses.fixed && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(sr.abilityBonuses.fixed)
                                  .filter(([, v]) => v !== 0)
                                  .map(([k, v]) => (
                                    <span key={k} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                                      {ABILITY_SHORT[k as AbilityKey]} +{v}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </Section>
              )}

              {/* Race Choice */}
              {selectedRace.raceChoice && (
                <Section title={selectedRace.raceChoice.label}>
                  {requirements.buckets.raceChoice.pendingCount > 0 && selectedRace.raceChoice.required && (
                    <div className="flex items-center gap-2 mb-3 text-info">
                      <Info className="h-4 w-4" />
                      <span className="text-sm font-medium">Obrigatório — selecione uma opção</span>
                    </div>
                  )}
                  {hasPlannedRaceContent(selectedRace) && (
                    <div className="mb-3">
                      <Badge variant="secondary">Em desenvolvimento</Badge>
                    </div>
                  )}
                  <div className="space-y-2">
                    {selectedRace.raceChoice.options.map((option) => {
                      const isPlanned = option.availability === "planned";
                      const isSelected = char.raceChoices?.[raceChoiceKey] === option.id;
                      return (
                        <button
                          key={option.id}
                          disabled={isPlanned}
                          onClick={() => patchCharacter({ raceChoices: { ...char.raceChoices, [raceChoiceKey]: option.id } })}
                          className={`w-full rounded-lg border p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "hover:border-muted-foreground/40 hover:bg-secondary"
                          } ${isPlanned ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm">{option.name}</span>
                            <div className="flex items-center gap-2">
                              {isPlanned && <Badge variant="outline">Em desenvolvimento</Badge>}
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {raceLanguageRequired > 0 && (
                <Section title="Idiomas (Escolha da Raça)">
                  <div className="grid grid-cols-2 gap-2">
                    {requirements.buckets.languages.options.map((opt) => {
                      const selected = (char.choiceSelections.languages ?? []).includes(opt.id);
                      return (
                        <button key={opt.id} onClick={() => {
                          const current = new Set(char.choiceSelections.languages ?? []);
                          if (current.has(opt.id)) current.delete(opt.id);
                          else if (current.size < requirements.buckets.languages.requiredCount) current.add(opt.id);
                          patchCharacter({ choiceSelections: { ...char.choiceSelections, languages: [...current] } });
                        }} className={`rounded border p-2 text-left text-sm ${selected ? "border-primary bg-primary/10" : "hover:bg-secondary"}`}>
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Validation */}
              {!valid && missing.length > 0 && (
                <div className="rounded-lg border border-info/30 bg-info/10 p-4">
                  <p className="text-sm font-semibold text-info mb-1">⚠ Pendências</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {missing.map((m) => <li key={m}>• {m}</li>)}
                  </ul>
                </div>
              )}

              {valid && (
                <div className="rounded-lg border border-success/30 bg-success/10 p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">Raça configurada! Pode avançar.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione uma raça na lista ao lado para ver os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </div>
  );
}

function ProfList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-2">
      <p className="text-xs text-muted-foreground mb-1">{label}:</p>
      <div className="flex flex-wrap gap-1">
        {items.sort((a, b) => a.localeCompare(b, "pt-BR")).map((item) => (
          <span key={item} className="rounded bg-secondary px-2 py-0.5 text-xs">{item}</span>
        ))}
      </div>
    </div>
  );
}
