import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { races } from "@/data/races";
import { CheckCircle2, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function StepRace() {
  const [search, setSearch] = useState("");
  const raceId = useCharacterStore((s) => s.race);
  const subraceId = useCharacterStore((s) => s.subrace);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...races]
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedRace = races.find((r) => r.id === raceId);

  const handleSelectRace = (id: string) => {
    const race = races.find((r) => r.id === id)!;
    const needsSubrace = (race.subraces?.length ?? 0) > 0;
    patchCharacter({
      race: id,
      subrace: null,
      speed: race.speed,
      proficiencies: {
        ...useCharacterStore.getState().proficiencies,
        languages: race.languages,
      },
      features: race.features,
    });
    if (needsSubrace) {
      uncompleteStep("race");
      setMissing("race", ["Escolher sub-raça"]);
    } else {
      completeStep("race");
      setMissing("race", []);
    }
  };

  const handleSelectSubrace = (subId: string) => {
    patchCharacter({ subrace: subId });
    completeStep("race");
    setMissing("race", []);
  };

  useEffect(() => {
    if (!raceId) {
      setMissing("race", ["Escolher raça"]);
    }
  }, [raceId]);

  return (
    <div className="flex gap-0 h-full">
      {/* List */}
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">2. Escolha sua Raça</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar raça..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-secondary py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-2">
          {sorted.map((r) => {
            const isSelected = raceId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleSelectRace(r.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedRace ? (
          <div>
            <h2 className="text-2xl font-bold">{selectedRace.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selectedRace.description}</p>

            <div className="mt-6 space-y-4">
              <Section title="Deslocamento">{selectedRace.speed}m</Section>
              <Section title="Bônus de Atributo">
                {Object.entries(selectedRace.abilityBonuses).map(([k, v]) => (
                  <span key={k} className="mr-3 inline-block rounded bg-secondary px-2 py-1 text-sm">
                    {k.toUpperCase()} +{v}
                  </span>
                ))}
              </Section>
              <Section title="Idiomas">
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {selectedRace.languages.sort((a, b) => a.localeCompare(b, "pt-BR")).map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </Section>
              <Section title="Traços Raciais">
                {selectedRace.features.map((f) => (
                  <div key={f.name} className="mb-2 rounded-md border bg-secondary/40 p-3">
                    <p className="font-medium text-sm">{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                  </div>
                ))}
              </Section>

              {selectedRace.subraces && selectedRace.subraces.length > 0 && (
                <Section title="Sub-raça (obrigatório)">
                  <div className="space-y-2">
                    {selectedRace.subraces
                      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                      .map((sr) => {
                        const isSel = subraceId === sr.id;
                        return (
                          <button
                            key={sr.id}
                            onClick={() => handleSelectSubrace(sr.id)}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${
                              isSel ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{sr.name}</span>
                              {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{sr.description}</p>
                          </button>
                        );
                      })}
                  </div>
                </Section>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione uma raça na lista ao lado.</p>
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
