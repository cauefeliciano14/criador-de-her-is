/**
 * Export / Import / Share utilities for character data.
 * All functions are pure and client-side only.
 */
import type { CharacterState } from "@/state/characterStore";
import { races } from "@/data/races";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { spells as spellsData } from "@/data/spells";
import {
  ABILITIES, ABILITY_SHORT, ABILITY_LABELS,
  calcAbilityMod, getFinalAbilityScores, ALL_SKILLS,
  type AbilityKey,
} from "@/utils/calculations";

// ── Constants ──
export const APP_VERSION = "1.0.0";
export const SCHEMA_VERSION = "1.0.0";
const SUPPORTED_SCHEMA_VERSIONS = ["1.0.0"];

// ── Types ──
export interface ExportMeta {
  appVersion: string;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
  sources: string[];
}

export interface ExportPayload {
  meta: ExportMeta;
  characterData: CharacterPrimaryData;
}

/** Primary data needed to fully reconstruct a character */
export interface CharacterPrimaryData {
  name: string;
  level: number;
  race: string | null;
  subrace: string | null;
  class: string | null;
  subclass: string | null;
  background: string | null;
  abilityGeneration: CharacterState["abilityGeneration"];
  abilityScores: Record<AbilityKey, number>;
  racialBonuses: Record<AbilityKey, number>;
  raceAbilityChoices: Partial<Record<AbilityKey, number>>;
  raceChoices: CharacterState["raceChoices"];
  backgroundBonuses: Record<AbilityKey, number>;
  backgroundAbilityChoices: Partial<Record<AbilityKey, number>>;
  asiBonuses: Record<AbilityKey, number>;
  featAbilityBonuses: Record<AbilityKey, number>;
  savingThrows: string[];
  skills: string[];
  classSkillChoices: string[];
  classEquipmentChoice: string | null;
  backgroundEquipmentChoice: string | null;
  proficiencies: CharacterState["proficiencies"];
  hitDie: number;
  hitPoints: CharacterState["hitPoints"];
  armorClass: number;
  speed: number;
  features: CharacterState["features"];
  spells: CharacterState["spells"];
  equipment: string[];
  inventory: CharacterState["inventory"];
  equipped: CharacterState["equipped"];
  gold: CharacterState["gold"];
  attacks: CharacterState["attacks"];
  appliedFeats: CharacterState["appliedFeats"];
  flags: Record<string, number | boolean>;
  leveling: CharacterState["leveling"];
}

export interface SharePayload {
  n: string;        // name
  lv: number;       // level
  r: string | null;  // raceId
  c: string | null;  // classId
  sc: string | null;  // subclassId
  bg: string | null;  // backgroundId
  ab: Record<AbilityKey, number>;  // final scores
  hp: number;
  ac: number;
  atk: { n: string; b: number; d: string }[];
  sp: string[];  // spell ids (cantrips + prepared)
}

export interface ImportResult {
  success: boolean;
  data?: CharacterPrimaryData;
  errors: string[];
  warnings: string[];
}

// ── Sanitize: remove transient/internal fields ──
function sanitizeForExport(char: CharacterState): CharacterPrimaryData {
  return {
    name: char.name,
    level: char.level,
    race: char.race,
    subrace: char.subrace,
    class: char.class,
    subclass: char.subclass,
    background: char.background,
    abilityGeneration: {
      ...char.abilityGeneration,
    },
    abilityScores: { ...char.abilityScores },
    racialBonuses: { ...char.racialBonuses },
    raceAbilityChoices: { ...char.raceAbilityChoices },
    raceChoices: { ...char.raceChoices },
    backgroundBonuses: { ...char.backgroundBonuses },
    backgroundAbilityChoices: { ...char.backgroundAbilityChoices },
    asiBonuses: { ...char.asiBonuses },
    featAbilityBonuses: { ...char.featAbilityBonuses },
    savingThrows: [...char.savingThrows],
    skills: [...char.skills],
    classSkillChoices: [...char.classSkillChoices],
    classEquipmentChoice: char.classEquipmentChoice,
    backgroundEquipmentChoice: char.backgroundEquipmentChoice,
    proficiencies: {
      armor: [...char.proficiencies.armor],
      weapons: [...char.proficiencies.weapons],
      tools: [...char.proficiencies.tools],
      languages: [...char.proficiencies.languages],
    },
    hitDie: char.hitDie,
    hitPoints: { ...char.hitPoints },
    armorClass: char.armorClass,
    speed: char.speed,
    features: char.features.map((f) => ({ ...f })),
    spells: { ...char.spells, cantrips: [...char.spells.cantrips], prepared: [...char.spells.prepared], slots: [...char.spells.slots] },
    equipment: [...char.equipment],
    inventory: char.inventory.map((e) => ({ ...e })),
    equipped: { armor: char.equipped.armor, shield: char.equipped.shield, weapons: [...char.equipped.weapons] },
    gold: { ...char.gold },
    attacks: char.attacks.map((a) => ({ ...a })),
    appliedFeats: char.appliedFeats.map((f) => ({ ...f })),
    flags: { ...char.flags },
    leveling: {
      ...char.leveling,
      pending: false, // never export pending state
      hpRolls: { ...char.leveling.hpRolls },
      choices: {
        subclassId: char.leveling.choices.subclassId,
        asiOrFeat: { ...char.leveling.choices.asiOrFeat },
      },
      changesSummary: [],
    },
  };
}

// ══════════════════════════════════════════
// 1) EXPORT JSON
// ══════════════════════════════════════════
export function buildExportPayload(char: CharacterState): ExportPayload {
  const now = new Date().toISOString();
  return {
    meta: {
      appVersion: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      sources: ["phb2024-ptbr"],
    },
    characterData: sanitizeForExport(char),
  };
}

export function downloadCharacterJSON(char: CharacterState): void {
  const payload = buildExportPayload(char);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `personagem-${(char.name || "sem-nome").toLowerCase().replace(/\s+/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════
// 2) IMPORT JSON
// ══════════════════════════════════════════
export function migrateCharacterSchema(
  data: any,
  fromVersion: string
): { data: CharacterPrimaryData; migrated: boolean } | null {
  // Currently only v1.0.0 is supported; future migrations go here
  if (fromVersion === "1.0.0") {
    return { data: data as CharacterPrimaryData, migrated: false };
  }
  return null;
}

export function validateImportPayload(raw: unknown): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || typeof raw !== "object") {
    return { success: false, errors: ["Arquivo inválido: não é um objeto JSON."], warnings };
  }

  const obj = raw as Record<string, any>;

  // Check meta
  const meta = obj.meta;
  if (!meta) {
    warnings.push("Campo 'meta' ausente. Tentando importação legada.");
  } else {
    const sv = meta.schemaVersion;
    if (sv && !SUPPORTED_SCHEMA_VERSIONS.includes(sv)) {
      // Try migration
      const migrated = migrateCharacterSchema(obj.characterData ?? obj, sv);
      if (!migrated) {
        errors.push(`Versão de schema incompatível: ${sv}. Versões suportadas: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}.`);
        return { success: false, errors, warnings };
      }
      warnings.push(`Schema migrado de v${sv} para v${SCHEMA_VERSION}.`);
      return { success: true, data: migrated.data, errors, warnings };
    }
  }

  // Get character data (support both formats)
  const charData = obj.characterData ?? obj;

  // Validate required fields
  if (typeof charData.level !== "number" || charData.level < 1 || charData.level > 20) {
    errors.push("Campo 'level' inválido (deve ser 1-20).");
  }
  if (charData.class !== null && charData.class !== undefined && typeof charData.class !== "string") {
    errors.push("Campo 'class' deve ser string ou null.");
  }
  if (charData.race !== null && charData.race !== undefined && typeof charData.race !== "string") {
    errors.push("Campo 'race' deve ser string ou null.");
  }
  if (!charData.abilityScores || typeof charData.abilityScores !== "object") {
    errors.push("Campo 'abilityScores' ausente ou inválido.");
  } else {
    for (const key of ABILITIES) {
      const v = charData.abilityScores[key];
      if (typeof v !== "number" || v < 1 || v > 30) {
        errors.push(`abilityScores.${key} inválido: ${v}`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  return { success: true, data: charData as CharacterPrimaryData, errors, warnings };
}

export function readFileAsJSON(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target?.result as string));
      } catch {
        reject(new Error("Arquivo não é JSON válido."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsText(file);
  });
}

// ══════════════════════════════════════════
// 3) SUMMARY TEXT
// ══════════════════════════════════════════
export function generateSummaryText(char: CharacterState): string {
  const race = races.find((r) => r.id === char.race);
  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const isSpellcaster = cls?.spellcasting != null;

  const finalScores = getFinalAbilityScores(
    char.abilityScores, char.racialBonuses,
    char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses,
  );

  const lines: string[] = [];
  lines.push(`═══ ${char.name || "Sem nome"} ═══`);
  lines.push(`Nível: ${char.level}`);
  lines.push(`Raça: ${race?.name ?? "—"}`);
  lines.push(`Classe: ${cls?.name ?? "—"}`);
  lines.push(`Antecedente: ${bg?.name ?? "—"}`);
  lines.push("");
  lines.push(`CA: ${char.armorClass}  |  PV: ${char.hitPoints.max}  |  Desl.: ${char.speed}m  |  Prof.: +${char.proficiencyBonus}`);
  lines.push("");
  lines.push("─── Atributos ───");
  for (const a of ABILITIES) {
    const v = finalScores[a];
    const m = calcAbilityMod(v);
    lines.push(`  ${ABILITY_SHORT[a]}  ${String(v).padStart(2)}  (${m >= 0 ? "+" : ""}${m})`);
  }

  if (char.savingThrows.length > 0) {
    lines.push("");
    lines.push(`─── Salvaguardas ───`);
    for (const a of ABILITIES) {
      const mod = calcAbilityMod(finalScores[a]);
      const prof = char.savingThrows.some(
        (st) => st.toLowerCase().startsWith(ABILITY_LABELS[a].toLowerCase().substring(0, 3))
      );
      const total = mod + (prof ? char.proficiencyBonus : 0);
      lines.push(`  ${ABILITY_SHORT[a]}  ${total >= 0 ? "+" : ""}${total}${prof ? " ★" : ""}`);
    }
  }

  if (char.skills.length > 0) {
    lines.push("");
    lines.push("─── Perícias ───");
    for (const skill of ALL_SKILLS) {
      const prof = char.skills.includes(skill.name);
      if (!prof) continue;
      const mod = calcAbilityMod(finalScores[skill.ability]);
      const total = mod + char.proficiencyBonus;
      lines.push(`  ${skill.name} (${ABILITY_SHORT[skill.ability]})  +${total}`);
    }
  }

  if (char.attacks.length > 0) {
    lines.push("");
    lines.push("─── Ataques ───");
    for (const atk of char.attacks) {
      lines.push(`  ${atk.name}: ${atk.attackBonus >= 0 ? "+" : ""}${atk.attackBonus}, ${atk.damage.split(" (")[0]}, ${atk.range}`);
    }
  }

  if (isSpellcaster) {
    lines.push("");
    lines.push("─── Magias ───");
    lines.push(`  CD: ${char.spells.spellSaveDC}  |  Ataque: +${char.spells.spellAttackBonus}`);
    if (char.spells.cantrips.length > 0) {
      const names = char.spells.cantrips.map((id) => spellsData.find((s) => s.id === id)?.name ?? id);
      lines.push(`  Truques: ${names.join(", ")}`);
    }
    if (char.spells.prepared.length > 0) {
      const names = char.spells.prepared.map((id) => spellsData.find((s) => s.id === id)?.name ?? id);
      lines.push(`  Preparadas: ${names.join(", ")}`);
    }
  }

  return lines.join("\n");
}

// ══════════════════════════════════════════
// 4) SHARE PAYLOAD (compact)
// ══════════════════════════════════════════
export function exportSharePayload(char: CharacterState): SharePayload {
  const finalScores = getFinalAbilityScores(
    char.abilityScores, char.racialBonuses,
    char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses,
  );

  return {
    n: char.name || "Sem nome",
    lv: char.level,
    r: char.race,
    c: char.class,
    sc: char.subclass,
    bg: char.background,
    ab: finalScores,
    hp: char.hitPoints.max,
    ac: char.armorClass,
    atk: char.attacks.map((a) => ({ n: a.name, b: a.attackBonus, d: a.damage.split(" (")[0] })),
    sp: [...char.spells.cantrips, ...char.spells.prepared],
  };
}

export function sharePayloadToBase64(payload: SharePayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export function base64ToSharePayload(b64: string): SharePayload | null {
  try {
    return JSON.parse(decodeURIComponent(atob(b64)));
  } catch {
    return null;
  }
}
