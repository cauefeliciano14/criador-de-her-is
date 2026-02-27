import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import { spells, type SpellData } from "@/data/spells";
import { spellsByClassId } from "@/data/indexes";
import {
  ALL_SKILLS,
  ABILITY_SHORT,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
} from "@/utils/calculations";
import { CheckCircle2, Circle, Info, Shield, Wrench, Globe, Swords, ArrowRight, Star, BookOpen, Sparkles, Flame, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getChoicesRequirements } from "@/utils/choices";

const LEVEL_LABELS: Record<number, string> = {
  0: "Truque",
  1: "1º Círculo",
  2: "2º Círculo",
  3: "3º Círculo",
  4: "4º Círculo",
  5: "5º Círculo",
  6: "6º Círculo",
  7: "7º Círculo",
  8: "8º Círculo",
  9: "9º Círculo",
};

export function StepChoices() {
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const setMissing = useBuilderStore((s) => s.setMissing);
  const choicesRequirements = useBuilderStore((s) => s.choicesRequirements);

const [languageInput, setLanguageInput] = useState("");
const [toolInput, setToolInput] = useState("");

const applyLanguageChoice = () => {
  const value = languageInput.trim();
  if (!value) return;
  const langs = [...(char.proficiencies.languages ?? [])];
  const idx = langs.findIndex((l) => /à\s+sua\s+escolha/i.test(l));
  if (idx === -1) return;
  langs[idx] = value;
  patchCharacter({ proficiencies: { ...char.proficiencies, languages: langs } });
  setLanguageInput("");
};

const applyToolChoice = () => {
  const value = toolInput.trim();
  if (!value) return;
  const tools = [...(char.proficiencies.tools ?? [])];
  const idx = tools.findIndex((t) => /à\s+sua\s+escolha/i.test(t));
  if (idx === -1) return;
  tools[idx] = value;
  patchCharacter({ proficiencies: { ...char.proficiencies, tools } });
  setToolInput("");
};

  const cls = classes.find((c) => c.id === char.class);
  const bg = backgrounds.find((b) => b.id === char.background);
  const race = races.find((r) => r.id === char.race);
  const subrace = race?.subraces.find((sr) => sr.id === char.subrace);

  const finalScores = getFinalAbilityScores(char.abilityScores, char.racialBonuses, char.backgroundBonuses, char.asiBonuses, char.featAbilityBonuses);

  // Update choices requirements when character changes
  useEffect(() => {
    useBuilderStore.getState().updateChoicesRequirements();
  }, [
    char.class,
    char.race,
    char.subrace,
    char.background,
    char.level,
    char.classSkillChoices,
    char.spells.cantrips,
    char.spells.prepared,
    char.proficiencies.languages,
    char.proficiencies.tools,
  ]);

  // Check completion - must be before early return to respect hooks rules
  const isComplete = useMemo(() => {
    if (!choicesRequirements) return false;
    if (choicesRequirements.skills.pendingCount > 0) return false;
    if (choicesRequirements.cantrips.pendingCount > 0) return false;
    if (choicesRequirements.spells.pendingCount > 0) return false;
    if (choicesRequirements.languages.pendingCount > 0) return false;
    if (choicesRequirements.tools.pendingCount > 0) return false;
    return true;
  }, [choicesRequirements]);

  useEffect(() => {
    if (isComplete) {
      completeStep("choices");
    } else {
      uncompleteStep("choices");
    }
  }, [isComplete, completeStep, uncompleteStep]);

  if (!choicesRequirements) return null;

  const hasSkills = choicesRequirements.skills.pendingCount > 0;
  const hasCantrips = choicesRequirements.cantrips.pendingCount > 0;
  const hasSpells = choicesRequirements.spells.pendingCount > 0;

  const renderLanguageToolsSection = () => {
    const hasLang = choicesRequirements.languages.requiredCount > 0;
    const hasTools = choicesRequirements.tools.requiredCount > 0;
    if (!hasLang && !hasTools) return null;

    return (
      <div className="space-y-4">
        {hasLang && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Idiomas</h3>
              <Badge variant="outline">
                {choicesRequirements.languages.pendingCount} restante(s)
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Há {choicesRequirements.languages.pendingCount} escolha(s) pendente(s) de idioma.
              Substitua cada item marcado como “à sua escolha” por um idioma definido por você.
            </div>
            <div className="flex gap-2">
              <Input
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                placeholder="Digite o idioma (ex.: Comum)"
              />
              <Button onClick={applyLanguageChoice} disabled={!languageInput.trim()}>
                Aplicar
              </Button>
            </div>
          </Card>
        )}

        {hasTools && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Ferramentas / Instrumentos</h3>
              <Badge variant="outline">
                {choicesRequirements.tools.pendingCount} restante(s)
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Há {choicesRequirements.tools.pendingCount} escolha(s) pendente(s) de ferramenta/instrumento.
              Substitua cada item marcado como “à sua escolha” por uma proficiência definida por você.
            </div>
            <div className="flex gap-2">
              <Input
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                placeholder="Digite a proficiência (ex.: Instrumento musical)"
              />
              <Button onClick={applyToolChoice} disabled={!toolInput.trim()}>
                Aplicar
              </Button>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // Skills section
  const renderSkillsSection = () => {
    if (!hasSkills) return null;

    const classChoices = cls?.skillChoices;
    const maxClassSkills = classChoices?.choose ?? 0;
    const remainingSkills = maxClassSkills - char.classSkillChoices.length;

    return (
      <div className="space-y-4">
      <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Perícias</h3>
          <Badge variant="outline">
            {remainingSkills} restantes
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {ALL_SKILLS.map((skillObj) => {
            const skillName = skillObj.name;
            const ability = skillObj.ability;
            const isSelected = char.classSkillChoices.includes(skillName);
            const mod = calcAbilityMod(finalScores[ability]);
            const bonus = isSelected ? mod + char.proficiencyBonus : mod;

            return (
              <button
                key={skillName}
                onClick={() => {
                  if (isSelected) {
                    patchCharacter({
                      classSkillChoices: char.classSkillChoices.filter(s => s !== skillName)
                    });
                  } else if (remainingSkills > 0) {
                    patchCharacter({
                      classSkillChoices: [...char.classSkillChoices, skillName]
                    });
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{skillName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      {ABILITY_SHORT[ability]}
                    </span>
                    <span className={`text-sm font-medium ${bonus >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {bonus >= 0 ? "+" : ""}{bonus}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Cantrips section
  const renderCantripsSection = () => {
    if (!hasCantrips) return null;

    const sc = cls?.spellcasting;
    const cantripsLimit = choicesRequirements.cantrips.requiredCount;
    const selectedCantrips = char.spells.cantrips;
    const remainingCantrips = cantripsLimit - selectedCantrips.length;

    const availableCantrips = useMemo(() => {
      if (!sc || !char.class) return [];
      const classSpells = spellsByClassId[char.class] || [];
      return classSpells.filter((spell) => spell.level === 0);
    }, [sc, char.class]);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Truques</h3>
          <Badge variant="outline">
            {remainingCantrips} restantes
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {availableCantrips.map((spell) => {
            const isSelected = selectedCantrips.includes(spell.id);

            return (
              <button
                key={spell.id}
                onClick={() => {
                  if (isSelected) {
                    patchCharacter({
                      spells: {
                        ...char.spells,
                        cantrips: selectedCantrips.filter(id => id !== spell.id)
                      }
                    });
                  } else if (remainingCantrips > 0) {
                    patchCharacter({
                      spells: {
                        ...char.spells,
                        cantrips: [...selectedCantrips, spell.id]
                      }
                    });
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{spell.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {LEVEL_LABELS[spell.level]}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {spell.school}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Spells section
  const renderSpellsSection = () => {
    if (!hasSpells) return null;

    const sc = cls?.spellcasting;
    const spellsLimit = choicesRequirements.spells.requiredCount;
    const selectedSpells = char.spells.prepared;
    const remainingSpells = spellsLimit - selectedSpells.length;

    const availableSpells = useMemo(() => {
      if (!sc || !char.class) return [];
      const ids = new Set(choicesRequirements.spells.options);
      const classSpells = spellsByClassId[char.class] || [];
      return classSpells.filter((spell) => ids.has(spell.id));
    }, [sc, char.class, choicesRequirements.spells.options]);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Magias Preparadas</h3>
          <Badge variant="outline">
            {remainingSpells} restantes
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {availableSpells.map((spell) => {
            const isSelected = selectedSpells.includes(spell.id);

            return (
              <button
                key={spell.id}
                onClick={() => {
                  if (isSelected) {
                    patchCharacter({
                      spells: {
                        ...char.spells,
                        prepared: selectedSpells.filter(id => id !== spell.id)
                      }
                    });
                  } else if (remainingSpells > 0) {
                    patchCharacter({
                      spells: {
                        ...char.spells,
                        prepared: [...selectedSpells, spell.id]
                      }
                    });
                  }
                }}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{spell.name}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {LEVEL_LABELS[spell.level]}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {spell.school}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolhas</h2>
        <p className="text-muted-foreground">
          Faça as escolhas necessárias baseadas na sua classe, raça e origem.
        </p>
      </div>

      {renderLanguageToolsSection()}
      {renderSkillsSection()}
      {renderCantripsSection()}
      {renderSpellsSection()}

      {isComplete && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Todas as escolhas foram feitas!</span>
        </div>
      )}
    </div>
  );
}