import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBuilderStore, type StepId } from "@/state/builderStore";

interface StepHeaderProps {
  stepId: StepId;
  canNext: boolean;
  currentMissing: string[];
}

export function StepHeader({ stepId, canNext, currentMissing }: StepHeaderProps) {
  const visibleSteps = useBuilderStore((s) => s.getVisibleSteps());
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);

  const currentIdx = visibleSteps.findIndex((s) => s.id === stepId);
  const isFirst = currentIdx <= 0;
  const isLast = currentIdx >= visibleSteps.length - 1;
  const stepLabel = visibleSteps[currentIdx]?.label || stepId;

  return (
    <div className="sticky top-0 z-10 bg-card border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold" data-step-header-title tabIndex={-1}>{stepLabel}</h1>
        {!canNext && currentMissing.length > 0 && (
          <div className="text-xs text-info flex items-center gap-1">
            <span>⚠ {currentMissing[0]}</span>
            {currentMissing.length > 1 && (
              <span className="text-muted-foreground">(+{currentMissing.length - 1})</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={prevStep}
          disabled={isFirst}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>

        <button
          onClick={nextStep}
          disabled={isLast || !canNext}
          className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            canNext && !isLast
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "opacity-30 cursor-not-allowed"
          }`}
        >
          {isLast ? "Finalizar" : "Próximo"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}