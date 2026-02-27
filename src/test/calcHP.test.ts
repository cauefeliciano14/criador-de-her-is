import { describe, it, expect } from "vitest";
import { calcHP, adjustCurrentHP } from "@/rules/engine/calcHP";

describe("calcHP", () => {
  it("level 1: hitDie + CON mod", () => {
    expect(calcHP(10, 1, 2, {}).max).toBe(12); // d10 + 2
    expect(calcHP(6, 1, -1, {}).max).toBe(5);  // d6 - 1
    expect(calcHP(8, 1, 0, {}).max).toBe(8);   // d8 + 0
  });

  it("level 1 with very low CON never goes below 1", () => {
    expect(calcHP(6, 1, -5, {}).max).toBe(1); // 6-5=1
  });

  it("level 2+ uses average when no rolls", () => {
    // d10: avg = ceil(10/2)+1 = 6
    const result = calcHP(10, 3, 2, {});
    // L1: 10+2=12, L2: 6+2=8, L3: 6+2=8 → 28
    expect(result.max).toBe(28);
  });

  it("level 2+ uses recorded rolls", () => {
    // d10, CON +2, L2 rolled 7, L3 rolled 3
    const result = calcHP(10, 3, 2, { 2: 7, 3: 3 });
    // L1: 10+2=12, L2: 7+2=9, L3: 3+2=5 → 26
    expect(result.max).toBe(26);
  });

  it("mixes rolls and average for missing levels", () => {
    // d8, CON +1, L2 rolled 5, L3 no roll (avg = ceil(8/2)+1 = 5)
    const result = calcHP(8, 3, 1, { 2: 5 });
    // L1: 8+1=9, L2: 5+1=6, L3: 5+1=6 → 21
    expect(result.max).toBe(21);
  });
});

describe("adjustCurrentHP", () => {
  it("returns new max if was at full health", () => {
    expect(adjustCurrentHP(10, 10, 15)).toBe(15);
  });

  it("clamps current to new max if current > new max", () => {
    expect(adjustCurrentHP(12, 15, 10)).toBe(10);
  });

  it("keeps current if below new max", () => {
    expect(adjustCurrentHP(5, 15, 12)).toBe(5);
  });
});
