export interface ClassData {
  id: string;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: string[];
  skillChoices: { choose: number; from: string[] };
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  isSpellcaster: boolean;
  spellcastingAbility?: string;
  features: { name: string; level: number; description: string }[];
  subclasses?: { id: string; name: string; description: string }[];
}

export const classes: ClassData[] = [
  {
    id: "barbaro",
    name: "Bárbaro",
    description:
      "Um guerreiro feroz movido pela fúria primitiva. Quando entra em fúria, torna-se brutal e implacável, canalizando uma força primal devastadora.",
    hitDie: 12,
    primaryAbility: "str",
    savingThrows: ["str", "con"],
    skillChoices: {
      choose: 2,
      from: [
        "Adestrar Animais",
        "Atletismo",
        "Intimidação",
        "Natureza",
        "Percepção",
        "Sobrevivência",
      ],
    },
    armorProficiencies: ["Armaduras leves", "Armaduras médias", "Escudos"],
    weaponProficiencies: ["Armas simples", "Armas marciais"],
    toolProficiencies: [],
    isSpellcaster: false,
    features: [
      { name: "Fúria", level: 1, description: "2 usos por descanso longo. Vantagem em testes de Força, resistência a dano contundente/cortante/perfurante, +2 dano corpo a corpo." },
      { name: "Defesa sem Armadura", level: 1, description: "Sem armadura, sua CA = 10 + mod. Destreza + mod. Constituição." },
      { name: "Ataque Descuidado", level: 2, description: "Vantagem em ataques corpo a corpo no turno, mas ataques contra você também têm vantagem." },
      { name: "Sentido de Perigo", level: 2, description: "Vantagem em testes de resistência de Destreza contra efeitos que você pode ver." },
    ],
    subclasses: [
      { id: "berserker", name: "Caminho do Berserker", description: "Fúria descontrolada que concede ataques extras a custo de exaustão." },
      { id: "totem", name: "Caminho do Guerreiro Totêmico", description: "Conexão espiritual com animais totêmicos que concedem poderes variados." },
    ],
  },
  {
    id: "mago",
    name: "Mago",
    description:
      "Um estudioso da magia arcana, capaz de manipular a realidade por meio de fórmulas, gestos e componentes místicos aprendidos com anos de estudo.",
    hitDie: 6,
    primaryAbility: "int",
    savingThrows: ["int", "wis"],
    skillChoices: {
      choose: 2,
      from: [
        "Arcanismo",
        "História",
        "Intuição",
        "Investigação",
        "Medicina",
        "Religião",
      ],
    },
    armorProficiencies: [],
    weaponProficiencies: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas leves"],
    toolProficiencies: [],
    isSpellcaster: true,
    spellcastingAbility: "int",
    features: [
      { name: "Conjuração", level: 1, description: "Você pode conjurar magias de mago. Inteligência é seu atributo de conjuração." },
      { name: "Recuperação Arcana", level: 1, description: "Uma vez por dia, durante um descanso curto, recupere espaços de magia cujo nível total seja ≤ metade do seu nível de mago." },
    ],
    subclasses: [
      { id: "evocacao", name: "Escola de Evocação", description: "Especialista em magias de dano em área, capaz de proteger aliados de seus próprios efeitos." },
      { id: "abjuracao", name: "Escola de Abjuração", description: "Mestre em magias de proteção e banimento, criando escudos arcanos." },
    ],
  },
];
