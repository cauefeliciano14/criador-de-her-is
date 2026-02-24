import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { ALL_SKILLS } from "@/utils/calculations";
import { CheckCircle2, Circle } from "lucide-react";
import { useEffect } from "react";

export function StepSkills() {
  const classId = useCharacterStore((s) => s.class);
  const bgId = useCharacterStore((s) => s.background);
  const skills = useCharacterStore((s) => s.skills);
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);

  const cls = classes.find((c) => c.id === classId);
  const bg = backgrounds.find((b) => b.id === bgId);

  const bgSkills = bg?.skills ?? [];
  const classChoices = cls?.skillChoices;
  const maxClassSkills = classChoices?.choose ?? 0;

  // Skills chosen from class options (exclude bg skills)
  const classSkillsChosen = skills.filter(
    (s) => !bgSkills.includes(s) && (classChoices?.from.includes(s) ?? false)
  );

  const toggleSkill = (skillName: string) => {
    if (bgSkills.includes(skillName)) return; // can't toggle bg skills
    if (skills.includes(skillName)) {
      patchCharacter({ skills: skills.filter((s) => s !== skillName) });
    } else {
      if (classSkillsChosen.length >= maxClassSkills) return;
      patchCharacter({ skills: [...skills, skillName] });
    }
  };

  // Auto-add bg skills
  useEffect(() => {
    const missing = bgSkills.filter((s) => !skills.includes(s));
    if (missing.length > 0) {
      patchCharacter({ skills: [...skills, ...missing] });
    }
  }, [bgId]);

  // Completion check
  useEffect(() => {
    if (classSkillsChosen.length >= maxClassSkills) {
      completeStep("skills");
      setMissing("skills", []);
    } else {
      uncompleteStep("skills");
      setMissing("skills", [
        `Escolher ${maxClassSkills - classSkillsChosen.length} perícia(s) da classe`,
      ]);
    }
  }, [skills, classId]);

  const sortedSkills = [...ALL_SKILLS].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1">6. Perícias & Proficiências</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Perícias do antecedente são automáticas. Escolha {maxClassSkills} perícia(s) das
        opções da classe ({classSkillsChosen.length}/{maxClassSkills} escolhidas).
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSkills.map((skill) => {
          const isBg = bgSkills.includes(skill.name);
          const isChosen = skills.includes(skill.name);
          const isClassOption = classChoices?.from.includes(skill.name) ?? false;
          const canToggle = !isBg && isClassOption && (isChosen || classSkillsChosen.length < maxClassSkills);

          return (
            <button
              key={skill.name}
              onClick={() => canToggle && toggleSkill(skill.name)}
              disabled={!canToggle && !isBg}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                isChosen
                  ? "border-primary bg-primary/10"
                  : isBg
                  ? "border-success/30 bg-success/5 cursor-default"
                  : isClassOption
                  ? "hover:border-muted-foreground/40 hover:bg-secondary cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              {isChosen || isBg ? (
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${isBg ? "text-success" : "text-primary"}`} />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div>
                <span className="font-medium">{skill.name}</span>
                {isBg && <span className="ml-2 text-xs text-success">(antecedente)</span>}
                {isClassOption && !isBg && <span className="ml-2 text-xs text-muted-foreground">(classe)</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
