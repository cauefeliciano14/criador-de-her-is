import { useEffect, useMemo, useCallback } from "react";
import { useBuilderStore } from "@/state/builderStore";
import { useCharacterStore, mergeUnique } from "@/state/characterStore";
import { getCanonicalRaceChoiceKeyFromSources, getChoicesRequirements, type ChoiceOption } from "@/utils/choices";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import { spells as allSpellsData } from "@/data/spells";
import { spellsByClassId } from "@/data/indexes";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Star, Wand2, Sparkles, BookOpen, Info, Search, Eye, Flame, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ABILITIES,
  ALL_SKILLS,
  ABILITY_SHORT,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
  ABILITY_LABELS,
} from "@/utils/calculations";
import { useState } from "react";

// ── Expertise configuration per class ──
interface ExpertiseConfig {
  key: string;
  label: string;
  count: number;
  filter: (skill: string, proficientSkills: string[], cls: any) => boolean;
  minLevel: number;
}

function getExpertiseConfigs(classId: string | null): ExpertiseConfig[] {
  if (!classId) return [];
  const configs: ExpertiseConfig[] = [];
  if (classId === "ladino") {
    configs.push({
      key: "ladino:especialista",
      label: "Especialização (Ladino)",
      count: 2,
      filter: (skill, profSkills) => profSkills.includes(skill),
      minLevel: 1,
    });
  }
  if (classId === "bardo") {
    configs.push({
      key: "bardo:especialista",
      label: "Especialização (Bardo)",
      count: 2,
      filter: (skill, profSkills) => profSkills.includes(skill),
      minLevel: 2,
    });
  }
  if (classId === "guardiao") {
    configs.push({
      key: "guardiao:exploradorHabil:especialista",
      label: "Explorador Hábil — Especialização (Guardião)",
      count: 1,
      filter: (skill, profSkills) => profSkills.includes(skill),
      minLevel: 2,
    });
  }
  if (classId === "mago") {
    const allowedSkills = ["Arcanismo", "História", "Investigação", "Medicina", "Natureza", "Religião"];
    configs.push({
      key: "mago:academico",
      label: "Acadêmico (Mago)",
      count: 1,
      filter: (skill, profSkills) => profSkills.includes(skill) && allowedSkills.includes(skill),
      minLevel: 2,
    });
  }
  return configs;
}

// ── Spell level labels ──
const LEVEL_LABELS: Record<number, string> = {
  0: "Truque", 1: "1º Círculo", 2: "2º Círculo", 3: "3º Círculo",
  4: "4º Círculo", 5: "5º Círculo", 6: "6º Círculo", 7: "7º Círculo",
  8: "8º Círculo", 9: "9º Círculo",
};

export function StepChoices() {
  const classId = useCharacterStore((s) => s.class);
  const level = useCharacterStore((s) => s.level);
  const abilityScores = useCharacterStore((s) => s.abilityScores);
  const racialBonuses = useCharacterStore((s) => s.racialBonuses);
  const backgroundBonuses = useCharacterStore((s) => s.backgroundBonuses);
  const asiBonuses = useCharacterStore((s) => s.asiBonuses);
  const featAbilityBonuses = useCharacterStore((s) => s.featAbilityBonuses);
  const classSkillChoices = useCharacterStore((s) => s.classSkillChoices);
  const classFeatureChoices = useCharacterStore((s) => s.classFeatureChoices);
  const expertiseSkills = useCharacterStore((s) => s.expertiseSkills);
  const skills = useCharacterStore((s) => s.skills);
  const backgroundId = useCharacterStore((s) => s.background);
  const raceId = useCharacterStore((s) => s.race);
  const subraceId = useCharacterStore((s) => s.subrace);
  const raceChoices = useCharacterStore((s) => s.raceChoices);
  const choiceSelections = useCharacterStore((s) => s.choiceSelections);
  const spellsState = useCharacterStore((s) => s.spells);
  const profBonus = useCharacterStore((s) => s.proficiencyBonus);

  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const cls = classes.find((c) => c.id === classId);
  const isSpellcaster = cls?.spellcasting != null;
  const sc = cls?.spellcasting ?? null;

  // Build a minimal char-like object for requirements
  const charSnapshot = useCharacterStore.getState();
  const requirements = useMemo(() => getChoicesRequirements(charSnapshot), [
    classId, raceId, backgroundId, level, choiceSelections,
    classSkillChoices, spellsState.cantrips, spellsState.prepared,
    raceChoices, classFeatureChoices,
  ]);

  // ── Expertise ──
  const race = useMemo(() => races.find((r: any) => r.id === raceId), [raceId]);
  const subrace = useMemo(() => race?.subraces?.find((sr: any) => sr.id === subraceId), [race, subraceId]);
  const bg = useMemo(() => backgrounds.find((b: any) => b.id === backgroundId), [backgroundId]);

  const bgSkills = bg?.skills ?? [];
  const raceSkills = race?.proficiencies?.skills ?? [];
  const subraceSkills = subrace?.proficiencies?.skills ?? [];
  const fixedSkills = useMemo(() => mergeUnique(bgSkills, raceSkills, subraceSkills) as string[], [bgSkills, raceSkills, subraceSkills]);
  const allProficientSkills = useMemo(() => mergeUnique(fixedSkills, classSkillChoices) as string[], [fixedSkills, classSkillChoices]);

  const expertiseConfigs = useMemo(() => {
    return getExpertiseConfigs(classId).filter((c) => level >= c.minLevel);
  }, [classId, level]);

  const expertiseChoices: Record<string, string[]> = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const config of expertiseConfigs) {
      const val = classFeatureChoices[config.key];
      if (Array.isArray(val)) map[config.key] = val as string[];
      else if (typeof val === "string") map[config.key] = [val];
      else map[config.key] = [];
    }
    return map;
  }, [expertiseConfigs, classFeatureChoices]);

  const allExpertiseSkills = useMemo(() => Object.values(expertiseChoices).flat(), [expertiseChoices]);

  // Sync expertise to store
  useEffect(() => {
    const sorted = [...allExpertiseSkills].sort();
    const current = [...(expertiseSkills ?? [])].sort();
    if (JSON.stringify(sorted) !== JSON.stringify(current)) {
      patchCharacter({ expertiseSkills: allExpertiseSkills });
    }
  }, [allExpertiseSkills, expertiseSkills, patchCharacter]);

  const toggleExpertise = useCallback((configKey: string, skill: string, maxCount: number) => {
    const current = expertiseChoices[configKey] ?? [];
    let next: string[];
    if (current.includes(skill)) {
      next = current.filter((s) => s !== skill);
    } else {
      if (current.length >= maxCount) return;
      next = [...current, skill];
    }
    patchCharacter({ classFeatureChoices: { ...classFeatureChoices, [configKey]: next } });
  }, [expertiseChoices, classFeatureChoices, patchCharacter]);

  // ── Spellcasting data ──
  const spellcastingAbility = sc?.ability ?? null;
  const abilityKey = useMemo(() => {
    if (!spellcastingAbility) return null;
    const map: Record<string, AbilityKey> = { Inteligência: "int", Sabedoria: "wis", Carisma: "cha" };
    return map[spellcastingAbility] ?? null;
  }, [spellcastingAbility]);

  const finalScores = useMemo(
    () => getFinalAbilityScores(abilityScores, racialBonuses, backgroundBonuses, asiBonuses, featAbilityBonuses),
    [abilityScores, racialBonuses, backgroundBonuses, asiBonuses, featAbilityBonuses]
  );

  const abilityMod = abilityKey ? calcAbilityMod(finalScores[abilityKey]) : 0;
  const spellSaveDC = sc ? 8 + profBonus + abilityMod : 0;
  const spellAttackBonus = sc ? profBonus + abilityMod : 0;

  const cantripsLimit = useMemo(() => {
    if (!sc) return 0;
    let limit = 0;
    for (const [l, c] of Object.entries(sc.cantripsKnownAtLevel).map(([l, c]) => [Number(l), c] as [number, number]).sort((a, b) => a[0] - b[0])) {
      if (level >= l) limit = c;
    }
    if (classId === "clerigo" && classFeatureChoices["clerigo:ordemDivina"] === "taumaturgo") limit += 1;
    if (classId === "druida" && classFeatureChoices["druida:ordemPrimal"] === "xama") limit += 1;
    return limit;
  }, [sc, level, classId, classFeatureChoices]);

  const availableSlots = useMemo(() => {
    if (!sc) return {} as Record<number, number>;
    return sc.spellSlotsByLevel[level] ?? {};
  }, [sc, level]);

  const maxSpellLevel = useMemo(() => {
    const levels = Object.keys(availableSlots).map(Number);
    return levels.length > 0 ? Math.max(...levels) : 0;
  }, [availableSlots]);

  const preparedLimit = useMemo(() => {
    if (!sc) return 0;
    if (sc.type === "prepared") return Math.max(1, abilityMod + level);
    const knownData = (sc as any).spellsKnownAtLevel;
    if (knownData) {
      let limit = 0;
      for (const [l, c] of Object.entries(knownData).map(([l, c]) => [Number(l), c as number] as [number, number]).sort((a, b) => a[0] - b[0])) {
        if (level >= l) limit = c;
      }
      return limit;
    }
    return Math.max(1, abilityMod + level);
  }, [sc, abilityMod, level]);

  const classSpells = useMemo(
    () => (classId ? spellsByClassId[classId] ?? [] : []).slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [classId]
  );

  // ── Spell filters ──
  const [spellSearch, setSpellSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  const filteredSpells = useMemo(() => {
    return classSpells.filter((s) => {
      if (s.level > 0 && s.level > maxSpellLevel) return false;
      if (spellSearch && !s.name.toLowerCase().includes(spellSearch.toLowerCase())) return false;
      if (filterLevel !== null && s.level !== filterLevel) return false;
      return true;
    });
  }, [classSpells, spellSearch, filterLevel, maxSpellLevel]);

  const availableLevels = useMemo(() => {
    const levels = new Set(classSpells.map((s) => s.level));
    return [...levels].filter((l) => l === 0 || l <= maxSpellLevel).sort((a, b) => a - b);
  }, [classSpells, maxSpellLevel]);

  const selectedCantrips = spellsState.cantrips;
  const selectedPrepared = spellsState.prepared;
  const spellTypeLabel = sc?.type === "known" || sc?.type === "pact" ? "Conhecidas" : "Preparadas";

  const toggleSpell = useCallback((spellId: string, spellLevel: number) => {
    if (spellLevel === 0) {
      const current = [...selectedCantrips];
      const idx = current.indexOf(spellId);
      if (idx >= 0) current.splice(idx, 1);
      else if (current.length < cantripsLimit) current.push(spellId);
      patchCharacter({
        spells: { ...spellsState, cantrips: current, spellcastingAbility: abilityKey, spellSaveDC, spellAttackBonus },
      });
    } else {
      const current = [...selectedPrepared];
      const idx = current.indexOf(spellId);
      if (idx >= 0) current.splice(idx, 1);
      else if (current.length < preparedLimit) current.push(spellId);
      patchCharacter({
        spells: { ...spellsState, prepared: current, cantrips: selectedCantrips, spellcastingAbility: abilityKey, spellSaveDC, spellAttackBonus, slots: Object.values(availableSlots) },
      });
    }
  }, [selectedCantrips, selectedPrepared, cantripsLimit, preparedLimit, spellsState, abilityKey, spellSaveDC, spellAttackBonus, availableSlots, patchCharacter]);

  // ── Bucket toggle (non-spell choices) ──
  const toggle = (bucket: "classSkills" | "languages" | "tools" | "instruments" | "raceChoice" | "classFeats", id: string) => {
    const selected = new Set(requirements.buckets[bucket].selectedIds);
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < requirements.buckets[bucket].requiredCount) selected.add(id);

    const next = [...selected];
    const newSelections = { ...choiceSelections };
    if (bucket === "raceChoice") newSelections.raceChoice = next[0] ?? null;
    else (newSelections as any)[bucket] = next;

    const raceChoiceKey = getCanonicalRaceChoiceKeyFromSources(requirements.buckets.raceChoice.sources);
    const nextRaceChoices = bucket === "raceChoice"
      ? (() => {
          if (!raceChoiceKey) return raceChoices;
          if (!next[0]) {
            const { [raceChoiceKey]: _removed, ...rest } = raceChoices;
            return rest;
          }
          return { ...raceChoices, [raceChoiceKey]: next[0] };
        })()
      : raceChoices;

    patchCharacter({
      choiceSelections: newSelections,
      classSkillChoices: bucket === "classSkills" ? next : classSkillChoices,
      raceChoices: nextRaceChoices,
    });
  };

  // ── Validation ──
  const expertiseMissing = useMemo(() => {
    const missing: string[] = [];
    for (const config of expertiseConfigs) {
      const chosen = expertiseChoices[config.key]?.length ?? 0;
      if (chosen < config.count) {
        missing.push(`${config.label}: ${chosen}/${config.count}`);
      }
    }
    return missing;
  }, [expertiseConfigs, expertiseChoices]);

  const spellsMissing = useMemo(() => {
    if (!isSpellcaster) return [];
    const missing: string[] = [];
    if (cantripsLimit > 0 && selectedCantrips.length < cantripsLimit) {
      missing.push(`Truques: ${selectedCantrips.length}/${cantripsLimit}`);
    }
    if (preparedLimit > 0 && selectedPrepared.length < preparedLimit) {
      missing.push(`Magias ${spellTypeLabel.toLowerCase()}: ${selectedPrepared.length}/${preparedLimit}`);
    }
    return missing;
  }, [isSpellcaster, cantripsLimit, preparedLimit, selectedCantrips.length, selectedPrepared.length, spellTypeLabel]);

  useEffect(() => {
    useBuilderStore.getState().updateChoicesRequirements();

    const bucketMissing = Object.entries(requirements.buckets)
      .filter(([key, bucket]) => key !== "cantrips" && key !== "spells" && bucket.pendingCount > 0)
      .map(([bucketKey, bucket]) => `${bucket.pendingCount} pendência(s) em ${bucketTitle(bucketKey)}`);

    const allMissing = [...bucketMissing, ...expertiseMissing, ...spellsMissing];

    if (allMissing.length > 0) {
      uncompleteStep("choices");
      setMissing("choices", allMissing);
    } else {
      completeStep("choices");
      setMissing("choices", []);
    }
  }, [
    requirements.needsStep, requirements,
    expertiseMissing.length, spellsMissing.length,
    classFeatureChoices, selectedCantrips.length, selectedPrepared.length,
  ]);

  // Sync spellcasting data
  useEffect(() => {
    if (!sc) return;
    patchCharacter({
      spells: {
        ...spellsState,
        spellcastingAbility: abilityKey,
        spellSaveDC,
        spellAttackBonus,
        slots: Object.values(availableSlots),
      },
    });
  }, [classId, abilityKey]);

  const sortedSkills = useMemo(() => [...ALL_SKILLS].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Escolhas</h2>
      <p className="text-sm text-muted-foreground">
        Complete todas as escolhas pendentes antes de visualizar a ficha final.
      </p>

      {/* ── Bucket-based choices ── */}
      <BucketSection title="Perícias de Classe" bucket={requirements.buckets.classSkills} onToggle={(id) => toggle("classSkills", id)} />
      <BucketSection title="Idiomas" bucket={requirements.buckets.languages} onToggle={(id) => toggle("languages", id)} />
      <BucketSection title="Ferramentas" bucket={requirements.buckets.tools} onToggle={(id) => toggle("tools", id)} />
      <BucketSection title="Instrumentos" bucket={requirements.buckets.instruments} onToggle={(id) => toggle("instruments", id)} />
      <BucketSection title="Escolha Racial" bucket={requirements.buckets.raceChoice} onToggle={(id) => toggle("raceChoice", id)} />
      <BucketSection title="Talentos de Classe" bucket={requirements.buckets.classFeats} onToggle={(id) => toggle("classFeats", id)} />

      {/* ── Expertise section ── */}
      {expertiseConfigs.length > 0 && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Especializações</h3>
          </div>

          {expertiseConfigs.map((config) => {
            const chosen = expertiseChoices[config.key] ?? [];
            const remaining = config.count - chosen.length;
            const otherExpertise: string[] = [];
            for (const [k] of Object.entries(expertiseChoices)) {
              if (k !== config.key) otherExpertise.push(...(expertiseChoices[k] ?? []));
            }
            const eligibleSkills = sortedSkills.filter((sk) =>
              config.filter(sk.name, allProficientSkills, cls) &&
              !otherExpertise.includes(sk.name)
            );

            return (
              <div key={config.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{config.label}</h4>
                  <Badge variant={remaining > 0 ? "outline" : "default"} className={remaining === 0 ? "bg-success text-success-foreground" : ""}>
                    {remaining > 0 ? `${remaining} pendente(s)` : "Completo"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha {config.count} perícia(s) proficiente(s) para ter o dobro do bônus de proficiência.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {eligibleSkills.map((sk) => {
                    const isChosen = chosen.includes(sk.name);
                    const canAdd = chosen.length < config.count;
                    return (
                      <button
                        key={sk.name}
                        type="button"
                        onClick={() => toggleExpertise(config.key, sk.name, config.count)}
                        disabled={!isChosen && !canAdd}
                        className={`p-2 rounded border text-left text-sm transition-colors ${
                          isChosen
                            ? "bg-primary/10 border-primary font-medium"
                            : !canAdd
                            ? "opacity-40 cursor-not-allowed border-border"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isChosen && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                          <span>{sk.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{ABILITY_SHORT[sk.ability]}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Spells section ── */}
      {isSpellcaster && sc && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Magias</h3>
          </div>

          {/* Spellcasting stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border bg-secondary/30 p-2 text-center">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">Atributo</p>
              <p className="text-sm font-bold">{spellcastingAbility ?? "—"}</p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-2 text-center">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">CD</p>
              <p className="text-lg font-bold">{spellSaveDC}</p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-2 text-center">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">Ataque</p>
              <p className="text-lg font-bold">+{spellAttackBonus}</p>
            </div>
            <div className="rounded-lg border bg-secondary/30 p-2 text-center">
              <p className="text-[11px] uppercase text-muted-foreground font-semibold">Prof.</p>
              <p className="text-lg font-bold">+{profBonus}</p>
            </div>
          </div>

          {/* Spell slots */}
          {Object.keys(availableSlots).length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">Espaços de Magia</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(availableSlots).sort(([a], [b]) => Number(a) - Number(b)).map(([lvl, count]) => (
                  <div key={lvl} className="rounded border bg-secondary/30 px-3 py-1.5 text-center min-w-[60px]">
                    <p className="text-[10px] uppercase text-muted-foreground">{lvl}º</p>
                    <p className="text-sm font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selection counters */}
          <div className="flex flex-wrap gap-4">
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${selectedCantrips.length >= cantripsLimit ? "border-success bg-success/10" : "border-info bg-info/10"}`}>
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Truques: {selectedCantrips.length}/{cantripsLimit}</span>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${selectedPrepared.length >= preparedLimit ? "border-success bg-success/10" : "border-info bg-info/10"}`}>
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">{spellTypeLabel}: {selectedPrepared.length}/{preparedLimit}</span>
            </div>
          </div>

          {/* Spell filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar magia..."
                value={spellSearch}
                onChange={(e) => setSpellSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {availableLevels.map((l) => (
                <button
                  key={l}
                  onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    filterLevel === l
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  }`}
                >
                  {LEVEL_LABELS[l] ?? `${l}º`}
                </button>
              ))}
              {(filterLevel !== null || spellSearch) && (
                <button
                  onClick={() => { setFilterLevel(null); setSpellSearch(""); }}
                  className="rounded-full px-3 py-1 text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Limpar
                </button>
              )}
            </div>
          </div>

          {/* Spell list */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filteredSpells.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma magia encontrada.</p>
            ) : (
              filteredSpells.map((spell) => {
                const selected = spell.level === 0 ? selectedCantrips.includes(spell.id) : selectedPrepared.includes(spell.id);
                const atLimit = spell.level === 0 ? selectedCantrips.length >= cantripsLimit : selectedPrepared.length >= preparedLimit;
                const disabled = !selected && atLimit;

                return (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={() => !disabled && toggleSpell(spell.id, spell.level)}
                    disabled={disabled}
                    className={`w-full rounded border p-2.5 text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10"
                        : disabled
                        ? "opacity-40 cursor-not-allowed border-border"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <span className="text-sm font-medium">{spell.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {spell.concentration && <Badge variant="outline" className="text-[10px] px-1.5 py-0">C</Badge>}
                        {spell.ritual && <Badge variant="outline" className="text-[10px] px-1.5 py-0">R</Badge>}
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {spell.level === 0 ? "Truque" : `${spell.level}º`}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{spell.school} • {spell.castingTime}</p>
                  </button>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* ── All complete indicator ── */}
      {requirements.buckets && !Object.values(requirements.buckets).some((b) => b.pendingCount > 0) &&
       expertiseMissing.length === 0 && spellsMissing.length === 0 && (
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Todas as escolhas obrigatórias foram concluídas.</span>
        </div>
      )}
    </div>
  );
}

function bucketTitle(key: string) {
  const labels: Record<string, string> = {
    classSkills: "Perícias",
    languages: "Idiomas",
    tools: "Ferramentas",
    instruments: "Instrumentos",
    cantrips: "Truques",
    spells: "Magias",
    raceChoice: "Escolha racial",
    classFeats: "Talentos de classe",
  };
  return labels[key] ?? key;
}

function BucketSection({
  title,
  bucket,
  onToggle,
}: {
  title: string;
  bucket: { requiredCount: number; pendingCount: number; selectedIds: string[]; options: ChoiceOption[] };
  onToggle: (id: string) => void;
}) {
  if (bucket.requiredCount <= 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant={bucket.pendingCount > 0 ? "outline" : "default"} className={bucket.pendingCount === 0 ? "bg-success text-success-foreground" : ""}>
          {bucket.pendingCount > 0 ? `${bucket.pendingCount} pendente(s)` : "Completo"}
        </Badge>
      </div>
      {bucket.options.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Sem opções automáticas disponíveis.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {bucket.options.map((option) => {
            const selected = bucket.selectedIds.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => onToggle(option.id)}
                className={`p-2 rounded border text-left text-sm transition-colors ${selected ? "bg-primary/10 border-primary" : "border-border hover:bg-muted"}`}
              >
                <div className="flex items-center gap-1.5">
                  {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  {option.name}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
