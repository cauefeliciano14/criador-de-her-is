import { useCharacterStore } from "@/state/characterStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { spells as spellsData } from "@/data/spells";
import { itemsById } from "@/data/items";
import {
  ABILITIES, ABILITY_SHORT, ABILITY_LABELS,
  calcAbilityMod, getFinalAbilityScores, ALL_SKILLS,
  type AbilityKey,
} from "@/utils/calculations";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrintSheet() {
  const char = useCharacterStore();
  const navigate = useNavigate();

  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting != null;

  const finalScores = useMemo(
    () => getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses),
    [char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses]
  );

  return (
    <div className="print-sheet">
      {/* Toolbar - hidden on print */}
      <div className="print:hidden sticky top-0 z-50 flex items-center justify-between border-b bg-card px-6 py-3">
        <Button variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao Builder
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="max-w-[800px] mx-auto p-8 print:p-4 print:max-w-none">
        {/* ── Header ── */}
        <div className="text-center mb-6 pb-4 border-b-2 border-foreground print:border-black">
          <h1 className="text-2xl font-bold">{char.name || "Sem Nome"}</h1>
          <p className="text-sm text-muted-foreground print:text-black mt-1">
            {race?.name ?? "—"}{subrace ? ` (${subrace.name})` : ""} • {cls?.name ?? "—"} Nível {char.level} • {bg?.name ?? "—"}
          </p>
        </div>

        {/* ── Combat Stats ── */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          <PrintStatBox label="CA" value={String(char.armorClass)} />
          <PrintStatBox label="PV" value={String(char.hitPoints.max)} />
          <PrintStatBox label="Iniciativa" value={`${calcAbilityMod(finalScores.dex) >= 0 ? "+" : ""}${calcAbilityMod(finalScores.dex)}`} />
          <PrintStatBox label="Desl." value={`${char.speed}m`} />
          <PrintStatBox label="Prof." value={`+${char.proficiencyBonus}`} />
        </div>

        {/* ── Ability Scores ── */}
        <PrintSection title="Atributos">
          <div className="grid grid-cols-6 gap-2">
            {ABILITIES.map((a) => {
              const total = finalScores[a];
              const mod = calcAbilityMod(total);
              return (
                <div key={a} className="border rounded p-2 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider">{ABILITY_SHORT[a]}</p>
                  <p className="text-xl font-bold">{total}</p>
                  <p className="text-sm">{mod >= 0 ? "+" : ""}{mod}</p>
                </div>
              );
            })}
          </div>
        </PrintSection>

        {/* ── Saving Throws ── */}
        <PrintSection title="Salvaguardas">
          <div className="grid grid-cols-6 gap-2">
            {ABILITIES.map((a) => {
              const mod = calcAbilityMod(finalScores[a]);
              const prof = char.savingThrows.some(
                (st) => st.toLowerCase().startsWith(ABILITY_LABELS[a].toLowerCase().substring(0, 3))
              );
              const total = mod + (prof ? char.proficiencyBonus : 0);
              return (
                <div key={a} className={`border rounded p-1.5 text-center text-xs ${prof ? "border-foreground print:border-black font-bold" : ""}`}>
                  <p className="text-[9px] uppercase">{ABILITY_SHORT[a]}</p>
                  <p>{total >= 0 ? "+" : ""}{total}{prof ? " ★" : ""}</p>
                </div>
              );
            })}
          </div>
        </PrintSection>

        {/* ── Skills ── */}
        <PrintSection title="Perícias">
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs">
            {ALL_SKILLS.map((skill) => {
              const mod = calcAbilityMod(finalScores[skill.ability]);
              const prof = char.skills.includes(skill.name);
              const total = mod + (prof ? char.proficiencyBonus : 0);
              return (
                <div key={skill.name} className={`flex justify-between py-0.5 border-b border-dotted ${prof ? "font-bold" : ""}`}>
                  <span>{prof ? "● " : "○ "}{skill.name} <span className="text-muted-foreground print:text-gray-500">({ABILITY_SHORT[skill.ability]})</span></span>
                  <span>{total >= 0 ? "+" : ""}{total}</span>
                </div>
              );
            })}
          </div>
        </PrintSection>

        {/* ── Attacks ── */}
        {char.attacks.length > 0 && (
          <PrintSection title="Ataques">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b text-left font-bold uppercase">
                  <th className="py-1 pr-2">Arma</th>
                  <th className="py-1 px-2 text-center">Ataque</th>
                  <th className="py-1 px-2">Dano</th>
                  <th className="py-1 px-2 text-center">Alcance</th>
                </tr>
              </thead>
              <tbody>
                {char.attacks.map((atk) => (
                  <tr key={atk.weaponId} className="border-b border-dotted">
                    <td className="py-1 pr-2 font-medium">{atk.name}</td>
                    <td className="py-1 px-2 text-center font-bold">{atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus}</td>
                    <td className="py-1 px-2">{atk.damage.split(" (")[0]}</td>
                    <td className="py-1 px-2 text-center">{atk.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PrintSection>
        )}

        {/* ── Features ── */}
        {char.features.length > 0 && (
          <PrintSection title="Características" pageBreak>
            <div className="space-y-2 text-xs">
              {char.features.map((f, i) => (
                <div key={`${f.sourceId}-${f.name}-${i}`}>
                  <p className="font-bold">{f.name} <span className="font-normal text-muted-foreground print:text-gray-500">({f.sourceType})</span></p>
                  <p className="text-muted-foreground print:text-gray-600">{f.description}</p>
                </div>
              ))}
            </div>
          </PrintSection>
        )}

        {/* ── Spells ── */}
        {isSpellcaster && (
          <PrintSection title="Magias" pageBreak>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="border rounded p-2 text-center text-xs">
                <p className="text-[9px] uppercase text-muted-foreground print:text-gray-500">CD</p>
                <p className="text-lg font-bold">{char.spells.spellSaveDC}</p>
              </div>
              <div className="border rounded p-2 text-center text-xs">
                <p className="text-[9px] uppercase text-muted-foreground print:text-gray-500">Ataque</p>
                <p className="text-lg font-bold">+{char.spells.spellAttackBonus}</p>
              </div>
              <div className="border rounded p-2 text-center text-xs">
                <p className="text-[9px] uppercase text-muted-foreground print:text-gray-500">Atributo</p>
                <p className="text-lg font-bold">{cls?.spellcasting?.ability?.substring(0, 3) ?? "—"}</p>
              </div>
            </div>

            {char.spells.slots.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] uppercase font-bold mb-1">Espaços de Magia</p>
                <div className="flex gap-2 text-xs">
                  {char.spells.slots.map((count, i) => count > 0 && (
                    <span key={i} className="border rounded px-2 py-0.5">{i + 1}º: {count}</span>
                  ))}
                </div>
              </div>
            )}

            {char.spells.cantrips.length > 0 && (
              <div className="mb-2 text-xs">
                <p className="font-bold">Truques:</p>
                <p>{char.spells.cantrips.map((id) => spellsData.find((s) => s.id === id)?.name ?? id).join(", ")}</p>
              </div>
            )}

            {char.spells.prepared.length > 0 && (
              <div className="text-xs">
                <p className="font-bold">
                  {cls?.spellcasting?.type === "known" || cls?.spellcasting?.type === "pact" ? "Conhecidas:" : "Preparadas:"}
                </p>
                <p>{char.spells.prepared.map((id) => spellsData.find((s) => s.id === id)?.name ?? id).join(", ")}</p>
              </div>
            )}
          </PrintSection>
        )}

        {/* ── Equipment ── */}
        <PrintSection title="Equipamento">
          <div className="flex gap-4 mb-2 text-xs">
            {char.equipped?.armor && (
              <span><strong>Armadura:</strong> {itemsById[char.equipped.armor]?.name ?? char.equipped.armor}</span>
            )}
            {char.equipped?.shield && (
              <span><strong>Escudo:</strong> {itemsById[char.equipped.shield]?.name ?? char.equipped.shield}</span>
            )}
            <span><strong>Ouro:</strong> {char.gold?.gp ?? 0} PO</span>
          </div>

          {char.inventory.length > 0 && (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b font-bold uppercase text-left">
                  <th className="py-1 pr-2">Item</th>
                  <th className="py-1 px-2 text-center">Qtd</th>
                  <th className="py-1 px-2 text-center">Peso</th>
                </tr>
              </thead>
              <tbody>
                {char.inventory.map((entry) => {
                  const item = itemsById[entry.itemId];
                  return (
                    <tr key={entry.itemId} className="border-b border-dotted">
                      <td className="py-0.5 pr-2">{item?.name ?? entry.itemId}</td>
                      <td className="py-0.5 px-2 text-center">{entry.quantity}</td>
                      <td className="py-0.5 px-2 text-center">{item ? `${(item.weight * entry.quantity).toFixed(1)}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </PrintSection>

        {/* ── Proficiencies ── */}
        <PrintSection title="Proficiências">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {char.proficiencies.armor.length > 0 && (
              <div><p className="font-bold">Armaduras:</p><p>{char.proficiencies.armor.join(", ")}</p></div>
            )}
            {char.proficiencies.weapons.length > 0 && (
              <div><p className="font-bold">Armas:</p><p>{char.proficiencies.weapons.join(", ")}</p></div>
            )}
            {char.proficiencies.tools.length > 0 && (
              <div><p className="font-bold">Ferramentas:</p><p>{char.proficiencies.tools.join(", ")}</p></div>
            )}
            {char.proficiencies.languages.length > 0 && (
              <div><p className="font-bold">Idiomas:</p><p>{char.proficiencies.languages.join(", ")}</p></div>
            )}
          </div>
        </PrintSection>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-muted-foreground print:text-gray-400 border-t pt-2">
          D&D 2024 Character Builder • Gerado em {new Date().toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}

function PrintStatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 rounded-lg p-2 text-center print:border-black">
      <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground print:text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function PrintSection({ title, children, pageBreak }: { title: string; children: React.ReactNode; pageBreak?: boolean }) {
  return (
    <div className={`mb-5 ${pageBreak ? "print:break-before-page" : ""}`}>
      <h2 className="text-xs uppercase font-bold tracking-widest border-b-2 border-foreground print:border-black pb-1 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
