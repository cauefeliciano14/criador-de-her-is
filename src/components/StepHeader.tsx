import { AlertTriangle, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface StepHeaderProps {
  stepId: StepId;
  canNext: boolean;
  currentMissing: string[];
  showEnterHint?: boolean;
}

export function StepHeader({ stepId, canNext, currentMissing, showEnterHint = false }: StepHeaderProps) {
  const visibleSteps = useBuilderStore((s) => s.getVisibleSteps());
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);
  const isMobile = useIsMobile();

  const currentIdx = visibleSteps.findIndex((s) => s.id === stepId);
  const isFirst = currentIdx <= 0;
  const isLast = currentIdx >= visibleSteps.length - 1;
  const stepLabel = visibleSteps[currentIdx]?.label || stepId;

  const visibleMissing = currentMissing.slice(0, 3);
  const hasMoreMissing = currentMissing.length > 3;
  const summaryLabel =
    currentMissing.length === 1 ? "1 pendência para continuar" : `${currentMissing.length} pendências para continuar`;

  const missingSummary = (
    <div className="text-xs text-info flex items-center gap-2 min-w-0" aria-live="polite">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
        <span className="font-medium">{summaryLabel}:</span>
        {visibleMissing.map((item, index) => (
          <span key={`${item}-${index}`} className="truncate max-w-[220px]">
            {item}
            {index < visibleMissing.length - 1 ? "," : ""}
          </span>
        ))}
        {hasMoreMissing && <span className="text-muted-foreground">+{currentMissing.length - visibleMissing.length}</span>}
      </div>
    </div>
  );

  const detailsContent = (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Pendências desta etapa</p>
      <ul className="space-y-1 text-sm">
        {currentMissing.map((item, index) => (
          <li key={`${item}-${index}`} className="text-foreground">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="sticky top-0 z-10 bg-card border-b px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 min-w-0">
        <h1 className="text-xl font-semibold" data-step-header-title tabIndex={-1}>{stepLabel}</h1>
        {!canNext && currentMissing.length > 0 && (
          <>
            {missingSummary}
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-info hover:bg-secondary"
                    type="button"
                    aria-label="Ver todas as pendências"
                  >
                    ver todas
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Pendências para continuar</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6">{detailsContent}</div>
                </SheetContent>
              </Sheet>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-info hover:bg-secondary"
                    type="button"
                    aria-label="Expandir lista completa de pendências"
                  >
                    {hasMoreMissing ? "ver todas" : "detalhes"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">{detailsContent}</PopoverContent>
              </Popover>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showEnterHint && (
          <span className="hidden sm:inline text-xs text-muted-foreground" aria-live="polite">
            Enter para avançar
          </span>
        )}

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
