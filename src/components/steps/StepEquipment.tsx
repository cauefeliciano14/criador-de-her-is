import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { items, itemsById, type Item, type WeaponProperties, type ArmorProperties, type ShieldProperties, type InventoryEntry } from "@/data/items";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { calcArmorClass, buildAttacks, isArmorProficient } from "@/utils/equipment";
import { getChoicesRequirements } from "@/utils/choices";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Shield, Swords, AlertTriangle, Package, Coins, Trash2, Check, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_LABELS: Record<string, string> = {
  weapon: "Armas",
  armor: "Armaduras",
  shield: "Escudos",
  tool: "Ferramentas",
  gear: "Equipamento",
  pack: "Kits",
  other: "Outros",
};

export function StepEquipment() {
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const cls = classes.find((c) => c.id === char.class);
  const selectedBg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting != null;
  const hasEquipChoices = cls && cls.equipmentChoices.length > 0;
  const bgHasEquipChoices = (selectedBg?.equipmentChoices?.length ?? 0) > 0;
  const equipChoicePending = hasEquipChoices && !char.classEquipmentChoice;
  const bgEquipChoicePending = bgHasEquipChoices && !char.backgroundEquipmentChoice;
  const requirements = useMemo(() => getChoicesRequirements(char), [char]);
  const pendingChoicesCount = Object.values(requirements.buckets).reduce((sum, bucket) => sum + bucket.pendingCount, 0);

  // ── Catalog state ──
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const CATALOG_PAGE = 30;
  const [catalogVisible, setCatalogVisible] = useState(CATALOG_PAGE);

  function addItemsToInventory(inventory: InventoryEntry[], itemNames: string[]) {
    for (const itemName of itemNames) {
      const matched = items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
      const id = matched?.id ?? `custom_${itemName}`;
      const existing = inventory.find((e) => e.itemId === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        inventory.push({ itemId: id, quantity: 1, equipped: false, notes: matched ? "" : itemName });
      }
    }
  }

  // ── Select initial equipment A/B ──
  function selectEquipmentChoice(choiceId: string) {
    if (!cls) return;
    const choice = cls.equipmentChoices.find((c) => c.id === choiceId);
    if (!choice) return;

    const bgChoice = selectedBg?.equipmentChoices?.find((c) => c.id === char.backgroundEquipmentChoice);

    const newInventory: InventoryEntry[] = [];
    addItemsToInventory(newInventory, choice.items);

    if (bgChoice) {
      addItemsToInventory(newInventory, bgChoice.items);
    } else if (selectedBg?.equipment?.items) {
      addItemsToInventory(newInventory, selectedBg.equipment.items);
    }

    patchCharacter({
      classEquipmentChoice: choiceId,
      inventory: newInventory,
      equipped: { armor: null, shield: null, weapons: [] },
      gold: { gp: choice.gold + (bgChoice?.gold ?? selectedBg?.equipment?.gold ?? 0) },
    });
  }

  function selectBackgroundEquipmentChoice(choiceId: string) {
    const bgChoice = selectedBg?.equipmentChoices?.find((c) => c.id === choiceId);
    if (!bgChoice) return;

    const classChoice = cls?.equipmentChoices.find((c) => c.id === char.classEquipmentChoice);
    const newInventory: InventoryEntry[] = [];

    if (classChoice) {
      addItemsToInventory(newInventory, classChoice.items);
    }
    addItemsToInventory(newInventory, bgChoice.items);

    patchCharacter({
      backgroundEquipmentChoice: choiceId,
      inventory: newInventory,
      equipped: { armor: null, shield: null, weapons: [] },
      gold: { gp: (classChoice?.gold ?? 0) + bgChoice.gold },
    });
  }

  // ── Inventory operations ──
  function addItem(itemId: string) {
    const inv = [...char.inventory];
    const existing = inv.find((e) => e.itemId === itemId);
    if (existing) {
      existing.quantity += 1;
    } else {
      inv.push({ itemId, quantity: 1, equipped: false, notes: "" });
    }
    patchCharacter({ inventory: inv });
  }

  function removeItem(itemId: string) {
    const inv = char.inventory.filter((e) => e.itemId !== itemId);
    // Also unequip if equipped
    const eq = { ...char.equipped };
    if (eq.armor === itemId) eq.armor = null;
    if (eq.shield === itemId) eq.shield = null;
    eq.weapons = eq.weapons.filter((w) => w !== itemId);
    patchCharacter({ inventory: inv, equipped: eq });
  }

  function changeQuantity(itemId: string, delta: number) {
    const inv = char.inventory.map((e) => {
      if (e.itemId === itemId) {
        const newQ = Math.max(0, e.quantity + delta);
        return { ...e, quantity: newQ };
      }
      return e;
    }).filter((e) => e.quantity > 0);

    // If removed, unequip
    if (!inv.find((e) => e.itemId === itemId)) {
      const eq = { ...char.equipped };
      if (eq.armor === itemId) eq.armor = null;
      if (eq.shield === itemId) eq.shield = null;
      eq.weapons = eq.weapons.filter((w) => w !== itemId);
      patchCharacter({ inventory: inv, equipped: eq });
    } else {
      patchCharacter({ inventory: inv });
    }
  }

  // ── Equip operations ──
  function equipArmor(itemId: string | null) {
    patchCharacter({ equipped: { ...char.equipped, armor: itemId } });
  }

  function equipShield(itemId: string | null) {
    patchCharacter({ equipped: { ...char.equipped, shield: itemId } });
  }

  function toggleWeapon(itemId: string) {
    const weapons = char.equipped.weapons.includes(itemId)
      ? char.equipped.weapons.filter((w) => w !== itemId)
      : [...char.equipped.weapons, itemId];
    patchCharacter({ equipped: { ...char.equipped, weapons } });
  }

  // ── Validation ──
  useEffect(() => {
    const missing: string[] = [];
    if (equipChoicePending) {
      missing.push("Escolha seu equipamento inicial");
    }
    if (bgEquipChoicePending) {
      missing.push("Escolha seu equipamento inicial da origem");
    }
    if (pendingChoicesCount > 0) {
      missing.push(`Resolva escolhas pendentes (${pendingChoicesCount})`);
    }
    setMissing("equipment", missing);
    if (missing.length === 0) {
      completeStep("equipment");
    } else {
      uncompleteStep("equipment");
    }
  }, [char.classEquipmentChoice, char.backgroundEquipmentChoice, hasEquipChoices, bgHasEquipChoices, pendingChoicesCount]);

  // ── Filtered catalog items ──
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, typeFilter]);

  // Reset pagination on filter change
  useEffect(() => { setCatalogVisible(CATALOG_PAGE); }, [search, typeFilter]);

  const visibleItems = useMemo(() => filteredItems.slice(0, catalogVisible), [filteredItems, catalogVisible]);

  // ── Inventory items with data ──
  const inventoryItems = useMemo(() => {
    return char.inventory.map((entry) => {
      const item = itemsById[entry.itemId];
      return { entry, item };
    });
  }, [char.inventory]);

  // ── Available armors/shields/weapons in inventory ──
  const invArmors = inventoryItems.filter(({ item }) => item?.type === "armor");
  const invShields = inventoryItems.filter(({ item }) => item?.type === "shield");
  const invWeapons = inventoryItems.filter(({ item }) => item?.type === "weapon");

  const totalWeight = inventoryItems.reduce((sum, { entry, item }) => {
    return sum + (item?.weight ?? 0) * entry.quantity;
  }, 0);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1">5. Equipamento</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie seu inventário, equipe armas e armaduras, e veja seus ataques calculados.
        </p>
      </div>

      {/* ── Section 1: Initial Equipment Choice ── */}
      {hasEquipChoices && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Equipamento Inicial da Classe
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cls!.equipmentChoices.map((choice) => {
              const selected = char.classEquipmentChoice === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => selectEquipmentChoice(choice.id)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{choice.label}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  {choice.items.length > 0 ? (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {choice.items.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sem itens específicos</p>
                  )}
                  {choice.gold > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-warning">
                      <Coins className="h-3 w-3" />
                      {choice.gold} PO
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {equipChoicePending && (
            <div className="flex items-center gap-2 text-xs text-info">
              <AlertTriangle className="h-3.5 w-3.5" />
              Escolha obrigatória antes de avançar.
            </div>
          )}
        </section>
      )}

      {selectedBg?.equipmentChoices && selectedBg.equipmentChoices.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Package className="h-4 w-4" />
            Equipamento Inicial da Origem
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedBg.equipmentChoices.map((choice) => {
              const selected = char.backgroundEquipmentChoice === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => selectBackgroundEquipmentChoice(choice.id)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{choice.label}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  {choice.items.length > 0 ? (
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {choice.items.map((item, i) => (
                        <li key={i}>• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Sem itens específicos</p>
                  )}
                  {choice.gold > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-warning">
                      <Coins className="h-3 w-3" />
                      {choice.gold} PO
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {bgEquipChoicePending && (
            <div className="flex items-center gap-2 text-xs text-info">
              <AlertTriangle className="h-3.5 w-3.5" />
              Escolha obrigatória antes de avançar.
            </div>
          )}
        </section>
      )}

      {pendingChoicesCount > 0 && (
        <section className="space-y-2 rounded-lg border bg-card p-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Pendências obrigatórias</h3>
          <ul className="text-sm space-y-1">
            {Object.entries(requirements.buckets).filter(([, bucket]) => bucket.pendingCount > 0).map(([id, bucket]) => (
              <li key={id} className="text-warning">• {id}: {bucket.pendingCount} pendente(s)</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Section 2: Equip Items ── */}
      {char.inventory.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Equipar
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Armor */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Armadura</p>
              <select
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
                value={char.equipped.armor ?? ""}
                onChange={(e) => equipArmor(e.target.value || null)}
              >
                <option value="">Sem armadura</option>
                {invArmors.map(({ entry, item }) => (
                  <option key={entry.itemId} value={entry.itemId}>
                    {item?.name ?? entry.itemId}
                  </option>
                ))}
              </select>
              {char.equipped.armor && (() => {
                const a = itemsById[char.equipped.armor];
                if (!a) return null;
                const prof = isArmorProficient(a, char.proficiencies.armor);
                const props = a.properties as ArmorProperties;
                return (
                  <div className="space-y-1 text-xs">
                    <span>CA base: {props.baseAC} {props.dexCap !== null ? `(DES máx +${props.dexCap})` : "(DES total)"}</span>
                    {!prof && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertTriangle className="h-3 w-3" />
                        Não proficiente
                      </div>
                    )}
                    {props.stealthDisadvantage && (
                      <div className="flex items-center gap-1 text-warning">
                        <AlertTriangle className="h-3 w-3" />
                        Desvantagem em Furtividade
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Shield */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Escudo</p>
              <select
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
                value={char.equipped.shield ?? ""}
                onChange={(e) => equipShield(e.target.value || null)}
              >
                <option value="">Sem escudo</option>
                {invShields.map(({ entry, item }) => (
                  <option key={entry.itemId} value={entry.itemId}>
                    {item?.name ?? entry.itemId}
                  </option>
                ))}
              </select>
              {char.equipped.shield && (() => {
                const s = itemsById[char.equipped.shield];
                if (!s) return null;
                const prof = isArmorProficient(s, char.proficiencies.armor);
                return !prof ? (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="h-3 w-3" />
                    Não proficiente com escudos
                  </div>
                ) : null;
              })()}
            </div>

            {/* Weapons */}
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Armas</p>
              <div className="space-y-1">
                {invWeapons.map(({ entry, item }) => {
                  if (!item) return null;
                  const equipped = char.equipped.weapons.includes(entry.itemId);
                  return (
                    <label key={entry.itemId} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={equipped}
                        onChange={() => toggleWeapon(entry.itemId)}
                        className="rounded"
                      />
                      <span className={equipped ? "font-medium" : "text-muted-foreground"}>{item.name}</span>
                    </label>
                  );
                })}
                {invWeapons.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhuma arma no inventário</p>
                )}
              </div>
            </div>
          </div>

          {/* AC Display */}
          <div className="flex items-center justify-center gap-8 rounded-lg border bg-card p-3">
            <div className="text-center">
              <p className="text-xs uppercase text-muted-foreground">CA Final</p>
              <p className="text-3xl font-bold text-primary">{char.armorClass}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase text-muted-foreground">Ouro</p>
              <p className="text-xl font-bold text-warning">{char.gold?.gp ?? 0} PO</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Section 3: Attacks ── */}
      {char.attacks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Ataques
          </h3>
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="text-left px-3 py-2 text-xs uppercase text-muted-foreground">Arma</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Ataque</th>
                  <th className="text-left px-3 py-2 text-xs uppercase text-muted-foreground">Dano</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Alcance</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Prof.</th>
                </tr>
              </thead>
              <tbody>
                {char.attacks.map((atk) => (
                  <tr key={atk.weaponId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{atk.name}</td>
                    <td className="px-3 py-2 text-center font-mono">
                      {atk.attackBonus >= 0 ? "+" : ""}{atk.attackBonus}
                    </td>
                    <td className="px-3 py-2 text-xs">{atk.damage}</td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{atk.range}</td>
                    <td className="px-3 py-2 text-center">
                      {atk.proficient ? (
                        <Check className="h-3.5 w-3.5 text-success mx-auto" />
                      ) : (
                        <span className="text-xs text-warning">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Section 4: Spells (if spellcaster) ── */}
      {isSpellcaster && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Truques e Magias
          </h3>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Escolha seus truques e magias conhecidas/preparadas.
            </p>
            {/* Placeholder for spells selection */}
            <p className="text-xs text-muted-foreground">Funcionalidade de magias será implementada aqui.</p>
          </div>
        </section>
      )}

      {/* ── Section 5: Inventory ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Inventário ({char.inventory.length} itens)
        </h3>
        {char.inventory.length > 0 ? (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/30">
                  <th className="text-left px-3 py-2 text-xs uppercase text-muted-foreground">Item</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Qtd</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Peso</th>
                  <th className="text-center px-3 py-2 text-xs uppercase text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(({ entry, item }) => (
                  <tr key={entry.itemId} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <span className="font-medium">{item?.name ?? entry.notes ?? entry.itemId}</span>
                      {item && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">{item.category}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => changeQuantity(entry.itemId, -1)}
                          className="rounded p-0.5 hover:bg-secondary"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-mono">{entry.quantity}</span>
                        <button
                          onClick={() => changeQuantity(entry.itemId, 1)}
                          className="rounded p-0.5 hover:bg-secondary"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                      {item ? `${(item.weight * entry.quantity).toFixed(1)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => removeItem(entry.itemId)}
                        className="rounded p-1 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm">
            Selecione seu equipamento inicial acima para popular o inventário.
          </div>
        )}
      </section>

      {/* ── Section 6: Item Catalog ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Catálogo de Itens
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>Todos</FilterChip>
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <FilterChip key={key} active={typeFilter === key} onClick={() => setTypeFilter(key)}>
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
          {visibleItems.map((item) => (
            <CatalogCard key={item.id} item={item} onAdd={() => addItem(item.id)} />
          ))}
          {catalogVisible < filteredItems.length && (
            <button
              onClick={() => setCatalogVisible((c) => c + CATALOG_PAGE)}
              className="col-span-full rounded-lg border border-dashed py-2 text-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              Mostrar mais ({filteredItems.length - catalogVisible} restantes)
            </button>
          )}
          {filteredItems.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              Nenhum item encontrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {children}
    </button>
  );
}

function CatalogCard({ item, onAdd }: { item: Item; onAdd: () => void }) {
  const isWeapon = item.type === "weapon";
  const isArmor = item.type === "armor";
  const isShield = item.type === "shield";

  return (
    <div className="rounded-lg border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium leading-tight">{item.name}</p>
          <p className="text-[10px] text-muted-foreground">{item.category}</p>
        </div>
        <button
          onClick={onAdd}
          className="shrink-0 rounded p-1 text-primary hover:bg-primary/10"
          title="Adicionar ao inventário"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-1 flex-wrap">
        {item.cost.gp > 0 && (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">{item.cost.gp} PO</Badge>
        )}
        {item.weight > 0 && (
          <Badge variant="outline" className="text-[10px] py-0 px-1.5">{item.weight} lb</Badge>
        )}
        {isWeapon && (() => {
          const p = item.properties as WeaponProperties;
          return (
            <>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{p.damageDice} {p.damageType}</Badge>
              {p.finesse && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Acuidade</Badge>}
              {p.versatile && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Versátil {p.versatile}</Badge>}
              {p.twoHanded && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Duas Mãos</Badge>}
              {p.light && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Leve</Badge>}
            </>
          );
        })()}
        {isArmor && (() => {
          const p = item.properties as ArmorProperties;
          return (
            <>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">CA {p.baseAC}</Badge>
              {p.stealthDisadvantage && <Badge variant="destructive" className="text-[10px] py-0 px-1.5">Furtividade ✗</Badge>}
            </>
          );
        })()}
        {isShield && (
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5">CA +{(item.properties as ShieldProperties).acBonus}</Badge>
        )}
      </div>
    </div>
  );
}
