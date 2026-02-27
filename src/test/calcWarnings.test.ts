import { describe, it, expect } from "vitest";
import { collectWarnings } from "@/rules/engine/calcWarnings";
import { makeCharacter } from "@/test/fixtures";

describe("collectWarnings", () => {
  it("returns no warnings for a clean character", () => {
    const char = makeCharacter({ hitPoints: { max: 8, current: 8 }, armorClass: 10 });
    const warnings = collectWarnings(char);
    expect(warnings).toHaveLength(0);
  });

  it("warns when equipped armor not proficient", () => {
    const char = makeCharacter({
      equipped: { armor: "cotaDeMalhaFull", shield: null, weapons: [] },
      proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
      hitPoints: { max: 8, current: 8 }, armorClass: 16,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "armor-no-prof")).toBe(true);
  });

  it("warns when shield equipped without proficiency", () => {
    const char = makeCharacter({
      equipped: { armor: null, shield: "escudo", weapons: [] },
      proficiencies: { armor: [], weapons: [], tools: [], languages: [] },
      hitPoints: { max: 8, current: 8 }, armorClass: 12,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "shield-no-prof")).toBe(true);
  });

  it("errors when equipped weapon not in catalog", () => {
    const char = makeCharacter({
      equipped: { armor: null, shield: null, weapons: ["nonExistentWeapon"] },
      hitPoints: { max: 8, current: 8 }, armorClass: 10,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id.startsWith("weapon-missing"))).toBe(true);
  });

  it("errors on invalid HP", () => {
    const char = makeCharacter({ hitPoints: { max: 0, current: 0 }, armorClass: 10 });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "hp-invalid")).toBe(true);
  });

  it("errors on invalid AC", () => {
    const char = makeCharacter({ hitPoints: { max: 8, current: 8 }, armorClass: 0 });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "ac-invalid")).toBe(true);
  });

  it("errors when ability score out of bounds", () => {
    const char = makeCharacter({
      abilityScores: { str: 0, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      hitPoints: { max: 8, current: 8 }, armorClass: 10,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "ability-bounds")).toBe(true);
  });

  it("warns on armor STR requirement not met", () => {
    const char = makeCharacter({
      equipped: { armor: "cotaDeMalhaFull", shield: null, weapons: [] }, // requires STR 13
      abilityScores: { str: 10, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      proficiencies: { armor: ["Armaduras Pesadas"], weapons: [], tools: [], languages: [] },
      hitPoints: { max: 8, current: 8 }, armorClass: 16,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "armor-str-req")).toBe(true);
  });

  // ── Monk warnings ──

  it("warns monk with armor equipped", () => {
    const char = makeCharacter({
      class: "monge",
      equipped: { armor: "armaduraCouro", shield: null, weapons: [] },
      proficiencies: { armor: [], weapons: ["Armas Simples"], tools: [], languages: [] },
      hitPoints: { max: 8, current: 8 }, armorClass: 11,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "monk-armor")).toBe(true);
  });

  it("warns monk with shield equipped", () => {
    const char = makeCharacter({
      class: "monge",
      equipped: { armor: null, shield: "escudo", weapons: [] },
      proficiencies: { armor: [], weapons: ["Armas Simples"], tools: [], languages: [] },
      hitPoints: { max: 8, current: 8 }, armorClass: 12,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "monk-shield")).toBe(true);
  });

  it("warns barbarian with armor (unarmored defense not applied)", () => {
    const char = makeCharacter({
      class: "barbaro",
      equipped: { armor: "armaduraCouro", shield: null, weapons: [] },
      proficiencies: { armor: ["Armaduras Leves", "Armaduras Médias"], weapons: ["Armas Simples", "Armas Marciais"], tools: [], languages: [] },
      hitPoints: { max: 12, current: 12 }, armorClass: 13,
    });
    const warnings = collectWarnings(char);
    expect(warnings.some((w) => w.id === "barbarian-armor-unarmored")).toBe(true);
  });
});
