import type { AbilityKey } from "@/utils/calculations";
import { feats } from "@/data/feats";

export type BackgroundToolGrant = string;

export interface BackgroundEquipmentItem {
  itemId: string;
  qty: number;
}

export interface BackgroundEquipmentOption {
  items: BackgroundEquipmentItem[];
  gold: number;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  abilityOptions: AbilityKey[];
  skillsGranted: string[];
  toolsGranted: BackgroundToolGrant[];
  languages: string[];
  originFeatId: string;
  equipmentOptionA: BackgroundEquipmentOption;
  equipmentOptionB: { gold: 50 };
  abilityBonuses: { mode: "choose" };
  /** Compat legada */
  skills: string[];
  grantedSkills: string[];
  tools: string[];
  originFeat: { id: string; name: string; description: string };
  /** Compat legada para a etapa de equipamento */
  equipmentChoices: { id: "A" | "B"; label: string; items: string[]; gold: number }[];
}

const makeItems = (items: Array<[string, number]>): BackgroundEquipmentItem[] =>
  items.map(([itemId, qty]) => ({ itemId, qty }));

function makeBackground(input: Omit<Background, "abilityBonuses" | "equipmentChoices">): Background {
  const optionAItemsAsText = input.equipmentOptionA.items.flatMap((entry) =>
    Array.from({ length: entry.qty }, () => entry.itemId)
  );

  const feat = feats.find((item) => item.id === input.originFeatId);
  const toLegacyTool = (toolId: string) => {
    if (toolId === "choose_musical_instrument") return "Um instrumento à sua escolha";
    if (toolId === "choose_artisans_tools") return "Uma ferramenta de artesão à sua escolha";
    if (toolId === "choose_gaming_set") return "Um tipo de jogo à sua escolha";
    return toolId;
  };

  return {
    ...input,
    abilityBonuses: { mode: "choose" },
    skills: input.skillsGranted,
    tools: input.toolsGranted.map(toLegacyTool),
    originFeat: { id: input.originFeatId, name: feat?.name ?? input.originFeatId, description: feat?.description ?? "" },
    equipmentChoices: [
      { id: "A", label: "Pacote do antecedente", items: optionAItemsAsText, gold: input.equipmentOptionA.gold },
      { id: "B", label: "Riqueza inicial alternativa", items: [], gold: input.equipmentOptionB.gold },
    ],
  };
}

const mk = (
  id: string,
  name: string,
  abilityScores: AbilityKey[],
  grantedSkills: [string, string],
  grantedTool: ToolGrant,
  originFeat: OriginFeat,
  optionA: { items: string[]; gold: number }
): Background => ({
  id,
  name,
  description: `Antecedente ${name} do Livro do Jogador 2024.`,
  abilityOptions: abilityScores,
  abilityScores,
  skills: grantedSkills,
  grantedSkills,
  tools: grantedTool.mode === "fixed" ? [grantedTool.name ?? ""] : [grantedTool.choiceLabel ?? "Escolha 1 ferramenta"],
  grantedTool,
  languages: [],
  originFeat,
  equipmentChoices: [
    { id: "A", label: "Opção A", items: optionA.items, gold: optionA.gold },
    { id: "B", label: "Opção B", items: [], gold: 50 },
  ],
  equipment: { items: optionA.items, gold: optionA.gold },
});

export const backgrounds: Background[] = [
  makeBackground({
    id: "acolito",
    name: "Acólito",
    description: "Você passou a vida nos templos, estudando tradição sagrada e realizando ritos.",
    abilityOptions: ["int", "wis", "cha"],
    skillsGranted: ["Intuição", "Religião"],
    toolsGranted: ["kit-herbalismo"],
    languages: ["Celestial"],
    originFeatId: "curandeiro",
    equipmentOptionA: {
      items: makeItems([["Livro de orações", 1], ["Símbolo sagrado", 1], ["Vareta de incenso", 5], ["Vestimentas", 1], ["Kit de Herbalismo", 1]]),
      gold: 15,
    },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "andarilho",
    name: "Andarilho",
    description: "Você cresceu nas terras selvagens, longe da civilização, vivendo da terra.",
    abilityOptions: ["str", "dex", "wis"],
    skillsGranted: ["Atletismo", "Sobrevivência"],
    toolsGranted: ["choose_musical_instrument"],
    languages: ["Um idioma à sua escolha"],
    originFeatId: "atleta",
    equipmentOptionA: { items: makeItems([["Bordão", 1], ["Armadilha de caça", 1], ["Troféu de animal", 1], ["Roupas de viajante", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "artesao",
    name: "Artesão",
    description: "Membro de uma guilda de artesãos, com habilidades práticas e contatos comerciais.",
    abilityOptions: ["str", "dex", "int"],
    skillsGranted: ["Intuição", "Persuasão"],
    toolsGranted: ["choose_artisans_tools"],
    languages: ["Um idioma à sua escolha"],
    originFeatId: "sortudo",
    equipmentOptionA: { items: makeItems([["Ferramentas de artesão", 1], ["Carta de apresentação da guilda", 1], ["Roupas de viajante", 1]]), gold: 15 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "artista",
    name: "Artista",
    description: "Você encanta audiências com sua performance, seja música, dança ou teatro.",
    abilityOptions: ["str", "dex", "cha"],
    skillsGranted: ["Acrobacia", "Atuação"],
    toolsGranted: ["kit-disfarce", "choose_musical_instrument"],
    languages: [],
    originFeatId: "inspirador",
    equipmentOptionA: { items: makeItems([["Instrumento musical", 1], ["Carta de apresentação", 1], ["Fantasia", 1], ["Roupas finas", 1]]), gold: 15 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "charlatao",
    name: "Charlatão",
    description: "Você sempre teve talento para enganar as pessoas e lucrar com isso.",
    abilityOptions: ["dex", "con", "cha"],
    skillsGranted: ["Enganação", "Prestidigitação"],
    toolsGranted: ["kit-falsificacao", "kit-disfarce"],
    languages: [],
    originFeatId: "ator",
    equipmentOptionA: { items: makeItems([["Kit de disfarce", 1], ["Roupas finas", 1], ["Ferramentas de vigarista", 1]]), gold: 15 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "criminoso",
    name: "Criminoso",
    description: "Você tem histórico de infringir a lei e contatos no submundo.",
    abilityOptions: ["dex", "con", "int"],
    skillsGranted: ["Enganação", "Furtividade"],
    toolsGranted: ["ferramentas-ladrao", "choose_gaming_set"],
    languages: [],
    originFeatId: "alerta",
    equipmentOptionA: { items: makeItems([["Pé de cabra", 1], ["Roupas escuras com capuz", 1], ["Ferramentas de ladrão", 1]]), gold: 15 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "eremita",
    name: "Eremita",
    description: "Você viveu em reclusão por muitos anos, buscando iluminação espiritual.",
    abilityOptions: ["con", "wis", "cha"],
    skillsGranted: ["Medicina", "Religião"],
    toolsGranted: ["kit-herbalismo"],
    languages: ["Um idioma à sua escolha"],
    originFeatId: "curandeiro",
    equipmentOptionA: { items: makeItems([["Pergaminho de estudo", 1], ["Kit de Herbalismo", 1], ["Cobertor de inverno", 1], ["Roupas comuns", 1]]), gold: 5 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "escriba",
    name: "Escriba",
    description: "Você estudou em uma academia arcana ou biblioteca, absorvendo conhecimento e tradições escritas.",
    abilityOptions: ["con", "int", "wis"],
    skillsGranted: ["Arcanismo", "Investigação"],
    toolsGranted: ["calligrapher-supplies"],
    languages: ["Dois idiomas à sua escolha"],
    originFeatId: "iniciado-em-magia",
    equipmentOptionA: { items: makeItems([["Grimório", 1], ["Tinta", 1], ["Caneta", 1], ["Bolsa de componentes", 1], ["Roupas de estudioso", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "fazendeiro",
    name: "Fazendeiro",
    description: "Você é de origem humilde, tendo crescido trabalhando a terra e cuidando de animais.",
    abilityOptions: ["str", "con", "wis"],
    skillsGranted: ["Adestrar Animais", "Sobrevivência"],
    toolsGranted: ["choose_artisans_tools", "veiculos-terrestres"],
    languages: [],
    originFeatId: "sentinela",
    equipmentOptionA: { items: makeItems([["Ferramentas de artesão", 1], ["Pá", 1], ["Panela de ferro", 1], ["Roupas comuns", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "guarda",
    name: "Guarda",
    description: "Você serviu em um exército ou milícia, treinando nas artes da guerra e da vigilância.",
    abilityOptions: ["str", "con", "wis"],
    skillsGranted: ["Atletismo", "Intimidação"],
    toolsGranted: ["choose_gaming_set", "veiculos-terrestres"],
    languages: [],
    originFeatId: "sentinela",
    equipmentOptionA: { items: makeItems([["Insígnia de patente", 1], ["Troféu de inimigo", 1], ["Dados de osso", 1], ["Roupas comuns", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "guia",
    name: "Guia",
    description: "Você viajou por terras distantes em busca de significado ou proteção, guiando viajantes.",
    abilityOptions: ["dex", "con", "wis"],
    skillsGranted: ["Intuição", "Sobrevivência"],
    toolsGranted: ["cartographer-tools"],
    languages: ["Dois idiomas à sua escolha"],
    originFeatId: "observador",
    equipmentOptionA: { items: makeItems([["Cobertor de inverno", 1], ["Roupas de viajante", 1], ["Diário de viagem", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "marinheiro",
    name: "Marinheiro",
    description: "Você navegou os mares por anos, enfrentando tempestades e aventuras.",
    abilityOptions: ["str", "dex", "con"],
    skillsGranted: ["Atletismo", "Percepção"],
    toolsGranted: ["ferramentas-navegador", "veiculos-aquaticos"],
    languages: [],
    originFeatId: "atleta",
    equipmentOptionA: { items: makeItems([["Bordão", 1], ["15m de corda de seda", 1], ["Amuleto de sorte", 1], ["Roupas comuns", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "mercador",
    name: "Mercador",
    description: "Você cresceu nas ruas e mercados, sobrevivendo por esperteza e negociação.",
    abilityOptions: ["con", "int", "cha"],
    skillsGranted: ["Persuasão", "Prestidigitação"],
    toolsGranted: ["kit-disfarce", "ferramentas-ladrao"],
    languages: [],
    originFeatId: "sortudo",
    equipmentOptionA: { items: makeItems([["Balança de mercador", 1], ["Mapa da cidade", 1], ["Roupas comuns", 1]]), gold: 15 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "nobre",
    name: "Nobre",
    description: "Nascido em família de prestígio, você carrega título e responsabilidades.",
    abilityOptions: ["str", "int", "cha"],
    skillsGranted: ["História", "Persuasão"],
    toolsGranted: ["choose_gaming_set"],
    languages: ["Um idioma à sua escolha"],
    originFeatId: "inspirador",
    equipmentOptionA: { items: makeItems([["Roupas finas", 1], ["Anel de sinete", 1], ["Pergaminho de linhagem", 1]]), gold: 25 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "sabio",
    name: "Sábio",
    description: "Você dedicou anos ao estudo acadêmico e à busca do conhecimento.",
    abilityOptions: ["con", "int", "wis"],
    skillsGranted: ["Arcanismo", "História"],
    toolsGranted: ["calligrapher-supplies"],
    languages: ["Dois idiomas à sua escolha"],
    originFeatId: "observador",
    equipmentOptionA: { items: makeItems([["Tinta", 1], ["Caneta", 1], ["Faca pequena", 1], ["Carta de universidade", 1], ["Roupas comuns", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
  makeBackground({
    id: "soldado",
    name: "Soldado",
    description: "Você serviu como soldado em exércitos ou milícias, treinado para combate e disciplina.",
    abilityOptions: ["str", "dex", "con"],
    skillsGranted: ["Atletismo", "Intimidação"],
    toolsGranted: ["choose_gaming_set"],
    languages: ["Um idioma à sua escolha"],
    originFeatId: "combate-com-armas-grandes",
    equipmentOptionA: { items: makeItems([["Bastão", 1], ["Armadilha de caça", 1], ["Troféu de animal", 1], ["Roupas de viajante", 1]]), gold: 10 },
    equipmentOptionB: { gold: 50 },
  }),
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export const backgroundsById: Record<string, Background> = Object.fromEntries(backgrounds.map((b) => [b.id, b]));
