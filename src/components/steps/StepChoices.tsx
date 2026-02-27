import { useEffect, useMemo } from "react";
import { useBuilderStore } from "@/state/builderStore";
import { useCharacterStore } from "@/state/characterStore";
import { getCanonicalRaceChoiceKeyFromSources, getChoicesRequirements, type ChoiceOption } from "@/utils/choices";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function StepChoices() {
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const requirements = useMemo(() => getChoicesRequirements(char), [char]);

  useEffect(() => {
    useBuilderStore.getState().updateChoicesRequirements();

    if (requirements.needsStep) {
      uncompleteStep("choices");
      const missing = Object.entries(requirements.buckets)
        .filter(([, bucket]) => bucket.pendingCount > 0)
        .map(([bucketKey, bucket]) => `${bucket.pendingCount} pendência(s) em ${bucketTitle(bucketKey)}`);
      setMissing("choices", missing);
      return;
    }

    completeStep("choices");
    setMissing("choices", []);
  }, [char, requirements.needsStep, requirements]);

  const toggle = (bucket: "classSkills" | "languages" | "tools" | "instruments" | "cantrips" | "spells" | "raceChoice" | "classFeats", id: string) => {
    const selected = new Set(requirements.buckets[bucket].selectedIds);
    if (selected.has(id)) selected.delete(id);
    else if (selected.size < requirements.buckets[bucket].requiredCount) selected.add(id);

    const next = [...selected];
    const choiceSelections = { ...char.choiceSelections };
    if (bucket === "raceChoice") choiceSelections.raceChoice = next[0] ?? null;
    else (choiceSelections as any)[bucket] = next;

    const raceChoiceKey = getCanonicalRaceChoiceKeyFromSources(requirements.buckets.raceChoice.sources);
    const nextRaceChoices = bucket === "raceChoice"
      ? (() => {
          if (!raceChoiceKey) return char.raceChoices;
          if (!next[0]) {
            const { [raceChoiceKey]: _removed, ...rest } = char.raceChoices;
            return rest;
          }
          return { ...char.raceChoices, [raceChoiceKey]: next[0] };
        })()
      : char.raceChoices;

    patchCharacter({
      choiceSelections,
      classSkillChoices: bucket === "classSkills" ? next : char.classSkillChoices,
      spells: {
        ...char.spells,
        cantrips: bucket === "cantrips" ? next : char.spells.cantrips,
        prepared: bucket === "spells" ? next : char.spells.prepared,
      },
      raceChoices: nextRaceChoices,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Escolhas</h2>

      <BucketSection title="Perícias" bucket={requirements.buckets.classSkills} onToggle={(id) => toggle("classSkills", id)} />
      <BucketSection title="Idiomas" bucket={requirements.buckets.languages} onToggle={(id) => toggle("languages", id)} />
      <BucketSection title="Ferramentas" bucket={requirements.buckets.tools} onToggle={(id) => toggle("tools", id)} />
      <BucketSection title="Instrumentos" bucket={requirements.buckets.instruments} onToggle={(id) => toggle("instruments", id)} />
      <BucketSection title="Truques" bucket={requirements.buckets.cantrips} onToggle={(id) => toggle("cantrips", id)} />
      <BucketSection title="Magias" bucket={requirements.buckets.spells} onToggle={(id) => toggle("spells", id)} />
      <BucketSection title="Escolha Racial" bucket={requirements.buckets.raceChoice} onToggle={(id) => toggle("raceChoice", id)} />
      <BucketSection title="Talentos de Classe" bucket={requirements.buckets.classFeats} onToggle={(id) => toggle("classFeats", id)} />

      {!requirements.needsStep && (
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
  onToggle
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
        <Badge variant="outline">{bucket.pendingCount} pendente(s)</Badge>
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
                className={`p-2 rounded border text-left ${selected ? "bg-primary/10 border-primary" : "border-border hover:bg-muted"}`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
