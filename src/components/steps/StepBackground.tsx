import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { backgrounds } from "@/data/backgrounds";
import { CheckCircle2, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function StepBackground() {
  const [search, setSearch] = useState("");
  const bgId = useCharacterStore((s) => s.background);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...backgrounds]
    .filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedBg = backgrounds.find((b) => b.id === bgId);

  const handleSelect = (id: string) => {
    const bg = backgrounds.find((b) => b.id === id)!;
    patchCharacter({
      background: id,
      equipment: bg.equipment,
    });
    completeStep("background");
    setMissing("background", []);
  };

  useEffect(() => {
    if (!bgId) {
      setMissing("background", ["Escolher antecedente"]);
    }
  }, [bgId]);

  return (
    <div className="flex gap-0 h-full">
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">4. Antecedente</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar antecedente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          {sorted.map((bg) => {
            const isSelected = bgId === bg.id;
            return (
              <button
                key={bg.id}
                onClick={() => handleSelect(bg.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bg.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{bg.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedBg ? (
          <div>
            <h2 className="text-2xl font-bold">{selectedBg.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selectedBg.description}</p>

            <div className="mt-6 space-y-4">
              <Section title="Proficiências em Perícias">
                <div className="flex flex-wrap gap-2">
                  {selectedBg.skillProficiencies.sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
                    <span key={s} className="rounded bg-secondary px-2 py-1 text-sm">{s}</span>
                  ))}
                </div>
              </Section>

              {selectedBg.toolProficiencies.length > 0 && (
                <Section title="Proficiências em Ferramentas">
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {selectedBg.toolProficiencies.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </Section>
              )}

              {selectedBg.languages.length > 0 && (
                <Section title="Idiomas">
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {selectedBg.languages.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                </Section>
              )}

              <Section title="Equipamento">
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {selectedBg.equipment.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </Section>

              <Section title={`Característica: ${selectedBg.feature.name}`}>
                <p className="text-sm text-muted-foreground">{selectedBg.feature.description}</p>
              </Section>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione um antecedente na lista ao lado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
