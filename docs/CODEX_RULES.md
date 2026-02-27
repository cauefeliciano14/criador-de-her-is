# CODEX_RULES

## Regras de execução para o Codex
1. **Escopo primeiro:** executar apenas o que foi solicitado no ticket/prompt.
2. **Mudanças mínimas:** preferir alterações pequenas, diretas e rastreáveis.
3. **Transparência:** registrar o que foi alterado e como foi validado.
4. **Rastreabilidade:** manter commits claros e objetivos.

## Não alterar fluxo
- Não modificar o fluxo funcional existente da aplicação sem solicitação explícita.
- Não reestruturar navegação, estado ou regras de cálculo fora do escopo.

## Não inventar conteúdo
- Não supor requisitos não informados.
- Não adicionar regras de negócio não especificadas.
- Quando faltar contexto, usar apenas informações verificáveis no repositório atual.

## Sempre escrever testes para lógica
- Toda mudança de lógica (regras, cálculos, validações, seletores, utilitários de negócio) deve vir acompanhada de testes automatizados.
- Os testes devem cobrir comportamento esperado e casos de borda relevantes.
- Para mudanças exclusivamente documentais, não é necessário criar testes.
