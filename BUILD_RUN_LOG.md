# Build/Run Verification Log

Date: 2026-02-28
Repository: `criador-de-her-is`

## Commands executed in container

1. `npm ci` (estado inicial)
   - **Status:** failed
   - **Reason:** `E403` no pacote `@testing-library/dom` (primeiro pacote bloqueado no install).

2. `npm install --omit=dev` (estado inicial)
   - **Status:** failed
   - **Reason:** mesmo `E403` em `@testing-library/dom`.

3. Ajustes aplicados (separação de dependências de teste + `.npmrc` com registry oficial e proxy nulo).

4. `npm ci` (após ajustes)
   - **Status:** failed
   - **Reason:** `E403` em `picomatch` (bloqueio de política/rede ainda ativo no ambiente).

5. `npm config get registry`
   - **Status:** passed
   - **Output:** `https://registry.npmjs.org/`

6. `npm config list | rg -n "proxy|registry"`
   - **Status:** warning
   - **Reason:** ainda há `http-proxy`/`https-proxy` injetados por variável de ambiente global.

## Mitigação aplicada no repositório

- Adicionado `.npmrc` para fixar `registry=https://registry.npmjs.org/` e desabilitar `proxy`/`https-proxy` no contexto do projeto.
- Dependências necessárias para build (`vite`, `@vitejs/plugin-react-swc`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `lovable-tagger`, `@tailwindcss/typography`) movidas para `dependencies`.
- Dependências estritamente de teste (`@testing-library/*`) removidas do pipeline principal (preview mínimo).
- Atualizada documentação com estratégia recomendada para Lovable Preview.

## Conclusion

A validação completa do preview não pôde ser concluída neste container porque persiste bloqueio `E403` por política/rede. A configuração proposta para o Lovable está pronta: `npm install --omit=dev`, registry oficial do npm e execução sem proxy corporativo no step de install.
