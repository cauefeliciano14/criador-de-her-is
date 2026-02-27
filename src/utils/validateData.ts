/**
 * Comprehensive data validation and audit for development.
 * Validates schema, cross-references, and spell coverage for levels 1–2.
 */

export interface ValidationIssue {
  severity: "error" | "warning";
  dataset: string;
  id?: string;
  message: string;
}

interface HasId { id: string; name?: string }

/** Validate that all entries have unique, non-empty ids and names */
function validateIds(entries: HasId[], dataset: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (!e.id || typeof e.id !== "string") {
      issues.push({ severity: "error", dataset, id: e.id, message: `ID vazio ou inválido` });
    }
    if (seen.has(e.id)) {
      issues.push({ severity: "error", dataset, id: e.id, message: `ID duplicado: "${e.id}"` });
    }
    seen.add(e.id);
    if (e.name !== undefined && (!e.name || typeof e.name !== "string")) {
      issues.push({ severity: "warning", dataset, id: e.id, message: `Nome vazio para id "${e.id}"` });
    }
  }
  return issues;
}

/** Validate classes data */
function validateClasses(classes: any[], itemNames: Set<string>): ValidationIssue[] {
  const issues = validateIds(classes, "classes");
  for (const cls of classes) {
    if (!cls.hitDie || typeof cls.hitDie !== "number") {
      issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `hitDie ausente ou inválido` });
    }
    if (!Array.isArray(cls.savingThrows) || cls.savingThrows.length === 0) {
      issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `savingThrows vazio` });
    }
    if (!Array.isArray(cls.asiLevels) || cls.asiLevels.length === 0) {
      issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `asiLevels vazio` });
    }
    // proficiencies
    if (!cls.proficiencies) {
      issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `proficiencies ausente` });
    }
    // skillChoices
    if (!cls.skillChoices || !cls.skillChoices.choose || !cls.skillChoices.from?.length) {
      issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `skillChoices ausente ou incompleto` });
    }
    // featuresByLevel
    if (cls.featuresByLevel) {
      const hasLvl1 = cls.featuresByLevel.some((fl: any) => fl.level === 1);
      const hasLvl2 = cls.featuresByLevel.some((fl: any) => fl.level === 2);
      if (!hasLvl1) issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `Sem features de nível 1` });
      if (!hasLvl2) issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `Sem features de nível 2` });
      for (const fl of cls.featuresByLevel) {
        if (fl.level < 1 || fl.level > 20) {
          issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `featuresByLevel com nível inválido: ${fl.level}` });
        }
      }
    } else {
      issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `featuresByLevel ausente` });
    }
    // equipmentChoices cross-ref (items matched by name)
    if (cls.equipmentChoices) {
      for (const choice of cls.equipmentChoices) {
        if (choice.items.length === 0 && choice.gold === 0) {
          issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `Escolha "${choice.label}" sem itens nem ouro` });
        }
        for (const itemName of choice.items) {
          if (itemNames.size > 0 && !itemNames.has(itemName.toLowerCase())) {
            issues.push({ severity: "warning", dataset: "classes", id: cls.id, message: `Equipamento "${itemName}" não encontrado em items` });
          }
        }
      }
    }
    // Spellcasting consistency
    if (cls.spellcasting) {
      if (!cls.spellcasting.ability) {
        issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `spellcasting.ability ausente` });
      }
      if (!cls.spellcasting.cantripsKnownAtLevel) {
        issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `spellcasting.cantripsKnownAtLevel ausente` });
      }
      if (!cls.spellcasting.spellSlotsByLevel) {
        issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `spellcasting.spellSlotsByLevel ausente` });
      }
    }
  }
  return issues;
}

/** Validate races data */
function validateRaces(races: any[]): ValidationIssue[] {
  const issues = validateIds(races, "races");
  for (const r of races) {
    if (!r.speed || typeof r.speed !== "number") {
      issues.push({ severity: "warning", dataset: "races", id: r.id, message: `speed ausente` });
    }
    if (!r.size) {
      issues.push({ severity: "warning", dataset: "races", id: r.id, message: `size ausente` });
    }
    if (!r.languages || r.languages.length === 0) {
      issues.push({ severity: "warning", dataset: "races", id: r.id, message: `languages vazio` });
    }
    if (!r.traits || r.traits.length === 0) {
      issues.push({ severity: "warning", dataset: "races", id: r.id, message: `Nenhum traço racial definido` });
    }
    if (r.subraces) {
      issues.push(...validateIds(r.subraces, `races/${r.id}/subraces`));
    }
  }
  return issues;
}

/** Validate backgrounds data */
function validateBackgrounds(backgrounds: any[], featIds: Set<string>): ValidationIssue[] {
  const issues = validateIds(backgrounds, "backgrounds");
  for (const bg of backgrounds) {
    // abilityOptions (must be exactly 3)
    if (!bg.abilityOptions || !Array.isArray(bg.abilityOptions)) {
      issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `abilityOptions ausente` });
    } else if (bg.abilityOptions.length !== 3) {
      issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `abilityOptions deve ter exatamente 3 atributos (tem ${bg.abilityOptions.length})` });
    }
    // skills (at least 2)
    if (!bg.skills || bg.skills.length < 2) {
      issues.push({ severity: "warning", dataset: "backgrounds", id: bg.id, message: `Menos de 2 perícias definidas` });
    }
    // originFeat
    if (bg.originFeat) {
      if (!bg.originFeat.id) {
        issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `originFeat sem id` });
      } else if (featIds.size > 0 && !featIds.has(bg.originFeat.id)) {
        issues.push({ severity: "warning", dataset: "backgrounds", id: bg.id, message: `originFeat "${bg.originFeat.id}" não encontrado em feats` });
      }
    } else {
      issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `originFeat ausente` });
    }
    // equipment
    if (!bg.equipment) {
      issues.push({ severity: "warning", dataset: "backgrounds", id: bg.id, message: `equipment ausente` });
    }
    // abilityBonuses
    if (!bg.abilityBonuses) {
      issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `abilityBonuses ausente` });
    }
  }
  return issues;
}

/** Validate spells - check that classes referenced exist */
function validateSpells(spells: any[], classNames: Set<string>): ValidationIssue[] {
  const issues = validateIds(spells, "spells");
  for (const sp of spells) {
    if (sp.level < 0 || sp.level > 9) {
      issues.push({ severity: "error", dataset: "spells", id: sp.id, message: `Nível de magia inválido: ${sp.level}` });
    }
    if (!sp.school) {
      issues.push({ severity: "warning", dataset: "spells", id: sp.id, message: `Escola de magia ausente` });
    }
    if (!sp.description) {
      issues.push({ severity: "warning", dataset: "spells", id: sp.id, message: `description ausente` });
    }
    if (sp.classes) {
      for (const c of sp.classes) {
        if (!classNames.has(c)) {
          issues.push({ severity: "warning", dataset: "spells", id: sp.id, message: `Classe "${c}" referenciada não encontrada` });
        }
      }
    }
  }
  return issues;
}

/** Validate feats */
function validateFeats(feats: any[]): ValidationIssue[] {
  const issues = validateIds(feats, "feats");
  for (const f of feats) {
    if (!f.type || !["asi", "general", "origin", "epic"].includes(f.type)) {
      issues.push({ severity: "warning", dataset: "feats", id: f.id, message: `Tipo de talento inválido: "${f.type}"` });
    }
    if (!f.description) {
      issues.push({ severity: "warning", dataset: "feats", id: f.id, message: `Descrição ausente` });
    }
  }
  return issues;
}

/** Validate items - schema checks for armor/shield/weapon */
function validateItems(items: any[]): ValidationIssue[] {
  const issues = validateIds(items, "items");
  for (const item of items) {
    if (!item.type) {
      issues.push({ severity: "error", dataset: "items", id: item.id, message: `type ausente` });
    }
    if (item.type === "armor" && item.properties) {
      const p = item.properties;
      if (p.baseAC === undefined) issues.push({ severity: "error", dataset: "items", id: item.id, message: `armor sem baseAC` });
    }
    if (item.type === "shield" && item.properties) {
      const p = item.properties;
      if (p.acBonus === undefined) issues.push({ severity: "error", dataset: "items", id: item.id, message: `shield sem acBonus` });
    }
    if (item.type === "weapon" && item.properties) {
      const p = item.properties;
      if (!p.damageDice) issues.push({ severity: "error", dataset: "items", id: item.id, message: `weapon sem damageDice` });
      if (!p.damageType) issues.push({ severity: "error", dataset: "items", id: item.id, message: `weapon sem damageType` });
    }
  }
  return issues;
}

/** Validate spell coverage for caster classes at levels 1–2 */
function validateSpellCoverage(classes: any[], spells: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const casterClasses = classes.filter((c: any) => c.spellcasting != null);
  
  for (const cls of casterClasses) {
    const className = cls.name;
    const classSpells = spells.filter((s: any) => s.classes?.includes(className));
    const cantrips = classSpells.filter((s: any) => s.level === 0);
    const level1Spells = classSpells.filter((s: any) => s.level === 1);
    
    if (cantrips.length === 0) {
      issues.push({ severity: "error", dataset: "spells", id: cls.id, message: `Nenhum truque (nível 0) para a classe "${className}"` });
    }
    if (level1Spells.length === 0) {
      issues.push({ severity: "error", dataset: "spells", id: cls.id, message: `Nenhuma magia de 1º círculo para a classe "${className}"` });
    }
    
    // Check cantrips limit vs available
    if (cls.spellcasting.cantripsKnownAtLevel) {
      const cantripsNeeded = cls.spellcasting.cantripsKnownAtLevel[1] ?? 0;
      if (cantripsNeeded > 0 && cantrips.length < cantripsNeeded) {
        issues.push({ severity: "warning", dataset: "spells", id: cls.id, message: `${className}: apenas ${cantrips.length} truques disponíveis, mas precisa de ${cantripsNeeded} no nível 1` });
      }
    }
  }
  return issues;
}

/** Run all validations. Call in dev mode. */
export function validateAllData(datasets: {
  classes?: any[];
  races?: any[];
  backgrounds?: any[];
  spells?: any[];
  items?: any[];
  feats?: any[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Build lookup sets
  const itemNames = new Set((datasets.items ?? []).map((i: any) => (i.name as string).toLowerCase()));
  const featIds = new Set((datasets.feats ?? []).map((f: any) => f.id));
  const classNames = new Set((datasets.classes ?? []).map((c: any) => c.name));

  if (datasets.classes) issues.push(...validateClasses(datasets.classes, itemNames));
  if (datasets.races) issues.push(...validateRaces(datasets.races));
  if (datasets.backgrounds) issues.push(...validateBackgrounds(datasets.backgrounds, featIds));
  if (datasets.items) issues.push(...validateItems(datasets.items));
  if (datasets.feats) issues.push(...validateFeats(datasets.feats));
  if (datasets.spells) issues.push(...validateSpells(datasets.spells, classNames));
  
  // Cross-reference: spell coverage for caster classes
  if (datasets.classes && datasets.spells) {
    issues.push(...validateSpellCoverage(datasets.classes, datasets.spells));
  }

  return issues;
}

/** Log validation results to console (dev only) */
export function logValidation(issues: ValidationIssue[]): void {
  if (issues.length === 0) {
    console.log("%c✅ Data validation passed — all datasets OK", "color: green; font-weight: bold");
    return;
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (errors.length > 0) {
    console.group(`%c❌ ${errors.length} data error(s)`, "color: red; font-weight: bold");
    for (const e of errors) console.error(`[${e.dataset}${e.id ? `/${e.id}` : ""}] ${e.message}`);
    console.groupEnd();
  }

  if (warnings.length > 0) {
    console.group(`%c⚠️ ${warnings.length} data warning(s)`, "color: orange; font-weight: bold");
    for (const w of warnings) console.warn(`[${w.dataset}${w.id ? `/${w.id}` : ""}] ${w.message}`);
    console.groupEnd();
  }

  console.log(`%c📊 Audit summary: ${errors.length} errors, ${warnings.length} warnings`, "color: blue; font-weight: bold");
}
