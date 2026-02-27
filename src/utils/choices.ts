import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import { languages as allLanguages } from "@/data/languages";
import { musicalInstruments } from "@/data/musicalInstruments";
import { skills } from "@/data/skills";
import { spellsByClassId } from "@/data/indexes";
import type { CharacterState } from "@/state/characterStore";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";
import { slugifyId } from "@/utils/slugifyId";
import { feats } from "@/data/feats";

export interface ChoiceOption {
  id: string;
  name: string;
}

export interface ChoiceBucket {
  requiredCount: number;
  selectedIds: string[];
  options: ChoiceOption[];
  pendingCount: number;
  sources: string[];
}

export interface RaceChoiceBucket {
  requiredCount: number;
  selectedIds: string[];
  options: ChoiceOption[];
  pendingCount: number;
  sources: string[];
}

export interface ChoicesRequirements {
  needsStep: boolean;
  skills: ChoiceBucket;
  languages: ChoiceBucket;
  tools: ChoiceBucket;
  instruments: ChoiceBucket;
  cantrips: ChoiceBucket;
  spells: ChoiceBucket;
  fightingStyleFeat: ChoiceBucket;
  raceChoice: RaceChoiceBucket;
}

interface ChoicesDatasets {
  classes: typeof classes;
  backgrounds: typeof backgrounds;
  races: typeof races;
}

const DEFAULT_DATASETS: ChoicesDatasets = { classes, backgrounds, races };
const PLACEHOLDER_RX = /\b(à\s+sua\s+escolha|pendente)\b/i;
const LANGUAGE_RX = /(idioma|idiomas)/i;
const INSTRUMENT_RX = /(instrumento|instrumentos)/i;
const TOOL_RX = /(ferramenta|ferramentas|jogo|jogos)/i;

const NUMBER_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
};

function countChoicesFromText(text: string): number {
  const match = text.match(/\b(um|uma|dois|duas|três|tres|quatro|cinco)\b/i);
  if (!match) return 1;
  return NUMBER_WORDS[match[1].toLowerCase()] ?? 1;
}

function makeBucket(requiredCount: number, selectedIds: string[], options: ChoiceOption[], sources: string[]): ChoiceBucket {
  const valid = new Set(options.map((o) => o.id));
  const normalized = selectedIds.filter((id) => valid.has(id));
  const capped = normalized.slice(0, requiredCount);
  return {
    requiredCount,
    selectedIds: capped,
    options,
    pendingCount: Math.max(0, requiredCount - capped.length),
    sources,
  };
}

function resolveCasterSpellLimit(character: CharacterState, classId: string) {
  const cls = classes.find((c) => c.id === classId);
  if (!cls?.spellcasting) return { cantrips: 0, spells: 0, options: [] as { id: string; name: string; level: number }[] };

  const sc = cls.spellcasting;
  const classSpells = spellsByClassId[classId] ?? [];
  const options = classSpells
    .filter((s) => s.level <= Math.min(2, character.level))
    .map((s) => ({ id: s.id, name: s.name, level: s.level }));

  let cantrips = 0;
  for (let lvl = character.level; lvl >= 1; lvl -= 1) {
    if (sc.cantripsKnownAtLevel?.[lvl] != null) {
      cantrips = sc.cantripsKnownAtLevel[lvl];
      break;
    }
  }

  const cfc = character.classFeatureChoices ?? {};
  if (classId === "clerigo" && cfc["clerigo:ordemDivina"] === "taumaturgo") cantrips += 1;
  if (classId === "druida" && cfc["druida:ordemPrimal"] === "xama") cantrips += 1;

  const abilityMap: Record<string, AbilityKey> = {
    Força: "str", Destreza: "dex", Constituição: "con", Inteligência: "int", Sabedoria: "wis", Carisma: "cha",
  };
  const abilityKey = abilityMap[sc.ability] ?? null;
  const finalScores = getFinalAbilityScores(
    character.abilityScores,
    character.racialBonuses,
    character.backgroundBonuses,
    character.asiBonuses,
    character.featAbilityBonuses
  );
  const mod = abilityKey ? calcAbilityMod(finalScores[abilityKey]) : 0;

  let spells = 0;
  if (sc.type === "prepared") {
    spells = Math.max(1, mod + character.level);
  } else {
    const known = (sc as any).spellsKnownAtLevel as Record<number, number> | undefined;
    for (let lvl = character.level; lvl >= 1; lvl -= 1) {
      if (known?.[lvl] != null) {
        spells = known[lvl];
        break;
      }
    }
  }

  return { cantrips, spells, options };
}

export function getChoicesRequirements(
  character: CharacterState,
  datasets: ChoicesDatasets = DEFAULT_DATASETS,
  _canonicalSpecs?: unknown
): ChoicesRequirements {
  const currentClass = datasets.classes.find((c) => c.id === character.class);
  const currentRace = datasets.races.find((r) => r.id === character.race);

  const selections = character.choiceSelections ?? {
    skills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null,
  };

  const languagePlaceholders = (character.proficiencies.languages ?? []).filter((item) => PLACEHOLDER_RX.test(item) && LANGUAGE_RX.test(item));
  const toolPlaceholders = (character.proficiencies.tools ?? []).filter((item) => PLACEHOLDER_RX.test(item));
  const languageRequired = languagePlaceholders.reduce((sum, item) => sum + countChoicesFromText(item), 0);
  const instrumentRequired = toolPlaceholders
    .filter((item) => INSTRUMENT_RX.test(item))
    .reduce((sum, item) => sum + countChoicesFromText(item), 0);
  const toolsRequired = toolPlaceholders
    .filter((item) => TOOL_RX.test(item) && !INSTRUMENT_RX.test(item))
    .reduce((sum, item) => sum + countChoicesFromText(item), 0);

  const knownLanguageIds = new Set(
    (character.proficiencies.languages ?? [])
      .filter((item) => !PLACEHOLDER_RX.test(item))
      .map((name) => allLanguages.find((l) => l.name.toLowerCase() === name.toLowerCase())?.id)
      .filter(Boolean) as string[]
  );

  const knownInstrumentIds = new Set(
    (character.proficiencies.tools ?? [])
      .filter((item) => !PLACEHOLDER_RX.test(item))
      .map((name) => musicalInstruments.find((i) => i.name.toLowerCase() === name.toLowerCase())?.id)
      .filter(Boolean) as string[]
  );

  const languageOptions = allLanguages
    .filter((l) => !knownLanguageIds.has(l.id))
    .map((l) => ({ id: l.id, name: l.name }));

  const instrumentOptions = musicalInstruments
    .filter((i) => !knownInstrumentIds.has(i.id))
    .map((i) => ({ id: i.id, name: i.name }));

  const genericToolOptions = Array.from(new Set((character.proficiencies.tools ?? [])
    .filter((item) => !PLACEHOLDER_RX.test(item) && !INSTRUMENT_RX.test(item))
    .map((name) => ({ id: slugifyId(name), name }))
    .map((item) => `${item.id}::${item.name}`)))
    .map((item) => {
      const [id, name] = item.split("::");
      return { id, name };
    });

  const classSkillRequired = currentClass ? currentClass.skillChoices.choose : 0;
  const isBard = currentClass?.id === "bardo";
  const bardInstrumentRequired = isBard ? 3 : 0;

  const fightingStyleRequired = (character.class === "guerreiro" && character.level >= 1) || (character.class === "guardiao" && character.level >= 2) ? 1 : 0;
  const fightingStyleOptions = feats
    .filter((f) => f.category === "fighting_style")
    .map((f) => ({ id: f.id, name: f.name }));
  const selectedFightingStyle = typeof (character.classFeatureChoices?.fightingStyleFeatId) === "string" ? [character.classFeatureChoices.fightingStyleFeatId as string] : [];
  const classSkillOptions = currentClass
    ? currentClass.skillChoices.from
        .map((name) => skills.find((s) => s.name === name))
        .filter(Boolean)
        .map((s) => ({ id: s!.id, name: s!.name }))
    : [];

  const spellData = character.class ? resolveCasterSpellLimit(character, character.class) : { cantrips: 0, spells: 0, options: [] as any[] };
  const cantripOptions = spellData.options.filter((s) => s.level === 0).map((s) => ({ id: s.id, name: s.name }));
  const leveledOptions = spellData.options.filter((s) => s.level >= 1).map((s) => ({ id: s.id, name: s.name }));

  const raceChoiceRequired = currentRace?.raceChoice?.required ? 1 : 0;
  const raceChoiceOptions = currentRace?.raceChoice?.options?.map((o) => ({ id: o.id, name: o.name })) ?? [];

  const requirements: ChoicesRequirements = {
    skills: makeBucket(classSkillRequired, selections.skills, classSkillOptions, currentClass ? [`class:${currentClass.id}`] : []),
    languages: makeBucket(languageRequired, selections.languages, languageOptions, languagePlaceholders.map((_, idx) => `languages:${idx}`)),
    tools: makeBucket(toolsRequired, selections.tools, genericToolOptions, toolPlaceholders.filter((p) => TOOL_RX.test(p)).map((_, idx) => `tools:${idx}`)),
    instruments: makeBucket(instrumentRequired + bardInstrumentRequired, selections.instruments, instrumentOptions, toolPlaceholders.filter((p) => INSTRUMENT_RX.test(p)).map((_, idx) => `instruments:${idx}`).concat(isBard ? ["class:bardo"] : [])),
    cantrips: makeBucket(spellData.cantrips, selections.cantrips, cantripOptions, currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
    spells: makeBucket(spellData.spells, selections.spells, leveledOptions, currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
    fightingStyleFeat: makeBucket(fightingStyleRequired, selectedFightingStyle, fightingStyleOptions, fightingStyleRequired ? [`class:${character.class}:fighting_style`] : []),
    raceChoice: {
      ...makeBucket(raceChoiceRequired, selections.raceChoice ? [selections.raceChoice] : [], raceChoiceOptions, currentRace?.raceChoice ? [`race:${currentRace.id}`] : []),
    },
    needsStep: false,
  };

  requirements.needsStep = Object.values(requirements).some((bucket: any) => typeof bucket === "object" && "pendingCount" in bucket && bucket.pendingCount > 0);
  return requirements;
}
