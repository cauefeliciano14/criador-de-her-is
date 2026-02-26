import { Header } from "@/components/Header";
import { SidebarSteps } from "@/components/SidebarSteps";
import { SummaryPanel } from "@/components/SummaryPanel";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { useCharacterStore } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { StepAbilityMethod } from "@/components/steps/StepAbilityMethod";
import { StepRace } from "@/components/steps/StepRace";
import { StepClass } from "@/components/steps/StepClass";
import { StepBackground } from "@/components/steps/StepBackground";
import { StepSkills } from "@/components/steps/StepSkills";
import { StepSpells } from "@/components/steps/StepSpells";
import { StepEquipment } from "@/components/steps/StepEquipment";
import { StepReview } from "@/components/steps/StepReview";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const STEP_COMPONENTS: Record<StepId, React.ComponentType> = {
  "ability-method": StepAbilityMethod,
  race: StepRace,
  class: StepClass,
  background: StepBackground,
  skills: StepSkills,
  spells: StepSpells,
  equipment: StepEquipment,
  review: StepReview,
};

const Index = () => {
  const currentStep = useBuilderStore((s) => s.currentStep);
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const nextStep = useBuilderStore((s) => s.nextStep);
  const prevStep = useBuilderStore((s) => s.prevStep);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const classId = useCharacterStore((s) => s.class);
  const cls = classes.find((c) => c.id === classId);
  const isSpellcaster = cls?.spellcasting != null;
  const visibleSteps = getVisibleSteps(isSpellcaster);

  const currentIdx = visibleSteps.findIndex((s) => s.id === currentStep);
  const isFirst = currentIdx <= 0;
  const isLast = currentIdx >= visibleSteps.length - 1;
  const currentMissing = requiredMissing[currentStep] ?? [];
  const isCurrentComplete = completedSteps.includes(currentStep);
  const canNext = isCurrentComplete && currentMissing.length === 0;

  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarSteps />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <StepComponent />
          </div>
          <div className="no-print flex items-center justify-between border-t border-border/60 bg-card/80 backdrop-blur-sm px-6 py-3">
            <button
              onClick={() => prevStep(isSpellcaster)}
              disabled={isFirst}
              className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>

            {!canNext && currentMissing.length > 0 && (
              <div className="text-xs text-info flex items-center gap-1.5 bg-info/10 rounded-full px-3 py-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{currentMissing[0]}</span>
                {currentMissing.length > 1 && (
                  <span className="text-muted-foreground">(+{currentMissing.length - 1})</span>
                )}
              </div>
            )}

            <button
              onClick={() => nextStep(isSpellcaster)}
              disabled={isLast || !canNext}
              className={`flex items-center gap-1 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                canNext && !isLast
                  ? "btn-gradient"
                  : "opacity-30 cursor-not-allowed bg-muted"
              }`}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <SummaryPanel />
      </div>
    </div>
  );
};

export default Index;
