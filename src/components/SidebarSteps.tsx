import { CheckCircle2, Circle, Lock, AlertCircle } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { classes } from "@/data/classes";

export function SidebarSteps() {
  const classId = useCharacterStore((s) => s.class);
  const cls = classes.find((c) => c.id === classId);
  const isSpellcaster = cls?.isSpellcaster ?? false;

  const currentStep = useBuilderStore((s) => s.currentStep);
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const visibleSteps = getVisibleSteps(isSpellcaster);

  const canNavigate = (stepId: StepId, idx: number) => {
    if (idx === 0) return true;
    // Can navigate to any step that's completed or the first uncompleted
    const prevSteps = visibleSteps.slice(0, idx);
    return prevSteps.every((s) => completedSteps.includes(s.id));
  };

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar p-4 overflow-y-auto">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Etapas
      </p>
      <nav className="flex flex-col gap-1">
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
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-left transition-colors ${
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : isDone
                  ? "text-success hover:bg-secondary/50"
                  : isLocked
                  ? "text-locked-foreground cursor-not-allowed"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : isLocked ? (
                <Lock className="h-4 w-4 shrink-0" />
              ) : missing.length > 0 ? (
                <AlertCircle className="h-4 w-4 text-info shrink-0" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
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
