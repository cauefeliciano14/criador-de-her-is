import { describe, it, expect } from "vitest";
import { recalcAll } from "@/rules/engine/recalcAll";
import { FIGHTER_HUMAN_L1, WIZARD_ELF_L1, WIZARD_ELF_L2, BARBARIAN_HUMAN_L1, makeCharacter } from "@/test/fixtures";

describe("recalcAll integration", () => {
  it("fighter L1: computes correct HP, AC, attacks", () => {
    const result = recalcAll(FIGHTER_HUMAN_L1);

    // HP: d10 + CON mod. STR 15(+2), DEX 14(+2), CON 13(+1) — no racial bonuses in PHB 2024
    expect(result.hitPoints.max).toBe(11); // 10 + 1

    // AC: chain mail baseAC 16, dexCap 0 → 16
    expect(result.armorClass).toBe(16);

    // Prof bonus at L1 = +2
    expect(result.proficiencyBonus).toBe(2);

    // Should have attacks (longsword + unarmed)
    expect(result.attacks.length).toBeGreaterThanOrEqual(2);
    const sword = result.attacks.find((a) => a.weaponId === "espadaLonga");
    expect(sword).toBeDefined();
    // STR 15 → mod +2, proficient → +4
    expect(sword!.attackBonus).toBe(4);

    // Saves: proficient in STR and CON
    expect(result.saveMods.str.proficient).toBe(true);
    expect(result.saveMods.con.proficient).toBe(true);
    expect(result.saveMods.dex.proficient).toBe(false);
  });

  it("wizard L1: spell stats computed correctly", () => {
    const result = recalcAll(WIZARD_ELF_L1);

    // INT 15 → mod +2, prof +2 — no racial bonuses in PHB 2024
    expect(result.spells.spellSaveDC).toBe(12); // 8 + 2 + 2
    expect(result.spells.spellAttackBonus).toBe(4); // 2 + 2

    // HP: d6 + CON mod. CON 13 → mod +1
    expect(result.hitPoints.max).toBe(7); // 6 + 1

    // AC: no armor, DEX 14 → mod +2 → AC 12
    expect(result.armorClass).toBe(12);
  });

  it("wizard L2: HP includes average hit die", () => {
    const result = recalcAll(WIZARD_ELF_L2);

    // HP: (6 + 1) + (4 + 1) = 12   (d6 avg=4, CON 13 → +1)
    expect(result.hitPoints.max).toBe(12);

    // Prof still +2 at L2
    expect(result.proficiencyBonus).toBe(2);

    // Spell stats: INT 15 → +2, prof +2
    expect(result.spells.spellSaveDC).toBe(12);
    expect(result.spells.spellAttackBonus).toBe(4);

    // AC: no armor, DEX 14 → +2 → 12
    expect(result.armorClass).toBe(12);
  });

  it("barbarian unarmored defense: 10 + DEX + CON", () => {
    const result = recalcAll(BARBARIAN_HUMAN_L1);

    // STR 15(+2), DEX 14(+2), CON 13(+1) — no racial bonuses
    // Unarmored: 10 + DEX(2) + CON(1) = 13
    expect(result.armorClass).toBe(13);

    // HP: d12 + CON(+1) = 13
    expect(result.hitPoints.max).toBe(13);
  });

  it("level 5 gets prof bonus +3", () => {
    const char = makeCharacter({ level: 5, hitDie: 10, hitPoints: { max: 10, current: 10 }, armorClass: 10 });
    const result = recalcAll(char);
    expect(result.proficiencyBonus).toBe(3);
  });

  it("returns 18 skill mods", () => {
    const result = recalcAll(FIGHTER_HUMAN_L1);
    expect(Object.keys(result.skillMods)).toHaveLength(18);
  });

  it("proficient skill has higher total", () => {
    const result = recalcAll(FIGHTER_HUMAN_L1);
    // Atletismo is proficient (STR-based): STR 15 → +2 + prof 2 = +4
    expect(result.skillMods["Atletismo"].total).toBe(4);
    expect(result.skillMods["Atletismo"].proficient).toBe(true);
    // Acrobacia is not proficient (DEX-based): DEX 14 → +2
    expect(result.skillMods["Acrobacia"].total).toBe(2);
    expect(result.skillMods["Acrobacia"].proficient).toBe(false);
  });

  it("warnings are empty for valid character", () => {
    const result = recalcAll(FIGHTER_HUMAN_L1);
    const armorWarning = result.warnings.find((w) => w.id === "armor-no-prof");
    expect(armorWarning).toBeUndefined();
  });
});
