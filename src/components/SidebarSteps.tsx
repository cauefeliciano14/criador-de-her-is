import { CheckCircle2, Circle, Lock, AlertCircle } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { classes } from "@/data/classes";

export function SidebarSteps() {
  const classId = useCharacterStore((s) => s.class);
  const cls = classes.find((c) => c.id === classId);
  const isSpellcaster = cls?.spellcasting != null;

  const currentStep = useBuilderStore((s) => s.currentStep);
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const visibleSteps = getVisibleSteps(isSpellcaster);

  const canNavigate = (stepId: StepId, idx: number) => {
    if (idx === 0) return true;
    const prevSteps = visibleSteps.slice(0, idx);
    return prevSteps.every((s) => completedSteps.includes(s.id));
  };

  return (
    <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar p-4 overflow-y-auto">
      <p className="heading-display mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Etapas
      </p>
      <nav className="flex flex-col gap-0.5">
        {visibleSteps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const isActive = currentStep === step.id;
          const navigable = canNavigate(step.id, idx);
          const isLocked = !navigable && !isDone;
          const missing = requiredMissing[step.id] ?? [];

          return (
            <button
              key={step.id}
              onClick={() => navigable && goToStep(step.id)}
              disabled={isLocked}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-foreground font-medium border border-primary/20 glow-primary"
                  : isDone
                  ? "text-success hover:bg-sidebar-accent"
                  : isLocked
                  ? "text-locked-foreground cursor-not-allowed"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : isActive ? (
                <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-primary/20" />
              ) : isLocked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-50" />
              ) : missing.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-info shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 opacity-40" />
              )}
              <span className="truncate">
                {step.num}. {step.label}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
