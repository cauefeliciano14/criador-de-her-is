import { describe, it, expect } from "vitest";
import { calcSpellStats } from "@/rules/engine/calcSpellStats";
import type { AbilityKey } from "@/rules/engine/calcAbilityScores";

function makeMods(overrides: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...overrides };
}

describe("calcSpellStats", () => {
  it("returns zeros when no casting ability", () => {
    const result = calcSpellStats(null, makeMods(), 2);
    expect(result.spellSaveDC).toBe(0);
    expect(result.spellAttackBonus).toBe(0);
  });

  it("calculates DC and attack bonus for Intelligence", () => {
    const result = calcSpellStats("Inteligência", makeMods({ int: 3 }), 2);
    expect(result.spellSaveDC).toBe(13); // 8 + 2 + 3
    expect(result.spellAttackBonus).toBe(5); // 2 + 3
  });

  it("calculates for Wisdom", () => {
    const result = calcSpellStats("Sabedoria", makeMods({ wis: 4 }), 3);
    expect(result.spellSaveDC).toBe(15); // 8 + 3 + 4
    expect(result.spellAttackBonus).toBe(7); // 3 + 4
  });

  it("calculates for Charisma", () => {
    const result = calcSpellStats("Carisma", makeMods({ cha: 2 }), 2);
    expect(result.spellSaveDC).toBe(12); // 8 + 2 + 2
    expect(result.spellAttackBonus).toBe(4); // 2 + 2
  });

  it("handles short ability key format", () => {
    const result = calcSpellStats("int", makeMods({ int: 3 }), 2);
    expect(result.spellSaveDC).toBe(13);
  });
});
