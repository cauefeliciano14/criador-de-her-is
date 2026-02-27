import { itemsById } from "@/data/items";
import { EXPECTED_BACKGROUND_IDS, EXPECTED_CLASS_IDS, EXPECTED_RACE_IDS } from "@/data/catalogExpectations";

export interface ValidationIssue {
  severity: "error" | "warning";
  dataset: string;
  id?: string;
  message: string;
}

export interface DevAuditStatus {
  totalErrors: number;
  totalWarnings: number;
}

let devAuditStatus: DevAuditStatus = { totalErrors: 0, totalWarnings: 0 };

const PLACEHOLDER_RX = /(à\s+sua\s+escolha|pendente|todo|tbd|placeholder)/i;

function idsUnique(entries: Array<{ id: string; name?: string }>, dataset: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.id) issues.push({ severity: "error", dataset, message: "id vazio" });
    if (seen.has(entry.id)) issues.push({ severity: "error", dataset, id: entry.id, message: "id duplicado" });
    seen.add(entry.id);
    if (entry.name && PLACEHOLDER_RX.test(entry.name)) {
      issues.push({ severity: "warning", dataset, id: entry.id, message: `Nome com placeholder: ${entry.name}` });
    }
  }
  return issues;
}

function validateCatalogCounts(classes: any[], backgrounds: any[], races: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (classes.length !== EXPECTED_CLASS_IDS.length) issues.push({ severity: "error", dataset: "classes", message: `Catálogo deve ter ${EXPECTED_CLASS_IDS.length} classes (tem ${classes.length})` });
  if (backgrounds.length !== EXPECTED_BACKGROUND_IDS.length) issues.push({ severity: "error", dataset: "backgrounds", message: `Catálogo deve ter ${EXPECTED_BACKGROUND_IDS.length} antecedentes (tem ${backgrounds.length})` });
  if (races.length !== EXPECTED_RACE_IDS.length) issues.push({ severity: "error", dataset: "races", message: `Catálogo deve ter ${EXPECTED_RACE_IDS.length} raças (tem ${races.length})` });
  return issues;
}

function validatePlaceholderUsage(dataset: string, payload: any): ValidationIssue[] {
  const text = JSON.stringify(payload);
  if (!PLACEHOLDER_RX.test(text)) return [];
  return [{ severity: "warning", dataset, message: "Encontrado placeholder textual (à sua escolha/pendente/etc.)" }];
}



function validateEquipmentChoices(classes: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const cls of classes) {
    if (!Array.isArray(cls.equipmentChoices) || cls.equipmentChoices.length < 2) {
      issues.push({ severity: "error", dataset: "classes", id: cls.id, message: "equipmentChoices incompleto (mínimo A/B)" });
      continue;
    }
    for (const choice of cls.equipmentChoices) {
      if (!Array.isArray(choice.items)) {
        issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `choice ${choice.id} sem items[]` });
        continue;
      }
      for (const entry of choice.items) {
        if (typeof entry === "string") continue;
        if (!entry?.itemId || !itemsById[entry.itemId]) {
          issues.push({ severity: "error", dataset: "classes", id: cls.id, message: `itemId inválido em ${choice.id}: ${entry?.itemId}` });
        }
      }
    }
  }
  return issues;
}

function validateCrossRefs(classes: any[], backgrounds: any[], spells: any[], feats: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const classNameSet = new Set(classes.map((c) => c.name));
  const featIds = new Set(feats.map((f) => f.id));

  for (const spell of spells) {
    if (!Array.isArray(spell.classes)) continue;
    for (const className of spell.classes) {
      if (!classNameSet.has(className)) {
        issues.push({ severity: "error", dataset: "spells", id: spell.id, message: `Classe não encontrada em spell.classes: ${className}` });
      }
    }
    if (Array.isArray(spell.classes) && spell.classes.length > 0) {
      issues.push({ severity: "warning", dataset: "spells", id: spell.id, message: "wiring por name/classes detectado; prefira indexação por ID" });
    }
  }

  for (const bg of backgrounds) {
    if (bg.originFeat && !featIds.has(bg.originFeat)) {
      issues.push({ severity: "error", dataset: "backgrounds", id: bg.id, message: `originFeat inexistente: ${bg.originFeat}` });
    }
  }

  return issues;
}

export function validateAllData(datasets: {
  classes?: any[];
  races?: any[];
  backgrounds?: any[];
  spells?: any[];
  items?: any[];
  feats?: any[];
}): ValidationIssue[] {
  const classes = datasets.classes ?? [];
  const races = datasets.races ?? [];
  const backgrounds = datasets.backgrounds ?? [];
  const spells = datasets.spells ?? [];
  const items = datasets.items ?? [];
  const feats = datasets.feats ?? [];

  const issues: ValidationIssue[] = [
    ...idsUnique(classes, "classes"),
    ...idsUnique(races, "races"),
    ...idsUnique(backgrounds, "backgrounds"),
    ...idsUnique(spells, "spells"),
    ...idsUnique(items, "items"),
    ...idsUnique(feats, "feats"),
    ...validateCatalogCounts(classes, backgrounds, races),
    ...validatePlaceholderUsage("classes", classes),
    ...validatePlaceholderUsage("backgrounds", backgrounds),
    ...validatePlaceholderUsage("races", races),
    ...validateCrossRefs(classes, backgrounds, spells, feats),
    ...validateEquipmentChoices(classes),
  ];

  devAuditStatus = {
    totalErrors: issues.filter((i) => i.severity === "error").length,
    totalWarnings: issues.filter((i) => i.severity === "warning").length,
  };

  return issues;
}

export function logValidation(issues: ValidationIssue[]): void {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  console.group("[DEV AUDIT] data validation");
  console.log(`totalErrors=${errors.length}`);
  console.log(`totalWarnings=${warnings.length}`);
  if (errors.length) errors.forEach((e) => console.error(`[${e.dataset}${e.id ? `/${e.id}` : ""}] ${e.message}`));
  if (warnings.length) warnings.forEach((w) => console.warn(`[${w.dataset}${w.id ? `/${w.id}` : ""}] ${w.message}`));
  console.groupEnd();
}

export function getDevAuditStatus(): DevAuditStatus {
  return devAuditStatus;
}
