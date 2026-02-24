import { Info, CheckCircle2 } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { classes } from "@/data/classes";

export function SummaryPanel() {
  const draft = useCharacterStore((s) => s.draft);
  const completed = useCharacterStore((s) => s.completed);

  const selectedClass = classes.find((c) => c.id === draft.classId);

  return (
    <aside className="w-64 shrink-0 space-y-4 p-4">
      {/* Resumo */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Resumo da Ficha
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Classe</span>
            <span className="font-medium">{selectedClass?.nome ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Raça</span>
            <span className="text-locked-foreground">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Antecedente</span>
            <span className="text-locked-foreground">—</span>
          </div>
        </div>
      </div>

      {/* Pendências */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Pendências
        </h2>
        <ul className="space-y-2 text-sm">
          {!completed.step1Class && (
            <li className="flex items-center gap-2 text-info">
              <Info className="h-4 w-4" />
              <span>1. Classe — confirmar seleção</span>
            </li>
          )}
          {completed.step1Class && (
            <li className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" />
              <span>1. Classe — concluída</span>
            </li>
          )}
          {[
            "2. Raça",
            "3. Antecedente",
            "4. Atributos",
            "5. Equipamento",
            "6. Revisão",
          ].map((label) => (
            <li key={label} className="flex items-center gap-2 text-locked-foreground">
              <Info className="h-4 w-4" />
              <span>{label} — bloqueada</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
