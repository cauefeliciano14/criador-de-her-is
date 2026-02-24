import { CheckCircle2, Circle, Lock } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";

const steps = [
  { num: 1, label: "Classe", key: "step1Class" as const },
  { num: 2, label: "Raça", key: null },
  { num: 3, label: "Antecedente", key: null },
  { num: 4, label: "Atributos", key: null },
  { num: 5, label: "Equipamento", key: null },
  { num: 6, label: "Revisão", key: null },
];

export function SidebarSteps() {
  const completed = useCharacterStore((s) => s.completed);

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Etapas
      </p>
      <nav className="flex flex-col gap-1">
        {steps.map((step) => {
          const isDone = step.key ? completed[step.key] : false;
          const isActive = step.num === 1;
          const isLocked = step.num > 1;

          return (
            <div
              key={step.num}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-secondary text-foreground font-medium"
                  : isLocked
                  ? "text-locked-foreground cursor-not-allowed"
                  : "text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : isLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span>
                {step.num}. {step.label}
              </span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
