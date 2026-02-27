export interface ItemCost {
  gp: number;
}

export interface ArmorProperties {
  baseAC: number;
  dexCap: number | null;
  requiresStr: number | null;
  stealthDisadvantage: boolean;
}

export interface ShieldProperties {
  acBonus: number;
}

export interface WeaponProperties {
  damageDice: string;
  damageType: string;
  range: string | null;
  versatile: string | null;
  finesse: boolean;
  light: boolean;
  twoHanded: boolean;
  ammunition: boolean;
  thrown: string | null;
}

export type ItemType = "weapon" | "armor" | "shield" | "tool" | "gear" | "pack" | "other";

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  category: string;
  cost: ItemCost;
  weight: number;
  properties?: ArmorProperties | ShieldProperties | WeaponProperties;
  description: string;
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
  equipped: boolean;
  notes: string;
}

export interface EquippedState {
  armor: string | null;
  shield: string | null;
  weapons: string[];
}

export interface AttackEntry {
  weaponId: string;
  name: string;
  attackBonus: number;
  damage: string;
  range: string;
  proficient: boolean;
}

export const items: Item[] = ([
  // ── Armaduras Leves ──
  {
    id: "armaduraAcolchoada",
    name: "Armadura Acolchoada",
    type: "armor",
    category: "Armadura Leve",
    cost: { gp: 5 },
    weight: 8,
    properties: { baseAC: 11, dexCap: null, requiresStr: null, stealthDisadvantage: true },
    description: "Camadas de tecido acolchoado costuradas juntas.",
  },
  {
    id: "armaduraCouro",
    name: "Armadura de Couro",
    type: "armor",
    category: "Armadura Leve",
    cost: { gp: 10 },
    weight: 10,
    properties: { baseAC: 11, dexCap: null, requiresStr: null, stealthDisadvantage: false },
    description: "O peitoral e as ombreiras são feitos de couro endurecido em óleo.",
  },
  {
    id: "armaduraCouroBatido",
    name: "Armadura de Couro Batido",
    type: "armor",
    category: "Armadura Leve",
    cost: { gp: 45 },
    weight: 13,
    properties: { baseAC: 12, dexCap: null, requiresStr: null, stealthDisadvantage: false },
    description: "Couro resistente mas flexível, reforçado com rebites.",
  },
  // ── Armaduras Médias ──
  {
    id: "gibaoCouro",
    name: "Gibão de Peles",
    type: "armor",
    category: "Armadura Média",
    cost: { gp: 10 },
    weight: 12,
    properties: { baseAC: 12, dexCap: 2, requiresStr: null, stealthDisadvantage: false },
    description: "Armadura rústica feita de peles e couros grossos.",
  },
  {
    id: "cotaDeMalha",
    name: "Cota de Malha (Shirt)",
    type: "armor",
    category: "Armadura Média",
    cost: { gp: 50 },
    weight: 20,
    properties: { baseAC: 13, dexCap: 2, requiresStr: null, stealthDisadvantage: false },
    description: "Camisa feita de anéis metálicos entrelaçados.",
  },
  {
    id: "brunea",
    name: "Brunea",
    type: "armor",
    category: "Armadura Média",
    cost: { gp: 50 },
    weight: 45,
    properties: { baseAC: 14, dexCap: 2, requiresStr: null, stealthDisadvantage: true },
    description: "Peitoral de metal com couro maleável para o resto do corpo.",
  },
  {
    id: "meiaPlaca",
    name: "Meia-Placa",
    type: "armor",
    category: "Armadura Média",
    cost: { gp: 750 },
    weight: 40,
    properties: { baseAC: 15, dexCap: 2, requiresStr: null, stealthDisadvantage: true },
    description: "Placas de metal moldadas cobrindo a maior parte do corpo.",
  },
  // ── Armaduras Pesadas ──
  {
    id: "cotaDeAneis",
    name: "Cota de Anéis",
    type: "armor",
    category: "Armadura Pesada",
    cost: { gp: 30 },
    weight: 40,
    properties: { baseAC: 14, dexCap: 0, requiresStr: null, stealthDisadvantage: true },
    description: "Anéis pesados de metal costurados a uma base de couro.",
  },
  {
    id: "cotaDeMalhaFull",
    name: "Cota de Malha",
    type: "armor",
    category: "Armadura Pesada",
    cost: { gp: 75 },
    weight: 55,
    properties: { baseAC: 16, dexCap: 0, requiresStr: 13, stealthDisadvantage: true },
    description: "Malha de anéis metálicos cobrindo o corpo inteiro.",
  },
  {
    id: "placas",
    name: "Placas",
    type: "armor",
    category: "Armadura Pesada",
    cost: { gp: 1500 },
    weight: 65,
    properties: { baseAC: 18, dexCap: 0, requiresStr: 15, stealthDisadvantage: true },
    description: "Armadura completa de placas metálicas interligadas.",
  },
  // ── Escudo ──
  {
    id: "escudo",
    name: "Escudo",
    type: "shield",
    category: "Escudo",
    cost: { gp: 10 },
    weight: 6,
    properties: { acBonus: 2 },
    description: "Um escudo feito de madeira ou metal, empunhado em uma mão.",
  },
  // ── Armas Simples Corpo a Corpo ──
  {
    id: "bordao",
    name: "Bordão",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 0 },
    weight: 4,
    properties: { damageDice: "1d6", damageType: "Contundente", range: null, versatile: "1d8", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Um bastão longo de madeira resistente.",
  },
  {
    id: "adaga",
    name: "Adaga",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 2 },
    weight: 1,
    properties: { damageDice: "1d4", damageType: "Perfurante", range: null, versatile: null, finesse: true, light: true, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Uma lâmina curta e afiada, ideal para combate próximo ou arremesso.",
  },
  {
    id: "clava",
    name: "Clava",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 0 },
    weight: 2,
    properties: { damageDice: "1d4", damageType: "Contundente", range: null, versatile: null, finesse: false, light: true, twoHanded: false, ammunition: false, thrown: null },
    description: "Um pedaço robusto de madeira.",
  },
  {
    id: "machadinha",
    name: "Machadinha",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 5 },
    weight: 2,
    properties: { damageDice: "1d6", damageType: "Cortante", range: null, versatile: null, finesse: false, light: true, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Um pequeno machado para combate ou arremesso.",
  },
  {
    id: "lanca",
    name: "Lança",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 1 },
    weight: 3,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: null, versatile: "1d8", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Uma haste longa com ponta afiada.",
  },
  {
    id: "maca",
    name: "Maça",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 5 },
    weight: 4,
    properties: { damageDice: "1d6", damageType: "Contundente", range: null, versatile: null, finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma arma pesada com cabeça de metal.",
  },
  // ── Armas Simples à Distância ──
  {
    id: "bestaLeve",
    name: "Besta Leve",
    type: "weapon",
    category: "Arma Simples à Distância",
    cost: { gp: 25 },
    weight: 5,
    properties: { damageDice: "1d8", damageType: "Perfurante", range: "24/96", versatile: null, finesse: false, light: false, twoHanded: true, ammunition: true, thrown: null },
    description: "Uma besta leve de fácil manuseio.",
  },
  {
    id: "arcoOgro",
    name: "Arco Curto",
    type: "weapon",
    category: "Arma Simples à Distância",
    cost: { gp: 25 },
    weight: 2,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: "24/96", versatile: null, finesse: false, light: false, twoHanded: true, ammunition: true, thrown: null },
    description: "Um arco compacto para ataques à distância.",
  },
  {
    id: "dardo",
    name: "Dardo",
    type: "weapon",
    category: "Arma Simples à Distância",
    cost: { gp: 0 },
    weight: 0.25,
    properties: { damageDice: "1d4", damageType: "Perfurante", range: "6/18", versatile: null, finesse: true, light: false, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Projétil pequeno arremessado à mão.",
  },
  // ── Armas Marciais Corpo a Corpo ──
  {
    id: "espadaLonga",
    name: "Espada Longa",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 15 },
    weight: 3,
    properties: { damageDice: "1d8", damageType: "Cortante", range: null, versatile: "1d10", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma lâmina longa versátil.",
  },
  {
    id: "espadaCurta",
    name: "Espada Curta",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 10 },
    weight: 2,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: null, versatile: null, finesse: true, light: true, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma lâmina curta e ágil.",
  },
  {
    id: "machadoGrande",
    name: "Machado Grande",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 30 },
    weight: 7,
    properties: { damageDice: "1d12", damageType: "Cortante", range: null, versatile: null, finesse: false, light: false, twoHanded: true, ammunition: false, thrown: null },
    description: "Um machado enorme empunhado com duas mãos.",
  },
  {
    id: "machadoDeBatalha",
    name: "Machado de Batalha",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 10 },
    weight: 4,
    properties: { damageDice: "1d8", damageType: "Cortante", range: null, versatile: "1d10", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Um machado de combate versátil.",
  },
  {
    id: "montante",
    name: "Montante",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 50 },
    weight: 6,
    properties: { damageDice: "2d6", damageType: "Cortante", range: null, versatile: null, finesse: false, light: false, twoHanded: true, ammunition: false, thrown: null },
    description: "Uma grande espada de duas mãos.",
  },
  {
    id: "rapieira",
    name: "Rapieira",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 25 },
    weight: 2,
    properties: { damageDice: "1d8", damageType: "Perfurante", range: null, versatile: null, finesse: true, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma espada fina e elegante, perfeita para estocadas precisas.",
  },
  {
    id: "martelo",
    name: "Martelo de Guerra",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 15 },
    weight: 2,
    properties: { damageDice: "1d8", damageType: "Contundente", range: null, versatile: "1d10", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Um martelo pesado feito para o combate.",
  },
  // ── Armas Marciais à Distância ──
  {
    id: "arcoLongo",
    name: "Arco Longo",
    type: "weapon",
    category: "Arma Marcial à Distância",
    cost: { gp: 50 },
    weight: 2,
    properties: { damageDice: "1d8", damageType: "Perfurante", range: "45/180", versatile: null, finesse: false, light: false, twoHanded: true, ammunition: true, thrown: null },
    description: "Um arco grande de longo alcance.",
  },
  {
    id: "bestaPesada",
    name: "Besta Pesada",
    type: "weapon",
    category: "Arma Marcial à Distância",
    cost: { gp: 50 },
    weight: 18,
    properties: { damageDice: "1d10", damageType: "Perfurante", range: "30/120", versatile: null, finesse: false, light: false, twoHanded: true, ammunition: true, thrown: null },
    description: "Uma besta poderosa de carga pesada.",
  },
  // ── Ferramentas ──
  {
    id: "kitHerbalismo",
    name: "Kit de Herbalismo",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 5 },
    weight: 3,
    description: "Contém pinças, almofariz, bolsas e frascos para herbalismo.",
  },
  {
    id: "ferramentasLadrao",
    name: "Ferramentas de Ladrão",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 25 },
    weight: 1,
    description: "Inclui lima, gazuas, espelho, tesoura e pinça.",
  },
  {
    id: "kitCurandeiro",
    name: "Kit de Curandeiro",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 5 },
    weight: 3,
    description: "Um estojo de couro com ataduras, pomadas e talas. 10 usos.",
  },
  // ── Equipamento Geral ──
  {
    id: "mochila",
    name: "Mochila",
    type: "gear",
    category: "Equipamento de Aventura",
    cost: { gp: 2 },
    weight: 5,
    description: "Mochila comum para carregar pertences.",
  },
  {
    id: "corda",
    name: "Corda de Cânhamo (15m)",
    type: "gear",
    category: "Equipamento de Aventura",
    cost: { gp: 1 },
    weight: 10,
    description: "15 metros de corda resistente.",
  },
  {
    id: "tocha",
    name: "Tocha",
    type: "gear",
    category: "Equipamento de Aventura",
    cost: { gp: 0 },
    weight: 1,
    description: "Ilumina num raio de 6m por 1 hora.",
  },
  {
    id: "racoes",
    name: "Rações (1 dia)",
    type: "gear",
    category: "Equipamento de Aventura",
    cost: { gp: 1 },
    weight: 2,
    description: "Comida desidratada para um dia.",
  },
  {
    id: "cantil",
    name: "Cantil",
    type: "gear",
    category: "Equipamento de Aventura",
    cost: { gp: 0 },
    weight: 5,
    description: "Recipiente para carregar água.",
  },
  {
    id: "grimorio",
    name: "Grimório",
    type: "gear",
    category: "Foco Arcano",
    cost: { gp: 50 },
    weight: 3,
    description: "Livro encadernado em couro para registrar magias de mago.",
  },
  {
    id: "bolsaComponentes",
    name: "Bolsa de Componentes",
    type: "gear",
    category: "Foco Arcano",
    cost: { gp: 25 },
    weight: 2,
    description: "Bolsa impermeável com compartimentos para componentes de magia.",
  },
  {
    id: "simboloSagrado",
    name: "Símbolo Sagrado",
    type: "gear",
    category: "Foco Divino",
    cost: { gp: 5 },
    weight: 0,
    description: "Amuleto, relicário ou emblema representando uma divindade.",
  },
  // ── Packs ──
  {
    id: "kitExplorador",
    name: "Kit de Explorador",
    type: "pack",
    category: "Kit",
    cost: { gp: 10 },
    weight: 59,
    description: "Mochila, saco de dormir, rações (10 dias), cantil, 15m corda, 10 tochas.",
  },
  {
    id: "kitEstudioso",
    name: "Mochila de Estudioso",
    type: "pack",
    category: "Kit",
    cost: { gp: 40 },
    weight: 10,
    description: "Mochila, livro de estudo, tinta, caneta, 10 folhas de pergaminho.",
  },
  // ── Armas Simples (faltantes) ──
  {
    id: "azagaia",
    name: "Azagaia",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 1 },
    weight: 2,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: null, versatile: null, finesse: false, light: false, twoHanded: false, ammunition: false, thrown: "9/36" },
    description: "Uma lança leve de arremesso.",
  },
  {
    id: "foice",
    name: "Foice",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 1 },
    weight: 2,
    properties: { damageDice: "1d4", damageType: "Cortante", range: null, versatile: null, finesse: false, light: true, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma lâmina curva usada para ceifar.",
  },
  {
    id: "marteloLeve",
    name: "Martelo Leve",
    type: "weapon",
    category: "Arma Simples Corpo a Corpo",
    cost: { gp: 2 },
    weight: 2,
    properties: { damageDice: "1d4", damageType: "Contundente", range: null, versatile: null, finesse: false, light: true, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Um martelo pequeno e leve.",
  },
  {
    id: "funda",
    name: "Funda",
    type: "weapon",
    category: "Arma Simples à Distância",
    cost: { gp: 0 },
    weight: 0,
    properties: { damageDice: "1d4", damageType: "Contundente", range: "9/36", versatile: null, finesse: false, light: false, twoHanded: false, ammunition: true, thrown: null },
    description: "Uma tira de couro para arremessar projéteis.",
  },
  // ── Armas Marciais (faltantes) ──
  {
    id: "cimitarra",
    name: "Cimitarra",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 25 },
    weight: 3,
    properties: { damageDice: "1d6", damageType: "Cortante", range: null, versatile: null, finesse: true, light: true, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma lâmina curva e leve, ideal para combate ágil.",
  },
  {
    id: "bestaDeMao",
    name: "Besta de Mão",
    type: "weapon",
    category: "Arma Marcial à Distância",
    cost: { gp: 75 },
    weight: 3,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: "9/36", versatile: null, finesse: false, light: true, twoHanded: false, ammunition: true, thrown: null },
    description: "Uma besta compacta operada com uma mão.",
  },
  {
    id: "alabarda",
    name: "Alabarda",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 20 },
    weight: 6,
    properties: { damageDice: "1d10", damageType: "Cortante", range: null, versatile: null, finesse: false, light: false, twoHanded: true, ammunition: false, thrown: null },
    description: "Uma arma de haste com lâmina larga.",
  },
  {
    id: "glaive",
    name: "Glaive",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 20 },
    weight: 6,
    properties: { damageDice: "1d10", damageType: "Cortante", range: null, versatile: null, finesse: false, light: false, twoHanded: true, ammunition: false, thrown: null },
    description: "Uma arma de haste com lâmina curva.",
  },
  {
    id: "mangual",
    name: "Mangual",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 10 },
    weight: 2,
    properties: { damageDice: "1d8", damageType: "Contundente", range: null, versatile: null, finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma bola de metal presa por corrente a um cabo.",
  },
  {
    id: "picareta",
    name: "Picareta de Guerra",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 5 },
    weight: 2,
    properties: { damageDice: "1d8", damageType: "Perfurante", range: null, versatile: null, finesse: false, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Um pico de metal numa haste curta.",
  },
  {
    id: "tridente",
    name: "Tridente",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 5 },
    weight: 4,
    properties: { damageDice: "1d6", damageType: "Perfurante", range: null, versatile: "1d8", finesse: false, light: false, twoHanded: false, ammunition: false, thrown: "6/18" },
    description: "Uma arma com três pontas.",
  },
  {
    id: "chicote",
    name: "Chicote",
    type: "weapon",
    category: "Arma Marcial Corpo a Corpo",
    cost: { gp: 2 },
    weight: 3,
    properties: { damageDice: "1d4", damageType: "Cortante", range: null, versatile: null, finesse: true, light: false, twoHanded: false, ammunition: false, thrown: null },
    description: "Uma arma flexível de alcance.",
  },
  // ── Equipamento Geral (faltantes) ──
  {
    id: "instrumentoMusical",
    name: "Instrumento Musical",
    type: "gear",
    category: "Foco Bárdico",
    cost: { gp: 25 },
    weight: 2,
    description: "Um instrumento musical que pode ser usado como foco bárdico.",
  },
  {
    id: "focoDruidico",
    name: "Foco Druídico",
    type: "gear",
    category: "Foco Druídico",
    cost: { gp: 5 },
    weight: 0,
    description: "Um galho de visco, totem, cajado de teixo ou similar usado como foco de conjuração druídica.",
  },
  {
    id: "kitDisfarce",
    name: "Kit de Disfarce",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 25 },
    weight: 3,
    description: "Contém cosméticos, tintas de cabelo e pequenos adereços para alterar aparência.",
  },
  {
    id: "kitVenenos",
    name: "Kit de Envenenador",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 50 },
    weight: 2,
    description: "Frascos, químicos e equipamento para criar e aplicar venenos.",
  },
  {
    id: "kitFalsificacao",
    name: "Kit de Falsificação",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 15 },
    weight: 5,
    description: "Tintas, papéis, selos e ferramentas para criar documentos falsos.",
  },
  {
    id: "ferramentasNavegador",
    name: "Ferramentas de Navegador",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 25 },
    weight: 2,
    description: "Bússola, cartas náuticas e instrumentos de navegação.",
  },
  {
    id: "ferramentasArtesao",
    name: "Ferramentas de Artesão",
    type: "tool",
    category: "Ferramenta",
    cost: { gp: 10 },
    weight: 5,
    description: "Um conjunto de ferramentas para prática de uma arte ou ofício específico.",
  },
  {
    id: "focoArcano",
    name: "Foco Arcano",
    type: "gear",
    category: "Foco Arcano",
    cost: { gp: 10 },
    weight: 1,
    description: "Um cristal, orbe, bastão ou varinha usada para canalizar magia arcana.",
  },
] as Item[]).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

/** Lookup map for quick access */
export const itemsById: Record<string, Item> = Object.fromEntries(items.map((i) => [i.id, i]));
