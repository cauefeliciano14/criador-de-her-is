import { Info, CheckCircle2, Star, Wand2, Shield, Swords, Coins } from "lucide-react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { spells as spellsData } from "@/data/spells";
import { itemsById } from "@/data/items";
import {
  ABILITY_SHORT,
  ABILITIES,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
} from "@/utils/calculations";

export function SummaryPanel() {
  const char = useCharacterStore();
  const completedSteps = useBuilderStore((s) => s.completedSteps);
  const requiredMissing = useBuilderStore((s) => s.requiredMissing);
  const getVisibleSteps = useBuilderStore((s) => s.getVisibleSteps);

  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting !== null;
  const visibleSteps = getVisibleSteps(isSpellcaster);

  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses);
  const hasRaceBonus = ABILITIES.some((a) => char.racialBonuses[a] !== 0);
  const hasBgBonus = ABILITIES.some((a) => char.backgroundBonuses[a] !== 0);
  const hasAnyBonus = hasRaceBonus || hasBgBonus;

  const originFeat = char.features.find((f) => f.sourceType === "background" && f.tags?.includes("originFeat"));

  // Equipment info
  const equippedArmorItem = char.equipped?.armor ? itemsById[char.equipped.armor] : null;
  const equippedShieldItem = char.equipped?.shield ? itemsById[char.equipped.shield] : null;

  return (
    <aside className="w-64 shrink-0 space-y-4 p-4 overflow-y-auto">
      {/* Character Summary */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Ficha Resumida
        </h2>
        <div className="space-y-2 text-sm">
          <Row label="Raça" value={race?.name} extra={subrace?.name} />
          <Row label="Classe" value={cls?.name} />
          <Row label="Antecedente" value={bg?.name} />
          <Divider />
          <Row label="PV" value={String(char.hitPoints.max)} />
          <Row label="CA" value={String(char.armorClass)} />
          <Row label="Desl." value={`${char.speed}m`} />
          <Row label="Prof." value={`+${char.proficiencyBonus}`} />
        </div>
      </div>

      {/* Ability Scores */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Atributos
        </h2>
        {hasAnyBonus && (
          <div className={`grid gap-1 mb-2 text-[9px] text-muted-foreground uppercase ${
            hasRaceBonus && hasBgBonus ? "grid-cols-5" : "grid-cols-4"
          }`}>
            <span></span>
            <span className="text-center">Base</span>
            {hasRaceBonus && <span className="text-center">Raça</span>}
            {hasBgBonus && <span className="text-center">Antec.</span>}
            <span className="text-center">Total</span>
          </div>
        )}
        <div className="space-y-1.5">
          {ABILITIES.map((a) => {
            const base = char.abilityScores[a];
            const raceB = char.racialBonuses[a];
            const bgB = char.backgroundBonuses[a];
            const total = finalScores[a];
            const mod = calcAbilityMod(total);

            if (hasAnyBonus) {
              return (
                <div key={a} className={`grid gap-1 items-center ${
                  hasRaceBonus && hasBgBonus ? "grid-cols-5" : "grid-cols-4"
                }`}>
                  <div className="text-[10px] uppercase text-muted-foreground font-medium">
                    {ABILITY_SHORT[a]}
                  </div>
                  <div className="text-center text-xs text-muted-foreground">{base}</div>
                  {hasRaceBonus && (
                    <div className="text-center text-xs">
                      {raceB > 0 ? (
                        <span className="text-primary font-medium">+{raceB}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                  {hasBgBonus && (
                    <div className="text-center text-xs">
                      {bgB > 0 ? (
                        <span className="text-accent-foreground font-medium">+{bgB}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                  <div className="rounded bg-secondary/40 py-1 text-center">
                    <span className="text-sm font-bold">{total}</span>
                    <span className={`text-[10px] ml-0.5 ${mod >= 0 ? "text-success" : "text-destructive"}`}>
                      ({mod >= 0 ? "+" : ""}{mod})
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div key={a} className="rounded border bg-secondary/40 p-2 text-center inline-block w-[calc(33.33%-4px)] mr-1 mb-1">
                <p className="text-[10px] uppercase text-muted-foreground">{ABILITY_SHORT[a]}</p>
                <p className="text-sm font-bold">{total}</p>
                <p className="text-[10px] text-muted-foreground">
                  {mod >= 0 ? "+" : ""}{mod}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Origin Feat */}
      {originFeat && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-primary" />
            Talento
          </h2>
          <p className="text-xs font-medium">{originFeat.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-3">{originFeat.description}</p>
        </div>
      )}

      {/* Equipment & AC */}
      {(equippedArmorItem || equippedShieldItem || char.attacks.length > 0 || (char.gold?.gp ?? 0) > 0) && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Equipamento
          </h2>
          <div className="space-y-1.5 text-xs">
            {equippedArmorItem && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Armadura</span>
                <span className="font-medium">{equippedArmorItem.name}</span>
              </div>
            )}
            {equippedShieldItem && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escudo</span>
                <span className="font-medium">{equippedShieldItem.name}</span>
              </div>
            )}
            {(char.gold?.gp ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Coins className="h-3 w-3" /> Ouro</span>
                <span className="font-medium text-warning">{char.gold.gp} PO</span>
              </div>
            )}
          </div>
          {/* Attacks */}
          {char.attacks.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] uppercase text-muted-foreground mb-1 flex items-center gap-1">
                <Swords className="h-3 w-3" /> Ataques
              </p>
              <div className="space-y-1">
                {char.attacks.map((atk) => (
                  <div key={atk.weaponId} className="text-[11px]">
                    <span className="font-medium">{atk.name}</span>
                    <span className="text-muted-foreground ml-1">
                      {atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus} | {atk.damage.split(" (")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Inventory summary */}
          {char.inventory.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">Inventário ({char.inventory.length})</p>
              <div className="flex flex-wrap gap-1">
                {char.inventory.slice(0, 5).map((entry) => {
                  const item = itemsById[entry.itemId];
                  return (
                    <span key={entry.itemId} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                      {item?.name ?? entry.notes ?? entry.itemId}
                      {entry.quantity > 1 && ` ×${entry.quantity}`}
                    </span>
                  );
                })}
                {char.inventory.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">+{char.inventory.length - 5} mais</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Spellcasting */}
      {isSpellcaster && cls?.spellcasting && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Wand2 className="h-3.5 w-3.5 text-primary" />
            Conjuração
          </h2>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atributo</span>
              <span className="font-medium">{cls.spellcasting.ability}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CD</span>
              <span className="font-medium">{char.spells.spellSaveDC}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ataque</span>
              <span className="font-medium">+{char.spells.spellAttackBonus}</span>
            </div>
          </div>
          {char.spells.slots.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">Slots</p>
              <div className="flex gap-2 flex-wrap">
                {char.spells.slots.map((count, i) => count > 0 && (
                  <span key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                    {i + 1}º: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {char.spells.cantrips.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">Truques</p>
              <div className="flex flex-wrap gap-1">
                {char.spells.cantrips.map((id) => {
                  const sp = spellsData.find((s) => s.id === id);
                  return (
                    <span key={id} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                      {sp?.name ?? id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {char.spells.prepared.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">
                {cls.spellcasting.type === "known" || cls.spellcasting.type === "pact" ? "Conhecidas" : "Preparadas"}
              </p>
              <div className="flex flex-wrap gap-1">
                {char.spells.prepared.map((id) => {
                  const sp = spellsData.find((s) => s.id === id);
                  return (
                    <span key={id} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                      {sp?.name ?? id}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      {char.proficiencies.languages.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Idiomas
          </h2>
          <div className="flex flex-wrap gap-1">
            {[...char.proficiencies.languages].sort((a, b) => a.localeCompare(b, "pt-BR")).map((l) => (
              <span key={l} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {char.skills.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Perícias
          </h2>
          <div className="flex flex-wrap gap-1">
            {[...char.skills].sort((a, b) => a.localeCompare(b, "pt-BR")).map((s) => (
              <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Pendências
        </h2>
        <ul className="space-y-1.5 text-xs">
          {visibleSteps.map((step) => {
            const isDone = completedSteps.includes(step.id);
            const missing = requiredMissing[step.id] ?? [];
            return (
              <li key={step.id} className="flex items-start gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
                ) : (
                  <Info className="h-3.5 w-3.5 text-info mt-0.5 shrink-0" />
                )}
                <div>
                  <span className={isDone ? "text-success" : "text-info"}>
                    {step.num}. {step.label}
                  </span>
                  {!isDone && missing.length > 0 && (
                    <ul className="mt-0.5 ml-2 text-muted-foreground">
                      {missing.map((m) => (
                        <li key={m}>• {m}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function Row({ label, value, extra }: { label: string; value?: string; extra?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">
        {value ?? "—"}
        {extra && <span className="text-[10px] text-muted-foreground ml-1">({extra})</span>}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t my-1" />;
}
