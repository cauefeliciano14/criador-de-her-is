import type { AbilityKey } from "@/utils/calculations";

export interface FeatPrerequisite {
  type: "level" | "ability" | "class" | "spellcasting";
  min?: number;
  ability?: AbilityKey;
  ids?: string[];
  required?: boolean;
}

export interface FeatEffects {
  abilityIncrease?: {
    mode: "plus2orPlus1Plus1" | "plus1" | "choose1";
    abilities?: AbilityKey[];
    maxScore: number;
  };
  proficiencies?: {
    armor?: string[];
    weapons?: string[];
    tools?: string[];
    languages?: string[];
  };
  spellsGranted?: string[];
  featuresText?: { name: string; description: string }[];
  flags?: Record<string, number | boolean>;
}

export interface FeatData {
  id: string;
  name: string;
  description: string;
  type: "asi" | "general" | "origin" | "epic";
  prerequisites: FeatPrerequisite[];
  effects: FeatEffects;
  source?: { book: string; page: number };
}

export const feats: FeatData[] = [
  {
    id: "aumentoAtributo",
    name: "Aumento no Valor de Atributo",
    description:
      "Aumente um valor de atributo em 2 ou dois valores de atributos diferentes em 1 cada. Nenhum atributo pode ultrapassar 20 com este aumento.",
    type: "asi",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus2orPlus1Plus1",
        maxScore: 20,
      },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "alerta",
    name: "Alerta",
    description:
      "Você ganha +5 de bônus em Iniciativa. Não pode ser surpreendido enquanto estiver consciente. Outras criaturas não ganham vantagem em jogadas de ataque contra você por estarem ocultas.",
    type: "origin",
    prerequisites: [],
    effects: {
      flags: { initiativeBonus: 5, cantBeSurprised: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "atleta",
    name: "Atleta",
    description:
      "Aumente um valor de Força ou Destreza em 1 (máximo 20). Levantar-se de estar caído usa apenas 1,5m de deslocamento. Escalar não custa deslocamento extra. Saltos com corrida exigem apenas 1,5m de impulso.",
    type: "origin",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "choose1",
        abilities: ["str", "dex"],
        maxScore: 20,
      },
      flags: { standUpCost: 1.5 },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "ator",
    name: "Ator",
    description:
      "Aumente seu Carisma em 1 (máximo 20). Vantagem em testes de Enganação e Atuação ao se passar por outra pessoa. Pode imitar a fala ou sons de outra criatura que tenha ouvido por pelo menos 1 minuto.",
    type: "origin",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus1",
        abilities: ["cha"],
        maxScore: 20,
      },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "combate-com-armas-grandes",
    name: "Combate com Armas Grandes",
    description:
      "Ao obter 1 ou 2 em um dado de dano com uma arma corpo a corpo de duas mãos ou versátil, pode rolar novamente e usar o novo resultado.",
    type: "origin",
    prerequisites: [],
    effects: {
      flags: { gwfReroll: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "constituicao-resistente",
    name: "Constituição Resistente",
    description:
      "Aumente sua Constituição em 1 (máximo 20). Vantagem em testes de resistência de Constituição para manter concentração em magias.",
    type: "general",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus1",
        abilities: ["con"],
        maxScore: 20,
      },
      flags: { concentrationAdvantage: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "duro-de-matar",
    name: "Duro de Matar",
    description:
      "Aumente sua Constituição em 1 (máximo 20). Quando rolar dados de vida para recuperar PV durante descanso curto, o mínimo que pode recuperar é igual ao dobro do seu mod. Constituição (mínimo 2).",
    type: "general",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus1",
        abilities: ["con"],
        maxScore: 20,
      },
      flags: { toughMinHitDice: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "esquiva",
    name: "Esquiva",
    description:
      "Aumente sua Destreza em 1 (máximo 20). Quando uma criatura que você pode ver ataca você, pode usar sua reação para impor desvantagem na jogada de ataque.",
    type: "general",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus1",
        abilities: ["dex"],
        maxScore: 20,
      },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "inspirador",
    name: "Inspirador",
    description:
      "Aumente seu Carisma em 1 (máximo 20). Quando terminar um descanso longo, pode escolher até 6 criaturas amigas num raio de 9m. Cada uma ganha PV temporários iguais ao seu nível + mod. Carisma.",
    type: "origin",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "plus1",
        abilities: ["cha"],
        maxScore: 20,
      },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "iniciado-em-magia",
    name: "Iniciado em Magia",
    description:
      "Escolha uma classe: Bardo, Clérigo, Druida, Feiticeiro, Bruxo ou Mago. Aprenda 2 truques e 1 magia de 1º nível dessa lista. Pode conjurar essa magia 1/dia sem gastar espaço.",
    type: "origin",
    prerequisites: [],
    effects: {
      spellsGranted: [],
      flags: { magicInitiate: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "observador",
    name: "Observador",
    description:
      "Aumente Inteligência ou Sabedoria em 1 (máximo 20). +5 em Percepção passiva e Investigação passiva. Pode ler lábios se puder ver a boca da criatura e compreender o idioma.",
    type: "origin",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "choose1",
        abilities: ["int", "wis"],
        maxScore: 20,
      },
      flags: { passivePerceptionBonus: 5, passiveInvestigationBonus: 5 },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "sentinela",
    name: "Sentinela",
    description:
      "Quando uma criatura ao seu alcance ataca um alvo que não seja você, pode usar sua reação para fazer um ataque corpo a corpo contra ela. Criaturas provocam ataques de oportunidade mesmo se usarem Desengajar. Quando acerta um ataque de oportunidade, o deslocamento do alvo cai para 0.",
    type: "origin",
    prerequisites: [],
    effects: {
      flags: { sentinelReaction: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "sortudo",
    name: "Sortudo",
    description:
      "Você tem 3 pontos de sorte. Pode gastar um para rolar um d20 adicional em ataque, teste de habilidade ou resistência (usa o resultado que preferir). Recupera pontos após descanso longo.",
    type: "origin",
    prerequisites: [],
    effects: {
      flags: { luckPoints: 3 },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "curandeiro",
    name: "Curandeiro",
    description:
      "Você pode usar um kit de curandeiro para tratar ferimentos. Ao estabilizar uma criatura ou usar o kit, ela recupera 1d6+4+seu nível PV. Como ação, pode gastar um uso do kit para restaurar 2d6+mod. Sabedoria PV.",
    type: "origin",
    prerequisites: [],
    effects: {
      flags: { healerKit: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "mago-de-guerra",
    name: "Mago de Guerra",
    description:
      "Vantagem em testes de resistência de Constituição para manter concentração. Pode realizar componentes somáticos mesmo com armas ou escudo nas mãos. Aprenda 1 truque de mago.",
    type: "general",
    prerequisites: [{ type: "spellcasting", required: true }],
    effects: {
      flags: { warCaster: true, concentrationAdvantage: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "combatente-com-escudo",
    name: "Combatente com Escudo",
    description:
      "Enquanto empunha um escudo, se uma criatura falhar um ataque corpo a corpo contra você, pode usar sua reação para empurrá-la 1,5m. +2 de bônus em testes de resistência de Destreza se estiver usando um escudo.",
    type: "general",
    prerequisites: [],
    effects: {
      flags: { shieldMaster: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
  {
    id: "resistente",
    name: "Resistente",
    description:
      "Aumente um valor de atributo em 1 (máximo 20). Você ganha proficiência em testes de resistência desse atributo.",
    type: "general",
    prerequisites: [],
    effects: {
      abilityIncrease: {
        mode: "choose1",
        abilities: ["str", "dex", "con", "int", "wis", "cha"],
        maxScore: 20,
      },
      flags: { resilientSave: true },
    },
    source: { book: "PHB 2024", page: 0 },
  },
];

export const featsById: Record<string, FeatData> = {};
for (const f of feats) {
  featsById[f.id] = f;
}
