import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { classes } from "@/data/classes";
import { useCharacterStore } from "@/state/characterStore";
import { GenericRenderer } from "@/components/GenericRenderer";

export function ClassSelection() {
  const [search, setSearch] = useState("");
  const draft = useCharacterStore((s) => s.draft);
  const completed = useCharacterStore((s) => s.completed);
  const selectClass = useCharacterStore((s) => s.selectClass);
  const confirmClass = useCharacterStore((s) => s.confirmClass);

  const filtered = classes
    .filter((c) => c.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const selected = classes.find((c) => c.id === draft.classId);

  return (
    <div className="flex flex-1 gap-0 overflow-hidden">
      {/* Left: class list */}
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">1. Escolha sua Classe</h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar classe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Class cards */}
        <div className="space-y-2">
          {filtered.map((cls) => {
            const isSelected = draft.classId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => selectClass(cls.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cls.nome}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{cls.subtitulo}</p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma classe encontrada.</p>
          )}
        </div>
      </div>

      {/* Right: details */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selected.nome}</h2>
                <p className="text-sm text-muted-foreground">{selected.subtitulo}</p>
              </div>
              <button
                onClick={confirmClass}
                disabled={completed.step1Class}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                  completed.step1Class
                    ? "bg-success/20 text-success cursor-default"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {completed.step1Class ? "✓ Classe Confirmada" : "Confirmar Classe"}
              </button>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {selected.descricao}
            </p>

            <div className="space-y-6">
              {Object.entries(selected)
                .filter(([key]) => !["id", "nome", "subtitulo", "descricao"].includes(key))
                .map(([key, value]) => (
                  <section key={key} className="rounded-lg border bg-card p-4">
                    <GenericRenderer data={value} label={key} />
                  </section>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione uma classe na lista ao lado para ver os detalhes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
