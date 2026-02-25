export interface FeatData {
  id: string;
  name: string;
  description: string;
  type: "origin" | "general" | "epic";
  prerequisites?: string;
}

export const feats: FeatData[] = [
  {
    id: "alerta",
    name: "Alerta",
    description:
      "Você ganha +5 de bônus em Iniciativa. Não pode ser surpreendido enquanto estiver consciente. Outras criaturas não ganham vantagem em jogadas de ataque contra você por estarem ocultas.",
    type: "general",
  },
  {
    id: "atleta",
    name: "Atleta",
    description:
      "Aumente um valor de Força ou Destreza em 1 (máximo 20). Levantar-se de estar caído usa apenas 1,5m de deslocamento. Escalar não custa deslocamento extra. Saltos com corrida exigem apenas 1,5m de impulso.",
    type: "general",
  },
  {
    id: "ator",
    name: "Ator",
    description:
      "Aumente seu Carisma em 1 (máximo 20). Vantagem em testes de Enganação e Atuação ao se passar por outra pessoa. Pode imitar a fala ou sons de outra criatura que tenha ouvido por pelo menos 1 minuto.",
    type: "general",
  },
  {
    id: "combate-com-armas-grandes",
    name: "Combate com Armas Grandes",
    description:
      "Ao obter 1 ou 2 em um dado de dano com uma arma corpo a corpo de duas mãos ou versátil, pode rolar novamente e usar o novo resultado.",
    type: "general",
  },
  {
    id: "constituicao-resistente",
    name: "Constituição Resistente",
    description:
      "Aumente sua Constituição em 1 (máximo 20). Vantagem em testes de resistência de Constituição para manter concentração em magias.",
    type: "general",
  },
  {
    id: "duro-de-matar",
    name: "Duro de Matar",
    description:
      "Aumente sua Constituição em 1 (máximo 20). Quando rolar dados de vida para recuperar PV durante descanso curto, o mínimo que pode recuperar é igual ao dobro do seu mod. Constituição (mínimo 2).",
    type: "general",
  },
  {
    id: "esquiva",
    name: "Esquiva",
    description:
      "Aumente sua Destreza em 1 (máximo 20). Quando uma criatura que você pode ver ataca você, pode usar sua reação para impor desvantagem na jogada de ataque.",
    type: "general",
  },
  {
    id: "inspirador",
    name: "Inspirador",
    description:
      "Aumente seu Carisma em 1 (máximo 20). Quando terminar um descanso longo, pode escolher até 6 criaturas amigas num raio de 9m. Cada uma ganha PV temporários iguais ao seu nível + mod. Carisma.",
    type: "general",
  },
  {
    id: "observador",
    name: "Observador",
    description:
      "Aumente Inteligência ou Sabedoria em 1 (máximo 20). +5 em Percepção passiva e Investigação passiva. Pode ler lábios se puder ver a boca da criatura e compreender o idioma.",
    type: "general",
  },
  {
    id: "sentinela",
    name: "Sentinela",
    description:
      "Quando uma criatura ao seu alcance ataca um alvo que não seja você, pode usar sua reação para fazer um ataque corpo a corpo contra ela. Criaturas provocam ataques de oportunidade mesmo se usarem Desengajar.",
    type: "general",
  },
  {
    id: "curandeiro",
    name: "Curandeiro",
    description:
      "Você pode usar um kit de curandeiro para restaurar PV. Como ação, gasta um uso para restaurar 1d6+4+nível PV a uma criatura.",
    type: "origin",
  },
  {
    id: "sortudo",
    name: "Sortudo",
    description:
      "Você tem 3 pontos de sorte. Pode gastar um para rolar um d20 adicional em ataque, teste de habilidade ou resistência (usa o resultado que preferir). Recupera pontos após descanso longo.",
    type: "general",
  },
];
