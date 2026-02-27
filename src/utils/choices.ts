import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import { languages as allLanguages } from "@/data/languages";
import { musicalInstruments } from "@/data/musicalInstruments";
import { skills } from "@/data/skills";
import { feats } from "@/data/feats";
import { spellsByClassId } from "@/data/indexes";
import type { CharacterState } from "@/state/characterStore";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";
import { slugifyId } from "@/utils/slugifyId";

export interface ChoiceOption { id: string; name: string; }
export interface ChoiceBucket {
  requiredCount: number;
  selectedIds: string[];
  options: ChoiceOption[];
  pendingCount: number;
  sources: string[];
}
export interface ChoicesRequirements {
  needsStep: boolean;
  buckets: {
    classSkills: ChoiceBucket;
    languages: ChoiceBucket;
    tools: ChoiceBucket;
    instruments: ChoiceBucket;
    cantrips: ChoiceBucket;
    spells: ChoiceBucket;
    raceChoice: ChoiceBucket;
    classFeats: ChoiceBucket;
  };
  // legacy aliases
  skills: ChoiceBucket;
}

interface ChoicesDatasets { classes: typeof classes; backgrounds: typeof backgrounds; races: typeof races; }
const DEFAULT_DATASETS: ChoicesDatasets = { classes, backgrounds, races };
const PLACEHOLDER_RX = /\b([àa]\s+sua\s+escolha|pendente)\b/i;
const LANGUAGE_RX = /(idioma|idiomas)/i;
const INSTRUMENT_RX = /(instrumento|instrumentos)/i;
const TOOL_RX = /(ferramenta|ferramentas|jogo|jogos)/i;
const NUMBER_WORDS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5 };

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const countChoicesFromText = (text: string) => NUMBER_WORDS[(text.match(/\b(um|uma|dois|duas|três|tres|quatro|cinco)\b/i)?.[1] ?? "um").toLowerCase()] ?? 1;

function makeBucket(requiredCount: number, selectedIds: string[], options: ChoiceOption[], sources: string[]): ChoiceBucket {
  const valid = new Set(options.map((o) => o.id));
  const capped = selectedIds.filter((id) => valid.has(id)).slice(0, requiredCount);
  return { requiredCount, selectedIds: capped, options, pendingCount: Math.max(0, requiredCount - capped.length), sources };
}

function reqCount(values: string[] | undefined, predicate: (v: string) => boolean): number {
  return (values ?? []).map(normalize).filter((v) => PLACEHOLDER_RX.test(v) && predicate(v)).reduce((sum, v) => sum + countChoicesFromText(v), 0);
}

function uniq(options: ChoiceOption[]) {
  return [...new Map(options.map((o) => [o.id, o])).values()];
}

function resolveCasterSpellLimit(character: CharacterState, classId: string) {
  const cls = classes.find((c) => c.id === classId);
  if (!cls?.spellcasting) return { cantrips: 0, spells: 0, options: [] as { id: string; name: string; level: number }[] };
  const classSpells = spellsByClassId[classId] ?? [];
  const options = classSpells.filter((s) => s.level <= Math.min(2, character.level)).map((s) => ({ id: s.id, name: s.name, level: s.level }));
  let cantrips = 0;
  for (let lvl = character.level; lvl >= 1; lvl -= 1) {
    if (cls.spellcasting.cantripsKnownAtLevel?.[lvl] != null) { cantrips = cls.spellcasting.cantripsKnownAtLevel[lvl]; break; }
  }
  const cfc = character.classFeatureChoices ?? {};
  if (classId === "clerigo" && cfc["clerigo:ordemDivina"] === "taumaturgo") cantrips += 1;
  if (classId === "druida" && cfc["druida:ordemPrimal"] === "xama") cantrips += 1;
  const abilityMap: Record<string, AbilityKey> = { Força: "str", Destreza: "dex", Constituição: "con", Inteligência: "int", Sabedoria: "wis", Carisma: "cha" };
  const key = abilityMap[cls.spellcasting.ability];
  const mod = key ? calcAbilityMod(getFinalAbilityScores(character.abilityScores, character.racialBonuses, character.backgroundBonuses, character.asiBonuses, character.featAbilityBonuses)[key]) : 0;
  let spells = 0;
  if (cls.spellcasting.type === "prepared") spells = Math.max(1, mod + character.level);
  else {
    const known = cls.spellcasting.spellsKnownAtLevel;
    for (let lvl = character.level; lvl >= 1; lvl -= 1) if (known?.[lvl] != null) { spells = known[lvl]; break; }
  }
  return { cantrips, spells, options };
}

export function getChoicesRequirements(character: CharacterState, datasets: ChoicesDatasets = DEFAULT_DATASETS, _canonicalSpecs?: unknown): ChoicesRequirements {
  const currentClass = datasets.classes.find((c) => c.id === character.class);
  const currentBackground = datasets.backgrounds.find((b) => b.id === character.background);
  const currentRace = datasets.races.find((r) => r.id === character.race);

  const selections = character.choiceSelections ?? { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [], skills: [] } as any;
  const skillSel = selections.classSkills ?? selections.skills ?? [];

  const knownLanguageIds = new Set((character.proficiencies.languages ?? []).filter((i) => !PLACEHOLDER_RX.test(i)).map((name) => allLanguages.find((l) => normalize(l.name) === normalize(name))?.id).filter(Boolean) as string[]);
  const knownInstrumentIds = new Set((character.proficiencies.tools ?? []).filter((i) => !PLACEHOLDER_RX.test(i)).map((name) => musicalInstruments.find((l) => normalize(l.name) === normalize(name))?.id).filter(Boolean) as string[]);

  const spellData = character.class ? resolveCasterSpellLimit(character, character.class) : { cantrips: 0, spells: 0, options: [] as any[] };
  const raceChoiceRequired = currentRace?.raceChoice?.required ? 1 : 0;
  const classFeatRequired = character.class === "guerreiro" ? 1 : (character.class === "guardiao" && character.level >= 2 ? 1 : 0);
  const classFeatOptions = feats.filter((f) => ["combate-com-armas-grandes"].includes(f.id)).map((f) => ({ id: f.id, name: f.name }));

  const buckets = {
    classSkills: makeBucket(currentClass ? currentClass.skillChoices.choose : 0, skillSel, uniq((currentClass?.skillChoices.from ?? []).map((name) => skills.find((s) => s.name === name)).filter(Boolean).map((s) => ({ id: (s as any).id, name: (s as any).name }))), currentClass ? [`class:${currentClass.id}`] : []),
    languages: makeBucket(reqCount(character.proficiencies.languages, (v) => LANGUAGE_RX.test(v)) + reqCount(currentBackground?.languages, (v) => LANGUAGE_RX.test(v)) + reqCount(currentRace?.languages, (v) => LANGUAGE_RX.test(v)), selections.languages ?? [], uniq(allLanguages.filter((l) => !knownLanguageIds.has(l.id)).map((l) => ({ id: l.id, name: l.name }))), []),
    tools: makeBucket(reqCount(character.proficiencies.tools, (v) => TOOL_RX.test(v) && !INSTRUMENT_RX.test(v)) + reqCount(currentBackground?.tools, (v) => TOOL_RX.test(v) && !INSTRUMENT_RX.test(v)) + reqCount(currentClass?.proficiencies.tools, (v) => TOOL_RX.test(v) && !INSTRUMENT_RX.test(v)), selections.tools ?? [], uniq((character.proficiencies.tools ?? []).filter((v) => !PLACEHOLDER_RX.test(v) && !INSTRUMENT_RX.test(v)).map((name) => ({ id: slugifyId(name), name }))), []),
    instruments: makeBucket(reqCount(character.proficiencies.tools, (v) => INSTRUMENT_RX.test(v)) + reqCount(currentBackground?.tools, (v) => INSTRUMENT_RX.test(v)) + reqCount(currentClass?.proficiencies.tools, (v) => INSTRUMENT_RX.test(v)), selections.instruments ?? [], uniq(musicalInstruments.filter((i) => !knownInstrumentIds.has(i.id)).map((i) => ({ id: i.id, name: i.name }))), []),
    cantrips: makeBucket(spellData.cantrips, selections.cantrips ?? [], uniq(spellData.options.filter((s) => s.level === 0).map((s) => ({ id: s.id, name: s.name }))), currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
    spells: makeBucket(spellData.spells, selections.spells ?? [], uniq(spellData.options.filter((s) => s.level >= 1).map((s) => ({ id: s.id, name: s.name }))), currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
    raceChoice: makeBucket(raceChoiceRequired, selections.raceChoice ? [selections.raceChoice] : [], uniq(currentRace?.raceChoice?.options?.map((o) => ({ id: o.id, name: o.name })) ?? []), currentRace?.raceChoice ? [`race:${currentRace.id}`] : []),
    classFeats: makeBucket(classFeatRequired, selections.classFeats ?? [], classFeatOptions, classFeatRequired ? [`class:${character.class}:fighting-style`] : []),
  };

  const needsStep = Object.values(buckets).some((b) => b.pendingCount > 0);
  return { needsStep, buckets, skills: buckets.classSkills };
}
