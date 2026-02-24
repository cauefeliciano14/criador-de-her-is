import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, STEPS } from "@/state/builderStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { ABILITY_LABELS, ABILITIES, calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";
import { CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useEffect } from "react";



export function StepReview() {
  const char = useCharacterStore();
  const builder = useBuilderStore();

  const race = races.find((r) => r.id === char.race);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting !== null;

  const visibleSteps = builder.getVisibleSteps(isSpellcaster);
  const allComplete = visibleSteps
    .filter((s) => s.id !== "review")
    .every((s) => builder.completedSteps.includes(s.id));

  useEffect(() => {
    if (allComplete) {
      builder.completeStep("review");
      builder.setMissing("review", []);
    } else {
      builder.uncompleteStep("review");
      const missing = visibleSteps
        .filter((s) => s.id !== "review" && !builder.completedSteps.includes(s.id))
        .map((s) => `Completar: ${s.label}`);
      builder.setMissing("review", missing);
    }
  }, [builder.completedSteps]);

  const handleExport = () => {
    const data = {
      name: char.name || "Sem nome",
      level: char.level,
      race: race?.name ?? null,
      subrace: char.subrace,
      class: cls?.name ?? null,
      subclass: char.subclass,
      background: bg?.name ?? null,
      abilityScores: char.abilityScores,
      abilityMods: char.abilityMods,
      proficiencyBonus: char.proficiencyBonus,
      hitPoints: char.hitPoints,
      armorClass: char.armorClass,
      speed: char.speed,
      savingThrows: char.savingThrows,
      skills: char.skills,
      proficiencies: char.proficiencies,
      features: char.features,
      equipment: char.equipment,
      spells: char.spells,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `personagem-${(char.name || "sem-nome").toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">9. Revisão Final</h2>
          <p className="text-sm text-muted-foreground">Confira todos os dados antes de finalizar.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar JSON
        </button>
      </div>

      {!allComplete && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-warning mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold text-sm">Etapas pendentes</span>
          </div>
          <ul className="text-sm space-y-1 ml-7">
            {visibleSteps
              .filter((s) => s.id !== "review" && !builder.completedSteps.includes(s.id))
              .map((s) => (
                <li key={s.id} className="text-muted-foreground">
                  • {s.num}. {s.label}
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <ReviewSection title="Nome do Personagem">
          <input
            type="text"
            placeholder="Digite o nome do personagem..."
            value={char.name}
            onChange={(e) => char.setField("name", e.target.value)}
            className="w-full max-w-sm rounded-md border bg-secondary px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </ReviewSection>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReviewCard label="Raça" value={race?.name} />
          <ReviewCard label="Classe" value={cls?.name} />
          <ReviewCard label="Antecedente" value={bg?.name} />
          <ReviewCard label="Nível" value={String(char.level)} />
          <ReviewCard label="PV Máximo" value={String(char.hitPoints.max)} />
          <ReviewCard label="CA" value={String(char.armorClass)} />
          <ReviewCard label="Deslocamento" value={`${char.speed}m`} />
          <ReviewCard label="Bônus de Proficiência" value={`+${char.proficiencyBonus}`} />
        </div>

        <ReviewSection title="Atributos">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ABILITIES.map((a) => (
              <div key={a} className="rounded-lg border bg-secondary/40 p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">{ABILITY_LABELS[a]}</p>
                <p className="text-xl font-bold">{char.abilityScores[a]}</p>
                <p className="text-xs text-muted-foreground">
                  ({calcAbilityMod(char.abilityScores[a]) >= 0 ? "+" : ""}
                  {calcAbilityMod(char.abilityScores[a])})
                </p>
              </div>
            ))}
          </div>
        </ReviewSection>

        {char.skills.length > 0 && (
          <ReviewSection title="Perícias">
            <div className="flex flex-wrap gap-2">
              {char.skills.sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
                <span key={s} className="rounded bg-secondary px-2 py-1 text-sm">{s}</span>
              ))}
            </div>
          </ReviewSection>
        )}

        {char.equipment.length > 0 && (
          <ReviewSection title="Equipamento">
            <ul className="list-disc ml-5 text-sm space-y-1">
              {char.equipment.sort((a, b) => a.localeCompare(b, "pt-BR")).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </ReviewSection>
        )}
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function ReviewCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-lg font-bold mt-1">{value || "—"}</p>
    </div>
  );
}
