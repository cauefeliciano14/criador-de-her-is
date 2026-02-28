import { useCharacterStore, mergeUnique, replaceFeatures } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { backgrounds, type Background } from "@/data/backgrounds";
import { toolsByName } from "@/data/tools";
import { ABILITY_LABELS, ABILITY_SHORT } from "@/utils/calculations";
import { CheckCircle2, Search, Info, Star, Package, Wrench, ScrollText, ShieldCheck } from "lucide-react";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function StepBackground() {
  const [search, setSearch] = useState("");

  const bgId = useCharacterStore((s) => s.background);
  const backgroundToolChoice = useCharacterStore((s) => s.backgroundToolChoice);
  const backgroundEquipmentChoice = useCharacterStore((s) => s.backgroundEquipmentChoice);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...backgrounds]
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedBg = backgrounds.find((b) => b.id === bgId);

  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!selectedBg) {
      missing.push("Escolher antecedente");
      return missing;
    }
    if (selectedBg.grantedTool.mode === "choice" && !backgroundToolChoice) {
      missing.push("Escolher a ferramenta concedida");
    }
    if (!backgroundEquipmentChoice) {
      missing.push("Escolher equipamento inicial (Opção A ou B)");
    }
    return missing;
  }, [backgroundEquipmentChoice, backgroundToolChoice, selectedBg]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("origin", missing);
    if (missing.length === 0 && selectedBg) completeStep("origin");
    else uncompleteStep("origin");
  }, [computeMissing, completeStep, selectedBg, setMissing, uncompleteStep]);

  const handleSelect = (id: string) => {
    if (id === bgId) return;
    const bg = backgrounds.find((b) => b.id === id);
    if (!bg) return;
    const state = useCharacterStore.getState();

    const toolValue = bg.grantedTool.mode === "fixed" ? bg.grantedTool.name ?? null : null;

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
      backgroundEquipmentChoice: "A",
      backgroundToolChoice: toolValue,
      backgroundAbilityChoices: {},
      backgroundBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      features,
      proficiencies: {
        ...state.proficiencies,
        tools: toolValue ? mergeUnique(state.proficiencies.tools, [toolValue]) : state.proficiencies.tools,
      },
      skills: mergeUnique(state.skills, bg.grantedSkills),
      origin: {
        background: bg.id,
        skillsGranted: bg.grantedSkills,
        toolGranted: toolValue,
        originFeat: bg.originFeat.name,
        startingEquipment: "A",
      },
    });
  };

  const onToolChoice = (toolName: string) => {
    if (!selectedBg) return;
    patchCharacter({
      backgroundToolChoice: toolName,
      proficiencies: {
        ...useCharacterStore.getState().proficiencies,
        tools: mergeUnique(useCharacterStore.getState().proficiencies.tools, [toolName]),
      },
      origin: { ...useCharacterStore.getState().origin, toolGranted: toolName },
    });
  };

  const onEquipmentChoice = (choice: "A" | "B") => {
    patchCharacter({
      backgroundEquipmentChoice: choice,
      origin: { ...useCharacterStore.getState().origin, startingEquipment: choice },
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-0">
      <div className="w-full md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">2. Origem</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar antecedente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="space-y-2">
          {sorted.map((bg) => {
            const isSelected = bgId === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg.id)}
                className={`w-full rounded-lg border p-3 text-left ${isSelected ? "border-primary bg-primary/10" : "hover:bg-secondary"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bg.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {selectedBg ? (
          <BackgroundDetails
            bg={selectedBg}
            selectedTool={backgroundToolChoice}
            equipmentChoice={(backgroundEquipmentChoice as "A" | "B" | null) ?? null}
            onToolChoice={onToolChoice}
            onEquipmentChoice={onEquipmentChoice}
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">Selecione um antecedente.</div>
        )}
      </div>
    </div>
  );
}

function BackgroundDetails({
  bg,
  selectedTool,
  equipmentChoice,
  onToolChoice,
  onEquipmentChoice,
}: {
  bg: Background;
  selectedTool: string | null;
  equipmentChoice: "A" | "B" | null;
  onToolChoice: (name: string) => void;
  onEquipmentChoice: (choice: "A" | "B") => void;
}) {
  const toolName = bg.grantedTool.mode === "fixed" ? bg.grantedTool.name : selectedTool;
  const tool = toolName ? toolsByName[toolName] ?? toolsByName[bg.grantedTool.options?.[0] ?? ""] : null;

  return (
    <div>
      <h2 className="text-2xl font-bold">{bg.name}</h2>
      <div className="mt-4 flex gap-2">
        {bg.abilityScores.map((a) => (
          <span key={a} className="rounded bg-primary/10 border border-primary/30 px-3 py-1.5 text-sm font-medium">
            {ABILITY_SHORT[a]} — {ABILITY_LABELS[a]}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <HighlightCard title="Perícias Concedidas" icon={<ShieldCheck className="h-4 w-4" />}>
          <ul className="list-disc pl-5 space-y-1">{bg.grantedSkills.map((s) => <li key={s}>{s}</li>)}</ul>
        </HighlightCard>

        <HighlightCard title="Ferramentas Concedidas" icon={<Wrench className="h-4 w-4" />}>
          {bg.grantedTool.mode === "choice" && (
            <div className="mb-2">
              <p className="text-sm mb-2">{bg.grantedTool.choiceLabel}</p>
              <div className="flex gap-2 flex-wrap">
                {(bg.grantedTool.options ?? []).map((option) => (
                  <Button key={option} variant={selectedTool === option ? "default" : "outline"} size="sm" onClick={() => onToolChoice(option)}>{option}</Button>
                ))}
              </div>
            </div>
          )}
          {tool ? (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{tool.name}</p>
              <p>Atributo: {tool.attribute} | Peso: {tool.weight}</p>
              <p>Usar Objeto: {tool.useObject}</p>
              {tool.variants && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="variants">
                    <AccordionTrigger>Variantes</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc pl-5">{tool.variants.map((v) => <li key={v.id}>{v.name}</li>)}</ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          ) : <p className="text-sm text-muted-foreground">Selecione uma ferramenta para ver os detalhes.</p>}
        </HighlightCard>

        <HighlightCard title="Talento de Origem" icon={<Star className="h-4 w-4" />}>
          <p className="font-semibold mb-1">{bg.originFeat.name}</p>
          <ul className="list-disc pl-5 text-sm space-y-1 mb-3">{bg.originFeat.summary.map((item) => <li key={item}>{item}</li>)}</ul>
          <Dialog>
            <DialogTrigger asChild><Button size="sm" variant="outline">Detalhes</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{bg.originFeat.name}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{bg.originFeat.details}</p>
            </DialogContent>
          </Dialog>
        </HighlightCard>

        <HighlightCard title="Equipamento" icon={<Package className="h-4 w-4" />}>
          <div className="space-y-3">
            {bg.equipmentChoices.map((choice) => (
              <button key={choice.id} onClick={() => onEquipmentChoice(choice.id)} className={`w-full rounded border p-3 text-left ${equipmentChoice === choice.id ? "border-primary bg-primary/10" : ""}`}>
                <p className="font-semibold">{choice.label}</p>
                {choice.items.length > 0 && <ul className="list-disc pl-5 text-sm">{choice.items.map((item) => <li key={item}>{item}</li>)}</ul>}
                <p className="text-sm mt-1">{choice.gold} PO</p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground"><Info className="inline h-3 w-3 mr-1" />As escolhas ficam salvas na ficha automaticamente.</p>
        </HighlightCard>
      </div>

      <div className="mt-5 rounded border p-3 text-sm text-muted-foreground flex items-center gap-2">
        <ScrollText className="h-4 w-4" />
        Estes blocos são sempre exibidos e atualizados com a origem selecionada.
      </div>
    </div>
  );
}

function HighlightCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
