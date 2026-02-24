export interface ClassePersonagem {
  id: string;
  nome: string;
  subtitulo: string;
  descricao: string;
  tracosBasicos: {
    atributoPrimario: string;
    dadoDeVida: string;
    salvaguardas: string[];
    pericias: {
      escolher: number;
      opcoes: string[];
    };
    proficienciasArmas: string[];
    treinamentoArmadura: string[];
  };
  equipamentoInicial: {
    opcaoA: string[];
    opcaoB: string[];
    observacoes: string;
  };
  recursosPorNivel: {
    nivel: number;
    recursos: string[];
  }[];
  notas: {
    importante: string;
    formato: string;
  };
}

export const classes: ClassePersonagem[] = [
  {
    id: "barbaro",
    nome: "Bárbaro",
    subtitulo: "Um guerreiro feroz movido pela fúria primitiva",
    descricao:
      "Para alguns, a raiva que sentem quando entram em combate é um portal para um poder primitivo. Quando esses guerreiros entram em fúria, tornam-se brutais e implacáveis. Essa força bruta vem de um lugar profundo — uma conexão com a natureza selvagem e os espíritos ancestrais que despertam o instinto mais primordial de sobrevivência.",
    tracosBasicos: {
      atributoPrimario: "Força",
      dadoDeVida: "d12",
      salvaguardas: ["Força", "Constituição"],
      pericias: {
        escolher: 2,
        opcoes: [
          "Adestrar Animais",
          "Atletismo",
          "Intimidação",
          "Natureza",
          "Percepção",
          "Sobrevivência",
        ],
      },
      proficienciasArmas: [
        "Armas simples",
        "Armas marciais",
      ],
      treinamentoArmadura: [
        "Armaduras leves",
        "Armaduras médias",
        "Escudos",
      ],
    },
    equipamentoInicial: {
      opcaoA: [
        "Um machado grande",
        "Duas machadinhas",
        "Um pacote de aventureiro",
        "Quatro azagaias",
      ],
      opcaoB: [
        "Uma arma marcial qualquer",
        "Dois machados de mão",
        "Um pacote de explorador",
        "Quatro azagaias",
      ],
      observacoes:
        "O jogador deve escolher entre a Opção A ou a Opção B para seu equipamento inicial.",
    },
    recursosPorNivel: [
      {
        nivel: 1,
        recursos: ["Fúria (2 usos)", "Defesa sem Armadura"],
      },
      {
        nivel: 2,
        recursos: ["Ataque Descuidado", "Sentido de Perigo"],
      },
      {
        nivel: 3,
        recursos: ["Caminho Primitivo (subclasse)", "Fúria (3 usos)"],
      },
      {
        nivel: 5,
        recursos: ["Ataque Extra", "Movimento Rápido (+3m)"],
      },
    ],
    notas: {
      importante:
        "A Fúria do Bárbaro concede vantagem em testes de Força e resistência a dano físico (cortante, perfurante e contundente). Não é possível conjurar magias ou manter concentração durante a fúria.",
      formato:
        "O Bárbaro é ideal para jogadores que preferem combate corpo a corpo direto e agressivo, sem se preocupar com mecânicas complexas de magia.",
    },
  },
];
