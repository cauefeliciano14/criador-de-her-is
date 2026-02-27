import { describe, it, expect } from "vitest";
import { validateCharacterCompleteness } from "@/utils/validation";
import { INCOMPLETE_CHAR, FIGHTER_HUMAN_L1, MISSING_SUBRACE, WIZARD_ELF_L1, makeCharacter } from "@/test/fixtures";

describe("validateCharacterCompleteness", () => {
  it("incomplete character has multiple missing items", () => {
    const result = validateCharacterCompleteness(INCOMPLETE_CHAR);
    expect(result.isComplete).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.missing.some((m) => m.id === "ability-method")).toBe(true);
    expect(result.missing.some((m) => m.id === "race-select")).toBe(true);
    expect(result.missing.some((m) => m.id === "class-select")).toBe(true);
    expect(result.missing.some((m) => m.id === "bg-select")).toBe(true);
  });

  it("missing items have correct stepNumber", () => {
    const result = validateCharacterCompleteness(INCOMPLETE_CHAR);
    const raceMissing = result.missing.find((m) => m.id === "race-select");
    expect(raceMissing?.stepNumber).toBe(3);
    const classMissing = result.missing.find((m) => m.id === "class-select");
    expect(classMissing?.stepNumber).toBe(1);
  });

  it("does not require subrace when race has no subraces", () => {
    const result = validateCharacterCompleteness(MISSING_SUBRACE);
    expect(result.missing.some((m) => m.id === "subrace-select")).toBe(false);
  });

  it("fighter with all choices is mostly complete", () => {
    const result = validateCharacterCompleteness(FIGHTER_HUMAN_L1);
    const criticalMissing = result.missing.filter(
      (m) => !["equipment-choice"].includes(m.id)
    );
    expect(criticalMissing.filter((m) => m.id === "race-select")).toHaveLength(0);
    expect(criticalMissing.filter((m) => m.id === "class-select")).toHaveLength(0);
    expect(criticalMissing.filter((m) => m.id === "bg-select")).toHaveLength(0);
  });

  it("maps choices pending to equipment or choices step based on useChoicesStep", () => {
    const charWithPendingChoices = makeCharacter({
      name: "Pending Choices",
      level: 1,
      race: "humano",
      class: "guerreiro",
      background: "soldado",
      abilityGeneration: {
        method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true,
      },
      abilityScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      classSkillChoices: ["Atletismo", "Intimidação"],
      classEquipmentChoice: "A",
      choiceSelections: {
        classSkills: ["atletismo", "intimidacao"],
        languages: [],
        tools: [],
        instruments: [],
        cantrips: [],
        spells: [],
        raceChoice: null,
        classFeats: [],
      },
    });

    const withoutChoicesStep = validateCharacterCompleteness(charWithPendingChoices, false);
    const withoutChoicesPending = withoutChoicesStep.missing.find((m) => m.id === "choices-pending");
    expect(withoutChoicesPending).toBeDefined();
    expect(withoutChoicesPending?.stepId).toBe("equipment");
    expect(withoutChoicesPending?.stepNumber).toBe(5);

    const withChoicesStep = validateCharacterCompleteness(charWithPendingChoices, true);
    const withChoicesPending = withChoicesStep.missing.find((m) => m.id === "choices-pending");
    expect(withChoicesPending).toBeDefined();
    expect(withChoicesPending?.stepId).toBe("choices");
    expect(withChoicesPending?.stepNumber).toBe(6);
  });

  it("wizard missing cantrips/spells shows spell warnings", () => {
    const wizNoSpells = {
      ...WIZARD_ELF_L1,
      spells: { ...WIZARD_ELF_L1.spells, cantrips: [], prepared: [] },
    };
    const result = validateCharacterCompleteness(wizNoSpells);
    expect(result.missing.some((m) => m.id === "cantrips-count")).toBe(true);
  });

  // ── Cleric/Druid Order validation ──

  it("cleric without divine order has missing item", () => {
    const char = makeCharacter({
      name: "Test Cleric", level: 1, race: "humano", class: "clerigo", background: "acolito",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
      classFeatureChoices: {},
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "clerigo-ordem-divina")).toBe(true);
  });

  it("cleric WITH divine order passes that check", () => {
    const char = makeCharacter({
      name: "Test Cleric", level: 1, race: "humano", class: "clerigo", background: "acolito",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
      classFeatureChoices: { "clerigo:ordemDivina": "protetor" },
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "clerigo-ordem-divina")).toBe(false);
  });

  it("druid without primal order has missing item", () => {
    const char = makeCharacter({
      name: "Test Druid", level: 1, race: "humano", class: "druida", background: "eremita",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 15, cha: 8 },
      classFeatureChoices: {},
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "druida-ordem-primal")).toBe(true);
  });

  // ── Expertise validation ──

  it("rogue level 1 without expertise has missing item", () => {
    const char = makeCharacter({
      name: "Test Rogue", level: 1, race: "humano", class: "ladino", background: "criminoso",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 15, con: 8, int: 8, wis: 8, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 15, con: 8, int: 8, wis: 8, cha: 8 },
      classFeatureChoices: {},
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "expertise-ladino:especialista")).toBe(true);
  });

  it("rogue with 2 expertise passes that check", () => {
    const char = makeCharacter({
      name: "Test Rogue", level: 1, race: "humano", class: "ladino", background: "criminoso",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 15, con: 8, int: 8, wis: 8, cha: 8 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 15, con: 8, int: 8, wis: 8, cha: 8 },
      classFeatureChoices: { "ladino:especialista": ["Furtividade", "Prestidigitação"] },
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "expertise-ladino:especialista")).toBe(false);
  });

  it("bard level 1 does NOT require expertise (minLevel 2)", () => {
    const char = makeCharacter({
      name: "Test Bard", level: 1, race: "humano", class: "bardo", background: "artista",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 15 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 15 },
      classFeatureChoices: {},
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "expertise-bardo:especialista")).toBe(false);
  });

  it("bard level 2 without expertise has missing item", () => {
    const char = makeCharacter({
      name: "Test Bard", level: 2, race: "humano", class: "bardo", background: "artista",
      abilityGeneration: { method: "standard", rolls: null, rollResults: null, pointBuyRemaining: 0,
        standardAssignments: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 15 },
        rollAssignments: { str: null, dex: null, con: null, int: null, wis: null, cha: null },
        confirmed: true },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 15 },
      classFeatureChoices: {},
    });
    const result = validateCharacterCompleteness(char);
    expect(result.missing.some((m) => m.id === "expertise-bardo:especialista")).toBe(true);
  });
});
