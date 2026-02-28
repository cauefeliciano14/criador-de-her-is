export interface ToolData {
  id: string;
  name: string;
  description: string;
  costGp: number;
  weight: number;
  category: "artisan" | "gaming" | "kit" | "vehicle" | "instrument" | "other";
}

export const tools: ToolData[] = [
  { id: "kit-herbalismo", name: "Kit de Herbalismo", description: "Estojo com instrumentos para criar e aplicar remédios naturais.", costGp: 5, weight: 3, category: "kit" },
  { id: "kit-disfarce", name: "Kit de Disfarce", description: "Cosméticos, roupas e pequenos adereços para criar identidades falsas.", costGp: 25, weight: 3, category: "kit" },
  { id: "kit-falsificacao", name: "Kit de Falsificação", description: "Ferramentas para imitar documentos, selos e caligrafia.", costGp: 15, weight: 5, category: "kit" },
  { id: "ferramentas-ladrao", name: "Ferramentas de Ladrão", description: "Ganchos, limas e arames para abrir fechaduras e desarmar mecanismos.", costGp: 25, weight: 1, category: "kit" },
  { id: "ferramentas-navegador", name: "Ferramentas de Navegador", description: "Instrumentos de navegação para traçar rotas marítimas e orientação.", costGp: 25, weight: 2, category: "kit" },
  { id: "calligrapher-supplies", name: "Suprimentos de Caligrafia", description: "Tintas, penas e pergaminhos para escrita formal e cópia de manuscritos.", costGp: 10, weight: 2, category: "artisan" },
  { id: "cartographer-tools", name: "Ferramentas de Cartógrafo", description: "Instrumentos para medições, desenho de mapas e registros de terreno.", costGp: 15, weight: 3, category: "artisan" },
  { id: "veiculos-terrestres", name: "Veículos Terrestres", description: "Proficiência para conduzir carruagens, carroças e veículos puxados por animais.", costGp: 0, weight: 0, category: "vehicle" },
  { id: "veiculos-aquaticos", name: "Veículos Aquáticos", description: "Proficiência para pilotar embarcações e manobrar em água.", costGp: 0, weight: 0, category: "vehicle" },
  { id: "choose_artisans_tools", name: "Escolha: Ferramentas de Artesão", description: "Selecione uma proficiência de ferramentas de artesão da lista disponível.", costGp: 0, weight: 0, category: "artisan" },
  { id: "choose_gaming_set", name: "Escolha: Kit de Jogo", description: "Selecione uma proficiência em um kit de jogo.", costGp: 0, weight: 0, category: "gaming" },
  { id: "choose_musical_instrument", name: "Escolha: Instrumento Musical", description: "Selecione uma proficiência em um instrumento musical.", costGp: 0, weight: 0, category: "instrument" },
];

export const toolsById: Record<string, ToolData> = Object.fromEntries(tools.map((tool) => [tool.id, tool]));

export const toolChoiceOptions: Record<string, ToolData[]> = {
  choose_artisans_tools: [
    { id: "ferramentas-artesao-alquimista", name: "Ferramentas de Alquimista", description: "Frascos, pinças e reagentes para experimentos alquímicos.", costGp: 50, weight: 4, category: "artisan" },
    { id: "ferramentas-artesao-ferreiro", name: "Ferramentas de Ferreiro", description: "Martelos, tenazes e moldes para forja.", costGp: 20, weight: 8, category: "artisan" },
    { id: "ferramentas-artesao-carpinteiro", name: "Ferramentas de Carpinteiro", description: "Serras, plainas e instrumentos de medição para madeira.", costGp: 8, weight: 6, category: "artisan" },
    { id: "ferramentas-artesao-coureiro", name: "Ferramentas de Coureiro", description: "Agulhas, facas e moldes para couro.", costGp: 5, weight: 5, category: "artisan" },
    { id: "ferramentas-artesao-joalheiro", name: "Ferramentas de Joalheiro", description: "Lupas e ferramentas finas para lapidação e montagem.", costGp: 25, weight: 2, category: "artisan" },
    { id: "ferramentas-artesao-pedreiro", name: "Ferramentas de Pedreiro", description: "Cinzel e martelo para trabalho em pedra.", costGp: 10, weight: 8, category: "artisan" },
    { id: "ferramentas-artesao-tecelao", name: "Ferramentas de Tecelão", description: "Fuso e utensílios para fiar e tecer.", costGp: 1, weight: 5, category: "artisan" },
  ],
  choose_gaming_set: [
    { id: "jogo-dados", name: "Jogo de Dados", description: "Conjunto de dados para apostas e jogos de azar.", costGp: 1, weight: 0, category: "gaming" },
    { id: "jogo-cartas", name: "Jogo de Cartas", description: "Baralho para jogos sociais e apostas.", costGp: 1, weight: 0, category: "gaming" },
    { id: "jogo-xadrez", name: "Jogo de Xadrez", description: "Tabuleiro e peças para jogo estratégico.", costGp: 1, weight: 1, category: "gaming" },
  ],
  choose_musical_instrument: [
    { id: "flauta", name: "Flauta", description: "Instrumento de sopro portátil.", costGp: 2, weight: 1, category: "instrument" },
    { id: "alaude", name: "Alaúde", description: "Instrumento de cordas clássico para performances.", costGp: 35, weight: 2, category: "instrument" },
    { id: "tambor", name: "Tambor", description: "Instrumento de percussão para ritmo e marcha.", costGp: 6, weight: 3, category: "instrument" },
  ],
};
