import { memo, useMemo, useState } from "react";
import {
  Info, CheckCircle2, Wand2, Swords, Coins, Package,
  Activity, AlertTriangle,
} from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import type { CharacterState, NormalizedFeature } from "@/state/characterStore";
import type { AttackEntry } from "@/data/items";
import type { StepDef, StepId } from "@/state/builderStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { spells as spellsData } from "@/data/spells";
import { itemsById } from "@/data/items";
import {
  ABILITY_LABELS, ABILITY_SHORT, ABILITIES, calcAbilityMod, getFinalAbilityScores,
  ALL_SKILLS, type AbilityKey,
} from "@/utils/calculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SummaryPanel() {
  const [activeTab, setActiveTab] = useState("stats");

  const name = useCharacterStore((s) => s.name);
  const level = useCharacterStore((s) => s.level);
  const raceId = useCharacterStore((s) => s.race);
  const subraceId = useCharacterStore((s) => s.subrace);
  const classId = useCharacterStore((s) => s.class);
  const backgroundId = useCharacterStore((s) => s.background);

  const armorClass = useCharacterStore((s) => s.armorClass);
  const hitPointsMax = useCharacterStore((s) => s.hitPoints.max);
  const speed = useCharacterStore((s) => s.speed);
  const proficiencyBonus = useCharacterStore((s) => s.proficiencyBonus);

  const abilityScores = useCharacterStore((s) => s.abilityScores);
  const racialBonuses = useCharacterStore((s) => s.racialBonuses);
  const backgroundBonuses = useCharacterStore((s) => s.backgroundBonuses);
  const asiBonuses = useCharacterStore((s) => s.asiBonuses);
  const featAbilityBonuses = useCharacterStore((s) => s.featAbilityBonuses);

  const savingThrows = useCharacterStore((s) => s.savingThrows);
  const skills = useCharacterStore((s) => s.skills);
  const languages = useCharacterStore((s) => s.proficiencies.languages);

  const attacks = useCharacterStore((s) => s.attacks);
  const features = useCharacterStore((s) => s.features);

  const spellsState = useCharacterStore((s) => s.spells);

  const goldGp = useCharacterStore((s) => s.gold?.gp ?? 0);
  const equippedArmor = useCharacterStore((s) => s.equipped.armor);
  const equippedShield = useCharacterStore((s) => s.equipped.shield);
  const equippedWeapons = useCharacterStore((s) => s.equipped.weapons);
  const inventory = useCharacterStore((s) => s.inventory);

  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const visibleSteps = useBuilderStore((s) => s.visibleSteps);
  const goToStep = useBuilderStore((s) => s.goToStep);

  const race = useMemo(() => races.find((r) => r.id === raceId), [raceId]);
  const subrace = useMemo(() => race?.subraces.find((sr) => sr.id === subraceId), [race, subraceId]);
  const cls = useMemo(() => classes.find((c) => c.id === classId), [classId]);
  const bg = useMemo(() => backgrounds.find((b) => b.id === backgroundId), [backgroundId]);

  const isSpellcaster = cls?.spellcasting !== null;

  const finalScores = useMemo(
    () => getFinalAbilityScores(abilityScores, racialBonuses, backgroundBonuses, asiBonuses, featAbilityBonuses),
    [abilityScores, racialBonuses, backgroundBonuses, asiBonuses, featAbilityBonuses]
  );

  return (
    <aside className="w-full xl:w-72 shrink-0 border-l flex flex-col overflow-hidden">
      <div className="border-b bg-card p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Identidade</p>
            <p className="truncate text-sm font-bold" aria-label="Nome do personagem">
              {name?.trim() || "Sem nome"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const target = document.getElementById("character-name") as HTMLInputElement | null;
              if (target) {
                target.focus();
                target.select();
              }
            }}
            className="shrink-0 text-[11px] font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="Editar identidade no topo da página"
          >
            Editar identidade
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Edição disponível no cabeçalho superior para manter o foco e a navegação por etapas consistentes.
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {race && <MiniTag>{race.name}{subrace ? ` (${subrace.name})` : ""}</MiniTag>}
          {cls && <MiniTag>{cls.name} {level}</MiniTag>}
          {bg && <MiniTag>{bg.name}</MiniTag>}
          {!race && !cls && <span className="text-[11px] text-muted-foreground italic">Nenhuma escolha feita</span>}
        </div>
      </div>

      <div className="grid grid-cols-4 border-b bg-secondary/30">
        <StatMini label="CA" value={String(armorClass)} />
        <StatMini label="PV" value={String(hitPointsMax)} />
        <StatMini label="Desl." value={`${speed}m`} />
        <StatMini label="Prof." value={`+${proficiencyBonus}`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="h-9 w-full rounded-none border-b bg-transparent p-0 justify-start gap-0">
          <TabsTrigger value="stats" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-9 px-3">
            <Activity className="h-3.5 w-3.5 mr-1" />Stats
          </TabsTrigger>
          <TabsTrigger value="actions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-9 px-3">
            <Swords className="h-3.5 w-3.5 mr-1" />Ações
          </TabsTrigger>
          {isSpellcaster && (
            <TabsTrigger value="spells" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-9 px-3">
              <Wand2 className="h-3.5 w-3.5 mr-1" />Magias
            </TabsTrigger>
          )}
          <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-xs h-9 px-3">
            <Package className="h-3.5 w-3.5 mr-1" />Inv.
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="stats" className="m-0 p-3 space-y-3">
            <StatsTab
              finalScores={finalScores}
              proficiencyBonus={proficiencyBonus}
              savingThrows={savingThrows}
              skills={skills}
              languages={languages}
              visibleSteps={visibleSteps}
              completedSteps={completedSteps}
              requiredMissing={requiredMissing}
              goToStep={goToStep}
            />
          </TabsContent>

          <TabsContent value="actions" className="m-0 p-3 space-y-3">
            <ActionsTab attacks={attacks} features={features} />
          </TabsContent>

          {isSpellcaster && (
            <TabsContent value="spells" className="m-0 p-3 space-y-3">
              <SpellsTab
                spells={spellsState}
                spellcastingAbility={cls?.spellcasting?.ability}
                spellcastingType={cls?.spellcasting?.type}
              />
            </TabsContent>
          )}

          <TabsContent value="inventory" className="m-0 p-3 space-y-3">
            <InventoryTab
              goldGp={goldGp}
              equippedArmor={equippedArmor}
              equippedShield={equippedShield}
              equippedWeapons={equippedWeapons}
              inventory={inventory}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}

const StatsTab = memo(function StatsTab({
  finalScores,
  proficiencyBonus,
  savingThrows,
  skills,
  languages,
  visibleSteps,
  completedSteps,
  requiredMissing,
  goToStep,
}: {
  finalScores: Record<AbilityKey, number>;
  proficiencyBonus: number;
  savingThrows: string[];
  skills: string[];
  languages: string[];
  visibleSteps: StepDef[];
  completedSteps: StepId[];
  requiredMissing: Record<string, string[]>;
  goToStep: (step: StepId) => void;
}) {
  const sortedLanguages = useMemo(
    () => [...languages].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [languages]
  );

  const savesData = useMemo(
    () => ABILITIES.map((a) => {
      const mod = calcAbilityMod(finalScores[a]);
      const prof = savingThrows.some(
        (st) => st.toLowerCase().startsWith(ABILITY_LABELS[a].toLowerCase().substring(0, 3))
      );
      const total = mod + (prof ? proficiencyBonus : 0);
      return { a, prof, total };
    }),
    [finalScores, savingThrows, proficiencyBonus]
  );

  const skillsData = useMemo(
    () => ALL_SKILLS.map((skill) => {
      const mod = calcAbilityMod(finalScores[skill.ability]);
      const prof = skills.includes(skill.name);
      const total = mod + (prof ? proficiencyBonus : 0);
      return { skill, prof, total };
    }),
    [finalScores, skills, proficiencyBonus]
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {ABILITIES.map((a) => {
          const total = finalScores[a];
          const mod = calcAbilityMod(total);
          return (
            <div key={a} className="rounded-lg border bg-secondary/30 p-1.5 text-center">
              <p className="text-[10px] uppercase text-muted-foreground font-semibold">{ABILITY_SHORT[a]}</p>
              <p className="text-lg font-bold leading-none mt-1">{total}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{mod >= 0 ? "+" : ""}{mod}</p>
            </div>
          );
        })}
      </div>

      <PanelSection title="Testes de Resistência">
        <div className="space-y-0.5">
          {savesData.map(({ a, prof, total }) => (
            <div key={a} className={`flex items-center gap-1 text-[11px] py-0.5 ${prof ? "text-foreground" : "text-muted-foreground/70"}`}>
              {prof ? (
                <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
              ) : (
                <span className="h-3 w-3 rounded-full border border-muted-foreground/30 shrink-0" />
              )}
              <span className="flex-1">{ABILITY_SHORT[a]}</span>
              <span className={`font-mono font-bold text-[11px] ${prof ? "text-primary" : ""}`}>
                {total >= 0 ? "+" : ""}{total}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Perícias">
        <div className="space-y-0.5">
          {skillsData.map(({ skill, prof, total }) => (
            <div key={skill.name} className={`flex items-center gap-1.5 text-[11px] py-0.5 ${prof ? "text-foreground" : "text-muted-foreground/60"}`}>
              {prof ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-success shrink-0" />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full border border-muted-foreground/20 shrink-0" />
              )}
              <span className="flex-1 truncate">{skill.name}</span>
              <span className="text-[11px] text-muted-foreground/70 mr-1 font-medium">{ABILITY_SHORT[skill.ability]}</span>
              <span className={`font-mono font-bold text-[11px] w-5 text-right ${prof ? "" : "text-muted-foreground/40"}`}>
                {total >= 0 ? "+" : ""}{total}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>

      {sortedLanguages.length > 0 && (
        <PanelSection title="Idiomas">
          <div className="flex flex-wrap gap-1">
            {sortedLanguages.map((l) => (
              <span key={l} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium">{l}</span>
            ))}
          </div>
        </PanelSection>
      )}

      <PanelSection title="Pendências">
        <ul className="space-y-1">
          {visibleSteps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            const missing = requiredMissing[step.id] ?? [];
            return (
              <li key={step.id}>
                <button
                  onClick={() => goToStep(step.id)}
                  className="flex items-start gap-1.5 w-full text-left hover:bg-secondary/50 rounded px-1 py-0.5 transition-colors"
                  aria-label={`Ir para ${step.label}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  ) : (
                    <Info className="h-3 w-3 text-info mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className={`text-xs font-medium ${isDone ? "text-success" : "text-info"}`}>
                      {step.num}. {step.label}
                    </span>
                    {!isDone && missing.length > 0 && (
                      <p className="text-[11px] text-muted-foreground/90 truncate">
                        {missing[0]}
                        {missing.length > 1 && ` (+${missing.length - 1})`}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </PanelSection>
    </>
  );
});

const ActionsTab = memo(function ActionsTab({ attacks, features }: { attacks: AttackEntry[]; features: NormalizedFeature[] }) {
  return (
    <>
      {attacks.length > 0 ? (
        <div className="space-y-2">
          {attacks.map((atk) => (
            <div key={atk.weaponId} className="rounded-lg border bg-secondary/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{atk.name}</span>
                {!atk.proficient && (
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    </TooltipTrigger>
                    <TooltipContent>Não proficiente</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1.5 text-center">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground font-semibold">Ataque</p>
                  <p className="text-sm font-bold text-primary">{atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground font-semibold">Dano</p>
                  <p className="text-xs font-medium">{atk.damage.split(" (")[0]}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground font-semibold">Alcance</p>
                  <p className="text-xs text-muted-foreground">{atk.range}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Equipe armas para ver ataques" />
      )}

      {features.length > 0 && (
        <PanelSection title="Características">
          <div className="space-y-1">
            {features.slice(0, 10).map((f, i) => (
              <Tooltip key={`${f.sourceId}-${f.name}-${i}`}>
                <TooltipTrigger asChild>
                  <div className="text-xs py-0.5 cursor-help">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-[11px] text-muted-foreground ml-1">({f.sourceType})</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <p className="text-xs">{f.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {features.length > 10 && <p className="text-[11px] text-muted-foreground">+{features.length - 10} mais</p>}
          </div>
        </PanelSection>
      )}
    </>
  );
});

const SpellsTab = memo(function SpellsTab({
  spells,
  spellcastingAbility,
  spellcastingType,
}: {
  spells: CharacterState["spells"];
  spellcastingAbility?: string;
  spellcastingType?: string;
}) {
  const cantripsDisplay = useMemo(
    () => spells.cantrips.map((id) => ({ id, name: spellsData.find((s) => s.id === id)?.name ?? id })),
    [spells.cantrips]
  );

  const preparedDisplay = useMemo(
    () => spells.prepared.map((id) => ({ id, spell: spellsData.find((s) => s.id === id) })),
    [spells.prepared]
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border bg-secondary/30 p-2 text-center">
          <p className="text-[11px] uppercase text-muted-foreground font-semibold">CD</p>
          <p className="text-lg font-bold">{spells.spellSaveDC}</p>
        </div>
        <div className="rounded-lg border bg-secondary/30 p-2 text-center">
          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Ataque</p>
          <p className="text-lg font-bold">+{spells.spellAttackBonus}</p>
        </div>
        <div className="rounded-lg border bg-secondary/30 p-2 text-center">
          <p className="text-[11px] uppercase text-muted-foreground font-semibold">Atributo</p>
          <p className="text-sm font-bold">{spellcastingAbility?.substring(0, 3) ?? "—"}</p>
        </div>
      </div>

      {spells.slots.length > 0 && (
        <PanelSection title="Espaços de Magia">
          <div className="flex flex-wrap gap-1.5">
            {spells.slots.map((count, i) => count > 0 && (
              <div key={i} className="rounded border bg-secondary/30 px-2 py-1 text-center min-w-[40px]">
                <p className="text-[11px] uppercase text-muted-foreground font-semibold">{i + 1}º</p>
                <p className="text-sm font-bold">{count}</p>
              </div>
            ))}
          </div>
        </PanelSection>
      )}

      {cantripsDisplay.length > 0 && (
        <PanelSection title={`Truques (${cantripsDisplay.length})`}>
          <div className="flex flex-wrap gap-1">
            {cantripsDisplay.map((sp) => (
              <span key={sp.id} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{sp.name}</span>
            ))}
          </div>
        </PanelSection>
      )}

      {preparedDisplay.length > 0 && (
        <PanelSection title={`${spellcastingType === "known" || spellcastingType === "pact" ? "Conhecidas" : "Preparadas"} (${preparedDisplay.length})`}>
          <div className="flex flex-wrap gap-1">
            {preparedDisplay.map(({ id, spell: sp }) => (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium cursor-help">{sp?.name ?? id}</span>
                </TooltipTrigger>
                {sp && (
                  <TooltipContent side="left" className="max-w-[250px]">
                    <p className="font-medium text-xs">{sp.name}</p>
                    <p className="text-[11px] text-muted-foreground">{sp.school} • {sp.level === 0 ? "Truque" : `${sp.level}º Círculo`}</p>
                    <p className="text-[11px] mt-1 leading-relaxed">{sp.description.substring(0, 120)}...</p>
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </PanelSection>
      )}
    </>
  );
});

const InventoryTab = memo(function InventoryTab({
  goldGp,
  equippedArmor,
  equippedShield,
  equippedWeapons,
  inventory,
}: {
  goldGp: number;
  equippedArmor: string | null;
  equippedShield: string | null;
  equippedWeapons: string[];
  inventory: { itemId: string; quantity: number; notes?: string }[];
}) {
  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-2.5">
        <div className="flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium">Ouro</span>
        </div>
        <span className="text-sm font-bold text-warning">{goldGp} PO</span>
      </div>

      {(equippedArmor || equippedShield) && (
        <PanelSection title="Equipado">
          <div className="space-y-1 text-xs">
            {equippedArmor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Armadura</span>
                <span className="font-medium">{itemsById[equippedArmor]?.name ?? equippedArmor}</span>
              </div>
            )}
            {equippedShield && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escudo</span>
                <span className="font-medium">{itemsById[equippedShield]?.name ?? equippedShield}</span>
              </div>
            )}
            {equippedWeapons.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Armas</span>
                <span className="font-medium text-right">{equippedWeapons.map((w) => itemsById[w]?.name ?? w).join(", ")}</span>
              </div>
            )}
          </div>
        </PanelSection>
      )}

      {inventory.length > 0 ? (
        <PanelSection title={`Itens (${inventory.length})`}>
          <div className="space-y-0.5">
            {inventory.map((entry) => {
              const item = itemsById[entry.itemId];
              return (
                <div key={entry.itemId} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="truncate">{item?.name ?? entry.notes ?? entry.itemId}</span>
                  {entry.quantity > 1 && <span className="text-muted-foreground shrink-0 ml-1">×{entry.quantity}</span>}
                </div>
              );
            })}
          </div>
        </PanelSection>
      ) : (
        <EmptyState text="Inventário vazio" />
      )}
    </>
  );
});

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center py-1.5 border-r last:border-r-0">
      <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium">{children}</span>;
}

function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase text-muted-foreground font-semibold tracking-wider mb-1.5">{title}</p>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-secondary/10 py-6 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
