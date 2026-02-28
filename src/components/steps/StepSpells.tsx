import { useBuilderStore } from "@/state/builderStore";
import { useCharacterStore } from "@/state/characterStore";
import { classes } from "@/data/classes";
import { getSpellSchools, type SpellData } from "@/data/spells";
import { spells as allSpellsData } from "@/data/spells";
import {
  ABILITIES,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
  ABILITY_LABELS,
} from "@/utils/calculations";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Info, BookOpen, Sparkles, Flame, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  filterSpellsByClass,
  formatSpellClassesForDisplay,
  getSelectedClassId,
  getSpellLimitsAtLevel1,
  isSpellcastingClass,
  spellMatchesClass,
} from "@/utils/spellsByClass";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LEVEL_LABELS: Record<number, string> = {
  0: "Truque",
  1: "1º Círculo",
  2: "2º Círculo",
  3: "3º Círculo",
  4: "4º Círculo",
  5: "5º Círculo",
  6: "6º Círculo",
  7: "7º Círculo",
  8: "8º Círculo",
  9: "9º Círculo",
};

export function StepSpells() {
  const { toast } = useToast();
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const classId = useCharacterStore((s) => s.class);
  const selectedClassId = getSelectedClassId({ class: classId });
  const abilityScores = useCharacterStore((s) => s.abilityScores);
  const racialBonuses = useCharacterStore((s) => s.racialBonuses);
  const backgroundBonuses = useCharacterStore((s) => s.backgroundBonuses);
  const asiBonuses = useCharacterStore((s) => s.asiBonuses);
  const featAbilityBonuses = useCharacterStore((s) => s.featAbilityBonuses);
  const profBonus = useCharacterStore((s) => s.proficiencyBonus);
  const level = useCharacterStore((s) => s.level);
  const classFeatureChoices = useCharacterStore((s) => s.classFeatureChoices ?? {});
  const spellsState = useCharacterStore((s) => s.spells);
  const toggleCantrip = useCharacterStore((s) => s.toggleCantrip);
  const togglePreparedSpell = useCharacterStore((s) => s.toggleSpell);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const cls = classes.find((c) => c.id === classId);
  const sc = cls?.spellcasting ?? null;

  // ── Derived data ──
  const spellcastingAbility = sc?.ability ?? null;
  const abilityKey = useMemo(() => {
    if (!spellcastingAbility) return null;
    const map: Record<string, AbilityKey> = {
      Inteligência: "int",
      Sabedoria: "wis",
      Carisma: "cha",
    };
    return map[spellcastingAbility] ?? null;
  }, [spellcastingAbility]);

  const finalScores = getFinalAbilityScores(abilityScores, racialBonuses, backgroundBonuses, asiBonuses, featAbilityBonuses);
  const abilityMod = abilityKey ? calcAbilityMod(finalScores[abilityKey]) : 0;
  const spellSaveDC = sc ? 8 + profBonus + abilityMod : 0;
  const spellAttackBonus = sc ? profBonus + abilityMod : 0;

  // Limits

  const cantripsLimit = useMemo(() => {
    if (!sc) return getSpellLimitsAtLevel1(selectedClassId).cantrips;
    const entries = Object.entries(sc.cantripsKnownAtLevel)
      .map(([l, c]) => [Number(l), c] as [number, number])
      .sort((a, b) => a[0] - b[0]);
    let limit = 0;
    for (const [l, c] of entries) {
      if (level >= l) limit = c;
    }
    // Bonus cantrips from class features (Taumaturgo / Xamã)
    if (classId === "clerigo" && classFeatureChoices["clerigo:ordemDivina"] === "taumaturgo") {
      limit += 1;
    }
    if (classId === "druida" && classFeatureChoices["druida:ordemPrimal"] === "xama") {
      limit += 1;
    }
    return limit;
  }, [sc, level, classId, classFeatureChoices, selectedClassId]);

  const availableSlots = useMemo(() => {
    if (!sc) return {} as Record<number, number>;
    const slotData = sc.spellSlotsByLevel[level];
    return slotData ?? {};
  }, [sc, level]);

  const maxSpellLevel = useMemo(() => {
    const levels = Object.keys(availableSlots).map(Number);
    return levels.length > 0 ? Math.max(...levels) : 0;
  }, [availableSlots]);

  const preparedLimit = useMemo(() => {
    if (!sc) return getSpellLimitsAtLevel1(selectedClassId).prepared;
    if (sc.type === "prepared") {
      return Math.max(1, abilityMod + level);
    }
    // For known/pact, check spellsKnownAtLevel if exists, else fallback
    const knownData = (sc as any).spellsKnownAtLevel;
    if (knownData) {
      const entries = Object.entries(knownData)
        .map(([l, c]) => [Number(l), c as number] as [number, number])
        .sort((a, b) => a[0] - b[0]);
      let limit = 0;
      for (const [l, c] of entries) {
        if (level >= l) limit = c;
      }
      return limit;
    }
    return Math.max(1, abilityMod + level);
  }, [sc, abilityMod, level, selectedClassId]);

  const spellTypeLabel = sc?.type === "known" || sc?.type === "pact" ? "Conhecidas" : "Preparadas";

  // ── Available spells for this class ──
  const spellsFilteredByClass = useMemo(() => {
    if (!selectedClassId) return [];
    return filterSpellsByClass(allSpellsData, selectedClassId)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [selectedClassId]);

  const classSpells = useMemo(() => spellsFilteredByClass, [spellsFilteredByClass]);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterSchool, setFilterSchool] = useState<string | null>(null);
  const [filterConcentration, setFilterConcentration] = useState(false);
  const [filterRitual, setFilterRitual] = useState(false);
  const [detailSpell, setDetailSpell] = useState<SpellData | null>(null);
  const PAGE_SIZE = 30;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const schools = useMemo(() => getSpellSchools(), []);

  const availableLevels = useMemo(() => {
    const levels = new Set(classSpells.map((s) => s.level));
    // Only show levels the character has access to
    return [...levels].filter((l) => l === 0 || l <= maxSpellLevel).sort((a, b) => a - b);
  }, [classSpells, maxSpellLevel]);

  const filtered = useMemo(() => {
    return classSpells.filter((s) => {
      // Only show cantrips and spells up to max available level
      if (s.level > 0 && s.level > maxSpellLevel) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterLevel !== null && s.level !== filterLevel) return false;
      if (filterSchool && s.school !== filterSchool) return false;
      if (filterConcentration && !s.concentration) return false;
      if (filterRitual && !s.ritual) return false;
      return true;
    });
  }, [classSpells, search, filterLevel, filterSchool, filterConcentration, filterRitual, maxSpellLevel]);

  // Reset pagination when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, filterLevel, filterSchool, filterConcentration, filterRitual]);

  const visibleSpells = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  // ── Selection state ──
  const selectedCantrips = spellsState.cantrips;
  // NOTE: We store leveled spells in `spells.prepared` for ALL caster types (prepared/known/pact)
  // to keep the state shape simple for now (levels 1–2 focus).
  const selectedPrepared = spellsState.prepared;

  const toggleSpell = (spell: SpellData) => {
    if (!selectedClassId || !spellMatchesClass(spell, selectedClassId)) {
      toast({
        title: "Magia incompatível",
        description: "Esta magia não pertence à lista da classe selecionada.",
        variant: "destructive",
      });
      return;
    }

    if (spell.level === 0) {
      if (!canAddCantrip) return;
      toggleCantrip(spell.id);
      return;
    }

    if (!canAddPrepared) return;
    togglePreparedSpell(spell.id);
  };

  const isSelected = (spellId: string, level: number) => {
    if (level === 0) return selectedCantrips.includes(spellId);
    return selectedPrepared.includes(spellId);
  };

  // ── Sync spellcasting data on mount / class change ──
  useEffect(() => {
    if (!sc) return;
    patchCharacter({
      spells: {
        ...spellsState,
        spellcastingAbility: abilityKey,
        spellSaveDC,
        spellAttackBonus,
        slots: Object.values(availableSlots),
      },
    });
  }, [classId, abilityKey, spellSaveDC, spellAttackBonus, availableSlots, patchCharacter, spellsState]);

  // ── Validation ──
  useEffect(() => {
    // Spells validation is tracked internally but step is part of "sheet"
    // We don't call completeStep/uncompleteStep here as Spells is embedded in Sheet
  }, [selectedCantrips.length, selectedPrepared.length, cantripsLimit, preparedLimit, sc]);

  if (!selectedClassId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-1">Magias</h2>
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Selecione uma classe para ver magias.</p>
        </div>
      </div>
    );
  }

  if (!isSpellcastingClass(selectedClassId) || !sc || !cls) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-1">Magias</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Esta classe não conjura magias.
        </p>
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          <p>Esta etapa não se aplica ao seu personagem.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Magias</h2>
        <p className="text-sm text-muted-foreground">
          Escolha truques e magias {spellTypeLabel.toLowerCase()} para seu {cls.name}.
        </p>
      </div>

      {/* Spellcasting Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Atributo" value={spellcastingAbility ?? "—"} sub={abilityKey ? `${finalScores[abilityKey]} (${abilityMod >= 0 ? "+" : ""}${abilityMod})` : ""} />
        <StatCard label="CD de Magia" value={String(spellSaveDC)} />
        <StatCard label="Bônus de Ataque" value={`+${spellAttackBonus}`} />
        <StatCard label="Bônus de Prof." value={`+${profBonus}`} />
      </div>

      {/* Slots */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Espaços de Magia
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(availableSlots).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum espaço disponível no nível {level}.</p>
          ) : (
            Object.entries(availableSlots)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([lvl, count]) => (
                <div key={lvl} className="rounded-lg border bg-secondary/40 px-4 py-2 text-center min-w-[80px]">
                  <p className="text-[10px] uppercase text-muted-foreground">{lvl}º Círculo</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Selection Counters */}
      <div className="flex flex-wrap gap-4">
        <CounterChip
          icon={<Sparkles className="h-4 w-4" />}
          label="Truques"
          current={selectedCantrips.length}
          max={cantripsLimit}
        />
        <CounterChip
          icon={<BookOpen className="h-4 w-4" />}
          label={`Magias ${spellTypeLabel}`}
          current={selectedPrepared.length}
          max={preparedLimit}
        />
      </div>

      {/* Pendencies */}
      {(() => {
        const missing: string[] = [];
        if (cantripsLimit > 0 && selectedCantrips.length !== cantripsLimit) {
          missing.push(selectedCantrips.length > cantripsLimit
            ? `Remova ${selectedCantrips.length - cantripsLimit} truque(s) excedente(s)`
            : `Escolha ${cantripsLimit - selectedCantrips.length} truque(s)`);
        }
        if (preparedLimit > 0 && selectedPrepared.length !== preparedLimit) {
          missing.push(selectedPrepared.length > preparedLimit
            ? `Remova ${selectedPrepared.length - preparedLimit} magia(s) excedente(s)`
            : `Escolha ${preparedLimit - selectedPrepared.length} magia(s) ${spellTypeLabel.toLowerCase()}`);
        }
        if (missing.length === 0) return null;
        return (
          <div className="rounded-lg border border-info/30 bg-info/5 p-3 space-y-1">
            {missing.map((m) => (
              <div key={m} className="flex items-center gap-2 text-sm text-info">
                <Info className="h-4 w-4 shrink-0" />
                <span>{m}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar magia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Level chips */}
          {availableLevels.map((l) => (
            <button
              key={l}
              onClick={() => setFilterLevel(filterLevel === l ? null : l)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filterLevel === l
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
              }`}
            >
              {LEVEL_LABELS[l] ?? `${l}º`}
            </button>
          ))}

          {/* School select */}
          <select
            value={filterSchool ?? ""}
            onChange={(e) => setFilterSchool(e.target.value || null)}
            className="rounded-full px-3 py-1 text-xs font-medium border bg-secondary text-secondary-foreground"
          >
            <option value="">Escola</option>
            {schools.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Toggles */}
          <button
            onClick={() => setFilterConcentration(!filterConcentration)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors flex items-center gap-1 ${
              filterConcentration
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
            }`}
          >
            <Eye className="h-3 w-3" /> Concentração
          </button>
          <button
            onClick={() => setFilterRitual(!filterRitual)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors flex items-center gap-1 ${
              filterRitual
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
            }`}
          >
            <Flame className="h-3 w-3" /> Ritual
          </button>

          {(filterLevel !== null || filterSchool || filterConcentration || filterRitual || search) && (
            <button
              onClick={() => {
                setFilterLevel(null);
                setFilterSchool(null);
                setFilterConcentration(false);
                setFilterRitual(false);
                setSearch("");
              }}
              className="rounded-full px-3 py-1 text-xs font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Spell List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma magia encontrada para os filtros selecionados.
          </p>
        ) : (
          visibleSpells.map((spell) => {
            const selected = isSelected(spell.id, spell.level);
            const atLimit = spell.level === 0
              ? selectedCantrips.length >= cantripsLimit
              : selectedPrepared.length >= preparedLimit;
            const disabled = !selected && atLimit;

            return (
              <div
                key={spell.id}
                className={`rounded-lg border p-3 flex items-center gap-3 transition-colors cursor-pointer ${
                  selected
                    ? "border-primary bg-primary/10"
                    : disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "bg-card hover:bg-secondary/50"
                }`}
                onClick={() => !disabled && toggleSpell(spell)}
              >
                {/* Toggle button */}
                <button
                  disabled={disabled}
                  title={disabled ? "Limite atingido" : selected ? "Remover" : "Adicionar"}
                  aria-label={selected ? "Remover magia" : "Adicionar magia"}
                  className={`shrink-0 rounded-full h-8 w-8 flex items-center justify-center border transition-colors ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled) toggleSpell(spell);
                  }}
                >
                  {selected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{spell.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {LEVEL_LABELS[spell.level]}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {spell.school}
                    </Badge>
                    {spell.concentration && (
                      <Badge variant="secondary" className="text-[10px]">C</Badge>
                    )}
                    {spell.ritual && (
                      <Badge variant="secondary" className="text-[10px]">R</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{spell.description}</p>
                </div>

                {/* Detail button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailSpell(spell);
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
        {visibleCount < filtered.length && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full rounded-lg border border-dashed py-2 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
          >
            Mostrar mais ({filtered.length - visibleCount} restantes)
          </button>
        )}
      </div>

      {/* Spell Detail Dialog */}
      <Dialog open={!!detailSpell} onOpenChange={() => setDetailSpell(null)}>
        <DialogContent className="max-w-lg">
          {detailSpell && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {detailSpell.name}
                  <Badge variant="outline">{LEVEL_LABELS[detailSpell.level]}</Badge>
                  <Badge variant="secondary">{detailSpell.school}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Detail label="Tempo de Conjuração" value={detailSpell.castingTime} />
                  <Detail label="Alcance" value={detailSpell.range} />
                  <Detail label="Componentes" value={detailSpell.components.join(", ")} />
                  <Detail label="Duração" value={detailSpell.duration} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {detailSpell.concentration && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" /> Concentração
                    </Badge>
                  )}
                  {detailSpell.ritual && (
                    <Badge variant="outline" className="text-xs">
                      <Flame className="h-3 w-3 mr-1" /> Ritual
                    </Badge>
                  )}
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm leading-relaxed">{detailSpell.description}</p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    Classes: {formatSpellClassesForDisplay(detailSpell).join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fonte: {detailSpell.source.book}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CounterChip({
  icon,
  label,
  current,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  max: number;
}) {
  const isFull = current === max;
  const isOver = current > max;
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
        isOver
          ? "border-destructive text-destructive"
          : isFull
          ? "border-success text-success"
          : "border-info text-info"
      }`}
    >
      {icon}
      <span>
        {label}: {current}/{max}
      </span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
