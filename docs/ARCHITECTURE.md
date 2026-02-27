# ARCHITECTURE

## Stack técnico
- **Build e tooling:** Vite 5, TypeScript 5, ESLint 9, PostCSS e Autoprefixer.
- **Front-end:** React 18 + React DOM 18.
- **Roteamento:** React Router DOM 6.
- **Estilização:** Tailwind CSS + tailwindcss-animate.
- **UI base:** shadcn/ui com componentes Radix UI.
- **Gerenciamento de estado:** Zustand.
- **Validação e formulários:** Zod, React Hook Form e @hookform/resolvers.
- **Testes:** Vitest, Testing Library (react + jest-dom), jsdom.

## Dependências

### Produção (principais)
- react, react-dom
- react-router-dom
- zustand
- zod
- react-hook-form, @hookform/resolvers
- @tanstack/react-query
- @radix-ui/* (componentes de acessibilidade/base para UI)
- lucide-react
- sonner
- recharts
- date-fns

### Desenvolvimento (principais)
- vite, @vitejs/plugin-react-swc
- typescript
- eslint, typescript-eslint
- vitest, @testing-library/react, @testing-library/jest-dom, jsdom
- tailwindcss, @tailwindcss/typography, postcss, autoprefixer

> Fonte de verdade das versões: `package.json`.

## Padrões de arquitetura
- **Organização por domínio/função em `src/`:**
  - `components/` (UI e passos de fluxo)
  - `pages/` (páginas de rota)
  - `state/` (stores e seletores)
  - `rules/engine/` (lógica de cálculo e regras de personagem)
  - `utils/` (utilitários puros)
  - `data/` (catálogos e dados estáticos)
  - `test/` (testes automatizados)
- **Separação de responsabilidades:** cálculo de regras centralizado em `rules/engine`, camada de UI em `components/pages`, e estado em `state`.
- **Arquitetura orientada a funções puras para regras:** módulos de cálculo isolados (ex.: `calc*.ts`) e função agregadora (`recalcAll.ts`).
- **Cobertura de lógica por testes unitários:** suíte dedicada para engine e validações em `src/test`.

## Regras que devem ser seguidas
1. **Não alterar comportamento funcional sem alinhamento explícito.**
2. **Manter separação de camadas existente** (`rules/engine`, `state`, `components`, `data`, `utils`).
3. **Toda lógica nova deve ser testável e coberta por testes automáticos** (Vitest).
4. **Evitar acoplamento da UI com regra de negócio:** regras devem permanecer em módulos de engine/utils.
5. **Usar TypeScript com tipagem explícita quando necessário** para reduzir ambiguidades.
6. **Atualizações de dependências devem ser refletidas no `package.json` e lockfile correspondente.**
