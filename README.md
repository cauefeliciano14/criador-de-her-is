# D&D 2024 Character Builder (PT-BR)

Builder de personagens com foco no **PHB 2024**, em português, com fluxo guiado por etapas e validações de regras para montagem de ficha.

## Como executar localmente

Pré-requisitos:
- Node.js 18+
- npm

```sh
npm i
npm run dev
```

Build de produção:

```sh
npm run build
npm run preview
```

## Como usar o builder

O fluxo principal é sequencial e segue estas etapas:

1. **Classe**
   - Escolha a classe base do personagem.
2. **Origem**
   - Selecione o antecedente (origem), talentos e proficiências associadas.
3. **Raça**
   - Defina raça, escolhas raciais obrigatórias e idiomas quando aplicável.
4. **Atributos**
   - Escolha o método e confirme a distribuição de atributos.
5. **Equipamento**
   - Selecione kits/equipamentos iniciais e resolva escolhas obrigatórias pendentes.
6. **Ficha**
   - Revise o resultado final, valide pendências e use ações de saída.

## Funcionalidades prontas

- Fluxo guiado por etapas com bloqueio de progressão quando há pendências obrigatórias.
- Persistência local automática do estado do personagem e progresso do builder.
- **Exportar JSON** da ficha.
- **Importar JSON** com validação de payload.
- **Impressão** da ficha em rota dedicada (`/print`).
- **Share** por cópia de payload compartilhável (Base64) para área de transferência.

## Limitações atuais

- Escopo de regras limitado ao recorte canônico: **PHB 2024, níveis 1 e 2**.
- Não há progressão funcional para níveis 3–20.
- O projeto opera com regras e nomenclaturas internas definidas no documento canônico; itens fora desse escopo não devem ser considerados válidos.

## Próximas entregas

Alinhado ao `docs/canonical_specs.md`, as próximas entregas priorizadas são:

1. **Expansão e endurecimento do Choice Engine**
   - Cobrir integralmente escolhas obrigatórias (perícias, idiomas, ferramentas, instrumentos, talentos, truques e magias) com rastreio por origem da regra.
2. **Validação operacional mais rígida na etapa de Equipamentos**
   - Garantir bloqueio consistente enquanto houver pendências e manter a etapa de Ficha apenas para revisão final.
3. **Auditoria de dados canônicos mais abrangente (DEV)**
   - Aumentar cobertura de inconsistências entre catálogos e regras (ausência de itens obrigatórios, vínculos quebrados e campos canônicos incompletos).
4. **Fortalecimento da política “ID-first”**
   - Consolidar integrações para operar sempre por `id` (nunca por `name`) em dados, validações e migrações de estado.

## Troubleshooting rápido

### 0) Lovable mostra "Preview has not been built yet"

Use este checklist rápido (3 minutos):

1. Abra o projeto no Lovable e entre em **Logs/Build**.
2. Localize a etapa de instalação de dependências (`npm ci` ou `npm install`).
3. Encontre o **primeiro erro real** no log (não apenas mensagens em cascata).
4. Se o erro for `E403` / `403 Forbidden` (registry/bloqueio de pacote):
   - confirme o registry usado pelo ambiente (`https://registry.npmjs.org`);
   - valide se há proxy/política de segurança bloqueando pacote;
   - rode novamente após ajuste da política/rede.
5. Se o erro for lockfile: execute localmente `npm install` e comite o `package-lock.json` atualizado.
6. Refaça o build e confirme se a etapa `vite build` executa até o fim.
7. Só depois valide o **Preview**.

Dica prática: quando o preview não nasce, quase sempre a causa está **antes** (install/build), então priorize o primeiro erro da pipeline.

### 1) Persistência local não está mantendo progresso

Checklist:
- Verifique se o navegador permite `localStorage` (modo privado pode restringir em alguns cenários).
- Confirme se não há extensões de privacidade limpando armazenamento ao fechar aba.
- Faça um hard refresh (`Ctrl+Shift+R`) e recarregue o app.
- Se necessário, limpe somente as chaves locais do app e reinicie:
  - `dnd-builder-character-2024`
  - `dnd-builder-ui-2024`

Dica: após limpar storage, recarregue a página e reimporte seu JSON de backup.

### 2) Importação de JSON falha

Checklist:
- Use arquivos exportados pelo próprio builder (evita divergência de schema).
- Confirme que o arquivo é JSON válido e não foi alterado manualmente com estrutura inválida.
- Em caso de erro, leia o toast de validação para identificar campos faltantes/incompatíveis.
- Se o JSON for antigo, exporte novamente um personagem atual para comparar o formato esperado.

## Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
