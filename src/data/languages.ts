/**
 * Idiomas disponíveis no PHB 2024 (PT-BR).
 * Divididos em idiomas comuns e exóticos.
 */

export interface LanguageData {
  id: string;
  name: string;
  category: "comum" | "exótico";
  typicalSpeakers: string;
}

export const languages: LanguageData[] = [
  // Idiomas comuns
  { id: "comum", name: "Comum", category: "comum", typicalSpeakers: "Humanos e maioria dos povos" },
  { id: "anao", name: "Anão", category: "comum", typicalSpeakers: "Anões" },
  { id: "elfico", name: "Élfico", category: "comum", typicalSpeakers: "Elfos" },
  { id: "gigante", name: "Gigante", category: "comum", typicalSpeakers: "Gigantes, Golias" },
  { id: "gnomico", name: "Gnômico", category: "comum", typicalSpeakers: "Gnomos" },
  { id: "goblin", name: "Goblin", category: "comum", typicalSpeakers: "Goblins, Hobgoblins, Bugbears" },
  { id: "halfling", name: "Halfling", category: "comum", typicalSpeakers: "Pequeninos" },
  { id: "orc", name: "Orc", category: "comum", typicalSpeakers: "Orcs" },
  // Idiomas exóticos
  { id: "abissal", name: "Abissal", category: "exótico", typicalSpeakers: "Demônios" },
  { id: "celestial", name: "Celestial", category: "exótico", typicalSpeakers: "Celestiais" },
  { id: "draconico", name: "Dracônico", category: "exótico", typicalSpeakers: "Dragões, Draconatos" },
  { id: "dialeto-subterraneo", name: "Dialeto Subterrâneo", category: "exótico", typicalSpeakers: "Criaturas subterrâneas" },
  { id: "infernal", name: "Infernal", category: "exótico", typicalSpeakers: "Diabos" },
  { id: "primordial", name: "Primordial", category: "exótico", typicalSpeakers: "Elementais" },
  { id: "silvestre", name: "Silvestre", category: "exótico", typicalSpeakers: "Fadas" },
];

export const languagesById: Record<string, LanguageData> = Object.fromEntries(
  languages.map((l) => [l.id, l])
);
