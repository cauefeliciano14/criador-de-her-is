export interface Race {
  id: string;
  name: string;
  description: string;
  speed: number;
  abilityBonuses: Record<string, number>;
  proficiencies: string[];
  languages: string[];
  features: { name: string; description: string }[];
  subraces?: Subrace[];
}

export interface Subrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: Record<string, number>;
  features: { name: string; description: string }[];
}

export const races: Race[] = [
  {
    id: "humano",
    name: "Humano",
    description:
      "Os humanos são os mais adaptáveis e ambiciosos entre as raças comuns. Suas sociedades são diversas e seus talentos, variados.",
    speed: 9,
    abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    proficiencies: [],
    languages: ["Comum", "Um idioma adicional à sua escolha"],
    features: [
      {
        name: "Versátil",
        description:
          "Você recebe proficiência em uma perícia à sua escolha e um talento à sua escolha (pré-requisitos se aplicam).",
      },
    ],
  },
  {
    id: "elfo",
    name: "Elfo",
    description:
      "Elfos são seres feéricos de graça sobrenatural, vivendo no mundo sem pertencer totalmente a ele. Habitam lugares de beleza etérea.",
    speed: 9,
    abilityBonuses: { dex: 2 },
    proficiencies: ["Percepção"],
    languages: ["Comum", "Élfico"],
    features: [
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
          "Elfos não dormem. Em vez disso, meditam profundamente por 4 horas por dia, equivalente a 8 horas de sono.",
      },
    ],
    subraces: [
      {
        id: "elfo-alto",
        name: "Alto Elfo",
        description:
          "Altos Elfos possuem uma mente afiada e maestria em magia básica, além de treinamento com espada e arco.",
        abilityBonuses: { int: 1 },
        features: [
          {
            name: "Treinamento Élfico em Armas",
            description:
              "Proficiência com espada longa, espada curta, arco longo e arco curto.",
          },
          {
            name: "Truque",
            description:
              "Você conhece um truque à sua escolha da lista de magias do mago. Inteligência é seu atributo de conjuração.",
          },
        ],
      },
      {
        id: "elfo-da-floresta",
        name: "Elfo da Floresta",
        description:
          "Elfos da Floresta são rápidos e furtivos, com sentidos apurados para a natureza selvagem.",
        abilityBonuses: { wis: 1 },
        features: [
          {
            name: "Pés Ligeiros",
            description: "Seu deslocamento base aumenta para 10,5m.",
          },
          {
            name: "Máscara da Natureza",
            description:
              "Você pode tentar se esconder mesmo quando está apenas levemente obscurecido por folhagem, chuva, neve ou névoa.",
          },
        ],
      },
    ],
  },
];
