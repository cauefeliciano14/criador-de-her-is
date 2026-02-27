import { useCharacterStore } from "@/state/characterStore";
import { useBuilderStore } from "@/state/builderStore";
import { classes } from "@/data/classes";
import { spellsByClassId } from "@/data/indexes";
import { languages as ALL_LANGUAGES } from "@/data/languages";
import { musicalInstruments } from "@/data/musicalInstruments";
import {
  ABILITY_SHORT,
  calcAbilityMod,
  getFinalAbilityScores,
  type AbilityKey,
} from "@/utils/calculations";
import { CheckCircle2, Globe, Wrench, Sparkles, BookOpen, Music } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getChoicesRequirements } from "@/utils/choices";

const LEVEL_LABELS: Record<number, string> = {
  0: "Truque", 1: "1º Círculo", 2: "2º Círculo", 3: "3º Círculo",
  4: "4º Círculo", 5: "5º Círculo", 6: "6º Círculo", 7: "7º Círculo",
  8: "8º Círculo", 9: "9º Círculo",
};

export function StepChoices() {
  const char = useCharacterStore();
  const patchCharacter = useCharacterStore((s) => s.patchCharacter);
  const completeStep = useBuilderStore((s) => s.completeStep);
  const uncompleteStep = useBuilderStore((s) => s.uncompleteStep);
  const choicesRequirements = useBuilderStore((s) => s.choicesRequirements);

  const cls = classes.find((c) => c.id === char.class);

  // Update choices requirements when character changes
  useEffect(() => {
    useBuilderStore.getState().updateChoicesRequirements();
  }, [
    char.class, char.race, char.subrace, char.background, char.level,
    char.spells.cantrips, char.spells.prepared,
    char.proficiencies.languages, char.proficiencies.tools,
  ]);

  // Check completion
  const isComplete = useMemo(() => {
    if (!choicesRequirements) return false;
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

  const hasCantrips = choicesRequirements.cantrips.pendingCount > 0;
  const hasSpells = choicesRequirements.spells.pendingCount > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Escolhas</h2>
        <p className="text-muted-foreground">
          Faça as escolhas necessárias baseadas na sua classe, raça e origem.
        </p>
      </div>

      <LanguagePickerSection char={char} choicesRequirements={choicesRequirements} patchCharacter={patchCharacter} />
      <ToolPickerSection char={char} choicesRequirements={choicesRequirements} patchCharacter={patchCharacter} />
      {hasCantrips && <CantripsSection char={char} cls={cls} choicesRequirements={choicesRequirements} patchCharacter={patchCharacter} />}
      {hasSpells && <SpellsSection char={char} cls={cls} choicesRequirements={choicesRequirements} patchCharacter={patchCharacter} />}

      {isComplete && (
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">Todas as escolhas foram feitas!</span>
        </div>
      )}
    </div>
  );
}

// ── Language Picker ──

function LanguagePickerSection({ char, choicesRequirements, patchCharacter }: any) {
  const hasLang = choicesRequirements.languages.requiredCount > 0;
  if (!hasLang) return null;

  // Determine which languages the character already knows (non-placeholder)
  const PLACEHOLDER_RX = /\bà\s+sua\s+escolha\b/i;
  const knownLanguages = (char.proficiencies.languages ?? []).filter((l: string) => !PLACEHOLDER_RX.test(l));
  const knownSet = new Set(knownLanguages.map((l: string) => l.toLowerCase()));

  // Available languages (exclude already known)
  const available = ALL_LANGUAGES.filter((l) => !knownSet.has(l.name.toLowerCase()));

  const applyLanguageChoice = (languageName: string) => {
    const langs = [...(char.proficiencies.languages ?? [])];
    const idx = langs.findIndex((l: string) => PLACEHOLDER_RX.test(l));
    if (idx === -1) return;

    // Check if the placeholder is for multiple languages (e.g. "Dois idiomas à sua escolha")
    const placeholder = langs[idx];
    const countMatch = placeholder.match(/\b(dois|duas)\b/i);
    if (countMatch) {
      // Replace "Dois idiomas" with the chosen one and keep a "Um idioma à sua escolha" for the remaining
      langs[idx] = languageName;
      langs.splice(idx + 1, 0, "Um idioma à sua escolha");
    } else {
      langs[idx] = languageName;
    }

    patchCharacter({ proficiencies: { ...char.proficiencies, languages: langs } });
  };

  const commonLangs = available.filter((l) => l.category === "comum");
  const exoticLangs = available.filter((l) => l.category === "exótico");

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Idiomas</h3>
        <Badge variant="outline">
          {choicesRequirements.languages.pendingCount} restante(s)
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Escolha um idioma adicional. Idiomas que você já conhece estão desabilitados.
      </p>

      {commonLangs.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Idiomas Comuns</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {commonLangs.map((lang) => (
              <button
                key={lang.id}
                onClick={() => applyLanguageChoice(lang.name)}
                className="p-3 rounded-lg border text-left transition-colors hover:bg-muted border-border"
              >
                <span className="font-medium text-sm">{lang.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{lang.typicalSpeakers}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {exoticLangs.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Idiomas Exóticos</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {exoticLangs.map((lang) => (
              <button
                key={lang.id}
                onClick={() => applyLanguageChoice(lang.name)}
                className="p-3 rounded-lg border text-left transition-colors hover:bg-muted border-border"
              >
                <span className="font-medium text-sm">{lang.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{lang.typicalSpeakers}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Tool/Instrument Picker ──

function ToolPickerSection({ char, choicesRequirements, patchCharacter }: any) {
  const hasTools = choicesRequirements.tools.requiredCount > 0;
  if (!hasTools) return null;

  const PLACEHOLDER_RX = /\bà\s+sua\s+escolha\b/i;
  const INSTRUMENT_RX = /instrumento|instrumentos/i;

  // Determine if the placeholder is specifically for musical instruments
  const placeholders = choicesRequirements.tools.placeholders as string[];
  const isInstrumentChoice = placeholders.some((p: string) => INSTRUMENT_RX.test(p));

  // Already chosen tools (non-placeholder)
  const knownTools = (char.proficiencies.tools ?? []).filter((t: string) => !PLACEHOLDER_RX.test(t));
  const knownSet = new Set(knownTools.map((t: string) => t.toLowerCase()));

  const availableInstruments = musicalInstruments.filter((i) => !knownSet.has(i.name.toLowerCase()));

  const applyToolChoice = (toolName: string) => {
    const tools = [...(char.proficiencies.tools ?? [])];
    const idx = tools.findIndex((t: string) => PLACEHOLDER_RX.test(t));
    if (idx === -1) return;

    // Handle multi-count placeholders (e.g. "Três instrumentos musicais à sua escolha")
    const placeholder = tools[idx];
    const countMap: Record<string, number> = { dois: 2, duas: 2, três: 3, quatro: 4, cinco: 5 };
    const countMatch = placeholder.match(/\b(dois|duas|três|quatro|cinco)\b/i);
    const remaining = countMatch ? (countMap[countMatch[1].toLowerCase()] ?? 1) - 1 : 0;

    if (remaining > 0) {
      // Replace the placeholder with the chosen value, and add a new placeholder for remaining
      const numWords: Record<number, string> = { 1: "Um", 2: "Dois", 3: "Três", 4: "Quatro" };
      const newPlaceholder = `${numWords[remaining] ?? remaining} instrumento${remaining > 1 ? "s" : ""} musical${remaining > 1 ? "ais" : ""} à sua escolha`;
      tools[idx] = toolName;
      tools.splice(idx + 1, 0, newPlaceholder);
    } else {
      tools[idx] = toolName;
    }

    patchCharacter({ proficiencies: { ...char.proficiencies, tools } });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        {isInstrumentChoice ? <Music className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
        <h3 className="text-lg font-semibold">
          {isInstrumentChoice ? "Instrumentos Musicais" : "Ferramentas"}
        </h3>
        <Badge variant="outline">
          {choicesRequirements.tools.pendingCount} restante(s)
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isInstrumentChoice
          ? "Escolha seus instrumentos musicais. Instrumentos já escolhidos estão desabilitados."
          : "Escolha suas ferramentas adicionais."}
      </p>

      {isInstrumentChoice ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {availableInstruments.map((inst) => (
            <button
              key={inst.id}
              onClick={() => applyToolChoice(inst.name)}
              className="p-3 rounded-lg border text-left transition-colors hover:bg-muted border-border"
            >
              <span className="font-medium text-sm">{inst.name}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{inst.cost}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">
          Escolha manual necessária. Consulte o Mestre.
        </div>
      )}
    </Card>
  );
}

// ── Cantrips Section ──

function CantripsSection({ char, cls, choicesRequirements, patchCharacter }: any) {
  const cantripsLimit = choicesRequirements.cantrips.requiredCount;
  const selectedCantrips = char.spells.cantrips;
  const remainingCantrips = cantripsLimit - selectedCantrips.length;

  const availableCantrips = useMemo(() => {
    if (!cls?.spellcasting || !char.class) return [];
    const classSpells = spellsByClassId[char.class] || [];
    return classSpells.filter((spell: any) => spell.level === 0);
  }, [cls?.spellcasting, char.class]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Truques</h3>
        <Badge variant="outline">{remainingCantrips} restantes</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {availableCantrips.map((spell: any) => {
          const isSelected = selectedCantrips.includes(spell.id);
          return (
            <button
              key={spell.id}
              onClick={() => {
                if (isSelected) {
                  patchCharacter({ spells: { ...char.spells, cantrips: selectedCantrips.filter((id: string) => id !== spell.id) } });
                } else if (remainingCantrips > 0) {
                  patchCharacter({ spells: { ...char.spells, cantrips: [...selectedCantrips, spell.id] } });
                }
              }}
              className={`p-3 rounded-lg border text-left transition-colors ${
                isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{spell.name}</span>
                <Badge variant="secondary" className="text-xs">{LEVEL_LABELS[spell.level]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{spell.school}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Spells Section ──

function SpellsSection({ char, cls, choicesRequirements, patchCharacter }: any) {
  const spellsLimit = choicesRequirements.spells.requiredCount;
  const selectedSpells = char.spells.prepared;
  const remainingSpells = spellsLimit - selectedSpells.length;

  const availableSpells = useMemo(() => {
    if (!cls?.spellcasting || !char.class) return [];
    const ids = new Set(choicesRequirements.spells.options);
    const classSpells = spellsByClassId[char.class] || [];
    return classSpells.filter((spell: any) => ids.has(spell.id));
  }, [cls?.spellcasting, char.class, choicesRequirements.spells.options]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Magias Preparadas</h3>
        <Badge variant="outline">{remainingSpells} restantes</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {availableSpells.map((spell: any) => {
          const isSelected = selectedSpells.includes(spell.id);
          return (
            <button
              key={spell.id}
              onClick={() => {
                if (isSelected) {
                  patchCharacter({ spells: { ...char.spells, prepared: selectedSpells.filter((id: string) => id !== spell.id) } });
                } else if (remainingSpells > 0) {
                  patchCharacter({ spells: { ...char.spells, prepared: [...selectedSpells, spell.id] } });
                }
              }}
              className={`p-3 rounded-lg border text-left transition-colors ${
                isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{spell.name}</span>
                <Badge variant="secondary" className="text-xs">{LEVEL_LABELS[spell.level]}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{spell.school}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
