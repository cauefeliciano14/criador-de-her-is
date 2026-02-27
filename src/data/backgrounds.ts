import type { AbilityKey } from "@/utils/calculations";

export interface OriginFeat {
  id: string;
  name: string;
  description: string;
}

export interface BackgroundAbilityBonuses {
  mode: "fixed" | "choose";
  fixed?: Partial<Record<AbilityKey, number>>;
  choose?: {
    choices: number;
    bonus: number;
    from: AbilityKey[];
    maxPerAbility: number;
  };
}

export interface Background {
  id: string;
  name: string;
  description: string;
  abilityBonuses: BackgroundAbilityBonuses;
  /** 3 atributos elegíveis para bônus (+2/+1 ou +1/+1/+1) */
  abilityOptions: AbilityKey[];
  skills: string[];
  tools: string[];
  languages: string[];
  originFeat: OriginFeat;
  equipment: {
    items: string[];
    gold: number;
  };
}

export const backgrounds: Background[] = [
  {
    id: "acolito", name: "Acólito",
    description: "Você passou a vida nos templos, estudando tradição sagrada e realizando ritos.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["int", "wis", "cha"],
    skills: ["Intuição", "Religião"],
    tools: ["Kit de Herbalismo"],
    languages: ["Celestial"],
    originFeat: { id: "curandeiro", name: "Curandeiro", description: "Use kit de curandeiro para restaurar 1d6+4+nível PV. Como ação, restaure 2d6+mod. SAB PV." },
    equipment: { items: ["Livro de orações", "Símbolo sagrado", "5 varetas de incenso", "Vestimentas", "Kit de Herbalismo"], gold: 15 },
  },
  {
    id: "andarilho", name: "Andarilho",
    description: "Você cresceu nas terras selvagens, longe da civilização, vivendo da terra.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "dex", "wis"],
    skills: ["Atletismo", "Sobrevivência"],
    tools: ["Um instrumento musical"],
    languages: ["Um idioma à sua escolha"],
    originFeat: { id: "atleta", name: "Atleta", description: "+1 FOR ou DES. Levantar-se custa 1,5m. Escalar sem custo extra." },
    equipment: { items: ["Bordão", "Armadilha de caça", "Troféu de animal", "Roupas de viajante"], gold: 10 },
  },
  {
    id: "artesao", name: "Artesão",
    description: "Membro de uma guilda de artesãos, com habilidades práticas e contatos comerciais.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "dex", "int"],
    skills: ["Intuição", "Persuasão"],
    tools: ["Um tipo de ferramenta de artesão"],
    languages: ["Um idioma à sua escolha"],
    originFeat: { id: "sortudo", name: "Sortudo", description: "3 pontos de sorte para rolar d20 adicional. Recupera em descanso longo." },
    equipment: { items: ["Ferramentas de artesão", "Carta de apresentação da guilda", "Roupas de viajante"], gold: 15 },
  },
  {
    id: "artista", name: "Artista",
    description: "Você encanta audiências com sua performance, seja música, dança ou teatro.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "dex", "cha"],
    skills: ["Acrobacia", "Atuação"],
    tools: ["Kit de disfarce", "Um instrumento musical"],
    languages: [],
    originFeat: { id: "inspirador", name: "Inspirador", description: "+1 CAR (max 20). Após descanso longo, conceda PV temp. a até 6 aliados." },
    equipment: { items: ["Instrumento musical", "Carta de apresentação", "Fantasia", "Roupas finas"], gold: 15 },
  },
  {
    id: "charlatao", name: "Charlatão",
    description: "Você sempre teve talento para enganar as pessoas e lucrar com isso.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["dex", "con", "cha"],
    skills: ["Enganação", "Prestidigitação"],
    tools: ["Kit de falsificação", "Kit de disfarce"],
    languages: [],
    originFeat: { id: "ator", name: "Ator", description: "+1 CAR (max 20). Vantagem em Enganação e Atuação ao se passar por outro." },
    equipment: { items: ["Kit de disfarce", "Roupas finas", "Ferramentas de vigarista"], gold: 15 },
  },
  {
    id: "criminoso", name: "Criminoso",
    description: "Você tem histórico de infringir a lei e contatos no submundo.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["dex", "con", "int"],
    skills: ["Enganação", "Furtividade"],
    tools: ["Ferramentas de ladrão", "Um tipo de jogo"],
    languages: [],
    originFeat: { id: "alerta", name: "Alerta", description: "+5 Iniciativa. Não pode ser surpreendido. Criaturas ocultas não ganham vantagem." },
    equipment: { items: ["Pé de cabra", "Roupas escuras com capuz", "Ferramentas de ladrão"], gold: 15 },
  },
  {
    id: "eremita", name: "Eremita",
    description: "Você viveu em reclusão por muitos anos, buscando iluminação espiritual.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["con", "wis", "cha"],
    skills: ["Medicina", "Religião"],
    tools: ["Kit de Herbalismo"],
    languages: ["Um idioma à sua escolha"],
    originFeat: { id: "curandeiro", name: "Curandeiro", description: "Use kit de curandeiro para restaurar 1d6+4+nível PV." },
    equipment: { items: ["Pergaminho de estudo", "Kit de Herbalismo", "Cobertor de inverno", "Roupas comuns"], gold: 5 },
  },
  {
    id: "escriba", name: "Escriba",
    description: "Você estudou em uma academia arcana ou biblioteca, absorvendo conhecimento e tradições escritas.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["con", "int", "wis"],
    skills: ["Arcanismo", "Investigação"],
    tools: [],
    languages: ["Dois idiomas à sua escolha"],
    originFeat: { id: "iniciado-em-magia", name: "Iniciado em Magia", description: "Aprenda 2 truques e 1 magia de 1º nível de uma lista, conjurável 1/dia." },
    equipment: { items: ["Grimório", "Tinta", "Caneta", "Bolsa de componentes", "Roupas de estudioso"], gold: 10 },
  },
  {
    id: "fazendeiro", name: "Fazendeiro",
    description: "Você é de origem humilde, tendo crescido trabalhando a terra e cuidando de animais.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "con", "wis"],
    skills: ["Adestrar Animais", "Sobrevivência"],
    tools: ["Um tipo de ferramenta de artesão", "Veículos terrestres"],
    languages: [],
    originFeat: { id: "sentinela", name: "Sentinela", description: "Reação para atacar quem atacar aliado. Alvo de ataque de oportunidade tem deslocamento 0." },
    equipment: { items: ["Ferramentas de artesão", "Pá", "Panela de ferro", "Roupas comuns"], gold: 10 },
  },
  {
    id: "guarda", name: "Guarda",
    description: "Você serviu em um exército ou milícia, treinando nas artes da guerra e da vigilância.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "con", "wis"],
    skills: ["Atletismo", "Intimidação"],
    tools: ["Um tipo de jogo", "Veículos terrestres"],
    languages: [],
    originFeat: { id: "sentinela", name: "Sentinela", description: "Reação para atacar quem atacar aliado. Alvo com deslocamento 0 em oportunidade." },
    equipment: { items: ["Insígnia de patente", "Troféu de inimigo", "Dados de osso", "Roupas comuns"], gold: 10 },
  },
  {
    id: "guia", name: "Guia",
    description: "Você viajou por terras distantes em busca de significado ou proteção, guiando viajantes.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["dex", "con", "wis"],
    skills: ["Intuição", "Sobrevivência"],
    tools: [],
    languages: ["Dois idiomas à sua escolha"],
    originFeat: { id: "observador", name: "Observador", description: "+1 INT ou SAB. +5 Percepção e Investigação passivas." },
    equipment: { items: ["Cobertor de inverno", "Roupas de viajante", "Diário de viagem"], gold: 10 },
  },
  {
    id: "marinheiro", name: "Marinheiro",
    description: "Você navegou os mares por anos, enfrentando tempestades e aventuras.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "dex", "con"],
    skills: ["Atletismo", "Percepção"],
    tools: ["Ferramentas de navegador", "Veículos aquáticos"],
    languages: [],
    originFeat: { id: "atleta", name: "Atleta", description: "+1 FOR ou DES. Levantar-se custa 1,5m. Escalar sem custo extra." },
    equipment: { items: ["Bastão", "15m de corda de seda", "Amuleto de sorte", "Roupas comuns"], gold: 10 },
  },
  {
    id: "mercador", name: "Mercador",
    description: "Você cresceu nas ruas e mercados, sobrevivendo por esperteza e negociação.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["con", "int", "cha"],
    skills: ["Persuasão", "Prestidigitação"],
    tools: ["Kit de disfarce", "Ferramentas de ladrão"],
    languages: [],
    originFeat: { id: "sortudo", name: "Sortudo", description: "3 pontos de sorte para rolar d20 adicional." },
    equipment: { items: ["Balança de mercador", "Mapa da cidade", "Roupas comuns"], gold: 15 },
  },
  {
    id: "nobre", name: "Nobre",
    description: "Nascido em família de prestígio, você carrega título e responsabilidades.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "int", "cha"],
    skills: ["História", "Persuasão"],
    tools: ["Um tipo de jogo"],
    languages: ["Um idioma à sua escolha"],
    originFeat: { id: "inspirador", name: "Inspirador", description: "+1 CAR (max 20). Após descanso longo, PV temp. a até 6 aliados." },
    equipment: { items: ["Roupas finas", "Anel de sinete", "Pergaminho de linhagem"], gold: 25 },
  },
  {
    id: "sabio", name: "Sábio",
    description: "Você dedicou anos ao estudo acadêmico e à busca do conhecimento.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["con", "int", "wis"],
    skills: ["Arcanismo", "História"],
    tools: [],
    languages: ["Dois idiomas à sua escolha"],
    originFeat: { id: "observador", name: "Observador", description: "+1 INT ou SAB. +5 Percepção e Investigação passivas. Leitura labial." },
    equipment: { items: ["Tinta", "Caneta", "Faca pequena", "Carta de universidade", "Roupas comuns"], gold: 10 },
  },
  {
    id: "soldado", name: "Soldado",
    description: "Você serviu como soldado em exércitos ou milícias, treinado para combate e disciplina.",
    abilityBonuses: { mode: "choose" },
    abilityOptions: ["str", "dex", "con"],
    skills: ["Atletismo", "Intimidação"],
    tools: ["Um instrumento musical"],
    languages: ["Um idioma à sua escolha"],
    originFeat: { id: "combate-com-armas-grandes", name: "Combate com Armas Grandes", description: "Rerrole dados de dano 1–2 com armas de duas mãos." },
    equipment: { items: ["Bastão", "Armadilha de caça", "Troféu de animal", "Roupas de viajante"], gold: 10 },
  },
];

/** Lookup map */
export const backgroundsById: Record<string, Background> = Object.fromEntries(
  backgrounds.map((b) => [b.id, b])
);
