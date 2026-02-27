export interface SourceRef {
  sourceId: string;
  page: number;
}

export interface Source {
  id: string;
  title: string;
  edition: string;
  publisher: string;
  year: number;
  language: string;
  notes: string;
}

export const sources: Source[] = [
  {
    id: "phb2024-ptbr",
    title: "Livro do Jogador 2024 (PT-BR)",
    edition: "2024",
    publisher: "Wizards of the Coast",
    year: 2024,
    language: "pt-BR",
    notes: "Fonte primária do projeto.",
  },
];

export const sourcesById: Record<string, Source> = Object.fromEntries(
  sources.map((s) => [s.id, s])
);
