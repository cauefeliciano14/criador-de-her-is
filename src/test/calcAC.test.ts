import { describe, it, expect } from "vitest";
import { calcAC } from "@/rules/engine/calcAC";
import type { AbilityKey } from "@/rules/engine/calcAbilityScores";

function makeMods(overrides: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...overrides };
}

describe("calcAC", () => {
  it("no armor: 10 + DEX", () => {
    const result = calcAC(makeMods({ dex: 3 }), { armor: null, shield: null, weapons: [] }, {});
    expect(result.total).toBe(13);
  });

  it("with armor: baseAC + DEX (no cap)", () => {
    // Leather armor: baseAC 11, no dex cap → 11 + 3 = 14
    const result = calcAC(makeMods({ dex: 3 }), { armor: "armaduraCouro", shield: null, weapons: [] }, {});
    expect(result.total).toBe(14);
  });

  it("with armor dex cap", () => {
    // Breastplate (brunea): baseAC 14, dexCap 2 → 14 + min(3,2) = 16
    const result = calcAC(makeMods({ dex: 3 }), { armor: "brunea", shield: null, weapons: [] }, {});
    expect(result.total).toBe(16);
  });

  it("heavy armor: dexCap 0", () => {
    // Chain mail: baseAC 16, dexCap 0 → 16
    const result = calcAC(makeMods({ dex: 3 }), { armor: "cotaDeMalhaFull", shield: null, weapons: [] }, {});
    expect(result.total).toBe(16);
  });

  it("shield adds bonus", () => {
    // No armor (10+2=12) + shield (+2) = 14
    const result = calcAC(makeMods({ dex: 2 }), { armor: null, shield: "escudo", weapons: [] }, {});
    expect(result.total).toBe(14);
  });

  it("armor + shield combined", () => {
    // Chain mail 16 + shield 2 = 18
    const result = calcAC(makeMods({ dex: 3 }), { armor: "cotaDeMalhaFull", shield: "escudo", weapons: [] }, {});
    expect(result.total).toBe(18);
  });

  it("nonexistent armor falls back to base", () => {
    const result = calcAC(makeMods({ dex: 2 }), { armor: "doesNotExist", shield: null, weapons: [] }, {});
    expect(result.total).toBe(12); // 10 + 2
  });

  // ── Unarmored Defense ──

  it("Barbarian unarmored: 10 + DEX + CON", () => {
    const result = calcAC(
      makeMods({ dex: 2, con: 3 }),
      { armor: null, shield: null, weapons: [] },
      { unarmoredDefenseBarbarian: true }
    );
    expect(result.total).toBe(15); // 10 + 2 + 3
    expect(result.overrideUsed).toContain("Bárbaro");
  });

  it("Barbarian unarmored + shield", () => {
    const result = calcAC(
      makeMods({ dex: 2, con: 3 }),
      { armor: null, shield: "escudo", weapons: [] },
      { unarmoredDefenseBarbarian: true }
    );
    expect(result.total).toBe(17); // 10 + 2 + 3 + 2
  });

  it("Barbarian unarmored ignored when wearing armor", () => {
    const result = calcAC(
      makeMods({ dex: 2, con: 3 }),
      { armor: "cotaDeMalhaFull", shield: null, weapons: [] },
      { unarmoredDefenseBarbarian: true }
    );
    expect(result.total).toBe(16); // chain mail base 16
    expect(result.overrideUsed).toBeNull();
  });

  it("Monk unarmored: 10 + DEX + WIS", () => {
    const result = calcAC(
      makeMods({ dex: 3, wis: 2 }),
      { armor: null, shield: null, weapons: [] },
      { unarmoredDefenseMonk: true }
    );
    expect(result.total).toBe(15); // 10 + 3 + 2
    expect(result.overrideUsed).toContain("Monge");
  });

  it("Monk unarmored with shield still applies (shield adds)", () => {
    const result = calcAC(
      makeMods({ dex: 3, wis: 2 }),
      { armor: null, shield: "escudo", weapons: [] },
      { unarmoredDefenseMonk: true }
    );
    // Monk override: 10+3+2+2=17 vs base: 10+3+2=15 → monk wins
    expect(result.total).toBe(17);
  });

  it("Monk unarmored ignored when wearing armor", () => {
    const result = calcAC(
      makeMods({ dex: 3, wis: 2 }),
      { armor: "armaduraCouro", shield: null, weapons: [] },
      { unarmoredDefenseMonk: true }
    );
    expect(result.total).toBe(14); // leather 11 + dex 3
    expect(result.overrideUsed).toBeNull();
  });

  it("Draconic Resilience: 13 + DEX", () => {
    const result = calcAC(
      makeMods({ dex: 2 }),
      { armor: null, shield: null, weapons: [] },
      { draconicResilience: true }
    );
    expect(result.total).toBe(15); // 13 + 2
    expect(result.overrideUsed).toContain("Dracônica");
  });
});
