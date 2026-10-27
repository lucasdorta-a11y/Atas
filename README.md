# Giro de Atas — versão estática para GitHub Pages

Painel interno de compras e Atas de Registro de Preços da Fundação Butantan. Esta versão foi adaptada para funcionar sem API, servidor ou PostgreSQL, usando processamento local de planilhas e IndexedDB no navegador.

## O que esta versão faz

- aceita até duas planilhas `.xlsx`, `.xls` ou `.csv` por importação;
- lê automaticamente todas as abas com dados e consolida as linhas;
- trata CSV com `;`, `,`, tabulação, acentos, UTF-8, Windows-1252, aspas e números pt-BR;
- inicia o mapeamento operacional com todos os campos como `não importar`, permitindo selecionar apenas o que será usado;
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

Para conferir uma planilha sem abrir o navegador, com Node.js 20+: o loader local transpila apenas os tipos necessários para os scripts.

```bash
# gera planilhas fictícias com o layout esperado (nomes e números inventados)
npm run amostras

# quais blocos são reconhecidos e com quais números
npm run extrair -- amostras/semana-atual.xlsx --ref=2026-10-13

# monta o StaticDashboardData completo que a tela usa
npm run panorama:dry-run -- amostras/semana-atual.xlsx --ref=2026-10-13

# compara atas FINALIZADO com a importação anterior
npm run panorama:dry-run -- amostras/semana-atual.xlsx --ref=2026-10-13 --anterior amostras/semana-anterior.xlsx --ref-anterior=2026-10-13
```

Os comandos usam o mesmo `SheetJS → matriz → extrator` da importação local e mostram os blocos reconhecidos, ausentes, fornecedores, evolução, previsões, atas concluídas e status das atas. A pasta `amostras/` é ignorada pelo Git.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` executa automaticamente em cada push na branch `main`:

1. instala as dependências;
2. remove, de forma defensiva, arquivos antigos de PostgreSQL/API caso tenham ficado no checkout;
3. executa `npm run build`;
4. publica `out/` com o Pages artifact;
5. faz o deploy com `actions/deploy-pages`.

Ao atualizar um repositório que antes usava a versão com PostgreSQL, não basta copiar arquivos novos por cima: remova também `src/db/`, `src/app/api/`, `src/lib/dashboard-data.ts` e `drizzle.config.json`. O workflow verifica que a página está usando `getStaticDashboardData` e interrompe com uma mensagem clara se a versão antiga ainda estiver no checkout.

No GitHub, configure **Settings → Pages → Source: GitHub Actions**. O endereço esperado é:

```text
https://lucasdorta-a11y.github.io/Atas/
```

## Atualização das bases

1. Abra **Importar**.
2. Selecione ou arraste até dois arquivos.
3. O painel lê todas as abas não vazias e mostra a quantidade de arquivos, abas e linhas.
4. Escolha a área, a natureza da base e a data de referência.
5. Revise o mapeamento; os campos operacionais começam como `não importar` e os campos essenciais são validados funcionalmente, sem marcadores visuais de “obrigatório”.
6. Confira o resumo e as ocorrências.
7. Baixe o relatório de validação, se necessário, e confirme a importação.
8. Escolha **Substituir** para arquivar a base ativa daquela área ou **Combinar** para manter bases diferentes ativas.

A origem, a data de referência, as linhas válidas, ignoradas, duplicadas e os avisos ficam visíveis na auditoria das bases.

## Mapeamento exato do painel consolidado

A importação reconhece os blocos do dashboard **somente** pelos nomes abaixo. Se um cabeçalho ou rótulo divergir, ele aparece como bloco não reconhecido para validação humana; não é feita uma inferência genérica. Na auditoria, os blocos têm rótulos legíveis em `SNAPSHOT_BLOCKS`; no panorama, cada bloco informa se veio do snapshot, dos registros operacionais ou se está ausente. Ausência significa que a planilha não trouxe aquele conteúdo, não que o valor seja zero.

As áreas usam uma paleta única em todo o painel: Indiretos verde-água (`#0b7c7b`), Diretos azul (`#0a6fd6`) e CAPEX laranja (`#fca500`). O botão de atualização reprocessa os dados do IndexedDB local sem backend.

### Cards de resumo (semana anterior × semana atual)

Na tabela `LEITURA DOS GRÁFICOS`, use exatamente as colunas `Gráfico`, `Situação apresentada`, `ATAS` e `ITENS`. Os rótulos aceitos são:

- `ATA CONCLUÍDAS (VÁLIDAS)` + `VÁLIDAS` → atas e itens concluídos;
- `ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)` + `COM SALDO` ou `CONSUMIDOS` → itens com saldo e sem saldo;
- `ATAS VENCIDAS E A VENCER` + `A VENCER (RENOVAR)` ou `VENCIDAS` → atas/itens a vencer e vencidos.

O extrator também aceita o layout visual atual da aba `CONTROLE ATAS CONCLUÍDAS`, em que os valores calculados aparecem em cartões separados: `ATA CONCLUÍDAS (VÁLIDAS)`, `ATAS EM ANDAMENTO`, `ITENS COM SALDO (VÁLIDOS)`, `ITENS SEM SALDO (VÁLIDOS)`, `ATAS VENCIDAS` e `ATAS A VENCER`. Ele procura os valores abaixo dos rótulos mesmo quando existem linhas formatadas ou células mescladas entre o título e os números. O card `ATAS EM ANDAMENTO (GERAL)` também pode vir do resumo com `QTD ATAS`/`QTD ITENS`, dois números na mesma linha ou célula composta. Sem esses quadros, o extrator soma as três áreas da tabela `EVOLUÇÃO POR ÁREA (EM ANDAMENTO)` somente quando as três existem. O painel mostra seis cards para a semana anterior e seis para a atual: concluídas, em andamento, itens com saldo, itens sem saldo, vencidas e a vencer. A referência inicial é 13/10, com 62/915 concluídas, 70/5.000 em andamento, 862 itens com saldo, 100 consumidos, 59/1.441 a vencer e 49/371 vencidas; novas importações passam a formar o histórico real. A seção de comparação também identifica a base atual e a anterior pela data de referência e pelo nome do arquivo; quando a anterior é a referência fixa fornecida nas capturas, isso fica explícito e ela é indicada como sem arquivo importado.

### Atas concluídas desde a última atualização

Logo abaixo dos cards, o painel lista as atas que passaram a `FINALIZADO` desde a importação anterior, uma linha por ata: descrição, contrato, fornecedor, quantidade de itens, comprador(a), área e valor. A fonte é a aba `Base - Atas Em andamento`, com as colunas `DESCRIÇÃO DOS LOTES ATAS`, `QTD ITENS`, `COMPRADOR`, `AREA`, `ETAPA ATUAL` e `N° CONTRATO`. O fornecedor é resolvido pela aba `Base - Controle de Contratos`, usando `Contrato`, `Item` ou `Material` e `Fornecedor`; códigos finais entre parênteses são removidos. Na primeira importação, todas as atas `FINALIZADO` representam a posição atual da base e não são classificadas como novas conclusões do período; depois, só as chaves ausentes na importação anterior aparecem.

### Valores, saving e redução

- Os valores principais devem estar nos rótulos exatos `VALOR DIRETOS`, `VALOR INDIRETOS` e `VALOR CAPEX`.
- O bloco de saving deve ter `Rótulos de Linha` (com `CAPEX`, `DIRETOS`, `INDIRETOS` e, se disponível, `Total Geral`), `VALOR CONTRATADO R$`, `SAVING HISTÓRICO R$`, `SAVING PROPOSTA INICIAL R$`, `REDUÇÃO HISTÓRICO %` e `REDUÇÃO PROPOSTA INICIAL %`.
- O painel preserva os percentuais fornecidos pela planilha; não recalcula silenciosamente um percentual divergente.

### Top 5 e representatividade

Os três blocos de compradores são identificados por `TOP COMP INDIRETOS`, `TOP COMP DIRETOS` e `TOP COMP CAPEX`, com `ITENS`, `ATAS` e `TOTAL ATAS ÁREA`. O painel ordena os cinco compradores por itens, exibe a soma das atas dos cinco e calcula a participação das áreas usando os totais de atas — as três áreas totalizam 100%.

A representatividade usa exclusivamente a tabela `FORNECEDORES GERAL`, com as colunas `FORNECEDOR`, `QTD ATAS`, `QTD ITENS`, `% CONCENTRAÇÃO DE ITENS` e `ANÁLISE`. O panorama exibe exatamente Top 4, `OUTROS FORNECEDORES` e `TOTAL`, preservando os números e a análise textual da planilha.

### Evolução e previsões

A evolução concluída aceita a estrutura vertical `ATA INDIRETOS | ATA DIRETOS | ATA CAPEX`, seguida por `TOTAL`, `QTD ATA`, a linha de valores, `QTD ITENS` e a linha de valores. Também mantém a leitura de saldo, sem saldo, vencidas e a vencer por área. O **EM ANDAMENTO** vem da tabela separada `EVOLUÇÃO POR ÁREA (EM ANDAMENTO)`, com `Rótulos de Linha`, `QTD ATAS` e `QTD ITENS`. O bloco de **Status das Atas** é lido exclusivamente da aba dedicada `Status das Atas`, sem fallback operacional.

As faixas exibidas no painel seguem a ordem cronológica e exclusiva da planilha: próximos 15 dias, até 30 dias, até 60 dias e previsões vencidas. A faixa `acima_60` continua sendo lida e calculada para preservar a integridade do snapshot, mas não é exibida na interface. Faixas de previsões canceladas e finalizadas podem ser importadas no snapshot, mas são deliberadamente ignoradas na interface. Se um bloco não for encontrado, o painel informa “bloco não encontrado” em vez de exibir zeros. Abaixo das faixas, o painel apresenta `Previsão de Conclusão por Mês`, com o mês de referência, os dois meses seguintes e `Vencida/Sem Previsão`, extraídos do pivô mensal; meses sem ano recebem o ano correto quando atravessam dezembro. A planilha complementar de cruzamento deve possuir as colunas exatas `COMPRADOR`, `AREA` e `PRAZO CONCLUSÃO` (e, quando disponíveis, `QTD ATAS` e `QTD ITENS`). A faixa dos compradores é calculada usando a data de referência da planilha, não a data em que a importação foi feita. As listas exibem somente nome, atas e itens: não há bolinha/foto nem o texto “ANALISTA DE COMPRAS”.

### Status das Atas por área

O bloco de status/renovações lê a aba dedicada atualizada junto com o resumo e reconhece uma faixa por área (`INDIRETOS`, `DIRETOS`, `CAPEX`). No layout atual do SharePoint/Excel, cada faixa traz os quadros `TOTAL A RENOVAR`, `VENCIDAS`, `ATÉ 15 DIAS` e `EM ANDAMENTO`, além da tabela `CONTRATO SAP | VENCIMENTO | COMPRADOR(A) | SITUAÇÃO`. Quando existe, a faixa `RENOVAÇÃO EM ANDAMENTO` também é exibida com contrato, comprador e vencimento. O extrator mantém compatibilidade com o layout anterior de carteira (`TOTAL`, `VIGENTES`, `VENCIDAS`, `ATÉ 15 DIAS`, `16 A 30 DIAS`, `A RENOVAR` e a carteira por comprador). Uma área não encontrada permanece explicitamente sinalizada.

No panorama, o botão **Tela cheia** oculta a barra lateral, o cabeçalho e o contexto da base para uma visualização limpa dos indicadores. O botão **Sair da tela cheia** restaura a navegação.

A busca dos blocos do panorama percorre todas as linhas de todas as abas, preservando também os separadores entre pivôs. O botão **Atualizar panorama** reprocessa o armazenamento local sem backend. Na etapa de mapeamento, os campos operacionais começam como **não importar**; os blocos específicos do panorama são detectados automaticamente e não precisam ser associados manualmente.

## Snapshots no GitHub Pages

Snapshots, registros operacionais, documentos e histórico ficam no IndexedDB local. Eles **não são compartilhados entre usuários, máquinas ou dispositivos**, não sincronizam com SharePoint e não são enviados para uma API. Para substituir a leitura atual, importe a planilha consolidada com o modo **Substituir**; o snapshot anterior continua arquivado localmente para a comparação.

## Testes realizados

- `npm run typecheck`
- `npm run build` com export estático
- smoke test das rotas `/`, `/importar/`, `/processos/` e `/documentos/` no servidor de desenvolvimento
- validação local compartilhada entre preview e gravação, incluindo múltiplos arquivos e abas

## Decisões de dados

O painel não inventa números nem corrige divergências silenciosamente. Datas e números ambíguos geram avisos, linhas sem identificador ou objeto são ignoradas com justificativa e colunas extras permanecem acessíveis nos detalhes.
