export interface RaceAbilityBonuses {
  mode: "fixed" | "choose";
  fixed?: Partial<Record<string, number>>;
  choose?: {
    choices: number;
    bonus: number;
    from: string[];
    maxPerAbility: number;
  };
}

export interface RaceProficiencies {
  skills: string[];
  tools: string[];
  weapons: string[];
  armor: string[];
}

export interface RaceTrait {
  name: string;
  description: string;
}

export type AvailabilityStatus = "ready" | "planned";

export interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: RaceAbilityBonuses;
  languages: string[];
  proficiencies: RaceProficiencies;
  traits: RaceTrait[];
}

export interface RaceChoiceOption {
  id: string;
  name: string;
  description: string;
  availability?: AvailabilityStatus;
  effects: {
    traits?: RaceTrait[];
    languages?: string[];
    proficiencies?: RaceProficiencies;
    speed?: number;
    size?: "Pequeno" | "Médio";
    resistances?: string[];
    breathWeapon?: { damageType: string; area: "cone" | "linha" };
    spellsGranted?: { spellId: string; level: number; notes?: string }[];
    flags?: Record<string, any>;
  };
  source: { sourceId: string; page: number };
}

export interface RaceChoice {
  kind: "dragonAncestry" | "elfLineage" | "gnomeLineage" | "giantAncestry" | "infernalLegacy" | "sizeChoice";
  label: string;
  required: boolean;
  options: RaceChoiceOption[];
}

export interface RaceData {
  id: string;
  name: string;
  description: string;
  speed: number;
  size: string;
  abilityBonuses: RaceAbilityBonuses;
  languages: string[];
  proficiencies: RaceProficiencies;
  traits: RaceTrait[];
  subraces: Subrace[];
  raceChoice?: RaceChoice;
  source: { sourceId: string; page: number };
}

export type DragonbornHeritageId =
  | "azul"
  | "branco"
  | "bronze"
  | "cobre"
  | "latao"
  | "negro"
  | "ouro"
  | "prata"
  | "verde"
  | "vermelho";

export interface DragonbornHeritageOption {
  id: DragonbornHeritageId;
  name: string;
  damageType: "ácido" | "elétrico" | "gélido" | "ígneo" | "venenoso";
}

export const DRAGONBORN_HERITAGES: DragonbornHeritageOption[] = [
  { id: "azul", name: "Azul", damageType: "elétrico" },
  { id: "branco", name: "Branco", damageType: "gélido" },
  { id: "bronze", name: "Bronze", damageType: "elétrico" },
  { id: "cobre", name: "Cobre", damageType: "ácido" },
  { id: "latao", name: "Latão", damageType: "ígneo" },
  { id: "negro", name: "Negro", damageType: "ácido" },
  { id: "ouro", name: "Ouro", damageType: "ígneo" },
  { id: "prata", name: "Prata", damageType: "gélido" },
  { id: "verde", name: "Verde", damageType: "venenoso" },
  { id: "vermelho", name: "Vermelho", damageType: "ígneo" },
];

export type ElfLineageId = "altoElfo" | "drow" | "elfoSilvestre";

export type GnomeLineageId = "bosque" | "rochas";

export type GiantAncestryId = "tempestade" | "pedra" | "gelo" | "fogo" | "nuvem" | "colina";

export type InfernalLegacyId = "abissal" | "ctonico" | "infernal";

export interface ElfLineageOption {
  id: ElfLineageId;
  name: string;
  level1Benefit: string;
  spellsByLevel: {
    level3: { description: string; availability: AvailabilityStatus };
    level5: { description: string; availability: AvailabilityStatus };
  };
}

export const ELF_LINEAGES: ElfLineageOption[] = [
  {
    id: "altoElfo",
    name: "Altos Elfos",
    level1Benefit: "Truque adicional da lista de Mago.",
    spellsByLevel: {
      level3: { description: "Magia de linhagem (nível 3)", availability: "planned" },
      level5: { description: "Magia de linhagem (nível 5)", availability: "planned" },
    },
  },
  {
    id: "drow",
    name: "Drow",
    level1Benefit: "Afinidade com magia sombria de linhagem.",
    spellsByLevel: {
      level3: { description: "Magia de linhagem (nível 3)", availability: "planned" },
      level5: { description: "Magia de linhagem (nível 5)", availability: "planned" },
    },
  },
  {
    id: "elfoSilvestre",
    name: "Elfos Silvestres",
    level1Benefit: "Afinidade com deslocamento e natureza.",
    spellsByLevel: {
      level3: { description: "Magia de linhagem (nível 3)", availability: "planned" },
      level5: { description: "Magia de linhagem (nível 5)", availability: "planned" },
    },
  },
];

const EMPTY_PROF: RaceProficiencies = { skills: [], tools: [], weapons: [], armor: [] };
const PHB2024 = { sourceId: "phb2024-ptbr", page: 0 };

/**
 * PHB 2024 — 10 raças jogáveis.
 * No PHB 2024, bônus de atributo vêm do Antecedente, não da raça.
 * Raças concedem traços, idiomas, proficiências e habilidades especiais.
 */
export const races: RaceData[] = [
  // 1. AASIMAR
  {
    id: "aasimar",
    name: "Aasimar",
    description: "Tocados por poderes celestiais, aasimars carregam uma centelha divina que se manifesta em momentos de necessidade.",
    speed: 9,
    size: "Médio ou Pequeno",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Celestial"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como se fosse luz plena, e no escuro como se fosse penumbra." },
      { name: "Resistência Celestial", description: "Resistência a dano necrótico e dano radiante." },
      { name: "Mãos Curadoras", description: "Como ação, toque uma criatura para restaurar PV iguais a 1d4. Usos = bônus de proficiência / descanso longo." },
      { name: "Revelação Celestial", description: "No 3º nível, escolha uma forma de revelação (Áurea, Interior ou Necrótica). Ação bônus para ativar por 1 minuto, 1/descanso longo." },
    ],
    subraces: [],
    raceChoice: {
      kind: "sizeChoice",
      label: "Tamanho",
      required: true,
      options: [
        {
          id: "medio",
          name: "Médio",
          description: "Tamanho Médio, como a maioria das raças humanoides.",
          effects: {
            size: "Médio",
          },
          source: PHB2024,
        },
        {
          id: "pequeno",
          name: "Pequeno",
          description: "Tamanho Pequeno, com vantagens em combate contra oponentes maiores.",
          effects: {
            size: "Pequeno",
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },

  // 2. ANÃO
  {
    id: "anao",
    name: "Anão",
    description: "Fortes e resistentes, anões são conhecidos por sua tenacidade em combate e maestria com pedra e metal.",
    speed: 7.5,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Anão"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como se fosse luz plena." },
      { name: "Resiliência Anã", description: "Vantagem em testes de resistência contra veneno e resistência a dano de veneno." },
      { name: "Conhecimento em Rochas", description: "Proficiência dobrada em testes de História relacionados a trabalhos em pedra." },
      { name: "Treinamento Anão em Combate", description: "Proficiência com machado de batalha, machado de mão, martelo leve e martelo de guerra." },
    ],
    subraces: [],
    source: PHB2024,
  },

  // 3. DRACONATO
  {
    id: "draconato",
    name: "Draconato",
    description: "Descendentes orgulhosos de dragões, draconatos possuem sopro elemental e presença imponente.",
    speed: 9,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Dracônico"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Herança Dracônica", description: "Escolha uma herança dracônica. Ela define seu tipo de dano e sua resistência." },
      { name: "Arma de Sopro", description: "Exale energia destrutiva num cone de 4,5m ou linha de 9m. CD = 8 + mod. CON + prof. 1d10 de dano (sobe com nível). Usos = prof. / descanso longo." },
      { name: "Resistência a Dano", description: "Resistência a dano [tipo]." },
    ],
    subraces: [],
    raceChoice: {
      kind: "dragonAncestry",
      label: "Ancestralidade Dracônica",
      required: true,
      options: [
        {
          id: "azul",
          name: "Azul",
          description: "Herança de dragões azuis, com sopro elétrico.",
          effects: {
            resistances: ["elétrico"],
            breathWeapon: { damageType: "elétrico", area: "linha" },
          },
          source: PHB2024,
        },
        {
          id: "branco",
          name: "Branco",
          description: "Herança de dragões brancos, com sopro gélido.",
          effects: {
            resistances: ["gélido"],
            breathWeapon: { damageType: "gélido", area: "cone" },
          },
          source: PHB2024,
        },
        {
          id: "bronze",
          name: "Bronze",
          description: "Herança de dragões bronze, com sopro elétrico.",
          effects: {
            resistances: ["elétrico"],
            breathWeapon: { damageType: "elétrico", area: "linha" },
          },
          source: PHB2024,
        },
        {
          id: "cobre",
          name: "Cobre",
          description: "Herança de dragões cobre, com sopro ácido.",
          effects: {
            resistances: ["ácido"],
            breathWeapon: { damageType: "ácido", area: "linha" },
          },
          source: PHB2024,
        },
        {
          id: "latao",
          name: "Latão",
          description: "Herança de dragões latão, com sopro ígneo.",
          effects: {
            resistances: ["ígneo"],
            breathWeapon: { damageType: "ígneo", area: "linha" },
          },
          source: PHB2024,
        },
        {
          id: "negro",
          name: "Negro",
          description: "Herança de dragões negros, com sopro ácido.",
          effects: {
            resistances: ["ácido"],
            breathWeapon: { damageType: "ácido", area: "linha" },
          },
          source: PHB2024,
        },
        {
          id: "ouro",
          name: "Ouro",
          description: "Herança de dragões ouro, com sopro ígneo.",
          effects: {
            resistances: ["ígneo"],
            breathWeapon: { damageType: "ígneo", area: "cone" },
          },
          source: PHB2024,
        },
        {
          id: "prata",
          name: "Prata",
          description: "Herança de dragões prata, com sopro gélido.",
          effects: {
            resistances: ["gélido"],
            breathWeapon: { damageType: "gélido", area: "cone" },
          },
          source: PHB2024,
        },
        {
          id: "verde",
          name: "Verde",
          description: "Herança de dragões verdes, com sopro venenoso.",
          effects: {
            resistances: ["venenoso"],
            breathWeapon: { damageType: "venenoso", area: "cone" },
          },
          source: PHB2024,
        },
        {
          id: "vermelho",
          name: "Vermelho",
          description: "Herança de dragões vermelhos, com sopro ígneo.",
          effects: {
            resistances: ["ígneo"],
            breathWeapon: { damageType: "ígneo", area: "cone" },
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },

  // 4. ELFO
  {
    id: "elfo",
    name: "Elfo",
    description: "Seres feéricos de graça sobrenatural, com vidas longas e conexão profunda com a magia.",
    speed: 9,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Élfico"],
    proficiencies: { skills: ["Percepção"], tools: [], weapons: [], armor: [] },
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como luz plena." },
      { name: "Linhagem Feérica", description: "Vantagem em testes de resistência contra encantamento. Magia não pode fazê-lo dormir." },
      { name: "Sentidos Aguçados", description: "Proficiência na perícia Percepção." },
      { name: "Transe", description: "4 horas de meditação profunda equivalem a 8 horas de sono." },
    ],
    subraces: [],
    raceChoice: {
      kind: "elfLineage",
      label: "Linhagem Élfica",
      required: true,
      options: [
        {
          id: "altoElfo",
          name: "Altos Elfos",
          description: "Elfos graciosos e eruditos, com afinidade natural pela magia.",
          effects: {
            traits: [{ name: "Truque Extra", description: "Aprende um truque adicional à sua escolha." }],
          },
          source: PHB2024,
        },
        {
          id: "drow",
          name: "Drow",
          description: "Elfos das profundezas, com visão superior e magia sombria.",
          effects: {
            traits: [
              { name: "Visão no Escuro Superior", description: "Visão no escuro até 36m." },
              { name: "Magia Drow", description: "Aprende o truque Dança das Sombras." },
            ],
          },
          source: PHB2024,
        },
        {
          id: "elfoSilvestre",
          name: "Elfos Silvestres",
          description: "Elfos conectados à natureza, mestres da furtividade e arco.",
          effects: {
            traits: [{ name: "Máscara da Natureza", description: "Pode tentar se esconder mesmo quando levemente obscurecido por folhagem, chuva forte, neve caindo, neblina ou outros fenômenos naturais." }],
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },

  // 5. GNOMO
  {
    id: "gnomo",
    name: "Gnomo",
    description: "Curiosos e inventivos, gnomos encaram o mundo com olhos maravilhados e mentes engenhosas.",
    speed: 7.5,
    size: "Pequeno",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Gnômico"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como luz plena." },
      { name: "Esperteza Gnômica", description: "Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia." },
    ],
    subraces: [],
    raceChoice: {
      kind: "gnomeLineage",
      label: "Linhagem Gnômica",
      required: true,
      options: [
        {
          id: "bosque",
          name: "Gnomo do Bosque",
          description: "Gnomos conectados à natureza, com truques ilusórios.",
          effects: {
            traits: [{ name: "Truque Ilusório", description: "Aprende o truque Ilusão Menor." }],
            spellsGranted: [{ spellId: "ilusaoMenor", level: 0, notes: "Truque concedido pela linhagem." }],
          },
          source: PHB2024,
        },
        {
          id: "rochas",
          name: "Gnomo das Rochas",
          description: "Gnomos artesãos, proficientes em ferramentas e engenhocas.",
          effects: {
            proficiencies: { skills: [], tools: ["Ferramentas de Funileiro"], weapons: [], armor: [] },
            traits: [{ name: "Engenhocas", description: "Pode criar engenhocas pequenas com materiais simples." }],
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },

  // 6. GOLIAS
  {
    id: "golias",
    name: "Golias",
    description: "Gigantes nômades das montanhas, goliats valorizam competição e auto-suficiência.",
    speed: 10.5,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Gigante"],
    proficiencies: { skills: ["Atletismo"], tools: [], weapons: [], armor: [] },
    traits: [
      { name: "Gigante por Natureza", description: "Conta como tamanho Grande para carga, empurrar, agarrar e puxar." },
      { name: "Nascido nas Montanhas", description: "Resistência a dano de frio. Aclimatado a grandes altitudes." },
      { name: "Resistência de Pedra", description: "Use reação para reduzir dano em 1d12 + mod. CON. Usos = bônus de proficiência / descanso longo." },
    ],
    subraces: [],
    raceChoice: {
      kind: "giantAncestry",
      label: "Ancestralidade Gigante",
      required: true,
      options: [
        {
          id: "tempestade",
          name: "Gigante da Tempestade",
          description: "Ancestralidade de gigantes das tempestades, com controle sobre o vento e raios.",
          effects: {
            traits: [{ name: "Retumbar dos Gigantes", description: "Pode usar uma ação para causar trovão audível a 18m, ou relâmpago em linha de 18m (CD 13, 2d6 elétrico)." }],
          },
          source: PHB2024,
        },
        {
          id: "pedra",
          name: "Gigante da Pedra",
          description: "Ancestralidade de gigantes da pedra, com força e resistência superiores.",
          effects: {
            traits: [{ name: "Força da Pedra", description: "Vantagem em testes de Força e Constituição." }],
          },
          source: PHB2024,
        },
        {
          id: "fogo",
          name: "Gigante de Fogo",
          description: "Ancestralidade de gigantes do fogo, com afinidade ao calor e chamas.",
          effects: {
            traits: [{ name: "Fúria das Chamas", description: "Resistência a fogo. Pode causar fogo em toque (1d6 fogo)." }],
          },
          source: PHB2024,
        },
        {
          id: "gelo",
          name: "Gigante do Gelo",
          description: "Ancestralidade de gigantes do gelo, com controle sobre o frio.",
          effects: {
            traits: [{ name: "Toque Gélido", description: "Pode causar frio em toque (1d6 gélido)." }],
          },
          source: PHB2024,
        },
        {
          id: "nuvem",
          name: "Gigante das Nuvens",
          description: "Ancestralidade de gigantes das nuvens, com leveza e agilidade.",
          effects: {
            traits: [{ name: "Leve como a Nuvem", description: "Vantagem em testes de Destreza e Sabedoria." }],
          },
          source: PHB2024,
        },
        {
          id: "colina",
          name: "Gigante da Colina",
          description: "Ancestralidade de gigantes da colina, com força bruta.",
          effects: {
            traits: [{ name: "Força da Colina", description: "Pode empurrar ou derrubar criaturas maiores." }],
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },

  // 7. HUMANO
  {
    id: "humano",
    name: "Humano",
    description: "Os mais adaptáveis e ambiciosos. Sociedades diversas e talentos variados.",
    speed: 9,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Um idioma adicional à sua escolha"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Engenhosidade", description: "Proficiência em uma perícia à sua escolha." },
      { name: "Determinação Humana", description: "Quando falhar num teste de habilidade, ataque ou TR, ganhe Inspiração Heroica. 1/descanso longo." },
      { name: "Versátil", description: "Ganhe um Talento de Origem." },
    ],
    subraces: [],
    source: PHB2024,
  },

  // 8. ORC
  {
    id: "orc",
    name: "Orc",
    description: "Fortes e vigorosos, orcs são guerreiros natos que valorizam força e camaradagem.",
    speed: 9,
    size: "Médio",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Orc"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como luz plena." },
      { name: "Resistência Implacável", description: "Ao ser reduzido a 0 PV (mas não morto), pode cair para 1 PV em vez disso. Usos = prof. / descanso longo." },
      { name: "Fúria Adrenalinada", description: "Como ação bônus, mova-se em linha reta até seu deslocamento em direção a um inimigo. Usos = prof. / descanso longo." },
    ],
    subraces: [],
    source: PHB2024,
  },

  // 9. PEQUENINO (Halfling)
  {
    id: "pequenino",
    name: "Pequenino",
    description: "Pequenos e ágeis, pequeninos são conhecidos por sua sorte e coragem surpreendente.",
    speed: 9,
    size: "Pequeno",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Halfling"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Sortudo", description: "Ao rolar 1 natural num d20, pode rolar novamente e usar o novo resultado." },
      { name: "Bravura", description: "Vantagem em testes de resistência contra medo." },
      { name: "Naturalmente Furtivo", description: "Pode tentar se esconder atrás de criaturas de tamanho Médio ou maior." },
    ],
    subraces: [],
    source: PHB2024,
  },

  // 10. TIFERINO (Tiefling)
  {
    id: "tiferino",
    name: "Tiferino",
    description: "Descendentes de linhagens infernais, tiferinos carregam marcas de seu legado demoníaco.",
    speed: 9,
    size: "Médio ou Pequeno",
    abilityBonuses: { mode: "fixed", fixed: {} },
    languages: ["Comum", "Infernal"],
    proficiencies: EMPTY_PROF,
    traits: [
      { name: "Visão no Escuro", description: "Enxerga na penumbra a até 18m como luz plena." },
    ],
    subraces: [],
    raceChoice: {
      kind: "infernalLegacy",
      label: "Legado Ínfero",
      required: true,
      options: [
        {
          id: "abissal",
          name: "Abissal",
          description: "Legado abissal, com resistência a fogo e truque de taumaturgia.",
          effects: {
            resistances: ["fogo"],
            spellsGranted: [{ spellId: "taumaturgia", level: 0, notes: "Truque concedido pelo legado." }],
          },
          source: PHB2024,
        },
        {
          id: "ctonico",
          name: "Ctônico",
          description: "Legado ctônico, com resistência a necrótico e truque de toque gélido.",
          effects: {
            resistances: ["necrótico"],
            spellsGranted: [{ spellId: "toqueGelido", level: 0, notes: "Truque concedido pelo legado." }],
          },
          source: PHB2024,
        },
        {
          id: "infernal",
          name: "Infernal",
          description: "Legado infernal, com resistência a fogo e truque de taumaturgia.",
          effects: {
            resistances: ["fogo"],
            spellsGranted: [{ spellId: "taumaturgia", level: 0, notes: "Truque concedido pelo legado." }],
          },
          source: PHB2024,
        },
      ],
    },
    source: PHB2024,
  },
];

/** Lookup map */
export const racesById: Record<string, RaceData> = Object.fromEntries(
  races.map((r) => [r.id, r])
);

export function hasPlannedRaceContent(race: RaceData | undefined): boolean {
  if (!race?.raceChoice?.options) return false;
  return race.raceChoice.options.some((option) => option.availability === "planned");
}
