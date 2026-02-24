import type { AbilityKey } from "@/utils/calculations";

export interface OriginFeat {
  id: string;
  name: string;
  description: string;
}

export interface BackgroundAbilityBonuses {
  mode: "fixed" | "choose";
  fixed?: Partial<Record<AbilityKey, number>>;
  choose?: {
    choices: number;
    bonus: number;
    from: AbilityKey[];
    maxPerAbility: number;
  };
}

export interface Background {
  id: string;
  name: string;
  description: string;
  abilityBonuses: BackgroundAbilityBonuses;
  skills: string[];
  tools: string[];
  languages: string[];
  originFeat: OriginFeat;
  equipment: {
    items: string[];
    gold: number;
  };
}

export const backgrounds: Background[] = [
  {
    id: "acolito",
    name: "Acólito",
    description:
      "Você passou a vida nos templos, estudando a tradição de sua fé e realizando ritos sagrados. Sua conexão com o divino é profunda.",
    abilityBonuses: {
      mode: "choose",
      choose: {
        choices: 2,
        bonus: 1,
        from: ["str", "dex", "con", "int", "wis", "cha"],
        maxPerAbility: 1,
      },
    },
    skills: ["Intuição", "Religião"],
    tools: ["Kit de Herbalismo"],
    languages: ["Comum", "Celestial"],
    originFeat: {
      id: "curandeiro",
      name: "Curandeiro",
      description:
        "Você pode usar um kit de curandeiro para tratar ferimentos. Ao estabilizar uma criatura ou usar o kit, ela recupera 1d6 + 4 + seu nível de PV. Além disso, como ação, pode gastar um uso do kit para restaurar 2d6 + mod. Sabedoria PV a uma criatura.",
    },
    equipment: {
      items: [
        "Livro de orações",
        "Símbolo sagrado",
        "5 varetas de incenso",
        "Vestimentas",
        "Kit de Herbalismo",
      ],
      gold: 15,
    },
  },
  {
    id: "soldado",
    name: "Soldado",
    description:
      "Você serviu em um exército ou milícia, treinando nas artes da guerra. Combate e disciplina militar definiram seus anos de formação.",
    abilityBonuses: {
      mode: "fixed",
      fixed: { str: 1, con: 1 },
    },
    skills: ["Atletismo", "Intimidação"],
    tools: ["Um tipo de jogo", "Veículos terrestres"],
    languages: [],
    originFeat: {
      id: "sentinela",
      name: "Sentinela",
      description:
        "Quando uma criatura ao seu alcance ataca um alvo que não seja você, pode usar sua reação para fazer um ataque corpo a corpo contra ela. Criaturas provocam ataques de oportunidade mesmo se usarem Desengajar. Quando acerta um ataque de oportunidade, o deslocamento do alvo cai para 0.",
    },
    equipment: {
      items: [
        "Insígnia de patente",
        "Troféu de um inimigo caído",
        "Conjunto de dados de osso",
        "Roupas comuns",
      ],
      gold: 10,
    },
  },
];
