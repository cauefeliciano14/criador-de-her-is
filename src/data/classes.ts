export interface EquipmentChoice {
  id: string;
  label: string;
  items: string[];
  gold: number;
}

export interface SpellcastingData {
  ability: string;
  type: "prepared" | "known" | "pact";
  cantripsKnownAtLevel: Record<number, number>;
  spellsPreparedFormula: string;
  spellSlotsByLevel: Record<number, Record<number, number>>;
}

export interface ClassFeature {
  name: string;
  description: string;
}

export interface FeaturesByLevel {
  level: number;
  features: ClassFeature[];
}

export interface SubclassData {
  id: string;
  name: string;
  description: string;
  featuresByLevel: FeaturesByLevel[];
}

export interface ClassData {
  id: string;
  name: string;
  description: string;
  primaryAbility: string[];
  hitDie: number;
  savingThrows: string[];
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    languages: string[];
  };
  skillChoices: { choose: number; from: string[] };
  equipmentChoices: EquipmentChoice[];
  spellcasting: SpellcastingData | null;
  featuresByLevel: FeaturesByLevel[];
  subclasses: SubclassData[];
}

export const classes: ClassData[] = [
  {
    id: "barbaro",
    name: "Bárbaro",
    description:
      "Um guerreiro feroz movido pela fúria primitiva. Quando entra em fúria, torna-se brutal e implacável, canalizando uma força primal devastadora.",
    primaryAbility: ["Força"],
    hitDie: 12,
    savingThrows: ["Força", "Constituição"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
      weapons: ["Armas Simples", "Armas Marciais"],
      tools: [],
      languages: [],
    },
    skillChoices: {
      choose: 2,
      from: ["Adestrar Animais", "Atletismo", "Intimidação", "Natureza", "Percepção", "Sobrevivência"],
    },
    equipmentChoices: [
      {
        id: "A",
        label: "Escolha A",
        items: ["Machado Grande", "4 Azagaias", "Kit de Explorador", "15 PO"],
        gold: 15,
      },
      {
        id: "B",
        label: "Escolha B",
        items: [],
        gold: 75,
      },
    ],
    spellcasting: null,
    featuresByLevel: [
      {
        level: 1,
        features: [
          {
            name: "Fúria",
            description:
              "2 usos por descanso longo. Vantagem em testes de Força, resistência a dano contundente/cortante/perfurante, +2 dano corpo a corpo.",
          },
          {
            name: "Defesa sem Armadura",
            description: "Sem armadura, sua CA = 10 + mod. Destreza + mod. Constituição.",
          },
        ],
      },
      {
        level: 2,
        features: [
          {
            name: "Ataque Descuidado",
            description: "Vantagem em ataques corpo a corpo no turno, mas ataques contra você também têm vantagem.",
          },
          {
            name: "Sentido de Perigo",
            description: "Vantagem em testes de resistência de Destreza contra efeitos que você pode ver.",
          },
        ],
      },
    ],
    subclasses: [
      {
        id: "trilha-do-berserker",
        name: "Trilha do Berserker",
        description: "Fúria descontrolada que concede ataques extras a custo de exaustão.",
        featuresByLevel: [
          {
            level: 3,
            features: [
              {
                name: "Frenesi",
                description:
                  "Ao entrar em fúria, pode fazer um ataque corpo a corpo adicional como ação bônus, mas ganha 1 nível de exaustão ao final.",
              },
            ],
          },
        ],
      },
      {
        id: "trilha-do-totem",
        name: "Trilha do Guerreiro Totêmico",
        description: "Conexão espiritual com animais totêmicos que concedem poderes variados.",
        featuresByLevel: [
          {
            level: 3,
            features: [
              {
                name: "Espírito Totêmico",
                description:
                  "Escolha um animal totêmico (Urso, Águia ou Lobo) que concede um poder especial enquanto em fúria.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "mago",
    name: "Mago",
    description:
      "Um estudioso da magia arcana, capaz de manipular a realidade por meio de fórmulas, gestos e componentes místicos aprendidos com anos de estudo.",
    primaryAbility: ["Inteligência"],
    hitDie: 6,
    savingThrows: ["Inteligência", "Sabedoria"],
    proficiencies: {
      armor: [],
      weapons: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas Leves"],
      tools: [],
      languages: [],
    },
    skillChoices: {
      choose: 2,
      from: ["Arcanismo", "História", "Intuição", "Investigação", "Medicina", "Religião"],
    },
    equipmentChoices: [
      {
        id: "A",
        label: "Escolha A",
        items: ["Bordão", "Grimório", "Bolsa de Componentes", "Mochila de Estudioso", "10 PO"],
        gold: 10,
      },
      {
        id: "B",
        label: "Escolha B",
        items: [],
        gold: 55,
      },
    ],
    spellcasting: {
      ability: "Inteligência",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 3, 4: 4, 10: 5 },
      spellsPreparedFormula: "mod. Inteligência + nível de Mago (mín. 1)",
      spellSlotsByLevel: {
        1: { 1: 2 },
        2: { 1: 3 },
        3: { 1: 4, 2: 2 },
        4: { 1: 4, 2: 3 },
        5: { 1: 4, 2: 3, 3: 2 },
      },
    },
    featuresByLevel: [
      {
        level: 1,
        features: [
          {
            name: "Conjuração",
            description: "Você pode conjurar magias de mago. Inteligência é seu atributo de conjuração.",
          },
          {
            name: "Recuperação Arcana",
            description:
              "Uma vez por dia, durante um descanso curto, recupere espaços de magia cujo nível total seja ≤ metade do seu nível de mago (arredondado para cima).",
          },
        ],
      },
    ],
    subclasses: [
      {
        id: "escola-de-evocacao",
        name: "Escola de Evocação",
        description: "Especialista em magias de dano em área, capaz de proteger aliados de seus próprios efeitos.",
        featuresByLevel: [
          {
            level: 2,
            features: [
              {
                name: "Esculpir Magias",
                description: "Ao conjurar uma magia de evocação, pode proteger aliados do efeito.",
              },
            ],
          },
        ],
      },
      {
        id: "escola-de-abjuracao",
        name: "Escola de Abjuração",
        description: "Mestre em magias de proteção e banimento, criando escudos arcanos.",
        featuresByLevel: [
          {
            level: 2,
            features: [
              {
                name: "Proteção Arcana",
                description: "Ao conjurar uma magia de abjuração, cria um escudo mágico que absorve dano.",
              },
            ],
          },
        ],
      },
    ],
  },
];
