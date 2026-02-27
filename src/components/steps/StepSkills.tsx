import { useCharacterStore, mergeUnique } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import {
  ALL_SKILLS,
  ABILITY_SHORT,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
} from "@/utils/calculations";
import { CheckCircle2, Circle, Info, Shield, Wrench, Globe, Swords, ArrowRight, Star } from "lucide-react";
import { useEffect, useMemo, useCallback } from "react";

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

export function StepSkills() {
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);
  const goToStep = useBuilderStore((s) => s.goToStep);

  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);

  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses);

  // --- Derive sources ---
  const bgSkills = bg?.skills ?? [];
  const raceSkills = race?.proficiencies.skills ?? [];
  const subraceSkills = subrace?.proficiencies.skills ?? [];
  const fixedSkills = mergeUnique(bgSkills, raceSkills, subraceSkills);

  const classChoices = cls?.skillChoices;
  const maxClassSkills = classChoices?.choose ?? 0;
  const classSkillChoices = char.classSkillChoices;

  const allProficientSkills = useMemo(
    () => mergeUnique(fixedSkills, classSkillChoices),
    [fixedSkills, classSkillChoices]
  );

  // --- Expertise configs ---
  const expertiseConfigs = useMemo(() => {
    const configs = getExpertiseConfigs(char.class);
    return configs.filter((c) => char.level >= c.minLevel);
  }, [char.class, char.level]);

  // Current expertise choices from classFeatureChoices
  const expertiseChoices = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const config of expertiseConfigs) {
      const val = char.classFeatureChoices[config.key];
      if (Array.isArray(val)) {
        map[config.key] = val;
      } else if (typeof val === "string") {
        map[config.key] = [val];
      } else {
        map[config.key] = [];
      }
    }
    return map;
  }, [expertiseConfigs, char.classFeatureChoices]);

  // All expertise skills (flattened)
  const allExpertiseSkills = useMemo(() => {
    return Object.values(expertiseChoices).flat();
  }, [expertiseChoices]);

  // Sync expertiseSkills to store when choices change
  useEffect(() => {
    const sorted = [...allExpertiseSkills].sort();
    const current = [...(char.expertiseSkills ?? [])].sort();
    if (JSON.stringify(sorted) !== JSON.stringify(current)) {
      patchCharacter({ expertiseSkills: allExpertiseSkills });
    }
  }, [allExpertiseSkills]);

  const toggleExpertise = useCallback((configKey: string, skill: string, maxCount: number) => {
    const current = expertiseChoices[configKey] ?? [];
    let next: string[];
    if (current.includes(skill)) {
      next = current.filter((s) => s !== skill);
    } else {
      if (current.length >= maxCount) return;
      next = [...current, skill];
    }
    // Also make sure this skill isn't in another expertise config
    const newChoices = { ...char.classFeatureChoices, [configKey]: next };
    patchCharacter({ classFeatureChoices: newChoices });
  }, [expertiseChoices, char.classFeatureChoices, patchCharacter]);

  // Build skill proficiency map with sources
  const skillMap = useMemo(() => {
    const map: Record<string, { proficient: boolean; expertise: boolean; sources: string[] }> = {};
    for (const sk of ALL_SKILLS) {
      const sources: string[] = [];
      if (bgSkills.includes(sk.name)) sources.push(`Antecedente: ${bg?.name}`);
      if (raceSkills.includes(sk.name)) sources.push(`Raça: ${race?.name}`);
      if (subraceSkills.includes(sk.name)) sources.push(`Sub-raça: ${subrace?.name}`);
      if (classSkillChoices.includes(sk.name)) sources.push(`Classe: ${cls?.name}`);
      map[sk.name] = {
        proficient: sources.length > 0,
        expertise: allExpertiseSkills.includes(sk.name),
        sources,
      };
    }
    return map;
  }, [bgSkills, raceSkills, subraceSkills, classSkillChoices, bg, race, subrace, cls, allExpertiseSkills]);

  // --- Proficiency sources ---
  const toolSources = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const t of bg?.tools ?? []) map[t] = [...(map[t] ?? []), `Antecedente: ${bg?.name}`];
    for (const t of cls?.proficiencies.tools ?? []) map[t] = [...(map[t] ?? []), `Classe: ${cls?.name}`];
    for (const t of race?.proficiencies.tools ?? []) map[t] = [...(map[t] ?? []), `Raça: ${race?.name}`];
    return map;
  }, [bg, cls, race]);

  const languageSources = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const l of race?.languages ?? []) map[l] = [...(map[l] ?? []), `Raça: ${race?.name}`];
    for (const l of subrace?.languages ?? []) map[l] = [...(map[l] ?? []), `Sub-raça: ${subrace?.name}`];
    for (const l of bg?.languages ?? []) map[l] = [...(map[l] ?? []), `Antecedente: ${bg?.name}`];
    for (const l of cls?.proficiencies.languages ?? []) map[l] = [...(map[l] ?? []), `Classe: ${cls?.name}`];
    return map;
  }, [race, subrace, bg, cls]);

  const weaponSources = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const w of cls?.proficiencies.weapons ?? []) map[w] = [...(map[w] ?? []), `Classe: ${cls?.name}`];
    for (const w of race?.proficiencies.weapons ?? []) map[w] = [...(map[w] ?? []), `Raça: ${race?.name}`];
    for (const w of subrace?.proficiencies.weapons ?? []) map[w] = [...(map[w] ?? []), `Sub-raça: ${subrace?.name}`];
    return map;
  }, [cls, race, subrace]);

  const armorSources = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const a of cls?.proficiencies.armor ?? []) map[a] = [...(map[a] ?? []), `Classe: ${cls?.name}`];
    for (const a of race?.proficiencies.armor ?? []) map[a] = [...(map[a] ?? []), `Raça: ${race?.name}`];
    for (const a of subrace?.proficiencies.armor ?? []) map[a] = [...(map[a] ?? []), `Sub-raça: ${subrace?.name}`];
    return map;
  }, [cls, race, subrace]);

  // --- Toggle class skill ---
  const toggleClassSkill = (skill: string) => {
    if (fixedSkills.includes(skill)) return;
    let next: string[];
    if (classSkillChoices.includes(skill)) {
      next = classSkillChoices.filter((s) => s !== skill);
    } else {
      if (classSkillChoices.length >= maxClassSkills) return;
      next = [...classSkillChoices, skill];
    }
    const allSkills = mergeUnique(fixedSkills, next);
    patchCharacter({ classSkillChoices: next, skills: allSkills });
  };

  // --- Sync final skills with all sources ---
  useEffect(() => {
    const allSkills = mergeUnique(fixedSkills, classSkillChoices);
    if (JSON.stringify([...allSkills].sort()) !== JSON.stringify([...char.skills].sort())) {
      patchCharacter({ skills: allSkills });
    }
  }, [fixedSkills, classSkillChoices]);

  // --- Pendencies ---
  const pendencies = useMemo(() => {
    const list: { text: string; step?: string }[] = [];
    if (!char.class) list.push({ text: "Escolher classe", step: "class" });
    if (!char.background) list.push({ text: "Escolher antecedente", step: "origin" });
    if (!char.race) list.push({ text: "Escolher raça", step: "race" });
    if (cls && classSkillChoices.length < maxClassSkills) {
      list.push({
        text: `Escolher ${maxClassSkills - classSkillChoices.length} perícia(s) da classe`,
      });
    }
    if (!char.classEquipmentChoice && cls) {
      list.push({ text: "Escolher equipamento inicial da classe", step: "equipment" });
    }
    if (race && race.subraces.length > 0 && !char.subrace) {
      list.push({ text: "Selecionar sub-raça", step: "race" });
    }
    // Expertise pendencies
    for (const config of expertiseConfigs) {
      const chosen = expertiseChoices[config.key]?.length ?? 0;
      if (chosen < config.count) {
        list.push({ text: `${config.label}: escolher ${config.count - chosen} perícia(s)` });
      }
    }
    return list;
  }, [char, cls, classSkillChoices, maxClassSkills, race, expertiseConfigs, expertiseChoices]);

  useEffect(() => {
    const missing = pendencies.map((p) => p.text);
    // Skills validation is tracked internally but step is part of "sheet"
    // We don't call completeStep/uncompleteStep here as Skills is embedded in Sheet
  }, [pendencies]);

  const sortedSkills = [...ALL_SKILLS].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  // Bard half prof indicator
  const isBardL2 = char.class === "bardo" && char.level >= 2;
  const halfProfValue = Math.floor(char.proficiencyBonus / 2);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">5. Perícias & Proficiências</h2>
        <p className="text-sm text-muted-foreground">
          Revisão e ajuste de todas as perícias e proficiências do personagem.
        </p>
      </div>

      {/* Pendencies */}
      {pendencies.length > 0 && (
        <div className="rounded-lg border border-info/30 bg-info/5 p-4">
          <div className="flex items-center gap-2 text-info mb-2">
            <Info className="h-4 w-4" />
            <span className="font-semibold text-sm">Pendências obrigatórias</span>
          </div>
          <ul className="space-y-1.5">
            {pendencies.map((p) => (
              <li key={p.text} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">• {p.text}</span>
                {p.step && (
                  <button
                    onClick={() => goToStep(p.step as any)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ir para etapa
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section A — Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Saving Throws */}
        <Section title="Salvaguardas" icon={<Shield className="h-4 w-4" />}>
          {char.savingThrows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {[...char.savingThrows].sort((a, b) => a.localeCompare(b, "pt-BR")).map((st) => (
                <span key={st} className="rounded bg-primary/10 border border-primary/30 px-2 py-1 text-xs font-medium">
                  {st}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma (selecione uma classe)</p>
          )}
          {cls && (
            <p className="mt-1 text-[10px] text-muted-foreground">Fonte: {cls.name}</p>
          )}
        </Section>

        {/* Proficiency Bonus */}
        <Section title="Bônus de Proficiência" icon={<CheckCircle2 className="h-4 w-4" />}>
          <p className="text-2xl font-bold">+{char.proficiencyBonus}</p>
          <p className="text-[10px] text-muted-foreground">Nível {char.level}</p>
        </Section>

        {/* Languages */}
        <Section title="Idiomas" icon={<Globe className="h-4 w-4" />}>
          {Object.keys(languageSources).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(languageSources)
                .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                .map(([lang, sources]) => (
                  <div key={lang} className="flex items-center justify-between">
                    <span className="text-sm">{lang}</span>
                    <span className="text-[10px] text-muted-foreground">{sources[0]}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhum</p>
          )}
        </Section>

        {/* Tools */}
        <Section title="Ferramentas" icon={<Wrench className="h-4 w-4" />}>
          {Object.keys(toolSources).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(toolSources)
                .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                .map(([tool, sources]) => (
                  <div key={tool} className="flex items-center justify-between">
                    <span className="text-sm">{tool}</span>
                    <span className="text-[10px] text-muted-foreground">{sources[0]}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Nenhuma</p>
          )}
        </Section>

        {/* Weapons */}
        {Object.keys(weaponSources).length > 0 && (
          <Section title="Armas" icon={<Swords className="h-4 w-4" />}>
            <div className="space-y-1">
              {Object.entries(weaponSources)
                .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                .map(([w, sources]) => (
                  <div key={w} className="flex items-center justify-between">
                    <span className="text-sm">{w}</span>
                    <span className="text-[10px] text-muted-foreground">{sources[0]}</span>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* Armor */}
        {Object.keys(armorSources).length > 0 && (
          <Section title="Armaduras" icon={<Shield className="h-4 w-4" />}>
            <div className="space-y-1">
              {Object.entries(armorSources)
                .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
                .map(([a, sources]) => (
                  <div key={a} className="flex items-center justify-between">
                    <span className="text-sm">{a}</span>
                    <span className="text-[10px] text-muted-foreground">{sources[0]}</span>
                  </div>
                ))}
            </div>
          </Section>
        )}
      </div>

      {/* ── Expertise Choices ── */}
      {expertiseConfigs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4" />
            Escolhas de Classe Pendentes
          </h3>
          {expertiseConfigs.map((config) => {
            const chosen = expertiseChoices[config.key] ?? [];
            const remaining = config.count - chosen.length;
            const eligibleSkills = sortedSkills.filter((sk) =>
              config.filter(sk.name, allProficientSkills, cls) &&
              // Not already chosen in another config
              !Object.entries(expertiseChoices)
                .filter(([k]) => k !== config.key)
                .flatMap(([, v]) => v)
                .includes(sk.name)
            );

            return (
              <div key={config.key} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">{config.label}</h4>
                  {remaining > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                      <Info className="h-3 w-3" />
                      Escolha {remaining}
                    </span>
                  ) : (
                    <span className="text-[10px] text-success font-medium">✓ Completo</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Escolha {config.count} perícia(s) proficientes para dobrar o bônus de proficiência (expertise).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {eligibleSkills.map((sk) => {
                    const isChosen = chosen.includes(sk.name);
                    const disabled = !isChosen && remaining <= 0;
                    return (
                      <button
                        key={sk.name}
                        onClick={() => toggleExpertise(config.key, sk.name, config.count)}
                        disabled={disabled}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                          isChosen
                            ? "border-primary bg-primary/10 font-medium"
                            : disabled
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:border-muted-foreground/40 hover:bg-secondary"
                        }`}
                      >
                        <Star className={`h-3 w-3 ${isChosen ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                        {sk.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section B — Skills Table */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Perícias
          </h3>
          {cls && classSkillChoices.length < maxClassSkills && (
            <p className="mt-1 text-xs text-info flex items-center gap-1">
              <Info className="h-3 w-3" />
              Escolha {maxClassSkills - classSkillChoices.length} perícia(s) da classe abaixo
            </p>
          )}
          {isBardL2 && (
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3" />
              Pau pra Toda Obra: +{halfProfValue} (½ prof) em perícias não proficientes
            </p>
          )}
        </div>
        <div className="divide-y">
          {sortedSkills.map((skill) => {
            const info = skillMap[skill.name];
            const abilityMod = calcAbilityMod(finalScores[skill.ability]);
            const isExpert = info.expertise;
            let profBonus = 0;
            let halfProf = false;

            if (isExpert) {
              profBonus = char.proficiencyBonus * 2;
            } else if (info.proficient) {
              profBonus = char.proficiencyBonus;
            } else if (isBardL2) {
              profBonus = halfProfValue;
              halfProf = true;
            }
            const total = abilityMod + profBonus;

            const isFixed = fixedSkills.includes(skill.name);
            const isClassChosen = classSkillChoices.includes(skill.name);
            const isClassOption = classChoices?.from.includes(skill.name) ?? false;
            const canToggle =
              !isFixed && isClassOption && (isClassChosen || classSkillChoices.length < maxClassSkills);

            return (
              <div
                key={skill.name}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
                  canToggle ? "cursor-pointer hover:bg-secondary/50" : ""
                } ${info.proficient ? "bg-primary/5" : ""}`}
                onClick={() => canToggle && toggleClassSkill(skill.name)}
              >
                {/* Proficiency indicator */}
                <div className="w-5 shrink-0">
                  {isExpert ? (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  ) : info.proficient ? (
                    <CheckCircle2 className={`h-4 w-4 ${isFixed ? "text-success" : "text-primary"}`} />
                  ) : isClassOption && !isFixed ? (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  ) : (
                    <span className="block h-4 w-4" />
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={`font-medium ${info.proficient ? "" : "text-muted-foreground"}`}>
                    {skill.name}
                  </span>
                  {halfProf && (
                    <span className="text-[9px] rounded bg-accent/20 px-1 py-0.5 text-accent-foreground font-medium">
                      ½ prof
                    </span>
                  )}
                  {isExpert && (
                    <span className="text-[9px] rounded bg-primary/20 px-1 py-0.5 text-primary font-medium">
                      expertise
                    </span>
                  )}
                </div>

                {/* Ability */}
                <span className="text-[10px] uppercase text-muted-foreground w-8 text-center">
                  {ABILITY_SHORT[skill.ability]}
                </span>

                {/* Total mod */}
                <span className={`w-10 text-right font-mono text-sm font-bold ${
                  total >= 0 ? "text-foreground" : "text-destructive"
                }`}>
                  {total >= 0 ? "+" : ""}{total}
                </span>

                {/* Source tags */}
                <div className="w-32 text-right">
                  {info.sources.length > 0 && (
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {info.sources[0]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-widest">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}
