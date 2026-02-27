/**
 * Instrumentos musicais disponíveis no PHB 2024 (PT-BR).
 */

export interface MusicalInstrument {
  id: string;
  name: string;
  cost: string;
  weight: string;
}

export const musicalInstruments: MusicalInstrument[] = [
  { id: "alaude", name: "Alaúde", cost: "35 PO", weight: "1 kg" },
  { id: "charamela", name: "Charamela", cost: "2 PO", weight: "0,5 kg" },
  { id: "citara", name: "Cítara", cost: "25 PO", weight: "1 kg" },
  { id: "flauta", name: "Flauta", cost: "2 PO", weight: "0,5 kg" },
  { id: "flauta-de-pa", name: "Flauta de Pã", cost: "12 PO", weight: "1 kg" },
  { id: "gaita-de-foles", name: "Gaita de Foles", cost: "30 PO", weight: "3 kg" },
  { id: "lira", name: "Lira", cost: "30 PO", weight: "1 kg" },
  { id: "tambor", name: "Tambor", cost: "6 PO", weight: "1,5 kg" },
  { id: "tamborim", name: "Tamborim", cost: "10 PO", weight: "0,5 kg" },
  { id: "viola", name: "Viola", cost: "30 PO", weight: "0,5 kg" },
];

export const musicalInstrumentsById: Record<string, MusicalInstrument> = Object.fromEntries(
  musicalInstruments.map((i) => [i.id, i])
);
