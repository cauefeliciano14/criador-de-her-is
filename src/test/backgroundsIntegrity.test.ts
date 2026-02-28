import { describe, expect, it } from "vitest";
import { backgrounds } from "@/data/backgrounds";
import { feats } from "@/data/feats";

describe("backgrounds integrity", () => {
  it("deve manter 16 antecedentes completos no padrão 2024", () => {
    expect(backgrounds).toHaveLength(16);
    const featIds = new Set(feats.map((feat) => feat.id));

    for (const background of backgrounds) {
      expect(background.skillsGranted.length, `${background.id} skillsGranted`).toBe(2);
      expect(background.toolsGranted.length, `${background.id} toolsGranted`).toBeGreaterThan(0);
      expect(featIds.has(background.originFeatId), `${background.id} originFeatId`).toBe(true);
      expect(background.equipmentOptionA.items.length, `${background.id} equipmentOptionA`).toBeGreaterThan(0);
      expect(background.equipmentOptionB.gold, `${background.id} equipmentOptionB`).toBe(50);
      expect(background.abilityOptions.length, `${background.id} abilityOptions`).toBe(3);
    }
  });
});
