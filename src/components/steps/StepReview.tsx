import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore, type StepId } from "@/state/builderStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { spells as spellsData } from "@/data/spells";
import { featsById } from "@/data/feats";
import { itemsById } from "@/data/items";
import type { ArmorProperties, WeaponProperties } from "@/data/items";
import {
  ABILITY_LABELS, ABILITY_SHORT, ABILITIES, calcAbilityMod,
  getFinalAbilityScores, ALL_SKILLS, type AbilityKey,
} from "@/utils/calculations";
import { validateCharacterCompleteness } from "@/utils/validation";
import {
  downloadCharacterJSON, generateSummaryText,
  readFileAsJSON, validateImportPayload, exportSharePayload, sharePayloadToBase64,
} from "@/utils/export";
import {
  CheckCircle2, AlertCircle, Download, Copy, Printer, ArrowLeft,
  ChevronDown, Shield, Swords, Wand2, BookOpen, Users, Scroll, Star,
  Upload, Share2, FileText,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function StepReview() {
  const char = useCharacterStore();
  const builder = useBuilderStore();
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting != null;

  const finalScores = useMemo(
    () => getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses),
    [char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses]
  );

  const validation = useMemo(() => validateCharacterCompleteness(char, builder.choicesRequirements?.needsStep ?? false), [
    char.race, char.subrace, char.class, char.background,
    char.abilityGeneration.confirmed, char.abilityGeneration.method,
    char.classSkillChoices, char.classEquipmentChoice, char.backgroundEquipmentChoice,
    char.spells.cantrips, char.spells.prepared, char.spells.spellcastingAbility,
    char.raceAbilityChoices, char.backgroundAbilityChoices,
    char.inventory, char.equipped, char.features,
    builder.choicesRequirements?.needsStep,
  ]);

  // Step completion is now managed by StepSheet parent

  const goToStep = (stepId: string) => builder.goToStep(stepId as StepId);

  // ── Export handlers ──
  const handleExport = () => {
    downloadCharacterJSON(char);
    toast({ title: "Exportado!", description: "Arquivo JSON baixado com sucesso." });
  };

  const handleCopy = async () => {
    const text = generateSummaryText(char);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!", description: "Resumo copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => navigate("/print");

  const handleShare = async () => {
    const payload = exportSharePayload(char);
    const b64 = sharePayloadToBase64(payload);
    await navigator.clipboard.writeText(b64);
    toast({ title: "Link copiado!", description: "Payload compartilhável copiado (Base64)." });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = await readFileAsJSON(file);
      const result = validateImportPayload(raw);
      if (!result.success) {
        toast({
          title: "Erro na importação",
          description: result.errors.join("\n"),
          variant: "destructive",
        });
        return;
      }
      if (result.warnings.length > 0) {
        toast({ title: "Aviso", description: result.warnings.join("\n") });
      }
      if (result.data) {
        char.patchCharacter(result.data as any);
        char.recalc();
        toast({ title: "Importado!", description: "Personagem importado com sucesso." });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message ?? "Falha ao ler arquivo.", variant: "destructive" });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const visibleSteps = builder.getVisibleSteps();
  const lastIncompleteStep = visibleSteps.find(
    (s) => s.id !== "sheet" && !builder.completedSteps.includes(s.id)
  );

  return (
    <div className="p-6 print:p-2 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Revisão Final</h2>
          <p className="text-sm text-muted-foreground">Confira todos os dados antes de finalizar.</p>
        </div>
        <div className="flex items-center gap-2">
          {validation.isComplete ? (
            <Badge className="bg-success text-success-foreground gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ficha Completa
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" /> Faltam {validation.missing.length} itens
            </Badge>
          )}
        </div>
      </div>

      {/* ── Pendências ── */}
      {(validation.missing.length > 0 || validation.warnings.length > 0) && (
        <div className="mb-6 space-y-3">
          {validation.missing.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" /> Itens obrigatórios pendentes
              </p>
              <ul className="space-y-1.5">
                {validation.missing.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">• {m.label}</span>
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs h-7 text-primary"
                      onClick={() => goToStep(m.stepId)}
                    >
                      Ir para etapa {m.stepNumber} →
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm font-semibold text-warning flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" /> Avisos
              </p>
              <ul className="space-y-1.5">
                {validation.warnings.map((w) => (
                  <li key={w.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">• {w.label}</span>
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs h-7 text-primary"
                      onClick={() => goToStep(w.stepId)}
                    >
                      Ir para etapa {w.stepNumber} →
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Name & Identity ── */}
      <Section>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <input
            type="text"
            placeholder="Nome do Personagem..."
            value={char.name}
            onChange={(e) => char.setField("name", e.target.value)}
            className="text-2xl font-bold bg-transparent border-b border-border focus:border-primary outline-none pb-1 w-full sm:w-auto min-w-[200px] transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            <Tag>{race?.name ?? "—"}{subrace ? ` (${subrace.name})` : ""}</Tag>
            <Tag>{cls?.name ?? "—"}</Tag>
            <Tag>{bg?.name ?? "—"}</Tag>
            <Tag>Nível {char.level}</Tag>
          </div>
        </div>
      </Section>

      {/* ── Seção 1: Atributos ── */}
      <SectionTitle icon={<Users className="h-4 w-4" />} title="Atributos" />
      <Section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs uppercase">
                <th className="text-left py-2 pr-2">Atributo</th>
                <th className="text-center py-2 px-2">Base</th>
                <th className="text-center py-2 px-2">Raça</th>
                <th className="text-center py-2 px-2">Antec.</th>
                <th className="text-center py-2 px-2 font-bold text-foreground">Total</th>
                <th className="text-center py-2 px-2 font-bold text-foreground">Mod</th>
              </tr>
            </thead>
            <tbody>
              {ABILITIES.map((a) => {
                const base = char.abilityScores[a];
                const rb = char.racialBonuses[a];
                const bb = char.backgroundBonuses[a];
                const total = finalScores[a];
                const mod = calcAbilityMod(total);
                return (
                  <tr key={a} className="border-t border-border/50">
                    <td className="py-2 pr-2 font-medium">{ABILITY_LABELS[a]}</td>
                    <td className="text-center py-2 px-2 text-muted-foreground">{base}</td>
                    <td className="text-center py-2 px-2">
                      {rb ? <span className="text-primary font-medium">+{rb}</span> : "—"}
                    </td>
                    <td className="text-center py-2 px-2">
                      {bb ? <span className="text-info font-medium">+{bb}</span> : "—"}
                    </td>
                    <td className="text-center py-2 px-2 font-bold text-lg">{total}</td>
                    <td className="text-center py-2 px-2">
                      <span className={`font-bold ${mod >= 0 ? "text-success" : "text-destructive"}`}>
                        {mod >= 0 ? "+" : ""}{mod}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Seção 2: Combate ── */}
      <SectionTitle icon={<Swords className="h-4 w-4" />} title="Combate" />
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatBox label="CA" value={String(char.armorClass)} />
          <StatBox label="PV Máximo" value={String(char.hitPoints.max)} />
          <StatBox label="Iniciativa" value={`${calcAbilityMod(finalScores.dex) >= 0 ? "+" : ""}${calcAbilityMod(finalScores.dex)}`} />
          <StatBox label="Deslocamento" value={`${char.speed}m`} />
        </div>

        {/* Saving Throws */}
        <div className="mb-4">
          <p className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Salvaguardas</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ABILITIES.map((a) => {
              const mod = calcAbilityMod(finalScores[a]);
              const proficient = char.savingThrows.includes(ABILITY_LABELS[a]);
              const total = mod + (proficient ? char.proficiencyBonus : 0);
              return (
                <div key={a} className={`rounded-lg border p-2 text-center ${proficient ? "border-primary/50 bg-primary/5" : "bg-secondary/30"}`}>
                  <p className="text-[11px] uppercase font-semibold text-muted-foreground">{ABILITY_SHORT[a]}</p>
                  <p className={`font-bold ${proficient ? "text-primary" : ""}`}>
                    {total >= 0 ? "+" : ""}{total}
                  </p>
                  {proficient && <p className="text-[11px] font-medium text-primary">Prof.</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attacks */}
        {char.attacks.length > 0 && (
          <div>
            <p className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Ataques</p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <th className="text-left py-2 px-3">Arma</th>
                    <th className="text-center py-2 px-2">Ataque</th>
                    <th className="text-left py-2 px-2">Dano</th>
                    <th className="text-center py-2 px-2">Alcance</th>
                    <th className="text-center py-2 px-2">Prof.</th>
                  </tr>
                </thead>
                <tbody>
                  {char.attacks.map((atk) => (
                    <tr key={atk.weaponId} className="border-t border-border/50">
                      <td className="py-2 px-3 font-medium">{atk.name}</td>
                      <td className="text-center py-2 px-2 font-bold text-primary">
                        {atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{atk.damage.split(" (")[0]}</td>
                      <td className="text-center py-2 px-2 text-muted-foreground">{atk.range}</td>
                      <td className="text-center py-2 px-2">
                        {atk.proficient ? <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      {/* ── Seção 3: Perícias & Proficiências ── */}
      <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="Perícias & Proficiências" />
      <Section>
        {/* Skills table */}
        <div className="rounded-lg border overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                <th className="text-left py-2 px-3">Perícia</th>
                <th className="text-center py-2 px-2">Atr.</th>
                <th className="text-center py-2 px-2">Mod</th>
                <th className="text-center py-2 px-2">Prof.</th>
              </tr>
            </thead>
            <tbody>
              {ALL_SKILLS.map((skill) => {
                const mod = calcAbilityMod(finalScores[skill.ability]);
                const proficient = char.skills.includes(skill.name);
                const total = mod + (proficient ? char.proficiencyBonus : 0);
                return (
                  <tr key={skill.name} className={`border-t border-border/50 ${proficient ? "bg-primary/5" : ""}`}>
                    <td className="py-1.5 px-3 font-medium">{skill.name}</td>
                    <td className="text-center py-1.5 px-2 text-xs text-muted-foreground">{ABILITY_SHORT[skill.ability]}</td>
                    <td className="text-center py-1.5 px-2 font-bold">
                      {total >= 0 ? "+" : ""}{total}
                    </td>
                    <td className="text-center py-1.5 px-2">
                      {proficient && <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Proficiencies */}
        <div className="grid sm:grid-cols-2 gap-3">
          <ProfList label="Armas" items={char.proficiencies.weapons} />
          <ProfList label="Armaduras" items={char.proficiencies.armor} />
          <ProfList label="Ferramentas" items={char.proficiencies.tools} />
          <ProfList label="Idiomas" items={char.proficiencies.languages} />
        </div>
      </Section>

      {/* ── Seção 4: Características ── */}
      <SectionTitle icon={<Scroll className="h-4 w-4" />} title="Características" />
      <Section>
        {char.features.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma característica registrada.</p>
        ) : (
          <div className="space-y-2">
            {groupFeaturesWithLevel(char.features).map(([group, feats]) => (
              <div key={group}>
                <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">{group}</p>
                {feats.map((f, i) => (
                  <Collapsible key={`${f.sourceId}-${f.name}-${i}`}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full rounded-md px-3 py-2 hover:bg-secondary/40 transition-colors text-left">
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
                      <span className="text-sm font-medium">{f.name}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-8 pb-2 text-sm text-muted-foreground">
                      {f.description}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Seção Talentos ── */}
      {char.appliedFeats.length > 0 && (
        <>
          <SectionTitle icon={<Star className="h-4 w-4" />} title="Talentos" />
          <Section>
            <div className="space-y-2">
              {char.appliedFeats.map((af, i) => {
                const feat = featsById[af.featId];
                const sourceName = af.source === "background" ? "Antecedente" : `Level Up (Nv. ${af.levelTaken})`;
                return (
                  <div key={`${af.featId}-${i}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{feat?.name ?? af.featId}</span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                        {sourceName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{feat?.description ?? ""}</p>
                    {af.choices?.abilityIncreases && Object.keys(af.choices.abilityIncreases).some(k => (af.choices!.abilityIncreases![k as AbilityKey] ?? 0) > 0) && (
                      <div className="mt-1 flex gap-1.5 flex-wrap">
                        {Object.entries(af.choices.abilityIncreases).filter(([, v]) => v && v > 0).map(([k, v]) => (
                          <Tag key={k}>{ABILITY_SHORT[k as AbilityKey]} +{v}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {/* ── Seção 5: Magias ── */}
      {isSpellcaster && cls?.spellcasting && (
        <>
          <SectionTitle icon={<Wand2 className="h-4 w-4" />} title="Magias" />
          <Section>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatBox label="Atributo" value={cls.spellcasting.ability} />
              <StatBox label="CD" value={String(char.spells.spellSaveDC)} />
              <StatBox label="Ataque" value={`+${char.spells.spellAttackBonus}`} />
            </div>

            {/* Slots */}
            {char.spells.slots.length > 0 && (
              <div className="mb-4">
                <p className="text-xs uppercase text-muted-foreground mb-2 font-semibold">Espaços de Magia</p>
                <div className="flex gap-2 flex-wrap">
                  {char.spells.slots.map((count, i) => count > 0 && (
                    <div key={i} className="rounded-lg border bg-secondary/30 px-3 py-1.5 text-center">
                      <p className="text-[11px] text-muted-foreground">{i + 1}º Círculo</p>
                      <p className="font-bold">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cantrips */}
            {char.spells.cantrips.length > 0 && (
              <div className="mb-3">
                <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">Truques</p>
                <div className="flex flex-wrap gap-1.5">
                  {char.spells.cantrips.map((id) => {
                    const sp = spellsData.find((s) => s.id === id);
                    return <Tag key={id}>{sp?.name ?? id}</Tag>;
                  })}
                </div>
              </div>
            )}

            {/* Prepared/Known */}
            {char.spells.prepared.length > 0 && (
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1.5 font-semibold">
                  {cls.spellcasting.type === "known" || cls.spellcasting.type === "pact" ? "Magias Conhecidas" : "Magias Preparadas"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {char.spells.prepared.map((id) => {
                    const sp = spellsData.find((s) => s.id === id);
                    return <Tag key={id}>{sp?.name ?? id}{sp ? ` (${sp.level}º)` : ""}</Tag>;
                  })}
                </div>
              </div>
            )}
          </Section>
        </>
      )}

      {/* ── Seção 6: Equipamento ── */}
      <SectionTitle icon={<Shield className="h-4 w-4" />} title="Equipamento" />
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {char.equipped?.armor && (
            <StatBox label="Armadura" value={itemsById[char.equipped.armor]?.name ?? "—"} small />
          )}
          {char.equipped?.shield && (
            <StatBox label="Escudo" value={itemsById[char.equipped.shield]?.name ?? "—"} small />
          )}
          <StatBox label="Ouro" value={`${char.gold?.gp ?? 0} PO`} />
        </div>

        {char.inventory.length > 0 && (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                  <th className="text-left py-2 px-3">Item</th>
                  <th className="text-center py-2 px-2">Qtd</th>
                  <th className="text-center py-2 px-2">Peso</th>
                  <th className="text-center py-2 px-2">Equipado</th>
                </tr>
              </thead>
              <tbody>
                {char.inventory.map((entry) => {
                  const item = itemsById[entry.itemId];
                  const isEquipped =
                    char.equipped?.armor === entry.itemId ||
                    char.equipped?.shield === entry.itemId ||
                    char.equipped?.weapons.includes(entry.itemId);
                  return (
                    <tr key={entry.itemId} className={`border-t border-border/50 ${isEquipped ? "bg-primary/5" : ""}`}>
                      <td className="py-1.5 px-3 font-medium">{item?.name ?? entry.itemId}</td>
                      <td className="text-center py-1.5 px-2">{entry.quantity}</td>
                      <td className="text-center py-1.5 px-2 text-muted-foreground">
                        {item ? `${(item.weight * entry.quantity).toFixed(1)} kg` : "—"}
                      </td>
                      <td className="text-center py-1.5 px-2">
                        {isEquipped && <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-secondary/20">
                  <td className="py-1.5 px-3 text-xs text-muted-foreground font-semibold">Total</td>
                  <td className="text-center py-1.5 px-2 text-xs font-semibold">
                    {char.inventory.reduce((s, e) => s + e.quantity, 0)}
                  </td>
                  <td className="text-center py-1.5 px-2 text-xs text-muted-foreground font-semibold">
                    {char.inventory
                      .reduce((s, e) => s + (itemsById[e.itemId]?.weight ?? 0) * e.quantity, 0)
                      .toFixed(1)} kg
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      {/* ── Actions ── */}
      <div className="mt-8 flex flex-wrap gap-3 print:hidden">
        {lastIncompleteStep && (
          <Button variant="outline" onClick={() => goToStep(lastIncompleteStep.id)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar e Ajustar
          </Button>
        )}
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" /> Exportar JSON
        </Button>
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Importar JSON
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-label="Importar arquivo JSON"
        />
        <Button variant="secondary" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1" /> {copied ? "Copiado!" : "Copiar Resumo"}
        </Button>
        <Button variant="secondary" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1" /> Compartilhar
        </Button>
        <Button variant="secondary" onClick={handlePrint}>
          <FileText className="h-4 w-4 mr-1" /> Ficha para Impressão
        </Button>
      </div>
    </div>
  );
}

// ── Helpers ──

function Section({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card p-4 mb-4">{children}</div>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground mt-6 mb-2">
      {icon} {title}
    </h3>
  );
}

function StatBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-lg border bg-secondary/30 p-3 text-center">
      <p className="text-[11px] uppercase font-semibold text-muted-foreground">{label}</p>
      <p className={`font-bold ${small ? "text-sm" : "text-xl"}`}>{value}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
      {children}
    </span>
  );
}

function ProfList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  const sorted = [...items].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground font-semibold mb-1">{label}</p>
      <div className="flex flex-wrap gap-1">
        {sorted.map((i) => (
          <span key={i} className="rounded bg-secondary px-2 py-0.5 text-xs">{i}</span>
        ))}
      </div>
    </div>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  race: "Raça", subrace: "Sub-raça", class: "Classe",
  subclass: "Subclasse", background: "Antecedente", other: "Outro",
};

function groupFeatures(features: { sourceType: string; name: string; description: string; sourceId: string }[]) {
  const groups: Record<string, typeof features> = {};
  for (const f of features) {
    const key = SOURCE_LABELS[f.sourceType] ?? f.sourceType;
    (groups[key] ??= []).push(f);
  }
  return Object.entries(groups);
}

function groupFeaturesWithLevel(features: { sourceType: string; name: string; description: string; sourceId: string; level?: number }[]) {
  const groups: Record<string, typeof features> = {};
  for (const f of features) {
    let key = SOURCE_LABELS[f.sourceType] ?? f.sourceType;
    // For class features, group by level
    if (f.sourceType === "class" && f.level) {
      key = `${key} — Nível ${f.level}`;
    }
    (groups[key] ??= []).push(f);
  }
  return Object.entries(groups);
}
