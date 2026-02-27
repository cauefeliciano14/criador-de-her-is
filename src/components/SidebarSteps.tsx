import { CheckCircle2, Circle, Lock, AlertCircle } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { races } from "@/data/races";
import { backgrounds } from "@/data/backgrounds";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SidebarSteps() {
  const classId = useCharacterStore((s) => s.class);
  const raceId = useCharacterStore((s) => s.race);
  const bgId = useCharacterStore((s) => s.background);

  const cls = classes.find((c) => c.id === classId);
  const race = races.find((r) => r.id === raceId);
  const bg = backgrounds.find((b) => b.id === bgId);

  const currentStep = useBuilderStore((s) => s.currentStep);
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const visibleSteps = getVisibleSteps();

  // Mini-summary for each step
  const stepSummary: Record<string, string | undefined> = {
    class: cls?.name,
    origin: bg?.name,
    race: race?.name,
  };

  const canNavigate = (stepId: StepId, idx: number) => {
    if (idx === 0) return true;
    const prevSteps = visibleSteps.slice(0, idx);
    return prevSteps.every((s) => completedSteps.includes(s.id));
  };

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar p-4 overflow-y-auto">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Etapas
      </p>
      <nav className="flex flex-col gap-0.5" role="navigation" aria-label="Etapas do builder">
        {visibleSteps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          const navigable = canNavigate(step.id, idx);
          const isLocked = !navigable && !isDone;
          const missing = requiredMissing[step.id] ?? [];
          const summary = stepSummary[step.id];

          const button = (
            <button
              key={step.id}
              onClick={() => navigable && goToStep(step.id)}
              disabled={isLocked}
              aria-current={isActive ? "step" : undefined}
              aria-label={`${step.num}. ${step.label}${isDone ? " — concluído" : isLocked ? " — bloqueado" : ""}`}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left transition-all ${
                isActive
                  ? "bg-secondary text-foreground font-medium shadow-sm"
                  : isDone
                  ? "text-success hover:bg-secondary/50"
                  : isLocked
                  ? "text-locked-foreground cursor-not-allowed"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : missing.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-info" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate leading-tight">
                  {step.num}. {step.label}
                </span>
                {summary && (
                  <span className={`block text-[10px] truncate mt-0.5 ${
                    isDone ? "text-success/70" : "text-muted-foreground"
                  }`}>
                    {summary}
                  </span>
                )}
              </div>
            </button>
          );

          // Show tooltip with missing items for non-active steps with pendencies
          if (!isActive && missing.length > 0 && !isLocked) {
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="font-semibold text-xs mb-1">Pendências:</p>
                  <ul className="text-[10px] space-y-0.5">
                    {missing.slice(0, 3).map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                    {missing.length > 3 && <li>+{missing.length - 3} mais</li>}
                  </ul>
                </TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>
    </aside>
  );
}
