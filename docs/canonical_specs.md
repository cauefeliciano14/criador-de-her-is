# CANONICAL_SPECS — Fonte Operacional do Projeto

Este arquivo é a fonte interna definitiva para regras e nomenclaturas do projeto.
Qualquer implementação deve seguir exclusivamente este documento.
Nenhuma regra pode ser inventada fora deste escopo.

Recorte válido: PHB 2024 — apenas nível 1 e 2.

---

# 📘 CANONICAL SPECS — PHB 2024 (Recorte Nível 1–2)

Fonte absoluta:
DnD 5.5 - Livro do Jogador (2024).pdf

Documento operacional:
D&D 5.5 - Livro do Jogador (2024) 5.1.docx

---

# 1️⃣ RAÇAS (10)

## Anão
- Tamanho: Médio
- Deslocamento: 9m
- Visão no Escuro
- Resistência a Veneno
- Idiomas: Comum + Anão
- NÃO possui sub-raça obrigatória

## Elfo
- Tamanho: Médio
- Deslocamento: 9m
- Visão no Escuro
- Idiomas: Comum + Élfico

Escolha obrigatória (raceChoice.requiredCount = 1):
- Alto Elfo
- Elfo Silvestre
- Drow

## Halfling
- Tamanho: Pequeno
- Deslocamento: 7,5m
- Sorte
- Idiomas: Comum + Halfling
- NÃO possui sub-raça obrigatória

## Humano
- Tamanho: Médio
- Deslocamento: 9m
- Versátil
- Idiomas: Comum + 1 idioma à escolha

Choice Engine:
languages.requiredCount += 1 (source: race:humano)

## Gnomo
- Tamanho: Pequeno
- Deslocamento: 9m
- Visão no Escuro
- Idiomas: Comum + Gnômico

Escolha obrigatória:
- Gnomo das Rochas
- Gnomo do Bosque

raceChoice.requiredCount = 1

## Draconato
Escolha obrigatória:
- Ancestralidade Dracônica (define resistência + sopro)

raceChoice.requiredCount = 1

## Golias
Escolha obrigatória:
- Gigante da Colina
- Gigante da Pedra
- Gigante da Geada
- Gigante das Nuvens
- Gigante de Fogo
- Gigante da Tempestade

raceChoice.requiredCount = 1

## Orc
- Tamanho: Médio
- Deslocamento: 9m
- Visão no Escuro
- Idiomas: Comum + Orc
- NÃO possui sub-raça obrigatória

## Tiefling
- Tamanho: Médio
- Deslocamento: 9m
- Resistência a Fogo
- Idiomas: Comum + Infernal
- NÃO possui sub-raça obrigatória

## Meio-Elfo
NÃO existe no PHB 2024

---

# 2️⃣ ANTECEDENTES (16)

Lista canônica:
Acólito
Artesão
Artista
Charlatão
Criminoso
Eremita
Forasteiro
Gladiador
Guarda
Marinheiro
Mercador
Nobre
Órfão
Sábio
Soldado
Viajante

Cada antecedente concede:
- 2 perícias fixas
- 1 Talento de Origem
- Equipamentos iniciais

Alguns concedem:
- 1 idioma à escolha
- 1 ferramenta de artesão à escolha
- 1 instrumento musical à escolha

Choice Engine deve detectar:
- "um idioma à sua escolha"
- "uma ferramenta à sua escolha"
- "um instrumento musical à sua escolha"

---

# 3️⃣ CLASSES (12)

Bárbaro
Bardo
Bruxo
Clérigo
Druida
Feiticeiro
Guardião
Guerreiro
Ladino
Mago
Monge
Paladino

---

# 4️⃣ PERÍCIAS POR CLASSE (nível 1)

Bárbaro: escolha 2
Bardo: escolha 3
Bruxo: escolha 2
Clérigo: escolha 2
Druida: escolha 2
Feiticeiro: escolha 2
Guardião: escolha 3
Guerreiro: escolha 2
Ladino: escolha 4
Mago: escolha 2
Monge: escolha 2
Paladino: escolha 2

Choice Engine:
skills.requiredCount += classSkillCount

---

# 5️⃣ CONJURAÇÃO (Recorte Nível 1–2)

Classes conjuradoras nível 1:
Bardo
Bruxo
Clérigo
Druida
Feiticeiro
Mago

Classes que começam no nível 2:
Paladino
Guardião

## Truques (nível 1)

Bardo: 2
Bruxo: 2
Clérigo: 3
Druida: 2
Feiticeiro: 4
Mago: 3

## Magias Conhecidas / Preparadas

Mago: 6 no grimório
Feiticeiro: 2 conhecidas
Bardo: 4 conhecidas
Bruxo: 2 conhecidas
Clérigo/Druida: preparadas = modificador + nível
Paladino: começa nível 2
Guardião: começa nível 2

Choice Engine:
cantrips.requiredCount = conforme classe
spells.requiredCount = conforme classe e nível

---

# 6️⃣ TALENTOS (Capítulo 5 — Recorte Operacional)

## Talentos de Origem
Cada antecedente concede 1 talento de origem obrigatório.

## Estilo de Luta

Guerreiro:
- Nível 1: escolher 1 talento da categoria "fighting_style"

Guardião:
- Nível 2: escolher 1 talento "fighting_style"
  OU opção alternativa "Combatente Druídico"

Choice Engine:
feats.requiredCount += 1 (source: class)

---

# 7️⃣ BARDO — INSTRUMENTOS

Bardo deve escolher 3 instrumentos musicais.

Choice Engine:
instruments.requiredCount += 3 (source: class:bardo)

---

# 8️⃣ EQUIPAMENTO INICIAL

Cada classe deve possuir:
- Opção A
- Opção B
- OU alternativa em ouro

Antecedentes concedem equipamentos fixos.

Nenhuma escolha de equipamento ocorre antes da etapa "Equipamentos".

Se algum equipamento estiver ausente:
Auditoria DEV deve gerar ERROR.

---

# 9️⃣ IDIOMAS À ESCOLHA

Detectados em:
- Humano
- Alguns Antecedentes
- Possíveis talentos

Choice Engine:
languages.requiredCount += X

---

# 🔟 FERRAMENTAS / INSTRUMENTOS À ESCOLHA

Detectados em:
- Bardo
- Artesão
- Artista
- Outros antecedentes

Choice Engine:
tools.requiredCount += X
instruments.requiredCount += X

---

# 1️⃣1️⃣ REGRAS DE UX

- Escolhas de:
  - Perícias
  - Truques
  - Magias
  - Idiomas
  - Ferramentas
  - Instrumentos
  - Talentos obrigatórios

Devem ocorrer na etapa "Equipamentos".

Se houver pendência:
- Etapa Equipamentos fica bloqueada.

Ficha:
- Somente revisão final.
- Nunca exige escolhas obrigatórias.

---

# 1️⃣2️⃣ RESTRIÇÕES DO PROJETO

- Apenas nível 1 e 2
- Nenhuma progressão 3–20
- Nada acima do nível 2 gera escolha ativa
- Tudo deve funcionar por ID, nunca por name