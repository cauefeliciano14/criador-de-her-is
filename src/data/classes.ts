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
  spellsKnownAtLevel?: Record<number, number>;
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
  subclassLevel?: number;
  asiLevels: number[];
  attributeBonus?: string[];
}

// ── Helper: standard spell slots ──
const FULL_CASTER_SLOTS: Record<number, Record<number, number>> = {
  1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
  5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 }, 13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

const HALF_CASTER_SLOTS: Record<number, Record<number, number>> = {
  2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
  6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 },
  9: { 1: 4, 2: 3, 3: 2 }, 10: { 1: 4, 2: 3, 3: 2 },
  11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
  13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
};

export const classes: ClassData[] = [
  // ══════════════════════════════════════════
  // 1. BÁRBARO
  // ══════════════════════════════════════════
  {
    id: "barbaro",
    name: "Bárbaro",
    description: "Um guerreiro feroz movido pela fúria primitiva.",
    primaryAbility: ["Força"],
    hitDie: 12,
    savingThrows: ["Força", "Constituição"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
      weapons: ["Armas Simples", "Armas Marciais"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Adestrar Animais", "Atletismo", "Intimidação", "Natureza", "Percepção", "Sobrevivência"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Machado Grande", "4 Azagaias", "Kit de Explorador"], gold: 15 },
      { id: "B", label: "Escolha B", items: [], gold: 75 },
    ],
    spellcasting: null,
    subclassLevel: 3,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Fúria", description: "2 usos/descanso longo. Vantagem em testes de FOR, resistência a dano contundente/cortante/perfurante, +2 dano corpo a corpo." },
        { name: "Defesa sem Armadura", description: "Sem armadura, CA = 10 + mod. DES + mod. CON." },
      ]},
      { level: 2, features: [
        { name: "Ataque Descuidado", description: "Vantagem em ataques corpo a corpo, mas ataques contra você também têm vantagem." },
        { name: "Sentido de Perigo", description: "Vantagem em TR de DES contra efeitos que você pode ver." },
      ]},
      { level: 3, features: [{ name: "Subclasse", description: "Escolha sua Trilha Primitiva." }] },
      { level: 5, features: [
        { name: "Ataque Extra", description: "Você pode atacar duas vezes ao usar a ação Atacar." },
        { name: "Movimento Rápido", description: "+3m de deslocamento sem armadura pesada." },
      ]},
      { level: 7, features: [{ name: "Instinto Selvagem", description: "Vantagem em Iniciativa. Não pode ser surpreendido se não estiver incapacitado." }] },
      { level: 9, features: [{ name: "Crítico Brutal", description: "Ao acertar um crítico, role 1 dado de dano adicional." }] },
      { level: 11, features: [{ name: "Fúria Implacável", description: "Se cair a 0 PV em fúria, pode fazer TR de CON CD 10 para ficar com 1 PV." }] },
      { level: 15, features: [{ name: "Fúria Persistente", description: "Sua fúria só termina prematuramente se ficar inconsciente ou escolher encerrá-la." }] },
      { level: 18, features: [{ name: "Poder Indomável", description: "Se seu total em teste de FOR for menor que seu valor de FOR, use o valor de FOR." }] },
      { level: 20, features: [{ name: "Campeão Primitivo", description: "FOR e CON aumentam em 4. Máximo passa a 24." }] },
    ],
    subclasses: [
      {
        id: "trilhaBerserker",
        name: "Trilha do Berserker",
        description: "Fúria descontrolada que concede ataques extras.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Frenesi", description: "Em fúria, pode fazer um ataque corpo a corpo adicional como ação bônus." }] },
          { level: 6, features: [{ name: "Fúria Insensata", description: "Não pode ser encantado ou amedrontado em fúria." }] },
          { level: 10, features: [{ name: "Presença Intimidadora", description: "Use ação para amedrontar uma criatura (TR de SAB)." }] },
          { level: 14, features: [{ name: "Retaliação", description: "Ao sofrer dano de criatura a 1,5m, pode usar reação para atacar corpo a corpo." }] },
        ],
      },
      {
        id: "trilhaTotem",
        name: "Trilha do Guerreiro Totêmico",
        description: "Conexão espiritual com animais totêmicos.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Espírito Totêmico", description: "Escolha Urso, Águia ou Lobo para um poder especial em fúria." }] },
          { level: 6, features: [{ name: "Aspecto da Besta", description: "Ganhe benefício do totem escolhido fora de fúria." }] },
          { level: 10, features: [{ name: "Andarilho Espiritual", description: "Conjure Comunhão com a Natureza como ritual." }] },
          { level: 14, features: [{ name: "Sintonia Totêmica", description: "Ganhe poder final do totem escolhido." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 2. BARDO
  // ══════════════════════════════════════════
  {
    id: "bardo",
    name: "Bardo",
    description: "Um artista cuja música canaliza magia e inspira aliados.",
    primaryAbility: ["Carisma"],
    hitDie: 8,
    savingThrows: ["Destreza", "Carisma"],
    proficiencies: {
      armor: ["Armaduras Leves"],
      weapons: ["Armas Simples", "Bestas de Mão", "Espadas Longas", "Rapieiras", "Espadas Curtas"],
      tools: ["Três instrumentos musicais à sua escolha"],
      languages: [],
    },
    skillChoices: { choose: 3, from: ["Acrobacia", "Adestrar Animais", "Arcanismo", "Atletismo", "Atuação", "Enganação", "Furtividade", "História", "Intimidação", "Intuição", "Investigação", "Medicina", "Natureza", "Percepção", "Persuasão", "Prestidigitação", "Religião", "Sobrevivência"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Rapieira", "Armadura de Couro", "Kit de Explorador", "Instrumento Musical"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 100 },
    ],
    spellcasting: {
      ability: "Carisma",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 2, 4: 3, 10: 4 },
      spellsPreparedFormula: "mod. Carisma + nível de Bardo (mín. 1)",
      spellSlotsByLevel: FULL_CASTER_SLOTS,
    },
    subclassLevel: 3,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Conjuração", description: "Carisma é seu atributo de conjuração. Usa um instrumento musical como foco." },
        { name: "Inspiração Bárdica", description: "Usos = mod. CAR. Ação bônus para conceder d6 a um aliado a 18m." },
      ]},
      { level: 2, features: [
        { name: "Versatilidade", description: "Ganhe perícia em qualquer perícia de sua escolha." },
        { name: "Canção de Descanso", description: "Aliados recuperam 1d6 PV extra durante descanso curto." },
      ]},
      { level: 3, features: [{ name: "Subclasse", description: "Escolha seu Colégio Bárdico." }] },
      { level: 5, features: [{ name: "Fonte de Inspiração", description: "Recupera Inspiração Bárdica em descanso curto. Dado sobe para d8." }] },
      { level: 6, features: [{ name: "Contramágica", description: "Use reação para tentar dissipar magias." }] },
      { level: 10, features: [{ name: "Segredos Mágicos", description: "Aprenda 2 magias de qualquer lista. Dado de Inspiração sobe para d10." }] },
      { level: 14, features: [{ name: "Inspiração Superior", description: "Dado de Inspiração sobe para d12." }] },
      { level: 20, features: [{ name: "Inspiração Superior", description: "Quando rolar Iniciativa e não tiver usos de Inspiração, recupere 1." }] },
    ],
    subclasses: [
      {
        id: "colegioConhecimento",
        name: "Colégio do Conhecimento",
        description: "Bardos estudiosos que coletam segredos e magias de diversas fontes.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Proficiências Bônus", description: "Ganhe proficiência em 3 perícias à sua escolha." },
            { name: "Palavras Cortantes", description: "Use Inspiração para subtrair do teste de um inimigo." },
          ]},
          { level: 6, features: [{ name: "Segredos Mágicos Adicionais", description: "Aprenda 2 magias de qualquer lista de classes." }] },
          { level: 14, features: [{ name: "Mestre Incomparável", description: "Adicione metade do bônus de proficiência a testes em que não é proficiente." }] },
        ],
      },
      {
        id: "colegioValor",
        name: "Colégio da Bravura",
        description: "Bardos guerreiros que inspiram pela coragem em combate.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Proficiências Bônus", description: "Proficiência em armaduras médias, escudos e armas marciais." },
            { name: "Inspiração em Combate", description: "Alvo da Inspiração pode adicioná-la ao dano ou CA." },
          ]},
          { level: 6, features: [{ name: "Ataque Extra", description: "Ataque duas vezes ao usar Atacar." }] },
          { level: 14, features: [{ name: "Magia de Batalha", description: "Ao conjurar, pode fazer um ataque como ação bônus." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 3. BRUXO
  // ══════════════════════════════════════════
  {
    id: "bruxo",
    name: "Bruxo",
    description: "Um conjurador que obtém poder através de um pacto com uma entidade sobrenatural.",
    primaryAbility: ["Carisma"],
    hitDie: 8,
    savingThrows: ["Sabedoria", "Carisma"],
    proficiencies: {
      armor: ["Armaduras Leves"],
      weapons: ["Armas Simples"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Arcanismo", "Enganação", "História", "Intimidação", "Investigação", "Natureza", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Besta Leve", "Armadura de Couro", "Bolsa de Componentes", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 100 },
    ],
    spellcasting: {
      ability: "Carisma",
      type: "pact",
      cantripsKnownAtLevel: { 1: 2, 4: 3, 10: 4 },
      spellsPreparedFormula: "Magias de Pacto: slots de nível fixo, recuperam em descanso curto",
      spellSlotsByLevel: {
        1: { 1: 1 }, 2: { 1: 2 }, 3: { 2: 2 }, 4: { 2: 2 }, 5: { 3: 2 },
        6: { 3: 2 }, 7: { 4: 2 }, 8: { 4: 2 }, 9: { 5: 2 },
        10: { 5: 2 }, 11: { 5: 3 }, 12: { 5: 3 }, 13: { 5: 3 },
        14: { 5: 3 }, 15: { 5: 3 }, 16: { 5: 3 }, 17: { 5: 4 },
        18: { 5: 4 }, 19: { 5: 4 }, 20: { 5: 4 },
      },
      spellsKnownAtLevel: {
        1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10,
        10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13,
        17: 14, 18: 14, 19: 15, 20: 15,
      },
    },
    subclassLevel: 1,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Patrono Extraplanar", description: "Escolha seu patrono, que define sua subclasse." },
        { name: "Magia de Pacto", description: "Slots de magia recuperam em descanso curto." },
      ]},
      { level: 2, features: [{ name: "Invocações Místicas", description: "Ganhe 2 Invocações Místicas à sua escolha." }] },
      { level: 3, features: [{ name: "Dádiva do Pacto", description: "Escolha Pacto do Tomo, Lâmina ou Corrente." }] },
      { level: 5, features: [{ name: "Invocações Adicionais", description: "Ganhe mais 1 invocação. Slots sobem para 3º nível." }] },
      { level: 9, features: [{ name: "Contato com o Patrono", description: "Conjure Contatar Outro Plano 1/dia sem gastar slot." }] },
      { level: 11, features: [{ name: "Arcanum Místico", description: "Ganhe 1 magia de 6º nível conjurável 1/dia." }] },
      { level: 20, features: [{ name: "Mestre Místico", description: "Suplique ao patrono para recuperar todos os slots em 1 minuto, 1/descanso longo." }] },
    ],
    subclasses: [
      {
        id: "feerico",
        name: "O Feérico",
        description: "Patrono do reino feérico, concedendo magias de ilusão e encantamento.",
        featuresByLevel: [
          { level: 1, features: [{ name: "Presença Feérica", description: "Pode encantá-los ou amedrontar criaturas num cubo de 3m." }] },
          { level: 6, features: [{ name: "Fuga Enevoada", description: "Ao sofrer dano, pode usar reação para teleportar-se 18m e ficar invisível até o próximo turno." }] },
          { level: 10, features: [{ name: "Defesa contra Encantamento", description: "Não pode ser encantado. Se alguém tentar, pode redirecionar." }] },
          { level: 14, features: [{ name: "Desvario Sombrio", description: "Crie ilusão na mente de criatura, causando dano psíquico." }] },
        ],
      },
      {
        id: "infernal",
        name: "O Infernal",
        description: "Patrono demoníaco que concede magias de fogo e resistências.",
        featuresByLevel: [
          { level: 1, features: [{ name: "Bênção das Trevas", description: "Ao reduzir criatura hostil a 0 PV, ganhe PV temporários = mod. CAR + nível de Bruxo." }] },
          { level: 6, features: [{ name: "Sorte das Trevas", description: "Pode impor desvantagem em teste de ataque contra você, 1/descanso curto." }] },
          { level: 10, features: [{ name: "Resiliência Infernal", description: "Escolha 1 tipo de dano ao descansar. Resistência a esse tipo até próximo descanso." }] },
          { level: 14, features: [{ name: "Projetar pelo Inferno", description: "Ao acertar, pode transportar criatura pelo plano inferior, causando 10d10 dano psíquico." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 4. CLÉRIGO
  // ══════════════════════════════════════════
  {
    id: "clerigo",
    name: "Clérigo",
    description: "Um campeão divino cuja fé canaliza o poder dos deuses.",
    primaryAbility: ["Sabedoria"],
    hitDie: 8,
    savingThrows: ["Sabedoria", "Carisma"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
      weapons: ["Armas Simples"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["História", "Intuição", "Medicina", "Persuasão", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Maça", "Cota de Malha", "Símbolo Sagrado", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 110 },
    ],
    spellcasting: {
      ability: "Sabedoria",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 3, 4: 4, 10: 5 },
      spellsPreparedFormula: "mod. Sabedoria + nível de Clérigo (mín. 1)",
      spellSlotsByLevel: FULL_CASTER_SLOTS,
    },
    subclassLevel: 1,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Conjuração", description: "Sabedoria é seu atributo de conjuração. Use símbolo sagrado como foco." },
        { name: "Domínio Divino", description: "Escolha seu domínio (subclasse)." },
      ]},
      { level: 2, features: [{ name: "Canalizar Divindade", description: "1 uso entre descansos. Expulsar Mortos-Vivos + habilidade do domínio." }] },
      { level: 5, features: [{ name: "Destruir Mortos-Vivos", description: "Mortos-vivos de ND ½ ou menos são destruídos ao serem expulsos." }] },
      { level: 10, features: [{ name: "Intervenção Divina", description: "Suplique à divindade. Chance = nível%." }] },
      { level: 17, features: [{ name: "Destruir Mortos-Vivos Aprimorado", description: "Destrói mortos-vivos de ND 4 ou menos." }] },
      { level: 20, features: [{ name: "Intervenção Divina Aprimorada", description: "Intervenção Divina funciona automaticamente." }] },
    ],
    subclasses: [
      {
        id: "dominioVida",
        name: "Domínio da Vida",
        description: "Especialista em cura e proteção divina.",
        featuresByLevel: [
          { level: 1, features: [
            { name: "Proficiências Bônus", description: "Proficiência com armaduras pesadas." },
            { name: "Discípulo da Vida", description: "Magias de cura restauram 2 + nível da magia PV adicionais." },
          ]},
          { level: 2, features: [{ name: "Canalizar Divindade: Preservar Vida", description: "Distribua 5× seu nível de clérigo em PV entre aliados a 9m." }] },
          { level: 6, features: [{ name: "Curandeiro Abençoado", description: "Magias de cura de 1º+ nível também curam você (2 + nível da magia PV)." }] },
          { level: 8, features: [{ name: "Golpe Divino", description: "1/turno, adicione 1d8 de dano radiante a um ataque com arma." }] },
          { level: 17, features: [{ name: "Cura Suprema", description: "Em magias de cura, em vez de rolar dados, use o valor máximo." }] },
        ],
      },
      {
        id: "dominioLuz",
        name: "Domínio da Luz",
        description: "Portador da luz divina contra as trevas.",
        featuresByLevel: [
          { level: 1, features: [
            { name: "Truque Bônus", description: "Ganhe o truque Luz se não o possuir." },
            { name: "Labareda Protetora", description: "Reação: imponha desvantagem no ataque de criatura a 9m." },
          ]},
          { level: 2, features: [{ name: "Canalizar Divindade: Radiância do Amanhecer", description: "Emita luz brilhante que causa 2d10 + nível de dano radiante." }] },
          { level: 6, features: [{ name: "Labareda Aprimorada", description: "Labareda Protetora também causa 2d8 de dano radiante." }] },
          { level: 14, features: [{ name: "Halo de Luz", description: "Emita aura de 9m. Você e aliados ganham meia cobertura (+2 CA)." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 5. DRUIDA
  // ══════════════════════════════════════════
  {
    id: "druida",
    name: "Druida",
    description: "Um sacerdote da natureza que canaliza o poder das florestas, mares e céus.",
    primaryAbility: ["Sabedoria"],
    hitDie: 8,
    savingThrows: ["Inteligência", "Sabedoria"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
      weapons: ["Clavas", "Adagas", "Dardos", "Azagaias", "Maças", "Bordões", "Cimitarras", "Foices", "Fundas", "Lanças"],
      tools: ["Kit de Herbalismo"],
      languages: ["Druídico"],
    },
    skillChoices: { choose: 2, from: ["Arcanismo", "Adestrar Animais", "Intuição", "Medicina", "Natureza", "Percepção", "Religião", "Sobrevivência"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Escudo", "Cimitarra", "Armadura de Couro", "Kit de Explorador", "Foco Druídico"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 50 },
    ],
    spellcasting: {
      ability: "Sabedoria",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 2, 4: 3, 10: 4 },
      spellsPreparedFormula: "mod. Sabedoria + nível de Druida (mín. 1)",
      spellSlotsByLevel: FULL_CASTER_SLOTS,
    },
    subclassLevel: 2,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Conjuração", description: "Sabedoria é seu atributo de conjuração." },
        { name: "Druídico", description: "Idioma secreto dos druidas." },
      ]},
      { level: 2, features: [{ name: "Forma Selvagem", description: "Transforme-se em uma besta que já tenha visto. 2 usos/descanso curto." }] },
      { level: 18, features: [{ name: "Corpo Atemporal", description: "Não sofre efeitos do envelhecimento." }] },
      { level: 20, features: [{ name: "Arquidruida", description: "Use Forma Selvagem ilimitadamente. Ignore componentes V, S, M de magias druídicas." }] },
    ],
    subclasses: [
      {
        id: "circuloTerra",
        name: "Círculo da Terra",
        description: "Druidas conectados com a magia dos terrenos naturais.",
        featuresByLevel: [
          { level: 2, features: [
            { name: "Truque Bônus", description: "Ganhe 1 truque de druida adicional." },
            { name: "Recuperação Natural", description: "Recupere slots durante descanso curto (total ≤ metade do nível)." },
          ]},
          { level: 3, features: [{ name: "Magias do Círculo", description: "Ganhe magias baseadas no terreno escolhido." }] },
          { level: 6, features: [{ name: "Passagem pela Terra", description: "Terreno difícil não-mágico não custa deslocamento extra." }] },
          { level: 10, features: [{ name: "Proteção da Natureza", description: "Imunidade a veneno e doença, não pode ser encantado por fadas ou elementais." }] },
          { level: 14, features: [{ name: "Santuário Natural", description: "Bestas e plantas hesitam em atacar você." }] },
        ],
      },
      {
        id: "circuloLua",
        name: "Círculo da Lua",
        description: "Druidas que dominam formas selvagens poderosas.",
        featuresByLevel: [
          { level: 2, features: [
            { name: "Forma Selvagem em Combate", description: "Use ação bônus para Forma Selvagem. ND máximo mais alto." },
            { name: "Forma de Desafio", description: "ND máximo = 1." },
          ]},
          { level: 6, features: [{ name: "Ataques Primitivos", description: "Ataques em Forma Selvagem contam como mágicos." }] },
          { level: 10, features: [{ name: "Forma Elemental", description: "Gaste 2 usos de Forma Selvagem para virar um elemental." }] },
          { level: 14, features: [{ name: "Milhares de Formas", description: "Gaste slots para recuperar PV em Forma Selvagem." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 6. FEITICEIRO
  // ══════════════════════════════════════════
  {
    id: "feiticeiro",
    name: "Feiticeiro",
    description: "Um conjurador nato cujo poder emana de uma linhagem mágica inata.",
    primaryAbility: ["Carisma"],
    hitDie: 6,
    savingThrows: ["Constituição", "Carisma"],
    proficiencies: {
      armor: [],
      weapons: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas Leves"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Arcanismo", "Enganação", "Intuição", "Intimidação", "Persuasão", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Besta Leve", "Bolsa de Componentes", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 50 },
    ],
    spellcasting: {
      ability: "Carisma",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 4, 4: 5, 10: 6 },
      spellsPreparedFormula: "mod. Carisma + nível de Feiticeiro (mín. 1)",
      spellSlotsByLevel: FULL_CASTER_SLOTS,
    },
    subclassLevel: 1,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Conjuração", description: "Carisma é seu atributo de conjuração." },
        { name: "Origem Sobrenatural", description: "Escolha sua Origem de Feitiçaria (subclasse)." },
      ]},
      { level: 2, features: [
        { name: "Pontos de Feitiçaria", description: "Pontos = nível de Feiticeiro. Use para criar slots ou alimentar Metamagias." },
        { name: "Fonte de Magia", description: "Converta slots em Pontos de Feitiçaria e vice-versa." },
      ]},
      { level: 3, features: [{ name: "Metamagia", description: "Escolha 2 opções de Metamagia para modificar suas magias." }] },
      { level: 20, features: [{ name: "Restauração de Feitiçaria", description: "Recupere 4 Pontos de Feitiçaria em descanso curto." }] },
    ],
    subclasses: [
      {
        id: "linhagemDraconica",
        name: "Linhagem Dracônica",
        description: "Magia ancestral de dragões corre em suas veias.",
        featuresByLevel: [
          { level: 1, features: [
            { name: "Ancestral Dracônico", description: "Escolha um tipo de dragão. PV máx +1/nível de Feiticeiro." },
            { name: "Resiliência Dracônica", description: "Sem armadura, CA = 13 + mod. DES." },
          ]},
          { level: 6, features: [{ name: "Afinidade Elemental", description: "Adicione mod. CAR ao dano de magias do tipo elemental do dragão." }] },
          { level: 14, features: [{ name: "Asas de Dragão", description: "Ação bônus para manifestar asas. Voo = seu deslocamento." }] },
          { level: 18, features: [{ name: "Presença Dracônica", description: "Gaste 5 Pontos para amedrontar ou encantar criaturas num raio de 18m." }] },
        ],
      },
      {
        id: "magiaSelvagem",
        name: "Magia Selvagem",
        description: "Sua magia é imprevisível e caótica.",
        featuresByLevel: [
          { level: 1, features: [
            { name: "Surto de Magia Selvagem", description: "Após conjurar magia de 1º+ nível, role d20. Em 1, role na tabela de Magia Selvagem." },
            { name: "Maré do Caos", description: "Manipule as forças do acaso. Vantagem em 1 teste, ataque ou TR." },
          ]},
          { level: 6, features: [{ name: "Sorte Flexível", description: "Gaste 2 Pontos de Feitiçaria para rolar 1d4 e somar/subtrair de teste de alguém." }] },
          { level: 14, features: [{ name: "Caos Controlado", description: "Role 2 vezes na tabela de Magia Selvagem, escolha qual efeito." }] },
          { level: 18, features: [{ name: "Bombardeio de Magias", description: "Ao rolar dano com magia, pode rolar novamente dados iguais." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 7. GUERREIRO
  // ══════════════════════════════════════════
  {
    id: "guerreiro",
    name: "Guerreiro",
    description: "Um mestre de combate marcial, treinado com todas as armas e armaduras.",
    primaryAbility: ["Força", "Destreza"],
    hitDie: 10,
    savingThrows: ["Força", "Constituição"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Armaduras Pesadas", "Escudos"],
      weapons: ["Armas Simples", "Armas Marciais"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Acrobacia", "Adestrar Animais", "Atletismo", "História", "Intimidação", "Intuição", "Percepção", "Sobrevivência"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Cota de Malha", "Espada Longa", "Escudo", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 175 },
    ],
    spellcasting: null,
    subclassLevel: 3,
    asiLevels: [4, 6, 8, 12, 14, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Estilo de Luta", description: "Escolha um estilo: Defesa, Duelismo, Combate com Arma Grande, Proteção, etc." },
        { name: "Retomar Fôlego", description: "Ação bônus para recuperar 1d10 + nível de Guerreiro PV. 1/descanso curto." },
      ]},
      { level: 2, features: [{ name: "Surto de Ação", description: "1/descanso curto, ganhe 1 ação adicional no turno." }] },
      { level: 3, features: [{ name: "Subclasse", description: "Escolha seu Arquétipo Marcial." }] },
      { level: 5, features: [{ name: "Ataque Extra", description: "Ataque 2 vezes ao usar Atacar." }] },
      { level: 9, features: [{ name: "Indômito", description: "Pode rerolar 1 TR com falha. 1/descanso longo." }] },
      { level: 11, features: [{ name: "Ataque Extra (2)", description: "Ataque 3 vezes ao usar Atacar." }] },
      { level: 17, features: [{ name: "Surto de Ação (2)", description: "2 usos de Surto de Ação entre descansos curtos." }] },
      { level: 20, features: [{ name: "Ataque Extra (3)", description: "Ataque 4 vezes ao usar Atacar." }] },
    ],
    subclasses: [
      {
        id: "campeao",
        name: "Campeão",
        description: "Guerreiro focado em acertos críticos e proezas físicas.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Crítico Aprimorado", description: "Acerto crítico em 19 ou 20." }] },
          { level: 7, features: [{ name: "Atleta Notável", description: "Adicione metade do prof. a testes de FOR, DES ou CON não proficientes." }] },
          { level: 10, features: [{ name: "Estilo de Luta Adicional", description: "Escolha um segundo Estilo de Luta." }] },
          { level: 15, features: [{ name: "Crítico Superior", description: "Acerto crítico em 18, 19 ou 20." }] },
          { level: 18, features: [{ name: "Sobrevivente", description: "No início de cada turno, recupere 5 + mod. CON PV se tiver ≤ metade do máximo." }] },
        ],
      },
      {
        id: "cavaleiroMistico",
        name: "Cavaleiro Místico",
        description: "Guerreiro que mistura magia arcana com combate marcial.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Conjuração", description: "Aprenda truques e magias de mago (Abjuração e Evocação). INT é seu atributo." }] },
          { level: 7, features: [{ name: "Magia de Guerra", description: "Ao conjurar truque, faça 1 ataque com arma como ação bônus." }] },
          { level: 10, features: [{ name: "Golpe Místico", description: "Ao acertar, pode gastar slot para causar 2d6 de dano de força (+ 1d6/nível do slot)." }] },
          { level: 15, features: [{ name: "Investida Arcana", description: "Teleporte 9m antes de atacar ao usar Surto de Ação." }] },
          { level: 18, features: [{ name: "Magia de Guerra Aprimorada", description: "Ao conjurar magia, faça 1 ataque com arma como ação bônus." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 8. LADINO
  // ══════════════════════════════════════════
  {
    id: "ladino",
    name: "Ladino",
    description: "Um especialista em furtividade, habilidades e ataques precisos.",
    primaryAbility: ["Destreza"],
    hitDie: 8,
    savingThrows: ["Destreza", "Inteligência"],
    proficiencies: {
      armor: ["Armaduras Leves"],
      weapons: ["Armas Simples", "Bestas de Mão", "Espadas Longas", "Rapieiras", "Espadas Curtas"],
      tools: ["Ferramentas de Ladrão"],
      languages: [],
    },
    skillChoices: { choose: 4, from: ["Acrobacia", "Atletismo", "Atuação", "Enganação", "Furtividade", "Intimidação", "Intuição", "Investigação", "Percepção", "Persuasão", "Prestidigitação"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Rapieira", "Armadura de Couro", "Ferramentas de Ladrão", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 110 },
    ],
    spellcasting: null,
    subclassLevel: 3,
    asiLevels: [4, 8, 10, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Especialização", description: "Escolha 2 proficiências em perícias ou ferramentas para dobrar o bônus de proficiência." },
        { name: "Ataque Furtivo", description: "1/turno, +1d6 de dano extra com arma de finesse/à distância se tiver vantagem ou aliado adjacente." },
        { name: "Gíria de Ladrão", description: "Linguagem secreta dos ladinos." },
      ]},
      { level: 2, features: [{ name: "Ação Ardilosa", description: "Ação bônus para Disparada, Desengajar ou Esconder." }] },
      { level: 3, features: [{ name: "Subclasse", description: "Escolha seu Arquétipo de Ladino." }] },
      { level: 5, features: [{ name: "Esquiva Sobrenatural", description: "Reação: reduza dano de ataque pela metade." }] },
      { level: 7, features: [{ name: "Evasão", description: "Sucesso em TR de DES: sem dano. Falha: metade do dano." }] },
      { level: 11, features: [{ name: "Talento Confiável", description: "Mínimo de 10 em testes de perícia com proficiência." }] },
      { level: 14, features: [{ name: "Sentido Cego", description: "Perceba criaturas invisíveis a 3m." }] },
      { level: 15, features: [{ name: "Mente Escorregadia", description: "Proficiência em TR de SAB." }] },
      { level: 18, features: [{ name: "Elusivo", description: "Nenhum ataque tem vantagem contra você se não estiver incapacitado." }] },
      { level: 20, features: [{ name: "Golpe de Sorte", description: "Se errar um ataque, pode transformar em acerto. 1/descanso curto." }] },
    ],
    subclasses: [
      {
        id: "ladrao",
        name: "Ladrão",
        description: "Especialista em furtos, infiltração e escalada.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Mãos Rápidas", description: "Use Ação Ardilosa para fazer teste de Prestidigitação, desarmar armadilha ou abrir fechadura." },
            { name: "Pés Silenciosos", description: "Escalar não custa deslocamento extra. Salto em distância +DES mod em metros." },
          ]},
          { level: 9, features: [{ name: "Furtividade Suprema", description: "Vantagem em Furtividade se mover-se no máximo metade do deslocamento." }] },
          { level: 13, features: [{ name: "Usar Dispositivo Mágico", description: "Ignore requisitos de classe, raça e nível para usar itens mágicos." }] },
          { level: 17, features: [{ name: "Reflexos de Ladrão", description: "Dois turnos na primeira rodada de combate." }] },
        ],
      },
      {
        id: "assassino",
        name: "Assassino",
        description: "Especialista em infiltração e eliminação furtiva.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Proficiências Bônus", description: "Kit de disfarce e kit de envenenador." },
            { name: "Assassinato", description: "Vantagem contra criaturas que não agiram. Acerto em surpreso = crítico." },
          ]},
          { level: 9, features: [{ name: "Especialista em Infiltração", description: "Crie identidade falsa com 25 PO e 7 dias." }] },
          { level: 13, features: [{ name: "Impostor", description: "Copie fala e comportamento de outra pessoa após 3 horas de estudo." }] },
          { level: 17, features: [{ name: "Golpe Mortal", description: "Ao acertar criatura surpresa, ela faz TR de CON CD 8+DES+prof. Falha: dano dobrado." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 9. MAGO
  // ══════════════════════════════════════════
  {
    id: "mago",
    name: "Mago",
    description: "Um estudioso da magia arcana que manipula a realidade com fórmulas e estudo.",
    primaryAbility: ["Inteligência"],
    hitDie: 6,
    savingThrows: ["Inteligência", "Sabedoria"],
    proficiencies: {
      armor: [],
      weapons: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas Leves"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Arcanismo", "História", "Intuição", "Investigação", "Medicina", "Natureza", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Bordão", "Grimório", "Bolsa de Componentes", "Mochila de Estudioso"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 55 },
    ],
    spellcasting: {
      ability: "Inteligência",
      type: "prepared",
      cantripsKnownAtLevel: { 1: 3, 4: 4, 10: 5 },
      spellsPreparedFormula: "mod. Inteligência + nível de Mago (mín. 1)",
      spellSlotsByLevel: FULL_CASTER_SLOTS,
    },
    subclassLevel: 2,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Conjuração", description: "Inteligência é seu atributo de conjuração." },
        { name: "Recuperação Arcana", description: "1/dia em descanso curto, recupere slots cujo total ≤ metade do nível." },
      ]},
      { level: 2, features: [{ name: "Tradição Arcana", description: "Escolha sua escola de magia (subclasse)." }] },
      { level: 18, features: [{ name: "Domínio de Magia", description: "Escolha 1 magia de 1º e 1 de 2º nível para conjurar à vontade." }] },
      { level: 20, features: [{ name: "Magias Marcantes", description: "Escolha 2 magias de 3º nível para ter sempre preparadas." }] },
    ],
    subclasses: [
      {
        id: "escolaEvocacao",
        name: "Escola de Evocação",
        description: "Especialista em magias de dano em área.",
        featuresByLevel: [
          { level: 2, features: [
            { name: "Esculpir Magias", description: "Proteja aliados do efeito de magias de evocação." },
            { name: "Sábio de Evocação", description: "Copiar magias de evocação custa metade do tempo e ouro." },
          ]},
          { level: 6, features: [{ name: "Truque Potente", description: "Adicione mod. INT ao dano de truques de evocação." }] },
          { level: 10, features: [{ name: "Evocação Empoderada", description: "Escolha INT mod criaturas para automaticamente passar em TRs de suas magias de evocação." }] },
          { level: 14, features: [{ name: "Sobrecarga", description: "Maximize o dano de 1 magia de evocação de 5º- nível. 1/descanso curto." }] },
        ],
      },
      {
        id: "escolaAbjuracao",
        name: "Escola de Abjuração",
        description: "Mestre em magias de proteção e banimento.",
        featuresByLevel: [
          { level: 2, features: [
            { name: "Proteção Arcana", description: "Ao conjurar abjuração, crie escudo que absorve dano = 2× nível do Mago + mod. INT." },
            { name: "Sábio de Abjuração", description: "Copiar magias de abjuração custa metade do tempo e ouro." },
          ]},
          { level: 6, features: [{ name: "Proteção Projetada", description: "O escudo arcano pode proteger aliados a 9m." }] },
          { level: 10, features: [{ name: "Contra-Magia Aprimorada", description: "+prof. a testes de Dissipar Magia e Contramagia." }] },
          { level: 14, features: [{ name: "Resistência Mágica", description: "Resistência a dano de magias. Vantagem em TRs contra magias." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 10. MONGE
  // ══════════════════════════════════════════
  {
    id: "monge",
    name: "Monge",
    description: "Um artista marcial que canaliza o poder do ki para feitos sobre-humanos.",
    primaryAbility: ["Destreza", "Sabedoria"],
    hitDie: 8,
    savingThrows: ["Força", "Destreza"],
    proficiencies: {
      armor: [],
      weapons: ["Armas Simples", "Espadas Curtas"],
      tools: ["Uma ferramenta de artesão ou instrumento musical"],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Acrobacia", "Atletismo", "Furtividade", "História", "Intuição", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Espada Curta", "Kit de Explorador"], gold: 5 },
      { id: "B", label: "Escolha B", items: [], gold: 25 },
    ],
    spellcasting: null,
    subclassLevel: 3,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Defesa sem Armadura", description: "Sem armadura, CA = 10 + mod. DES + mod. SAB." },
        { name: "Artes Marciais", description: "Use DES em ataques com armas de monge. Dado de dano = 1d4 (sobe com nível). Ataque bônus desarmado." },
      ]},
      { level: 2, features: [
        { name: "Ki", description: "Pontos de Ki = nível de Monge. Rajada de Golpes, Passo do Vento, Defesa Paciente." },
        { name: "Movimento sem Armadura", description: "+3m de deslocamento sem armadura." },
      ]},
      { level: 3, features: [{ name: "Subclasse", description: "Escolha sua Tradição Monástica." }] },
      { level: 4, features: [{ name: "Queda Lenta", description: "Use reação para reduzir dano de queda em 5× nível de Monge." }] },
      { level: 5, features: [
        { name: "Ataque Extra", description: "Ataque 2 vezes ao usar Atacar." },
        { name: "Ataque Atordoante", description: "Ao acertar, gaste 1 Ki. Alvo faz TR de CON ou fica atordoado." },
      ]},
      { level: 7, features: [
        { name: "Evasão", description: "Sucesso em TR de DES: sem dano. Falha: metade." },
        { name: "Mente Tranquila", description: "Use ação para encerrar efeitos de encantamento ou medo em si." },
      ]},
      { level: 10, features: [{ name: "Pureza do Corpo", description: "Imunidade a doenças e venenos." }] },
      { level: 13, features: [{ name: "Língua do Sol e da Lua", description: "Compreenda e fale todos os idiomas." }] },
      { level: 14, features: [{ name: "Alma de Diamante", description: "Proficiência em todos os TRs. Gaste 1 Ki para rerolar TR com falha." }] },
      { level: 15, features: [{ name: "Corpo Atemporal", description: "Não precisa de comida ou água, não envelhece." }] },
      { level: 18, features: [{ name: "Corpo Vazio", description: "Gaste 4 Ki para ficar invisível 1 minuto." }] },
      { level: 20, features: [{ name: "Auto-Perfeição", description: "Ao rolar Iniciativa sem Ki, recupere 4 pontos." }] },
    ],
    subclasses: [
      {
        id: "caminhoMaoAberta",
        name: "Caminho da Mão Aberta",
        description: "Mestre supremo das artes marciais corpo a corpo.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Técnica da Mão Aberta", description: "Ao usar Rajada de Golpes, pode derrubar, empurrar ou impedir reações do alvo." }] },
          { level: 6, features: [{ name: "Integridade do Corpo", description: "Use ação para recuperar 3× nível de Monge PV. 1/descanso longo." }] },
          { level: 11, features: [{ name: "Tranquilidade", description: "No fim de descanso longo, ganhe efeito de Santuário até próximo descanso." }] },
          { level: 17, features: [{ name: "Palma Trêmula", description: "Ao acertar, implante vibrações. Pode usar ação para causar 10d10 necrótico." }] },
        ],
      },
      {
        id: "caminhoSombra",
        name: "Caminho da Sombra",
        description: "Monge que manipula sombras e escuridão.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Artes das Sombras", description: "Gaste 2 Ki para conjurar Escuridão, Passos sem Rastro, Silêncio ou similar." }] },
          { level: 6, features: [{ name: "Passo das Sombras", description: "Teleporte de sombra para sombra a 18m como ação bônus em penumbra/escuridão." }] },
          { level: 11, features: [{ name: "Manto de Sombras", description: "Fique invisível em penumbra/escuridão sem usar Ki." }] },
          { level: 17, features: [{ name: "Oportunista", description: "Ao aliado acertar criatura a 1,5m de você, pode usar reação para atacar." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 11. PALADINO
  // ══════════════════════════════════════════
  {
    id: "paladino",
    name: "Paladino",
    description: "Um guerreiro sagrado vinculado a um juramento divino.",
    primaryAbility: ["Força", "Carisma"],
    hitDie: 10,
    savingThrows: ["Sabedoria", "Carisma"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Armaduras Pesadas", "Escudos"],
      weapons: ["Armas Simples", "Armas Marciais"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 2, from: ["Atletismo", "Intimidação", "Intuição", "Medicina", "Persuasão", "Religião"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Espada Longa", "Escudo", "Cota de Malha", "Símbolo Sagrado", "Kit de Explorador"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 150 },
    ],
    spellcasting: {
      ability: "Carisma",
      type: "prepared",
      cantripsKnownAtLevel: {},
      spellsPreparedFormula: "mod. Carisma + metade do nível de Paladino (mín. 1)",
      spellSlotsByLevel: HALF_CASTER_SLOTS,
    },
    subclassLevel: 3,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Sentido Divino", description: "Detecte celestiais, infernais e mortos-vivos num raio de 18m." },
        { name: "Cura pelas Mãos", description: "Pool de cura = 5× nível de Paladino." },
      ]},
      { level: 2, features: [
        { name: "Conjuração", description: "Carisma é seu atributo. Prepare magias após descanso longo." },
        { name: "Estilo de Luta", description: "Escolha um Estilo de Luta." },
        { name: "Destruição Divina", description: "Ao acertar, gaste slot para +2d8 radiante (+1d8/nível do slot)." },
      ]},
      { level: 3, features: [{ name: "Juramento Sagrado", description: "Escolha seu juramento (subclasse)." }] },
      { level: 5, features: [{ name: "Ataque Extra", description: "Ataque 2 vezes ao usar Atacar." }] },
      { level: 6, features: [{ name: "Aura de Proteção", description: "Você e aliados a 3m ganham +mod. CAR em TRs." }] },
      { level: 10, features: [{ name: "Aura de Coragem", description: "Você e aliados a 3m não podem ser amedrontados." }] },
      { level: 14, features: [{ name: "Toque Purificador", description: "Use Cura pelas Mãos para remover doenças e venenos." }] },
      { level: 18, features: [{ name: "Aura Expandida", description: "Suas auras aumentam para 9m." }] },
      { level: 20, features: [{ name: "Forma Sagrada", description: "Ative forma sagrada 1/descanso longo. Benefícios baseados no juramento." }] },
    ],
    subclasses: [
      {
        id: "juramentoDevocao",
        name: "Juramento de Devoção",
        description: "O arquétipo do cavaleiro santo, dedicado à justiça e virtude.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Canalizar Divindade: Arma Sagrada", description: "+mod. CAR ao ataque por 1 minuto. Arma emite luz." },
            { name: "Canalizar Divindade: Expulsar Profano", description: "Celestiais e infernais fazem TR de SAB ou são expulsos." },
          ]},
          { level: 7, features: [{ name: "Aura de Devoção", description: "Você e aliados a 3m não podem ser encantados." }] },
          { level: 15, features: [{ name: "Pureza de Espírito", description: "Efeito permanente de Proteção contra o Bem e o Mal." }] },
          { level: 20, features: [{ name: "Nimbo Sagrado", description: "Emita aura de luz solar. +10 dano radiante. Magias de cura +max." }] },
        ],
      },
      {
        id: "juramentoVinganca",
        name: "Juramento de Vingança",
        description: "Paladino implacável focado em destruir inimigos jurados.",
        featuresByLevel: [
          { level: 3, features: [
            { name: "Canalizar Divindade: Voto de Inimizade", description: "Ação bônus: vantagem em ataques contra 1 criatura por 1 minuto." },
            { name: "Canalizar Divindade: Abjurar Inimigo", description: "Criatura faz TR de SAB ou fica amedrontada e imobilizada." },
          ]},
          { level: 7, features: [{ name: "Investida Implacável", description: "Ao derrubar inimigo jurado a 0 PV, mova-se e ataque outro como ação bônus." }] },
          { level: 15, features: [{ name: "Alma de Vingança", description: "Ao alvo de Voto acertar você, use reação para atacar." }] },
          { level: 20, features: [{ name: "Anjo Vingador", description: "Asas de voo + aura de medo de 9m." }] },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════
  // 12. GUARDIÃO
  // ══════════════════════════════════════════
  {
    id: "guardiao",
    name: "Guardião",
    description: "Um protetor da fronteira que patrulha as terras selvagens com maestria marcial e magia natural.",
    primaryAbility: ["Destreza", "Sabedoria"],
    hitDie: 10,
    savingThrows: ["Força", "Destreza"],
    proficiencies: {
      armor: ["Armaduras Leves", "Armaduras Médias", "Escudos"],
      weapons: ["Armas Simples", "Armas Marciais"],
      tools: [],
      languages: [],
    },
    skillChoices: { choose: 3, from: ["Adestrar Animais", "Atletismo", "Furtividade", "Intuição", "Investigação", "Natureza", "Percepção", "Sobrevivência"] },
    equipmentChoices: [
      { id: "A", label: "Escolha A", items: ["Espada Longa", "Armadura de Couro Batido", "Kit de Explorador", "Arco Longo"], gold: 10 },
      { id: "B", label: "Escolha B", items: [], gold: 150 },
    ],
    spellcasting: {
      ability: "Sabedoria",
      type: "prepared",
      cantripsKnownAtLevel: {},
      spellsPreparedFormula: "mod. Sabedoria + metade do nível de Guardião (mín. 1)",
      spellSlotsByLevel: HALF_CASTER_SLOTS,
    },
    subclassLevel: 3,
    asiLevels: [4, 8, 12, 16, 19],
    featuresByLevel: [
      { level: 1, features: [
        { name: "Inimigo Favorito", description: "Vantagem em rastreamento e testes de INT sobre 1 tipo de criatura." },
        { name: "Explorador Natural", description: "Escolha 1 tipo de terreno. Benefícios de viagem e forageamento." },
      ]},
      { level: 2, features: [
        { name: "Conjuração", description: "Sabedoria é seu atributo de conjuração." },
        { name: "Estilo de Luta", description: "Escolha um Estilo de Luta." },
      ]},
      { level: 3, features: [
        { name: "Subclasse", description: "Escolha seu Arquétipo de Guardião." },
        { name: "Consciência Primitiva", description: "Gaste slot para detectar criaturas de certos tipos num raio de 1,5km." },
      ]},
      { level: 5, features: [{ name: "Ataque Extra", description: "Ataque 2 vezes ao usar Atacar." }] },
      { level: 8, features: [{ name: "Passada Natural", description: "Terreno difícil não-mágico não custa deslocamento extra." }] },
      { level: 10, features: [{ name: "Esconder-se na Natureza", description: "Gaste 1 minuto para ficar invisível contra visão natural." }] },
      { level: 14, features: [{ name: "Desaparecer", description: "Use Esconder como ação bônus. Não pode ser rastreado por meios não-mágicos." }] },
      { level: 18, features: [{ name: "Sentidos Selvagens", description: "Perceba criaturas a 9m mesmo invisíveis." }] },
      { level: 20, features: [{ name: "Matador de Inimigos", description: "+mod. SAB ao dano contra Inimigo Favorito. 1/turno." }] },
    ],
    subclasses: [
      {
        id: "cacador",
        name: "Caçador",
        description: "Especialista em derrubar presas perigosas.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Presa do Caçador", description: "Escolha: dano extra contra criatura com PV cheio, ou contra múltiplos alvos." }] },
          { level: 7, features: [{ name: "Táticas Defensivas", description: "Escolha: desvantagem contra ataques de oportunidade, +4 CA contra multiataques, etc." }] },
          { level: 11, features: [{ name: "Multiateque", description: "Escolha: ataque em área ou ataque extra contra alvos diferentes." }] },
          { level: 15, features: [{ name: "Defesa Superior do Caçador", description: "Escolha: evasão, posição defensiva ou ataque de reação." }] },
        ],
      },
      {
        id: "mestreDasBestas",
        name: "Mestre das Bestas",
        description: "Guardião com um companheiro animal fiel.",
        featuresByLevel: [
          { level: 3, features: [{ name: "Companheiro do Guardião", description: "Ganhe um companheiro animal que obedece seus comandos." }] },
          { level: 7, features: [{ name: "Treinamento Excepcional", description: "Companheiro pode Esquivar, Disparada ou Ajudar como ação bônus." }] },
          { level: 11, features: [{ name: "Fúria Bestial", description: "Companheiro pode fazer 2 ataques ao usar Atacar." }] },
          { level: 15, features: [{ name: "Compartilhar Magias", description: "Ao conjurar magia em si, o companheiro também é afetado." }] },
        ],
      },
    ],
  },
];

/** Lookup map for classes */
export const classesById: Record<string, ClassData> = Object.fromEntries(
  classes.map((c) => [c.id, c])
);
