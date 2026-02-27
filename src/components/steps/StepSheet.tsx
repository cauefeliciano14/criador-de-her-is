import { useState, useMemo } from "react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { races } from "@/data/races";
import { backgrounds } from "@/data/backgrounds";
import { itemsById } from "@/data/items";
import { validateCharacterCompleteness } from "@/utils/validation";
import {
  ABILITY_LABELS, ABILITY_SHORT, ABILITIES, calcAbilityMod,
  getFinalAbilityScores, type AbilityKey,
} from "@/utils/calculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Star, Wand2, Shield, Scroll, AlertCircle, CheckCircle2, ArrowUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StepReview } from "./StepReview";
import { StepSkills } from "./StepSkills";
import { StepSpells } from "./StepSpells";
import { LevelUpModal } from "@/components/LevelUpModal";
import { useEffect } from "react";

export function StepSheet() {
  const char = useCharacterStore();
  const builder = useBuilderStore();
  const classId = useCharacterStore((s) => s.class);
  const cls = classes.find((c) => c.id === classId);
  const isSpellcaster = cls?.spellcasting != null;

  const [activeTab, setActiveTab] = useState("resumo");
  const [showLevelUp, setShowLevelUp] = useState(false);

  const canLevelUp = cls && char.level < 20;

  // Validation drives step completion for "sheet"
  const validation = useMemo(
    () => validateCharacterCompleteness(char),
    [
      char.race, char.subrace, char.class, char.background,
      char.abilityGeneration.confirmed, char.abilityGeneration.method,
      char.classSkillChoices, char.classEquipmentChoice,
      char.spells.cantrips, char.spells.prepared, char.spells.spellcastingAbility,
      char.raceAbilityChoices, char.backgroundAbilityChoices,
      char.inventory, char.equipped, char.features,
      char.classFeatureChoices, char.level,
    ]
  );

  const missingKey = useMemo(
    () => validation.missing.map((m) => m.id).join("|"),
    [validation.missing]
  );

  useEffect(() => {
    if (validation.isComplete) {
      builder.completeStep("sheet");
      builder.setMissing("sheet", []);
    } else {
      builder.uncompleteStep("sheet");
      builder.setMissing(
        "sheet",
        validation.missing.map((m) => m.label)
      );
    }
  }, [validation.isComplete, missingKey]);

  return (
    <div className="flex flex-col h-full">
      {/* Progressão de Nível Card */}
      <div className="border-b bg-card px-6 pt-4 pb-4">
        <div className="rounded-lg border bg-secondary/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Progressão de Nível</h3>
            <span className="text-sm text-muted-foreground">Nível Atual: {char.level}</span>
          </div>
          {canLevelUp && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowLevelUp(true)}
                className="w-full"
                size="sm"
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Subir para Nível {char.level + 1}
              </Button>
              <p className="text-xs text-muted-foreground">
                Ao subir de nível, você ganha PV, magias e características de classe.
              </p>
            </div>
          )}
          {!canLevelUp && (
            <p className="text-xs text-muted-foreground">Nível máximo alcançado (20).</p>
          )}
        </div>
      </div>

      <div className="border-b bg-card px-6 pt-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">6. Ficha</h2>
          {validation.isComplete ? (
            <Badge className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ficha Completa
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <AlertCircle className="h-3 w-3" /> {validation.missing.length} pendência(s)
            </Badge>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          <TabButton active={activeTab === "resumo"} onClick={() => setActiveTab("resumo")} icon={<BookOpen className="h-3.5 w-3.5" />} label="Resumo" />
          <TabButton active={activeTab === "pericias"} onClick={() => setActiveTab("pericias")} icon={<Star className="h-3.5 w-3.5" />} label="Perícias" />
          {isSpellcaster && (
            <TabButton active={activeTab === "magias"} onClick={() => setActiveTab("magias")} icon={<Wand2 className="h-3.5 w-3.5" />} label="Magias" />
          )}
          <TabButton active={activeTab === "equipamentos"} onClick={() => setActiveTab("equipamentos")} icon={<Shield className="h-3.5 w-3.5" />} label="Equipamentos" />
          <TabButton active={activeTab === "caracteristicas"} onClick={() => setActiveTab("caracteristicas")} icon={<Scroll className="h-3.5 w-3.5" />} label="Características" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeTab === "resumo" && <StepReview />}
        {activeTab === "pericias" && <StepSkills />}
        {activeTab === "magias" && isSpellcaster && <StepSpells />}
        {activeTab === "equipamentos" && <EquipmentSummaryTab />}
        {activeTab === "caracteristicas" && <FeaturesTab />}
      </div>
      {showLevelUp && <LevelUpModal onClose={() => setShowLevelUp(false)} />}
    </div>
  );
}

// ── Tab Button ──
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Equipment Summary Tab ──
function EquipmentSummaryTab() {
  const char = useCharacterStore();
  const cls = classes.find((c) => c.id === char.class);

  const equippedArmor = char.equipped?.armor ? itemsById[char.equipped.armor] : null;
  const equippedShield = char.equipped?.shield ? itemsById[char.equipped.shield] : null;
  const equippedWeapons = (char.equipped?.weapons ?? []).map((wId) => itemsById[wId]).filter(Boolean);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h3 className="text-lg font-bold">Equipamento</h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">CA</p>
          <p className="text-2xl font-bold">{char.armorClass}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Armadura</p>
          <p className="text-sm font-medium">{equippedArmor?.name ?? "Nenhuma"}</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-[10px] uppercase text-muted-foreground">Escudo</p>
          <p className="text-sm font-medium">{equippedShield?.name ?? "Nenhum"}</p>
        </div>
      </div>

      {/* Weapons */}
      {equippedWeapons.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Armas Equipadas</h4>
          <div className="space-y-1">
            {equippedWeapons.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded border bg-secondary/30 px-3 py-2 text-sm">
                <span className="font-medium">{w.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attacks */}
      {char.attacks.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Ataques</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Nome</th>
                  <th className="px-3 py-2 text-center font-medium">Acerto</th>
                  <th className="px-3 py-2 text-center font-medium">Dano</th>
                </tr>
              </thead>
              <tbody>
                {char.attacks.map((atk, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{atk.name}</td>
                    <td className="px-3 py-2 text-center font-mono">{atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus}</td>
                    <td className="px-3 py-2 text-center font-mono">{atk.damage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div>
        <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Inventário ({char.inventory.length} itens)</h4>
        {char.inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inventário vazio.</p>
        ) : (
          <div className="space-y-1">
            {char.inventory.map((entry) => {
              const item = itemsById[entry.itemId];
              return (
                <div key={entry.itemId} className="flex items-center justify-between rounded border bg-secondary/20 px-3 py-1.5 text-sm">
                  <span>{item?.name ?? entry.itemId}</span>
                  <span className="text-muted-foreground">×{entry.quantity}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gold */}
      <div className="rounded-lg border bg-card p-3 flex items-center gap-2">
        <span className="text-sm font-medium">Ouro:</span>
        <span className="text-lg font-bold">{typeof char.gold === "object" ? (char.gold as any).gp : char.gold} PO</span>
      </div>
    </div>
  );
}

// ── Features Tab ──
function FeaturesTab() {
  const char = useCharacterStore();
  const cls = classes.find((c) => c.id === char.class);
  const race = races.find((r) => r.id === char.race);
  const bg = backgrounds.find((b) => b.id === char.background);

  const SOURCE_LABELS: Record<string, string> = {
    race: race?.name ?? "Raça",
    subrace: "Sub-raça",
    class: cls?.name ?? "Classe",
    subclass: "Subclasse",
    background: bg?.name ?? "Antecedente",
    other: "Outro",
  };

  // Group features by source
  const grouped = useMemo(() => {
    const map: Record<string, typeof char.features> = {};
    for (const f of char.features) {
      const key = f.sourceType;
      if (!map[key]) map[key] = [];
      map[key].push(f);
    }
    return map;
  }, [char.features]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h3 className="text-lg font-bold">Características & Traços</h3>

      {char.features.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma característica registrada.</p>
      ) : (
        Object.entries(grouped).map(([sourceType, features]) => (
          <div key={sourceType}>
            <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-2">
              {SOURCE_LABELS[sourceType] ?? sourceType}
            </h4>
            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={`${f.name}-${i}`} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{f.name}</p>
                    {f.level && (
                      <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                        Nível {f.level}
                      </span>
                    )}
                    {f.tags?.includes("originFeat") && (
                      <span className="text-[10px] rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium">
                        Talento de Origem
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
