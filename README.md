# Giro de Atas — versão estática para GitHub Pages

Painel interno de compras e Atas de Registro de Preços da Fundação Butantan. Esta versão foi adaptada para funcionar sem API, servidor ou PostgreSQL, usando processamento local de planilhas e IndexedDB no navegador.

## O que esta versão faz

- aceita até duas planilhas `.xlsx`, `.xls` ou `.csv` por importação;
- lê automaticamente todas as abas com dados e consolida as linhas;
- trata CSV com `;`, `,`, tabulação, acentos, UTF-8, Windows-1252, aspas e números pt-BR;
- sugere e permite revisar o mapeamento das colunas;
- valida identificadores, objetos, datas, quantidades, valores, duplicidades e links;
- alimenta o panorama, a busca, filtros, paginação e exportação CSV com os dados confirmados;
- preserva colunas não mapeadas nos detalhes dos registros;
- mantém o histórico de bases substituídas no armazenamento local;
- apresenta consumo, saving, renovações, fornecedores, compradores e previsões por área;
- oferece a seção de documentos e regras de preenchimento;
- gera um site estático em `out/` para GitHub Pages.

## Limitação importante

GitHub Pages serve apenas arquivos estáticos. Os dados importados ficam no **IndexedDB do navegador em que a importação foi feita**. Portanto:

- não há sincronização entre usuários, máquinas ou navegadores;
- não há atualização automática do SharePoint;
- limpar os dados do site ou trocar de navegador pode remover as bases locais;
- documentos e bases não são enviados para um serviço externo pelo painel.

Para uma base compartilhada e multiusuário, use a versão `main` original com Next.js, API e PostgreSQL em Vercel, Railway, Render ou outro ambiente com servidor. Esta branch prioriza a publicação direta no GitHub Pages.

## Desenvolvimento local

Requisitos: Node.js 20+.

```bash
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para validar a exportação estática:

```bash
npm run typecheck
npm run build
```

O build cria `out/`. Em produção o site usa o subcaminho `/Atas`, que corresponde ao repositório `lucasdorta-a11y/Atas`; no servidor de desenvolvimento o projeto roda na raiz.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` executa automaticamente em cada push na branch `main`:

1. instala as dependências;
2. executa `npm run build`;
3. publica `out/` com o Pages artifact;
4. faz o deploy com `actions/deploy-pages`.

No GitHub, configure **Settings → Pages → Source: GitHub Actions**. O endereço esperado é:

```text
https://lucasdorta-a11y.github.io/Atas/
```

## Atualização das bases

1. Abra **Importar**.
2. Selecione ou arraste até dois arquivos.
3. O painel lê todas as abas não vazias e mostra a quantidade de arquivos, abas e linhas.
4. Escolha a área, a natureza da base e a data de referência.
5. Revise o mapeamento sugerido; campos obrigatórios são identificador e objeto.
6. Confira o resumo e as ocorrências.
7. Baixe o relatório de validação, se necessário, e confirme a importação.
8. Escolha **Substituir** para arquivar a base ativa daquela área ou **Combinar** para manter bases diferentes ativas.

A origem, a data de referência, as linhas válidas, ignoradas, duplicadas e os avisos ficam visíveis na auditoria das bases.

## Mapeamento exato do painel consolidado

A importação reconhece os blocos do dashboard **somente** pelos nomes abaixo. Se um cabeçalho ou rótulo divergir, ele aparece como bloco não reconhecido para validação humana; não é feita uma inferência genérica.

### Três gráficos e KPIs

Na tabela `LEITURA DOS GRÁFICOS`, use exatamente as colunas `Gráfico`, `Situação apresentada`, `ATAS` e `ITENS`. Os rótulos aceitos são:

- `ATA CONCLUÍDAS (VÁLIDAS)` + `VÁLIDAS` → atas e itens concluídos;
- `ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)` + `COM SALDO` ou `CONSUMIDOS` → itens com saldo e consumidos;
- `ATAS VENCIDAS E A VENCER` + `A VENCER (RENOVAR)` ou `VENCIDAS` → atas/itens a vencer e vencidos.

A comparação semanal mostra os três gráficos da semana anterior acima dos três da semana atual. A primeira referência exibida é 28/09, com os valores da captura fornecida (58/956, 877/80, 58/1.215 e 48/334). Depois de uma nova importação, a leitura anterior permanece no histórico e passa a ser automaticamente a semana anterior.

### Valores, saving e redução

- Os valores principais devem estar nos rótulos exatos `VALOR DIRETOS`, `VALOR INDIRETOS` e `VALOR CAPEX`.
- O bloco de saving deve ter `Rótulos de Linha` (com `CAPEX`, `DIRETOS`, `INDIRETOS` e, se disponível, `Total Geral`), `VALOR CONTRATADO R$`, `SAVING HISTÓRICO R$`, `SAVING PROPOSTA INICIAL R$`, `REDUÇÃO HISTÓRICO %` e `REDUÇÃO PROPOSTA INICIAL %`.
- O painel preserva os percentuais fornecidos pela planilha; não recalcula silenciosamente um percentual divergente.

### Top 5 e representatividade

Os três blocos de compradores são identificados por `TOP COMP INDIRETOS`, `TOP COMP DIRETOS` e `TOP COMP CAPEX`, com `ITENS`, `ATAS` e `TOTAL ATAS ÁREA`. O painel ordena os cinco compradores por itens, exibe a soma das atas dos cinco e calcula a participação das áreas usando os totais de atas — as três áreas totalizam 100%.

A representatividade de fornecedores é lida 1:1 pelas colunas `FORNECEDOR`, `QTD ATAS`, `QTD ITENS`, `% CONCENTRAÇÃO DE ITENS` e `ANÁLISE`, separada por Indiretos, Diretos e CAPEX. A análise textual informada na planilha é preservada.

### Evolução e previsões

A evolução por área usa os blocos/colunas específicos de atas concluídas, andamento, saldo, sem saldo, vencidas e a vencer para Indiretos, Diretos e CAPEX: `ATA INDIRETOS`/`ATA DIRETOS`/`ATA CAPEX` com `QTD ATA` e `QTD ITENS`; `ITEM SALDO V INDIRETOS`/`DIRETOS`/`CAPEX`; `ITEM S/SALDO INDIRETOS`/`DIRETOS`/`CAPEX`; `VENCIDAS INDIRETOS`/`DIRETOS`/`CAPEX`; e `A VENCER INDIRETOS`/`DIRETOS`/`CAPEX`. O bloco de **Status de renovações** permanece visível e não tem alteração funcional nesta versão.

Para previsões, a planilha complementar deve possuir as colunas exatas `COMPRADOR`, `AREA` e `PRAZO CONCLUSÃO` (e, quando disponíveis, `QTD ATAS` e `QTD ITENS`). O cruzamento é feito por comprador + área + prazo. A faixa vermelha **Previsões vencidas** aparece abaixo da faixa de até 60 dias, separada por área. As listas exibem somente nome, atas e itens: não há bolinha/foto nem o texto “ANALISTA DE COMPRAS”.

## Snapshots no GitHub Pages

Snapshots, registros operacionais, documentos e histórico ficam no IndexedDB local. Eles **não são compartilhados entre usuários, máquinas ou dispositivos**, não sincronizam com SharePoint e não são enviados para uma API. Para substituir a leitura atual, importe a planilha consolidada com o modo **Substituir**; o snapshot anterior continua arquivado localmente para a comparação.

## Testes realizados

- `npm run typecheck`
- `npm run build` com export estático
- smoke test das rotas `/`, `/importar/`, `/processos/` e `/documentos/` no servidor de desenvolvimento
- validação local compartilhada entre preview e gravação, incluindo múltiplos arquivos e abas

## Decisões de dados

O painel não inventa números nem corrige divergências silenciosamente. Datas e números ambíguos geram avisos, linhas sem identificador ou objeto são ignoradas com justificativa e colunas extras permanecem acessíveis nos detalhes.
