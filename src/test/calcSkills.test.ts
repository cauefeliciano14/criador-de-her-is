import { describe, it, expect } from "vitest";
import { calcSkills } from "@/rules/engine/calcSkills";
import type { AbilityKey } from "@/rules/engine/calcAbilityScores";

function makeMods(overrides: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...overrides };
}

describe("calcSkills", () => {
  it("non-proficient skill = ability mod only", () => {
    const result = calcSkills(makeMods({ dex: 3 }), 2, []);
    expect(result["Acrobacia"].total).toBe(3);
    expect(result["Acrobacia"].proficient).toBe(false);
  });

  it("proficient skill = ability mod + prof bonus", () => {
    const result = calcSkills(makeMods({ dex: 3 }), 2, ["Acrobacia"]);
    expect(result["Acrobacia"].total).toBe(5);
    expect(result["Acrobacia"].proficient).toBe(true);
  });

  it("expertise = ability mod + prof bonus * 2", () => {
    const result = calcSkills(makeMods({ dex: 3 }), 2, ["Acrobacia"], ["Acrobacia"]);
    expect(result["Acrobacia"].total).toBe(7);
    expect(result["Acrobacia"].expertise).toBe(true);
  });

  it("returns all 18 skills", () => {
    const result = calcSkills(makeMods(), 2, []);
    expect(Object.keys(result)).toHaveLength(18);
  });

  it("Bard Jack of All Trades: half prof on non-proficient skills at level 2", () => {
    const result = calcSkills(makeMods({ dex: 3 }), 2, ["Atuação"], [], {
      classId: "bardo",
      level: 2,
    });
    // Proficient skill: normal
    expect(result["Atuação"].total).toBe(2); // cha=0 + prof=2
    expect(result["Atuação"].halfProf).toBe(false);
    // Non-proficient skill: half prof
    expect(result["Acrobacia"].total).toBe(4); // dex=3 + floor(2/2)=1
    expect(result["Acrobacia"].halfProf).toBe(true);
  });

  it("Bard level 1 does NOT get half prof", () => {
    const result = calcSkills(makeMods({ dex: 3 }), 2, [], [], {
      classId: "bardo",
      level: 1,
    });
    expect(result["Acrobacia"].total).toBe(3);
    expect(result["Acrobacia"].halfProf).toBe(false);
  });

  it("Cleric Taumaturgo adds WIS bonus to Arcanismo and Religião", () => {
    const result = calcSkills(makeMods({ wis: 3, int: 1 }), 2, [], [], {
      classId: "clerigo",
      level: 1,
      classFeatureChoices: { "clerigo:ordemDivina": "taumaturgo" },
    });
    expect(result["Arcanismo"].total).toBe(1 + 3); // int=1 + max(wis=3, 1) = 4
    expect(result["Arcanismo"].bonusFromFeature).toBe(3);
    expect(result["Religião"].total).toBe(1 + 3); // int=1 + 3
  });

  it("Cleric Protetor does NOT add skill bonus", () => {
    const result = calcSkills(makeMods({ wis: 3, int: 1 }), 2, [], [], {
      classId: "clerigo",
      level: 1,
      classFeatureChoices: { "clerigo:ordemDivina": "protetor" },
    });
    expect(result["Arcanismo"].total).toBe(1); // just int mod
    expect(result["Arcanismo"].bonusFromFeature).toBe(0);
  });

  it("Druid Xamã adds WIS bonus to Arcanismo and Natureza", () => {
    const result = calcSkills(makeMods({ wis: 2, int: 0 }), 2, [], [], {
      classId: "druida",
      level: 1,
      classFeatureChoices: { "druida:ordemPrimal": "xama" },
    });
    expect(result["Arcanismo"].total).toBe(0 + 2); // int=0 + max(wis=2, 1) = 2
    expect(result["Natureza"].total).toBe(0 + 2); // int=0 + 2
  });
});
