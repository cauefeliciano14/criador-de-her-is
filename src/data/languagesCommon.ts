export interface CommonLanguageData {
  id: string;
  name: string;
  origin: string;
  type: "comum";
}

export const commonLanguages: CommonLanguageData[] = [
  { id: "anao", name: "Anão", origin: "Anões", type: "comum" },
  { id: "comum", name: "Comum", origin: "Sigil", type: "comum" },
  { id: "draconico", name: "Dracônico", origin: "Dragões", type: "comum" },
  { id: "elfico", name: "Élfico", origin: "Elfos", type: "comum" },
  { id: "gigante", name: "Gigante", origin: "Gigantes", type: "comum" },
  { id: "gnomico", name: "Gnômico", origin: "Gnomos", type: "comum" },
  { id: "goblin", name: "Goblin", origin: "Goblinoides", type: "comum" },
  { id: "lingua-de-sinais-comum", name: "Língua de Sinais Comum", origin: "Sigil", type: "comum" },
  { id: "orc", name: "Orc", origin: "Orcs", type: "comum" },
  { id: "pequenino", name: "Pequenino", origin: "Pequeninos", type: "comum" },
];
