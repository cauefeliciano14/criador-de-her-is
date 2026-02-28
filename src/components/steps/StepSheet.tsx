import { useMemo } from "react";
import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { validateCharacterCompleteness } from "@/utils/validation";
import { useEffect } from "react";
import { StepReview } from "./StepReview";

export function StepSheet() {
  const char = useCharacterStore();
  const builder = useBuilderStore();

  // Validation drives step completion for "sheet"
  const validation = useMemo(
    () => validateCharacterCompleteness(char),
    [
      char.race, char.subrace, char.class, char.background,
      char.abilityGeneration.confirmed, char.abilityGeneration.method,
      char.classSkillChoices, char.classEquipmentChoice, char.backgroundEquipmentChoice,
      char.spells.cantrips, char.spells.prepared, char.spells.spellcastingAbility,
      char.raceAbilityChoices, char.backgroundAbilityChoices,
      char.inventory, char.equipped, char.features,
      char.classFeatureChoices, char.level,
    ]
  );

  const missingKey = useMemo(
    () => validation.missing.map((m) => m.id).join("|"),
    [validation.missing]
  );

  useEffect(() => {
    if (validation.isComplete) {
      builder.completeStep("sheet");
      builder.setMissing("sheet", []);
    } else {
      builder.uncompleteStep("sheet");
      builder.setMissing(
        "sheet",
        validation.missing.map((m) => m.label)
      );
    }
  }, [validation.isComplete, missingKey]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <StepReview />
      </div>
    </div>
  );
}
