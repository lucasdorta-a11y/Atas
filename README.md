# Giro de Atas — Painel de Compras · Fundação Butantan

Painel interno para acompanhar compras e Atas de Registro de Preços a partir de planilhas
operacionais (`.xlsx`, `.xls`, `.csv`) exportadas do SharePoint ou mantidas pela equipe.

**Princípio central: nenhum número é inventado.** Todos os indicadores, gráficos, listas e
tabelas derivam exclusivamente das planilhas importadas pela equipe e marcadas como **ativas**.
Sem dados importados, o painel exibe um estado inicial orientando a importação — nunca
números fictícios.

---

## Stack

| Camada | Tecnologia | Motivo |
| --- | --- | --- |
| App | Next.js 16 (App Router) + React 19 + TypeScript | SSR rápido, rotas de API no mesmo projeto, tipagem ponta a ponta |
| Banco | PostgreSQL + Drizzle ORM | Persistência multiusuário das bases importadas, com histórico (`active`/`superseded`) |
| Leitura de planilhas | SheetJS (`xlsx`) **no navegador** | Pré-visualização imediata, múltiplas abas, encodings (UTF-8/Windows-1252) e separadores (`;`/`,`/tab). O arquivo só vai ao servidor na confirmação |
| Estilo | Tailwind CSS 4 + tokens CSS próprios | Design system enxuto (azul-marinho, laranja, cores de área) |
| Ícones | Lucide | Consistentes e discretos |
| Gráficos | SVG próprio + alternativa tabular | Acessibilidade real (todo gráfico tem tabela equivalente em `<details>`) |

## Como executar

```bash
npm install
cp .env.example .env   # configure DATABASE_URL
npx drizzle-kit push   # cria as tabelas (datasets, records, documents)
npm run dev            # desenvolvimento
# ou
npm run build && npm run start   # produção
```

Requisitos: Node.js 20+, PostgreSQL acessível via `DATABASE_URL`.

## Como importar e atualizar as bases

1. **Exporte a planilha** do SharePoint (ou abra a planilha operacional) em `.xlsx` ou `.csv`.
2. Acesse **Importar** e arraste o arquivo (ou selecione). A leitura acontece no seu navegador;
   nada é enviado a serviços externos.
3. **Escolha a aba** (se o Excel tiver várias) e ajuste a **linha do cabeçalho**, se necessário.
4. Informe o **tipo de base** (Indiretos, Diretos, CAPEX ou outro), a **natureza**
   (base operacional ou snapshot semanal), o **modo** (substituir a base ativa da mesma área ou
   combinar) e a **data de referência**.
5. Revise o **mapeamento de colunas**. O painel sugere correspondências por nome (exatas e
   aproximadas — estas últimas vêm sinalizadas para confirmação). Colunas não mapeadas ficam
   preservadas nos detalhes do registro; nada é descartado.
6. Na **revisão**, veja linhas válidas, ignoradas (obrigatórios vazios ou duplicadas) e avisos de
   interpretação. Baixe o **relatório completo em CSV** se quiser auditar linha a linha.
7. **Confirme**. A gravação é transacional (ou importa tudo, ou nada é alterado). Os indicadores,
   gráficos e a busca passam a refletir exatamente o que foi importado.

**Substituir × combinar:** substituir arquiva a base anterior como “substituída” (ela sai dos
números, mas fica no histórico e alimenta o painel de **variação entre bases**). Combinar soma os
registros às bases ativas — use apenas quando os arquivos cobrirem recortes diferentes.

**Regras de interpretação (conservadoras, sempre sinalizadas):**
- Obrigatórios: identificador do processo e objeto/descrição. Linhas sem eles são ignoradas e listadas.
- Datas: `dd/mm/aaaa` e `aaaa-mm-dd` (Excel nativo também). Anos de 2 dígitos e formatos
  irreconhecíveis geram aviso e a linha é mantida sem a data.
- Números: `1.234,56` (pt-BR) e `1,234.56`. `3.054` em campo de quantidade é tratado como milhar
  **com aviso registrado** — divergências desse tipo devem ser validadas por uma pessoa.
- Situação “Concluído/Cancelado” só é inferida de textos claros (*concluído, finalizado, cancelado,
  anulado, revogado*). Vencido/a vencer/no prazo é **sempre calculado em relação a hoje**, nunca
  gravado fixo.
- Duplicadas (mesmo processo + objeto + área + prazo + fornecedor) são removidas dentro do mesmo
  arquivo, com a primeira ocorrência mantida e a remoção listada no relatório.

## Integridade e origem dos dados

- Cada registro carrega a **origem completa**: arquivo, aba, linha da planilha, tipo e natureza da
  base, data de referência e data de importação (visível em “Detalhes”).
- O cabeçalho do painel mostra a base de referência ativa; a página inicial lista todas as bases,
  contagens e avisos, com opção de excluir (com confirmação).
- **Não há sincronização automática com o SharePoint.** O painel reflete a última importação
  confirmada — a data dela fica sempre visível para não parecer dado “ao vivo”.
- Divergências (linhas ignoradas, avisos, bases de naturezas diferentes ativas, possível
  sobreposição de áreas) aparecem como **verificações de consistência** no panorama e nunca são
  “corrigidas” automaticamente.

## Testes

```bash
npm run build && npm run start   # sobe a app
node scripts/e2e-test.mjs         # testa importação, busca, filtros, exportação, documentos
```

O script `scripts/e2e-test.mjs` cobre: xlsx multi-abas com título antes do cabeçalho, CSV `;` com
acentos e vírgula decimal, mapeamento, validação, duplicadas, `3.054` como milhar, substituição de
base com variação, busca sem acento, filtros combinados, ordenação, paginação, exportação CSV
(BOM/`;`/anti-injeção de fórmula) e CRUD de documentos. Os dados de teste são marcados e removidos
ao final.

## Segurança e privacidade

- Leitura do arquivo 100% local (navegador); nenhum serviço de terceiros recebe a planilha.
- Validação de tipo/tamanho de arquivo e teto de 60.000 linhas por importação.
- A validação é **refeita no servidor** — o cliente nunca é fonte confiável.
- Valores importados são renderizados como texto (React escapa HTML por padrão); links externos
  usam `rel="noopener noreferrer"` e só aceitam `http(s)`.
- Exportação CSV com proteção contra injeção de fórmula (`=`, `+`, `-`, `@` no início da célula).
- Sem telemetria/rastreamento. Segredos apenas em variáveis de ambiente do servidor.

## Limitações conhecidas / pontos de decisão

- A soma de diferentes tipos de base no panorama é intencional quando você opta por “combinar”;
  o painel avisa quando naturezas diferentes (snapshot × operacional) estão ativas juntas.
- “Variação em relação à base anterior” compara apenas a **quantidade de processos** entre bases do
  mesmo tipo — não é um fechamento contábil.
- Impressão reproduz a tela atual; para listas completas use a exportação CSV (teto de 5.000 linhas
  por arquivo, com aviso embutido quando há corte).
- Sem autenticação por enquanto: em produção interna, coloque atrás da camada de acesso da fundação
  (ex.: SSO/reverse proxy) antes de publicar.
