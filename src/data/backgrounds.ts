import type { AbilityKey } from "@/utils/calculations";

export interface OriginFeat {
  id: string;
  name: string;
  description: string;
  summary: string[];
  details: string;
}

export interface ToolGrant {
  mode: "fixed" | "choice";
  name?: string;
  options?: string[];
  choiceLabel?: string;
}

export interface StartingEquipmentOption {
  id: "A" | "B";
  label: string;
  items: string[];
  gold: number;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  abilityOptions: AbilityKey[];
  abilityScores: AbilityKey[];
  skills: string[];
  grantedSkills: string[];
  tools: string[];
  grantedTool: ToolGrant;
  languages: string[];
  originFeat: OriginFeat;
  equipmentChoices: StartingEquipmentOption[];
  equipment: { items: string[]; gold: number };
}

const mk = (
  id: string,
  name: string,
  abilityScores: AbilityKey[],
  grantedSkills: [string, string],
  grantedTool: ToolGrant,
  originFeat: OriginFeat,
  optionA: { items: string[]; gold: number }
): Background => ({
  id,
  name,
  description: `Antecedente ${name} do Livro do Jogador 2024.`,
  abilityOptions: abilityScores,
  abilityScores,
  skills: grantedSkills,
  grantedSkills,
  tools: grantedTool.mode === "fixed" ? [grantedTool.name ?? ""] : [grantedTool.choiceLabel ?? "Escolha 1 ferramenta"],
  grantedTool,
  languages: [],
  originFeat,
  equipmentChoices: [
    { id: "A", label: "Opção A", items: optionA.items, gold: optionA.gold },
    { id: "B", label: "Opção B", items: [], gold: 50 },
  ],
  equipment: { items: optionA.items, gold: optionA.gold },
});

export const backgrounds: Background[] = [
  mk("acolito", "Acólito", ["int", "wis", "cha"], ["Intuição", "Religião"], { mode: "fixed", name: "Suprimentos de Calígrafo" }, {
    id: "iniciado-magia-clerigo", name: "Iniciado em Magia (Clérigo)", description: "Você aprende magia divina básica.", summary: ["Escolhe 2 truques de Clérigo.", "Escolhe 1 magia de 1º círculo de Clérigo.", "Conjura a magia de 1º círculo 1x por descanso longo."], details: "Você adquire treinamento mágico inicial da lista de Clérigo, ganhando utilidade divina desde o 1º nível."
  }, { items: ["Suprimentos de Calígrafo", "Livro (orações)", "Símbolo Sagrado", "Pergaminho (10 folhas)", "Túnica"], gold: 8 }),
  mk("andarilho", "Andarilho", ["str", "dex", "wis"], ["Furtividade", "Intuição"], { mode: "fixed", name: "Ferramentas de Ladrão" }, {
    id: "sortudo", name: "Sortudo", description: "Você dobra suas chances em momentos decisivos.", summary: ["Ganha 3 pontos de sorte.", "Pode gastar 1 ponto para rolar 1d20 adicional.", "Recupera todos os pontos em descanso longo."], details: "Quando faz ataque, teste de atributo ou teste de resistência, você pode gastar sorte para adicionar um d20 extra e escolher o resultado." }, { items: ["2 Adagas", "Ferramentas de Ladrão", "Kit de Jogos (qualquer um)", "2 Algibeiras", "Roupas de Viagem", "Saco de Dormir"], gold: 16 }),
  mk("artesao", "Artesão", ["str", "dex", "int"], ["Investigação", "Persuasão"], { mode: "choice", choiceLabel: "Escolha 1 Ferramentas de Artesão", options: ["Ferramentas de Artesão"] }, {
    id: "artifista", name: "Artifista", description: "Você domina o básico da criação útil.", summary: ["Recebe treinamento técnico ampliado.", "Produz itens simples com maior eficiência.", "Ganha vantagem situacional em avaliação de manufaturas."], details: "Seu conhecimento prático acelera tarefas de fabricação e reparo, além de ampliar sua leitura de itens artesanais." }, { items: ["Ferramentas de Artesão (a mesma escolhida)", "2 Algibeiras", "Roupas de Viagem"], gold: 32 }),
  mk("artista", "Artista", ["str", "dex", "cha"], ["Acrobacia", "Atuação"], { mode: "choice", choiceLabel: "Escolha 1 Instrumento Musical", options: ["Instrumento Musical"] }, {
    id: "musico", name: "Músico", description: "Sua arte inspira e conecta pessoas.", summary: ["Ganha proficiência performática reforçada.", "Pode inspirar aliados em interações sociais.", "Mantém repertório para apresentações públicas."], details: "Você usa apresentações para criar vínculos, obter favores e melhorar o moral do grupo em momentos apropriados." }, { items: ["Instrumento Musical (o mesmo escolhido)", "Espelho", "2 Fantasias", "Perfume", "Roupas de Viagem"], gold: 11 }),
  mk("charlatao", "Charlatão", ["dex", "con", "cha"], ["Enganação", "Prestidigitação"], { mode: "fixed", name: "Kit de Falsificação" }, {
    id: "habilidoso", name: "Habilidoso", description: "Você amplia seu repertório de competências.", summary: ["Ganha proficiência adicional em perícias.", "Pode fortalecer abordagens sociais e utilitárias.", "Aprimora flexibilidade fora de combate."], details: "Você expande sua competência geral, preenchendo lacunas da equipe com novas proficiências relevantes." }, { items: ["Kit de Falsificação", "Fantasia", "Roupas Finas"], gold: 15 }),
  mk("criminoso", "Criminoso", ["dex", "con", "int"], ["Furtividade", "Prestidigitação"], { mode: "fixed", name: "Ferramentas de Ladrão" }, {
    id: "alerta", name: "Alerta", description: "Você reage antes da maioria dos oponentes.", summary: ["Ganha bônus de +5 em Iniciativa.", "Não pode ser surpreendido enquanto consciente.", "Inimigos ocultos não ganham vantagem contra você."], details: "Sua atenção constante reduz emboscadas e melhora sua resposta tática no início dos encontros." }, { items: ["2 Adagas", "Ferramentas de Ladrão", "2 Algibeiras", "Pé de Cabra", "Roupas de Viagem"], gold: 16 }),
  mk("eremita", "Eremita", ["con", "wis", "cha"], ["Medicina", "Religião"], { mode: "fixed", name: "Kit de Herbalismo" }, {
    id: "curandeiro", name: "Curandeiro", description: "Seu cuidado traz recuperação adicional.", summary: ["Melhora o uso do Kit de Curandeiro.", "Restaura PV extras ao tratar aliados.", "Permite estabilizar com eficiência superior."], details: "Você transforma cuidados médicos simples em recuperação real de pontos de vida e suporte confiável ao grupo." }, { items: ["Cajado", "Kit de Herbalismo", "Lâmpada", "Livro (filosofia)", "Óleo (3 frascos)", "Roupas de Viagem", "Saco de Dormir"], gold: 16 }),
  mk("escriba", "Escriba", ["con", "int", "wis"], ["Investigação", "Percepção"], { mode: "fixed", name: "Suprimentos de Calígrafo" }, {
    id: "habilidoso", name: "Habilidoso", description: "Você amplia seu repertório de competências.", summary: ["Ganha proficiência adicional em perícias.", "Pode fortalecer abordagens sociais e utilitárias.", "Aprimora flexibilidade fora de combate."], details: "Você expande sua competência geral, preenchendo lacunas da equipe com novas proficiências relevantes." }, { items: ["Suprimentos de Calígrafo", "Lâmpada", "Óleo (3 frascos)", "Pergaminho (12 folhas)", "Roupas Finas"], gold: 23 }),
  mk("fazendeiro", "Fazendeiro", ["str", "con", "wis"], ["Lidar com Animais", "Natureza"], { mode: "fixed", name: "Ferramentas de Carpinteiro" }, {
    id: "vigoroso", name: "Vigoroso", description: "Seu corpo aguenta melhor as adversidades.", summary: ["Aumenta sua resistência física geral.", "Melhora desempenho em esforços prolongados.", "Favorece sobrevida em jornadas duras."], details: "Você desenvolveu robustez no trabalho pesado e consegue sustentar esforço físico por mais tempo." }, { items: ["Foice", "Ferramentas de Carpinteiro", "Kit de Curandeiro", "Balde de Ferro", "Pá"], gold: 30 }),
  mk("guarda", "Guarda", ["str", "con", "wis"], ["Atletismo", "Percepção"], { mode: "choice", choiceLabel: "Escolha 1 Kit de Jogos", options: ["Kit de Jogos"] }, {
    id: "alerta", name: "Alerta", description: "Você reage antes da maioria dos oponentes.", summary: ["Ganha bônus de +5 em Iniciativa.", "Não pode ser surpreendido enquanto consciente.", "Inimigos ocultos não ganham vantagem contra você."], details: "Sua atenção constante reduz emboscadas e melhora sua resposta tática no início dos encontros." }, { items: ["Lança", "Besta Leve", "20 Virotes", "Kit de Jogo (o mesmo escolhido)", "Aljava", "Grilhões", "Lanterna Coberta", "Roupas de Viagem"], gold: 12 }),
  mk("guia", "Guia", ["dex", "con", "wis"], ["Furtividade", "Sobrevivência"], { mode: "fixed", name: "Ferramentas de Cartógrafo" }, {
    id: "iniciado-magia-druida", name: "Iniciado em Magia (Druida)", description: "Você aprende magia primal básica.", summary: ["Escolhe 2 truques de Druida.", "Escolhe 1 magia de 1º círculo de Druida.", "Conjura a magia de 1º círculo 1x por descanso longo."], details: "Você canaliza forças naturais para obter magia utilitária e de exploração desde o início." }, { items: ["Arco Curto", "20 Flechas", "Ferramentas de Cartógrafo", "Aljava", "Roupas de Viagem", "Saco de Dormir", "Tenda"], gold: 3 }),
  mk("marinheiro", "Marinheiro", ["str", "dex", "con"], ["Acrobacia", "Percepção"], { mode: "fixed", name: "Ferramentas de Navegador" }, {
    id: "valentao-taverna", name: "Valentão de Taverna", description: "Você transforma qualquer ambiente em vantagem de combate.", summary: ["Melhora combate corpo a corpo improvisado.", "Aprimora agarrões e pressão curta distância.", "Combina resistência com agressividade prática."], details: "Você usa o ambiente ao redor com eficiência brutal, seja em navios, tavernas ou vielas apertadas." }, { items: ["Adaga", "Ferramentas de Navegador", "Corda", "Roupas de Viagem"], gold: 20 }),
  mk("mercador", "Mercador", ["con", "int", "cha"], ["Lidar com Animais", "Persuasão"], { mode: "fixed", name: "Ferramentas de Navegador" }, {
    id: "sortudo", name: "Sortudo", description: "Você dobra suas chances em momentos decisivos.", summary: ["Ganha 3 pontos de sorte.", "Pode gastar 1 ponto para rolar 1d20 adicional.", "Recupera todos os pontos em descanso longo."], details: "Quando faz ataque, teste de atributo ou teste de resistência, você pode gastar sorte para adicionar um d20 extra e escolher o resultado." }, { items: ["Ferramentas de Navegador", "2 Algibeiras", "Roupas de Viagem"], gold: 22 }),
  mk("nobre", "Nobre", ["str", "int", "cha"], ["História", "Persuasão"], { mode: "choice", choiceLabel: "Escolha 1 Kit de Jogos", options: ["Kit de Jogos"] }, {
    id: "habilidoso", name: "Habilidoso", description: "Você amplia seu repertório de competências.", summary: ["Ganha proficiência adicional em perícias.", "Pode fortalecer abordagens sociais e utilitárias.", "Aprimora flexibilidade fora de combate."], details: "Você expande sua competência geral, preenchendo lacunas da equipe com novas proficiências relevantes." }, { items: ["Kit de Jogos (o mesmo escolhido)", "Perfume", "Roupas Finas"], gold: 29 }),
  mk("sabio", "Sábio", ["con", "int", "wis"], ["Arcanismo", "História"], { mode: "fixed", name: "Suprimentos de Calígrafo" }, {
    id: "iniciado-magia-mago", name: "Iniciado em Magia (Mago)", description: "Você aprende magia arcana básica.", summary: ["Escolhe 2 truques de Mago.", "Escolhe 1 magia de 1º círculo de Mago.", "Conjura a magia de 1º círculo 1x por descanso longo."], details: "Seu treinamento teórico concede um primeiro repertório arcano para exploração e combate." }, { items: ["Cajado", "Suprimentos de Calígrafo", "Livro (história)", "Pergaminho (8 folhas)", "Túnica"], gold: 8 }),
  mk("soldado", "Soldado", ["str", "dex", "con"], ["Atletismo", "Intimidação"], { mode: "choice", choiceLabel: "Escolha 1 Kit de Jogos", options: ["Kit de Jogos"] }, {
    id: "atacante-selvagem", name: "Atacante Selvagem", description: "Você maximiza golpes agressivos.", summary: ["Melhora consistência do dano corpo a corpo.", "Favorece rolagens de dano ofensivas.", "Potencializa pressão em combate direto."], details: "Ao acertar ataques corpo a corpo, você obtém melhor rendimento de dano em investidas decisivas." }, { items: ["Lança", "Arco Curto", "20 Flechas", "Kit de Curandeiro", "Kit de Jogo (o mesmo escolhido)", "Aljava", "Roupas de Viagem"], gold: 14 }),
].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export const backgroundsById: Record<string, Background> = Object.fromEntries(backgrounds.map((b) => [b.id, b]));
