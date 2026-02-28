import { useCharacterStore, mergeUnique, replaceFeatures } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { backgrounds, type Background } from "@/data/backgrounds";
import { feats } from "@/data/feats";
import { toolsById, toolChoiceOptions, type ToolData } from "@/data/tools";
import { ABILITY_LABELS, ABILITY_SHORT } from "@/utils/calculations";
import { skillsByName } from "@/data/skills";
import { CheckCircle2, Search, Info, Star, Package, Wrench, Pencil } from "lucide-react";
import { getChoicesRequirements } from "@/utils/choices";
import { useState, useEffect, useCallback, useMemo } from "react";
import type React from "react";
import { commonLanguages } from "@/data/languagesCommon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

const TOOL_INFO_TEXT = "Proficiência com esta ferramenta permite adicionar o Bônus de Proficiência em testes relacionados.";

export function StepBackground() {
  const [search, setSearch] = useState("");

  const bgId = useCharacterStore((s) => s.background);
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...backgrounds]
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedBg = backgrounds.find((b) => b.id === bgId);
  const requirements = useMemo(() => getChoicesRequirements(char), [char]);
  const bgLanguageSource = requirements.buckets.languages.sources.find((s) => s.startsWith("background:"));
  const bgLanguageRequired = bgLanguageSource ? Number(bgLanguageSource.split(":").pop()) || 0 : 0;

  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!bgId) return ["Escolher antecedente"];
    const state = useCharacterStore.getState();
    const hasFeat = state.features.some((f) => f.sourceType === "background" && f.tags?.includes("originFeat"));
    if (!hasFeat) missing.push("Talento de Origem não aplicado");
    if ((selectedBg?.toolsGranted.some((id) => id.startsWith("choose_")) ?? false) && requirements.buckets.tools.pendingCount > 0) {
      missing.push("Escolher ferramenta de origem");
    }
    if (!state.backgroundEquipmentChoice) missing.push("Escolher pacote de equipamento (A/B)");
    if (requirements.buckets.languages.pendingCount > 0) {
      missing.push(`Escolher idiomas (${requirements.buckets.languages.selectedIds.length}/${requirements.buckets.languages.requiredCount})`);
    }
    return missing;
  }, [bgId, requirements.buckets.languages.pendingCount, requirements.buckets.languages.requiredCount, requirements.buckets.languages.selectedIds.length, requirements.buckets.tools.pendingCount, selectedBg?.toolsGranted]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("origin", missing);
    if (missing.length === 0 && bgId) completeStep("origin");
    else uncompleteStep("origin");
  }, [bgId, computeMissing, completeStep, setMissing, uncompleteStep]);

  const handleSelect = (id: string) => {
    if (id === bgId) return;
    const bg = backgrounds.find((b) => b.id === id)!;
    const feat = feats.find((item) => item.id === bg.originFeatId);
    const state = useCharacterStore.getState();

    const features = replaceFeatures(state.features, ["background"], [
      {
        sourceType: "background",
        sourceId: bg.id,
        name: feat?.name ?? bg.originFeatId,
        description: feat?.description ?? "",
        level: 1,
        tags: ["originFeat"],
      },
    ]);

    patchCharacter({
      background: id,
      backgroundEquipmentChoice: "A",
      backgroundEquipmentItems: bg.equipmentChoices[0]?.items ?? [],
      backgroundGold: bg.equipmentChoices[0]?.gold ?? 0,
      backgroundAbilityChoices: {},
      backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      features,
      choiceSelections: { ...state.choiceSelections, tools: [] },
      proficiencies: {
        ...state.proficiencies,
        languages: mergeUnique(state.proficiencies.languages, bg.languages),
      },
      skills: mergeUnique(state.skills, bg.skillsGranted),
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
      <div className="w-full md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">2. Origem</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar antecedente..." className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm" />
        </div>
        <div className="space-y-2">
          {sorted.map((bg) => {
            const isSelected = bgId === bg.id;
            return (
              <button key={bg.id} onClick={() => handleSelect(bg.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bg.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{bg.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedBg ? (
          <BackgroundDetails bg={selectedBg} bgLanguageRequired={bgLanguageRequired} requirements={requirements} selectedLanguages={char.choiceSelections.languages ?? []} onToggleLanguage={toggleLanguage} />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-muted-foreground"><p>Selecione um antecedente na lista ao lado.</p></div>
        )}
      </div>
    </div>
  );
}

function BackgroundDetails({ bg, bgLanguageRequired, requirements, selectedLanguages, onToggleLanguage }: { bg: Background; bgLanguageRequired: number; requirements: ReturnType<typeof getChoicesRequirements>; selectedLanguages: string[]; onToggleLanguage: (id: string) => void; }) {
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const char = useCharacterStore();
  const feat = feats.find((item) => item.id === bg.originFeatId);
  const selectedToolId = char.choiceSelections.tools?.[0] ?? null;
  const equipmentSelected = char.backgroundEquipmentChoice ?? "A";
  const conflictSkills = useMemo(() => {
    const selectedClassSkills = requirements.buckets.classSkills.selectedIds
      .map((id) => requirements.buckets.classSkills.options.find((option) => option.id === id)?.name)
      .filter(Boolean) as string[];
    return bg.skillsGranted.filter((skill) => selectedClassSkills.includes(skill));
  }, [bg.skillsGranted, requirements.buckets.classSkills.options, requirements.buckets.classSkills.selectedIds]);

  const featBullets = (feat?.description ?? "")
    .split(".")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 4);

  const equipmentOptionAList = bg.equipmentOptionA.items.map((item) => `${item.qty}× ${item.itemId}`);

  const setEquipmentChoice = (choice: "A" | "B") => {
    const resolvedItems = choice === "A" ? bg.equipmentChoices[0].items : [];
    const resolvedGold = choice === "A" ? bg.equipmentOptionA.gold : bg.equipmentOptionB.gold;
    patchCharacter({ backgroundEquipmentChoice: choice, backgroundEquipmentItems: resolvedItems, backgroundGold: resolvedGold });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">{bg.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{bg.description}</p>

      <div className="mt-6 space-y-4">
        <Section title="Perícias Concedidas" icon={<CheckCircle2 className="h-4 w-4 text-primary" />} highlighted>
          <div className="flex flex-wrap gap-2">
            {bg.skillsGranted.map((skill) => {
              const ability = skillsByName[skill]?.ability;
              return <Badge key={skill} variant="secondary">{skill}{ability ? ` (${ABILITY_LABELS[ability]})` : ""}</Badge>;
            })}
          </div>
          {conflictSkills.length > 0 && <p className="mt-2 text-xs text-warning">Conflito com perícia já escolhida: {conflictSkills.join(", ")}. Ajuste na etapa de Perícias.</p>}
        </Section>

        <Section title="Ferramentas Concedidas" icon={<Wrench className="h-4 w-4 text-primary" />} badge={<Badge>Concedido</Badge>} highlighted>
          <div className="space-y-3">
            {bg.toolsGranted.map((toolId) => {
              const tool = toolsById[toolId];
              const needsChoice = toolId.startsWith("choose_");
              const options = toolChoiceOptions[toolId] ?? [];
              return (
                <div key={toolId} className="rounded-md border bg-background p-3">
                  <p className="font-semibold">{tool?.name ?? toolId}</p>
                  <p className="text-xs text-muted-foreground">{TOOL_INFO_TEXT}</p>
                  {needsChoice && (
                    <div className="mt-3 rounded border">
                      <Command>
                        <CommandInput placeholder="Buscar ferramenta..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma ferramenta encontrada.</CommandEmpty>
                          <CommandGroup>
                            {options.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={option.name}
                                onSelect={() => patchCharacter({ choiceSelections: { ...char.choiceSelections, tools: [option.id] }, proficiencies: { ...char.proficiencies, tools: mergeUnique(char.proficiencies.tools, [option.name]) } })}
                              >
                                {option.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      {selectedToolId && <p className="px-3 py-2 text-xs text-primary">Completo: {options.find((item) => item.id === selectedToolId)?.name}</p>}
                    </div>
                  )}
                  {!needsChoice && (
                    <ToolDetails tool={tool} />
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Talento de Origem" icon={<Star className="h-4 w-4 text-primary" />} badge={<Badge>Concedido</Badge>} highlighted>
          <div className="rounded-md border bg-background p-4">
            <p className="text-lg font-bold">{feat?.name ?? "Talento não encontrado"}</p>
            <Badge variant="secondary" className="mt-1">Talento de Origem</Badge>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {featBullets.map((bullet) => <li key={bullet}>{bullet}.</li>)}
            </ul>
            {feat && (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" size="sm" className="mt-3">Detalhes</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{feat.name}</DialogTitle></DialogHeader>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feat.description}</p>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Section>

        <Section title="Equipamento" icon={<Package className="h-4 w-4 text-primary" />} badge={<Badge>{equipmentSelected === "A" ? "Pacote A" : "50 PO"}</Badge>} highlighted>
          <RadioGroup value={equipmentSelected} onValueChange={(value) => setEquipmentChoice(value as "A" | "B")}>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2"><RadioGroupItem value="A" id="equipA" /><Label htmlFor="equipA">Opção A — Pacote do antecedente</Label></div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">{equipmentOptionAList.map((item) => <li key={item}>{item}</li>)}</ul>
              {bg.equipmentOptionA.gold > 0 && <p className="mt-1 text-sm text-muted-foreground">+ {bg.equipmentOptionA.gold} PO</p>}
            </div>
            <div className="rounded-md border p-3">
              <div className="flex items-center gap-2"><RadioGroupItem value="B" id="equipB" /><Label htmlFor="equipB">Opção B — 50 PO</Label></div>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">Escolha persistida. Você pode editar a qualquer momento.</p>
        </Section>

        <Section title="Bônus de Atributos" icon={<Pencil className="h-4 w-4 text-primary" />}>
          <div className="flex gap-2 flex-wrap">{bg.abilityOptions.map((a) => <span key={a} className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm font-medium">{ABILITY_SHORT[a]} — {ABILITY_LABELS[a]}</span>)}</div>
          <p className="mt-2 text-xs text-info"><Info className="inline h-3 w-3 mr-1" />A distribuição (+2/+1 ou +1/+1/+1) é feita na etapa "Distribuir Atributos".</p>
        </Section>

        <Section title="Idiomas">
          <p className="text-xs text-muted-foreground mb-3">Escolha idiomas: {requirements.buckets.languages.selectedIds.length}/{requirements.buckets.languages.requiredCount} (inclui +{bgLanguageRequired} do antecedente).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {requirements.buckets.languages.options.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((language) => {
              const selected = selectedLanguages.includes(language.id);
              const languageInfo = commonLanguages.find((lang) => lang.id === language.id);
              const disabled = !selected && selectedLanguages.length >= requirements.buckets.languages.requiredCount;
              return (
                <button key={language.id} onClick={() => onToggleLanguage(language.id)} disabled={disabled} className={`rounded border px-2 py-1 text-sm text-left ${selected ? "border-primary bg-primary/10" : disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-secondary"}`}>
                  <span className="font-medium">{language.name}</span>{languageInfo?.origin && <span className="ml-1 text-xs text-muted-foreground">• {languageInfo.origin}</span>}
                </button>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, badge, children, highlighted = false }: { title: string; icon?: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode; highlighted?: boolean; }) {
  return (
    <div className={`rounded-lg border p-4 ${highlighted ? "bg-primary/5 border-primary/40" : "bg-card"}`}>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
        {badge}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToolDetails({ tool }: { tool?: ToolData }) {
  if (!tool) return null;
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="mt-2">Detalhes</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{tool.name}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{tool.description}</p>
        <p className="text-xs text-muted-foreground">Custo: {tool.costGp} PO • Peso: {tool.weight} lb</p>
      </DialogContent>
    </Dialog>
  );
}
