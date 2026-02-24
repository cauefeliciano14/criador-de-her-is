export interface Background {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: string[];
  equipment: string[];
  feature: { name: string; description: string };
}

export const backgrounds: Background[] = [
  {
    id: "accolito",
    name: "Acólito",
    description:
      "Você passou a vida nos templos, estudando a tradição de sua fé e realizando ritos sagrados. Sua conexão com o divino é profunda.",
    skillProficiencies: ["Intuição", "Religião"],
    toolProficiencies: [],
    languages: ["Dois idiomas à escolha"],
    equipment: [
      "Símbolo sagrado",
      "Livro de orações",
      "5 varetas de incenso",
      "Vestimentas",
      "15 PO",
    ],
    feature: {
      name: "Abrigo dos Fiéis",
      description:
        "Como acólito, você e seus companheiros podem receber cura e cuidados gratuitos em templos e santuários de sua fé. Devotos podem ajudá-lo com um estilo de vida modesto.",
    },
  },
  {
    id: "soldado",
    name: "Soldado",
    description:
      "Você serviu em um exército ou milícia, treinando nas artes da guerra. Combate e disciplina militar definiram seus anos de formação.",
    skillProficiencies: ["Atletismo", "Intimidação"],
    toolProficiencies: ["Um tipo de jogo", "Veículos terrestres"],
    languages: [],
    equipment: [
      "Insígnia de patente",
      "Troféu de um inimigo caído",
      "Conjunto de dados de osso ou baralho",
      "Roupas comuns",
      "10 PO",
    ],
    feature: {
      name: "Patente Militar",
      description:
        "Você tem uma patente militar reconhecida. Soldados de sua antiga organização reconhecem sua autoridade. Você pode obter acesso a fortalezas e acampamentos aliados.",
    },
  },
];
