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
      choiceSelections: { classSkills: ["atletismo", "intuicao"], languages: ["anao", "elfico"], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
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
    expect(req.buckets.cantrips.requiredCount).toBeGreaterThan(0);
    expect(req.buckets.spells.requiredCount).toBeGreaterThan(0);
    expect(req.buckets.cantrips.options.every((o) => typeof o.id === "string")).toBe(true);
  });

  it("troca de classe invalida seleções antigas", () => {
    const wizard = makeCharacter({
      class: "mago",
      level: 1,
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: ["rajada-de-fogo"], spells: ["escudo-arcano"], raceChoice: null, classFeats: [] },
    });
    const reqWizard = getChoicesRequirements(wizard);
    expect(reqWizard.buckets.cantrips.selectedIds).toContain("rajada-de-fogo");

    const fighter = { ...wizard, class: "guerreiro" as const };
    const reqFighter = getChoicesRequirements(fighter);
    expect(reqFighter.buckets.cantrips.requiredCount).toBe(0);
    expect(reqFighter.buckets.cantrips.selectedIds).toEqual([]);
  });

  it("escolha racial obrigatória usa chave canônica e zera pendência", () => {
    const base = makeCharacter({
      race: "draconato",
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
      raceChoices: {},
    });

    const reqPending = getChoicesRequirements(base);
    expect(reqPending.buckets.raceChoice.requiredCount).toBe(1);
    expect(reqPending.buckets.raceChoice.pendingCount).toBe(1);
    expect(reqPending.buckets.raceChoice.sources[0]).toContain(":draconicAncestry");

    const selected = makeCharacter({
      ...base,
      choiceSelections: { ...base.choiceSelections, raceChoice: "azul" },
      raceChoices: { draconicAncestry: "azul" },
    });

    const reqSelected = getChoicesRequirements(selected);
    expect(reqSelected.buckets.raceChoice.selectedIds).toEqual(["azul"]);
    expect(reqSelected.buckets.raceChoice.pendingCount).toBe(0);
  });

  it("escolha em raceChoices.raceChoice não satisfaz requisito canônico", () => {
    const char = makeCharacter({
      race: "draconato",
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: "azul", classFeats: [] },
      raceChoices: { raceChoice: "azul" } as any,
    });

    const req = getChoicesRequirements(char);
    expect(req.buckets.raceChoice.pendingCount).toBe(1);
    expect(req.buckets.raceChoice.selectedIds).toEqual([]);
  });

  it("idiomas base exigem 2 escolhas além de Comum", () => {
    const char = makeCharacter({
      class: "guerreiro",
      race: "humano",
      background: "soldado",
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
    });

    const req = getChoicesRequirements(char);
    expect(req.buckets.languages.requiredCount).toBe(2);
    expect(req.buckets.languages.options.some((l) => l.name === "Comum")).toBe(false);
  });

  it("bardo exige exatamente 3 instrumentos", () => {
    const char = makeCharacter({
      class: "bardo",
      race: "humano",
      background: "soldado",
      choiceSelections: { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [] },
    });

    const req = getChoicesRequirements(char);
    expect(req.buckets.instruments.requiredCount).toBe(3);
  });

});
