import { describe, it, expect } from "vitest";
import { calcSaves } from "@/rules/engine/calcSaves";
import type { AbilityKey } from "@/rules/engine/calcAbilityScores";

function makeMods(overrides: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...overrides };
}

describe("calcSaves", () => {
  it("non-proficient save = ability mod only", () => {
    const result = calcSaves(makeMods({ str: 3 }), 2, []);
    expect(result.str.total).toBe(3);
    expect(result.str.proficient).toBe(false);
  });

  it("proficient save = ability mod + prof bonus", () => {
    const result = calcSaves(makeMods({ str: 3 }), 2, ["Força"]);
    expect(result.str.total).toBe(5);
    expect(result.str.proficient).toBe(true);
  });

  it("returns all 6 saves", () => {
    const result = calcSaves(makeMods(), 2, []);
    expect(Object.keys(result)).toHaveLength(6);
  });
});
