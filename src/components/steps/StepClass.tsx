import { useCharacterStore, mergeUnique, replaceFeatures, type NormalizedFeature } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes, type ClassData } from "@/data/classes";
import { CheckCircle2, Search, Info, ChevronDown, ChevronUp, Swords, Shield, Package } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export function StepClass() {
  const [search, setSearch] = useState("");
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const classId = useCharacterStore((s) => s.class);
  const subclassId = useCharacterStore((s) => s.subclass);
  const classSkillChoices = useCharacterStore((s) => s.classSkillChoices);
  const classEquipmentChoice = useCharacterStore((s) => s.classEquipmentChoice);
  const level = useCharacterStore((s) => s.level);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...classes]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedClass = classes.find((c) => c.id === classId);

  // --- Validation ---
  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!classId) {
      missing.push("Escolher classe");
    } else {
      const cls = classes.find((c) => c.id === classId);
      if (cls) {
        if (classSkillChoices.length < cls.skillChoices.choose) {
          missing.push(`Escolher ${cls.skillChoices.choose - classSkillChoices.length} perícia(s)`);
        }
        if (!classEquipmentChoice) {
          missing.push("Escolher equipamento inicial");
        }
      }
    }
    return missing;
  }, [classId, classSkillChoices, classEquipmentChoice]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("class", missing);
    if (missing.length === 0 && classId) {
      completeStep("class");
    } else {
      uncompleteStep("class");
    }
  }, [classId, classSkillChoices, classEquipmentChoice]);

  // --- Select class ---
  const handleSelect = (id: string) => {
    if (id === classId) return;

    const cls = classes.find((c) => c.id === id)!;
    const state = useCharacterStore.getState();

    // Build level-1 features
    const lvl1 = cls.featuresByLevel.find((f) => f.level === 1);
    const newFeatures: NormalizedFeature[] = (lvl1?.features ?? []).map((f) => ({
      sourceType: "class" as const,
      sourceId: cls.id,
      name: f.name,
      description: f.description,
      level: 1,
    }));

    // Remove old class/subclass features, add new
    const features = replaceFeatures(state.features, ["class", "subclass"], newFeatures);

    // Spells setup
    const spells = cls.spellcasting
      ? {
          cantrips: [],
          prepared: [],
          slots: Object.values(cls.spellcasting.spellSlotsByLevel[1] ?? {}),
          spellcastingAbility: cls.spellcasting.ability,
          spellSaveDC: 0,
          spellAttackBonus: 0,
        }
      : {
          cantrips: [],
          prepared: [],
          slots: [],
          spellcastingAbility: null,
          spellSaveDC: 0,
          spellAttackBonus: 0,
        };

    // Rebuild proficiencies: keep race-sourced, replace class
    // For simplicity we just set class proficiencies directly.
    // Race profs are merged in from race step.
    const racialFeatures = state.features.filter(
      (f) => f.sourceType === "race" || f.sourceType === "subrace"
    );

    patchCharacter({
      class: id,
      subclass: null,
      classSkillChoices: [],
      classEquipmentChoice: null,
      hitDie: cls.hitDie,
      savingThrows: cls.savingThrows,
      proficiencies: {
        ...state.proficiencies,
        armor: cls.proficiencies.armor,
        weapons: cls.proficiencies.weapons,
        tools: mergeUnique(state.proficiencies.tools, cls.proficiencies.tools),
      },
      features,
      spells,
      equipment: [],
    });
  };

  // --- Toggle skill ---
  const handleToggleSkill = (skill: string) => {
    if (!selectedClass) return;
    const max = selectedClass.skillChoices.choose;
    let next: string[];
    if (classSkillChoices.includes(skill)) {
      next = classSkillChoices.filter((s) => s !== skill);
    } else {
      if (classSkillChoices.length >= max) return;
      next = [...classSkillChoices, skill];
    }
    patchCharacter({ classSkillChoices: next });
  };

  // --- Select equipment ---
  const handleEquipment = (choiceId: string) => {
    if (!selectedClass) return;
    const choice = selectedClass.equipmentChoices.find((e) => e.id === choiceId);
    patchCharacter({
      classEquipmentChoice: choiceId,
      equipment: choice?.items ?? [],
    });
  };

  // --- Subclass ---
  const handleSubclass = (subId: string) => {
    if (!selectedClass) return;
    const sub = selectedClass.subclasses.find((s) => s.id === subId);
    if (!sub) return;

    const state = useCharacterStore.getState();
    // Remove old subclass features, add new lvl features <= current level
    const subFeatures: NormalizedFeature[] = sub.featuresByLevel
      .filter((fl) => fl.level <= level)
      .flatMap((fl) =>
        fl.features.map((f) => ({
          sourceType: "subclass" as const,
          sourceId: sub.id,
          name: f.name,
          description: f.description,
          level: fl.level,
        }))
      );

    const features = [
      ...state.features.filter((f) => f.sourceType !== "subclass"),
      ...subFeatures,
    ];

    patchCharacter({ subclass: subId, features });
  };

  const toggleFeature = (name: string) => {
    setExpandedFeatures((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex gap-0 h-full">
      {/* Left - Class list */}
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
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "hover:border-muted-foreground/40 hover:bg-secondary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cls.name}</span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>d{cls.hitDie}</span>
                  <span>•</span>
                  <span>{cls.primaryAbility.join(", ")}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {cls.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right - Details */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedClass ? (
          <ClassDetails
            cls={selectedClass}
            classSkillChoices={classSkillChoices}
            classEquipmentChoice={classEquipmentChoice}
            subclassId={subclassId}
            level={level}
            expandedFeatures={expandedFeatures}
            onToggleSkill={handleToggleSkill}
            onSelectEquipment={handleEquipment}
            onSelectSubclass={handleSubclass}
            onToggleFeature={toggleFeature}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione uma classe na lista ao lado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Panel ───

interface ClassDetailsProps {
  cls: ClassData;
  classSkillChoices: string[];
  classEquipmentChoice: string | null;
  subclassId: string | null;
  level: number;
  expandedFeatures: Record<string, boolean>;
  onToggleSkill: (skill: string) => void;
  onSelectEquipment: (id: string) => void;
  onSelectSubclass: (id: string) => void;
  onToggleFeature: (name: string) => void;
}

function ClassDetails({
  cls,
  classSkillChoices,
  classEquipmentChoice,
  subclassId,
  level,
  expandedFeatures,
  onToggleSkill,
  onSelectEquipment,
  onSelectSubclass,
  onToggleFeature,
}: ClassDetailsProps) {
  const isSpellcaster = cls.spellcasting !== null;

  return (
    <div>
      <h2 className="text-2xl font-bold">{cls.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {cls.description}
      </p>

      <div className="mt-6 space-y-4">
        {/* Basic Traits */}
        <Section title="Traços Básicos">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Dado de Vida:</span> d{cls.hitDie}
            </div>
            <div>
              <span className="text-muted-foreground">Atributo Primário:</span>{" "}
              {cls.primaryAbility.join(", ")}
            </div>
            <div>
              <span className="text-muted-foreground">Salvaguardas:</span>{" "}
              {cls.savingThrows.join(", ")}
            </div>
            <div>
              <span className="text-muted-foreground">Conjurador:</span>{" "}
              {isSpellcaster ? "Sim" : "Não"}
            </div>
          </div>
        </Section>

        {/* Armor proficiencies */}
        {cls.proficiencies.armor.length > 0 && (
          <Section title="Proficiências em Armadura">
            <div className="flex flex-wrap gap-2">
              {cls.proficiencies.armor
                .sort((a, b) => a.localeCompare(b, "pt-BR"))
                .map((p) => (
                  <span key={p} className="rounded bg-secondary px-2 py-1 text-xs">
                    {p}
                  </span>
                ))}
            </div>
          </Section>
        )}

        {/* Weapon proficiencies */}
        <Section title="Proficiências em Armas">
          <div className="flex flex-wrap gap-2">
            {cls.proficiencies.weapons
              .sort((a, b) => a.localeCompare(b, "pt-BR"))
              .map((p) => (
                <span key={p} className="rounded bg-secondary px-2 py-1 text-xs">
                  {p}
                </span>
              ))}
          </div>
        </Section>

        {/* Skill choices — REQUIRED */}
        <Section
          title="Perícias"
          badge={
            classSkillChoices.length < cls.skillChoices.choose ? (
              <RequiredBadge label={`Escolha ${cls.skillChoices.choose}`} />
            ) : null
          }
        >
          <p className="text-sm text-muted-foreground mb-3">
            Escolha {cls.skillChoices.choose} entre as opções abaixo:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {cls.skillChoices.from
              .sort((a, b) => a.localeCompare(b, "pt-BR"))
              .map((skill) => {
                const selected = classSkillChoices.includes(skill);
                const disabled =
                  !selected && classSkillChoices.length >= cls.skillChoices.choose;
                return (
                  <button
                    key={skill}
                    onClick={() => onToggleSkill(skill)}
                    disabled={disabled}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 font-medium"
                        : disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:border-muted-foreground/40 hover:bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center ${
                        selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                      }`}
                    >
                      {selected && (
                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    {skill}
                  </button>
                );
              })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {classSkillChoices.length}/{cls.skillChoices.choose} selecionadas
          </p>
        </Section>

        {/* Equipment choices — REQUIRED */}
        <Section
          title="Equipamento Inicial"
          badge={!classEquipmentChoice ? <RequiredBadge label="Obrigatório" /> : null}
        >
          <div className="space-y-2">
            {cls.equipmentChoices.map((choice) => {
              const selected = classEquipmentChoice === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => onSelectEquipment(choice.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "hover:border-muted-foreground/40 hover:bg-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{choice.label}</span>
                    </div>
                    {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  {choice.items.length > 0 ? (
                    <ul className="ml-6 text-xs text-muted-foreground space-y-0.5">
                      {choice.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="ml-6 text-xs text-muted-foreground">
                      {choice.gold} PO para comprar equipamento
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Level 1 features */}
        <Section title="Características (Nível 1)">
          {cls.featuresByLevel
            .filter((fl) => fl.level === 1)
            .flatMap((fl) => fl.features)
            .map((f) => {
              const isOpen = expandedFeatures[f.name] ?? true;
              return (
                <div key={f.name} className="mb-2 rounded-md border bg-secondary/40">
                  <button
                    onClick={() => onToggleFeature(f.name)}
                    className="flex w-full items-center justify-between p-3"
                  >
                    <span className="font-medium text-sm">{f.name}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="px-3 pb-3 text-xs text-muted-foreground">{f.description}</p>
                  )}
                </div>
              );
            })}
        </Section>

        {/* Spellcasting info */}
        {isSpellcaster && cls.spellcasting && (
          <Section title="Conjuração">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Atributo:</span>{" "}
                {cls.spellcasting.ability}
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>{" "}
                {cls.spellcasting.type === "prepared"
                  ? "Magias preparadas"
                  : cls.spellcasting.type === "known"
                  ? "Magias conhecidas"
                  : "Magia de pacto"}
              </div>
              <div>
                <span className="text-muted-foreground">Truques no Nível 1:</span>{" "}
                {cls.spellcasting.cantripsKnownAtLevel[1] ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Magias preparadas:</span>{" "}
                {cls.spellcasting.spellsPreparedFormula}
              </div>
              {cls.spellcasting.spellSlotsByLevel[1] && (
                <div>
                  <span className="text-muted-foreground">Espaços (Nível 1):</span>{" "}
                  {Object.entries(cls.spellcasting.spellSlotsByLevel[1])
                    .map(([lvl, slots]) => `${slots}× nível ${lvl}`)
                    .join(", ")}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground italic">
              A seleção de magias será feita na etapa "Magias".
            </p>
          </Section>
        )}

        {/* Subclasses */}
        <Section title="Subclasse">
          {level >= 3 && cls.subclasses.length > 0 ? (
            <div className="space-y-2">
              {cls.subclasses
                .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                .map((sc) => {
                  const isSel = subclassId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => onSelectSubclass(sc.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSel
                          ? "border-primary bg-primary/10"
                          : "hover:border-muted-foreground/40 hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{sc.name}</span>
                        {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sc.description}
                      </p>
                    </button>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Você escolherá sua subclasse no nível 3.
            </p>
          )}
        </Section>
      </div>
    </div>
  );
}

// ─── Helpers ───

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {badge}
      </div>
      <div>{children}</div>
    </div>
  );
}

function RequiredBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
      <Info className="h-3 w-3" />
      {label}
    </span>
  );
}
