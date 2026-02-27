/**
 * IDs oficiais esperados do PHB 2024 (PT-BR).
 * Usado para validação em runtime — garante que os dados estão completos e sem extras.
 */

export const EXPECTED_CLASS_IDS = [
  "barbaro", "bardo", "bruxo", "clerigo", "druida", "feiticeiro",
  "guardiao", "guerreiro", "ladino", "mago", "monge", "paladino",
] as const;

export const EXPECTED_BACKGROUND_IDS = [
  "acolito", "andarilho", "artesao", "artista", "charlatao", "criminoso",
  "eremita", "escriba", "fazendeiro", "guarda", "guia", "marinheiro",
  "mercador", "nobre", "sabio", "soldado",
] as const;

export const EXPECTED_RACE_IDS = [
  "aasimar", "anao", "draconato", "elfo", "gnomo", "golias",
  "humano", "orc", "pequenino", "tiferino",
] as const;

export type ExpectedClassId = typeof EXPECTED_CLASS_IDS[number];
export type ExpectedBackgroundId = typeof EXPECTED_BACKGROUND_IDS[number];
export type ExpectedRaceId = typeof EXPECTED_RACE_IDS[number];
