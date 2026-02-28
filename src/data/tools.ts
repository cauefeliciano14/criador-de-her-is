export interface ToolVariant {
  id: string;
  name: string;
}

export interface ToolData {
  id: string;
  name: string;
  type: "Ferramenta";
  attribute: string;
  weight: number;
  useObject: string;
  crafting?: string;
  variants?: ToolVariant[];
}

const KIT_DE_JOGOS_VARIANTS: ToolVariant[] = [
  { id: "dados", name: "Jogo de Dados" },
  { id: "cartas", name: "Jogo de Cartas" },
  { id: "xadrez", name: "Jogo de Xadrez" },
  { id: "tabuleiro", name: "Jogo de Tabuleiro" },
];

const INSTRUMENTO_MUSICAL_VARIANTS: ToolVariant[] = [
  { id: "alaude", name: "Alaúde" },
  { id: "flauta", name: "Flauta" },
  { id: "tambor", name: "Tambor" },
  { id: "violino", name: "Violino" },
  { id: "trompa", name: "Trompa" },
];

const FERRAMENTAS_DE_ARTESAO_VARIANTS: ToolVariant[] = [
  { id: "alquimista", name: "Ferramentas de Alquimista" },
  { id: "carpinteiro", name: "Ferramentas de Carpinteiro" },
  { id: "coureiro", name: "Ferramentas de Coureiro" },
  { id: "cozinheiro", name: "Utensílios de Cozinheiro" },
  { id: "ferreiro", name: "Ferramentas de Ferreiro" },
  { id: "joalheiro", name: "Ferramentas de Joalheiro" },
  { id: "oleiro", name: "Ferramentas de Oleiro" },
  { id: "pedreiro", name: "Ferramentas de Pedreiro" },
  { id: "tecelao", name: "Ferramentas de Tecelão" },
  { id: "vidraceiro", name: "Ferramentas de Vidraceiro" },
  { id: "cartografo", name: "Ferramentas de Cartógrafo" },
];

export const tools: ToolData[] = [
  {
    id: "ferramentas-ladrao",
    name: "Ferramentas de Ladrão",
    type: "Ferramenta",
    attribute: "Destreza",
    weight: 0.5,
    useObject: "Desarmar armadilhas, abrir fechaduras e sabotar mecanismos (CD 15).",
  },
  {
    id: "ferramentas-navegador",
    name: "Ferramentas de Navegador",
    type: "Ferramenta",
    attribute: "Sabedoria",
    weight: 1,
    useObject: "Traçar rotas marítimas, estimar posição e evitar perigos (CD 13).",
  },
  {
    id: "instrumento-musical",
    name: "Instrumento Musical",
    type: "Ferramenta",
    attribute: "Carisma",
    weight: 1.5,
    useObject: "Executar apresentações para entreter, inspirar ou distrair (CD 14).",
    variants: INSTRUMENTO_MUSICAL_VARIANTS,
  },
  {
    id: "kit-falsificacao",
    name: "Kit de Falsificação",
    type: "Ferramenta",
    attribute: "Inteligência",
    weight: 2.5,
    useObject: "Criar documentos falsos e detectar falsificações (CD 15).",
  },
  {
    id: "kit-herbalismo",
    name: "Kit de Herbalismo",
    type: "Ferramenta",
    attribute: "Sabedoria",
    weight: 1.5,
    useObject: "Preparar remédios, antídotos e reconhecer plantas úteis (CD 13).",
    crafting: "Permite criar poções de cura e preparados medicinais durante descanso longo.",
  },
  {
    id: "kit-jogos",
    name: "Kit de Jogos",
    type: "Ferramenta",
    attribute: "Sabedoria",
    weight: 0,
    useObject: "Competir em jogos para ganhar informação, dinheiro ou influência (CD 12).",
    variants: KIT_DE_JOGOS_VARIANTS,
  },
  {
    id: "suprimentos-caligrafo",
    name: "Suprimentos de Calígrafo",
    type: "Ferramenta",
    attribute: "Destreza",
    weight: 2.5,
    useObject: "Produzir escrita elegante, cópias precisas e selos oficiais (CD 12).",
  },
  {
    id: "ferramentas-cartografo",
    name: "Ferramentas de Cartógrafo",
    type: "Ferramenta",
    attribute: "Sabedoria",
    weight: 3,
    useObject: "Mapear regiões, interpretar cartas e orientar expedições (CD 13).",
  },
  {
    id: "ferramentas-artesao",
    name: "Ferramentas de Artesão",
    type: "Ferramenta",
    attribute: "Inteligência",
    weight: 4,
    useObject: "Fabricar, reparar ou avaliar bens artesanais (CD 14).",
    crafting: "Permite criar itens mundanos de acordo com a especialidade escolhida.",
    variants: FERRAMENTAS_DE_ARTESAO_VARIANTS,
  },
];

export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
