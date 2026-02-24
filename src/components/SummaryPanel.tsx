import { Info, CheckCircle2 } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import {
  ABILITY_LABELS,
  ABILITY_SHORT,
  ABILITIES,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
} from "@/utils/calculations";

export function SummaryPanel() {
  const char = useCharacterStore();
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting !== null;
  const visibleSteps = getVisibleSteps(isSpellcaster);

  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses);
  const hasAnyBonus = ABILITIES.some((a) => char.racialBonuses[a] !== 0);

  return (
    <aside className="w-64 shrink-0 space-y-4 p-4 overflow-y-auto">
      {/* Character Summary */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Ficha Resumida
        </h2>
        <div className="space-y-2 text-sm">
          <Row label="Raça" value={race?.name} extra={subrace?.name} />
          <Row label="Classe" value={cls?.name} />
          <Row label="Antecedente" value={bg?.name} />
          <Divider />
          <Row label="PV" value={String(char.hitPoints.max)} />
          <Row label="CA" value={String(char.armorClass)} />
          <Row label="Desl." value={`${char.speed}m`} />
          <Row label="Prof." value={`+${char.proficiencyBonus}`} />
        </div>
      </div>

      {/* Ability Scores with Base/Bonus/Total */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Atributos
        </h2>
        {hasAnyBonus && (
          <div className="grid grid-cols-4 gap-1 mb-2 text-[9px] text-muted-foreground uppercase">
            <span></span>
            <span className="text-center">Base</span>
            <span className="text-center">Bônus</span>
            <span className="text-center">Total</span>
          </div>
        )}
        <div className="space-y-1.5">
          {ABILITIES.map((a) => {
            const base = char.abilityScores[a];
            const bonus = char.racialBonuses[a];
            const total = finalScores[a];
            const mod = calcAbilityMod(total);

            if (hasAnyBonus) {
              return (
                <div key={a} className="grid grid-cols-4 gap-1 items-center">
                  <div className="text-[10px] uppercase text-muted-foreground font-medium">
                    {ABILITY_SHORT[a]}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">{base}</div>
                  <div className="text-center text-xs">
                    {bonus > 0 ? (
                      <span className="text-primary font-medium">+{bonus}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="rounded bg-secondary/40 py-1 text-center">
                    <span className="text-sm font-bold">{total}</span>
                    <span className={`text-[10px] ml-0.5 ${mod >= 0 ? "text-success" : "text-destructive"}`}>
                      ({mod >= 0 ? "+" : ""}{mod})
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={a} className="rounded border bg-secondary/40 p-2 text-center inline-block w-[calc(33.33%-4px)] mr-1 mb-1">
                <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
                <p className="text-sm font-bold">{total}</p>
                <p className="text-[10px] text-muted-foreground">
                  {mod >= 0 ? "+" : ""}{mod}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      {char.proficiencies.languages.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-1">
            {char.proficiencies.languages.sort((a, b) => a.localeCompare(b, "pt-BR")).map((l) => (
              <span key={l} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {char.skills.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Perícias
          </h2>
          <div className="flex flex-wrap gap-1">
            {char.skills.sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
              <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Pendências
        </h2>
        <ul className="space-y-1.5 text-xs">
          {visibleSteps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            const missing = requiredMissing[step.id] ?? [];
            return (
              <li key={step.id} className="flex items-start gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
                )}
                <div>
                  <span className={isDone ? "text-success" : "text-info"}>
                    {step.num}. {step.label}
                  </span>
                  {!isDone && missing.length > 0 && (
                    <ul className="mt-0.5 ml-2 text-muted-foreground">
                      {missing.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function Row({ label, value, extra }: { label: string; value?: string; extra?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">
        {value ?? "—"}
        {extra && <span className="text-[10px] text-muted-foreground ml-1">({extra})</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t my-1" />;
}
