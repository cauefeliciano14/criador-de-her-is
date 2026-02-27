import { spells } from "@/data/spells";
import { SPELLS_CANON_2024 } from "./spellCanon";

/**
 * DEV-only: Audit spells dataset against the canonical spell list extracted from the operational DOCX
 * and confirmed against the official PDF.
 *
 * The app continues running; this is diagnostic output only.
 */
export function runSpellCanonAudit(): void {
  const canonSet = new Set(SPELLS_CANON_2024.map((s) => s.name));
  const dataSet = new Set(spells.map((s) => s.name));

  const extras = [...dataSet].filter((n) => !canonSet.has(n)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const missing = [...canonSet].filter((n) => !dataSet.has(n)).sort((a, b) => a.localeCompare(b, "pt-BR"));

  if (extras.length === 0 && missing.length === 0) {
    console.log("%c✅ Spell Canon Audit: OK — spells dataset matches canon list", "color: green; font-weight: bold");
    return;
  }

  console.group("%c📚 Spell Canon Audit (DEV)", "color: #0ea5e9; font-weight: bold");
  console.log(`Canon: ${canonSet.size} | Dataset: ${dataSet.size}`);
  if (extras.length) {
    console.group(`%cExtras no dataset (${extras.length})`, "color: orange; font-weight: bold");
    for (const n of extras) console.warn(n);
    console.groupEnd();
  }
  if (missing.length) {
    console.group(`%cFaltando no dataset (${missing.length})`, "color: red; font-weight: bold");
    for (const n of missing) console.error(n);
    console.groupEnd();
  }
  console.groupEnd();
}
