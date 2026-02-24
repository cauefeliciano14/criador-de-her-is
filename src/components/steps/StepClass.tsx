import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { CheckCircle2, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function StepClass() {
  const [search, setSearch] = useState("");
  const classId = useCharacterStore((s) => s.class);
  const subclassId = useCharacterStore((s) => s.subclass);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...classes]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedClass = classes.find((c) => c.id === classId);

  const handleSelect = (id: string) => {
    const cls = classes.find((c) => c.id === id)!;
    patchCharacter({
      class: id,
      subclass: null,
      hitDie: cls.hitDie,
      savingThrows: cls.savingThrows,
      proficiencies: {
        ...useCharacterStore.getState().proficiencies,
        armor: cls.armorProficiencies,
        weapons: cls.weaponProficiencies,
        tools: cls.toolProficiencies,
      },
      spells: {
        ...useCharacterStore.getState().spells,
        spellcastingAbility: cls.spellcastingAbility ?? null,
      },
    });
    completeStep("class");
    setMissing("class", []);
  };

  const handleSubclass = (subId: string) => {
    patchCharacter({ subclass: subId });
  };

  useEffect(() => {
    if (!classId) {
      setMissing("class", ["Escolher classe"]);
    }
  }, [classId]);

  return (
    <div className="flex gap-0 h-full">
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        <h2 className="mb-3 text-lg font-bold">3. Escolha sua Classe</h2>
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
        <div className="space-y-2">
          {sorted.map((cls) => {
            const isSelected = classId === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => handleSelect(cls.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cls.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cls.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {selectedClass ? (
          <div>
            <h2 className="text-2xl font-bold">{selectedClass.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{selectedClass.description}</p>

            <div className="mt-6 space-y-4">
              <Section title="Traços Básicos">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Dado de Vida:</span> d{selectedClass.hitDie}</div>
                  <div><span className="text-muted-foreground">Atributo Primário:</span> {selectedClass.primaryAbility.toUpperCase()}</div>
                  <div><span className="text-muted-foreground">Salvaguardas:</span> {selectedClass.savingThrows.map(s => s.toUpperCase()).join(", ")}</div>
                  <div><span className="text-muted-foreground">Conjurador:</span> {selectedClass.isSpellcaster ? "Sim" : "Não"}</div>
                </div>
              </Section>

              {selectedClass.armorProficiencies.length > 0 && (
                <Section title="Proficiências em Armadura">
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {selectedClass.armorProficiencies.sort((a, b) => a.localeCompare(b, "pt-BR")).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="Proficiências em Armas">
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {selectedClass.weaponProficiencies.sort((a, b) => a.localeCompare(b, "pt-BR")).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Section>

              <Section title="Perícias">
                <p className="text-sm text-muted-foreground mb-2">
                  Escolha {selectedClass.skillChoices.choose} entre:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedClass.skillChoices.from.sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
                    <span key={s} className="rounded bg-secondary px-2 py-1 text-xs">{s}</span>
                  ))}
                </div>
              </Section>

              <Section title="Características">
                {selectedClass.features
                  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "pt-BR"))
                  .map((f) => (
                    <div key={f.name} className="mb-2 rounded-md border bg-secondary/40 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{f.name}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Nv. {f.level}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                    </div>
                  ))}
              </Section>

              {selectedClass.subclasses && selectedClass.subclasses.length > 0 && (
                <Section title="Subclasses">
                  <div className="space-y-2">
                    {selectedClass.subclasses
                      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                      .map((sc) => {
                        const isSel = subclassId === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => handleSubclass(sc.id)}
                            className={`w-full rounded-lg border p-3 text-left transition-colors ${
                              isSel ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{sc.name}</span>
                              {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{sc.description}</p>
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
            <p>Selecione uma classe na lista ao lado.</p>
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
