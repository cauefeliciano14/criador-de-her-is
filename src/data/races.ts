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

export interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: RaceAbilityBonuses;
  languages: string[];
  proficiencies: RaceProficiencies;
  traits: RaceTrait[];
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
}

export const races: RaceData[] = [
  {
    id: "anao",
    name: "Anão",
    description:
      "Fortes e resistentes, anões são conhecidos por sua tenacidade em combate e maestria em trabalhos com pedra e metal. Habitam fortalezas subterrâneas e valorizam honra e tradição.",
    speed: 7.5,
    size: "Médio",
    abilityBonuses: {
      mode: "fixed",
      fixed: { con: 2 },
    },
    languages: ["Comum", "Anão"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: ["Machado de batalha", "Machado de mão", "Martelo leve", "Martelo de guerra"],
      armor: [],
    },
    traits: [
      {
        name: "Visão no Escuro",
        description:
          "Você enxerga na penumbra a até 18m como se fosse luz plena, e no escuro como se fosse penumbra. Você não distingue cores no escuro, apenas tons de cinza.",
      },
      {
        name: "Resiliência Anã",
        description:
          "Você tem vantagem em testes de resistência contra veneno e resistência a dano de veneno.",
      },
      {
        name: "Conhecimento em Rochas",
        description:
          "Sempre que fizer um teste de Inteligência (História) relacionado à origem de trabalhos em pedra, você é considerado proficiente e adiciona o dobro do seu bônus de proficiência.",
      },
    ],
    subraces: [
      {
        id: "anao-da-colina",
        name: "Anão da Colina",
        description:
          "Anões da Colina possuem sentidos aguçados, intuição profunda e resistência notável. São conhecidos por sua sabedoria e vitalidade.",
        abilityBonuses: { mode: "fixed", fixed: { wis: 1 } },
        languages: [],
        proficiencies: { skills: [], tools: [], weapons: [], armor: [] },
        traits: [
          {
            name: "Tenacidade Anã",
            description:
              "Seu máximo de pontos de vida aumenta em 1, e aumenta em 1 novamente a cada nível que ganhar.",
          },
        ],
      },
      {
        id: "anao-da-montanha",
        name: "Anão da Montanha",
        description:
          "Anões da Montanha são fortes e acostumados à vida em terrenos acidentados. São treinados no uso de armaduras desde cedo.",
        abilityBonuses: { mode: "fixed", fixed: { str: 2 } },
        languages: [],
        proficiencies: { skills: [], tools: [], weapons: [], armor: ["Armaduras leves", "Armaduras médias"] },
        traits: [],
      },
    ],
  },
  {
    id: "elfo",
    name: "Elfo",
    description:
      "Elfos são seres feéricos de graça sobrenatural, vivendo no mundo sem pertencer totalmente a ele. Habitam lugares de beleza etérea e possuem vidas longas cheias de aprendizado.",
    speed: 9,
    size: "Médio",
    abilityBonuses: {
      mode: "fixed",
      fixed: { dex: 2 },
    },
    languages: ["Comum", "Élfico"],
    proficiencies: {
      skills: ["Percepção"],
      tools: [],
      weapons: [],
      armor: [],
    },
    traits: [
      {
        name: "Visão no Escuro",
        description:
          "Você enxerga na penumbra a até 18m como se fosse luz plena, e no escuro como se fosse penumbra.",
      },
      {
        name: "Ancestralidade Feérica",
        description:
          "Você tem vantagem em testes de resistência contra encantamento e magia não pode colocá-lo para dormir.",
      },
      {
        name: "Transe",
        description:
          "Elfos não dormem. Em vez disso, meditam profundamente por 4 horas por dia, equivalente a 8 horas de sono para humanos.",
      },
    ],
    subraces: [
      {
        id: "alto-elfo",
        name: "Alto Elfo",
        description:
          "Altos Elfos possuem uma mente afiada e maestria em magia básica, além de treinamento militar tradicional.",
        abilityBonuses: { mode: "fixed", fixed: { int: 1 } },
        languages: ["Um idioma adicional à sua escolha"],
        proficiencies: { skills: [], tools: [], weapons: ["Espada longa", "Espada curta", "Arco longo", "Arco curto"], armor: [] },
        traits: [
          {
            name: "Truque",
            description:
              "Você conhece um truque à sua escolha da lista de magias do mago. Inteligência é seu atributo de conjuração para este truque.",
          },
        ],
      },
      {
        id: "elfo-da-floresta",
        name: "Elfo da Floresta",
        description:
          "Elfos da Floresta são rápidos e furtivos, com sentidos apurados para a natureza selvagem e habilidade natural de se ocultar.",
        abilityBonuses: { mode: "fixed", fixed: { wis: 1 } },
        languages: [],
        proficiencies: { skills: [], tools: [], weapons: ["Espada longa", "Espada curta", "Arco longo", "Arco curto"], armor: [] },
        traits: [
          {
            name: "Pés Ligeiros",
            description: "Seu deslocamento base aumenta para 10,5m.",
          },
          {
            name: "Máscara da Natureza",
            description:
              "Você pode tentar se esconder mesmo quando está apenas levemente obscurecido por folhagem, chuva forte, neve ou névoa.",
          },
        ],
      },
    ],
  },
  {
    id: "humano",
    name: "Humano",
    description:
      "Os humanos são os mais adaptáveis e ambiciosos entre as raças comuns. Suas sociedades são incrivelmente diversas e seus talentos, variados.",
    speed: 9,
    size: "Médio",
    abilityBonuses: {
      mode: "choose",
      choose: {
        choices: 3,
        bonus: 1,
        from: ["str", "dex", "con", "int", "wis", "cha"],
        maxPerAbility: 1,
      },
    },
    languages: ["Comum", "Um idioma adicional à sua escolha"],
    proficiencies: {
      skills: [],
      tools: [],
      weapons: [],
      armor: [],
    },
    traits: [
      {
        name: "Versátil",
        description:
          "Você recebe proficiência em uma perícia à sua escolha.",
      },
      {
        name: "Determinação Humana",
        description:
          "Quando fizer um teste de d20 e obter resultado entre 1 e 7, você pode tratar o dado como 8. Pode usar essa habilidade um número de vezes igual ao seu bônus de proficiência por descanso longo.",
      },
      {
        name: "Engenhosidade Heroica",
        description:
          "Você ganha um talento de Origem à sua escolha. Requisitos de pré-requisito se aplicam normalmente.",
      },
    ],
    subraces: [],
  },
];
