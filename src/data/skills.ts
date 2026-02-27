import type { AbilityKey } from "@/utils/calculations";

export interface SkillData {
  id: string;
  name: string;
  ability: AbilityKey;
  description: string;
}

export const skills: SkillData[] = [
  { id: "acrobacia", name: "Acrobacia", ability: "dex", description: "Testes de equilíbrio, saltos acrobáticos, mergulhos e piruetas." },
  { id: "adestrarAnimais", name: "Adestrar Animais", ability: "wis", description: "Acalmar, intuir intenções ou controlar um animal." },
  { id: "arcanismo", name: "Arcanismo", ability: "int", description: "Conhecimento sobre magias, itens mágicos, planos e símbolos arcanos." },
  { id: "atletismo", name: "Atletismo", ability: "str", description: "Escalar, saltar, nadar e proezas atléticas." },
  { id: "atuacao", name: "Atuação", ability: "cha", description: "Entreter uma audiência com música, dança, atuação ou contação de histórias." },
  { id: "enganacao", name: "Enganação", ability: "cha", description: "Ocultar a verdade, desde ambiguidade até mentiras descaradas." },
  { id: "furtividade", name: "Furtividade", ability: "dex", description: "Esconder-se, esgueirar-se e evitar detecção." },
  { id: "historia", name: "História", ability: "int", description: "Conhecimento sobre eventos históricos, pessoas, nações e guerras." },
  { id: "intimidacao", name: "Intimidação", ability: "cha", description: "Influenciar alguém através de ameaças, hostilidade e violência." },
  { id: "intuicao", name: "Intuição", ability: "wis", description: "Determinar intenções verdadeiras de uma criatura, detectar mentiras." },
  { id: "investigacao", name: "Investigação", ability: "int", description: "Deduzir informações de pistas, documentos e experimentos." },
  { id: "medicina", name: "Medicina", ability: "wis", description: "Estabilizar companheiros, diagnosticar doenças e tratar ferimentos." },
  { id: "natureza", name: "Natureza", ability: "int", description: "Conhecimento sobre terrenos, fauna, flora, ciclos e clima." },
  { id: "percepcao", name: "Percepção", ability: "wis", description: "Detectar a presença de algo através dos sentidos." },
  { id: "persuasao", name: "Persuasão", ability: "cha", description: "Influenciar alguém com tato, graça social e boa índole." },
  { id: "prestidigitacao", name: "Prestidigitação", ability: "dex", description: "Truques de mão, plantar objetos, truques de furto e armadilhas." },
  { id: "religiao", name: "Religião", ability: "int", description: "Conhecimento sobre deidades, ritos, orações e hierarquias religiosas." },
  { id: "sobrevivencia", name: "Sobrevivência", ability: "wis", description: "Rastrear, caçar, navegar e sobreviver na natureza." },
];

export const skillsById: Record<string, SkillData> = Object.fromEntries(
  skills.map((s) => [s.id, s])
);

export const skillsByName: Record<string, SkillData> = Object.fromEntries(
  skills.map((s) => [s.name, s])
);
