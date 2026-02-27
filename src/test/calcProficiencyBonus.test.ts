import { describe, it, expect } from "vitest";
import { calcProficiencyBonus } from "@/rules/engine/calcProficiencyBonus";

describe("calcProficiencyBonus", () => {
  it.each([
    [1, 2], [2, 2], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 4], [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ])("level %i → prof bonus +%i", (level, expected) => {
    expect(calcProficiencyBonus(level)).toBe(expected);
  });
});
