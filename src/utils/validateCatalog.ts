/**
 * Validação de catálogo oficial.
 * Verifica que os dados possuem exatamente os IDs esperados — sem faltantes nem extras.
 */
import {
  EXPECTED_CLASS_IDS,
  EXPECTED_BACKGROUND_IDS,
  EXPECTED_RACE_IDS,
} from "@/data/catalogExpectations";
import { races } from "@/data/races";

export interface CatalogIssue {
  dataset: "classes" | "backgrounds" | "races";
  missing: string[];
  extra: string[];
}

export interface CatalogValidationResult {
  valid: boolean;
  issues: CatalogIssue[];
  raceChoiceIssues: string[];
}

function validateSet(
  dataset: CatalogIssue["dataset"],
  expected: readonly string[],
  actual: string[]
): CatalogIssue | null {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((id) => !actualSet.has(id));
  const extra = actual.filter((id) => !expectedSet.has(id));
  if (missing.length === 0 && extra.length === 0) return null;
  return { dataset, missing, extra };
}

export function validateCatalog(data: {
  classIds: string[];
  backgroundIds: string[];
  raceIds: string[];
}): CatalogValidationResult {
  const issues: CatalogIssue[] = [];
  const raceChoiceIssues: string[] = [];

  const classIssue = validateSet("classes", EXPECTED_CLASS_IDS, data.classIds);
  if (classIssue) issues.push(classIssue);

  const bgIssue = validateSet("backgrounds", EXPECTED_BACKGROUND_IDS, data.backgroundIds);
  if (bgIssue) issues.push(bgIssue);

  const raceIssue = validateSet("races", EXPECTED_RACE_IDS, data.raceIds);
  if (raceIssue) issues.push(raceIssue);

  // Validate race choices
  for (const race of races) {
    if (race.raceChoice) {
      const optionIds = race.raceChoice.options.map(o => o.id);
      const uniqueIds = new Set(optionIds);
      if (uniqueIds.size !== optionIds.length) {
        raceChoiceIssues.push(`Raça ${race.name}: IDs de opções duplicados`);
      }
      if (race.raceChoice.options.length === 0) {
        raceChoiceIssues.push(`Raça ${race.name}: raceChoice sem opções`);
      }
      for (const option of race.raceChoice.options) {
        if (!option.id || !option.name || !option.description) {
          raceChoiceIssues.push(`Raça ${race.name}, opção ${option.id}: campos obrigatórios faltando`);
        }
      }
    }
  }

  return { valid: issues.length === 0 && raceChoiceIssues.length === 0, issues, raceChoiceIssues };
}

export function formatCatalogIssues(issues: CatalogIssue[], raceChoiceIssues: string[]): string[] {
  const lines: string[] = [];
  for (const issue of issues) {
    const label = issue.dataset === "classes" ? "Classes" : issue.dataset === "backgrounds" ? "Antecedentes" : "Raças";
    if (issue.missing.length > 0) {
      lines.push(`${label} — faltando: ${issue.missing.join(", ")}`);
    }
    if (issue.extra.length > 0) {
      lines.push(`${label} — extras: ${issue.extra.join(", ")}`);
    }
  }
  for (const issue of raceChoiceIssues) {
    lines.push(`RaceChoice — ${issue}`);
  }
  return lines;
}
