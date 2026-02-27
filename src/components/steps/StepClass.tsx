import { useCharacterStore, mergeUnique, replaceFeatures, type NormalizedFeature } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes, type ClassData } from "@/data/classes";
import { CheckCircle2, Search, Info, ChevronDown, ChevronUp, Swords, Shield, Package, AlertTriangle, BookOpen, Lock } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function StepClass() {
  const [search, setSearch] = useState("");
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});

  const classId = useCharacterStore((s) => s.class);
  const subclassId = useCharacterStore((s) => s.subclass);
  const classSkillChoices = useCharacterStore((s) => s.classSkillChoices);
  const classEquipmentChoice = useCharacterStore((s) => s.classEquipmentChoice);
  const classFeatureChoices = useCharacterStore((s) => s.classFeatureChoices);
  const level = useCharacterStore((s) => s.level);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const sorted = [...classes]
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const selectedClass = classes.find((c) => c.id === classId);

  const MAX_SUPPORTED_LEVEL = 2;

  // --- Level handler ---
  const handleLevelChange = useCallback((newLevel: number) => {
    if (newLevel < 1 || newLevel > MAX_SUPPORTED_LEVEL) return;
    if (newLevel === level) return;

    const state = useCharacterStore.getState();
    const patch: Partial<typeof state> = { level: newLevel };

    if (state.class) {
      const cls = classes.find((c) => c.id === state.class);
      if (cls) {
        const newFeatures: NormalizedFeature[] = [];
        for (const lvlBlock of cls.featuresByLevel) {
          if (lvlBlock.level <= newLevel) {
            for (const f of lvlBlock.features) {
              newFeatures.push({
                sourceType: "class",
                sourceId: cls.id,
                name: f.name,
                description: f.description,
                level: lvlBlock.level,
              });
            }
          }
        }
        patch.features = replaceFeatures(state.features, ["class"], newFeatures);

        if (cls.spellcasting) {
          const slotData = cls.spellcasting.spellSlotsByLevel[newLevel] ?? {};
          patch.spells = { ...state.spells, slots: Object.values(slotData) };
        }
      }
    }

    patchCharacter(patch);
  }, [level, patchCharacter]);

  // --- Validation ---
  const computeMissing = useCallback(() => {
    const missing: string[] = [];
    if (!classId) {
      missing.push("Escolher classe");
    } else {
      const cls = classes.find((c) => c.id === classId);
      if (cls) {
        // Cleric: Divine Order required
        if (classId === "clerigo" && !classFeatureChoices["clerigo:ordemDivina"]) {
          missing.push("Escolher Ordem Divina");
        }
        // Druid: Primal Order required
        if (classId === "druida" && !classFeatureChoices["druida:ordemPrimal"]) {
          missing.push("Escolher Ordem Primal");
        }
      }
    }
    return missing;
  }, [classId, classFeatureChoices]);

  useEffect(() => {
    const missing = computeMissing();
    setMissing("class", missing);
    if (missing.length === 0 && classId) {
      completeStep("class");
    } else {
      uncompleteStep("class");
    }
  }, [classId, classFeatureChoices]);

  // --- Select class ---
  const handleSelect = (id: string) => {
    if (id === classId) return;

    const cls = classes.find((c) => c.id === id)!;
    const state = useCharacterStore.getState();

    // Build features up to current level
    const currentLevel = state.level;
    const newFeatures: NormalizedFeature[] = [];
    for (const lvlBlock of cls.featuresByLevel) {
      if (lvlBlock.level <= currentLevel) {
        for (const f of lvlBlock.features) {
          newFeatures.push({
            sourceType: "class" as const,
            sourceId: cls.id,
            name: f.name,
            description: f.description,
            level: lvlBlock.level,
          });
        }
      }
    }

    // Remove old class/subclass features, add new
    const features = replaceFeatures(state.features, ["class", "subclass"], newFeatures);

    // Spells setup
    const spells = cls.spellcasting
      ? {
          cantrips: [],
          prepared: [],
          slots: Object.values(cls.spellcasting.spellSlotsByLevel[currentLevel] ?? {}),
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

    // Set class-specific flags for engine overrides
    const classFlags: Record<string, number | boolean> = {
      ...state.flags,
      unarmoredDefenseBarbarian: id === "barbaro",
      unarmoredDefenseMonk: id === "monge",
      draconicResilience: false, // reset on class change; set by subclass
    };

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
      flags: classFlags,
      classFeatureChoices: {},
      expertiseSkills: [],
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
  const [pendingSubclassSwap, setPendingSubclassSwap] = useState<string | null>(null);

  const applySubclass = (subId: string) => {
    if (!selectedClass) return;
    const sub = selectedClass.subclasses.find((s) => s.id === subId);
    if (!sub) return;

    const state = useCharacterStore.getState();
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

    // Set subclass-specific flags
    const subclassFlags: Record<string, number | boolean> = {
      ...state.flags,
      draconicResilience: subId === "linhagemDraconica",
    };

    patchCharacter({ subclass: subId, features, flags: subclassFlags });
  };

  const handleSubclass = (subId: string) => {
    if (!selectedClass) return;
    // If already has a subclass and trying to change, show confirmation
    if (subclassId && subclassId !== subId) {
      setPendingSubclassSwap(subId);
      return;
    }
    applySubclass(subId);
  };

  const confirmSubclassSwap = () => {
    if (pendingSubclassSwap) {
      applySubclass(pendingSubclassSwap);
      setPendingSubclassSwap(null);
    }
  };

  const toggleFeature = (name: string) => {
    setExpandedFeatures((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="flex gap-0 h-full">
      {/* Left - Class list */}
      <div className="w-72 shrink-0 border-r p-4 overflow-y-auto">
        {/* Level Selector */}
        <section className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Nível Inicial
          </h3>
          <div className="inline-flex rounded-lg border bg-card p-1 gap-1 w-full">
            {[1, 2].map((lvl) => (
              <button
                key={lvl}
                onClick={() => handleLevelChange(lvl)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  level === lvl
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Nível {lvl}
              </button>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  disabled
                  className="flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/40 cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Lock className="h-3 w-3" />
                  3–20
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Em breve</p></TooltipContent>
            </Tooltip>
          </div>
        </section>

        <h2 className="mb-3 text-lg font-bold">1. Escolha sua Classe</h2>
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
            classFeatureChoices={classFeatureChoices}
            subclassId={subclassId}
            level={level}
            expandedFeatures={expandedFeatures}
            onToggleSkill={handleToggleSkill}
            onSelectSubclass={handleSubclass}
            onToggleFeature={toggleFeature}
            onSetFeatureChoice={(key, value) => {
              const state = useCharacterStore.getState();
              const newChoices = { ...state.classFeatureChoices, [key]: value };

              // Apply Cleric Protetor proficiencies
              if (key === "clerigo:ordemDivina") {
                const baseCls = classes.find((c) => c.id === "clerigo")!;
                let armor = [...baseCls.proficiencies.armor];
                let weapons = [...baseCls.proficiencies.weapons];
                if (value === "protetor") {
                  armor = mergeUnique(armor, ["Armaduras Pesadas"]);
                  weapons = mergeUnique(weapons, ["Armas Marciais"]);
                }
                patchCharacter({
                  classFeatureChoices: newChoices,
                  proficiencies: { ...state.proficiencies, armor, weapons },
                });
                return;
              }

              // Apply Druid Protetor proficiencies
              if (key === "druida:ordemPrimal") {
                const baseCls = classes.find((c) => c.id === "druida")!;
                let armor = [...baseCls.proficiencies.armor];
                let weapons = [...baseCls.proficiencies.weapons];
                if (value === "protetor") {
                  armor = mergeUnique(armor, ["Armaduras Médias"]);
                  weapons = mergeUnique(weapons, ["Armas Marciais"]);
                }
                patchCharacter({
                  classFeatureChoices: newChoices,
                  proficiencies: { ...state.proficiencies, armor, weapons },
                });
                return;
              }

              patchCharacter({ classFeatureChoices: newChoices });
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Selecione uma classe na lista ao lado.</p>
          </div>
        )}
      </div>

      {/* Subclass swap confirmation */}
      <AlertDialog open={!!pendingSubclassSwap} onOpenChange={() => setPendingSubclassSwap(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Trocar Subclasse?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Trocar de subclasse removerá todas as características da subclasse anterior e pode invalidar escolhas feitas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubclassSwap}>Confirmar Troca</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Detail Panel ───

interface ClassDetailsProps {
  cls: ClassData;
  classSkillChoices: string[];
  classEquipmentChoice: string | null;
  classFeatureChoices: Record<string, string | string[]>;
  subclassId: string | null;
  level: number;
  expandedFeatures: Record<string, boolean>;
  onToggleSkill: (skill: string) => void;
  onSelectSubclass: (id: string) => void;
  onToggleFeature: (name: string) => void;
  onSetFeatureChoice: (key: string, value: string) => void;
}

function ClassDetails({
  cls,
  classSkillChoices,
  classEquipmentChoice,
  classFeatureChoices,
  subclassId,
  level,
  expandedFeatures,
  onToggleSkill,
  onSelectSubclass,
  onToggleFeature,
  onSetFeatureChoice,
}: ClassDetailsProps) {
  const isSpellcaster = cls.spellcasting !== null;
  const avgHitPointsPerLevel = Math.floor(cls.hitDie / 2) + 1;

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
              <span className="text-muted-foreground">Pontos de Vida no Nível 1:</span>{" "}
              {cls.hitDie} + modificador de Constituição
            </div>
            <div>
              <span className="text-muted-foreground">Pontos de Vida por Nível:</span>{" "}
              d{cls.hitDie} + modificador de Constituição, ou, {avgHitPointsPerLevel} + modificador de Constituição
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

        {/* Equipment preview (selection happens in step 5: Equipamentos) */}
        <Section title="Equipamento Inicial">
          <p className="text-sm text-muted-foreground">
            Você escolherá seu equipamento inicial na etapa <span className="font-medium">5. Equipamentos</span>.
          </p>
          <div className="mt-3 space-y-2">
            {cls.equipmentChoices.map((choice) => (
              <div key={choice.id} className="w-full rounded-lg border p-4 bg-secondary/40">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{choice.label}</span>
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
              </div>
            ))}
          </div>
        </Section>

        {/* ── Cleric: Divine Order ── */}
        {cls.id === "clerigo" && (
          <Section
            title="Ordem Divina (Nível 1)"
            badge={!classFeatureChoices["clerigo:ordemDivina"] ? <RequiredBadge label="Obrigatório" /> : null}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Escolha sua Ordem Divina. Isso determina proficiências extras e habilidades.
            </p>
            <div className="space-y-2">
              {[
                { id: "protetor", name: "Protetor", desc: "Proficiência com armaduras pesadas e armas marciais." },
                { id: "taumaturgo", name: "Taumaturgo", desc: "+1 truque de clérigo. Bônus em Arcanismo e Religião (= max(mod. SAB, +1))." },
              ].map((opt) => {
                const selected = classFeatureChoices["clerigo:ordemDivina"] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSetFeatureChoice("clerigo:ordemDivina", opt.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{opt.name}</span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Druid: Primal Order ── */}
        {cls.id === "druida" && (
          <Section
            title="Ordem Primal (Nível 1)"
            badge={!classFeatureChoices["druida:ordemPrimal"] ? <RequiredBadge label="Obrigatório" /> : null}
          >
            <p className="text-sm text-muted-foreground mb-3">
              Escolha sua Ordem Primal. Isso determina proficiências extras e habilidades.
            </p>
            <div className="space-y-2">
              {[
                { id: "protetor", name: "Protetor", desc: "Proficiência com armaduras médias e armas marciais." },
                { id: "xama", name: "Xamã", desc: "+1 truque de druida. Bônus em Arcanismo e Natureza (= max(mod. SAB, +1))." },
              ].map((opt) => {
                const selected = classFeatureChoices["druida:ordemPrimal"] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onSetFeatureChoice("druida:ordemPrimal", opt.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selected ? "border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{opt.name}</span>
                      {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Class features grouped by level */}
        {cls.featuresByLevel
          .filter((fl) => fl.level <= level)
          .sort((a, b) => a.level - b.level)
          .map((fl) => (
            <Section key={fl.level} title={`Características (Nível ${fl.level})`}>
              {fl.features.map((f) => {
                const key = `${fl.level}-${f.name}`;
                const isOpen = expandedFeatures[key] ?? true;
                return (
                  <div key={key} className="mb-2 rounded-md border bg-secondary/40">
                    <button
                      onClick={() => onToggleFeature(key)}
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
          ))}

        {level >= 2 && (
          <p className="text-xs text-muted-foreground italic mt-1 mb-4">
            Você começará com as características dos níveis 1 e {level}.
          </p>
        )}

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
                <span className="text-muted-foreground">Truques no Nível {level}:</span>{" "}
                {(() => {
                  const entries = Object.entries(cls.spellcasting!.cantripsKnownAtLevel)
                    .map(([l, c]) => [Number(l), c] as [number, number])
                    .sort((a, b) => a[0] - b[0]);
                  let limit = 0;
                  for (const [l, c] of entries) { if (level >= l) limit = c; }
                  return limit;
                })()}
              </div>
              <div>
                <span className="text-muted-foreground">Magias preparadas:</span>{" "}
                {cls.spellcasting.spellsPreparedFormula}
              </div>
              {cls.spellcasting.spellSlotsByLevel[level] && (
                <div>
                  <span className="text-muted-foreground">Espaços (Nível {level}):</span>{" "}
                  {Object.entries(cls.spellcasting.spellSlotsByLevel[level])
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
        <SubclassSection
          cls={cls}
          subclassId={subclassId}
          level={level}
          onSelectSubclass={onSelectSubclass}
        />
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

// ─── Subclass Section ───

function SubclassSection({
  cls,
  subclassId,
  level,
  onSelectSubclass,
}: {
  cls: ClassData;
  subclassId: string | null;
  level: number;
  onSelectSubclass: (id: string) => void;
}) {
  const [expandedSubclass, setExpandedSubclass] = useState<string | null>(subclassId);

  const subclassLevel = cls.subclassLevel;
  const hasSubclasses = cls.subclasses.length > 0;
  const isUnlocked = subclassLevel != null && level >= subclassLevel;
  const isRequired = isUnlocked && hasSubclasses && !subclassId;

  if (!hasSubclasses) return null;

  return (
    <Section
      title="Subclasse"
      badge={
        isRequired ? (
          <RequiredBadge label="Obrigatório" />
        ) : !isUnlocked && subclassLevel ? (
          <span className="text-[10px] text-muted-foreground italic">Nível {subclassLevel}</span>
        ) : null
      }
    >
      {!isUnlocked ? (
        subclassLevel ? (
          <p className="text-sm text-muted-foreground italic">
            Você escolherá sua subclasse no nível {subclassLevel}.
          </p>
        ) : (
          <p className="text-sm text-warning italic flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            subclassLevel não definido nos dados desta classe. Seleção indisponível.
          </p>
        )
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Escolha uma subclasse para {cls.name}:
          </p>
          <div className="space-y-2">
            {[...cls.subclasses]
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((sc) => {
                const isSel = subclassId === sc.id;
                const isExpanded = expandedSubclass === sc.id;
                return (
                  <div key={sc.id} className={`rounded-lg border transition-colors ${
                    isSel ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"
                  }`}>
                    <button
                      onClick={() => {
                        onSelectSubclass(sc.id);
                        setExpandedSubclass(sc.id);
                      }}
                      className="w-full p-3 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{sc.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSel && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              Selecionado
                            </span>
                          )}
                          <CheckCircle2 className={`h-4 w-4 ${isSel ? "text-primary" : "text-transparent"}`} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{sc.description}</p>
                    </button>

                    {/* Toggle details */}
                    <button
                      onClick={() => setExpandedSubclass(isExpanded ? null : sc.id)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground border-t transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? "Ocultar detalhes" : "Ver características"}
                    </button>

                    {/* Features by level */}
                    {isExpanded && sc.featuresByLevel.length > 0 && (
                      <div className="px-3 pb-3 space-y-2">
                        {sc.featuresByLevel
                          .sort((a, b) => a.level - b.level)
                          .map((fl) => (
                            <div key={fl.level}>
                              <p className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
                                Nível {fl.level}
                                {fl.level > level && (
                                  <span className="ml-1 text-muted-foreground/50">(bloqueado)</span>
                                )}
                              </p>
                              {fl.features.map((f) => (
                                <div key={f.name} className={`rounded-md p-2 mb-1 ${
                                  fl.level <= level ? "bg-secondary/60" : "bg-secondary/20 opacity-60"
                                }`}>
                                  <p className="text-xs font-medium">{f.name}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{f.description}</p>
                                </div>
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </Section>
  );
}
