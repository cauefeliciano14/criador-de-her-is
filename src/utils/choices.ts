import { classes } from "@/data/classes";
import { backgrounds } from "@/data/backgrounds";
import { races } from "@/data/races";
import type { RaceChoiceOption } from "@/data/races";
import { commonLanguages } from "@/data/languagesCommon";
import { instruments } from "@/data/instruments";
import { items } from "@/data/items";
import { skills } from "@/data/skills";
import { feats } from "@/data/feats";
import { spellsByClassId } from "@/data/indexes";
import type { CharacterState } from "@/state/characterStore";
import { calcAbilityMod, getFinalAbilityScores, type AbilityKey } from "@/utils/calculations";

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
  skills: ChoiceBucket;
}

interface ChoicesDatasets { classes: typeof classes; backgrounds: typeof backgrounds; races: typeof races; }
const DEFAULT_DATASETS: ChoicesDatasets = { classes, backgrounds, races };
const PLACEHOLDER_RX = /\b([àa]\s+sua\s+escolha|pendente)\b/i;
const LANGUAGE_RX = /(idioma|idiomas)/i;
const INSTRUMENT_RX = /(instrumento|instrumentos)/i;
const TOOL_RX = /(ferramenta|ferramentas|jogo|jogos)/i;
const GAME_TOOL_RX = /(tipo de jogo|jogo|jogos)/i;
const ARTISAN_TOOL_RX = /(ferramenta(?:s)? de artes[aã]o|tipo de ferramenta de artes[aã]o)/i;
const NUMBER_WORDS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5 };
const CANONICAL_CLASS_SKILL_COUNTS: Record<string, number> = {
  barbaro: 2, bardo: 3, bruxo: 2, clerigo: 2, druida: 2, feiticeiro: 2, guardiao: 3, guerreiro: 2, ladino: 4, mago: 2, monge: 2, paladino: 2,
};
const RACE_CHOICE_KEY_BY_KIND: Record<string, string> = {
  dragonAncestry: "draconicAncestry",
  elfLineage: "elvenLineage",
  gnomeLineage: "gnomishLineage",
  giantAncestry: "giantAncestry",
  infernalLegacy: "infernalLegacy",
  sizeChoice: "height",
};

export function getCanonicalRaceChoiceKey(kind?: string | null) {
  if (!kind) return "";
  return RACE_CHOICE_KEY_BY_KIND[kind] ?? kind;
}

export function getCanonicalRaceChoiceKeyFromSources(sources: string[]) {
  const source = (sources ?? []).find((entry) => entry.startsWith("race:"));
  if (!source) return "";
  return source.split(":").pop() ?? "";
}

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const countChoicesFromText = (text: string) => NUMBER_WORDS[(text.match(/\b(um|uma|dois|duas|três|tres|quatro|cinco)\b/i)?.[1] ?? "um").toLowerCase()] ?? 1;
const uniq = (options: ChoiceOption[]) => [...new Map(options.map((o) => [o.id, o])).values()];

type ToolSubtype = "any" | "artisan" | "game";

const TOOL_CATALOG: Array<ChoiceOption & { subtype: ToolSubtype }> = [
  ...items
    .filter((item) => item.type === "tool")
    .map((item) => ({ id: item.id, name: item.name, subtype: "any" as const })),
  { id: "jogo-dados", name: "Jogo de Dados", subtype: "game" },
  { id: "jogo-cartas", name: "Jogo de Cartas", subtype: "game" },
  { id: "jogo-xadrez", name: "Jogo de Xadrez", subtype: "game" },
  { id: "jogo-tabuleiro", name: "Jogo de Tabuleiro", subtype: "game" },
  { id: "ferramentas-artesao-alquimista", name: "Ferramentas de Alquimista", subtype: "artisan" },
  { id: "ferramentas-artesao-cervejeiro", name: "Ferramentas de Cervejeiro", subtype: "artisan" },
  { id: "ferramentas-artesao-ferreiro", name: "Ferramentas de Ferreiro", subtype: "artisan" },
  { id: "ferramentas-artesao-carpinteiro", name: "Ferramentas de Carpinteiro", subtype: "artisan" },
  { id: "ferramentas-artesao-coureiro", name: "Ferramentas de Coureiro", subtype: "artisan" },
  { id: "ferramentas-artesao-joalheiro", name: "Ferramentas de Joalheiro", subtype: "artisan" },
  { id: "ferramentas-artesao-marceneiro", name: "Ferramentas de Marceneiro", subtype: "artisan" },
  { id: "ferramentas-artesao-mestre-ceramica", name: "Ferramentas de Oleiro", subtype: "artisan" },
  { id: "ferramentas-artesao-pedreiro", name: "Ferramentas de Pedreiro", subtype: "artisan" },
  { id: "ferramentas-artesao-tecelao", name: "Ferramentas de Tecelão", subtype: "artisan" },
  { id: "ferramentas-artesao-vidraceiro", name: "Ferramentas de Vidraceiro", subtype: "artisan" },
];

function getToolSubtype(text: string): ToolSubtype {
  if (ARTISAN_TOOL_RX.test(text)) return "artisan";
  if (GAME_TOOL_RX.test(text)) return "game";
  return "any";
}

function buildToolRequirements(values: string[] | undefined) {
  return (values ?? [])
    .map((value) => ({ raw: value, normalized: normalize(value) }))
    .filter(({ normalized }) => PLACEHOLDER_RX.test(normalized) && TOOL_RX.test(normalized) && !INSTRUMENT_RX.test(normalized))
    .map(({ raw, normalized }) => ({ count: countChoicesFromText(raw), subtype: getToolSubtype(normalized), raw }));
}

function makeBucket(requiredCount: number, selectedIds: string[], options: ChoiceOption[], sources: string[]): ChoiceBucket {
  const safeOptions = options ?? [];
  const valid = new Set(safeOptions.map((o) => o.id));
  const capped = selectedIds.filter((id) => valid.has(id)).slice(0, requiredCount);
  return { requiredCount, selectedIds: capped, options: safeOptions, pendingCount: Math.max(0, requiredCount - capped.length), sources };
}

function reqCount(values: string[] | undefined, predicate: (v: string) => boolean): number {
  return (values ?? []).map(normalize).filter((v) => PLACEHOLDER_RX.test(v) && predicate(v)).reduce((sum, v) => sum + countChoicesFromText(v), 0);
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

function normalizeSpellId(id: string) {
  return normalize(id).replace(/[^a-z0-9]/g, "");
}

function findSpellByAnyId(id: string) {
  const n = normalizeSpellId(id);
  return (spellsByClassId.mago ?? [])
    .concat(...Object.values(spellsByClassId))
    .find((spell) => normalizeSpellId(spell.id) === n);
}

function resolveExtraMagicSources(character: CharacterState) {
  const race = races.find((r) => r.id === character.race);
  const background = backgrounds.find((b) => b.id === character.background);
  const cantripOptions: Array<{ id: string; name: string; level: number }> = [];
  const spellOptions: Array<{ id: string; name: string; level: number }> = [];
  const fixedCantrips: string[] = [];
  const fixedSpells: string[] = [];
  let cantrips = 0;
  let spells = 0;

  const raceChoice = race?.raceChoice;
  if (raceChoice) {
    const raceChoiceKey = getCanonicalRaceChoiceKey(raceChoice.kind);
    const selected = raceChoice.options.find((opt) => opt.id === character.raceChoices?.[raceChoiceKey]);
    if (selected?.effects.spellsGranted?.length) {
      for (const granted of selected.effects.spellsGranted) {
        const spell = findSpellByAnyId(granted.spellId);
        if (!spell) continue;
        if (granted.level === 0) {
          fixedCantrips.push(spell.id);
          cantripOptions.push({ id: spell.id, name: spell.name, level: 0 });
        } else {
          fixedSpells.push(spell.id);
          spellOptions.push({ id: spell.id, name: spell.name, level: spell.level });
        }
      }
    }

    if (race?.id === "elfo" && selected?.id === "altoElfo") {
      const wizardCantrips = (spellsByClassId.mago ?? [])
        .filter((spell) => spell.level === 0)
        .map((spell) => ({ id: spell.id, name: spell.name, level: spell.level }));
      cantripOptions.push(...wizardCantrips);
      cantrips += 1;
    }
  }

  if (background?.originFeat?.id === "iniciado-em-magia") {
    const allowedClassIds = ["bardo", "clerigo", "druida", "feiticeiro", "bruxo", "mago"];
    const magicInitiateSpells = Object.entries(spellsByClassId)
      .filter(([classId]) => allowedClassIds.includes(classId))
      .flatMap(([, spellsList]) => spellsList)
      .filter((spell) => spell.level <= 1)
      .map((spell) => ({ id: spell.id, name: spell.name, level: spell.level }));
    cantripOptions.push(...magicInitiateSpells.filter((spell) => spell.level === 0));
    spellOptions.push(...magicInitiateSpells.filter((spell) => spell.level === 1));
    cantrips += 2;
    spells += 1;
  }

  return {
    cantrips,
    spells,
    cantripOptions,
    spellOptions,
    fixedCantrips,
    fixedSpells,
  };
}

export function getChoicesRequirements(character: CharacterState, datasets: ChoicesDatasets = DEFAULT_DATASETS, _canonicalSpecs?: unknown): ChoicesRequirements {
  const currentClass = datasets.classes.find((c) => c.id === character.class);
  const currentBackground = datasets.backgrounds.find((b) => b.id === character.background);
  const currentRace = datasets.races.find((r) => r.id === character.race);

  const selections = character.choiceSelections ?? { classSkills: [], languages: [], tools: [], instruments: [], cantrips: [], spells: [], raceChoice: null, classFeats: [], skills: [] } as any;
  const spellData = character.class ? resolveCasterSpellLimit(character, character.class) : { cantrips: 0, spells: 0, options: [] as any[] };
  const extraMagic = resolveExtraMagicSources(character);

  const classSkillRequired = currentClass ? (CANONICAL_CLASS_SKILL_COUNTS[currentClass.id] ?? currentClass.skillChoices.choose) : 0;
  const classSkillOptions = uniq((currentClass?.skillChoices.from ?? []).map((name) => skills.find((s) => normalize(s.name) === normalize(name))).filter(Boolean).map((s) => ({ id: (s as any).id, name: (s as any).name })));

  const raceLangReq = reqCount(currentRace?.languages, (v) => LANGUAGE_RX.test(v));
  const bgLangReq = reqCount(currentBackground?.languages, (v) => LANGUAGE_RX.test(v));
  const languageRequiredCount = 2 + raceLangReq + bgLangReq;
  const languageOptions = uniq(
    commonLanguages
      .filter((l) => l.id !== "comum")
      .map((l) => ({ id: l.id, name: l.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  );

  const instrumentRequiredCount = reqCount(currentBackground?.tools, (v) => INSTRUMENT_RX.test(v))
    + reqCount(currentClass?.proficiencies.tools, (v) => INSTRUMENT_RX.test(v));

  const backgroundToolRequirements = buildToolRequirements(currentBackground?.tools);
  const classToolRequirements = buildToolRequirements(currentClass?.proficiencies.tools);
  const toolRequirements = [...backgroundToolRequirements, ...classToolRequirements];
  const toolRequiredCount = toolRequirements.reduce((sum, req) => sum + req.count, 0);
  const toolSubtypes = new Set(toolRequirements.map((req) => req.subtype));
  const toolOptions = uniq(TOOL_CATALOG
    .filter((tool) => {
      if (toolSubtypes.size === 0) return false;
      if (toolSubtypes.has("any")) return true;
      if (toolSubtypes.has("artisan") && tool.subtype === "artisan") return true;
      if (toolSubtypes.has("game") && tool.subtype === "game") return true;
      return false;
    })
    .map(({ id, name }) => ({ id, name })));

  const raceChoiceData = currentRace?.raceChoice;
  const raceChoiceOptionsReady = (raceChoiceData?.options ?? []).filter((option: RaceChoiceOption) => option.availability !== "planned");
  const raceChoiceKey = getCanonicalRaceChoiceKey(raceChoiceData?.kind);
  const raceChoiceRequired = raceChoiceData?.required && currentRace?.id !== "aasimar" && raceChoiceOptionsReady.length > 0 ? 1 : 0;
  const raceChoiceSelected = raceChoiceKey ? character.raceChoices?.[raceChoiceKey] : null;
  const classFeatRequired = character.class === "guerreiro" ? 1 : (character.class === "guardiao" && character.level >= 2 ? 1 : 0);
  const classFeatOptions = feats.filter((f) => ["combate-com-armas-grandes"].includes(f.id)).map((f) => ({ id: f.id, name: f.name }));

  const buckets = {
    classSkills: makeBucket(classSkillRequired, selections.classSkills ?? selections.skills ?? character.classSkillChoices ?? [], classSkillOptions, currentClass ? [`class:${currentClass.id}`] : []),
    languages: makeBucket(languageRequiredCount, selections.languages ?? [], languageOptions, [
      "base:common:2",
      ...(raceLangReq > 0 && currentRace ? [`race:${currentRace.id}:${raceLangReq}`] : []),
      ...(bgLangReq > 0 && currentBackground ? [`background:${currentBackground.id}:${bgLangReq}`] : []),
    ]),
    tools: makeBucket(toolRequiredCount, selections.tools ?? [], toolOptions, [
      ...backgroundToolRequirements.map((req) => `background:${currentBackground?.id}:${req.subtype}:${req.count}`),
      ...classToolRequirements.map((req) => `class:${currentClass?.id}:${req.subtype}:${req.count}`),
    ]),
    instruments: makeBucket(
      instrumentRequiredCount,
      selections.instruments ?? [],
      uniq(instruments.map((i) => ({ id: i.id, name: i.name }))).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      [
      ...(character.class === "bardo" ? ["class:bardo:3"] : []),
      ...(reqCount(currentBackground?.tools, (v) => INSTRUMENT_RX.test(v)) > 0 && currentBackground ? [`background:${currentBackground.id}:${reqCount(currentBackground?.tools, (v) => INSTRUMENT_RX.test(v))}`] : []),
    ]),
    cantrips: makeBucket(
      spellData.cantrips + extraMagic.cantrips,
      [...(extraMagic.fixedCantrips ?? []), ...(selections.cantrips ?? [])],
      uniq([...spellData.options, ...extraMagic.cantripOptions].filter((s) => s.level === 0).map((s) => ({ id: s.id, name: s.name }))),
      [
        ...(currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
        ...(extraMagic.cantrips > 0 ? ["background-or-race:cantrips"] : []),
      ]
    ),
    spells: makeBucket(
      spellData.spells + extraMagic.spells,
      [...(extraMagic.fixedSpells ?? []), ...(selections.spells ?? [])],
      uniq([...spellData.options, ...extraMagic.spellOptions].filter((s) => s.level >= 1).map((s) => ({ id: s.id, name: s.name }))),
      [
        ...(currentClass?.spellcasting ? [`class:${currentClass.id}:spellcasting`] : []),
        ...(extraMagic.spells > 0 ? ["background-or-race:spells"] : []),
      ]
    ),
    raceChoice: makeBucket(raceChoiceRequired, raceChoiceSelected ? [raceChoiceSelected] : [], uniq(raceChoiceOptionsReady.map((o) => ({ id: o.id, name: o.name }))), raceChoiceRequired > 0 && currentRace ? [`race:${currentRace.id}:${raceChoiceKey}`] : []),
    classFeats: makeBucket(classFeatRequired, selections.classFeats ?? [], classFeatOptions, classFeatRequired ? [`class:${character.class}:fighting-style`] : []),
  };

  if (import.meta.env.DEV) {
    for (const [bucketName, bucket] of Object.entries(buckets)) {
      if (bucket.requiredCount > 0 && bucket.options.length === 0) console.warn(`[DEV AUDIT][choices] WARNING bucket sem opções: ${bucketName}`, bucket.sources);
    }
  }

  const needsStep = Object.values(buckets).some((b) => b.pendingCount > 0);
  return { needsStep, buckets, skills: buckets.classSkills };
}
