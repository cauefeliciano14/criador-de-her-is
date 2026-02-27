import { describe, it, expect } from "vitest";
import { calcFinalAbilityScores, calcAbilityMod, ABILITIES } from "@/rules/engine/calcAbilityScores";
import { makeCharacter } from "@/test/fixtures";

describe("calcAbilityMod", () => {
  it.each([
    [1, -5], [6, -2], [8, -1], [10, 0], [11, 0],
    [12, 1], [14, 2], [15, 2], [18, 4], [20, 5], [30, 10],
  ])("score %i → mod %i", (score, expected) => {
    expect(calcAbilityMod(score)).toBe(expected);
  });
});

describe("calcFinalAbilityScores", () => {
  it("adds racial + background + ASI + feat bonuses correctly", () => {
    const char = makeCharacter({
      abilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      racialBonuses: { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0 },
      backgroundBonuses: { str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 0 },
      asiBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      featAbilityBonuses: { str: 0, dex: 1, con: 0, int: 0, wis: 0, cha: 0 },
    });

    const result = calcFinalAbilityScores(char);
    expect(result.total.str).toBe(17); // 15+2
    expect(result.total.dex).toBe(15); // 14+1(feat)
    expect(result.total.con).toBe(14); // 13+1
    expect(result.total.int).toBe(13); // 12+1(bg)
    expect(result.total.wis).toBe(10);
    expect(result.total.cha).toBe(8);
  });

  it("caps at 20", () => {
    const char = makeCharacter({
      abilityScores: { str: 18, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      racialBonuses: { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      asiBonuses: { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    });
    const result = calcFinalAbilityScores(char);
    expect(result.total.str).toBe(20);
  });

  it("calculates mods correctly from totals", () => {
    const char = makeCharacter({
      abilityScores: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 13 },
    });
    const result = calcFinalAbilityScores(char);
    expect(result.mods.str).toBe(3);
    expect(result.mods.dex).toBe(0);
    expect(result.mods.con).toBe(2);
    expect(result.mods.int).toBe(-1);
    expect(result.mods.wis).toBe(1);
    expect(result.mods.cha).toBe(1);
  });
});
