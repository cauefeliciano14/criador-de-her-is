import { lazy, Suspense, useEffect } from "react";
import { Header } from "@/components/Header";
import { IdentityHeader } from "@/components/IdentityHeader";
import { SidebarSteps } from "@/components/SidebarSteps";
import { SummaryPanel } from "@/components/SummaryPanel";
import { CatalogGate } from "@/components/CatalogGate";
import { StepHeader } from "@/components/StepHeader";
import { useEnterToNextStep } from "@/hooks/useEnterToNextStep";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { useCharacterStore } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import { validateCatalog } from "@/utils/validateCatalog";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ── Catalog validation (computed once at module load) ──
const catalogResult = validateCatalog({
  classIds: classes.map((c) => c.id),
  backgroundIds: backgrounds.map((b) => b.id),
  raceIds: races.map((r) => r.id),
});

if (!catalogResult.valid) {
  console.error("❌ Catálogo incompleto:", catalogResult.issues);
}

// ── Lazy-loaded step components ──
const StepClass = lazy(() => import("@/components/steps/StepClass").then(m => ({ default: m.StepClass })));
const StepBackground = lazy(() => import("@/components/steps/StepBackground").then(m => ({ default: m.StepBackground })));
const StepRace = lazy(() => import("@/components/steps/StepRace").then(m => ({ default: m.StepRace })));
const StepAbilityMethod = lazy(() => import("@/components/steps/StepAbilityMethod").then(m => ({ default: m.StepAbilityMethod })));
const StepEquipment = lazy(() => import("@/components/steps/StepEquipment").then(m => ({ default: m.StepEquipment })));
const StepChoices = lazy(() => import("@/components/steps/StepChoices").then(m => ({ default: m.StepChoices })));
const StepSheet = lazy(() => import("@/components/steps/StepSheet").then(m => ({ default: m.StepSheet })));

const STEP_COMPONENTS: Record<StepId, React.LazyExoticComponent<React.ComponentType>> = {
  class: StepClass,
  origin: StepBackground,
  race: StepRace,
  abilities: StepAbilityMethod,
  equipment: StepEquipment,
  choices: StepChoices,
  sheet: StepSheet,
};

function StepFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function BuilderContent() {
  const currentStep = useBuilderStore((s) => s.currentStep);
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const visibleSteps = getVisibleSteps();

  // Guard against stale persisted currentStep not in STEP_COMPONENTS
  const validStep = currentStep in STEP_COMPONENTS ? currentStep : "class";
  if (validStep !== currentStep) {
    goToStep(validStep as StepId);
  }

  const currentIdx = visibleSteps.findIndex((s) => s.id === validStep);
  const isFirst = currentIdx <= 0;
  const isLast = currentIdx >= visibleSteps.length - 1;
  const currentMissing = requiredMissing[validStep] ?? [];
  const isCurrentComplete = completedSteps.includes(validStep);
  const canNext = isCurrentComplete && currentMissing.length === 0;

  const StepComponent = STEP_COMPONENTS[validStep];

  // Hook for Enter key to advance
  useEnterToNextStep({ canGoNext: canNext && !isLast, goNext: nextStep });

  // Scroll to top when step changes
  useEffect(() => {
    const scroller = document.querySelector("[data-step-scroll='true']") as HTMLElement | null;
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Focus the step header title for accessibility
    setTimeout(() => {
      const headerTitle = document.querySelector("[data-step-header-title]") as HTMLElement | null;
      if (headerTitle) {
        headerTitle.focus();
      }
    }, 300); // Wait for scroll animation
  }, [currentStep, validStep]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <IdentityHeader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarSteps />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto" data-step-scroll="true">
            <StepHeader stepId={validStep} canNext={canNext} currentMissing={currentMissing} />
            <Suspense fallback={<StepFallback />}>
              <StepComponent />
            </Suspense>
          </div>
        </div>
        <SummaryPanel />
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <CatalogGate issues={catalogResult.issues}>
      <BuilderContent />
    </CatalogGate>
  );
};

export default Index;
