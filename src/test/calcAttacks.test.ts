import { describe, it, expect } from "vitest";
import { calcAttacks } from "@/rules/engine/calcAttacks";
import type { AbilityKey } from "@/rules/engine/calcAbilityScores";

function makeMods(overrides: Partial<Record<AbilityKey, number>> = {}): Record<AbilityKey, number> {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, ...overrides };
}

describe("calcAttacks", () => {
  it("always includes unarmed strike", () => {
    const attacks = calcAttacks(makeMods({ str: 3 }), 2, { armor: null, shield: null, weapons: [] }, [], {});
    expect(attacks).toHaveLength(1);
    expect(attacks[0].name).toBe("Ataque Desarmado");
    expect(attacks[0].attackBonus).toBe(5); // 3 + 2 (always proficient)
    expect(attacks[0].proficient).toBe(true);
  });

  it("melee weapon uses STR", () => {
    const attacks = calcAttacks(
      makeMods({ str: 3, dex: 1 }), 2,
      { armor: null, shield: null, weapons: ["espadaLonga"] },
      ["Armas Marciais"], {}
    );
    const sword = attacks.find((a) => a.weaponId === "espadaLonga");
    expect(sword).toBeDefined();
    expect(sword!.attackBonus).toBe(5); // STR 3 + prof 2
    expect(sword!.proficient).toBe(true);
  });

  it("finesse weapon uses higher of STR/DEX", () => {
    const attacks = calcAttacks(
      makeMods({ str: 1, dex: 4 }), 2,
      { armor: null, shield: null, weapons: ["rapieira"] },
      ["Armas Marciais"], {}
    );
    const rapier = attacks.find((a) => a.weaponId === "rapieira");
    expect(rapier!.attackBonus).toBe(6); // DEX 4 + prof 2
  });

  it("ranged weapon uses DEX", () => {
    const attacks = calcAttacks(
      makeMods({ str: 3, dex: 2 }), 2,
      { armor: null, shield: null, weapons: ["arcoLongo"] },
      ["Armas Marciais"], {}
    );
    const bow = attacks.find((a) => a.weaponId === "arcoLongo");
    expect(bow!.attackBonus).toBe(4); // DEX 2 + prof 2
  });

  it("non-proficient weapon does not add prof bonus", () => {
    const attacks = calcAttacks(
      makeMods({ str: 3 }), 2,
      { armor: null, shield: null, weapons: ["espadaLonga"] },
      [], {} // no weapon proficiencies
    );
    const sword = attacks.find((a) => a.weaponId === "espadaLonga");
    expect(sword!.attackBonus).toBe(3); // STR only
    expect(sword!.proficient).toBe(false);
  });

  it("Monk unarmed uses DEX and martial arts die (1d6 at level 1)", () => {
    const attacks = calcAttacks(
      makeMods({ str: 1, dex: 4 }), 2,
      { armor: null, shield: null, weapons: [] },
      ["Armas Simples"], {},
      { classId: "monge", level: 1 }
    );
    const unarmed = attacks.find((a) => a.weaponId === "__unarmed__")!;
    expect(unarmed.attackBonus).toBe(6); // DEX 4 + prof 2
    expect(unarmed.damage).toContain("1d6");
    expect(unarmed.damage).toContain("+4");
  });

  it("Monk weapon uses DEX if higher", () => {
    const attacks = calcAttacks(
      makeMods({ str: 1, dex: 4 }), 2,
      { armor: null, shield: null, weapons: ["adaga"] },
      ["Armas Simples"], {},
      { classId: "monge", level: 1 }
    );
    const dagger = attacks.find((a) => a.weaponId === "adaga")!;
    expect(dagger.attackBonus).toBe(6); // DEX 4 + prof 2
    // Dagger is 1d4 but martial arts die is 1d6
    expect(dagger.damage).toContain("1d6");
  });
});
