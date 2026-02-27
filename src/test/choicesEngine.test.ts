import { describe, it, expect } from "vitest";
import { makeCharacter } from "./fixtures";
import { getChoicesRequirements } from "@/utils/choices";

describe("choice engine", () => {
  it("guerreiro nível 1 não requer escolhas pendentes", () => {
    const char = makeCharacter({
      class: "guerreiro",
      race: "humano",
      background: "soldado",
      level: 1,
      abilityGeneration: { ...makeCharacter().abilityGeneration, method: "standard", confirmed: true },
      classEquipmentChoice: "A", backgroundEquipmentChoice: null,
      classSkillChoices: ["atletismo", "intuicao"],
      choiceSelections: { classSkills: ["atletismo", "intuicao"], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
    });
    const req = getChoicesRequirements(char);
    expect(req.needsStep).toBe(false);
  });

  it("mago nível 2 exige cantrips e magias por ID", () => {
    const char = makeCharacter({
      class: "mago",
      race: "elfo",
      background: "sabio",
      level: 2,
      abilityGeneration: { ...makeCharacter().abilityGeneration, method: "standard", confirmed: true },
      abilityScores: { str: 8, dex: 14, con: 13, int: 16, wis: 10, cha: 10 },
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: ["rajada-de-fogo"], spells: ["escudo-arcano"], raceChoice: null, classFeats: [] },
    });
    const req = getChoicesRequirements(char);
    expect(req.cantrips.requiredCount).toBeGreaterThan(0);
    expect(req.spells.requiredCount).toBeGreaterThan(0);
    expect(req.cantrips.options.every((o) => typeof o.id === "string")).toBe(true);
  });

  it("troca de classe invalida seleções antigas", () => {
    const wizard = makeCharacter({
      class: "mago",
      level: 1,
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: ["rajada-de-fogo"], spells: ["escudo-arcano"], raceChoice: null, classFeats: [] },
    });
    const reqWizard = getChoicesRequirements(wizard);
    expect(reqWizard.cantrips.selectedIds).toContain("rajada-de-fogo");

    const fighter = { ...wizard, class: "guerreiro" as const };
    const reqFighter = getChoicesRequirements(fighter);
    expect(reqFighter.cantrips.requiredCount).toBe(0);
    expect(reqFighter.cantrips.selectedIds).toEqual([]);
  });

  it("quando ferramentas são obrigatórias o bucket tools oferece opções válidas", () => {
    const char = makeCharacter({
      class: "ladino",
      race: "humano",
      background: "criminoso",
      level: 1,
      abilityGeneration: { ...makeCharacter().abilityGeneration, method: "standard", confirmed: true },
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
    });

    const req = getChoicesRequirements(char);
    expect(req.buckets.tools.requiredCount).toBeGreaterThan(0);
    expect(req.buckets.tools.options.length).toBeGreaterThan(0);
    expect(req.buckets.tools.options.every((option) => option.id.startsWith("jogo-"))).toBe(true);

    const picked = req.buckets.tools.options.slice(0, req.buckets.tools.requiredCount).map((option) => option.id);
    const completed = getChoicesRequirements({
      ...char,
      choiceSelections: { ...char.choiceSelections, tools: picked },
    });

    expect(completed.buckets.tools.pendingCount).toBe(0);
  });
});
