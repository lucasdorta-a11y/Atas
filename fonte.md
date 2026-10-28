# Giro de Atas — Código-fonte consolidado

Documento gerado a partir do projeto atual para publicação estática no GitHub Pages.

> Para gerar novamente: `npm run docs:fonte`.

## Sumário

- [.github/workflows/deploy.yml](#githubworkflowsdeployyml)
- [.gitignore](#gitignore)
- [README.md](#readmemd)
- [eslint.config.mjs](#eslintconfigmjs)
- [next-env.d.ts](#nextenvdts)
- [next.config.ts](#nextconfigts)
- [package-lock.json](#packagelockjson)
- [package.json](#packagejson)
- [postcss.config.mjs](#postcssconfigmjs)
- [public/.nojekyll](#publicnojekyll)
- [scripts/dev/alias-loader.mjs](#scriptsdevaliasloadermjs)
- [scripts/dev/extrair-snapshot.mts](#scriptsdevextrairsnapshotmts)
- [scripts/dev/gerar-amostras.mts](#scriptsdevgeraramostrasmts)
- [scripts/dev/panorama-dry-run.mts](#scriptsdevpanoramadryrunmts)
- [scripts/dev/register.mjs](#scriptsdevregistermjs)
- [scripts/dev/stubs/static-store.mts](#scriptsdevstubsstaticstoremts)
- [scripts/gerar-codigo-fonte.mjs](#scriptsgerarcodigofontemjs)
- [src/app/documentos/page.tsx](#srcappdocumentospagetsx)
- [src/app/globals.css](#srcappglobalscss)
- [src/app/importar/page.tsx](#srcappimportarpagetsx)
- [src/app/layout.tsx](#srcapplayouttsx)
- [src/app/page.tsx](#srcapppagetsx)
- [src/app/processos/page.tsx](#srcappprocessospagetsx)
- [src/components/app-shell.tsx](#srccomponentsappshelltsx)
- [src/components/atas-concluidas.tsx](#srccomponentsatasconcluidastsx)
- [src/components/charts.tsx](#srccomponentschartstsx)
- [src/components/datasets-panel.tsx](#srccomponentsdatasetspaneltsx)
- [src/components/documents-manager.tsx](#srccomponentsdocumentsmanagertsx)
- [src/components/fornecedores-analise.tsx](#srccomponentsfornecedoresanalisetsx)
- [src/components/import-wizard.tsx](#srccomponentsimportwizardtsx)
- [src/components/processos-browser.tsx](#srccomponentsprocessosbrowsertsx)
- [src/components/resumo-cards.tsx](#srccomponentsresumocardstsx)
- [src/components/status-atas.tsx](#srccomponentsstatusatastsx)
- [src/components/ui.tsx](#srccomponentsuitsx)
- [src/lib/client-parse.ts](#srclibclientparsets)
- [src/lib/csv.ts](#srclibcsvts)
- [src/lib/dashboard-snapshot.ts](#srclibdashboardsnapshotts)
- [src/lib/domain.ts](#srclibdomaints)
- [src/lib/format.ts](#srclibformatts)
- [src/lib/mapping.ts](#srclibmappingts)
- [src/lib/static-dashboard.ts](#srclibstaticdashboardts)
- [src/lib/static-store.ts](#srclibstaticstorets)
- [tsconfig.json](#tsconfigjson)

---

## `.github/workflows/deploy.yml`

````yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Enforce static Pages source
        run: |
          # This repository must never type-check or export the old PostgreSQL/API tree.
          # The cleanup is defensive for repositories updated by copying files over an
          # older checkout, where deleted files can otherwise remain in GitHub.
          rm -rf src/db src/app/api
          rm -f src/lib/dashboard-data.ts drizzle.config.json
          if grep -R "getDashboardData" -n src/app src/lib 2>/dev/null; then
            echo "The checkout still contains the server-backed dashboard. Replace it with the static GitHub Pages source."
            exit 1
          fi
      - name: Build static site
        run: npm run build
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v4
````

## `.gitignore`

````text
# dependencies
node_modules/
.pnp
.pnp.*

# next.js
.next/
out/
build/
dist/

# production
*.tsbuildinfo

# environment
.env
.env.*
!.env.example

# drizzle
drizzle/

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# os
.DS_Store
Thumbs.db
desktop.ini

# ide
.vscode/
.idea/
*.swp
*.swo

# misc
*.local

# Planilhas de amostra usadas só para testar o extrator localmente
amostras/
````

## `README.md`

````markdown
# Giro de Atas — versão estática para GitHub Pages

Painel interno de compras e Atas de Registro de Preços da Fundação Butantan. Esta versão foi adaptada para funcionar sem API, servidor ou PostgreSQL, usando processamento local de planilhas e IndexedDB no navegador.

## O que esta versão faz

- aceita até duas planilhas `.xlsx`, `.xls` ou `.csv` por importação;
- lê automaticamente todas as abas com dados e consolida as linhas;
- trata CSV com `;`, `,`, tabulação, acentos, UTF-8, Windows-1252, aspas e números pt-BR;
- reconhece automaticamente os blocos consolidados das abas `GIRO 01–07`, sem mapeamento manual de colunas operacionais;
- mostra um resumo visual dos blocos encontrados e sinaliza os que não vieram na fonte, sem preencher ausências com zeros;
- alimenta o panorama com o snapshot confirmado e mantém a consulta de processos, filtros, paginação e exportação CSV para registros operacionais já salvos;
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
4. Na etapa **Tipo de base**, escolha somente **Substituir** ou **Combinar** e informe a data de referência.
5. Confira o **Resumo automático**: os blocos reconhecidos são apresentados visualmente e os ausentes permanecem explicitamente ausentes.
6. Revise a importação do snapshot, sem mapeamento operacional e sem criação de processos por inferência.
7. Baixe o relatório de validação, se necessário, e confirme a importação.
8. **Substituir** arquiva a leitura ativa no histórico; **Combinar** mantém as bases locais ativas.

A origem, a data de referência, os blocos reconhecidos/ausentes e os avisos ficam visíveis na auditoria das bases.

## Leitura exata do painel consolidado

A importação reconhece os blocos do dashboard **somente** pelos nomes abaixo. Se um cabeçalho ou rótulo divergir, ele aparece como bloco não reconhecido para validação humana; não é feita uma inferência genérica. Na auditoria, os blocos têm rótulos legíveis em `SNAPSHOT_BLOCKS`; no panorama, cada bloco informa se veio do snapshot, dos registros operacionais ou se está ausente. Ausência significa que a planilha não trouxe aquele conteúdo, não que o valor seja zero.

As áreas usam uma paleta única em todo o painel: Indiretos verde-água (`#0b7c7b`), Diretos azul (`#0a6fd6`) e CAPEX laranja (`#fca500`). O botão de atualização reprocessa os dados do IndexedDB local sem backend.

### Cards de resumo (semana anterior × semana atual)

Na tabela `LEITURA DOS GRÁFICOS`, use exatamente as colunas `Gráfico`, `Situação apresentada`, `ATAS` e `ITENS`. Os rótulos aceitos são:

- `ATA CONCLUÍDAS (VÁLIDAS)` + `VÁLIDAS` → atas e itens concluídos;
- `ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)` + `COM SALDO` ou `CONSUMIDOS` → itens com saldo e sem saldo;
- `ATAS VENCIDAS E A VENCER` + `A VENCER (RENOVAR)` ou `VENCIDAS` → atas/itens a vencer e vencidos.

O extrator também aceita o layout visual atual da aba `CONTROLE ATAS CONCLUÍDAS`, em que os valores calculados aparecem em cartões separados: `ATA CONCLUÍDAS (VÁLIDAS)`, `ATAS EM ANDAMENTO`, `ITENS COM SALDO (VÁLIDOS)`, `ITENS SEM SALDO (VÁLIDOS)`, `ATAS VENCIDAS` e `ATAS A VENCER`. Ele procura os valores abaixo dos rótulos mesmo quando existem linhas formatadas ou células mescladas entre o título e os números. Quando a aba nomeada `GIRO 01 - Panorama` está presente, somente o bloco `Status Atual` é lido; o bloco da semana anterior não é importado, pois a comparação anterior é controlada pelo histórico local do site. O card `ATAS EM ANDAMENTO (GERAL)` também pode vir do resumo com `QTD ATAS`/`QTD ITENS`, dois números na mesma linha ou célula composta. Sem esses quadros, o extrator soma as três áreas da tabela `EVOLUÇÃO POR ÁREA (EM ANDAMENTO)` somente quando as três existem. O painel mostra seis cards para a semana anterior e seis para a atual: concluídas, em andamento, itens com saldo, itens sem saldo, vencidas e a vencer. A referência inicial é 13/10, com 62/915 concluídas, 70/5.000 em andamento, 862 itens com saldo, 100 consumidos, 59/1.441 a vencer e 49/371 vencidas; novas importações passam a formar o histórico real. A seção de comparação também identifica a base atual e a anterior pela data de referência e pelo nome do arquivo; quando a anterior é a referência fixa fornecida nas capturas, isso fica explícito e ela é indicada como sem arquivo importado.

Quando existem as abas consolidadas `GIRO 01 - Panorama`, `GIRO 02 - Concluídas`, `GIRO 03 - Resumo`, `GIRO 04 - Evolução`, `GIRO 05 - Renovações`, `GIRO 06 - Faixas` e `GIRO 07 - Mensal`, elas têm prioridade sobre os blocos genéricos antigos. A etapa seguinte ao tipo de base exibe um resumo automático dos blocos encontrados; não há mapeamento de campos operacionais. O fallback anterior continua disponível para bases sem as abas `GIRO`.

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

A busca dos blocos do panorama percorre todas as linhas de todas as abas, preservando também os separadores entre pivôs. O botão **Atualizar panorama** reprocessa o armazenamento local sem backend. Na etapa de **Resumo automático**, os blocos específicos do panorama são detectados pelos nomes exatos e não precisam ser associados manualmente.

## Snapshots no GitHub Pages

Snapshots, registros operacionais, documentos e histórico ficam no IndexedDB local. Eles **não são compartilhados entre usuários, máquinas ou dispositivos**, não sincronizam com SharePoint e não são enviados para uma API. Para substituir a leitura atual, importe a planilha consolidada com o modo **Substituir**; o snapshot anterior continua arquivado localmente para a comparação.

## Testes realizados

- `npm run typecheck`
- `npm run build` com export estático
- smoke test das rotas `/`, `/importar/`, `/processos/` e `/documentos/` no servidor de desenvolvimento
- validação local compartilhada entre preview e gravação, incluindo múltiplos arquivos e abas

## Decisões de dados

O painel não inventa números nem corrige divergências silenciosamente. Blocos ausentes permanecem ausentes, a leitura usa os nomes exatos do layout e o histórico local preserva cada snapshot importado.
````

## `eslint.config.mjs`

````javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
````

## `next-env.d.ts`

````typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
````

## `next.config.ts`

````typescript
import type { NextConfig } from "next";

// O site publicado no Pages vive em /Atas. Durante o desenvolvimento local,
// mantemos a raiz / para que a prévia e o servidor dev sejam acessíveis.
const isStaticProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isStaticProduction ? "/Atas" : "",
  assetPrefix: isStaticProduction ? "/Atas/" : "",
  trailingSlash: true,
  images: { unoptimized: true },
  // Permite a prévia do ambiente de desenvolvimento em *.e2b.app sem
  // afetar a exportação estática publicada no GitHub Pages.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
````

## `package-lock.json`

````json
{
  "name": "giro-de-atas-pages",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "giro-de-atas-pages",
      "dependencies": {
        "clsx": "^2.1.1",
        "lucide-react": "^1.52.0",
        "next": "16.2.6",
        "react": "19.2.6",
        "react-dom": "19.2.6",
        "xlsx": "^0.18.5"
      },
      "devDependencies": {
        "@tailwindcss/postcss": "4.1.17",
        "@types/node": "22.19.15",
        "@types/react": "19.2.14",
        "@types/react-dom": "19.2.3",
        "eslint": "9.39.4",
        "eslint-config-next": "16.2.6",
        "postcss": "8.5.8",
        "tailwindcss": "4.1.17",
        "typescript": "5.9.3"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.3.0.tgz",
      "integrity": "sha512-U4+70Pc5ZS9osnCBCE5Jha/ciHM+Yp+CNMNC/7HvYbNRk1Ldd+f7qO65W5qfhu/TCv+/ozljlXXe9Nj8419DMA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helpers": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/template": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.8.tgz",
      "integrity": "sha512-gZbepsdh3WDtgZKWL+vTPh71LSBrm/Y4/QDZBVCcYfmeTEEuoOYwlSy+G1StfJg+/Zy550u/3TATbm7qDbbMtg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.8",
        "@babel/types": "^7.29.8",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-globals": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-globals/-/helper-globals-7.29.7.tgz",
      "integrity": "sha512-3nQVUAtvkKH9zahfWgw96Jc/uFOmjACE1kQz82E2lqWmHBgjzbNlsC22nuQTfahmWeQtTq5nQ/4Nnd2A1wj4zA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.29.7.tgz",
      "integrity": "sha512-ejHwrQQYcm9xnTivShn2IDOlIzInN34AXskvq9QicvCtEzq1Vzclu/tKF8Jq1Cg8JG2GL6/EmjgsCT7lXepE3g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.29.7.tgz",
      "integrity": "sha512-UPUVSyXbOh627KiCIGQSgwWzGeBKLkaJ9PJEdrngIwMSzxLR4jS4+f1f1jb7VzBbg8nFLaYotvVPFCTqdrmTAg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-module-imports": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7",
        "@babel/traverse": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.29.7.tgz",
      "integrity": "sha512-Pb5ijPrZ89GDH8223L4UP8i6QApWxs04RbPQJTeWDV0/keR2E36MeKnyr6LYmUUvqRRI+Iv87SuF1W6ErINzYw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.29.7.tgz",
      "integrity": "sha512-qehxGkRj55h/ff8EMaJ+cYhyaKlHIxqYDn682wQD7RNp9UujOQsHog2uS0r2vzr4pW+sXf90NeeayjcNaX3fFg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.29.7.tgz",
      "integrity": "sha512-N9ZErrD+yW5geCDtBqnOoxmR8+tNKiGuxKlDpuJxfsqpa2dFcexaziGAE/qoHLiDDreVNMupxGmSoNlyvsA3gw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.29.10.tgz",
      "integrity": "sha512-EMCx3AGZ3WfAl6ht7AyQoPm2Lh+BGYEMdc4Q6Hf7uSCDOZFuLq44qNwL+iaim8VlyYhRAo4X43+weadK8ZB4Yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.29.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.29.9.tgz",
      "integrity": "sha512-CjXrNHTnvqBVqHgdBysY3vk2T8tpJHb5/RMeHJBTyVa9xgugCB0CJTx/3oO8RV2QRQP391RWpB7D6hLjm8V9uA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.8"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.29.7.tgz",
      "integrity": "sha512-puq+Gf35oI24FeN11LkoUQFqv9uwNeWpxXZi/Ji3rRIoKAzKnxRaZ+Gkj0vKS9ZCiTESfng1N9LyOyXvo+m+Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.29.10.tgz",
      "integrity": "sha512-B3lYAs2nkKskbgQ1nfy8Ma9ao9Q1rntTAQHrzzyDuj+TSO+X3le6PfWwqDvodsb+OumE10eMFfuMCTQSQ5iuIQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.8",
        "@babel/helper-globals": "^7.29.7",
        "@babel/parser": "^7.29.9",
        "@babel/template": "^7.29.7",
        "@babel/types": "^7.29.8",
        "debug": "^4.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.29.8",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.29.8.tgz",
      "integrity": "sha512-Vj1jF3cPfxg7OAfoI7QnVKLoILlm2JF9pnVHrX8qx7AHMiYWT+NDAA7jChlNgRS4WTLc/fD1lXLmPixluj+3Gg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.29.7",
        "@babel/helper-validator-identifier": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@emnapi/core": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/@emnapi/core/-/core-1.10.0.tgz",
      "integrity": "sha512-yq6OkJ4p82CAfPl0u9mQebQHKPJkY7WrIuk205cTYnYe+k2Z8YBh11FrbRG/H6ihirqcacOgl2BIO8oyMQLeXw==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/wasi-threads": "1.2.1",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/runtime": {
      "version": "1.11.3",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.11.3.tgz",
      "integrity": "sha512-Xz4Tpyki7XyrpbUK1jR1AhdAdaXyhhY4lZ3neLodmhpuWfy2PAQN5B46sAiU4liOXGLkHypn/qU+jvfWSCYYLA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@emnapi/wasi-threads": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@emnapi/wasi-threads/-/wasi-threads-1.2.1.tgz",
      "integrity": "sha512-uTII7OYF+/Mes/MrcIOYp5yOtSMLBWSIoLPpcgwipoiKbli6k322tcoFsxoIIxPDqW01SQGAgko4EzZi2BNv2w==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.10.1",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.10.1.tgz",
      "integrity": "sha512-cuadcxVFE8sDK6iWJbs8Sn0av2Nrh2QSGQhVlBW9AaAHqHwjWsZHT8LJ4hFGPh7ASBV2deFdM7H/DPjulmh8rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^3.4.3"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.12.2",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.12.2.tgz",
      "integrity": "sha512-EriSTlt5OC9/7SXkRSCAhfSxxoSUgBm33OH+IkwbdpgoqsSsUg7y3uh+IICI/Qg4BBWr3U2i39RpmycbxMq4ew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/config-array": {
      "version": "0.21.2",
      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.21.2.tgz",
      "integrity": "sha512-nJl2KGTlrf9GjLimgIru+V/mzgSK0ABCDQRvxw5BjURL7WfH5uoWmizbH7QB6MmnMBd8cIC9uceWnezL1VZWWw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/object-schema": "^2.1.7",
        "debug": "^4.3.1",
        "minimatch": "^3.1.5"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/config-helpers": {
      "version": "0.4.2",
      "resolved": "https://registry.npmjs.org/@eslint/config-helpers/-/config-helpers-0.4.2.tgz",
      "integrity": "sha512-gBrxN88gOIf3R7ja5K9slwNayVcZgK6SOUORm2uBzTeIEfeVaIhOpCtTox3P6R7o2jLFwLFTLnC7kU/RGcYEgw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/core": "^0.17.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/core": {
      "version": "0.17.0",
      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-0.17.0.tgz",
      "integrity": "sha512-yL/sLrpmtDaFEiUj1osRP4TI2MDz1AddJL+jZ7KSqvBuliN4xqYY54IfdN8qD8Toa6g1iloph1fxQNkjOxrrpQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@types/json-schema": "^7.0.15"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "3.3.7",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-3.3.7.tgz",
      "integrity": "sha512-F42g89Qd5oAWtp0k0nnSrjziAKza7w8SVT4mStc18LZMaRb4J1HQAHLCalEtDCxrTuksx7NU9qsmeLwpOfPqWw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.14.0",
        "debug": "^4.3.2",
        "espree": "^10.0.1",
        "globals": "^14.0.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.3.2",
        "minimatch": "^3.1.5",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/js": {
      "version": "9.39.4",
      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.39.4.tgz",
      "integrity": "sha512-nE7DEIchvtiFTwBw4Lfbu59PG+kCofhjsKaCWzxTpt4lfRjRMqG6uMBzKXuEcyXhOHoUp9riAm7/aWYGhXZ9cw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      }
    },
    "node_modules/@eslint/object-schema": {
      "version": "2.1.7",
      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-2.1.7.tgz",
      "integrity": "sha512-VtAOaymWVfZcmZbp6E2mympDIHvyjXs/12LqWYjVw6qjrfF+VK+fyG33kChz3nnK+SU5/NeHOqrTEHS8sXO3OA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/plugin-kit": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.4.1.tgz",
      "integrity": "sha512-43/qtrDUokr7LJqoF2c3+RInu/t4zfrpYdoSDfYyhg52rwLV6TnOvdG4fXm7IkSB3wErkcmJS9iEhjVtOSEjjA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/core": "^0.17.0",
        "levn": "^0.4.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@humanfs/core": {
      "version": "0.19.2",
      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.2.tgz",
      "integrity": "sha512-UhXNm+CFMWcbChXywFwkmhqjs3PRCmcSa/hfBgLIb7oQ5HNb1wS0icWsGtSAUNgefHeI+eBrA8I1fxmbHsGdvA==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/types": "^0.15.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/node": {
      "version": "0.16.8",
      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.8.tgz",
      "integrity": "sha512-gE1eQNZ3R++kTzFUpdGlpmy8kDZD/MLyHqDwqjkVQI0JMdI1D51sy1H958PNXYkM2rAac7e5/CnIKZrHtPh3BQ==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/core": "^0.19.2",
        "@humanfs/types": "^0.15.0",
        "@humanwhocodes/retry": "^0.4.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/types": {
      "version": "0.15.0",
      "resolved": "https://registry.npmjs.org/@humanfs/types/-/types-0.15.0.tgz",
      "integrity": "sha512-ZZ1w0aoQkwuUuC7Yf+7sdeaNfqQiiLcSRbfI08oAxqLtpXQr9AIVX7Ay7HLDuiLYAaFPu8oBYNq/QIi9URHJ3Q==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/retry": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.4.3.tgz",
      "integrity": "sha512-bV0Tgo9K4hfPCek+aMAn81RppFKv2ySDQeMoSZuvTASywNTnVJCArCZE2FWqpvIatKu7VMRLWlR1EazvVhDyhQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@img/colour": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@img/colour/-/colour-1.1.0.tgz",
      "integrity": "sha512-Td76q7j57o/tLVdgS746cYARfSyxk8iEfRxewL9h4OMzYhbW4TAcppl0mT4eyqXddh6L/jwoM75mo7ixa/pCeQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@img/sharp-darwin-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-arm64/-/sharp-darwin-arm64-0.34.5.tgz",
      "integrity": "sha512-imtQ3WMJXbMY4fxb/Ndp6HBTNVtWCUI0WdobyheGf5+ad6xX8VIDO8u2xE4qc/fr08CKG/7dDseFtn6M6g/r3w==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-darwin-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-darwin-x64/-/sharp-darwin-x64-0.34.5.tgz",
      "integrity": "sha512-YNEFAF/4KQ/PeW0N+r+aVVsoIY0/qxxikF2SWdp+NRkmMB7y9LBZAVqQ4yhGCm/H3H270OSykqmQMKLBhBJDEw==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-darwin-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-arm64/-/sharp-libvips-darwin-arm64-1.2.4.tgz",
      "integrity": "sha512-zqjjo7RatFfFoP0MkQ51jfuFZBnVE2pRiaydKJ1G/rHZvnsrHAOcQALIi9sA5co5xenQdTugCvtb1cuf78Vf4g==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-darwin-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-darwin-x64/-/sharp-libvips-darwin-x64-1.2.4.tgz",
      "integrity": "sha512-1IOd5xfVhlGwX+zXv2N93k0yMONvUlANylbJw1eTah8K/Jtpi15KC+WSiaX/nBmbm2HxRM1gZ0nSdjSsrZbGKg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "darwin"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm/-/sharp-libvips-linux-arm-1.2.4.tgz",
      "integrity": "sha512-bFI7xcKFELdiNCVov8e44Ia4u2byA+l3XtsAj+Q8tfCwO6BQ8iDojYdvoPMqsKDkuoOo+X6HZA0s0q11ANMQ8A==",
      "cpu": [
        "arm"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-arm64/-/sharp-libvips-linux-arm64-1.2.4.tgz",
      "integrity": "sha512-excjX8DfsIcJ10x1Kzr4RcWe1edC9PquDRRPx3YVCvQv+U5p7Yin2s32ftzikXojb1PIFc/9Mt28/y+iRklkrw==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-ppc64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-ppc64/-/sharp-libvips-linux-ppc64-1.2.4.tgz",
      "integrity": "sha512-FMuvGijLDYG6lW+b/UvyilUWu5Ayu+3r2d1S8notiGCIyYU/76eig1UfMmkZ7vwgOrzKzlQbFSuQfgm7GYUPpA==",
      "cpu": [
        "ppc64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-riscv64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-riscv64/-/sharp-libvips-linux-riscv64-1.2.4.tgz",
      "integrity": "sha512-oVDbcR4zUC0ce82teubSm+x6ETixtKZBh/qbREIOcI3cULzDyb18Sr/Wcyx7NRQeQzOiHTNbZFF1UwPS2scyGA==",
      "cpu": [
        "riscv64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-s390x": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-s390x/-/sharp-libvips-linux-s390x-1.2.4.tgz",
      "integrity": "sha512-qmp9VrzgPgMoGZyPvrQHqk02uyjA0/QrTO26Tqk6l4ZV0MPWIW6LTkqOIov+J1yEu7MbFQaDpwdwJKhbJvuRxQ==",
      "cpu": [
        "s390x"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linux-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linux-x64/-/sharp-libvips-linux-x64-1.2.4.tgz",
      "integrity": "sha512-tJxiiLsmHc9Ax1bz3oaOYBURTXGIRDODBqhveVHonrHJ9/+k89qbLl0bcJns+e4t4rvaNBxaEZsFtSfAdquPrw==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-arm64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-arm64/-/sharp-libvips-linuxmusl-arm64-1.2.4.tgz",
      "integrity": "sha512-FVQHuwx1IIuNow9QAbYUzJ+En8KcVm9Lk5+uGUQJHaZmMECZmOlix9HnH7n1TRkXMS0pGxIJokIVB9SuqZGGXw==",
      "cpu": [
        "arm64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-libvips-linuxmusl-x64": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/@img/sharp-libvips-linuxmusl-x64/-/sharp-libvips-linuxmusl-x64-1.2.4.tgz",
      "integrity": "sha512-+LpyBk7L44ZIXwz/VYfglaX/okxezESc6UxDSoyo2Ks6Jxc4Y7sGjpgU9s4PMgqgjj1gZCylTieNamqA1MF7Dg==",
      "cpu": [
        "x64"
      ],
      "license": "LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "linux"
      ],
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-linux-arm": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm/-/sharp-linux-arm-0.34.5.tgz",
      "integrity": "sha512-9dLqsvwtg1uuXBGZKsxem9595+ujv0sJ6Vi8wcTANSFpwV/GONat5eCkzQo/1O6zRIkh0m/8+5BjrRr7jDUSZw==",
      "cpu": [
        "arm"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-arm64/-/sharp-linux-arm64-0.34.5.tgz",
      "integrity": "sha512-bKQzaJRY/bkPOXyKx5EVup7qkaojECG6NLYswgktOZjaXecSAeCWiZwwiFf3/Y+O1HrauiE3FVsGxFg8c24rZg==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-ppc64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-ppc64/-/sharp-linux-ppc64-0.34.5.tgz",
      "integrity": "sha512-7zznwNaqW6YtsfrGGDA6BRkISKAAE1Jo0QdpNYXNMHu2+0dTrPflTLNkpc8l7MUP5M16ZJcUvysVWWrMefZquA==",
      "cpu": [
        "ppc64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-ppc64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-riscv64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-riscv64/-/sharp-linux-riscv64-0.34.5.tgz",
      "integrity": "sha512-51gJuLPTKa7piYPaVs8GmByo7/U7/7TZOq+cnXJIHZKavIRHAP77e3N2HEl3dgiqdD/w0yUfiJnII77PuDDFdw==",
      "cpu": [
        "riscv64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-riscv64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-s390x": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-s390x/-/sharp-linux-s390x-0.34.5.tgz",
      "integrity": "sha512-nQtCk0PdKfho3eC5MrbQoigJ2gd1CgddUMkabUj+rBevs8tZ2cULOx46E7oyX+04WGfABgIwmMC0VqieTiR4jg==",
      "cpu": [
        "s390x"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-s390x": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linux-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linux-x64/-/sharp-linux-x64-0.34.5.tgz",
      "integrity": "sha512-MEzd8HPKxVxVenwAa+JRPwEC7QFjoPWuS5NZnBt6B3pu7EG2Ge0id1oLHZpPJdn3OQK+BQDiw9zStiHBTJQQQQ==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linux-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linuxmusl-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-arm64/-/sharp-linuxmusl-arm64-0.34.5.tgz",
      "integrity": "sha512-fprJR6GtRsMt6Kyfq44IsChVZeGN97gTD331weR1ex1c1rypDEABN6Tm2xa1wE6lYb5DdEnk03NZPqA7Id21yg==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-linuxmusl-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-linuxmusl-x64/-/sharp-linuxmusl-x64-0.34.5.tgz",
      "integrity": "sha512-Jg8wNT1MUzIvhBFxViqrEhWDGzqymo3sV7z7ZsaWbZNDLXRJZoRGrjulp60YYtV4wfY8VIKcWidjojlLcWrd8Q==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4"
      }
    },
    "node_modules/@img/sharp-wasm32": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-wasm32/-/sharp-wasm32-0.34.5.tgz",
      "integrity": "sha512-OdWTEiVkY2PHwqkbBI8frFxQQFekHaSSkUIJkwzclWZe64O1X4UlUjqqqLaPbUpMOQk6FBu/HtlGXNblIs0huw==",
      "cpu": [
        "wasm32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later AND MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/runtime": "^1.7.0"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-arm64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-arm64/-/sharp-win32-arm64-0.34.5.tgz",
      "integrity": "sha512-WQ3AgWCWYSb2yt+IG8mnC6Jdk9Whs7O0gxphblsLvdhSpSTtmu69ZG1Gkb6NuvxsNACwiPV6cNSZNzt0KPsw7g==",
      "cpu": [
        "arm64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-ia32": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-ia32/-/sharp-win32-ia32-0.34.5.tgz",
      "integrity": "sha512-FV9m/7NmeCmSHDD5j4+4pNI8Cp3aW+JvLoXcTUo0IqyjSfAZJ8dIUmijx1qaJsIiU+Hosw6xM5KijAWRJCSgNg==",
      "cpu": [
        "ia32"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@img/sharp-win32-x64": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/@img/sharp-win32-x64/-/sharp-win32-x64-0.34.5.tgz",
      "integrity": "sha512-+29YMsqY2/9eFEiW93eqWnuLcWcufowXewwSNIT6UwZdUUCrM3oFjMWH/Z6/TMmb4hlFenmfAVbpWeup2jryCw==",
      "cpu": [
        "x64"
      ],
      "license": "Apache-2.0 AND LGPL-3.0-or-later",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/remapping": {
      "version": "2.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/remapping/-/remapping-2.3.5.tgz",
      "integrity": "sha512-LI9u/+laYG4Ds1TDKSJW2YPrIlcVYOwi2fUC6xB43lueCjgxV4lffOCZCtYFiH6TNOX+tQKXx97T4IKHbhyHEQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.5",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@napi-rs/wasm-runtime": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/@napi-rs/wasm-runtime/-/wasm-runtime-1.2.5.tgz",
      "integrity": "sha512-HshSvXzmBxNzqejd3k/KemgQ3hdREUYFRRrgxOZ+gPljDIsO2SDZrVZMd4Z/HsxudQbE62OVyVFE8z9BCurfjA==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@tybys/wasm-util": "^0.10.3"
      },
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=23.5.0"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/Brooooooklyn"
      },
      "peerDependencies": {
        "@emnapi/core": "^1.7.1 || ^2.0.0-alpha.4",
        "@emnapi/runtime": "^1.7.1 || ^2.0.0-alpha.4"
      }
    },
    "node_modules/@next/env": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-16.2.6.tgz",
      "integrity": "sha512-gd8HoHN4ufj73WmR3JmVolrpJR47ILK6LouP5xElPglaVxir6e1a7VzvTvDWkOoPXT9rkkTzyCxBu4yeZfZwcw==",
      "license": "MIT"
    },
    "node_modules/@next/eslint-plugin-next": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/eslint-plugin-next/-/eslint-plugin-next-16.2.6.tgz",
      "integrity": "sha512-Z8l6o4JWKUl755x4R+wogD86KPeU+Ckw4K+SYG4kHeOJtRenDeK+OSbGcqZpDtbwn9DsJVdir2UxmwXuinUbUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-glob": "3.3.1"
      }
    },
    "node_modules/@next/swc-darwin-arm64": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-16.2.6.tgz",
      "integrity": "sha512-ZJGkkcNfYgrrMkqOdZ7zoLa1TOy0qpcMfk/z4Mh/FKUz40gVO+HNQWqmLxf67Z5WB64DRp0dhEbyHfel+6sJUg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-darwin-x64": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-x64/-/swc-darwin-x64-16.2.6.tgz",
      "integrity": "sha512-v/YLBHIY132Ced3puBJ7YJKw1lqsCrgcNo2aRJlCEyQrrCeRJlvGlnmxhPxNQI3KE3N1DN5r9TPNPvka3nq5RQ==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-gnu": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-gnu/-/swc-linux-arm64-gnu-16.2.6.tgz",
      "integrity": "sha512-RPOvqlYBbcQjkz9VQQDZ2T2bARIjXZV1KFlt+V2Mr6SW/e4I9fcKsaA0hdyf2FHoTlsV2xnBd5Y912rP/1Ce6w==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-musl": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-musl/-/swc-linux-arm64-musl-16.2.6.tgz",
      "integrity": "sha512-URUTu1+dMkxJsPFgm+OeEvq9wf5sujw0EvgYy80TDGHTSLTnIHeqb0Eu8A3sC95IRgjejQL+kC4mw+4yPxiAXA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-gnu": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-16.2.6.tgz",
      "integrity": "sha512-DOj182mPV8G3UkrayLoREM5YEYI+Dk5wv7Ox9xl1fFibAELEsFD0lDPfHIeILlutMMfdyhlzYPELG3peuKaurw==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-musl": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-16.2.6.tgz",
      "integrity": "sha512-HKQ5SP/V/ub73UvF7n/zeJlxk2kLmtL7Wzrg4WfmkjmNos5onJ2tKu7yZOPdL18A6Svfn3max29ym+ry7NkK4g==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-arm64-msvc": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-arm64-msvc/-/swc-win32-arm64-msvc-16.2.6.tgz",
      "integrity": "sha512-LZXpTlPyS5v7HhSmnvsLGP3iIYgYOBnc8r8ArlT55sGHV89bR2HlDdBjWQ+PY6SJMmk8TuVGFuxalnP3k/0Dwg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-x64-msvc": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-16.2.6.tgz",
      "integrity": "sha512-F0+4i0h9J6C4eE3EAPWsoCk7UW/dbzOjyzxY0qnDUOYFu6FFmdZ6l97/XdV3/Nz3VYyO7UWjyEJUXkGqcoXfMA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nolyfill/is-core-module": {
      "version": "1.0.39",
      "resolved": "https://registry.npmjs.org/@nolyfill/is-core-module/-/is-core-module-1.0.39.tgz",
      "integrity": "sha512-nn5ozdjYQpUCZlWGuxcJY/KpxkWQs4DcbMCmKojjyrYDEAGy4Ce19NN4v5MduafTwJlbKc99UA8YhSVqq9yPZA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.4.0"
      }
    },
    "node_modules/@rtsao/scc": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@rtsao/scc/-/scc-1.1.0.tgz",
      "integrity": "sha512-zt6OdqaDoOnJ1ZYsCYGt9YmWzDXl4vQdKTyJev62gFhRGKdx7mcT54V9KIjg+d2wi9EXsPvAPKe7i7WjfVWB8g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.15",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.15.tgz",
      "integrity": "sha512-JQ5TuMi45Owi4/BIMAJBoSQoOJu12oOk/gADqlcUL9JEdHB8vyjUSsxqeNXnmXHjYKMi2WcYtezGEEhqUI/E2g==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.8.0"
      }
    },
    "node_modules/@tailwindcss/node": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/node/-/node-4.1.17.tgz",
      "integrity": "sha512-csIkHIgLb3JisEFQ0vxr2Y57GUNYh447C8xzwj89U/8fdW8LhProdxvnVH6U8M2Y73QKiTIH+LWbK3V2BBZsAg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/remapping": "^2.3.4",
        "enhanced-resolve": "^5.18.3",
        "jiti": "^2.6.1",
        "lightningcss": "1.30.2",
        "magic-string": "^0.30.21",
        "source-map-js": "^1.2.1",
        "tailwindcss": "4.1.17"
      }
    },
    "node_modules/@tailwindcss/oxide": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide/-/oxide-4.1.17.tgz",
      "integrity": "sha512-F0F7d01fmkQhsTjXezGBLdrl1KresJTcI3DB8EkScCldyKp3Msz4hub4uyYaVnk88BAS1g5DQjjF6F5qczheLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 10"
      },
      "optionalDependencies": {
        "@tailwindcss/oxide-android-arm64": "4.1.17",
        "@tailwindcss/oxide-darwin-arm64": "4.1.17",
        "@tailwindcss/oxide-darwin-x64": "4.1.17",
        "@tailwindcss/oxide-freebsd-x64": "4.1.17",
        "@tailwindcss/oxide-linux-arm-gnueabihf": "4.1.17",
        "@tailwindcss/oxide-linux-arm64-gnu": "4.1.17",
        "@tailwindcss/oxide-linux-arm64-musl": "4.1.17",
        "@tailwindcss/oxide-linux-x64-gnu": "4.1.17",
        "@tailwindcss/oxide-linux-x64-musl": "4.1.17",
        "@tailwindcss/oxide-wasm32-wasi": "4.1.17",
        "@tailwindcss/oxide-win32-arm64-msvc": "4.1.17",
        "@tailwindcss/oxide-win32-x64-msvc": "4.1.17"
      }
    },
    "node_modules/@tailwindcss/oxide-android-arm64": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-android-arm64/-/oxide-android-arm64-4.1.17.tgz",
      "integrity": "sha512-BMqpkJHgOZ5z78qqiGE6ZIRExyaHyuxjgrJ6eBO5+hfrfGkuya0lYfw8fRHG77gdTjWkNWEEm+qeG2cDMxArLQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-arm64": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-arm64/-/oxide-darwin-arm64-4.1.17.tgz",
      "integrity": "sha512-EquyumkQweUBNk1zGEU/wfZo2qkp/nQKRZM8bUYO0J+Lums5+wl2CcG1f9BgAjn/u9pJzdYddHWBiFXJTcxmOg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-darwin-x64": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-darwin-x64/-/oxide-darwin-x64-4.1.17.tgz",
      "integrity": "sha512-gdhEPLzke2Pog8s12oADwYu0IAw04Y2tlmgVzIN0+046ytcgx8uZmCzEg4VcQh+AHKiS7xaL8kGo/QTiNEGRog==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-freebsd-x64": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-freebsd-x64/-/oxide-freebsd-x64-4.1.17.tgz",
      "integrity": "sha512-hxGS81KskMxML9DXsaXT1H0DyA+ZBIbyG/sSAjWNe2EDl7TkPOBI42GBV3u38itzGUOmFfCzk1iAjDXds8Oh0g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm-gnueabihf": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm-gnueabihf/-/oxide-linux-arm-gnueabihf-4.1.17.tgz",
      "integrity": "sha512-k7jWk5E3ldAdw0cNglhjSgv501u7yrMf8oeZ0cElhxU6Y2o7f8yqelOp3fhf7evjIS6ujTI3U8pKUXV2I4iXHQ==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-gnu": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-gnu/-/oxide-linux-arm64-gnu-4.1.17.tgz",
      "integrity": "sha512-HVDOm/mxK6+TbARwdW17WrgDYEGzmoYayrCgmLEw7FxTPLcp/glBisuyWkFz/jb7ZfiAXAXUACfyItn+nTgsdQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-arm64-musl": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-arm64-musl/-/oxide-linux-arm64-musl-4.1.17.tgz",
      "integrity": "sha512-HvZLfGr42i5anKtIeQzxdkw/wPqIbpeZqe7vd3V9vI3RQxe3xU1fLjss0TjyhxWcBaipk7NYwSrwTwK1hJARMg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-gnu": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-gnu/-/oxide-linux-x64-gnu-4.1.17.tgz",
      "integrity": "sha512-M3XZuORCGB7VPOEDH+nzpJ21XPvK5PyjlkSFkFziNHGLc5d6g3di2McAAblmaSUNl8IOmzYwLx9NsE7bplNkwQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-linux-x64-musl": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-linux-x64-musl/-/oxide-linux-x64-musl-4.1.17.tgz",
      "integrity": "sha512-k7f+pf9eXLEey4pBlw+8dgfJHY4PZ5qOUFDyNf7SI6lHjQ9Zt7+NcscjpwdCEbYi6FI5c2KDTDWyf2iHcCSyyQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-wasm32-wasi": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-wasm32-wasi/-/oxide-wasm32-wasi-4.1.17.tgz",
      "integrity": "sha512-cEytGqSSoy7zK4JRWiTCx43FsKP/zGr0CsuMawhH67ONlH+T79VteQeJQRO/X7L0juEUA8ZyuYikcRBf0vsxhg==",
      "bundleDependencies": [
        "@napi-rs/wasm-runtime",
        "@emnapi/core",
        "@emnapi/runtime",
        "@tybys/wasm-util",
        "@emnapi/wasi-threads",
        "tslib"
      ],
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "^1.6.0",
        "@emnapi/runtime": "^1.6.0",
        "@emnapi/wasi-threads": "^1.1.0",
        "@napi-rs/wasm-runtime": "^1.0.7",
        "@tybys/wasm-util": "^0.10.1",
        "tslib": "^2.4.0"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-arm64-msvc": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-arm64-msvc/-/oxide-win32-arm64-msvc-4.1.17.tgz",
      "integrity": "sha512-JU5AHr7gKbZlOGvMdb4722/0aYbU+tN6lv1kONx0JK2cGsh7g148zVWLM0IKR3NeKLv+L90chBVYcJ8uJWbC9A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/oxide-win32-x64-msvc": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/oxide-win32-x64-msvc/-/oxide-win32-x64-msvc-4.1.17.tgz",
      "integrity": "sha512-SKWM4waLuqx0IH+FMDUw6R66Hu4OuTALFgnleKbqhgGU30DY20NORZMZUKgLRjQXNN2TLzKvh48QXTig4h4bGw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@tailwindcss/postcss": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/@tailwindcss/postcss/-/postcss-4.1.17.tgz",
      "integrity": "sha512-+nKl9N9mN5uJ+M7dBOOCzINw94MPstNR/GtIhz1fpZysxL/4a+No64jCBD6CPN+bIHWFx3KWuu8XJRrj/572Dw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "@tailwindcss/node": "4.1.17",
        "@tailwindcss/oxide": "4.1.17",
        "postcss": "^8.4.41",
        "tailwindcss": "4.1.17"
      }
    },
    "node_modules/@tybys/wasm-util": {
      "version": "0.10.4",
      "resolved": "https://registry.npmjs.org/@tybys/wasm-util/-/wasm-util-0.10.4.tgz",
      "integrity": "sha512-W3c4gRigFS0T/Ma4qIYF3GDAc5AQdHb1yL5znJT1Zv1YaD9Kitx656wBjvr19qbiosmZT8lWDM5BEMynUqX65A==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/estree": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json5": {
      "version": "0.0.29",
      "resolved": "https://registry.npmjs.org/@types/json5/-/json5-0.0.29.tgz",
      "integrity": "sha512-dRLjCWHYg4oaA77cxO64oO+7JwCwnIzkZPdrrC71jQmQtlhM556pwKo5bUzqvZndkVbeFLIIi+9TC40JNF5hNQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "22.19.15",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.19.15.tgz",
      "integrity": "sha512-F0R/h2+dsy5wJAUe3tAU6oqa2qbWY5TpNfL/RGmo1y38hiyO1w3x2jPtt76wmuaJI4DQnOBu21cNXQ2STIUUWg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/react": {
      "version": "19.2.14",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz",
      "integrity": "sha512-ilcTH/UniCkMdtexkoCN0bI7pMcJDvmQFPvuPvmEaYA/NSfFTAgdUSLAoVjaRJm7+6PvcM+q1zYOwS4wTYMF9w==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "19.2.3",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz",
      "integrity": "sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^19.2.0"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/eslint-plugin/-/eslint-plugin-8.71.1.tgz",
      "integrity": "sha512-nNlBf6HuotqMgZvSkWD5hNdemiBIxQ2NmrlgfcUIeZRs+BbakjscCQRq/Hb74EFVnFiSWWdL12JruqwBy3ERDw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/regexpp": "^4.12.2",
        "@typescript-eslint/scope-manager": "8.71.1",
        "@typescript-eslint/type-utils": "8.71.1",
        "@typescript-eslint/utils": "8.71.1",
        "@typescript-eslint/visitor-keys": "8.71.1",
        "ignore": "^7.0.5",
        "natural-compare": "^1.4.0",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "@typescript-eslint/parser": "^8.71.1",
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin/node_modules/ignore": {
      "version": "7.0.12",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-7.0.12.tgz",
      "integrity": "sha512-/8UvqAPU9DGTI9k4mxtf49U37Isfwr8Uts96+SBHIkFxPJnHS0Ew4f00sM4Scd8V8EjM0jUNtVDdv1kPdt35lg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-8.71.1.tgz",
      "integrity": "sha512-oM/5sAqz/l1v/zYK1qTOPrn2+JIrBGC1V6uNYucRO5gh6eT9vWJ/RhPbGE59byvZEUQ4VP6XkLBaS5Jti5jpvw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/scope-manager": "8.71.1",
        "@typescript-eslint/types": "8.71.1",
        "@typescript-eslint/typescript-estree": "8.71.1",
        "@typescript-eslint/visitor-keys": "8.71.1",
        "debug": "^4.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/project-service": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/project-service/-/project-service-8.71.1.tgz",
      "integrity": "sha512-Oijc9RUsohHjncg6iGi7gCtjnEjYt9FWv9u6ygK8uKcHK5eLjLAkqERQ9BaytbpceOFdk6kifPCS/zAZE+A99g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/tsconfig-utils": "^8.71.1",
        "@typescript-eslint/types": "^8.71.1",
        "debug": "^4.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-8.71.1.tgz",
      "integrity": "sha512-1YUDZXdTnXLlob03SFHBipdyMBsDVm7zoSz0ytTJ39dk5J1TgsTK03VlR/dLXG/RLLUrPcYbD4rp23BmHxHP0w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.1",
        "@typescript-eslint/visitor-keys": "8.71.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/tsconfig-utils": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/tsconfig-utils/-/tsconfig-utils-8.71.1.tgz",
      "integrity": "sha512-oTvkml5SxXhgg+WWKhod5qWQICDXtOB+/Hi9VdPKFAANJ2b7YOgMffgvzXuqog7R6A/JtrzRf128dsxummyWhg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/type-utils": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/type-utils/-/type-utils-8.71.1.tgz",
      "integrity": "sha512-kH3t3jZCYv2PZSBEWPKTariLrCaoF1CLoPitYFBJOhAGEwWnSRAtGEifrfrpBa4K9JlwWNZotgA5w3/wLSk/FQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.1",
        "@typescript-eslint/typescript-estree": "8.71.1",
        "@typescript-eslint/utils": "8.71.1",
        "debug": "^4.4.3",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-8.71.1.tgz",
      "integrity": "sha512-ybYnPTUwg3VQQOFEiBPLs8Jxl1ry2vXdn1kVKguomBbvxpetdu3MKTNDqFNUrlG8ylP9MpZosmXMFYlGQHk1oQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.71.1.tgz",
      "integrity": "sha512-pSKSEK1JJpHs6KiKVtABCE4iJK5d7FLFzDXQNBQ2oRY7LEd3UwOt3TZemTgu9syTIf56dJWlTn/pdmrO9oKUXQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/project-service": "8.71.1",
        "@typescript-eslint/tsconfig-utils": "8.71.1",
        "@typescript-eslint/types": "8.71.1",
        "@typescript-eslint/visitor-keys": "8.71.1",
        "debug": "^4.4.3",
        "minimatch": "^10.2.2",
        "semver": "^7.7.3",
        "tinyglobby": "^0.2.15",
        "ts-api-utils": "^2.5.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/balanced-match": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-4.0.4.tgz",
      "integrity": "sha512-BLrgEcRTwX2o6gGxGOCNyMvGSp35YofuYzw9h1IMTRmKqttAZZVU67bdb9Pr2vUHA8+j3i2tJfjO6C6+4myGTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "18 || 20 || >=22"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": {
      "version": "5.0.12",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-5.0.12.tgz",
      "integrity": "sha512-YovQ3rzhaLMIrDjNDMkNS01tea93qhEhG5xy8f6+R0l+dw3Ki+5sCoIoI942iuLZTHWogWktgwVDhU09iNEimQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^4.0.2"
      },
      "engines": {
        "node": "20 || >=22"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch": {
      "version": "10.2.6",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.6.tgz",
      "integrity": "sha512-vpLQEs+VLCr1nU0BXS07maYoFwlDAH0gngQuuttxIwutDFEMHq2blX+8vpgxDdK3J1PwjCJiep77OitTZ4Ll1A==",
      "dev": true,
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "brace-expansion": "^5.0.8"
      },
      "engines": {
        "node": "18 || 20 || >=22"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@typescript-eslint/utils": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/utils/-/utils-8.71.1.tgz",
      "integrity": "sha512-CBjT6gfAz3DW2j9Q4moFnqt208Aq+506sVGXfpRcyAeqn0EpayL0mjdWoCO2t3RC7GewNrFxdeehuEaPg6DMzQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.9.1",
        "@typescript-eslint/scope-manager": "8.71.1",
        "@typescript-eslint/types": "8.71.1",
        "@typescript-eslint/typescript-estree": "8.71.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-8.71.1.tgz",
      "integrity": "sha512-0GxiUGqMU0qXJt58cBsiG3DP8lUmBaFo2vChtUX+CT7PnR3v/VGLLrzVP4K9r1lNiZXjHYefMBbPunplr09v6w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.71.1",
        "eslint-visitor-keys": "^5.0.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys/node_modules/eslint-visitor-keys": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-5.0.1.tgz",
      "integrity": "sha512-tD40eHxA35h0PEIZNeIjkHoDR4YjjJp34biM0mDvplBe//mB+IHCqHDGV7pxF+7MklTvighcCPPZC7ynWyjdTA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^20.19.0 || ^22.13.0 || >=24"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@unrs/resolver-binding-android-arm-eabi": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm-eabi/-/resolver-binding-android-arm-eabi-1.12.2.tgz",
      "integrity": "sha512-g5T90pqg1bo/7mytQx6F4iBNC0Wsh9cu+z9veDbFjc7HjpesJFWD7QMS0NGStXM075+7dJPPVvBbpZlnrdpi/w==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-android-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-android-arm64/-/resolver-binding-android-arm64-1.12.2.tgz",
      "integrity": "sha512-YGCRZv/9GLhwmz6mYDeTsm/92BAyR28l6c2ReweVW5pWgfsitWLY8upvfRlGdoyD8HjeTHSYJWyZGD4KJA/nFQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-arm64/-/resolver-binding-darwin-arm64-1.12.2.tgz",
      "integrity": "sha512-u9DiNT1auQMO20A9SyTuG3wUgQWB9Z7KjAg0uFuCDR1FsAY8A0CG2S6JpHS1xwm/w1G08bjXZDcyOCjv1WAm2w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-darwin-x64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-darwin-x64/-/resolver-binding-darwin-x64-1.12.2.tgz",
      "integrity": "sha512-f7rPLi/T1HVKZu/u6t87lroib16n8vrSzcyxI7lg4BGO9UF26KhQL44sd9eOUgrTYhvRXtWOIZT5PejdPyJfUA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@unrs/resolver-binding-freebsd-x64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-freebsd-x64/-/resolver-binding-freebsd-x64-1.12.2.tgz",
      "integrity": "sha512-BpcOjWCJub6nRZUS2zA20pmLvjtqAtGejETaIyRLiZiQf++cbrjltLA5NN/xaXfqeOBOSlMFbemIl5/S5tljmg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-gnueabihf": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-gnueabihf/-/resolver-binding-linux-arm-gnueabihf-1.12.2.tgz",
      "integrity": "sha512-vZTDvdSISZjJx66OzJqtsOhzifbqRjbmI1Mnu49fQDwog5GtDI4QidRiEAYbZCRj9C8YZEW+3ZjqsyS9GR4k2A==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm-musleabihf": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm-musleabihf/-/resolver-binding-linux-arm-musleabihf-1.12.2.tgz",
      "integrity": "sha512-BiPI+IrIlwcW4nLLMM21+B1dFPzd55yAVgVGrdgDjNef+ch03GdxrcyaIz8X9SsQirh/kCQ7mviyWlMxdh2D7g==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-gnu/-/resolver-binding-linux-arm64-gnu-1.12.2.tgz",
      "integrity": "sha512-zJc0H99FEPoFfSrNpa91HYfxzfAJCr502oxNK1cfdC9hlaFI43RT+JFCann9JUgZmLzzntChHyn13Sgn9ljHNg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-arm64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-arm64-musl/-/resolver-binding-linux-arm64-musl-1.12.2.tgz",
      "integrity": "sha512-KQ3Lki6l+Pz1k/eBipN41ES+YUK30beLGb9YqcB1O542cyLCNE6GaxrfcY3T6EezmGGk84wb5XyO9loTM9tkcA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-loong64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-loong64-gnu/-/resolver-binding-linux-loong64-gnu-1.12.2.tgz",
      "integrity": "sha512-3SJGEh1DborhG6pyxvhPzCT4bbSIVihsvgJc13P1bHG7KLdNDaF9T3gsTwFc7Jw/5Y5/iWOjkEx7Zy0NvCGX3Q==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-loong64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-loong64-musl/-/resolver-binding-linux-loong64-musl-1.12.2.tgz",
      "integrity": "sha512-jiuG/Obbel7uw1PwHNFfrkiKhLAF6mnyZ6aWlOAVN9WqKm8v0OFGnciJIHu8+CMvXLQ8AD51LPzAoUfT21D5Ew==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-ppc64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-ppc64-gnu/-/resolver-binding-linux-ppc64-gnu-1.12.2.tgz",
      "integrity": "sha512-q7xRvVpmcfeL+LlZg8Pbbo6QaTZwDU5BaGZbwfhkEsXJn3Was8xYfE0RBH266xZt0rM6B7i8xAYIvjthuUIWHg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-gnu/-/resolver-binding-linux-riscv64-gnu-1.12.2.tgz",
      "integrity": "sha512-0CVdx6lcnT3Q9inOH8tsMIOJ6ImndllMjqJHg8RLVdB7Vq4SfkEXl9mCSsVNuNA4MCYycRicCUxPCabVHJRr6A==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-riscv64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-riscv64-musl/-/resolver-binding-linux-riscv64-musl-1.12.2.tgz",
      "integrity": "sha512-iOwlRo9vnp6R6ohHQS11n0NnfdXx/omhkocmIfaPRpQhKZ+3BDMkkdRVh53qjkFkpPddf+FETA28NwGN7l5l+w==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-s390x-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-s390x-gnu/-/resolver-binding-linux-s390x-gnu-1.12.2.tgz",
      "integrity": "sha512-HYJtLfXq94q8iZNFT1lknx258wlkkWhZeUXJRqzKBBUJ00CvZ+N33zgbCqimLjsyw5Va6uUxhVa12mI+kaveEw==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-gnu": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-gnu/-/resolver-binding-linux-x64-gnu-1.12.2.tgz",
      "integrity": "sha512-mPsUhunKKDih5O96Y6enDQyHc1SqBPlY1E/SfMWDM3EdJ95Z9CArPeCVwCCqbP45ljvivdEk8Fxn+SIb1rDAJQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-linux-x64-musl": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-linux-x64-musl/-/resolver-binding-linux-x64-musl-1.12.2.tgz",
      "integrity": "sha512-azrt6+5ydLd8Vt210AAFis/lZevSfPw93EJRIJG+xPu4WCJ8K0kppCTpMyLPcKT7H15M4Jnt2tMp5bOvCkRC6A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@unrs/resolver-binding-openharmony-arm64": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-openharmony-arm64/-/resolver-binding-openharmony-arm64-1.12.2.tgz",
      "integrity": "sha512-YZ9hP4O0X9PQb8eO980qmLNGH4zT3I9+SZTdt0Pr0YyuGQhYKoOZkV02VzrzyOZJ5xIJ3UFIenKkUkGg8GjgWQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@unrs/resolver-binding-wasm32-wasi": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-wasm32-wasi/-/resolver-binding-wasm32-wasi-1.12.2.tgz",
      "integrity": "sha512-tYFDIkMxSflfEc/h92ZWNsZlHSwgimbNHSO3PL2JWQHfCuC2q316jMyYU9TIWZsFK2bQwyK5VAdYgn8ygPj69A==",
      "cpu": [
        "wasm32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@emnapi/core": "1.10.0",
        "@emnapi/runtime": "1.10.0",
        "@napi-rs/wasm-runtime": "^1.1.4"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@unrs/resolver-binding-wasm32-wasi/node_modules/@emnapi/runtime": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/@emnapi/runtime/-/runtime-1.10.0.tgz",
      "integrity": "sha512-ewvYlk86xUoGI0zQRNq/mC+16R1QeDlKQy21Ki3oSYXNgLb45GV1P6A0M+/s6nyCuNDqe5VpaY84BzXGwVbwFA==",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@unrs/resolver-binding-win32-arm64-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-arm64-msvc/-/resolver-binding-win32-arm64-msvc-1.12.2.tgz",
      "integrity": "sha512-qzNyg3xL0VPQmCaUh+N5jSitce6k+uCBfMDesWRnlULOZaqUkaJ0ybdT+UqlAWJoQjuqfIU/0Ptx9bteN4D82g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-ia32-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-ia32-msvc/-/resolver-binding-win32-ia32-msvc-1.12.2.tgz",
      "integrity": "sha512-WD9sY00OfpHVGfsnHZoA8jVT+esS/Bg8z8jzxp5BnDCjjwsuKsPQrzswwpFy4J1AUJbXPRfkpcX0mXrzeXW79g==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@unrs/resolver-binding-win32-x64-msvc": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/@unrs/resolver-binding-win32-x64-msvc/-/resolver-binding-win32-x64-msvc-1.12.2.tgz",
      "integrity": "sha512-nAB74NfSNKknqQ1RrYj6uz8FcXEomu/MATJZxh/x+BArzN2U3JbOYC0APYzUIGhVY3m5hRxA8VPNdPBoG8txlA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/acorn": {
      "version": "8.19.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.19.0.tgz",
      "integrity": "sha512-oJlA3XiRm7Cyk6qFD2Jn8ak9B7jSy0qy00ADO3+8dpT0LSjFihQYv4C02LFCSYJV3Q37xYwwRy5m+IpIiUzqWw==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/adler-32": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/adler-32/-/adler-32-1.3.1.tgz",
      "integrity": "sha512-ynZ4w/nUUv5rrsR8UUGoe1VC9hZj6V5hU9Qw1HlMDJGEJw5S7TfTErWTjMys6M7vr0YWcPqs3qAr4ss0nDfP+A==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/ajv": {
      "version": "6.15.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.15.0.tgz",
      "integrity": "sha512-fgFx7Hfoq60ytK2c7DhnF8jIvzYgOMxfugjLOSMHjLIPgenqa7S7oaagATUq99mV6IYvN2tRmC0wnTYX6iPbMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true,
      "license": "Python-2.0"
    },
    "node_modules/aria-query": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/aria-query/-/aria-query-5.3.2.tgz",
      "integrity": "sha512-COROpnaoap1E2F000S62r6A60uHZnmlvomhfyT2DlTcrY1OrBKn2UhH7qn5wTC9zMvD0AY7csdPSNwKP+7WiQw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/array-buffer-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/array-buffer-byte-length/-/array-buffer-byte-length-1.0.2.tgz",
      "integrity": "sha512-LHE+8BuR7RYGDKvnrmcuSq3tDcKv9OFEXQt/HpbZhY7V6h0zlUXutnAD82GiFx9rdieCMjkvtcsPqBwgUl1Iiw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "is-array-buffer": "^3.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array-includes": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/array-includes/-/array-includes-3.2.0.tgz",
      "integrity": "sha512-VXY5eFRarnXcYxwBjJzPmEhH55+rmP79/+ueDhi0F+TuqfHCItagIHqxeUZrmgrOPa31QTh9H85DjX3FfJ0FTg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-object-atoms": "^1.1.2",
        "es-shim-unscopables": "^1.1.0",
        "is-string": "^1.1.1",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlast": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/array.prototype.findlast/-/array.prototype.findlast-1.2.5.tgz",
      "integrity": "sha512-CVvd6FHg1Z3POpBLxO6E6zr+rSKEQ9L6rZHAaY7lLfhKsWYUBBOuMs0e9o24oopj6H+geRCX0YJ+TJLBK2eHyQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.findlastindex": {
      "version": "1.2.6",
      "resolved": "https://registry.npmjs.org/array.prototype.findlastindex/-/array.prototype.findlastindex-1.2.6.tgz",
      "integrity": "sha512-F/TKATkzseUExPlfvmwQKGITM3DGTK+vkAsCZoDc5daVygbJBnjEUCbgkAvVFsgfXfX4YIqZ/27G3k3tdXrTxQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-shim-unscopables": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flat": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flat/-/array.prototype.flat-1.3.3.tgz",
      "integrity": "sha512-rwG/ja1neyLqCuGZ5YYrznA62D4mZXg0i1cIskIUKSiqF3Cje9/wXAls9B9s1Wa2fomMsIv8czB8jZcPmxCXFg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.flatmap": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/array.prototype.flatmap/-/array.prototype.flatmap-1.3.3.tgz",
      "integrity": "sha512-Y7Wt51eKJSyi80hFrJCePGGNo5ktJCslFuboqJsbf57CCPcm5zztluPlc4/aD8sWsKvlwatezpV4U1efk8kpjg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/array.prototype.tosorted": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/array.prototype.tosorted/-/array.prototype.tosorted-1.1.4.tgz",
      "integrity": "sha512-p6Fx8B7b7ZhL/gmUsAy0D15WhvDccw3mnGNbZpi3pmeJdxtWsj2jEaI4Y6oo3XiHfzuSgPwKc04MYt6KgvC/wA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3",
        "es-errors": "^1.3.0",
        "es-shim-unscopables": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/arraybuffer.prototype.slice": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/arraybuffer.prototype.slice/-/arraybuffer.prototype.slice-1.0.4.tgz",
      "integrity": "sha512-BNoCY6SXXPQ7gF2opIP4GBE+Xw7U+pHMYKuzjgCN3GwiaIR09UUeKfheyIry77QtrCBlC0KK0q5/TER/tYh3PQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.1",
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.5",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "is-array-buffer": "^3.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ast-types-flow": {
      "version": "0.0.8",
      "resolved": "https://registry.npmjs.org/ast-types-flow/-/ast-types-flow-0.0.8.tgz",
      "integrity": "sha512-OH/2E5Fg20h2aPrbe+QL8JZQFko0YZaF+j4mnQ7BGhfavO7OpSLa8a0y9sBwomHdSbkhTS8TQNayBfnW5DwbvQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/async-function": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/async-function/-/async-function-1.0.0.tgz",
      "integrity": "sha512-hsU18Ae8CDTR6Kgu9DYf0EbCr/a5iGL0rytQDobUcdpYOKokk8LEjVphnXkDkgpi0wYVsqrXuP0bZxJaTqdgoA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/available-typed-arrays": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/available-typed-arrays/-/available-typed-arrays-1.0.7.tgz",
      "integrity": "sha512-wvUjBtSGN7+7SjNpq/9M2Tg350UZD3q62IFZLbRAR1bSMlCo1ZaeW+BJ+D090e4hIIZLBcTDWe4Mh4jvUDajzQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "possible-typed-array-names": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/axe-core": {
      "version": "4.14.0",
      "resolved": "https://registry.npmjs.org/axe-core/-/axe-core-4.14.0.tgz",
      "integrity": "sha512-9WTZxEjsZ7b13TH8JPmbV2z8CHbl80/2hm3XPEG4JgNdQLK81IBRXmSxHfMAOkSqQeRxT/0dwNDz2GOm3zzpcQ==",
      "dev": true,
      "license": "MPL-2.0",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/axobject-query": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/axobject-query/-/axobject-query-4.1.0.tgz",
      "integrity": "sha512-qIj0G9wZbMGNLjLmg1PT6v2mE9AH2zlnADJD/2tC6E00hgmhUOfEB6greHPAfLRSufHqROIUTkw6E+M3lH0PTQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.11.27",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.27.tgz",
      "integrity": "sha512-ElY12DaROGuan+lMmZ8Cvo/ZUbXPe7Enc/9VU/b1T3Kp4dwytRcNdR8DoSJN5SNJT/CuvcCA0DHDVmMOCePdRQ==",
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.21",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.21.tgz",
      "integrity": "sha512-9zeA+KLZNNzglF2TPKRQEDyx6Yby7daAkuy8MiPzpXPsYDWi/DRM8jmwUDxokQjYqBpv5DgPiwD4h4ZZSy1Ujw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.29.3",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.29.3.tgz",
      "integrity": "sha512-1R4kiYKXGViqEN0CnoDrXc1StD9niAwu+j2dukWzrD4bJgsD4lDmEp0CRbc6E/vYJIfTHwPmwyaKtVSudICdPA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.11.26",
        "caniuse-lite": "^1.0.30001813",
        "electron-to-chromium": "^1.5.439",
        "node-releases": "^2.0.57",
        "update-browserslist-db": "^1.3.3"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/call-bind": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/call-bind/-/call-bind-1.0.9.tgz",
      "integrity": "sha512-a/hy+pNsFUTR+Iz8TCJvXudKVLAnz/DyeSUo10I5yvFDQJBFU2s9uqQpoSrJlroHUKoKqzg+epxyP9lqFdzfBQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "get-intrinsic": "^1.3.0",
        "set-function-length": "^1.2.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001815",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001815.tgz",
      "integrity": "sha512-uDybUEyfgbyJJ93J1vikTylBX31AkdVYeVPeffMQpf8XN7hSfr0oZOn4VFOIMNvtU5+rHvC5Udg2TgtJKHm23Q==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/cfb": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/cfb/-/cfb-1.2.2.tgz",
      "integrity": "sha512-KfdUZsSOw19/ObEWasvBP/Ac4reZvAGauZhs6S/gqNhXhI7cKwvlH7ulj+dOEYnca4bm4SGo8C1bTAQvnTjgQA==",
      "license": "Apache-2.0",
      "dependencies": {
        "adler-32": "~1.3.0",
        "crc-32": "~1.2.0"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/client-only": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
      "integrity": "sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==",
      "license": "MIT"
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/codepage": {
      "version": "1.15.0",
      "resolved": "https://registry.npmjs.org/codepage/-/codepage-1.15.0.tgz",
      "integrity": "sha512-3g6NUTPd/YtuuGrhMnOMRjFc+LJw/bnMp3+0r/Wcz3IXUuCosKRJvMphm5+Q+bvTVGcJJuRvVLuYba+WojaFaA==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/convert-source-map": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/convert-source-map/-/convert-source-map-2.0.0.tgz",
      "integrity": "sha512-Kvp459HrV2FEJ1CAsi1Ku+MY3kasH19TFykTz2xWmMeq6bk2NU3XXvfJ+Q61m0xktWwt+1HSYf3JZsTms3aRJg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/crc-32": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/crc-32/-/crc-32-1.2.2.tgz",
      "integrity": "sha512-ROmzCKrTnOwybPcJApAA6WBWij23HVfGVNKqqrZpuyZOHqK2CwHSvpGuyt/UNNvaIjEd8X5IFGp4Mh+Ie1IHJQ==",
      "license": "Apache-2.0",
      "bin": {
        "crc32": "bin/crc32.njs"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/damerau-levenshtein": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/damerau-levenshtein/-/damerau-levenshtein-1.0.8.tgz",
      "integrity": "sha512-sdQSFB7+llfUcQHUQO3+B8ERRj0Oa4w9POWMI/puGtuf7gFywGmkaLCElnudfTiKZV+NvHqL0ifzdrI8Ro7ESA==",
      "dev": true,
      "license": "BSD-2-Clause"
    },
    "node_modules/data-view-buffer": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-buffer/-/data-view-buffer-1.0.2.tgz",
      "integrity": "sha512-EmKO5V3OLXh1rtK2wgXRansaK1/mtVdTUEiEI0W8RkvgT05kfxaH29PliLnpLP73yYO6142Q72QNa8Wx/A5CqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/data-view-byte-length": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/data-view-byte-length/-/data-view-byte-length-1.0.2.tgz",
      "integrity": "sha512-tuhGbE6CfTM9+5ANGf+oQb72Ky/0+s3xKUpHvShfiz2RxMFgFPjsXuRLBVMtvMs15awe45SRb83D6wH4ew6wlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/inspect-js"
      }
    },
    "node_modules/data-view-byte-offset": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/data-view-byte-offset/-/data-view-byte-offset-1.0.1.tgz",
      "integrity": "sha512-BS8PfmtDGnrgYdOonGZQdLZslWIeCGFP9tpan0hi1Co2Zr2NKADsvGYA8XxuG/4UWgJ6Cjtv+YJnB6MM69QGlQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-data-view": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/define-data-property": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-data-property/-/define-data-property-1.1.4.tgz",
      "integrity": "sha512-rBMvIzlpA8v6E+SJZoo++HAYqsLrkg7MSfIinMPFhmkorw7X+dOXVJQs+QT69zGkzMyfDnIMN2Wid1+NbL3T+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0",
        "es-errors": "^1.3.0",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/define-properties": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.2.1.tgz",
      "integrity": "sha512-8QmQKqEASLd5nx0U1B1okLElbUuuttJ/AnYmRXbbbGDWh6uS208EjD4Xqq/I9wK7u0v6O08XhTWnt5XtEbR6Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.0.1",
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/detect-libc": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/detect-libc/-/detect-libc-2.1.2.tgz",
      "integrity": "sha512-Btj2BOOO83o3WyH59e8MgXsxEQVcarkUOpEYrubB0urwnN10yQ364rsiByU11nZlqWYZm05i/of7io4mzihBtQ==",
      "devOptional": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/doctrine": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/doctrine/-/doctrine-2.1.0.tgz",
      "integrity": "sha512-35mSku4ZXK0vfCuHEDAwt55dg2jNajHZ1odvF+8SSr82EsZY4QmXfuWso8oEd8zRhVObSN18aM0CjSdoBX7zIw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.449",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.449.tgz",
      "integrity": "sha512-dKeYk/3SFQz+nXi5whp3OuJzeWABEG4zCtkWJ9+Vby1E1iFM2y0gElRtQvNXRPJTsj8WAF4HMP7hvP790QtJ9g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/enhanced-resolve": {
      "version": "5.26.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.26.0.tgz",
      "integrity": "sha512-9vhedylFonb2YGogzUKX6+Ja72gOJbN1QHAqdrvqLwhdl/QWbKopzoUC9EbQNVsAns/bx/4uyqalrQAoy1IByw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.3.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/es-abstract": {
      "version": "1.24.2",
      "resolved": "https://registry.npmjs.org/es-abstract/-/es-abstract-1.24.2.tgz",
      "integrity": "sha512-2FpH9Q5i2RRwyEP1AylXe6nYLR5OhaJTZwmlcP0dL/+JCbgg7yyEo/sEK6HeGZRf3dFpWwThaRHVApXSkW3xeg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-buffer-byte-length": "^1.0.2",
        "arraybuffer.prototype.slice": "^1.0.4",
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "data-view-buffer": "^1.0.2",
        "data-view-byte-length": "^1.0.2",
        "data-view-byte-offset": "^1.0.1",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "es-set-tostringtag": "^2.1.0",
        "es-to-primitive": "^1.3.0",
        "function.prototype.name": "^1.1.8",
        "get-intrinsic": "^1.3.0",
        "get-proto": "^1.0.1",
        "get-symbol-description": "^1.1.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "internal-slot": "^1.1.0",
        "is-array-buffer": "^3.0.5",
        "is-callable": "^1.2.7",
        "is-data-view": "^1.0.2",
        "is-negative-zero": "^2.0.3",
        "is-regex": "^1.2.1",
        "is-set": "^2.0.3",
        "is-shared-array-buffer": "^1.0.4",
        "is-string": "^1.1.1",
        "is-typed-array": "^1.1.15",
        "is-weakref": "^1.1.1",
        "math-intrinsics": "^1.1.0",
        "object-inspect": "^1.13.4",
        "object-keys": "^1.1.1",
        "object.assign": "^4.1.7",
        "own-keys": "^1.0.1",
        "regexp.prototype.flags": "^1.5.4",
        "safe-array-concat": "^1.1.3",
        "safe-push-apply": "^1.0.0",
        "safe-regex-test": "^1.1.0",
        "set-proto": "^1.0.0",
        "stop-iteration-iterator": "^1.1.0",
        "string.prototype.trim": "^1.2.10",
        "string.prototype.trimend": "^1.0.9",
        "string.prototype.trimstart": "^1.0.8",
        "typed-array-buffer": "^1.0.3",
        "typed-array-byte-length": "^1.0.3",
        "typed-array-byte-offset": "^1.0.4",
        "typed-array-length": "^1.0.7",
        "unbox-primitive": "^1.1.0",
        "which-typed-array": "^1.1.19"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-abstract-get": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/es-abstract-get/-/es-abstract-get-1.0.0.tgz",
      "integrity": "sha512-6PMWXpdhshVvFp+FoWYs1EvG1Nj0tvk0dZM+XcK0xMEM1czRVcP6ohqPWHy6qPagSpC8j4+p89WXlT+xXJs/fg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.2",
        "is-callable": "^1.2.7",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-iterator-helpers": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/es-iterator-helpers/-/es-iterator-helpers-1.4.0.tgz",
      "integrity": "sha512-c/A0P0oxkACDc+cKWw8evLXK83oBKgn0qPOqCYT4x9uolpCIJAcYvJC9QYKNDRPsTeGyCrQ326jrvgZWdCdK5Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-errors": "^1.3.0",
        "es-set-tostringtag": "^2.1.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.3.0",
        "globalthis": "^1.0.4",
        "gopd": "^1.2.0",
        "has-property-descriptors": "^1.0.2",
        "has-proto": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "iterator.prototype": "^1.1.5",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-shim-unscopables": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/es-shim-unscopables/-/es-shim-unscopables-1.1.0.tgz",
      "integrity": "sha512-d9T8ucsEhh8Bi1woXCf+TIKDIROLG5WCkxg8geBCbvk22kzwC5G2OnXVMO6FUsvQlgUUXQ2itephWDLqDzbeCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-to-primitive": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/es-to-primitive/-/es-to-primitive-1.3.4.tgz",
      "integrity": "sha512-yPDz7wqpg1/mmHLmS3tcfTfbw5f1eryXvyghYBffGdERwe+mV7ZcWzTR8LR17Kvqt3qfPurjlonmnq3MKXIOXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-abstract-get": "^1.0.0",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "is-callable": "^1.2.7",
        "is-date-object": "^1.1.0",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "9.39.4",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-9.39.4.tgz",
      "integrity": "sha512-XoMjdBOwe/esVgEvLmNsD3IRHkm7fbKIUGvrleloJXUZgDHig2IPWNniv+GwjyJXzuNqVjlr5+4yVUZjycJwfQ==",
      "deprecated": "This version is no longer supported. Please see https://eslint.org/version-support for other options.",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.8.0",
        "@eslint-community/regexpp": "^4.12.1",
        "@eslint/config-array": "^0.21.2",
        "@eslint/config-helpers": "^0.4.2",
        "@eslint/core": "^0.17.0",
        "@eslint/eslintrc": "^3.3.5",
        "@eslint/js": "9.39.4",
        "@eslint/plugin-kit": "^0.4.1",
        "@humanfs/node": "^0.16.6",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@humanwhocodes/retry": "^0.4.2",
        "@types/estree": "^1.0.6",
        "ajv": "^6.14.0",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.6",
        "debug": "^4.3.2",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^8.4.0",
        "eslint-visitor-keys": "^4.2.1",
        "espree": "^10.4.0",
        "esquery": "^1.5.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^8.0.0",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.5",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      },
      "peerDependencies": {
        "jiti": "*"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-config-next": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/eslint-config-next/-/eslint-config-next-16.2.6.tgz",
      "integrity": "sha512-z2ELYSkyrrJ6cuunTU8vhsT/RpouPkjaSah06nVW6Rg2Hpg0Vs8s497/e5s8G8qtdp4ccsiovz5P1rv+5VSW2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@next/eslint-plugin-next": "16.2.6",
        "eslint-import-resolver-node": "^0.3.6",
        "eslint-import-resolver-typescript": "^3.5.2",
        "eslint-plugin-import": "^2.32.0",
        "eslint-plugin-jsx-a11y": "^6.10.0",
        "eslint-plugin-react": "^7.37.0",
        "eslint-plugin-react-hooks": "^7.0.0",
        "globals": "16.4.0",
        "typescript-eslint": "^8.46.0"
      },
      "peerDependencies": {
        "eslint": ">=9.0.0",
        "typescript": ">=3.3.1"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-config-next/node_modules/globals": {
      "version": "16.4.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-16.4.0.tgz",
      "integrity": "sha512-ob/2LcVVaVGCYN+r14cnwnoDPUufjiYgSqRhiFD0Q1iI4Odora5RE8Iv1D24hAz5oMophRGkGz+yuvQmmUMnMw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint-import-resolver-node": {
      "version": "0.3.10",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-node/-/eslint-import-resolver-node-0.3.10.tgz",
      "integrity": "sha512-tRrKqFyCaKict5hOd244sL6EQFNycnMQnBe+j8uqGNXYzsImGbGUU4ibtoaBmv5FLwJwcFJNeg1GeVjQfbMrDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7",
        "is-core-module": "^2.16.1",
        "resolve": "^2.0.0-next.6"
      }
    },
    "node_modules/eslint-import-resolver-node/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-import-resolver-typescript": {
      "version": "3.10.1",
      "resolved": "https://registry.npmjs.org/eslint-import-resolver-typescript/-/eslint-import-resolver-typescript-3.10.1.tgz",
      "integrity": "sha512-A1rHYb06zjMGAxdLSkN2fXPBwuSaQ0iO5M/hdyS0Ajj1VBaRp0sPD3dn1FhME3c/JluGFbwSxyCfqdSbtQLAHQ==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@nolyfill/is-core-module": "1.0.39",
        "debug": "^4.4.0",
        "get-tsconfig": "^4.10.0",
        "is-bun-module": "^2.0.0",
        "stable-hash": "^0.0.5",
        "tinyglobby": "^0.2.13",
        "unrs-resolver": "^1.6.2"
      },
      "engines": {
        "node": "^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint-import-resolver-typescript"
      },
      "peerDependencies": {
        "eslint": "*",
        "eslint-plugin-import": "*",
        "eslint-plugin-import-x": "*"
      },
      "peerDependenciesMeta": {
        "eslint-plugin-import": {
          "optional": true
        },
        "eslint-plugin-import-x": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils": {
      "version": "2.14.0",
      "resolved": "https://registry.npmjs.org/eslint-module-utils/-/eslint-module-utils-2.14.0.tgz",
      "integrity": "sha512-W2WCRZ9Dqntd+2u8jJcVMV2PKulc6RdLgUUoh/yQr3uB6lo/ZOeGx11sv60/8S4QFFKNslAlWhr9u0Ef7ZW6Ig==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^3.2.7"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependenciesMeta": {
        "eslint": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-module-utils/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-import": {
      "version": "2.32.0",
      "resolved": "https://registry.npmjs.org/eslint-plugin-import/-/eslint-plugin-import-2.32.0.tgz",
      "integrity": "sha512-whOE1HFo/qJDyX4SnXzP4N6zOWn79WhnCUY/iDR0mPfQZO8wcYE4JClzI2oZrhBnnMUCBCHZhO6VQyoBU95mZA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@rtsao/scc": "^1.1.0",
        "array-includes": "^3.1.9",
        "array.prototype.findlastindex": "^1.2.6",
        "array.prototype.flat": "^1.3.3",
        "array.prototype.flatmap": "^1.3.3",
        "debug": "^3.2.7",
        "doctrine": "^2.1.0",
        "eslint-import-resolver-node": "^0.3.9",
        "eslint-module-utils": "^2.12.1",
        "hasown": "^2.0.2",
        "is-core-module": "^2.16.1",
        "is-glob": "^4.0.3",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "object.groupby": "^1.0.3",
        "object.values": "^1.2.1",
        "semver": "^6.3.1",
        "string.prototype.trimend": "^1.0.9",
        "tsconfig-paths": "^3.15.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^2 || ^3 || ^4 || ^5 || ^6 || ^7.2.0 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-import/node_modules/debug": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-3.2.7.tgz",
      "integrity": "sha512-CFjzYYAi4ThfiQvizrFQevTTXHtnCqWfe7x1AhgEscTz6ZbLbfoLRLPugTQyBth6f8ZERVUSyWHFD/7Wu4t1XQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.1"
      }
    },
    "node_modules/eslint-plugin-jsx-a11y": {
      "version": "6.10.2",
      "resolved": "https://registry.npmjs.org/eslint-plugin-jsx-a11y/-/eslint-plugin-jsx-a11y-6.10.2.tgz",
      "integrity": "sha512-scB3nz4WmG75pV8+3eRUQOHZlNSUhFNq37xnpgRkCCELU3XMvXAxLk1eqWWyE22Ki4Q01Fnsw9BA3cJHDPgn2Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "aria-query": "^5.3.2",
        "array-includes": "^3.1.8",
        "array.prototype.flatmap": "^1.3.2",
        "ast-types-flow": "^0.0.8",
        "axe-core": "^4.10.0",
        "axobject-query": "^4.1.0",
        "damerau-levenshtein": "^1.0.8",
        "emoji-regex": "^9.2.2",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^3.3.5",
        "language-tags": "^1.0.9",
        "minimatch": "^3.1.2",
        "object.fromentries": "^2.0.8",
        "safe-regex-test": "^1.0.3",
        "string.prototype.includes": "^2.0.1"
      },
      "engines": {
        "node": ">=4.0"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9"
      }
    },
    "node_modules/eslint-plugin-react": {
      "version": "7.37.5",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.37.5.tgz",
      "integrity": "sha512-Qteup0SqU15kdocexFNAJMvCJEfa2xUKNV4CC1xsVMrIIqEy3SQ/rqyxCWNzfrd3/ldy6HMlD2e0JDVpDg2qIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.8",
        "array.prototype.findlast": "^1.2.5",
        "array.prototype.flatmap": "^1.3.3",
        "array.prototype.tosorted": "^1.1.4",
        "doctrine": "^2.1.0",
        "es-iterator-helpers": "^1.2.1",
        "estraverse": "^5.3.0",
        "hasown": "^2.0.2",
        "jsx-ast-utils": "^2.4.1 || ^3.0.0",
        "minimatch": "^3.1.2",
        "object.entries": "^1.1.9",
        "object.fromentries": "^2.0.8",
        "object.values": "^1.2.1",
        "prop-types": "^15.8.1",
        "resolve": "^2.0.0-next.5",
        "semver": "^6.3.1",
        "string.prototype.matchall": "^4.0.12",
        "string.prototype.repeat": "^1.0.0"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "eslint": "^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9.7"
      }
    },
    "node_modules/eslint-plugin-react-hooks": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-hooks/-/eslint-plugin-react-hooks-7.1.1.tgz",
      "integrity": "sha512-f2I7Gw6JbvCexzIInuSbZpfdQ44D7iqdWX01FKLvrPgqxoE7oMj8clOfto8U6vYiz4yd5oKu39rRSVOe1zRu0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/core": "^7.24.4",
        "@babel/parser": "^7.24.4",
        "hermes-parser": "^0.25.1",
        "zod": "^3.25.0 || ^4.0.0",
        "zod-validation-error": "^3.5.0 || ^4.0.0"
      },
      "engines": {
        "node": ">=18"
      },
      "peerDependencies": {
        "eslint": "^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0 || ^10.0.0"
      }
    },
    "node_modules/eslint-scope": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-8.4.0.tgz",
      "integrity": "sha512-sNXOfKCn74rt8RICKMvJS7XKV/Xk9kA7DyJr8mJik3S7Cwgy3qlkkmyS2uQB3jiJg6VNdZd/pDBJu0nvG2NlTg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.2.1.tgz",
      "integrity": "sha512-Uhdk5sfqcee/9H/rCOJikYz67o0a2Tw2hGRPOG2Y1R2dg7brRe1uG0yaNQDHu+TO/uQPF/5eCapvYSmHUjt7JQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree": {
      "version": "10.4.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-10.4.0.tgz",
      "integrity": "sha512-j6PAQ2uUr79PZhBjP5C5fhl8e39FmRnOjsD5lGnWrFU8i2G776tBK7+nP8KuQUTTyAZUwfQqXAgrVH5MbH9CYQ==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "acorn": "^8.15.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^4.2.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.7.0.tgz",
      "integrity": "sha512-Ap6G0WQwcU/LHsvLwON1fAQX9Zp0A2Y6Y/cJBl9r/JbW90Zyg4/zbG6zzKa2OTALELarYHmKu0GhpM5EO+7T0g==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-glob": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.1.tgz",
      "integrity": "sha512-kNFPyjhh5cKjrUltxs+wFx+ZkbRaxxmZ+X0ZU31SOsxCEtP9VPgtq2teZw1DebupL5GmDaNQ6yKMMVcM41iqDg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fastq": {
      "version": "1.20.3",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.20.3.tgz",
      "integrity": "sha512-XKv5nnLs6nLF71NgiKJLIZFLkPyIEuOselLG7ujZnGrRfQK8HpvY+WqKhAJUAdLomwVHErVS4LfxFlPq0/FTAw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz",
      "integrity": "sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flat-cache": "^4.0.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat-cache": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz",
      "integrity": "sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flatted": "^3.2.9",
        "keyv": "^4.5.4"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/flatted": {
      "version": "3.4.4",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.4.4.tgz",
      "integrity": "sha512-5+ybhBZANEJxaH3X5evAFatUxLfEHSr7n6kYJ+1Qd0mUqr4eu9gIf6GDbWHf8RJijHrjjO8G+la14SlL2SeS1Q==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/for-each": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/for-each/-/for-each-0.3.5.tgz",
      "integrity": "sha512-dKx12eRCVIzqCxFGplyFKJMPvLEWgmNtUrpTiJIR5u97zEhRG8ySrtboPHZXx7daLxQVrl643cTzbab2tkQjxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-callable": "^1.2.7"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/frac": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/frac/-/frac-1.1.2.tgz",
      "integrity": "sha512-w/XBfkibaTl3YDqASwfDUqkna4Z2p9cFSr1aHDt0WoMTECnRfBOv2WArlZILlqgWlmdIlALXGpM2AOhEk5W3IA==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/function.prototype.name": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/function.prototype.name/-/function.prototype.name-1.2.0.tgz",
      "integrity": "sha512-jObKIik1P2QjPHP5nz5BaOtUlfgS0fWo8IUByNXkM+o+02sJOi94em77GwJKQSJ3gfPHdgzLNrHc1uokV4P/ew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2",
        "hasown": "^2.0.4",
        "is-callable": "^1.2.7",
        "is-document.all": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functions-have-names": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/functions-have-names/-/functions-have-names-1.2.3.tgz",
      "integrity": "sha512-xckBUXyTIqT97tq2x2AMb+g163b5JFysYk0x4qxNFwbfQkmNZoiRHb6sPzI9/QV33WeuvVYBUIiD4NzNIyqaRQ==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/generator-function": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/generator-function/-/generator-function-2.0.1.tgz",
      "integrity": "sha512-SFdFmIJi+ybC0vjlHN0ZGVGHc3lgE0DxPAT0djjVg+kjOnSqclqmj0KQ7ykTOLP6YxoqOvuAODGdcHJn+43q3g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "resolved": "https://registry.npmjs.org/gensync/-/gensync-1.0.0-beta.2.tgz",
      "integrity": "sha512-3hN7NaskYvMDLQY55gnW3NQ+mesEAepTqlg+VEbj7zzqEMBVNhzcGYYeqFo/TlYz6eQiFcp1HcsCZO+nGgS8zg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/get-symbol-description": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/get-symbol-description/-/get-symbol-description-1.1.0.tgz",
      "integrity": "sha512-w9UMqWwJxHNOvoNzSJ2oPF5wvYcvP7jUvYzhp67yEhTi17ZDBBC1z9pTdGuzjD+EFIqLSYRweZjqfiPzQ06Ebg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-tsconfig": {
      "version": "4.14.3",
      "resolved": "https://registry.npmjs.org/get-tsconfig/-/get-tsconfig-4.14.3.tgz",
      "integrity": "sha512-++QEw4DIY7WGoukz+/+A/8dGYPT9l9yIadnmSgZ8Rjr3YVSVDipQSO9CdnJo9ePqFqUUqh+wk9uIaoiAwsiPkA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-pkg-maps": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/privatenumber/get-tsconfig?sponsor=1"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/globals": {
      "version": "14.0.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/globalthis": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/globalthis/-/globalthis-1.0.4.tgz",
      "integrity": "sha512-DpLKbNU4WylpxJykQujfCcwYWiV/Jhm50Goo0wrVILAv5jOr9d+H+UR3PhSCD2rCCEIg0uc+G+muBTwD54JhDQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.2.1",
        "gopd": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/has-bigints": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-bigints/-/has-bigints-1.1.0.tgz",
      "integrity": "sha512-R3pbpkcIqv2Pm3dUwgjclDRVmWpTJW2DcMzcIhEXEx1oh/CEMObMm3KLmRJOdvhM7o4uQBnwr8pzRK2sJWIqfg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.2.tgz",
      "integrity": "sha512-55JNKuIW+vq4Ke1BjOTjM2YctQIvCT7GFzHwmfZPGo5wnrgkid0YQtnAleFSqumZm4az3n2BS+erby5ipJdgrg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-define-property": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-proto": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/has-proto/-/has-proto-1.2.0.tgz",
      "integrity": "sha512-KIL7eQPfHQRC8+XluaIw7BHUwwqL19bQn4hzNgdr+1wXoU0KKj6rufu47lhY7KbJR2C6T6+PfyN0Ea7wkSS+qQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/hermes-estree": {
      "version": "0.25.1",
      "resolved": "https://registry.npmjs.org/hermes-estree/-/hermes-estree-0.25.1.tgz",
      "integrity": "sha512-0wUoCcLp+5Ev5pDW2OriHC2MJCbwLwuRx+gAqMTOkGKJJiBCLjtrvy4PWUGn6MIVefecRpzoOZ/UV6iGdOr+Cw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/hermes-parser": {
      "version": "0.25.1",
      "resolved": "https://registry.npmjs.org/hermes-parser/-/hermes-parser-0.25.1.tgz",
      "integrity": "sha512-6pEjquH3rqaI6cYAXYPcz9MS4rY6R4ngRgrgfDshRptUZIc3lw0MCIJIGDj9++mfySOuPTHB4nrSW99BCvOPIA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hermes-estree": "0.25.1"
      }
    },
    "node_modules/ignore": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/import-fresh": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.1.tgz",
      "integrity": "sha512-TR3KfrTZTYLPB6jUjfx6MF9WcWrHL9su5TObK4ZkYgBdWKPOFoSoQIdEuTuR82pmtxH2spWG9h6etwfr1pLBqQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/internal-slot": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/internal-slot/-/internal-slot-1.1.0.tgz",
      "integrity": "sha512-4gd7VpWNQNB4UKKCFFVcp1AVv+FMOgs9NKzjHKusc8jTMhd5eL1NqQqOpE0KzMds804/yHlglp3uxgluOqAPLw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "hasown": "^2.0.2",
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/is-array-buffer": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/is-array-buffer/-/is-array-buffer-3.0.5.tgz",
      "integrity": "sha512-DDfANUiiG2wC1qawP66qlTugJeL5HyzMpfr8lLK+jMQirGzNod0B12cFB/9q838Ru27sBwfw78/rdoU7RERz6A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-async-function": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-async-function/-/is-async-function-2.1.1.tgz",
      "integrity": "sha512-9dgM/cZBnNvjzaMYHVoxxfPj2QXt22Ev7SuuPrs+xav0ukGB0S6d4ydZdEiM48kLx5kDV+QBPrpVnFyefL8kkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "async-function": "^1.0.0",
        "call-bound": "^1.0.3",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bigint": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-bigint/-/is-bigint-1.1.0.tgz",
      "integrity": "sha512-n4ZT37wG78iz03xPRKJrHTdZbe3IicyucEtdRsV5yglwc3GyUfbAfpSeD0FJ41NbUNSt5wbhqfp1fS+BgnvDFQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-bigints": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-boolean-object": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/is-boolean-object/-/is-boolean-object-1.2.2.tgz",
      "integrity": "sha512-wa56o2/ElJMYqjCjGkXri7it5FbebW5usLw/nPmCMs5DeZ7eziSYZhSmPRn0txqeW4LnAmQQU7FgqLpsEFKM4A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-bun-module": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/is-bun-module/-/is-bun-module-2.0.0.tgz",
      "integrity": "sha512-gNCGbnnnnFAUGKeZ9PdbyeGYJqewpmc2aKHUEMO5nQPWU9lOmv7jcmQIv+qHD8fXW6W7qfuCwX4rY9LNRjXrkQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^7.7.1"
      }
    },
    "node_modules/is-bun-module/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/is-callable": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/is-callable/-/is-callable-1.2.7.tgz",
      "integrity": "sha512-1BC0BVFhS/p0qtw6enp8e+8OD0UrK0oFLztSjNzhcKA3WDuJxxAPXzPuPtKkjEY9UUoEWlX/8fgKeu2S8i9JTA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.17.0",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.17.0.tgz",
      "integrity": "sha512-J/vG0zBCbIKOQFfufSwyXdMrsohyJIUNkrnmo6WZGzoM7tr/lsbfW5b2BvisL6zsyMzK9UxV9L6c7AoFbyXHOA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-data-view": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/is-data-view/-/is-data-view-1.0.2.tgz",
      "integrity": "sha512-RKtWF8pGmS87i2D6gqQu/l7EYRlVdfzemCJN/P3UOs//x1QE7mfhvzHIApBTRf7axvT6DMGwSwBXYCT0nfB9xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "get-intrinsic": "^1.2.6",
        "is-typed-array": "^1.1.13"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-date-object": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/is-date-object/-/is-date-object-1.1.0.tgz",
      "integrity": "sha512-PwwhEakHVKTdRNVOw+/Gyh0+MzlCl4R6qKvkhuvLtPMggI1WAHt9sOwZxQLSGpUaDnrdyDsomoRgNnCfKNSXXg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-document.all": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/is-document.all/-/is-document.all-1.0.0.tgz",
      "integrity": "sha512-+XSoyS05OdBbhFuELhgTCpFNHkpBOJqtsZfUFFpe5QTw+9Sjbh8zitxhQkYAo6wV7e1Vb8cAPvpCk9jGam/82g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-finalizationregistry": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-finalizationregistry/-/is-finalizationregistry-1.1.1.tgz",
      "integrity": "sha512-1pC6N8qWJbWoPtEjgcL2xyhQOP491EQjeUo3qTKcmV8YSDDJrOepfG8pcC7h/QgnQHYSv0mJ3Z/ZWxmatVrysg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-generator-function": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/is-generator-function/-/is-generator-function-1.1.2.tgz",
      "integrity": "sha512-upqt1SkGkODW9tsGNG5mtXTXtECizwtS2kA161M+gJPc1xdb/Ax629af6YrTwcOeQHbewrPNlE5Dx7kzvXTizA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4",
        "generator-function": "^2.0.0",
        "get-proto": "^1.0.1",
        "has-tostringtag": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-map": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-map/-/is-map-2.0.3.tgz",
      "integrity": "sha512-1Qed0/Hr2m+YqxnM09CjA2d/i6YZNfF6R2oRAOj36eUdS6qIV/huPJNSEpKbupewFs+ZsJlxsjjPbc0/afW6Lw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-negative-zero": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-negative-zero/-/is-negative-zero-2.0.3.tgz",
      "integrity": "sha512-5KoIu2Ngpyek75jXodFvnafB6DJgr3u8uuK0LEZJjrU19DrMD3EVERaR8sjz8CCGgpZvxPl9SuE1GMVPFHx1mw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-number-object": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-number-object/-/is-number-object-1.1.1.tgz",
      "integrity": "sha512-lZhclumE1G6VYD8VHe35wFaIif+CTy5SJIi5+3y4psDgWu4wPDoBhF8NxUOinEc7pHgiTsT6MaBb92rKhhD+Xw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-regex": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/is-regex/-/is-regex-1.2.1.tgz",
      "integrity": "sha512-MjYsKHO5O7mCsmRGxWcLWheFqN9DJ/2TmngvjKXihe6efViPqc274+Fx/4fYj/r03+ESvBdTXK0V6tA3rgez1g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-set": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/is-set/-/is-set-2.0.3.tgz",
      "integrity": "sha512-iPAjerrse27/ygGLxw+EBR9agv9Y6uLeYVJMu+QNCoouJ1/1ri0mGrcWpfCqFZuzzx3WjtwxG098X+n4OuRkPg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-shared-array-buffer": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/is-shared-array-buffer/-/is-shared-array-buffer-1.0.4.tgz",
      "integrity": "sha512-ISWac8drv4ZGfwKl5slpHG9OwPNty4jOWPRIhBpxOoD+hqITiwuipOQ2bNthAzwA3B4fIjO4Nln74N0S9byq8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-string": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-string/-/is-string-1.1.1.tgz",
      "integrity": "sha512-BtEeSsoaQjlSPBemMQIrY1MY0uM6vnS1g5fmufYOtnxLGUZM2178PKbhsk7Ffv58IX+ZtcvoGwccYsh0PglkAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-symbol": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-symbol/-/is-symbol-1.1.1.tgz",
      "integrity": "sha512-9gGx6GTtCQM73BgmHQXfDmLtfjjTUDSyoxTCbp5WtoixAhfgsDirWIcVQ/IHpvI5Vgd5i/J5F7B9cN/WlVbC/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "has-symbols": "^1.1.0",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-typed-array": {
      "version": "1.1.15",
      "resolved": "https://registry.npmjs.org/is-typed-array/-/is-typed-array-1.1.15.tgz",
      "integrity": "sha512-p3EcsicXjit7SaskXHs1hA91QxgTw46Fv6EFKKGS5DRFLD8yKnohjF3hxoju94b/OcMZoQukzpPpBE9uLVKzgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakmap": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/is-weakmap/-/is-weakmap-2.0.2.tgz",
      "integrity": "sha512-K5pXYOm9wqY1RgjpL3YTkF39tni1XajUIkawTLUo9EZEVUFga5gSQJF8nNS7ZwJQ02y+1YCNYcMh+HIf1ZqE+w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakref": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/is-weakref/-/is-weakref-1.1.1.tgz",
      "integrity": "sha512-6i9mGWSlqzNMEqpCp93KwRS1uUOodk2OJ6b+sq7ZPDSy2WuI5NFIxp/254TytR8ftefexkWn5xNiHUNpPOfSew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-weakset": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/is-weakset/-/is-weakset-2.0.4.tgz",
      "integrity": "sha512-mfcwb6IzQyOKTs84CQMrOwW4gQcaTOAWJ0zzJCl2WSPDrWk/OzDaImWFH3djXhb24g4eudZfLRozAvPGw4d9hQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "get-intrinsic": "^1.2.6"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/isarray": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/isarray/-/isarray-2.0.5.tgz",
      "integrity": "sha512-xHjhDr3cNBK0BzdUJSPXZntQUx/mwMS5Rw4A7lPJ90XGAO6ISP/ePDNuo0vhqOZU+UD5JoodwCAAoZQd3FeAKw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/iterator.prototype": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/iterator.prototype/-/iterator.prototype-1.1.5.tgz",
      "integrity": "sha512-H0dkQoCa3b2VEeKQBOxFph+JAbcrQdE7KC0UkqwpLmv2EC4P41QXP+rqo9wYodACiG5/WM5s9oDApTU8utwj9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.6",
        "get-proto": "^1.0.0",
        "has-symbols": "^1.1.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/jiti": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-2.7.0.tgz",
      "integrity": "sha512-AC/7JofJvZGrrneWNaEnJeOLUx+JlGt7tNa0wZiRPT4MY1wmfKjt2+6O2p2uz2+skll8OZZmJMNqeke7kKbNgQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "lib/jiti-cli.mjs"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.3.2",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.3.2.tgz",
      "integrity": "sha512-SFNOvSJ+Dgf/9An904Yx+CgSlIPCkIpao4qo51lpee25TIRejdH3rhR4EZMGoNx3/TP3O+wzWuiTFl4sqbltzA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/puzrin"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/nodeca"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsesc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
      "integrity": "sha512-/sM3dO2FOzXjKQhJuo0Q173wf2KOo8t4I8vHy6lF9poUp7bKT0/NHE8fPX23PwfhnykfqnC2xRxOnVw5XuGIaA==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json5": {
      "version": "2.2.3",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
      "integrity": "sha512-XmOWe7eyHYH14cLdVPoyg+GOH3rYX++KpzrylJwSW98t3Nk+U8XOl8FWKOgwtzdb8lXGf6zYwDUzeHMWfxasyg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/jsx-ast-utils": {
      "version": "3.3.5",
      "resolved": "https://registry.npmjs.org/jsx-ast-utils/-/jsx-ast-utils-3.3.5.tgz",
      "integrity": "sha512-ZZow9HBI5O6EPgSJLUb8n2NKgmVWTwCvHGwFuJlMjvLFqlGG6pjirPhtdsseaLZjSibD8eegzmYpUZwoIlj2cQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array-includes": "^3.1.6",
        "array.prototype.flat": "^1.3.1",
        "object.assign": "^4.1.4",
        "object.values": "^1.1.6"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/keyv": {
      "version": "4.5.4",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/language-subtag-registry": {
      "version": "0.3.23",
      "resolved": "https://registry.npmjs.org/language-subtag-registry/-/language-subtag-registry-0.3.23.tgz",
      "integrity": "sha512-0K65Lea881pHotoGEa5gDlMxt3pctLi2RplBb7Ezh4rRdLEOtgi7n4EwK9lamnUCkKBqaeKRVebTq6BAxSkpXQ==",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/language-tags": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/language-tags/-/language-tags-1.0.9.tgz",
      "integrity": "sha512-MbjN408fEndfiQXbFQ1vnd+1NoLDsnQW41410oQBXiyXDMYH5z505juWa4KUE1LqxRC7DgOgZDbKLxHIwm27hA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "language-subtag-registry": "^0.3.20"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lightningcss": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss/-/lightningcss-1.30.2.tgz",
      "integrity": "sha512-utfs7Pr5uJyyvDETitgsaqSyjCb2qNRAtuqUeWIAKztsOYdcACf2KtARYXg2pSvhkt+9NfoaNY7fxjl6nuMjIQ==",
      "dev": true,
      "license": "MPL-2.0",
      "dependencies": {
        "detect-libc": "^2.0.3"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      },
      "optionalDependencies": {
        "lightningcss-android-arm64": "1.30.2",
        "lightningcss-darwin-arm64": "1.30.2",
        "lightningcss-darwin-x64": "1.30.2",
        "lightningcss-freebsd-x64": "1.30.2",
        "lightningcss-linux-arm-gnueabihf": "1.30.2",
        "lightningcss-linux-arm64-gnu": "1.30.2",
        "lightningcss-linux-arm64-musl": "1.30.2",
        "lightningcss-linux-x64-gnu": "1.30.2",
        "lightningcss-linux-x64-musl": "1.30.2",
        "lightningcss-win32-arm64-msvc": "1.30.2",
        "lightningcss-win32-x64-msvc": "1.30.2"
      }
    },
    "node_modules/lightningcss-android-arm64": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-android-arm64/-/lightningcss-android-arm64-1.30.2.tgz",
      "integrity": "sha512-BH9sEdOCahSgmkVhBLeU7Hc9DWeZ1Eb6wNS6Da8igvUwAe0sqROHddIlvU06q3WyXVEOYDZ6ykBZQnjTbmo4+A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-arm64": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-1.30.2.tgz",
      "integrity": "sha512-ylTcDJBN3Hp21TdhRT5zBOIi73P6/W0qwvlFEk22fkdXchtNTOU4Qc37SkzV+EKYxLouZ6M4LG9NfZ1qkhhBWA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-darwin-x64": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-darwin-x64/-/lightningcss-darwin-x64-1.30.2.tgz",
      "integrity": "sha512-oBZgKchomuDYxr7ilwLcyms6BCyLn0z8J0+ZZmfpjwg9fRVZIR5/GMXd7r9RH94iDhld3UmSjBM6nXWM2TfZTQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-freebsd-x64": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-freebsd-x64/-/lightningcss-freebsd-x64-1.30.2.tgz",
      "integrity": "sha512-c2bH6xTrf4BDpK8MoGG4Bd6zAMZDAXS569UxCAGcA7IKbHNMlhGQ89eRmvpIUGfKWNVdbhSbkQaWhEoMGmGslA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm-gnueabihf": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm-gnueabihf/-/lightningcss-linux-arm-gnueabihf-1.30.2.tgz",
      "integrity": "sha512-eVdpxh4wYcm0PofJIZVuYuLiqBIakQ9uFZmipf6LF/HRj5Bgm0eb3qL/mr1smyXIS1twwOxNWndd8z0E374hiA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-gnu": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-gnu/-/lightningcss-linux-arm64-gnu-1.30.2.tgz",
      "integrity": "sha512-UK65WJAbwIJbiBFXpxrbTNArtfuznvxAJw4Q2ZGlU8kPeDIWEX1dg3rn2veBVUylA2Ezg89ktszWbaQnxD/e3A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-arm64-musl": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-arm64-musl/-/lightningcss-linux-arm64-musl-1.30.2.tgz",
      "integrity": "sha512-5Vh9dGeblpTxWHpOx8iauV02popZDsCYMPIgiuw97OJ5uaDsL86cnqSFs5LZkG3ghHoX5isLgWzMs+eD1YzrnA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-gnu": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-gnu/-/lightningcss-linux-x64-gnu-1.30.2.tgz",
      "integrity": "sha512-Cfd46gdmj1vQ+lR6VRTTadNHu6ALuw2pKR9lYq4FnhvgBc4zWY1EtZcAc6EffShbb1MFrIPfLDXD6Xprbnni4w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-linux-x64-musl": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-linux-x64-musl/-/lightningcss-linux-x64-musl-1.30.2.tgz",
      "integrity": "sha512-XJaLUUFXb6/QG2lGIW6aIk6jKdtjtcffUT0NKvIqhSBY3hh9Ch+1LCeH80dR9q9LBjG3ewbDjnumefsLsP6aiA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-arm64-msvc": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-arm64-msvc/-/lightningcss-win32-arm64-msvc-1.30.2.tgz",
      "integrity": "sha512-FZn+vaj7zLv//D/192WFFVA0RgHawIcHqLX9xuWiQt7P0PtdFEVaxgF9rjM/IRYHQXNnk61/H/gb2Ei+kUQ4xQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/lightningcss-win32-x64-msvc": {
      "version": "1.30.2",
      "resolved": "https://registry.npmjs.org/lightningcss-win32-x64-msvc/-/lightningcss-win32-x64-msvc-1.30.2.tgz",
      "integrity": "sha512-5g1yc73p+iAkid5phb4oVFMB45417DkRevRbt/El/gKXJk4jid+vPFF/AXbxn05Aky8PapwzZrdJShv5C0avjw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MPL-2.0",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 12.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/parcel"
      }
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/lru-cache": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-5.1.1.tgz",
      "integrity": "sha512-KpNARQA3Iwv+jTA0utUVVbrh+Jlrr1Fv0e56GGzAFOXN7dk/FviaDW8LHmK52DlcH4WP2n6gI8vN1aesBFgo9w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^3.0.2"
      }
    },
    "node_modules/lucide-react": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-1.52.0.tgz",
      "integrity": "sha512-TUgPtl5ZI9WgxOcbu4ckaC5B3l1qxPQrCMgb6OfUB9owx/OvSJfcf93SMgUWAxRw5/1XDfh9uI5F5iNGXCcGDQ==",
      "license": "ISC",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/minimist/-/minimist-1.2.8.tgz",
      "integrity": "sha512-2yyAR8qBkN3YuheJanUpWC5U3bb5osDywNB8RzDVlDwDHbocAJveqqj1u8+SVD7jkWT4yvsHCpWqqWqAxb0zCA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.20",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.20.tgz",
      "integrity": "sha512-uKdg2G3GNCKQn9byYOpxbGqrT2fGO5KRt5J/8b3pok8rT6qxGWF6hxMyJiEYtAf+FVyYuD9hRaDqX5uPFYJ4ZQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/napi-postinstall": {
      "version": "0.3.4",
      "resolved": "https://registry.npmjs.org/napi-postinstall/-/napi-postinstall-0.3.4.tgz",
      "integrity": "sha512-PHI5f1O0EP5xJ9gQmFGMS6IZcrVvTjpXjz7Na41gTE7eE2hK11lg04CECCYEEjdc17EV4DO+fkGEtt7TpTaTiQ==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "napi-postinstall": "lib/cli.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.18.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/napi-postinstall"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/next": {
      "version": "16.2.6",
      "resolved": "https://registry.npmjs.org/next/-/next-16.2.6.tgz",
      "integrity": "sha512-qOVgKJg1+At15NpeUP+eJgCHvTCgXsogweq87Ri/Ix7PkqQHg4sdaXmSFqKlgaIXE4kW0g25LE68W87UANlHtw==",
      "license": "MIT",
      "dependencies": {
        "@next/env": "16.2.6",
        "@swc/helpers": "0.5.15",
        "baseline-browser-mapping": "^2.9.19",
        "caniuse-lite": "^1.0.30001579",
        "postcss": "8.4.31",
        "styled-jsx": "5.1.6"
      },
      "bin": {
        "next": "dist/bin/next"
      },
      "engines": {
        "node": ">=20.9.0"
      },
      "optionalDependencies": {
        "@next/swc-darwin-arm64": "16.2.6",
        "@next/swc-darwin-x64": "16.2.6",
        "@next/swc-linux-arm64-gnu": "16.2.6",
        "@next/swc-linux-arm64-musl": "16.2.6",
        "@next/swc-linux-x64-gnu": "16.2.6",
        "@next/swc-linux-x64-musl": "16.2.6",
        "@next/swc-win32-arm64-msvc": "16.2.6",
        "@next/swc-win32-x64-msvc": "16.2.6",
        "sharp": "^0.34.5"
      },
      "peerDependencies": {
        "@opentelemetry/api": "^1.1.0",
        "@playwright/test": "^1.51.1",
        "babel-plugin-react-compiler": "*",
        "react": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "react-dom": "^18.2.0 || 19.0.0-rc-de68d2f4-20241204 || ^19.0.0",
        "sass": "^1.3.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        },
        "@playwright/test": {
          "optional": true
        },
        "babel-plugin-react-compiler": {
          "optional": true
        },
        "sass": {
          "optional": true
        }
      }
    },
    "node_modules/next/node_modules/postcss": {
      "version": "8.4.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.31.tgz",
      "integrity": "sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.6",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/node-exports-info": {
      "version": "1.6.2",
      "resolved": "https://registry.npmjs.org/node-exports-info/-/node-exports-info-1.6.2.tgz",
      "integrity": "sha512-kXs9Go0cah0qHVV2v389IXQLdLCeE1xfFtjOAF+iobu0OIoG1pje8At2vMHyaPMiPMnG/LWP50twML21eMcAag==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "array.prototype.flatmap": "^1.3.3",
        "es-errors": "^1.3.0",
        "object.entries": "^1.1.9",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.57",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.57.tgz",
      "integrity": "sha512-kQK9LGGFiHtrWiNhZtA7Qbw17AQz+dmsEKODRIVTXA9+e5MS/2gZEBhYJt13GrAz5/IOZKddH/0Z3TP/Zgo+yw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/object-keys/-/object-keys-1.1.1.tgz",
      "integrity": "sha512-NuAESUOUMrlIXOfHKzD6bpPu3tYt3xvjNdRIQ+FeT0lNb4K8WR70CaDxhuNguS2XG+GjkyMwOzsN5ZktImfhLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.7",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.7.tgz",
      "integrity": "sha512-nK28WOo+QIjBkDduTINE4JkF/UJJKyf2EJxvJKfblDpyg0Q+pkOHNTL0Qwy6NP6FhE/EnzV73BxxqcJaXY9anw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0",
        "has-symbols": "^1.1.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.entries": {
      "version": "1.1.9",
      "resolved": "https://registry.npmjs.org/object.entries/-/object.entries-1.1.9.tgz",
      "integrity": "sha512-8u/hfXFRBD1O0hPUjioLhoWFHRmt6tKA4/vZPyckBr18l1KE9uHrFaFaUi8MDRTpi4uak2goyPTSNJLXX2k2Hw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.fromentries": {
      "version": "2.0.8",
      "resolved": "https://registry.npmjs.org/object.fromentries/-/object.fromentries-2.0.8.tgz",
      "integrity": "sha512-k6E21FzySsSK5a21KRADBd/NGneRegFO5pLHfdQLpRDETUNJueLXs3WCzyQ3tFRDYgbq3KHGXfTbi2bs8WQ6rQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/object.groupby": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/object.groupby/-/object.groupby-1.0.3.tgz",
      "integrity": "sha512-+Lhy3TQTuzXI5hevh8sBGqbmurHbbIjAi0Z4S63nthVLmLxfbj4T54a4CfZrXIrt9iP4mVAPYMo/v99taj3wjQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.values": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/object.values/-/object.values-1.2.1.tgz",
      "integrity": "sha512-gXah6aZrcUxjWg2zR2MwouP2eHlCBzdV4pygudehaKXSGW4v2AsRQUK+lwwXhii6KFZcunEnmSUoYp5CXibxtA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "call-bound": "^1.0.3",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.5"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/own-keys": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/own-keys/-/own-keys-1.0.2.tgz",
      "integrity": "sha512-19YVAg7T+WTrxggPukVq7DjTv6+PJ867TmhCvBsYwmbFCsZd344rq2Ld1p0wo8f8Qrrhgp82c6FJRqdXWtSEhg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.4",
        "get-intrinsic": "^1.3.0",
        "object-keys": "^1.1.1",
        "safe-push-apply": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.2",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz",
      "integrity": "sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/possible-typed-array-names": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",
      "integrity": "sha512-/+5VFTchJDoVj3bhoqi6UeymcD00DAwb1nJwamzPvHEszJ4FpF6SNNbUbOS8yI56qHzdV8eK0qEfOSiodkTdxg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.8",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.8.tgz",
      "integrity": "sha512-OW/rX8O/jXnm82Ey1k44pObPtdblfiuWnrd8X7GJ7emImCOstunGbXUpp7HdBrFQX6rJzn3sPT397Wp5aCwCHg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.11",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/react": {
      "version": "19.2.6",
      "resolved": "https://registry.npmjs.org/react/-/react-19.2.6.tgz",
      "integrity": "sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "19.2.6",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz",
      "integrity": "sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==",
      "license": "MIT",
      "dependencies": {
        "scheduler": "^0.27.0"
      },
      "peerDependencies": {
        "react": "^19.2.6"
      }
    },
    "node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/reflect.getprototypeof": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/reflect.getprototypeof/-/reflect.getprototypeof-1.0.10.tgz",
      "integrity": "sha512-00o4I+DVrefhv+nX0ulyi3biSHCPDe+yLv5o/p6d/UVlirijB8E16FtfwSAi4g3tcqrQ4lRAqQSoFEZJehYEcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.9",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0",
        "get-intrinsic": "^1.2.7",
        "get-proto": "^1.0.1",
        "which-builtin-type": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/regexp.prototype.flags": {
      "version": "1.5.4",
      "resolved": "https://registry.npmjs.org/regexp.prototype.flags/-/regexp.prototype.flags-1.5.4.tgz",
      "integrity": "sha512-dYqgNSZbDwkaJ2ceRd9ojCGjBq+mOm9LmtXnAnEGyHhN/5R7iDW2TRw3h+o/jCFxus3P2LfWIIiwowAjANm7IA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "define-properties": "^1.2.1",
        "es-errors": "^1.3.0",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "set-function-name": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve": {
      "version": "2.0.0-next.7",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-2.0.0-next.7.tgz",
      "integrity": "sha512-tqt+NBWwyaMgw3zDsnygx4CByWjQEJHOPMdslYhppaQSJUtL/D4JO9CcBBlhPoI8lz9oJIDXkwXfhF4aWqP8xQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "is-core-module": "^2.16.2",
        "node-exports-info": "^1.6.0",
        "object-keys": "^1.1.1",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/resolve-pkg-maps": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/resolve-pkg-maps/-/resolve-pkg-maps-1.0.0.tgz",
      "integrity": "sha512-seS2Tj26TBVOC2NIc2rOe2y2ZO7efxITtLZcGSOnHHNOQ7CkiUBfw0Iw2ck6xkIhPwLhKNLS8BO+hEpngQlqzw==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/privatenumber/resolve-pkg-maps?sponsor=1"
      }
    },
    "node_modules/reusify": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
      "integrity": "sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/safe-array-concat": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/safe-array-concat/-/safe-array-concat-1.1.4.tgz",
      "integrity": "sha512-wtZlHyOje6OZTGqAoaDKxFkgRtkF9CnHAVnCHKfuj200wAgL+bSJhdsCD2l0Qx/2ekEXjPWcyKkfGb5CPboslg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "get-intrinsic": "^1.3.0",
        "has-symbols": "^1.1.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">=0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-push-apply": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/safe-push-apply/-/safe-push-apply-1.0.0.tgz",
      "integrity": "sha512-iKE9w/Z7xCzUMIZqdBsp6pEQvwuEebH4vdpjcDWnyzaI6yl6O9FHvVpmGelvEHNsoY6wGblkxR6Zty/h00WiSA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "isarray": "^2.0.5"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/safe-regex-test": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/safe-regex-test/-/safe-regex-test-1.1.0.tgz",
      "integrity": "sha512-x/+Cz4YrimQxQccJf5mKEbIa1NzeCRNI5Ecl/ekmlYaampdNLPalVyIcCZNNH3MvmqBugV5TMYZXv0ljslUlaw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "is-regex": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/scheduler": {
      "version": "0.27.0",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz",
      "integrity": "sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.1.tgz",
      "integrity": "sha512-BR7VvDCVHO+q2xBEWskxS6DJE1qRnb7DxzUrogb71CWoSficBxYsiAGd+Kl0mmq/MprG9yArRkyrQxTO6XjMzA==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/set-function-length": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/set-function-length/-/set-function-length-1.2.2.tgz",
      "integrity": "sha512-pgRc4hJ4/sNjWCSS9AmnS40x3bNMDTknHgL5UaMBTMyJnU90EgWh1Rz+MC9eFu4BuN/UwZjKQuY/1v3rM7HMfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2",
        "get-intrinsic": "^1.2.4",
        "gopd": "^1.0.1",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-function-name": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/set-function-name/-/set-function-name-2.0.2.tgz",
      "integrity": "sha512-7PGFlmtwsEADb0WYyvCMa1t+yke6daIG4Wirafur5kcf+MhUnPms1UeR0CKQdTZD81yESwMHbtn+TR+dMviakQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-data-property": "^1.1.4",
        "es-errors": "^1.3.0",
        "functions-have-names": "^1.2.3",
        "has-property-descriptors": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/set-proto": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/set-proto/-/set-proto-1.0.0.tgz",
      "integrity": "sha512-RJRdvCo6IAnPdsvP/7m6bsQqNnn1FCBX5ZNtFL98MmFF/4xAIJTIg1YbHW5DC2W5SKZanrC6i4HsJqlajw/dZw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/sharp": {
      "version": "0.34.5",
      "resolved": "https://registry.npmjs.org/sharp/-/sharp-0.34.5.tgz",
      "integrity": "sha512-Ou9I5Ft9WNcCbXrU9cMgPBcCK8LiwLqcbywW3t4oDV37n1pzpuNLsYiAV8eODnjbtQlSDwZ2cUEeQz4E54Hltg==",
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@img/colour": "^1.0.0",
        "detect-libc": "^2.1.2",
        "semver": "^7.7.3"
      },
      "engines": {
        "node": "^18.17.0 || ^20.3.0 || >=21.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/libvips"
      },
      "optionalDependencies": {
        "@img/sharp-darwin-arm64": "0.34.5",
        "@img/sharp-darwin-x64": "0.34.5",
        "@img/sharp-libvips-darwin-arm64": "1.2.4",
        "@img/sharp-libvips-darwin-x64": "1.2.4",
        "@img/sharp-libvips-linux-arm": "1.2.4",
        "@img/sharp-libvips-linux-arm64": "1.2.4",
        "@img/sharp-libvips-linux-ppc64": "1.2.4",
        "@img/sharp-libvips-linux-riscv64": "1.2.4",
        "@img/sharp-libvips-linux-s390x": "1.2.4",
        "@img/sharp-libvips-linux-x64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-arm64": "1.2.4",
        "@img/sharp-libvips-linuxmusl-x64": "1.2.4",
        "@img/sharp-linux-arm": "0.34.5",
        "@img/sharp-linux-arm64": "0.34.5",
        "@img/sharp-linux-ppc64": "0.34.5",
        "@img/sharp-linux-riscv64": "0.34.5",
        "@img/sharp-linux-s390x": "0.34.5",
        "@img/sharp-linux-x64": "0.34.5",
        "@img/sharp-linuxmusl-arm64": "0.34.5",
        "@img/sharp-linuxmusl-x64": "0.34.5",
        "@img/sharp-wasm32": "0.34.5",
        "@img/sharp-win32-arm64": "0.34.5",
        "@img/sharp-win32-ia32": "0.34.5",
        "@img/sharp-win32-x64": "0.34.5"
      }
    },
    "node_modules/sharp/node_modules/semver": {
      "version": "7.8.5",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
      "license": "ISC",
      "optional": true,
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.1.tgz",
      "integrity": "sha512-6x6dK6zJdpTzF4sQeNYxwtvBzf6Eg4GtlesS94HOvTudUeyK2WXAaIfmDgsyslYrRBeFIlsi54AYsFGUuhmvrQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4",
        "side-channel-list": "^1.0.1",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.1.tgz",
      "integrity": "sha512-mjn/0bi/oUURjc5Xl7IaWi/OJJJumuoJFQJfDDyO46+hBWsfaVM65TBHq2eoZBhzl9EchxOijpkbRC8SVBQU0w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.2.tgz",
      "integrity": "sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/ssf": {
      "version": "0.11.2",
      "resolved": "https://registry.npmjs.org/ssf/-/ssf-0.11.2.tgz",
      "integrity": "sha512-+idbmIXoYET47hH+d7dfm2epdOMUDjqcB4648sTZ+t2JwoyBFL/insLfB/racrDmsKB3diwsDA696pZMieAC5g==",
      "license": "Apache-2.0",
      "dependencies": {
        "frac": "~1.1.2"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/stable-hash": {
      "version": "0.0.5",
      "resolved": "https://registry.npmjs.org/stable-hash/-/stable-hash-0.0.5.tgz",
      "integrity": "sha512-+L3ccpzibovGXFK+Ap/f8LOS0ahMrHTf3xu7mMLSpEGU0EO9ucaysSylKo9eRDFNhWve/y275iPmIZ4z39a9iA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/stop-iteration-iterator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/stop-iteration-iterator/-/stop-iteration-iterator-1.1.0.tgz",
      "integrity": "sha512-eLoXW/DHyl62zxY4SCaIgnRhuMr6ri4juEYARS8E6sCEqzKpOiE521Ucofdx+KnDZl5xmvGYaaKCk5FEOxJCoQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "internal-slot": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.includes": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/string.prototype.includes/-/string.prototype.includes-2.0.1.tgz",
      "integrity": "sha512-o7+c9bW6zpAdJHTtujeePODAhkuicdAryFsfVKwA+wGw89wJ4GTY484WTucM9hLtDEOpOvI+aHnzqnC5lHp4Rg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.23.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/string.prototype.matchall": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/string.prototype.matchall/-/string.prototype.matchall-4.1.0.tgz",
      "integrity": "sha512-tHNHTxInrYLCga9O9YGxWA3G9/nnzQw8UGAyqGx3Ar1pSTTzIuM4woFSq4SowkXCjJIwq5sIiQvEfRI9tCH1qQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.2",
        "get-intrinsic": "^1.3.0",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "internal-slot": "^1.1.0",
        "regexp.prototype.flags": "^1.5.4",
        "set-function-name": "^2.0.2",
        "side-channel": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.repeat": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/string.prototype.repeat/-/string.prototype.repeat-1.0.0.tgz",
      "integrity": "sha512-0u/TldDbKD8bFCQ/4f5+mNRrXwZ8hg2w7ZR8wa16e8z9XpePWl3eGEcUD0OXpEH/VJH/2G3gjUtR3ZOiBe2S/w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "define-properties": "^1.1.3",
        "es-abstract": "^1.17.5"
      }
    },
    "node_modules/string.prototype.trim": {
      "version": "1.2.11",
      "resolved": "https://registry.npmjs.org/string.prototype.trim/-/string.prototype.trim-1.2.11.tgz",
      "integrity": "sha512-PwvK7BU+CMTJGYQCTZb5RWXIML92lftJLhQz1tBzgKiqGxJaMlBAa48POXaNAC2s4y8jr3EFqrkF9+44neS46w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-data-property": "^1.1.4",
        "define-properties": "^1.2.1",
        "es-abstract": "^1.24.2",
        "es-object-atoms": "^1.1.2",
        "has-property-descriptors": "^1.0.2",
        "safe-regex-test": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimend": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/string.prototype.trimend/-/string.prototype.trimend-1.0.10.tgz",
      "integrity": "sha512-2+3aDAOmPTmuFwjDnmJG2ctEkQKVki7vOSqaxkv42Mowj1V6PnvuwFCRrR5lChUux1TBskPjfkeTOhqczDMxTw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/string.prototype.trimstart": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/string.prototype.trimstart/-/string.prototype.trimstart-1.0.8.tgz",
      "integrity": "sha512-UXSH262CSZY1tfu3G3Secr6uGLCFVPMhIqHjlgCUtCCcgihYc/xKs9djMTMUOb2j1mVSeU8EU6NWc/iQKU6Gfg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.7",
        "define-properties": "^1.2.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/strip-bom": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-3.0.0.tgz",
      "integrity": "sha512-vavAMRXOgBVNF6nyEEmL3DBK19iRpDcoIwW+swQ+CbGiu7lju6t+JklA1MHweoWtadgt4ISVUsXLyDq34ddcwA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/styled-jsx": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/styled-jsx/-/styled-jsx-5.1.6.tgz",
      "integrity": "sha512-qSVyDTeMotdvQYoHWLNGwRFJHC+i+ZvdBRYosOFgC+Wg1vx4frN2/RG/NA7SYqqvKNLf39P2LSRA2pu6n0XYZA==",
      "license": "MIT",
      "dependencies": {
        "client-only": "0.0.1"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "peerDependencies": {
        "react": ">= 16.8.0 || 17.x.x || ^18.0.0-0 || ^19.0.0-0"
      },
      "peerDependenciesMeta": {
        "@babel/core": {
          "optional": true
        },
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tailwindcss": {
      "version": "4.1.17",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-4.1.17.tgz",
      "integrity": "sha512-j9Ee2YjuQqYT9bbRTfTZht9W/ytp5H+jJpZKiYdP/bpnXARAuELt9ofP0lPnmHjbga7SNQIxdTAXCmtKVYjN+Q==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tapable": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.3.3.tgz",
      "integrity": "sha512-uxc/zpqFg6x7C8vOE7lh6Lbda8eEL9zmVm/PLeTPBRhh1xCgdWaQ+J1CUieGpIfm2HdtsUpRv+HshiasBMcc6A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tinyglobby/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/tinyglobby/node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/ts-api-utils": {
      "version": "2.5.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-2.5.0.tgz",
      "integrity": "sha512-OJ/ibxhPlqrMM0UiNHJ/0CKQkoKF243/AEmplt3qpRgkW8VG7IfOS41h7V8TjITqdByHzrjcS/2si+y4lIh8NA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.12"
      },
      "peerDependencies": {
        "typescript": ">=4.8.4"
      }
    },
    "node_modules/tsconfig-paths": {
      "version": "3.15.0",
      "resolved": "https://registry.npmjs.org/tsconfig-paths/-/tsconfig-paths-3.15.0.tgz",
      "integrity": "sha512-2Ac2RgzDe/cn48GvOe3M+o82pEFewD3UPbyoUHHdKasHwJKjds4fLXWf/Ux5kATBKN20oaFGu+jbElp1pos0mg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json5": "^0.0.29",
        "json5": "^1.0.2",
        "minimist": "^1.2.6",
        "strip-bom": "^3.0.0"
      }
    },
    "node_modules/tsconfig-paths/node_modules/json5": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/json5/-/json5-1.0.2.tgz",
      "integrity": "sha512-g1MWMLBiz8FKi1e4w0UyVL3w+iJceWAFBAaBnnGKOpNa5f8TLktkbre1+s6oICydWAm+HRUGTmI+//xv2hvXYA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minimist": "^1.2.0"
      },
      "bin": {
        "json5": "lib/cli.js"
      }
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/typed-array-buffer": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-buffer/-/typed-array-buffer-1.0.3.tgz",
      "integrity": "sha512-nAYYwfY3qnzX30IkA6AQZjVbtK6duGontcQm1WSG1MD94YLqK0515GNApXkoxKOWMusVssAHWLh9SeaoefYFGw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "es-errors": "^1.3.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/typed-array-byte-length": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/typed-array-byte-length/-/typed-array-byte-length-1.0.3.tgz",
      "integrity": "sha512-BaXgOuIxz8n8pIq3e7Atg/7s+DpiYrxn4vdot3w9KbnBhcRQq6o3xemQdIfynqSeXeDrF32x+WvfzmOjPiY9lg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.8",
        "for-each": "^0.3.3",
        "gopd": "^1.2.0",
        "has-proto": "^1.2.0",
        "is-typed-array": "^1.1.14"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-byte-offset": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/typed-array-byte-offset/-/typed-array-byte-offset-1.0.5.tgz",
      "integrity": "sha512-0FHJvLPqZ7KJzp17O13jfsAjsqazgrxBu2zEK95PmUz8lv2+GjRuxUInCr2Rk9Dms3ihN21zJ929ZO43yJ95QQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.9",
        "for-each": "^0.3.5",
        "gopd": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "reflect.getprototypeof": "^1.0.10"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typed-array-length": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/typed-array-length/-/typed-array-length-1.0.8.tgz",
      "integrity": "sha512-phPGCwqr2+Qo0fwniCE8e4pKnGu/yFb5nD5Y8bf0EEeiI5GklnACYA9GFy/DrAeRrKHXvHn+1SUsOWgJp6RO+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bind": "^1.0.9",
        "for-each": "^0.3.5",
        "gopd": "^1.2.0",
        "is-typed-array": "^1.1.15",
        "possible-typed-array-names": "^1.1.0",
        "reflect.getprototypeof": "^1.0.10"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/typescript-eslint": {
      "version": "8.71.1",
      "resolved": "https://registry.npmjs.org/typescript-eslint/-/typescript-eslint-8.71.1.tgz",
      "integrity": "sha512-oiNVPC3/NbV1FpaHU07l8O6ynqG9v4PAiW2WvTrAmZdR0f2HI/gE668ElMLCK7Xbsu5k2fK5C4fXNiq05j7/nQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/eslint-plugin": "8.71.1",
        "@typescript-eslint/parser": "8.71.1",
        "@typescript-eslint/typescript-estree": "8.71.1",
        "@typescript-eslint/utils": "8.71.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
        "typescript": ">=4.8.4 <6.1.0"
      }
    },
    "node_modules/unbox-primitive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/unbox-primitive/-/unbox-primitive-1.1.0.tgz",
      "integrity": "sha512-nWJ91DjeOkej/TA8pXQ3myruKpKEYgqvpw9lz4OPHj/NWFNluYrjbz9j01CJ8yKQd2g4jFoOkINCTW2I5LEEyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.3",
        "has-bigints": "^1.0.2",
        "has-symbols": "^1.1.0",
        "which-boxed-primitive": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/unrs-resolver": {
      "version": "1.12.2",
      "resolved": "https://registry.npmjs.org/unrs-resolver/-/unrs-resolver-1.12.2.tgz",
      "integrity": "sha512-dmlRxBJJayXjqTwC+JtF1HhJmgf3ftQ3YejFcZrf4+KKtJv0qDsK1pjqaaVjG7wJ5NJ6UVP1OqRMQ71Z4C3rxQ==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "dependencies": {
        "napi-postinstall": "^0.3.4"
      },
      "funding": {
        "url": "https://opencollective.com/unrs-resolver"
      },
      "optionalDependencies": {
        "@unrs/resolver-binding-android-arm-eabi": "1.12.2",
        "@unrs/resolver-binding-android-arm64": "1.12.2",
        "@unrs/resolver-binding-darwin-arm64": "1.12.2",
        "@unrs/resolver-binding-darwin-x64": "1.12.2",
        "@unrs/resolver-binding-freebsd-x64": "1.12.2",
        "@unrs/resolver-binding-linux-arm-gnueabihf": "1.12.2",
        "@unrs/resolver-binding-linux-arm-musleabihf": "1.12.2",
        "@unrs/resolver-binding-linux-arm64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-arm64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-loong64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-loong64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-ppc64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-riscv64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-riscv64-musl": "1.12.2",
        "@unrs/resolver-binding-linux-s390x-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-x64-gnu": "1.12.2",
        "@unrs/resolver-binding-linux-x64-musl": "1.12.2",
        "@unrs/resolver-binding-openharmony-arm64": "1.12.2",
        "@unrs/resolver-binding-wasm32-wasi": "1.12.2",
        "@unrs/resolver-binding-win32-arm64-msvc": "1.12.2",
        "@unrs/resolver-binding-win32-ia32-msvc": "1.12.2",
        "@unrs/resolver-binding-win32-x64-msvc": "1.12.2"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.3.3.tgz",
      "integrity": "sha512-pJ2sYawQS0R/WI928Gj5GlPhTGzbMelq0+4INtSYNDV9ErKJcX6xjGWkoG/VnB3dpUm00zALaqkrUD77pO5TDQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/which-boxed-primitive": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/which-boxed-primitive/-/which-boxed-primitive-1.1.1.tgz",
      "integrity": "sha512-TbX3mj8n0odCBFVlY8AxkqcHASw3L60jIuF8jFP78az3C2YhmGvqbHBpAjTRH2/xqYunrJ9g1jSyjCjpoWzIAA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-bigint": "^1.1.0",
        "is-boolean-object": "^1.2.1",
        "is-number-object": "^1.1.1",
        "is-string": "^1.1.1",
        "is-symbol": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-builtin-type": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/which-builtin-type/-/which-builtin-type-1.2.1.tgz",
      "integrity": "sha512-6iBczoX+kDQ7a3+YJBnh3T+KZRxM/iYNPXicqk66/Qfm1b93iu+yOImkg0zHbj5LNOcNv1TEADiZ0xa34B4q6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "function.prototype.name": "^1.1.6",
        "has-tostringtag": "^1.0.2",
        "is-async-function": "^2.0.0",
        "is-date-object": "^1.1.0",
        "is-finalizationregistry": "^1.1.0",
        "is-generator-function": "^1.0.10",
        "is-regex": "^1.2.1",
        "is-weakref": "^1.0.2",
        "isarray": "^2.0.5",
        "which-boxed-primitive": "^1.1.0",
        "which-collection": "^1.0.2",
        "which-typed-array": "^1.1.16"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-collection": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/which-collection/-/which-collection-1.0.2.tgz",
      "integrity": "sha512-K4jVyjnBdgvc86Y6BkaLZEN933SwYOuBFkdmBu9ZfkcAbdVbpITnDmjvZ/aQjRXQrv5EPkTnD1s39GiiqbngCw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-map": "^2.0.3",
        "is-set": "^2.0.3",
        "is-weakmap": "^2.0.2",
        "is-weakset": "^2.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/which-typed-array": {
      "version": "1.1.24",
      "resolved": "https://registry.npmjs.org/which-typed-array/-/which-typed-array-1.1.24.tgz",
      "integrity": "sha512-wk4Mf4pR5mRP7eYuuTBCIQ9d0ud2Fv2jRLQpfgnRjbOxAFHmjKFValgTpitVKzJJS8ajnYQV2Du1SZ8j6b/EUQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "available-typed-arrays": "^1.0.7",
        "call-bind": "^1.0.9",
        "call-bound": "^1.0.4",
        "for-each": "^0.3.5",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-tostringtag": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/wmf": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wmf/-/wmf-1.0.2.tgz",
      "integrity": "sha512-/p9K7bEh0Dj6WbXg4JG0xvLQmIadrner1bi45VMJTfnbVHsc7yIajZyoSoK60/dtVBs12Fm6WkUI5/3WAVsNMw==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/word": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/word/-/word-0.3.0.tgz",
      "integrity": "sha512-OELeY0Q61OXpdUfTp+oweA/vtLVg5VDOXh+3he3PNzLGG/y0oylSOC1xRVj0+l4vQ3tj/bB1HVHv1ocXkQceFA==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/xlsx": {
      "version": "0.18.5",
      "resolved": "https://registry.npmjs.org/xlsx/-/xlsx-0.18.5.tgz",
      "integrity": "sha512-dmg3LCjBPHZnQp5/F/+nnTa+miPJxUXB6vtk42YjBBKayDNagxGEeIdWApkYPOf3Z3pm3k62Knjzp7lMeTEtFQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "adler-32": "~1.3.0",
        "cfb": "~1.2.1",
        "codepage": "~1.15.0",
        "crc-32": "~1.2.1",
        "ssf": "~0.11.2",
        "wmf": "~1.0.1",
        "word": "~0.3.0"
      },
      "bin": {
        "xlsx": "bin/xlsx.njs"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/yallist": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-3.1.1.tgz",
      "integrity": "sha512-a4UGQaWPH59mOXUYnAG2ewncQS4i4F43Tv3JoAM+s2VDAmS9NsK8GpDMLrCHPksFT7h3K6TOoUNn2pb7RoXx4g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "4.6.5",
      "resolved": "https://registry.npmjs.org/zod/-/zod-4.6.5.tgz",
      "integrity": "sha512-v5l/aFXZQeai4awLbOpSoHecE9UiMrnfx75tEXLjNonXVARxQ5mOeipTjROUchszUNCqnE+hqAMujRsRHsut2Q==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zod-validation-error": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/zod-validation-error/-/zod-validation-error-4.0.2.tgz",
      "integrity": "sha512-Q6/nZLe6jxuU80qb/4uJ4t5v2VEZ44lzQjPDhYJNztRQ4wyWc6VF3D3Kb/fAuPetZQnhS3hnajCf9CsWesghLQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      },
      "peerDependencies": {
        "zod": "^3.25.0 || ^4.0.0"
      }
    }
  }
}
````

## `package.json`

````json
{
  "name": "giro-de-atas-pages",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "docs:fonte": "node scripts/gerar-codigo-fonte.mjs",
    "amostras": "node --no-warnings --import ./scripts/dev/register.mjs scripts/dev/gerar-amostras.mts",
    "extrair": "node --no-warnings --import ./scripts/dev/register.mjs scripts/dev/extrair-snapshot.mts",
    "panorama:dry-run": "node --no-warnings --import ./scripts/dev/register.mjs scripts/dev/panorama-dry-run.mts"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "lucide-react": "^1.52.0",
    "next": "16.2.6",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.17",
    "@types/node": "22.19.15",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "eslint": "9.39.4",
    "eslint-config-next": "16.2.6",
    "postcss": "8.5.8",
    "tailwindcss": "4.1.17",
    "typescript": "5.9.3"
  }
}
````

## `postcss.config.mjs`

````javascript
const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default postcssConfig;
````

## `public/.nojekyll`

````text

````

## `scripts/dev/alias-loader.mjs`

````javascript
// Loader mínimo para rodar os módulos TS do projeto no Node:
// resolve "@/x" -> src/x(.ts|.tsx|/index.ts) e transpila só os tipos para o
// dry-run também funcionar em ambientes Node 20 (Node 22 pode usar o strip-types).
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = process.cwd();
let stubStore = false;

export async function initialize(data) {
  stubStore = Boolean(data?.stubStore);
}

function tryFiles(base) {
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  // No dry-run do panorama, o armazenamento local (IndexedDB) é trocado por um stub em memória.
  if (specifier === "@/lib/static-store" && stubStore) {
    return { url: pathToFileURL(path.join(ROOT, "scripts/dev/stubs/static-store.mts")).href, shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const file = tryFiles(path.join(ROOT, "src", specifier.slice(2)));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const base = path.resolve(path.dirname(new URL(context.parentURL).pathname), specifier);
    if (!path.extname(base)) {
      const file = tryFiles(base);
      if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && /\.(?:ts|mts|tsx)$/.test(new URL(url).pathname)) {
    const source = await readFile(new URL(url), "utf8");
    const result = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        sourceMap: false,
      },
      fileName: new URL(url).pathname,
    });
    return { format: "module", source: result.outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
````

## `scripts/dev/extrair-snapshot.mts`

````typescript
/**
 * Executa o mesmo extrator do panorama sobre .csv/.xlsx pela linha de comando.
 *
 *   npm run extrair -- amostras/planilha.csv outra.xlsx --ref=2026-10-14 [--json]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  extractSnapshotPayload,
  snapshotBlockLabel,
  FORECAST_BANDS,
  SNAPSHOT_AREAS,
  type SnapshotSourceSheet,
  type SnapshotArea,
} from "@/lib/dashboard-snapshot";

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;
const asJson = args.includes("--json");

if (files.length === 0) {
  console.error("uso: npm run extrair -- <arquivo.csv|xlsx> [...] [--ref=AAAA-MM-DD] [--json]");
  process.exit(1);
}

function detectDelimiter(text: string): string {
  const sample = text.split(/\r\n|\r|\n/).slice(0, 5).join("\n");
  let best = ",";
  let bestCount = 0;
  for (const candidate of [";", ",", "\t", "|"]) {
    const count = sample.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

function decodeCsv(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

const sheets: SnapshotSourceSheet[] = [];
for (const file of files) {
  const buffer = readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const text = ext === ".csv" ? decodeCsv(buffer) : null;
  const workbook = ext === ".csv"
    ? XLSX.read(text, { type: "string", FS: detectDelimiter(text), raw: true })
    : XLSX.read(buffer, { type: "buffer", cellDates: true });
  for (const sheetName of workbook.SheetNames) {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: null,
      blankrows: true,
    }) as unknown[][];
    sheets.push({ fileName: path.basename(file), sheetName, matrix });
  }
}

const payload = extractSnapshotPayload(sheets, {
  referenceDate,
  fileNames: files.map((file) => path.basename(file)),
});

if (asJson) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(0);
}

const number = (value: number | null | undefined) => value === null || value === undefined ? "—" : value.toLocaleString("pt-BR");
console.log(`Arquivos: ${files.join(", ")} · abas: ${sheets.map((sheet) => `${sheet.sheetName} (${sheet.matrix.length} linhas)`).join(", ")}`);
console.log(`Referência: ${payload.referenceDate ?? "(não informada)"}`);
console.log(`Blocos reconhecidos: ${payload.coverage.found.map(snapshotBlockLabel).join(", ") || "nenhum"}`);
console.log(`Blocos ausentes: ${payload.coverage.missing.map(snapshotBlockLabel).join(", ") || "nenhum"}`);
if (payload.notes.length) console.log(`\nNotas:\n- ${payload.notes.join("\n- ")}`);

console.log("\nKPIs (leitura dos gráficos):", payload.kpis);
console.log("\nValores / saving por área:");
for (const area of SNAPSHOT_AREAS) {
  const value = payload.valueAreas[area];
  console.log(`  ${area.padEnd(10)} valor=${number(value.valor)} contratado=${number(value.valorSaving)} hist=${number(value.savingHist)} (${number(value.reducaoHistPct)}%) prop=${number(value.savingProp)} (${number(value.reducaoPropPct)}%)`);
}
const total = payload.savingTotal;
console.log(`  ${"TOTAL".padEnd(10)} contratado=${number(total.valorSaving)} hist=${number(total.savingHist)} (${number(total.reducaoHistPct)}%) prop=${number(total.savingProp)} (${number(total.reducaoPropPct)}%)`);

console.log("\nTop compradores:");
for (const area of SNAPSHOT_AREAS) {
  const top = payload.topCompradores[area];
  console.log(`  ${area.padEnd(10)} total=${number(top.totalAtasArea)} top=${top.topAtas} → ${top.buyers.map((buyer) => `${buyer.name} ${buyer.itens}i/${buyer.atas}a`).join("; ") || "—"}`);
}

console.log("\nFornecedores geral:");
for (const supplier of payload.fornecedoresGeral) {
  console.log(`  ${supplier.fornecedor} — ${number(supplier.qtdAtas)} atas / ${number(supplier.qtdItens)} itens / ${number(supplier.concentracaoPct)}%`);
}

console.log("\nEvolução por área:");
for (const area of SNAPSHOT_AREAS) {
  const evolution = payload.evolucao[area];
  console.log(`  ${area.padEnd(10)} concl=${number(evolution.concluidasAtas)}/${number(evolution.concluidasItens)} andamento=${number(evolution.andamentoAtas)}/${number(evolution.andamentoItens)} saldo=${number(evolution.saldoItens)} semSaldo=${number(evolution.semSaldoItens)} vencidas=${number(evolution.vencidasAtas)}/${number(evolution.vencidasItens)} aVencer=${number(evolution.aVencerAtas)}/${number(evolution.aVencerItens)}`);
}

console.log("\nPrevisão por faixa (atas/itens):");
for (const band of FORECAST_BANDS) {
  const row = payload.previsoes[band];
  console.log(`  ${band.padEnd(12)} ${SNAPSHOT_AREAS.map((area: SnapshotArea) => `${area[0]}=${number(row[area].atas)}/${number(row[area].itens)}`).join("  ")}`);
}

console.log("\nPrevisão por mês:");
for (const area of ["INDIRETOS", "DIRETOS", "CAPEX"] as const) {
  const rows = payload.previsaoMeses[area].rows;
  console.log(`  ${area}: ${rows.map((row) => `${row.label}${row.year ? `/${row.year}` : ""}=${number(row.atas)}/${number(row.itens)}`).join("; ") || "—"}`);
}

console.log(`\nFornecedor por contrato: ${Object.keys(payload.fornecedoresPorContrato).length} contratos mapeados`);
console.log(`Atas concluídas (FINALIZADO) na base de andamento: ${payload.atasConcluidas.length}`);
for (const ata of payload.atasConcluidas.slice(0, 15)) {
  console.log(`  ${(ata.contrato ?? "—").padEnd(12)} ${ata.descricao.slice(0, 40).padEnd(40)} ${number(ata.itens).padStart(5)} itens  ${(ata.comprador ?? "—").padEnd(24)} ${ata.area ?? "—"} → ${ata.fornecedor ?? "(fornecedor não encontrado)"}`);
}
if (payload.atasConcluidas.length > 15) console.log(`  … e mais ${payload.atasConcluidas.length - 15}`);

console.log("\nStatus das atas por área:");
for (const area of SNAPSHOT_AREAS) {
  const status = payload.statusAtas[area];
  if (!status) {
    console.log(`  ${area.padEnd(10)} —`);
    continue;
  }
  console.log(`  ${area.padEnd(10)} layout=${status.layout} base=${status.baseDate ?? "—"} total=${number(status.total)} totalRenovar=${number(status.totalRenovar)} vig=${number(status.vigentes)} venc=${number(status.vencidas)} ate15=${number(status.ate15)} 16a30=${number(status.de16a30)} aRenovar=${number(status.aRenovar)} andamento=${number(status.emAndamento)}`);
  console.log(`             prioridades: ${status.prioridades.map((item) => `${item.contrato} ${item.vencimento ?? "—"} ${item.comprador ?? "—"} ${item.situacao ?? "—"}`).join("; ") || "—"}`);
  if (status.renovacaoEmAndamento) console.log(`             renovação em andamento: ${status.renovacaoEmAndamento.texto}`);
  console.log(`             carteira: ${status.carteira.map((item) => `${item.comprador} ${number(item.vigentes)}/${number(item.vencidas)}/${number(item.aRenovar)}/${number(item.total)}`).join("; ") || "—"}`);
  console.log(`             notas: ${status.notas.join(" | ") || "—"}`);
}
````

## `scripts/dev/gerar-amostras.mts`

````typescript
/**
 * Gera planilhas fictícias com o layout dos blocos do painel.
 * Os nomes e números são deliberadamente inventados e ficam em amostras/,
 * pasta ignorada pelo Git; servem apenas para exercitar extrair/dry-run.
 */
import { mkdirSync } from "node:fs";
import * as XLSX from "xlsx";

const output = "amostras";
mkdirSync(output, { recursive: true });

type Matrix = unknown[][];

const resumo = (current: boolean): Matrix => [
  ["LEITURA DOS GRÁFICOS"],
  ["Gráfico", "Situação apresentada", "ATAS", "ITENS"],
  ["ATA CONCLUÍDAS (VÁLIDAS)", "VÁLIDAS", current ? 62 : 58, current ? 1020 : 956],
  ["ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)", "COM SALDO", 0, current ? 920 : 877],
  ["ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)", "CONSUMIDOS", 0, current ? 95 : 80],
  ["ATAS VENCIDAS E A VENCER", "A VENCER (RENOVAR)", current ? 61 : 58, current ? 1300 : 1215],
  ["ATAS VENCIDAS E A VENCER", "VENCIDAS", current ? 45 : 48, current ? 315 : 334],
  ["ATAS EM ANDAMENTO (GERAL)", current ? 72 : 68, current ? 4980 : 4778],
  ["VALOR INDIRETOS", 125000],
  ["VALOR DIRETOS", 240000],
  ["VALOR CAPEX", 310000],
  ["Rótulos de Linha", "VALOR CONTRATADO R$", "SAVING HISTÓRICO R$", "SAVING PROPOSTA INICIAL R$", "REDUÇÃO HISTÓRICO %", "REDUÇÃO PROPOSTA INICIAL %"],
  ["INDIRETOS", 125000, 12500, 19000, "10%", "15,2%"],
  ["DIRETOS", 240000, 24000, 36000, "10%", "15%"],
  ["CAPEX", 310000, 31000, 46500, "10%", "15%"],
  ["TOTAL", 675000, 67500, 101500, "10%", "15%"],
  ["TOP COMP INDIRETOS", "ITENS", "ATAS", "TOTAL ATAS ÁREA", "TOP COMP DIRETOS", "ITENS", "ATAS", "TOTAL ATAS ÁREA", "TOP COMP CAPEX", "ITENS", "ATAS", "TOTAL ATAS ÁREA"],
  ["ANA SILVA", 320, 12, 25, "BRUNO LIMA", 410, 14, 31, "CARLA SOUZA", 280, 8, 18],
  ["DIEGO COSTA", 220, 8, 25, "ELISA ROCHA", 300, 10, 31, "FABIO ALVES", 180, 6, 18],
  ["FORNECEDORES GERAL"],
  ["FORNECEDOR", "QTD ATAS", "QTD ITENS", "% CONCENTRAÇÃO DE ITENS", "ANÁLISE"],
  ["ACME MATERIAL", 12, 160, "22%", "Alta Concentração"],
  ["BETA SERVIÇOS", 9, 110, "15%", "Alta Concentração"],
  ["GAMA INDUSTRIAL", 7, 90, "12%", "Volume Médio"],
  ["DELTA TECNOLOGIA", 5, 70, "9%", "Volume Médio"],
  ["OUTROS FORNECEDORES", 4, 50, "7%", "Pulverizado"],
  ["TOTAL", 37, 480, "100%", null],
  ["ATA INDIRETOS", "ATA DIRETOS", "ATA CAPEX"],
  ["QTD ATAS", "QTD ATAS", "QTD ATAS"],
  [12, 14, 8],
  ["QTD ITENS", "QTD ITENS", "QTD ITENS"],
  [320, 410, 280],
  ["EVOLUÇÃO POR ÁREA (EM ANDAMENTO)"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS"],
  ["INDIRETOS", 25, 700],
  ["DIRETOS", 31, 900],
  ["CAPEX", 18, 500],
  ["PREVISÃO DE CONCLUSÃO POR FAIXA"],
  ["INDIRETOS", null, "DIRETOS", null, "CAPEX"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS"],
  ["ATÉ 15 DIAS", 3, 40, 4, 60, 2, 25],
  ["ATÉ 30 DIAS", 5, 70, 6, 90, 3, 35],
  ["ATÉ 60 DIAS", 7, 100, 8, 120, 4, 55],
  ["ACIMA DE 60 DIAS", 9, 140, 10, 160, 5, 70],
  ["PREVISÕES VENCIDAS", 2, 30, 3, 45, 1, 12],
  ["PREVISÃO DE CONCLUSÃO POR MÊS"],
  ["INDIRETOS", null, "DIRETOS", null, "CAPEX"],
  ["Rótulos de Linha", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS", "QTD ATAS", "QTD ITENS"],
  ["Outubro", 2, 25, 3, 40, 1, 15],
  ["Novembro", 4, 60, 5, 75, 2, 30],
  ["Dezembro", 6, 90, 7, 110, 3, 45],
  ["Vencida/Sem Previsão", 2, 30, 3, 45, 1, 12],
];

const andamento = (current: boolean): Matrix => [
  ["DESCRIÇÃO DOS LOTES ATAS", "QTD ITENS", "COMPRADOR", "AREA", "ETAPA ATUAL", "N° CONTRATO", "ESTIMATIVA VALOR TOTAL"],
  ["Kit de vidraria", 40, "ANA SILVA", "INDIRETOS", current ? "FINALIZADO" : "EM ANDAMENTO", "4600001001", 12000],
  ["Reagentes de laboratório", 60, "BRUNO LIMA", "DIRETOS", "FINALIZADO", "4600001002", 24000],
  ["Serviço de calibração", 25, "CARLA SOUZA", "CAPEX", current ? "FINALIZADA" : "EM ANDAMENTO", "4600001003", 18000],
];

const contratos: Matrix = [
  ["Contrato", "Item", "Fornecedor"],
  ["4600001001", "Material A", "ACME MATERIAL (1000411)"],
  ["4600001002", "Material B", "BETA SERVIÇOS (1000412)"],
  ["4600001003", "Material C", "GAMA INDUSTRIAL (1000413)"],
];

const cruzamento: Matrix = [
  ["COMPRADOR", "AREA", "PRAZO CONCLUSÃO", "QTD ATAS", "QTD ITENS"],
  ["ANA SILVA", "INDIRETOS", "15/10/2026", 1, 10],
  ["BRUNO LIMA", "DIRETOS", "20/11/2026", 2, 20],
  ["CARLA SOUZA", "CAPEX", "31/01/2027", 3, 30],
];

const statusAtas = (): Matrix => {
  const area = (name: string, offset: number, banner: boolean): Matrix => [
    [name],
    [`${name} | Status de Renovações`],
    ["Carteira em alerta de 100 dias | Atas a renovar"],
    [11 + offset, 0, 2, banner ? 1 : 0],
    ["TOTAL A RENOVAR", "VENCIDAS", "ATÉ 15 DIAS", "EM ANDAMENTO"],
    ["CONTRATO SAP", "VENCIMENTO", "COMPRADOR(A)", "SITUAÇÃO"],
    [`460000${String(895 + offset).padStart(4, "0")}`, "28/10/2026", "LUCAS VICENTINI", banner ? "EM ANDAMENTO" : "A INICIAR"],
    [`460000${String(894 + offset).padStart(4, "0")}`, "29/10/2026", "LUCAS VICENTINI", "A INICIAR"],
    ...(banner ? [["RENOVAÇÃO EM ANDAMENTO: 4600000895 | LUCAS VICENTINI | VENCIMENTO 28/10/2026"] as Row] : []),
    [],
  ];
  return [...area("INDIRETOS", 0, true), ...area("DIRETOS", 10, false), ...area("CAPEX", 20, false)];
};

function makeWorkbook(current: boolean) {
  const workbook = XLSX.utils.book_new();
  for (const [name, matrix] of [
    ["Resumo semanal", resumo(current)],
    ["Base - Atas Em andamento", andamento(current)],
    ["Base - Controle de Contratos", contratos],
    ["Base - Cruzamento por comprador", cruzamento],
    ["Status das Atas", statusAtas()],
  ] as Array<[string, Matrix]>) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(matrix), name);
  }
  return workbook;
}

XLSX.writeFile(makeWorkbook(true), `${output}/semana-atual.xlsx`);
XLSX.writeFile(makeWorkbook(false), `${output}/semana-anterior.xlsx`);
console.log(`Amostras geradas em ${output}/semana-atual.xlsx e ${output}/semana-anterior.xlsx.`);
````

## `scripts/dev/panorama-dry-run.mts`

````typescript
/**
 * Simula o panorama no Node: lê as planilhas, extrai o snapshot e monta o
 * mesmo StaticDashboardData da tela, sem navegador nem IndexedDB.
 *
 *   npm run panorama:dry-run -- amostras/semana-atual.xlsx --ref=2026-10-13
 *
 * Para comparar com a importação anterior:
 *   npm run panorama:dry-run -- atual.xlsx --ref=2026-10-13 --anterior anterior.xlsx --ref-anterior=2026-10-05
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { extractSnapshotPayload, type SnapshotSourceSheet } from "@/lib/dashboard-snapshot";

const args = process.argv.slice(2);
const separator = args.indexOf("--anterior");
const currentArgs = separator >= 0 ? args.slice(0, separator) : args;
const previousArgs = separator >= 0 ? args.slice(separator + 1) : [];
const files = currentArgs.filter((arg) => !arg.startsWith("--"));
const previousFiles = previousArgs.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;
const previousReferenceDate = args.find((arg) => arg.startsWith("--ref-anterior="))?.slice(15) ?? null;

if (files.length === 0) {
  console.error("uso: npm run panorama:dry-run -- <arquivo.csv|xlsx> [...] [--ref=AAAA-MM-DD] [--anterior <arquivo> ... --ref-anterior=AAAA-MM-DD]");
  process.exit(1);
}

function decodeCsv(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function delimiter(text: string): string {
  const sample = text.split(/\r\n|\r|\n/).slice(0, 5).join("\n");
  return [";", ",", "\t", "|"].sort((a, b) => (sample.split(b).length - 1) - (sample.split(a).length - 1))[0];
}

function readSheets(inputFiles: string[]): SnapshotSourceSheet[] {
  const sheets: SnapshotSourceSheet[] = [];
  for (const file of inputFiles) {
    const buffer = readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    const workbook = ext === ".csv"
      ? XLSX.read(decodeCsv(buffer), { type: "string", FS: delimiter(decodeCsv(buffer)), raw: true })
      : XLSX.read(buffer, { type: "buffer", cellDates: true });
    for (const sheetName of workbook.SheetNames) {
      sheets.push({
        fileName: path.basename(file),
        sheetName,
        matrix: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
          header: 1,
          raw: true,
          defval: null,
          blankrows: true,
        }) as unknown[][],
      });
    }
  }
  return sheets;
}

const current = extractSnapshotPayload(readSheets(files), {
  referenceDate,
  fileNames: files.map((file) => path.basename(file)),
});
const snapshots = [current];
if (previousFiles.length > 0) {
  snapshots.push(extractSnapshotPayload(readSheets(previousFiles), {
    referenceDate: previousReferenceDate,
    fileNames: previousFiles.map((file) => path.basename(file)),
  }));
}
(globalThis as Record<string, unknown>).__ATAS_STORE__ = { snapshots, rows: [], datasets: [] };

const storeModule = await import("@/lib/static-store");
if (!("__STUB__" in storeModule)) {
  console.error("O stub do armazenamento não foi ativado; use npm run panorama:dry-run.");
  process.exit(1);
}
const { getStaticDashboardData } = await import("@/lib/static-dashboard");
const data = await getStaticDashboardData();
console.log("hasData:", data.hasData, "| referência:", data.currentSnapshot?.referenceDate, "| anterior:", data.previousSnapshot?.referenceDate);
console.log("\nBlocos:", data.blocos);
console.log("\nKPIs:", data.kpis);
console.log("\nPor área:", data.porArea);
console.log("\nSaving total:", data.savingTotal);
console.log("\nTop compradores:", data.topCompradores);
console.log("\nFornecedores:", data.fornecedores);
console.log("\nEvolução:", data.evolucao);
console.log("\nPrevisões:", data.previsoes.length, data.previsoes.slice(0, 5));
console.log("\natasConcluidas:", data.atasConcluidas);
console.log("\nstatusAtas:", data.statusAtas);
````

## `scripts/dev/register.mjs`

````javascript
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// O stub do IndexedDB entra quando o script principal é o dry-run do panorama
// (ou quando ATAS_STUB_STORE=1 é definido explicitamente).
const stubStore = process.env.ATAS_STUB_STORE === "1" || process.argv.some((arg) => /panorama-dry-run\.m(ts)?$/.test(arg));
register(pathToFileURL("./scripts/dev/alias-loader.mjs").href, { data: { stubStore } });
````

## `scripts/dev/stubs/static-store.mts`

````typescript
/**
 * Substituto de "@/lib/static-store" para rodar o painel no Node, sem IndexedDB.
 * O harness define globalThis.__ATAS_STORE__ antes de importar o painel.
 */

type AnyRecord = Record<string, unknown>;
interface Store {
  snapshots: unknown[];
  rows: AnyRecord[];
  datasets: AnyRecord[];
}

const store = (): Store => ((globalThis as AnyRecord).__ATAS_STORE__ as Store) ?? { snapshots: [], rows: [], datasets: [] };

export const __STUB__ = true;
export const STATIC_DATA_EVENT = "giro:base-updated";

export async function listActiveProcessRows() {
  return store().rows;
}

export async function listDatasets() {
  return store().datasets;
}

export async function listActiveDatasets() {
  return store().datasets.filter((dataset) => dataset.status === "active");
}

export async function listSnapshotDatasets() {
  return store().snapshots.map((snapshot, index) => ({
    id: index + 1,
    snapshot,
    fileName: ((snapshot as AnyRecord)?.sourceFiles as string[] | undefined)?.join(", ") ?? "",
    importedAt: new Date(Date.now() - index * 86400000).toISOString(),
    referenceDate: (snapshot as AnyRecord)?.referenceDate ?? null,
    status: "active",
  }));
}

export function notifyStaticDataChanged() {}

export function formatStoredDataset(dataset: AnyRecord) {
  return { id: dataset.id ?? 0, has_snapshot: Boolean(dataset.snapshot) };
}
````

## `scripts/gerar-codigo-fonte.mjs`

````javascript
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const output = path.join(root, "fonte.md");
const excluded = new Set([".git", ".next", "out", "node_modules", "build", "dist", "coverage", "amostras", "fonte.md"]);
const extensions = new Map([
  [".ts", "typescript"], [".tsx", "tsx"], [".mjs", "javascript"],
  [".mts", "typescript"], [".json", "json"], [".css", "css"],
  [".yml", "yaml"], [".yaml", "yaml"], [".md", "markdown"],
]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (excluded.has(entry.name) || entry.name.endsWith(".tsbuildinfo")) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(full));
    else files.push(full);
  }
  return files.sort();
}

function fence(content) {
  const runs = content.match(/`+/g) ?? [];
  const size = Math.max(4, ...runs.map((run) => run.length + 1));
  return "`".repeat(size);
}

const files = await filesIn(root);
const lines = [
  "# Giro de Atas — Código-fonte consolidado",
  "",
  "Documento gerado a partir do projeto atual para publicação estática no GitHub Pages.",
  "",
  "> Para gerar novamente: `npm run docs:fonte`.",
  "",
  "## Sumário",
  "",
];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const anchor = relative.toLowerCase().replace(/[^a-z0-9]+/g, "");
  lines.push(`- [${relative}](#${anchor})`);
}
lines.push("", "---", "");
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const content = await readFile(file, "utf8");
  const block = fence(content);
  lines.push("## `" + relative + "`", "", `${block}${extensions.get(path.extname(file)) ?? "text"}`, content.replace(/\n$/, ""), block, "");
}
await writeFile(output, `${lines.join("\n").trimEnd()}\n`, "utf8");
console.log(`Código-fonte gerado em ${path.relative(root, output)} (${files.length} arquivos).`);
````

## `src/app/documentos/page.tsx`

````tsx
import { DocumentsManager } from "@/components/documents-manager";

export const metadata = { title: "Documentos de apoio" };

export default function DocumentosPage() {
  return <DocumentsManager documentos={[]} erroInicial={false} />;
}
````

## `src/app/globals.css`

````css
@import "tailwindcss";

@theme {
  /* Azul-marinho institucional */
  --color-navy-950: #07182b;
  --color-navy-900: #0c2338;
  --color-navy-850: #102a42;
  --color-navy-800: #143550;
  --color-navy-700: #1b4568;
  --color-navy-600: #235781;
  --color-navy-500: #2f6ba0;
  --color-navy-400: #5b8fbc;
  --color-navy-300: #97bcd9;
  --color-navy-200: #cbdeee;
  --color-navy-100: #e5eff7;
  --color-navy-50: #f3f8fc;

  /* Laranja — cor de ação/destaque */
  --color-accent-700: #a8480d;
  --color-accent-600: #c95a12;
  --color-accent-500: #e06e1f;
  --color-accent-400: #ec9152;
  --color-accent-300: #f4b98c;
  --color-accent-200: #f9d7bb;
  --color-accent-100: #fdeadd;
  --color-accent-50: #fff6ef;

  /* Cores das áreas — a mesma codificação visual institucional do painel. */
  --color-indiretos-700: #075958;
  --color-indiretos-600: #0a6e6d;
  --color-indiretos-500: #0b7c7b;
  --color-indiretos-100: #d8eeed;

  --color-diretos-700: #0a53a8;
  --color-diretos-600: #0a69c9;
  --color-diretos-500: #0a6fd6;
  --color-diretos-400: #008cff;
  --color-diretos-100: #dbedff;

  --color-capex-700: #8a5200;
  --color-capex-600: #e08f00;
  --color-capex-500: #fca500;
  --color-capex-100: #fff0d1;

  /* Semânticas (tons escuros p/ texto AA, tons claros p/ fundo) */
  --color-danger-700: #b42318;
  --color-danger-600: #d92d20;
  --color-danger-100: #fee4e2;
  --color-warn-700: #b54708;
  --color-warn-600: #dc6803;
  --color-warn-100: #fef0c7;
  --color-ok-700: #067647;
  --color-ok-600: #079455;
  --color-ok-100: #d1fadf;
  --color-neutral-700: #475467;
  --color-neutral-500: #667085;
  --color-neutral-100: #eaecf0;

  --color-canvas: #f4f6f8;
  --color-surface: #ffffff;
  --color-ink: #101828;
  --color-ink-soft: #475467;
  --color-line: #e3e7ec;

  /* Fontes locais/sistema: o site estático não depende de CDN nem de rede para renderizar. */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  /* A tipografia de títulos não usa Arial Narrow: em alguns navegadores ela
     comprime/estica os caracteres e prejudica a leitura do panorama. */
  --font-display: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

  --shadow-card: 0 1px 2px rgba(16, 24, 40, 0.05);
  --shadow-pop: 0 12px 32px -8px rgba(7, 24, 43, 0.18);
}

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}

body {
  background-color: var(--color-canvas);
  color: var(--color-ink);
  font-feature-settings: "cv11", "ss01";
  text-rendering: optimizeLegibility;
}

.font-display {
  font-stretch: normal;
  letter-spacing: normal;
}

::selection {
  background: var(--color-accent-200);
  color: var(--color-navy-950);
}

/* ---------- Foco visível (WCAG 2.2 AA) ---------- */
:focus-visible {
  outline: 2.5px solid var(--color-accent-500);
  outline-offset: 2px;
  border-radius: 4px;
}
[data-no-focus-ring]:focus-visible {
  outline: none;
}

/* ---------- Link "Pular para o conteúdo" ---------- */
.skip-link {
  position: fixed;
  top: -100px;
  left: 16px;
  z-index: 100;
  background: var(--color-navy-900);
  color: #fff;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: top 0.18s ease-out;
  box-shadow: var(--shadow-pop);
}
.skip-link:focus-visible {
  top: 12px;
  outline-color: var(--color-accent-400);
}

/* ---------- Tabelas ---------- */
.tnum {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

/* Barras de rolagem discretas */
* {
  scrollbar-width: thin;
  scrollbar-color: #c3ccd6 transparent;
}
*::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}
*::-webkit-scrollbar-thumb {
  background: #c3ccd6;
  border-radius: 8px;
}

/* ---------- Dialog ---------- */
dialog::backdrop {
  background: rgba(7, 24, 43, 0.55);
  backdrop-filter: blur(2px);
}

/* ---------- Utilidades ---------- */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: 14px;
  box-shadow: var(--shadow-card);
}

.overline {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ink-soft);
}

.text-balance {
  text-wrap: balance;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.anim-fade-up {
  animation: fade-up 0.35s ease-out both;
}

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #eef1f4 25%, #f7f9fb 40%, #eef1f4 55%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 8px;
}

/* ---------- Movimento reduzido ---------- */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}

/* ---------- Impressão ---------- */
@media print {
  [data-no-print] { display: none !important; }
  body { background: #fff; }
  main { padding: 0 !important; margin: 0 !important; }
  .card { border: 1px solid #d0d5dd; box-shadow: none; break-inside: avoid; }
  a { color: #101828; text-decoration: none; }
}
````

## `src/app/importar/page.tsx`

````tsx
import { ImportWizard } from "@/components/import-wizard";

export const metadata = { title: "Importar dados" };

export default function ImportarPage() {
  return <ImportWizard />;
}
````

## `src/app/layout.tsx`

````tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Giro de Atas — Painel de Compras · Fundação Butantan",
    template: "%s · Giro de Atas",
  },
  description:
    "Painel interno de compras e Atas de Registro de Preços da Fundação Butantan: panorama de prazos, riscos, áreas e processos, com importação de planilhas Excel e CSV.",
};

export const viewport: Viewport = {
  themeColor: "#07182b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
````

## `src/app/page.tsx`

````tsx
"use client";

import Link from "next/link";
import { FileStack, FileUp, RefreshCw, SearchX } from "lucide-react";
import { getStaticDashboardData, type PanoramaBlock, type StaticDashboardData } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";
import { SNAPSHOT_BLOCKS, type ForecastBand, type SnapshotArea, type SnapshotMonthlyForecastRow } from "@/lib/dashboard-snapshot";
import { useCallback, useEffect, useState } from "react";
import { DatasetsPanel } from "@/components/datasets-panel";
import { ResumoCards } from "@/components/resumo-cards";
import { AtasConcluidas } from "@/components/atas-concluidas";
import { FornecedoresAnalise } from "@/components/fornecedores-analise";
import { StatusAtas } from "@/components/status-atas";
import { EmptyState, PageHeader, areaStyle } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import clsx from "clsx";

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/**
 * Faixas de previsão em ordem cronológica. No Excel as faixas são exclusivas
 * ("ATÉ 30 DIAS" não inclui as de até 15); os cálculos permanecem exclusivos.
 */
const FAIXAS_PREVISAO: Array<{ band: ForecastBand; title: string; titleClass?: string }> = [
  { band: "ate_15", title: "Previstas para concluir nos próximos 15 dias" },
  { band: "ate_30", title: "Previstas para concluir até 30 dias" },
  { band: "ate_60", title: "Previstas para concluir até 60 dias" },
  { band: "vencidas", title: "Previsões Vencidas", titleClass: "bg-danger-700 text-white border-danger-700" },
];

export default function PanoramaPage() {
  const [data, setData] = useState<StaticDashboardData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setErro(null);
      setData(await getStaticDashboardData());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados locais.");
    } finally {
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    const onUpdate = () => carregar();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
  }, [carregar]);

  if (!data) {
    return (
      <div className="space-y-8">
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Carregando a base local deste navegador."
        />
        {erro ? (
          <div className="card border-danger-600/30 bg-danger-100/40 p-5 text-[13.5px] font-semibold text-danger-700" role="alert">
            {erro}
          </div>
        ) : (
          <div className="card space-y-4 p-6" aria-busy="true" aria-label="Carregando panorama">
            <div className="skeleton h-8 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const hoje = new Date().toISOString().slice(0, 10);

  if (!data.hasData) {
    return (
      <>
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Painel interno de compras e Atas de Registro de Preços. Os dados são calculados a partir das planilhas importadas neste navegador."
          actions={(
            <button
              type="button"
              onClick={carregar}
              disabled={atualizando}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 text-[13px] font-semibold text-navy-800 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
              aria-label="Atualizar e reprocessar o panorama com os dados locais"
            >
              <RefreshCw size={16} aria-hidden="true" className={atualizando ? "animate-spin" : undefined} />
              {atualizando ? "Atualizando…" : "Atualizar panorama"}
            </button>
          )}
        />
        <EmptyState
          icon={<FileStack />}
          title="Comece importando as planilhas"
          description="Os números do painel são alimentados pelas planilhas Excel ou CSV. Use as planilhas da equipe para espelhar as visões do SharePoint aqui."
          action={
            <Link
              href="/importar"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-700"
            >
              <FileUp size={17} aria-hidden="true" />
              Importar planilhas
            </Link>
          }
        />
      </>
    );
  }

  const { kpis, porArea, topCompradores, fornecedores, evolucao, previsoes, currentSnapshot, previousSnapshot, savingTotal, blocos, atasConcluidas, statusAtas } = data;
  const referencia = currentSnapshot?.referenceDate ?? null;
  const ausente = (bloco: PanoramaBlock) => blocos[bloco] === "ausente";
  // Ordem única das áreas em todos os blocos do painel, conforme a planilha.
  const areaVisualOrder = ["INDIRETOS", "DIRETOS", "CAPEX"];
  const porAreaVisual = [...(porArea as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));
  const evolucaoVisual = [...(evolucao as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));

  const prevByBand = (area: string, band: ForecastBand) => {
    const key = area.toUpperCase() as SnapshotArea;
    const source = currentSnapshot?.coverage.found.includes("previsao-faixas")
      ? currentSnapshot.previsoes?.[band]?.[key]
      : undefined;
    if (source) {
      return {
        atas: source.atas ?? 0,
        itens: source.itens ?? 0,
        buyers: source.buyers.map((buyer) => ({ name: buyer.name, atas: buyer.atas, itens: buyer.itens })),
      };
    }
    const rows = (previsoes as any[]).filter((row) => {
      if (String(row.area).toUpperCase() !== area.toUpperCase()) return false;
      if (row.band) return row.band === band;
      const days = Number(row.dias);
      if (band === "vencidas") return days < 0;
      if (band === "ate_15") return days >= 0 && days <= 15;
      if (band === "ate_30") return days > 15 && days <= 30;
      if (band === "ate_60") return days > 30 && days <= 60;
      return days > 60;
    });
    const buyersMap = new Map<string, { atas: number; itens: number }>();
    for (const row of rows) {
      if (!row.responsavel) continue;
      const current = buyersMap.get(row.responsavel) ?? { atas: 0, itens: 0 };
      current.atas += Number(row.atas ?? 0);
      current.itens += Number(row.itens ?? 0);
      buyersMap.set(row.responsavel, current);
    }
    return {
      atas: rows.reduce((sum, row) => sum + Number(row.atas ?? 0), 0),
      itens: rows.reduce((sum, row) => sum + Number(row.itens ?? 0), 0),
      buyers: [...buyersMap.entries()].map(([name, values]) => ({ name, ...values })),
    };
  };

  const monthlyForArea = (area: string) => {
    const key = area.toUpperCase() as SnapshotArea;
    const sourceRows: SnapshotMonthlyForecastRow[] = currentSnapshot?.previsaoMeses?.[key]?.rows ?? [];
    const reference = currentSnapshot?.referenceDate ?? hoje;
    const [year, month] = reference.split("-").map(Number);
    const baseDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);

    const sumRows = (rows: SnapshotMonthlyForecastRow[]) => ({
      atas: rows.reduce((sum, row) => sum + Number(row.atas ?? 0), 0),
      itens: rows.reduce((sum, row) => sum + Number(row.itens ?? 0), 0),
    });
    const buckets = [0, 1, 2].map((offset) => {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
      const monthNumber = date.getMonth() + 1;
      const rows = sourceRows.filter((row) => row.month === monthNumber && row.year === date.getFullYear());
      return {
        label: `${MONTH_NAMES_PT[monthNumber - 1]}/${date.getFullYear()}`,
        ...sumRows(rows),
      };
    });
    const explicitLast = sumRows(sourceRows.filter((row) => row.month === null));
    const overdue = explicitLast.atas || explicitLast.itens ? explicitLast : prevByBand(area, "vencidas");
    return [...buckets, { label: "Vencida/Sem Previsão", ...overdue }];
  };

  const areaPercent = (area: string) => {
    const ordered = ["INDIRETOS", "DIRETOS", "CAPEX"];
    const index = ordered.indexOf(area);
    const total = (porArea as any[]).reduce((sum, item) => sum + Number(item.processos || 0), 0);
    if (total <= 0 || index < 0) return 0;
    if (index === ordered.length - 1) {
      const prior = (porArea as any[]).filter((item) => ordered.indexOf(String(item.area).toUpperCase()) < index)
        .reduce((sum, item) => sum + Number(((Number(item.processos || 0) / total) * 100).toFixed(2)), 0);
      return Math.max(0, Number((100 - prior).toFixed(2)));
    }
    const current = (porArea as any[]).find((item) => String(item.area).toUpperCase() === area);
    return Number(((Number(current?.processos || 0) / total) * 100).toFixed(2));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        overline={`Panorama geral · calculado em ${fmtDateLong(hoje)}`}
        title="Gestão Atas Concluídas - Compras"
        actions={(
          <button
            type="button"
            onClick={carregar}
            disabled={atualizando}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 text-[13px] font-semibold text-navy-800 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
            aria-label="Atualizar e reprocessar o panorama com os dados locais"
          >
            <RefreshCw size={16} aria-hidden="true" className={atualizando ? "animate-spin" : undefined} />
            {atualizando ? "Atualizando…" : "Atualizar panorama"}
          </button>
        )}
      />

      {/* Bloco 1: seis cards de resumo — semana anterior e semana atual. */}
      <section aria-labelledby="comparacao-semanal" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="comparacao-semanal" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Resumo das atas</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">A semana anterior é preservada no IndexedDB deste navegador e substituída pela leitura imediatamente anterior após uma nova importação.</p>
          </div>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-[12px] font-semibold text-navy-700">
            Referência anterior: {formatReferenceDate(previousSnapshot?.referenceDate)}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Bases da comparação semanal">
          <div className="rounded-xl border border-line bg-white p-4 text-[12.5px]">
            <h3 className="font-semibold text-navy-900">Base atual</h3>
            <p className="mt-1 text-ink-soft">Data de referência: {formatReferenceDate(currentSnapshot?.referenceDate)}</p>
            <p className="mt-1 break-words text-ink-soft">Arquivo: {currentSnapshot ? (data.snapshotHistory[0]?.fileName || "Nome do arquivo não disponível") : "Sem snapshot importado; indicadores disponíveis vêm dos registros operacionais."}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4 text-[12.5px]">
            <h3 className="font-semibold text-navy-900">Base anterior</h3>
            <p className="mt-1 text-ink-soft">Data de referência: {formatReferenceDate(previousSnapshot?.referenceDate)}</p>
            <p className="mt-1 break-words text-ink-soft">Arquivo: {data.snapshotHistory[1] ? (data.snapshotHistory[1].fileName || "Nome do arquivo não disponível") : previousSnapshot ? "Não se aplica — referência fixa, sem arquivo importado" : "Sem base anterior"}</p>
          </div>
        </div>
        {previousSnapshot && !data.snapshotHistory[1] && (
          <p role="status" className="rounded-xl border border-line bg-navy-50 p-4 text-[12.5px] text-navy-900">
            A base anterior usa a referência fixa de {formatReferenceDate(previousSnapshot.referenceDate)}, fornecida na captura do SharePoint, e não uma planilha importada. Ela contém apenas os indicadores de resumo; será substituída pelo histórico real quando houver uma importação anterior disponível.
          </p>
        )}
        {previousSnapshot && (
          <ResumoCards
            titulo="Resumo das Atas Concluídas"
            status={`Status semana anterior ${formatShortDate(previousSnapshot.referenceDate)}`}
            kpis={previousSnapshot.kpis}
            tone="anterior"
          />
        )}
        {ausente("kpis-leitura") ? (
          <BlocoAusente bloco="kpis-leitura" referencia={referencia} />
        ) : (
          <ResumoCards
            titulo="Resumo das Atas Concluídas"
            status={`Status atual ${formatShortDate(currentSnapshot?.referenceDate)}`}
            tone="atual"
            kpis={{
              concluidasAtas: kpis.concluidosAtas,
              concluidasItens: kpis.concluidosItens,
              andamentoAtas: kpis.andamentoAtas,
              andamentoItens: kpis.andamentoItens,
              saldoItens: kpis.saldoItens,
              consumidoItens: kpis.consumidoItens,
              aVencerAtas: kpis.aVencerAtas,
              aVencerItens: kpis.aVencerItens,
              vencidasAtas: kpis.vencidasAtas,
              vencidasItens: kpis.vencidasItens,
            }}
          />
        )}
      </section>

      {/* Bloco 1b: atas que passaram a FINALIZADO desde a importação anterior. */}
      <section aria-labelledby="atas-concluidas-recentes" className="space-y-4">
        <div>
          <h2 id="atas-concluidas-recentes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Atas Concluídas desde a Última Atualização</h2>
          <p className="mt-1 text-[12.5px] text-ink-soft">Atas com ETAPA ATUAL = FINALIZADO na aba “Base - Atas Em andamento” que não estavam finalizadas na importação anterior. O fornecedor vem da aba “Base - Controle de Contratos”, pelo nº do contrato.</p>
        </div>
        {ausente("atas-concluidas") ? (
          <BlocoAusente bloco="atas-concluidas" referencia={referencia} />
        ) : (
          <AtasConcluidas dados={atasConcluidas} referencia={referencia} />
        )}
      </section>

      {/* Bloco 2: Valor Contratado & Saving (Ref: Screenshot 2 & 12) */}
      <section className="card overflow-hidden text-[13px]">
        <div className="grid items-stretch lg:grid-cols-2 divide-x divide-line">
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] items-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Valor Contratado Por Área</h3>
            {ausente("valores-por-area") ? (
              <div className="flex-1 px-5 pb-5"><BlocoAusente bloco="valores-por-area" referencia={referencia} compact /></div>
            ) : (
            <table className="w-full flex-1 text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="h-full divide-y divide-white border-b-4 border-white">
                {porAreaVisual.map((a) => (
                  <tr key={a.area} className={clsx("font-bold text-white", areaStyle(a.area).band)}>
                    <td className="px-5 py-3 uppercase">{a.area}</td>
                    <td className="px-5 py-3 text-right">{fmtCurrency(a.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-[#2A4D14] text-white font-bold">
                  <td className="px-5 py-3">TOTAL</td>
                  <td className="px-5 py-3 text-right">{fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.valor, 0))}</td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] flex-col justify-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Saving <span className="text-[14px] text-danger-700 block mt-1 font-sans">Mapeamento iniciado em abr.2026</span></h3>
            {ausente("saving") ? (
              <div className="flex-1 px-5 pb-5"><BlocoAusente bloco="saving" referencia={referencia} compact /></div>
            ) : (
            <table className="w-full flex-1 text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold text-[11px] text-center">
                  <th className="px-2 py-3">VALOR CONTRATADO R$</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING HISTÓRICO R$ / %</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING SOB PROPOSTA R$ / %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white text-center font-medium bg-[#E6E6E6]">
                {porAreaVisual.map((a: any) => (
                  <tr key={a.area}>
                    <td className="px-2 py-3">{fmtCurrency(a.valorSaving ?? a.valor)}</td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_hist)}<br/>
                      <span className="text-[11px] font-normal">{a.reducao_hist_pct !== null && a.reducao_hist_pct !== undefined ? fmtNum(a.reducao_hist_pct) : (a.valorSaving > 0 ? fmtNum((a.saving_hist / a.valorSaving) * 100) : "0")}%</span>
                    </td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_prop)}<br/>
                      <span className="text-[11px] font-normal">{a.reducao_prop_pct !== null && a.reducao_prop_pct !== undefined ? fmtNum(a.reducao_prop_pct) : (a.valorSaving > 0 ? fmtNum((a.saving_prop / a.valorSaving) * 100) : "0")}%</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#b3d482] font-bold">
                  <td className="px-2 py-3">{fmtCurrency(savingTotal?.valorSaving ?? (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))}</td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency(savingTotal?.saving_hist ?? (porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0))}<br/>
                    <span className="text-[11px] font-normal">{savingTotal?.reducao_hist_pct !== null && savingTotal?.reducao_hist_pct !== undefined
                      ? `${fmtNum(savingTotal.reducao_hist_pct)}%`
                      : `${fmtNum((((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0)) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))) * 100)}%`}</span>
                  </td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency(savingTotal?.saving_prop ?? (porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0))}<br/>
                    <span className="text-[11px] font-normal">{savingTotal?.reducao_prop_pct !== null && savingTotal?.reducao_prop_pct !== undefined
                      ? `${fmtNum(savingTotal.reducao_prop_pct)}%`
                      : `${fmtNum((((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0)) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))) * 100)}%`}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
        </div>
      </section>

      {/* Bloco 3: Distribuição de Volume & Fornecedores (Ref: Screenshot 3 & 13) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Distribuição de Volume por Área (% Atas)</h2>
          {ausente("top-compradores") ? (
            <BlocoAusente bloco="top-compradores" referencia={referencia} />
          ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = areaPercent(area);
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className={clsx("text-center py-3 text-white", areaStyle(area).band)}>
                    <div className="font-bold">{area}</div>
                    <div className="text-[13px]">{fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))} ATAS (TOP 5) — {fmtNum(percent)}% DO TOTAL</div>
                    <div className="text-[10px] text-white/75">Área: {fmtInt(areaStats.processos)} ATAS</div>
                  </div>
                  <div className="p-4 bg-neutral-100">
                    <div className="text-center font-bold text-[12px] uppercase text-navy-900 mb-3 underline underline-offset-4">TOP 5 COMPRADORES · ATAS SOMADAS: {fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))}</div>
                    <ul className="space-y-1 text-[11px]">
                      {tCompradores.map(c => (
                        <li key={c.responsavel} className="flex justify-between items-center text-navy-800">
                          <span className="font-bold text-navy-500 uppercase truncate pr-2">{c.responsavel}</span>
                          <span className="shrink-0 text-navy-950 font-medium">{c.itens} ITENS | {c.atas} ATAS</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Representatividade Fornecedores</h2>
          {ausente("fornecedores") ? (
            <BlocoAusente bloco="fornecedores" referencia={referencia} />
          ) : (
          <div className="card overflow-hidden overflow-x-auto text-[11px]">
            <h3 className="bg-[#111c75] px-3 py-3 text-center font-bold text-white">FORNECEDORES GERAL</h3>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-navy-950 text-white text-center font-bold">
                  <th className="px-2 py-2">FORNECEDOR</th>
                  <th className="px-2 py-2">QTD ATAS</th>
                  <th className="px-2 py-2">QTD ITENS</th>
                  <th className="px-2 py-2">% CONCENTRAÇÃO DE ITENS</th>
                  <th className="px-2 py-2">ANÁLISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-center font-medium">
                {(fornecedores as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-5 text-ink-soft">Nenhuma linha específica reconhecida.</td></tr>
                ) : (fornecedores as any[]).map((f: any, index: number) => {
                  const analysis = f.analise || (f.concentracao >= 15 ? "Alta Concentração" : f.concentracao >= 5 ? "Volume Médio" : "Pulverizado");
                  const analysisTone = analysis.toUpperCase().includes("ALTA") ? "bg-[#f3baba]" : analysis.toUpperCase().includes("MÉDIO") || analysis.toUpperCase().includes("MEDIO") ? "bg-[#fdf0a6]" : "bg-[#f2e6b1]";
                  return (
                    <tr key={`${f.fornecedor}-${index}`}>
                      <td className="px-2 py-2 text-left uppercase text-navy-950">{f.fornecedor}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtInt(f.atas)}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtInt(f.itens)}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtNum(f.concentracao)}%</td>
                      <td className={clsx("px-2 py-2 border-l border-white text-left", analysisTone)}>{analysis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
          {!ausente("fornecedores") && <FornecedoresAnalise fornecedores={fornecedores} />}
        </div>
      </section>

      {/* Bloco 4: Evolução Por Área (Ref: Screenshot 4 & 14) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Evolução Por Área (Por Status Atual)</h2>
        {ausente("evolucao") ? (
          <BlocoAusente bloco="evolucao" referencia={referencia} />
        ) : (
        <div className="card overflow-x-auto text-[12px]">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-navy-950 text-white font-bold leading-tight">
                <th className="px-3 py-3 w-32 border-r border-white/20">ÁREAS</th>
                <th className="px-3 py-3 border-r border-white/20">ATAS | ITENS<br/>Concluídas<br/>(Válidas)</th>
                <th className="px-3 py-3 border-r border-white/20">EM<br/>ANDAMENTO</th>
                <th className="px-3 py-3 border-r border-white/20">ITENS COM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-white/20">ITENS SEM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-white/20">VENCIDAS</th>
                <th className="px-3 py-3">A VENCER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-navy-900 font-medium">
              {evolucaoVisual.map((e: any) => (
                <tr key={e.area}>
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", areaStyle(e.area).band)}>
                    {e.area}
                  </td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.concluidas_atas)} ATAS<br/>{fmtInt(e.concluidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.andamento_atas)} ATAS<br/>{fmtInt(e.andamento_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.saldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.semsaldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.vencidas_atas)} ATAS<br/>{fmtInt(e.vencidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.a_vencer_atas)} ATAS<br/>{fmtInt(e.a_vencer_itens)} ITENS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Bloco 5: Status das Atas por área (aba dedicada da planilha). */}
      <section aria-labelledby="status-das-atas">
        <h2 id="status-das-atas" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-2">Status das Atas</h2>
        <p className="mb-6 text-[12.5px] text-ink-soft">Carteira de renovações, vencimentos prioritários e situação dos contratos, lidos da aba de status/renovações importada junto com o resumo.</p>
        {ausente("status-atas") ? (
          <BlocoAusente bloco="status-atas" referencia={referencia} />
        ) : (
          <StatusAtas areas={statusAtas} referencia={referencia} />
        )}
      </section>

      {/* Bloco 6: Previsão de Conclusão Por Faixa (Ref: Screenshots 8 & 18) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-6">Indicadores - Atas em andamento</h2>
        <h3 className="text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Previsão de Conclusão por Faixa</h3>
        
        {ausente("previsao-faixas") ? (
          <BlocoAusente bloco="previsao-faixas" referencia={referencia} />
        ) : (
        <div className="space-y-8">
          {FAIXAS_PREVISAO.map(({ band, title, titleClass }) => (
            <FaixaPrevisao
              key={band}
              title={title}
              titleClass={titleClass}
              areaStats={[
                { area: "INDIRETOS", bg: areaStyle("Indiretos").band, ...prevByBand("Indiretos", band) },
                { area: "DIRETOS", bg: areaStyle("Diretos").band, ...prevByBand("Diretos", band) },
                { area: "CAPEX", bg: areaStyle("CAPEX").band, ...prevByBand("CAPEX", band) },
              ]}
            />
          ))}
        </div>
        )}
        {ausente("previsao-meses") ? (
          <BlocoAusente bloco="previsao-meses" referencia={referencia} />
        ) : (
          <PrevisaoMensal
            areas={[
              { area: "INDIRETOS", bg: areaStyle("Indiretos").band, buckets: monthlyForArea("Indiretos") },
              { area: "DIRETOS", bg: areaStyle("Diretos").band, buckets: monthlyForArea("Diretos") },
              { area: "CAPEX", bg: areaStyle("CAPEX").band, buckets: monthlyForArea("CAPEX") },
            ]}
          />
        )}
      </section>

      {/* Bases e origem */}
      <section className="mt-12 border-t border-line pt-8" data-no-print>
        <h2 className="text-[16px] font-bold text-navy-950 mb-4">Auditoria das Bases de Dados</h2>
        <DatasetsPanel />
      </section>
    </div>
  );
}

/* --- Componentes de Gráficos --- */

function BlocoAusente({ bloco, referencia, compact = false }: { bloco: PanoramaBlock; referencia: string | null; compact?: boolean }) {
  const info = SNAPSHOT_BLOCKS[bloco];
  return (
    <div
      role="status"
      className={clsx("rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/40 text-center", compact ? "px-4 py-6" : "px-6 py-10")}
    >
      <SearchX size={22} className="mx-auto text-navy-400" aria-hidden="true" />
      <p className="mt-2 text-[14px] font-bold text-navy-900">Bloco não encontrado na planilha importada</p>
      <p className="mx-auto mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-soft">
        A importação{referencia ? ` de ${formatReferenceDate(referencia)}` : " atual"} não trazia <strong className="font-semibold text-navy-800">{info.label.toLowerCase()}</strong>; por isso nenhum número é exibido aqui — não significa zero.
      </p>
      <p className="mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-navy-800">Esperado na planilha:</span> {info.esperado}.
      </p>
    </div>
  );
}

function formatReferenceDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

/** dd/mm, como nos títulos dos cards do SharePoint. */
function formatShortDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function FaixaPrevisao({ title, titleClass = "bg-[#dcf0cf] text-navy-950", areaStats }: { title: string, titleClass?: string, areaStats: any[] }) {
  return (
    <div>
      <div className={clsx("border border-line py-2 text-center font-bold mb-4", titleClass)}>{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("py-1 text-center text-white text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="tnum mb-6 font-sans leading-tight tracking-normal text-[#0d952e]">
              <div className="text-[18px] font-bold">{String(s.atas).padStart(2, '0')} ATAS</div>
              <div className="text-[18px] font-bold">{String(s.itens).padStart(2, '0')} ITENS</div>
            </div>
            <div className="space-y-3">
              {s.buyers.map((b: any, index: number) => (
                <div key={`${b.name}-${index}`} className="border-b border-line/60 pb-2 leading-tight">
                  <div className="text-[11px] font-bold text-navy-900 uppercase truncate" title={b.name}>{b.name}</div>
                  {(b.atas !== null || b.itens !== null) && (
                    <div className="text-[10px] font-semibold text-ink-soft">{fmtInt(b.atas)} ATAS · {fmtInt(b.itens)} ITENS</div>
                  )}
                </div>
              ))}
              {s.buyers.length === 0 && <p className="text-[11px] text-ink-soft">Nenhum comprador reconhecido nesta faixa.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrevisaoMensal({ areas }: { areas: Array<{ area: string; bg: string; buckets: Array<{ label: string; atas: number; itens: number }> }> }) {
  const bucketColors = ["bg-[#e2e2e2]", "bg-[#f9dfa8]", "bg-[#edf8df]", "bg-[#f7e7e7]"];
  return (
    <section className="space-y-6 border-t border-line pt-2" aria-labelledby="previsao-por-mes">
      <h3 id="previsao-por-mes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">
        Previsão de Conclusão por Mês
      </h3>
      <div className="space-y-7">
        {areas.map(({ area, bg, buckets }) => (
          <div key={area}>
            <div className={clsx("mb-3 border border-navy-900 py-2 text-center text-[16px] font-bold text-white", bg)}>{area}</div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {buckets.map((bucket, index) => (
                <div key={`${area}-${bucket.label}`} className="relative min-w-0">
                  <div className={clsx("flex min-h-[58px] flex-col items-center justify-center px-1 text-center font-sans leading-tight tracking-normal", bucketColors[index])}>
                    <span className="tnum text-[13px] font-semibold text-navy-950">{String(bucket.atas).padStart(2, "0")} ATAS</span>
                    <span className="tnum text-[13px] font-semibold text-navy-950">{String(bucket.itens).padStart(2, "0")} ITENS</span>
                  </div>
                  <div className="mt-2 flex min-h-7 items-start justify-center text-center text-[11px] font-sans leading-tight tracking-normal text-ink-soft">
                    <span>{bucket.label}</span>
                    {index < buckets.length - 1 && <span className="ml-2 hidden font-bold text-navy-900 sm:inline" aria-hidden="true">→</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
````

## `src/app/processos/page.tsx`

````tsx
import { Suspense } from "react";
import { ProcessosBrowser } from "@/components/processos-browser";

export const metadata = { title: "Processos" };

export default function ProcessosPage() {
  return (
    <Suspense>
      <ProcessosBrowser />
    </Suspense>
  );
}
````

## `src/components/app-shell.tsx`

````tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, Maximize2, Minimize2, Table2, Upload } from "lucide-react";
import clsx from "clsx";
import { fmtDate } from "@/lib/format";
import { getStaticBaseSummary } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";

const NAV = [
  { href: "/", label: "Panorama", icon: LayoutDashboard, match: (p: string) => p === "/" },
  { href: "/processos", label: "Processos", icon: Table2, match: (p: string) => p.startsWith("/processos") },
  { href: "/importar", label: "Importar", icon: Upload, match: (p: string) => p.startsWith("/importar") },
  { href: "/documentos", label: "Documentos", icon: BookOpen, match: (p: string) => p.startsWith("/documentos") },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true" className="shrink-0">
        <rect x="2" y="2" width="34" height="34" rx="9" fill="#0c2338" stroke="#1b4568" />
        <path d="M9 24.5 15 15l4.2 5.2L23.5 14 29 24.5Z" fill="none" stroke="#e06e1f" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx="28.2" cy="10.6" r="2.4" fill="#ec9152" />
      </svg>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[17px] font-bold tracking-tight text-white">Giro de Atas</span>
          <span className="block text-[11.5px] font-medium text-navy-300">Compras · Fundação Butantan</span>
        </span>
      )}
    </span>
  );
}

/** Chip de contexto da base: data de referência + nº de bases ativas. */
function BaseChip() {
  const [info, setInfo] = useState<{ label: string; detalhe: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getStaticBaseSummary();
      if (!data.hasData) {
        setInfo({ label: "Nenhuma base carregada", detalhe: "Importe uma planilha para começar" });
      } else {
        setInfo({
          label: data.referenceDate ? `Base de referência: ${fmtDate(data.referenceDate)}` : "Base sem data de referência",
          detalhe: `${data.activeCount} ${data.activeCount === 1 ? "base ativa" : "bases ativas"} · ${data.processCount.toLocaleString("pt-BR")} registros`,
        });
      }
    } catch {
      setInfo({ label: "Armazenamento local indisponível", detalhe: "verifique as permissões do navegador" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const onUpdate = () => load();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
  }, [load]);

  return (
    <div
      className="hidden min-w-0 flex-col items-end text-right sm:flex"
      role="status"
      aria-live="polite"
      aria-label="Contexto da base de dados"
    >
      {loading ? (
        <span className="skeleton h-8 w-44 rounded-lg" aria-hidden="true" />
      ) : (
        <>
          <span className="text-[13px] font-semibold text-ink">{info?.label}</span>
          <span className="text-[12px] text-ink-soft">{info?.detalhe}</span>
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPanorama = pathname === "/" || pathname === "/Atas" || pathname === "/Atas/";
  const onImport = pathname.startsWith("/importar");
  const [panoramaFocus, setPanoramaFocus] = useState(false);

  useEffect(() => {
    // A visualização limpa é exclusiva do panorama; as demais rotas mantêm a navegação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isPanorama) setPanoramaFocus(false);
  }, [isPanorama, pathname]);

  return (
    <div className={clsx("min-h-dvh", panoramaFocus && isPanorama && "bg-canvas")}>
      {/* ================= Sidebar (desktop) ================= */}
      {!panoramaFocus && (
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy-950 lg:flex"
        aria-label="Navegação principal"
      >
        <div className="px-5 pb-5 pt-6">
          <Link href="/" className="inline-block rounded-lg" aria-label="Giro de Atas — ir para o Panorama">
            <BrandMark />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Seções do painel">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-[14px] font-medium transition-colors",
                  active
                    ? "bg-navy-800/80 text-white"
                    : "text-navy-300 hover:bg-navy-900 hover:text-white",
                )}
              >
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40",
                  )}
                />
                <item.icon size={19} strokeWidth={2} aria-hidden="true" className={active ? "text-accent-400" : "text-navy-400 group-hover:text-navy-200"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-800/70 px-5 py-4">
          <p className="text-[11.5px] leading-relaxed text-navy-400">
            Dados armazenados neste navegador (IndexedDB). Não há sincronização automática com o SharePoint nem entre usuários.
          </p>
        </div>
      </aside>
      )}

      {/* ================= Topbar ================= */}
      {!panoramaFocus && (
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm lg:pl-[248px]">
        <div className="flex h-[60px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" aria-label="Giro de Atas — ir para o Panorama" className="rounded-lg">
              <BrandMark compact />
            </Link>
            <span className="font-display text-[16px] font-bold tracking-tight text-navy-950">Giro de Atas</span>
          </div>
          <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
            <span className="text-[13px] font-medium text-ink-soft">Painel de Compras e Atas de Registro de Preços</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {isPanorama && (
              <button
                type="button"
                onClick={() => setPanoramaFocus(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-navy-200 bg-white px-3 text-[12.5px] font-semibold text-navy-800 shadow-sm transition-colors hover:bg-navy-50"
                aria-label="Abrir o panorama em tela cheia, sem navegação"
              >
                <Maximize2 size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Tela cheia</span>
              </button>
            )}
            <BaseChip />
            {!onImport && (
              <Link
                href="/importar"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-accent-700"
              >
                <Upload size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Importar planilha</span>
                <span className="sm:hidden">Importar</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      )}

      {/* ================= Conteúdo ================= */}
      <main
        id="conteudo"
        tabIndex={-1}
        className={clsx(
          "anim-fade-up mx-auto w-full",
          panoramaFocus && isPanorama
            ? "max-w-none px-5 pb-14 pt-8 sm:px-8 lg:px-12"
            : "max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:pl-[272px] lg:pr-8 lg:pt-8 lg:pb-14 lg:max-w-none",
        )}
      >
        {children}
      </main>

      {panoramaFocus && isPanorama && (
        <button
          type="button"
          onClick={() => setPanoramaFocus(false)}
          className="fixed right-4 top-4 z-50 inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 bg-navy-950/90 px-3 text-[12.5px] font-semibold text-white shadow-pop backdrop-blur-sm transition-colors hover:bg-navy-800"
          aria-label="Sair da tela cheia e restaurar a navegação"
        >
          <Minimize2 size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Sair da tela cheia</span>
        </button>
      )}

      {/* ================= Navegação inferior (mobile) ================= */}
      {!panoramaFocus && (
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Navegação principal (móvel)"
        data-no-print
      >
        <ul className="grid grid-cols-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-navy-800" : "text-neutral-500 hover:text-navy-700",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "absolute top-0 h-[3px] w-10 rounded-b-full bg-accent-500 transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <item.icon size={21} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" className={active ? "text-accent-600" : undefined} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      )}
    </div>
  );
}
````

## `src/components/atas-concluidas.tsx`

````tsx
"use client";

import { CircleCheckBig } from "lucide-react";
import type { AtasConcluidasResult } from "@/lib/static-dashboard";
import { AreaTag } from "@/components/ui";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";

/**
 * Lista compacta das atas que passaram a FINALIZADO desde a importação
 * anterior (uma linha por ata). O fornecedor vem da aba de controle de
 * contratos, cruzado pelo nº do contrato.
 */
export function AtasConcluidas({ dados, referencia }: { dados: AtasConcluidasResult; referencia: string | null }) {
  const { novas, primeiraLeitura, comparadoComReferencia, comparadoComImportadoEm, totalFinalizadas } = dados;
  const semFornecedor = novas.filter((ata) => ata.contrato && !ata.fornecedor).length;
  const semContrato = novas.filter((ata) => !ata.contrato).length;

  const comparacao = primeiraLeitura
    ? `Sem base anterior para comparação. Esta é a primeira importação com a aba de andamento: todas as ${fmtInt(totalFinalizadas)} atas FINALIZADO aparecem abaixo como posição da base atual, não como novas conclusões do período. A partir da próxima importação, só entram as que mudaram para FINALIZADO.`
    : `Base de ${fmtDate(referencia)} comparada com a importação de ${comparadoComReferencia ? fmtDate(comparadoComReferencia) : fmtDateTime(comparadoComImportadoEm)}: ${fmtInt(novas.length)} ${novas.length === 1 ? "ata passou" : "atas passaram"} a FINALIZADO (${fmtInt(totalFinalizadas)} finalizadas no total).`;

  return (
    <div className="card overflow-hidden text-[12.5px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ok-100/60 px-5 py-3">
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ok-700">
          <CircleCheckBig size={16} aria-hidden="true" />
          {fmtInt(novas.length)} {primeiraLeitura ? (novas.length === 1 ? "ata finalizada na base atual" : "atas finalizadas na base atual") : (novas.length === 1 ? "ata concluída" : "atas concluídas")}
        </p>
        <p className="text-[12px] text-ink-soft">{comparacao}</p>
      </div>
      {novas.length === 0 ? (
        <p role="status" className="px-5 py-6 text-center text-ink-soft">
          {primeiraLeitura ? "Nenhuma ata FINALIZADO na base atual. Sem base anterior para comparação." : "Nenhuma ata passou a FINALIZADO desde a importação anterior."}
        </p>
      ) : (
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-navy-950 text-[11px] font-bold uppercase text-white">
                <th className="px-4 py-2">Ata</th>
                <th className="px-3 py-2">Contrato</th>
                <th className="px-3 py-2">Fornecedor</th>
                <th className="px-3 py-2 text-right">Qtd. de itens</th>
                <th className="px-3 py-2">Comprador(a)</th>
                <th className="px-3 py-2">Área</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {novas.map((ata) => (
                <tr key={ata.key} className="odd:bg-white even:bg-navy-50/40">
                  <td className="px-4 py-2 font-semibold uppercase text-navy-950">
                    <span className="text-ink-soft">ATA: </span>
                    {ata.descricao}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-navy-900">{ata.contrato ?? <span className="text-ink-soft">—</span>}</td>
                  <td className="px-3 py-2 uppercase text-navy-900">
                    {ata.fornecedor ?? (
                      <span className="text-ink-soft" title={ata.contrato ? "Contrato não encontrado na aba Base - Controle de Contratos" : "Ata sem nº de contrato na base"}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-navy-900">{fmtInt(ata.itens)}</td>
                  <td className="px-3 py-2 text-navy-900">{ata.comprador ?? <span className="text-ink-soft">—</span>}</td>
                  <td className="px-3 py-2">{ata.area ? <AreaTag area={ata.area} /> : <span className="text-ink-soft">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(semFornecedor > 0 || semContrato > 0) && (
        <p className="border-t border-line px-5 py-2 text-[11.5px] text-ink-soft">
          {semFornecedor > 0 && `${fmtInt(semFornecedor)} ${semFornecedor === 1 ? "ata sem fornecedor" : "atas sem fornecedor"}: o contrato não consta na aba “Base - Controle de Contratos” importada. `}
          {semContrato > 0 && `${fmtInt(semContrato)} ${semContrato === 1 ? "ata sem nº de contrato" : "atas sem nº de contrato"} na base de andamento.`}
        </p>
      )}
    </div>
  );
}
````

## `src/components/charts.tsx`

````tsx
import type { ReactNode } from "react";
import clsx from "clsx";
import { fmtInt } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Wrapper acessível: todo gráfico ganha alternativa em tabela          */
/* ------------------------------------------------------------------ */

export function ChartBlock({
  title,
  summary,
  children,
  table,
}: {
  title: string;
  summary: string;
  children: ReactNode;
  table: { headers: string[]; rows: (string | number)[][] };
}) {
  return (
    <div className="card p-5">
      <h3 className="mb-1 text-[14.5px] font-bold text-navy-950">{title}</h3>
      <p className="sr-only">{summary}</p>
      <div role="img" aria-label={summary}>
        {children}
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer rounded-md text-[12.5px] font-semibold text-navy-600 underline decoration-navy-300 underline-offset-2 hover:text-navy-800">
          Ver dados em formato de tabela
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                {table.headers.map((h) => (
                  <th key={h} scope="col" className="py-1.5 pr-3 font-semibold text-ink-soft last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  {r.map((c, j) => (
                    <td key={j} className={clsx("py-1.5 pr-3 text-ink", j === r.length - 1 && "tnum text-right")}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rosca (distribuição por área)                                        */
/* ------------------------------------------------------------------ */

export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function Donut({ segments, total }: { segments: Segment[]; total: number }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const visibleSegments = segments.filter((s) => s.value > 0);
  const arcs = visibleSegments.map((s, index) => {
    const frac = total > 0 ? s.value / total : 0;
    const dash = frac * C;
    const offset = visibleSegments.slice(0, index).reduce((sum, item) => {
      return sum + (total > 0 ? item.value / total : 0) * C;
    }, 0);
    return (
      <circle
        key={s.label}
        cx="70"
        cy="70"
        r={R}
        fill="none"
        stroke={s.color}
        strokeWidth="20"
        strokeDasharray={`${dash} ${C - dash}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 70 70)"
      />
    );
  });

  return (
    <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
      <svg viewBox="0 0 140 140" className="h-[150px] w-[150px] shrink-0" aria-hidden="true">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#eef1f4" strokeWidth="20" />
        {arcs}
        <text x="70" y="66" textAnchor="middle" className="fill-navy-950" fontSize="24" fontWeight="700" fontFamily="var(--font-display)">
          {fmtInt(total)}
        </text>
        <text x="70" y="84" textAnchor="middle" className="fill-ink-soft" fontSize="10.5">
          processos
        </text>
      </svg>
      <ul className="w-full space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-[13.5px]">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-[4px]" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-ink">{s.label}</span>
            <span className="tnum font-semibold text-navy-950">{fmtInt(s.value)}</span>
            <span className="tnum w-12 text-right text-ink-soft">
              {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontais                                                   */
/* ------------------------------------------------------------------ */

export function HBars({
  items,
  colorFn,
  maxLabel,
}: {
  items: { label: string; value: number; hint?: string }[];
  colorFn?: (index: number, item: { label: string; value: number }) => string;
  maxLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const barColor = colorFn ?? (() => "#2f6ba0");
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item, i) => (
        <li key={`${item.label}-${i}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink" title={item.label}>
              {item.label}
            </span>
            <span className="tnum shrink-0 font-semibold text-navy-950">
              {fmtInt(item.value)}
              {item.hint && <span className="ml-1.5 font-normal text-ink-soft">{item.hint}</span>}
              {maxLabel && <span className="sr-only"> {maxLabel}</span>}
            </span>
          </div>
          <div className="h-[9px] overflow-hidden rounded-full bg-[#eef1f4]" aria-hidden="true">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${(item.value / max) * 100}%`, backgroundColor: barColor(i, item) }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Empilhada (situação por área)                                        */
/* ------------------------------------------------------------------ */

export function StackedRow({
  label,
  parts,
  total,
}: {
  label: string;
  parts: { key: string; label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="font-medium text-ink">{label}</span>
        <span className="tnum font-semibold text-navy-950">{fmtInt(total)}</span>
      </div>
      <div className="flex h-[10px] overflow-hidden rounded-full bg-[#eef1f4]" aria-hidden="true">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.key}
              style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%`, backgroundColor: p.color }}
              title={`${p.label}: ${fmtInt(p.value)}`}
            />
          ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11.5px] text-ink-soft">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-[3px]" style={{ backgroundColor: p.color }} />
              {p.label}: <span className="tnum font-semibold">{fmtInt(p.value)}</span>
            </span>
          ))}
      </div>
    </li>
  );
}
````

## `src/components/datasets-panel.tsx`

````tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, FileSpreadsheet, Trash2, CircleAlert } from "lucide-react";
import clsx from "clsx";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";
import { KIND_LABEL } from "@/lib/domain";
import { snapshotBlockLabel } from "@/lib/dashboard-snapshot";
import { deleteDataset, formatStoredDataset, listDatasets, notifyStaticDataChanged } from "@/lib/static-store";

interface DatasetItem {
  id: number;
  kind: string;
  natureza: string;
  file_name: string;
  sheet_name: string | null;
  reference_date: string | null;
  imported_at: string;
  status: string;
  mode: string;
  row_count: number;
  valid_count: number;
  skipped_count: number;
  dup_count: number;
  warning_count: number;
  registros: number;
  has_snapshot?: boolean;
  snapshot_coverage?: { found: string[]; missing: string[] } | null;
}

function notifyBaseUpdated() {
  notifyStaticDataChanged();
}

export function DatasetsPanel({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<DatasetItem[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await listDatasets();
      setItems(data.map(formatStoredDataset));
      setErro(null);
    } catch {
      setErro("Não foi possível carregar as bases deste navegador.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    if (confirmId !== null) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    }
  }, [confirmId]);

  async function excluir() {
    if (confirmId === null) return;
    setExcluindo(true);
    try {
      await deleteDataset(confirmId);
      dialogRef.current?.close();
      setConfirmId(null);
      await load();
      notifyBaseUpdated();
      onChanged?.();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao excluir a base.");
      dialogRef.current?.close();
      setConfirmId(null);
    } finally {
      setExcluindo(false);
    }
  }

  if (erro) {
    return (
      <div className="card flex items-center gap-3 border-danger-600/30 bg-danger-100/40 p-4 text-[13.5px] text-danger-700" role="alert">
        <CircleAlert size={18} aria-hidden="true" />
        {erro}
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="card space-y-3 p-4" aria-busy="true" aria-label="Carregando bases">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
        <Database size={22} className="text-navy-400" aria-hidden="true" />
        <p className="text-[14px] font-semibold text-navy-950">Nenhuma base importada até agora</p>
        <p className="max-w-md text-[13px] text-ink-soft">
          As importações ficam registradas aqui com arquivo de origem, data e número de linhas — a trilha de auditoria do painel.
        </p>
      </div>
    );
  }

  const alvo = items.find((i) => i.id === confirmId);

  return (
    <>
      <ul className="space-y-3" aria-label="Bases de dados importadas">
        {items.map((d) => (
          <li key={d.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    d.status === "active" ? "bg-navy-100 text-navy-600" : "bg-neutral-100 text-neutral-500",
                  )}
                >
                  <FileSpreadsheet size={19} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-navy-950" title={d.file_name}>
                    {d.file_name}
                    {d.sheet_name && <span className="font-normal text-ink-soft"> · aba “{d.sheet_name}”</span>}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">
                    {KIND_LABEL[d.kind as keyof typeof KIND_LABEL] ?? d.kind}
                    {" · "}
                    {d.natureza === "snapshot" ? "Snapshot semanal" : "Base operacional"}
                    {" · "}
                    importada em {fmtDateTime(d.imported_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11.5px]">
                    <span
                      className={clsx(
                        "rounded-full px-2 py-0.5 font-semibold",
                        d.status === "active" ? "bg-ok-100 text-ok-700" : "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {d.status === "active" ? "Ativa" : "Substituída"}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      ref.: {d.reference_date ? fmtDate(d.reference_date) : "—"}
                    </span>
                    <span className="tnum rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      {fmtInt(d.valid_count)} válidas
                    </span>
                    {d.skipped_count > 0 && (
                      <span className="tnum rounded-full bg-warn-100 px-2 py-0.5 font-medium text-warn-700">
                        {fmtInt(d.skipped_count)} ignoradas ({fmtInt(d.dup_count)} duplic.)
                      </span>
                    )}
                    {d.warning_count > 0 && (
                      <span className="tnum rounded-full bg-navy-100 px-2 py-0.5 font-medium text-navy-700">
                        {fmtInt(d.warning_count)} avisos
                      </span>
                    )}
                    {d.has_snapshot && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 font-medium text-accent-700" title={d.snapshot_coverage?.found.length ? `Blocos lidos: ${d.snapshot_coverage.found.map(snapshotBlockLabel).join(", ")}` : "Snapshot local"}>
                        snapshot local{d.snapshot_coverage?.found.length ? ` · ${d.snapshot_coverage.found.length} blocos` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmId(d.id)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-danger-700 transition-colors hover:border-danger-600/40 hover:bg-danger-100/40"
                aria-label={`Excluir a base ${d.file_name}`}
              >
                <Trash2 size={14} aria-hidden="true" />
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={() => setConfirmId(null)}
        className="w-[min(440px,92vw)] rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)]"
        aria-labelledby="dlg-excluir-titulo"
      >
        <div className="p-6">
          <h2 id="dlg-excluir-titulo" className="font-display text-[17px] font-bold text-navy-950">
            Excluir base de dados?
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">
            A base <strong className="text-ink">{alvo?.file_name}</strong> e seus{" "}
            <strong className="tnum text-ink">{fmtInt(alvo?.registros ?? 0)}</strong> registros serão removidos
            definitivamente do banco. Os indicadores do painel serão recalculados. Esta ação não pode ser desfeita.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="min-h-10 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-ink transition-colors hover:bg-neutral-100/60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={excluir}
              disabled={excluindo}
              className="min-h-10 rounded-xl bg-danger-600 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-danger-700 disabled:opacity-60"
            >
              {excluindo ? "Excluindo…" : "Excluir definitivamente"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

export { notifyBaseUpdated };
````

## `src/components/documents-manager.tsx`

````tsx
// src/components/documentos/documents-manager.tsx
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { createDocument, deleteDocument, listDocuments } from "@/lib/static-store";

export interface DocItem {
  id: number;
  titulo: string;
  url: string;
  categoria: string;
  descricao: string | null;
}

const CATEGORIAS = ["Procedimento", "Norma", "Manual", "Link SharePoint", "Outro"];

export function DocumentsManager({ documentos, erroInicial }: { documentos: DocItem[]; erroInicial: boolean }) {
  const [docs, setDocs] = useState<DocItem[]>(documentos);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(erroInicial ? "Não foi possível carregar os documentos." : null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  useEffect(() => {
    let ativo = true;
    listDocuments()
      .then((items) => {
        if (ativo) setDocs(items);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar os documentos deste navegador.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase().trim();
    if (!t) return docs;
    return docs.filter((d) => `${d.titulo} ${d.descricao ?? ""} ${d.categoria}`.toLowerCase().includes(t));
  }, [docs, busca]);

  const agrupados = useMemo(() => {
    const map = new Map<string, DocItem[]>();
    for (const d of filtrados) {
      const arr = map.get(d.categoria) ?? [];
      arr.push(d);
      map.set(d.categoria, arr);
    }
    return [...map.entries()];
  }, [filtrados]);

  async function excluir(id: number) {
    setExcluindo(id);
    setErro(null);
    try {
      await deleteDocument(id);
      setDocs((ds) => ds.filter((d) => d.id !== id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao excluir.");
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <>
      <PageHeader
        overline="Apoio"
        title="Documentos e regras"
        description="Manuais, normas, procedimentos e links úteis (ex.: bibliotecas do SharePoint). Os links são cadastrados pela equipe e ficam neste navegador — este painel não acessa o SharePoint automaticamente."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section aria-label="Lista de documentos" className="space-y-4">
          <div className="relative">
            <label htmlFor="busca-doc" className="sr-only">
              Filtrar documentos
            </label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="busca-doc"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por título, descrição ou categoria…"
              className="min-h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-[14px] text-ink placeholder:text-neutral-500 hover:border-navy-300"
            />
          </div>
          <p aria-live="polite" role="status" className="text-[13px] font-medium text-ink-soft">
            {filtrados.length === 1 ? "1 documento" : `${filtrados.length} documentos`}
            {busca && ` para “${busca}”`}
          </p>

          {erro && (
            <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
              {erro}
            </p>
          )}

          {carregando ? (
            <div className="card space-y-3 p-6" aria-busy="true" aria-label="Carregando documentos">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          ) : agrupados.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
              <BookOpen size={30} className="text-navy-400" aria-hidden="true" />
              <h2 className="font-display text-[17px] font-bold text-navy-950">
                {docs.length === 0 ? "Nenhum documento cadastrado" : "Nenhum documento encontrado"}
              </h2>
              <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
                {docs.length === 0
                  ? "Cadastre ao lado os links de normas, manuais e bibliotecas do SharePoint que a equipe usa no dia a dia. Os documentos ficam neste navegador."
                  : "Ajuste o termo de busca para encontrar outros documentos."}
              </p>
            </div>
          ) : (
            agrupados.map(([categoria, itens]) => (
              <section key={categoria} aria-label={categoria}>
                <h2 className="overline mb-2.5">{categoria}</h2>
                <ul className="space-y-2.5">
                  {itens.map((d) => (
                    <li key={d.id} className="card flex items-start justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 text-[14px] font-bold text-navy-800 hover:text-navy-950"
                        >
                          <span className="underline decoration-navy-300 underline-offset-2 group-hover:decoration-navy-500">
                            {d.titulo}
                          </span>
                          <ExternalLink size={14} aria-hidden="true" className="shrink-0 text-navy-400" />
                          <span className="sr-only">(abre em nova guia)</span>
                        </a>
                        {d.descricao && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{d.descricao}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => excluir(d.id)}
                        disabled={excluindo === d.id}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-danger-700 transition-colors hover:border-danger-600/40 hover:bg-danger-100/40 disabled:opacity-50"
                        aria-label={`Excluir o documento ${d.titulo}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </section>

        <div className="space-y-5">
          <NovoDocumento onCreated={(d) => setDocs((ds) => [...ds, d].sort((a, b) => a.categoria.localeCompare(b.categoria) || a.titulo.localeCompare(b.titulo)))} />
          <RegrasDePreenchimento />
        </div>
      </div>
    </>
  );
}

function RegrasDePreenchimento() {
  return (
    <div className="card space-y-4 p-5 lg:sticky lg:top-[84px]">
      <h2 className="text-[16px] font-display font-bold text-navy-900">Parâmetros do Mapeamento</h2>
      <div className="space-y-4 text-[12px] text-ink-soft">
        <p><strong className="text-ink">Status “A vencer (30 dias)”:</strong> Contratos com vencimento entre hoje e os próximos 30 dias, conforme a regra de classificação do sistema.</p>
        <p><strong className="text-ink">Base “Em Andamento”:</strong> Apurada cruzando a Planilha de Atas em Andamento com o relatório SAP (mapeamento de todos os projetos 7000 criados neste ano sem requisição).</p>
        <p><strong className="text-ink">Snapshot local:</strong> A leitura da semana atual/anterior é gravada no IndexedDB deste navegador. Não há sincronização com SharePoint nem compartilhamento com outros usuários ou dispositivos.</p>
      </div>

      <h2 className="text-[16px] font-display font-bold text-navy-900 mt-6 pt-4 border-t border-line">Colunas exatas do snapshot</h2>
      <ul className="space-y-2 text-[12px] text-ink-soft list-disc pl-4">
        <li><strong className="text-ink">Gráficos:</strong> <code>Gráfico</code>, <code>Situação apresentada</code>, <code>ATAS</code>, <code>ITENS</code>; linhas `ATA CONCLUÍDAS (VÁLIDAS)`, `ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)` e `ATAS VENCIDAS E A VENCER`.</li>
        <li><strong className="text-ink">Valores/saving:</strong> `VALOR DIRETOS`, `VALOR INDIRETOS`, `VALOR CAPEX`, `VALOR CONTRATADO R$`, `SAVING HISTÓRICO R$`, `SAVING PROPOSTA INICIAL R$`, `REDUÇÃO HISTÓRICO %` e `REDUÇÃO PROPOSTA INICIAL %`.</li>
        <li><strong className="text-ink">Top e fornecedores:</strong> `TOP COMP INDIRETOS`, `TOP COMP DIRETOS`, `TOP COMP CAPEX`; `QTD ATAS`, `QTD ITENS`, `% CONCENTRAÇÃO DE ITENS` e `ANÁLISE`.</li>
        <li><strong className="text-ink">Previsões complementares:</strong> outra planilha com `COMPRADOR`, `AREA` e `PRAZO CONCLUSÃO`; o produto cruza essas três colunas e não mostra foto, bolinha ou cargo.</li>
      </ul>

      <h2 className="text-[16px] font-display font-bold text-navy-900 mt-6 pt-4 border-t border-line">Regras | Atas em Andamento</h2>
      <ul className="space-y-2 text-[12px] text-ink-soft list-disc pl-4">
        <li><strong className="text-ink">Moeda e Câmbio:</strong> Valores em Reais (R$). Compras internacionais realizem a conversão.</li>
        <li><strong className="text-ink">Atualização de Tarefas:</strong> Sempre alterar a tarefa atual e estimativa de conclusão.</li>
        <li><strong className="text-ink">Atas em Preparação:</strong> Conter a previsão de início e estimativa de conclusão após levantar o spend.</li>
        <li><strong className="text-ink">Ajuste de Quantidades:</strong> Ao excluir itens, revisar a contabilização exata.</li>
      </ul>

      <h2 className="text-[16px] font-display font-bold text-accent-600 mt-6 pt-4 border-t border-line">Regras | Atas Renovação</h2>
      <ul className="space-y-2 text-[12px] text-ink-soft list-disc pl-4">
        <li><strong className="text-ink">Decisão &quot;NOVA ATA&quot;:</strong> Informar o número do novo projeto (7000). Acompanhado na aba ATAS EM ANDAMENTO.</li>
        <li><strong className="text-ink">Bloqueio do Contrato no SAP:</strong> Os contratos anteriores foram bloqueados no SAP para não permanecerem contabilizados.</li>
        <li><strong className="text-ink">Cobertura dos Itens:</strong> Atenção aos casos em que a nova ata não contemplou 100% dos itens da ata anterior.</li>
        <li><strong className="text-ink">Renovação pelo Mesmo Processo:</strong> Procurar equipe de Governança para apoio no andamento.</li>
      </ul>
    </div>
  );
}

function NovoDocumento({ onCreated }: { onCreated: (d: DocItem) => void }) {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [categoria, setCategoria] = useState("Link SharePoint");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setOk(false);
    try {
      if (!/^https?:\/\/\S+$/i.test(url.trim())) {
        throw new Error("Informe uma URL válida começando com http:// ou https://.");
      }
      const documento = await createDocument({
        titulo: titulo.trim().slice(0, 200),
        url: url.trim().slice(0, 2000),
        categoria,
        descricao: descricao.trim().slice(0, 1000) || null,
      });
      onCreated(documento);
      setTitulo("");
      setUrl("");
      setDescricao("");
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card h-fit space-y-4 p-5 lg:sticky lg:top-[84px]" aria-label="Cadastrar novo documento">
      <h2 className="flex items-center gap-2 text-[14.5px] font-bold text-navy-950">
        <Plus size={16} aria-hidden="true" />
        Cadastrar documento
      </h2>
      <div>
        <label htmlFor="doc-titulo" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Título <span aria-hidden="true" className="text-danger-600">*</span>
        </label>
        <input
          id="doc-titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          maxLength={200}
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
          placeholder="Ex.: Manual de Registro de Preços"
        />
      </div>
      <div>
        <label htmlFor="doc-url" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          URL <span aria-hidden="true" className="text-danger-600">*</span>
        </label>
        <input
          id="doc-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          maxLength={2000}
          inputMode="url"
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
          placeholder="https://…"
        />
      </div>
      <div>
        <label htmlFor="doc-categoria" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Categoria
        </label>
        <select
          id="doc-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[14px] text-ink"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="doc-desc" className="mb-1.5 block text-[12.5px] font-semibold text-ink">
          Descrição <span className="font-normal text-ink-soft">(opcional)</span>
        </label>
        <textarea
          id="doc-desc"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink"
          placeholder="Para que serve e quando consultar"
        />
      </div>
      {erro && (
        <p className="rounded-xl bg-danger-100/60 px-4 py-3 text-[13px] font-semibold text-danger-700" role="alert">
          {erro}
        </p>
      )}
      {ok && (
        <p className="rounded-xl bg-ok-100 px-4 py-3 text-[13px] font-semibold text-ok-700" role="status">
          Documento cadastrado com sucesso.
        </p>
      )}
      <button
        type="submit"
        disabled={salvando}
        className="min-h-11 w-full rounded-xl bg-navy-900 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
      >
        {salvando ? "Salvando…" : "Salvar documento"}
      </button>
    </form>
  );
}
````

## `src/components/fornecedores-analise.tsx`

````tsx
import { fmtInt, fmtNum } from "@/lib/format";

interface SupplierRow {
  fornecedor: string;
  atas: number;
  itens: number;
  concentracao: number;
  analise: string | null;
}

export function FornecedoresAnalise({ fornecedores }: { fornecedores: SupplierRow[] }) {
  const total = fornecedores.find((row) => /^(TOTAL|TOTAL GERAL)$/i.test(row.fornecedor));
  const outros = fornecedores.find((row) => row.fornecedor.toUpperCase() === "OUTROS FORNECEDORES");
  const principais = fornecedores.filter(
    (row) => !/^(TOTAL|TOTAL GERAL)$/i.test(row.fornecedor)
      && row.fornecedor.toUpperCase() !== "OUTROS FORNECEDORES",
  );
  const primeiro = principais[0];
  const topFour = principais.slice(0, 4);
  const concentration = topFour.reduce((sum, row) => sum + (row.concentracao || 0), 0);

  return (
    <aside
      className="mt-4 overflow-hidden rounded-2xl border border-accent-200 bg-accent-50"
      aria-label="Análise automática de fornecedores"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-accent-200 px-4 py-3">
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-accent-700">Análise automática</h4>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
            Leitura resumida da tabela FORNECEDORES GERAL, sem substituir os valores da fonte.
          </p>
        </div>
        {total && (
          <div className="rounded-lg bg-white/70 px-3 py-2 text-right">
            <p className="tnum text-[15px] font-bold text-navy-900">{fmtInt(total.itens)} itens</p>
            <p className="tnum text-[11.5px] text-ink-soft">{fmtInt(total.atas)} atas no total</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Maior concentração</p>
          {primeiro ? (
            <>
              <p className="mt-1 truncate text-[13px] font-bold text-navy-950" title={primeiro.fornecedor}>{primeiro.fornecedor}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink">
                {fmtNum(primeiro.concentracao)}% · {fmtInt(primeiro.itens)} itens
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Nenhum fornecedor principal reconhecido.</p>
          )}
        </article>

        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Quatro principais</p>
          {topFour.length > 0 ? (
            <p className="mt-1 text-[13px] font-bold text-navy-950">{fmtNum(concentration)}% dos itens</p>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Concentração não disponível.</p>
          )}
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
            Soma das linhas principais disponíveis na fonte.
          </p>
        </article>

        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Outros fornecedores</p>
          {outros ? (
            <>
              <p className="mt-1 text-[13px] font-bold text-navy-950">{fmtNum(outros.concentracao)}% dos itens</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                {fmtInt(outros.itens)} itens · {fmtInt(outros.atas)} atas
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Linha não localizada na fonte.</p>
          )}
        </article>
      </div>
    </aside>
  );
}
````

## `src/components/import-wizard.tsx`

````tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheckBig,
  Download,
  FileSpreadsheet,
  FileUp,
  Loader2,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader, SectionTitle } from "@/components/ui";
import {
  parseMultipleFiles,
  ParseError,
  MAX_FILE_MB,
  type SheetTable,
  type SourceSheet,
} from "@/lib/client-parse";
import {
  type DatasetKind,
  type DatasetNatureza,
  type ImportMode,
  type Issue,
  type ValidationResult,
} from "@/lib/domain";
import { buildCsv } from "@/lib/csv";
import { fmtCurrency, fmtInt, todayISO } from "@/lib/format";
import { notifyBaseUpdated } from "@/components/datasets-panel";
import { saveDataset } from "@/lib/static-store";
import {
  extractSnapshotPayload,
  hasSnapshotPayloadMeaningfulData,
  SNAPSHOT_BLOCK_KEYS,
  SNAPSHOT_BLOCKS,
  snapshotBlockLabel,
  type DashboardSnapshotPayload,
} from "@/lib/dashboard-snapshot";

/* ------------------------------------------------------------------ */

const STEPS = [
  { n: 1, label: "Arquivo" },
  { n: 2, label: "Tipo de base" },
  { n: 3, label: "Resumo automático" },
  { n: 4, label: "Revisão" },
  { n: 5, label: "Concluído" },
];

interface ValidateResponse {
  ok: boolean;
  erro?: string;
  resumo?: {
    validos: number;
    ignoradas: number;
    duplicadas: number;
    avisos: number;
    valorTotal: number;
    itensTotal: number;
    valorCobertura: number;
    itensCobertura: number;
    issuesAmostra: Issue[];
    issuesTotal: number;
  };
  snapshotCoverage?: { found: string[]; missing: string[] };
  snapshotMeaningful?: boolean;
  datasetId?: number;
}

function metricPair(atas: number | null, itens: number | null): string | null {
  const parts = [
    atas === null ? null : `${fmtInt(atas)} atas`,
    itens === null ? null : `${fmtInt(itens)} itens`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function snapshotBlockDetail(payload: DashboardSnapshotPayload, key: string): string | null {
  switch (key) {
    case "kpis-leitura":
      return metricPair(payload.kpis.concluidasAtas, payload.kpis.concluidasItens)
        ?? metricPair(payload.kpis.andamentoAtas, payload.kpis.andamentoItens);
    case "valores-por-area": {
      const count = Object.values(payload.valueAreas).filter((area) => area.valor !== null).length;
      return count ? `${fmtInt(count)} áreas com valor reconhecido` : null;
    }
    case "saving": {
      const value = payload.savingTotal.valorSaving ?? payload.savingTotal.savingHist ?? payload.savingTotal.savingProp;
      return value === null ? null : `Saving ${fmtCurrency(value)}`;
    }
    case "top-compradores": {
      const count = Object.values(payload.topCompradores).reduce((sum, area) => sum + area.buyers.length, 0);
      return count ? `${fmtInt(count)} compradores listados` : null;
    }
    case "fornecedores": {
      const count = payload.fornecedoresGeral.length
        || Object.values(payload.fornecedores).reduce((sum, area) => sum + area.length, 0);
      return count ? `${fmtInt(count)} fornecedores listados` : null;
    }
    case "evolucao": {
      const count = Object.values(payload.evolucao).filter((area) =>
        Object.values(area).some((value) => value !== null),
      ).length;
      return count ? `${fmtInt(count)} áreas reconhecidas` : null;
    }
    case "previsao-faixas": {
      const count = Object.values(payload.previsoes).reduce(
        (sum, band) => sum + Object.values(band).filter((area) => area.atas !== null || area.itens !== null).length,
        0,
      );
      return count ? `${fmtInt(count)} faixas com dados` : null;
    }
    case "previsao-meses": {
      const count = Object.values(payload.previsaoMeses).reduce((sum, area) => sum + area.rows.length, 0);
      return count ? `${fmtInt(count)} linhas mensais` : null;
    }
    case "previsoes-cruzadas": {
      const count = Object.values(payload.previsoes).reduce(
        (sum, band) => sum + Object.values(band).reduce((areaSum, area) => areaSum + area.buyers.length, 0),
        0,
      );
      return count ? `${fmtInt(count)} compradores com previsão` : null;
    }
    case "atas-concluidas":
      return payload.atasConcluidas.length ? `${fmtInt(payload.atasConcluidas.length)} atas finalizadas` : null;
    case "contratos-fornecedores": {
      const count = Object.keys(payload.fornecedoresPorContrato).length;
      return count ? `${fmtInt(count)} contratos relacionados` : null;
    }
    case "status-atas": {
      const count = Object.values(payload.statusAtas).filter(Boolean).length;
      return count ? `${fmtInt(count)} áreas reconhecidas` : null;
    }
    default:
      return null;
  }
}

export function ImportWizard() {
  const [step, setStep] = useState(1);

  // A tabela combinada é mantida apenas para metadados e para preservar o
  // tamanho original da leitura. Os dados do Giro são extraídos pelas abas
  // nomeadas, sem mapeamento manual de colunas operacionais.
  const [combinedInfo, setCombinedInfo] = useState<{
    names: string[];
    filesCount: number;
    sheetsCount: number;
    combinedTable: SheetTable;
    sourceSheets: SourceSheet[];
  } | null>(null);

  const [parseErro, setParseErro] = useState<{ msg: string; code: string } | null>(null);
  const [lendo, setLendo] = useState(false);
  const [dragAtivo, setDragAtivo] = useState(false);

  // Mantidos como metadados compatíveis com o IndexedDB. Não são decisões
  // expostas ao usuário: a leitura consolidada é sempre um snapshot automático.
  const kind: DatasetKind = "outro";
  const natureza: DatasetNatureza = "snapshot";
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [referenceDate, setReferenceDate] = useState(todayISO());

  const [validacao, setValidacao] = useState<ValidateResponse | null>(null);
  const [resultadoValidacao, setResultadoValidacao] = useState<ValidationResult | null>(null);
  const [resultadoSnapshot, setResultadoSnapshot] = useState<DashboardSnapshotPayload | null>(null);
  const [validando, setValidando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroEtapa, setErroEtapa] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const announce = useCallback((msg: string) => {
    if (liveRef.current) liveRef.current.textContent = "";
    setTimeout(() => {
      if (liveRef.current) liveRef.current.textContent = msg;
    }, 60);
  }, []);

  /* ---------------- Leitura do arquivo ---------------- */

  const processarArquivos = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      if (files.length > 2) {
        setParseErro({ msg: "Selecione no máximo duas planilhas por lote. Faça uma nova importação para outros arquivos.", code: "estrutura" });
        announce("São permitidos no máximo dois arquivos por lote.");
        return;
      }
      setLendo(true);
      setParseErro(null);
      setValidacao(null);
      setResultadoValidacao(null);
      setResultadoSnapshot(null);
      setErroEtapa(null);
      try {
        const info = await parseMultipleFiles(files);
        setCombinedInfo(info);
        announce(`${info.filesCount} arquivos lidos com sucesso. ${info.sheetsCount} abas processadas.`);
      } catch (e) {
        setCombinedInfo(null);
        const pe = e instanceof ParseError ? e : null;
        setParseErro({ msg: pe?.message ?? "Falha inesperada ao ler os arquivos.", code: pe?.code ?? "estrutura" });
        announce("Não foi possível ler os arquivos.");
      } finally {
        setLendo(false);
      }
    },
    [announce],
  );

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragAtivo(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) processarArquivos(files);
  }

  const table: SheetTable | null = combinedInfo?.combinedTable ?? null;

  /* ---------------- Snapshot automático ---------------- */

  const snapshotPreview = useMemo(
    () => combinedInfo
      ? extractSnapshotPayload(combinedInfo.sourceSheets, {
          fileNames: combinedInfo.names,
          referenceDate: referenceDate || null,
        })
      : null,
    [combinedInfo, referenceDate],
  );
  const snapshotMeaningful = hasSnapshotPayloadMeaningfulData(snapshotPreview);
  const canValidate = Boolean(snapshotMeaningful);
  const recognizedBlocks = snapshotPreview?.coverage.found ?? [];
  const missingBlocks = snapshotPreview?.coverage.missing ?? [];

  function resumoDaValidacao(result: ValidationResult) {
    return {
      validos: result.records.length,
      ignoradas: result.skipped,
      duplicadas: result.duplicates,
      avisos: result.warnings,
      valorTotal: result.records.reduce((sum, row) => sum + (row.valor ?? 0), 0),
      itensTotal: result.records.reduce((sum, row) => sum + (row.quantidade ?? 0), 0),
      valorCobertura: result.records.filter((row) => row.valor !== null).length,
      itensCobertura: result.records.filter((row) => row.quantidade !== null).length,
      issuesAmostra: result.issues.slice(0, 300),
      issuesTotal: result.issues.length,
    };
  }

  function validar() {
    if (!table || !combinedInfo) return;
    setValidando(true);
    setErroEtapa(null);
    try {
      const snapshot = extractSnapshotPayload(combinedInfo.sourceSheets, {
        fileNames: combinedInfo.names,
        referenceDate: referenceDate || null,
      });
      const meaningful = hasSnapshotPayloadMeaningfulData(snapshot);
      if (!meaningful) {
        throw new Error("Nenhum bloco consolidado das abas GIRO 01–07 foi reconhecido. Confira se a planilha contém os nomes exatos das abas e do layout esperado.");
      }
      // A importação consolidada não cria registros operacionais por inferência.
      // Linhas de processos permanecem zero quando a fonte traz somente o snapshot.
      const result: ValidationResult = { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
      setResultadoValidacao(result);
      setResultadoSnapshot(snapshot);
      const resumo = resumoDaValidacao(result);
      setValidacao({
        ok: true,
        resumo,
        snapshotCoverage: snapshot.coverage,
        snapshotMeaningful: meaningful,
      });
      setStep(4);
      announce(`Validação concluída: ${snapshot.coverage.found.length.toLocaleString("pt-BR")} blocos específicos reconhecidos.`);
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao validar os dados.");
      announce("Falha na validação.");
    } finally {
      setValidando(false);
    }
  }

  async function confirmar() {
    if (!combinedInfo || !table || !resultadoValidacao) return;
    const meaningfulSnapshot = hasSnapshotPayloadMeaningfulData(resultadoSnapshot);
    if (!meaningfulSnapshot) return;
    setConfirmando(true);
    setErroEtapa(null);
    try {
      const dataset = await saveDataset({
        kind,
        natureza,
        fileName: combinedInfo.names.join(", ").slice(0, 290),
        sheetName: `${combinedInfo.sheetsCount} abas processadas`,
        referenceDate: referenceDate || null,
        importMode,
        rowCount: table.totalRows,
        result: resultadoValidacao,
        snapshot: resultadoSnapshot,
      });
      setValidacao((current) => current ? { ...current, datasetId: dataset.id } : current);
      setStep(5);
      notifyBaseUpdated();
      announce(`Importação concluída. ${meaningfulSnapshot ? "Leitura automática do painel" : "Nenhum snapshot"} salva neste navegador.`);
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao salvar a importação neste navegador.");
      announce("Falha na importação.");
    } finally {
      setConfirmando(false);
    }
  }

  function baixarRelatorio() {
    if (!table) return;
    const result = resultadoValidacao ?? { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
    const csv = buildCsv(
      ["Linha na planilha", "Coluna", "Tipo", "Ocorrência"],
      result.issues.map((i) => [i.row, i.column, i.severity === "error" ? "linha ignorada" : "aviso", i.message]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-importacao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function recomeçar() {
    setStep(1);
    setCombinedInfo(null);
    setParseErro(null);
    setValidacao(null);
    setResultadoValidacao(null);
    setResultadoSnapshot(null);
    setErroEtapa(null);
    setImportMode("replace");
    setReferenceDate(todayISO());
    if (inputFileRef.current) inputFileRef.current.value = "";
  }

  /* ================================ RENDER */

  return (
    <>
      <PageHeader
        overline="Dados"
        title="Importar planilha"
        description={`Leia arquivos .xlsx, .xls ou .csv de até ${MAX_FILE_MB} MB. A leitura das abas GIRO é automática e o arquivo permanece no seu navegador após a confirmação.`}
      />

      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

      <nav aria-label="Etapas da importação" className="mb-6" data-no-print>
        <ol className="flex flex-wrap items-center gap-y-2">
          {STEPS.map((s, i) => {
            const estado = s.n < step ? "concluido" : s.n === step ? "atual" : "futuro";
            return (
              <li key={s.n} className="flex items-center">
                <span
                  aria-current={estado === "atual" ? "step" : undefined}
                  className={clsx(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
                    estado === "atual" && "bg-navy-900 text-white",
                    estado === "concluido" && "bg-ok-100 text-ok-700",
                    estado === "futuro" && "text-neutral-500",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold",
                      estado === "atual" && "bg-accent-500 text-white",
                      estado === "concluido" && "bg-ok-600 text-white",
                      estado === "futuro" && "bg-neutral-100 text-neutral-500",
                    )}
                  >
                    {estado === "concluido" ? <CircleCheckBig size={12} /> : s.n}
                  </span>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <span aria-hidden="true" className="mx-1.5 h-px w-5 bg-line sm:w-8" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Etapa {step} de 5 — {STEPS[step - 1].label}
      </h2>

      {/* =============== ETAPA 1: ARQUIVO =============== */}
      {step === 1 && (
        <section aria-label="Escolha do arquivo" className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragAtivo(true);
            }}
            onDragLeave={() => setDragAtivo(false)}
            onDrop={onDrop}
            className={clsx(
              "card flex flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-14 text-center transition-colors sm:py-20",
              dragAtivo ? "border-accent-500 bg-accent-50" : "border-navy-200 bg-navy-50/40",
            )}
          >
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-2xl bg-surface text-navy-600 shadow-[var(--shadow-card)]">
              {lendo ? <Loader2 size={30} className="animate-spin" /> : <FileUp size={30} />}
            </span>
            <p className="font-display text-[18px] font-bold text-navy-950">
              {lendo ? "Lendo arquivos…" : "Arraste as planilhas para cá (até 2)"}
            </p>
            <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
              Todas as abas nomeadas do Giro serão lidas e resumidas automaticamente.
              Formatos aceitos: <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong>.
            </p>
            <button
              type="button"
              onClick={() => inputFileRef.current?.click()}
              disabled={lendo}
              className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
            >
              <FileSpreadsheet size={17} aria-hidden="true" />
              Selecionar arquivos
            </button>
            <input
              ref={inputFileRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              aria-label="Selecionar arquivos Excel ou CSV"
              onChange={(e) => {
                const f = Array.from(e.target.files || []);
                if (f.length > 0) processarArquivos(f);
              }}
            />
          </div>

          {parseErro && (
            <div className="card flex items-start gap-3 border-danger-600/30 bg-danger-100/40 p-5" role="alert">
              <CircleAlert size={20} className="mt-0.5 shrink-0 text-danger-700" aria-hidden="true" />
              <div>
                <p className="text-[14.5px] font-bold text-danger-700">Não foi possível usar os arquivos</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-danger-700/90">{parseErro.msg}</p>
              </div>
            </div>
          )}

          {combinedInfo && (
            <div className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-ok-100 text-ok-700">
                    <FileSpreadsheet size={20} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-navy-950">{combinedInfo.filesCount} {combinedInfo.filesCount === 1 ? "arquivo selecionado" : "arquivos selecionados"}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">{combinedInfo.names.join(", ")}</p>
                    <p className="mt-1 text-[12.5px] font-medium text-navy-600">
                      {fmtInt(combinedInfo.combinedTable.totalRows)} linhas identificadas em {combinedInfo.sheetsCount} abas válidas.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={recomeçar}
                  className="min-h-9 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-navy-800 hover:bg-navy-50"
                >
                  Trocar arquivos
                </button>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
                >
                  Continuar
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =============== ETAPA 2: TIPO DE BASE =============== */}
      {step === 2 && combinedInfo && (
        <section aria-label="Tipo de base" className="space-y-5">
          <div className="card border-navy-200 bg-navy-50/60 p-5">
            <p className="text-[14px] font-bold text-navy-950">Snapshot consolidado do Giro</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              A leitura das abas consolidadas é automática. Área, natureza e campos operacionais não são escolhidos nesta importação.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset className="card p-5">
              <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Como tratar a base
              </legend>
              <div className="mt-3 space-y-2">
                <RadioCard
                  name="modo"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  title="Substituir"
                  desc="Usa esta leitura como a base atual e mantém a anterior no histórico local."
                />
                <RadioCard
                  name="modo"
                  checked={importMode === "combine"}
                  onChange={() => setImportMode("combine")}
                  title="Combinar"
                  desc="Mantém a leitura ativa e adiciona esta importação como outra base local."
                />
              </div>
            </fieldset>

            <div className="card p-5">
              <label htmlFor="ref-date" className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Data de referência
              </label>
              <input
                id="ref-date"
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="mt-2.5 min-h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14px] text-ink"
                aria-describedby="ref-hint"
              />
              <p id="ref-hint" className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
                Identifica a leitura no panorama e no histórico local. O cálculo de vencidos e a vencer usa a data atual do sistema.
              </p>
            </div>
          </div>

          <WizardNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Ver resumo automático"
          />
        </section>
      )}

      {/* =============== ETAPA 3: RESUMO AUTOMÁTICO =============== */}
      {step === 3 && combinedInfo && snapshotPreview && (
        <section aria-label="Resumo automático do snapshot" className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-accent-700">Leitura automática</p>
                <h3 className="mt-1 text-[18px] font-bold text-navy-950">Resumo do snapshot reconhecido</h3>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
                  Os blocos abaixo foram procurados pelos nomes exatos das abas e tabelas. Nenhuma coluna operacional precisa ser associada manualmente.
                </p>
              </div>
              <div className="rounded-xl bg-navy-50 px-4 py-3 text-right">
                <p className="tnum text-[23px] font-bold text-navy-900">{fmtInt(recognizedBlocks.length)}</p>
                <p className="text-[11.5px] font-semibold text-ink-soft">blocos reconhecidos</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Referência" value={referenceDate ? referenceDate.split("-").reverse().join("/") : "—"} tone="navy" />
            <Stat label="Abas processadas" value={fmtInt(combinedInfo.sheetsCount)} tone="neutral" />
            <Stat label="Linhas lidas" value={fmtInt(combinedInfo.combinedTable.totalRows)} tone="neutral" />
            <Stat label="Fonte" value="Snapshot" tone="ok" />
          </div>

          {snapshotMeaningful && (
            <div className="card p-5">
              <SectionTitle title="Indicadores identificados" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Concluídas", metricPair(snapshotPreview.kpis.concluidasAtas, snapshotPreview.kpis.concluidasItens)],
                  ["Em andamento", metricPair(snapshotPreview.kpis.andamentoAtas, snapshotPreview.kpis.andamentoItens)],
                  ["A vencer", metricPair(snapshotPreview.kpis.aVencerAtas, snapshotPreview.kpis.aVencerItens)],
                  ["Vencidas", metricPair(snapshotPreview.kpis.vencidasAtas, snapshotPreview.kpis.vencidasItens)],
                ].map(([label, value]) => value ? (
                  <div key={label} className="rounded-xl border border-line bg-surface px-3.5 py-3">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">{label}</p>
                    <p className="mt-1 text-[13.5px] font-semibold text-navy-900">{value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <SectionTitle title="Blocos da leitura" />
              <p className="mt-1 text-[12.5px] text-ink-soft">
                Reconhecidos: {fmtInt(recognizedBlocks.length)} de {fmtInt(SNAPSHOT_BLOCK_KEYS.length)} blocos esperados.
              </p>
            </div>
            <ul className="grid gap-2 p-4 sm:grid-cols-2">
              {SNAPSHOT_BLOCK_KEYS.map((key) => {
                const found = recognizedBlocks.includes(key);
                const detail = found ? snapshotBlockDetail(snapshotPreview, key) : null;
                return (
                  <li
                    key={key}
                    className={clsx(
                      "rounded-xl border px-3.5 py-3",
                      found ? "border-ok-600/25 bg-ok-100/50" : "border-line bg-neutral-50/70",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={clsx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold", found ? "bg-ok-600 text-white" : "bg-neutral-200 text-neutral-600")} aria-hidden="true">
                        {found ? "✓" : "—"}
                      </span>
                      <div className="min-w-0">
                        <p className={clsx("text-[13px] font-bold", found ? "text-ok-700" : "text-ink-soft")}>{snapshotBlockLabel(key)}</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">
                          {found ? (detail ?? "Bloco reconhecido; sem métrica resumida disponível.") : SNAPSHOT_BLOCKS[key].esperado}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {missingBlocks.length > 0 && (
            <div className="card flex items-start gap-2.5 border-warn-600/30 bg-warn-100/50 p-4 text-[13px] leading-relaxed text-warn-700" role="status">
              <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>
                {fmtInt(missingBlocks.length)} bloco(s) não foram encontrado(s). Eles permanecem ausentes, sem preenchimento artificial; os blocos reconhecidos serão importados normalmente.
              </p>
            </div>
          )}

          {!canValidate && (
            <div className="card flex items-start gap-2.5 border-danger-600/30 bg-danger-100/40 p-4 text-[13px] leading-relaxed text-danger-700" role="alert">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Nenhum bloco reconhecido. Volte ao arquivo e confirme as abas GIRO 01–07 e os nomes exatos do layout.
            </div>
          )}

          <WizardNav
            onBack={() => setStep(2)}
            onNext={validar}
            nextLabel={validando ? "Validando…" : "Validar snapshot"}
            nextDisabled={!canValidate || validando}
            nextBusy={validando}
          />
          {erroEtapa && (
            <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
              {erroEtapa}
            </p>
          )}
        </section>
      )}

      {/* =============== ETAPA 4: REVISÃO =============== */}
      {step === 4 && combinedInfo && validacao?.resumo && (
        <section aria-label="Revisão da importação" className="space-y-4">
          {(() => {
            const snapshotOnly = Boolean(validacao.snapshotMeaningful && validacao.resumo.validos === 0);
            return (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <Stat label="Blocos reconhecidos" value={fmtInt(validacao.snapshotCoverage?.found.length ?? 0)} tone="ok" />
                  <Stat label="Linhas operacionais" value={fmtInt(validacao.resumo.validos)} tone="neutral" />
                  <Stat label="Linhas ignoradas" value={fmtInt(validacao.resumo.ignoradas)} tone={validacao.resumo.ignoradas > 0 ? "warn" : "neutral"} />
                  <Stat label="Avisos" value={fmtInt(validacao.resumo.avisos)} tone={validacao.resumo.avisos > 0 ? "navy" : "neutral"} />
                </div>

                <div className="card p-5">
                  <SectionTitle title="Resumo do que será importado" />
                  <dl className="grid gap-x-8 gap-y-3 text-[13.5px] sm:grid-cols-2">
                    <ResumoItem label="Arquivos">{combinedInfo.names.join(", ")} ({combinedInfo.sheetsCount} abas)</ResumoItem>
                    <ResumoItem label="Tipo de leitura">Snapshot consolidado · leitura automática</ResumoItem>
                    <ResumoItem label="Modo">{importMode === "replace" ? "Substituir a leitura ativa (a anterior vai para o histórico)" : "Combinar com as bases ativas"}</ResumoItem>
                    <ResumoItem label="Data de referência">{referenceDate ? referenceDate.split("-").reverse().join("/") : "—"}</ResumoItem>
                    <ResumoItem label="Blocos específicos">
                      {fmtInt(validacao.snapshotCoverage?.found.length ?? 0)} reconhecidos
                      {validacao.snapshotCoverage?.found.length ? <span className="text-ink-soft"> · {validacao.snapshotCoverage.found.map(snapshotBlockLabel).join(", ")}</span> : null}
                    </ResumoItem>
                    <ResumoItem label="Linhas operacionais">
                      {snapshotOnly ? "Nenhuma — a fonte contém somente o snapshot automático" : fmtInt(validacao.resumo.validos)}
                    </ResumoItem>
                    <ResumoItem label="Histórico local">Preservado no IndexedDB deste navegador</ResumoItem>
                  </dl>
                </div>

                {validacao.resumo.issuesTotal > 0 ? (
                  <div className="card overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                      <div>
                        <h3 className="text-[14.5px] font-bold text-navy-950">Ocorrências encontradas na validação</h3>
                        <p className="mt-0.5 text-[12.5px] text-ink-soft">
                          Mostrando {fmtInt(Math.min(validacao.resumo.issuesAmostra.length, 60))} de {fmtInt(validacao.resumo.issuesTotal)}. Baixe o relatório para ver todas.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={baixarRelatorio}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                      >
                        <Download size={15} aria-hidden="true" />
                        Relatório completo (CSV)
                      </button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      <table className="w-full text-[13px]">
                        <caption className="sr-only">Ocorrências de validação (amostra)</caption>
                        <thead className="sticky top-0 bg-navy-50">
                          <tr className="border-b border-line text-left">
                            <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Linha</th>
                            <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Tipo</th>
                            <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Coluna</th>
                            <th scope="col" className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">Ocorrência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validacao.resumo.issuesAmostra.slice(0, 60).map((issue, index) => (
                            <tr key={index} className="border-b border-line/60 last:border-0">
                              <td className="tnum px-4 py-2.5 font-semibold text-ink">{fmtInt(issue.row)}</td>
                              <td className="px-4 py-2.5">
                                <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", issue.severity === "error" ? "bg-danger-100 text-danger-700" : "bg-warn-100 text-warn-700")}>
                                  <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-full", issue.severity === "error" ? "bg-danger-600" : "bg-warn-600")} />
                                  {issue.severity === "error" ? "linha ignorada" : "aviso — linha mantida"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-medium text-ink">{issue.column}</td>
                              <td className="px-4 py-2.5 leading-snug text-ink">{issue.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="card flex items-start gap-3 border-ok-600/30 bg-ok-100/60 p-5" role="status">
                    <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ok-700" aria-hidden="true" />
                    <p className="text-[13.5px] leading-relaxed text-ok-700">
                      {snapshotOnly
                        ? "Nenhuma linha operacional foi criada: esta leitura será salva somente como snapshot, sem inventar processos ou rateios."
                        : "Nenhuma ocorrência na validação."}
                    </p>
                  </div>
                )}

                {erroEtapa && (
                  <p className="card border-danger-600/30 bg-danger-100/40 p-4 text-[13px] font-semibold text-danger-700" role="alert">
                    {erroEtapa}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    Voltar ao resumo
                  </button>
                  <button
                    type="button"
                    onClick={confirmar}
                    disabled={confirmando || !validacao.snapshotMeaningful}
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-6 text-[14.5px] font-bold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-describedby="confirm-hint"
                  >
                    {confirmando ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
                    {confirmando ? "Importando…" : "Confirmar importação do snapshot"}
                  </button>
                </div>
                <p id="confirm-hint" className="text-right text-[12px] text-ink-soft">
                  {importMode === "replace"
                    ? "A leitura ativa será substituída e a anterior continuará disponível no histórico."
                    : "A nova leitura será combinada com as bases locais ativas."}{" "}
                  A gravação local é atômica: ou o dataset é salvo completo, ou nada é alterado.
                </p>
              </>
            );
          })()}
        </section>
      )}

      {/* =============== ETAPA 5: SUCESSO =============== */}
      {step === 5 && validacao?.resumo && (
        <section aria-label="Importação concluída">
          <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center sm:py-16" role="status">
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-ok-100 text-ok-700">
              <CircleCheckBig size={32} />
            </span>
            <h2 className="font-display text-[22px] font-bold text-navy-950">Importação concluída</h2>
            <p className="max-w-lg text-[14px] leading-relaxed text-ink-soft">
              O snapshot automático de <strong className="tnum text-ink">{fmtInt(validacao.snapshotCoverage?.found.length ?? 0)}</strong> blocos foi salvo localmente.
              Nenhuma linha operacional foi criada por inferência; dados ausentes continuam ausentes.
              {validacao.resumo.ignoradas > 0 && (
                <>
                  {" "}<strong className="tnum text-ink">{fmtInt(validacao.resumo.ignoradas)}</strong> linhas foram ignoradas e estão listadas no relatório.
                </>
              )}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700"
              >
                Ver panorama atualizado
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/processos"
                className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface px-5 text-[14px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                Pesquisar processos
              </Link>
              <button
                type="button"
                onClick={recomeçar}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-[14px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                <FileUp size={16} aria-hidden="true" />
                Importar outro arquivo
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function WizardNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextBusy = false,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  nextBusy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Voltar
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextBusy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {nextLabel}
        {!nextBusy && <ArrowRight size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}

function RadioCard({
  name, checked, onChange, title, desc,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={clsx(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
        checked ? "border-navy-500 bg-navy-50" : "border-line hover:border-navy-300",
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-[#c95a12]" />
      <span>
        <span className="block text-[14px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-soft">{desc}</span>
      </span>
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "neutral" | "navy" }) {
  return (
    <div className="card p-4">
      <p
        className={clsx(
          "tnum font-display text-[24px] font-bold tracking-tight sm:text-[28px]",
          tone === "ok" && "text-ok-700",
          tone === "warn" && "text-warn-700",
          tone === "navy" && "text-navy-700",
          tone === "neutral" && "text-navy-950",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-soft">{label}</p>
    </div>
  );
}

function ResumoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">{label}</dt>
      <dd className="text-[13.5px] font-medium text-ink">{children}</dd>
    </div>
  );
}
````

## `src/components/processos-browser.tsx`

````tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CircleAlert, Download, ExternalLink, FileStack,
  FunnelX, Printer, Search, X,
} from "lucide-react";
import clsx from "clsx";
import { AreaTag, PageHeader, StatusBadge, situacaoChave } from "@/components/ui";
import { KIND_LABEL, SITUACAO_LABEL, normText, type SituacaoChave } from "@/lib/domain";
import { fmtCurrency, fmtDate, fmtDateTime, fmtInt, prazoRelativo } from "@/lib/format";
import { buildCsv } from "@/lib/csv";
import { listActiveProcessRows, STATIC_DATA_EVENT } from "@/lib/static-store";

/* ------------------------------------------------------------------ */

interface Row {
  id: string | number;
  dataset_id: number;
  area: string | null;
  numero: string;
  objeto: string;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacao_fonte: string | null;
  situacao_norm: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade: number | null;
  valor: number | null;
  status_consumo: string | null;
  saving_hist: number | null;
  saving_prop: number | null;
  status_renovacao: string | null;
  data_previsao: string | null;
  observacao: string | null;
  link: string | null;
  source_row: number | null;
  extra: Record<string, string> | null;
  dias: number | null;
  situacao: SituacaoChave;
  file_name: string;
  kind: string;
  natureza: string;
  reference_date: string | null;
  imported_at: string;
}

interface Facets {
  areas: { area: string; total: number }[];
  etapas: { etapa: string; total: number }[];
  naturezas: { natureza: string; total: number }[];
}

const SORTS = [
  { key: "data_fim", label: "Prazo / vigência" },
  { key: "numero", label: "Nº do processo" },
  { key: "objeto", label: "Objeto" },
  { key: "area", label: "Área" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "responsavel", label: "Responsável" },
  { key: "etapa", label: "Etapa" },
  { key: "situacao", label: "Situação de prazo" },
  { key: "valor", label: "Valor estimado" },
  { key: "quantidade", label: "Qtd. de itens" },
];

const SITUACOES: { key: string; label: string }[] = [
  { key: "todas", label: "Todas as situações" },
  { key: "vencido", label: "Vencido" },
  { key: "a_vencer", label: "A vencer (30 dias)" },
  { key: "em_dia", label: "No prazo" },
  { key: "sem_data", label: "Sem data de prazo" },
  { key: "concluido", label: "Concluído" },
  { key: "cancelado", label: "Cancelado" },
];

/* ------------------------------------------------------------------ */

export function ProcessosBrowser() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [qDebounced, setQDebounced] = useState(q);
  const [area, setArea] = useState(sp.get("area") ?? "todas");
  const [natureza, setNatureza] = useState(sp.get("natureza") ?? "todas");
  const [situacao, setSituacao] = useState(sp.get("situacao") ?? "todas");
  const [etapa, setEtapa] = useState(sp.get("etapa") ?? "todas");
  const [sort, setSort] = useState(sp.get("sort") ?? "data_fim");
  const [dir, setDir] = useState<"asc" | "desc">(sp.get("dir") === "desc" ? "desc" : "asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [allRows, setAllRows] = useState<Row[] | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<Row | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listActiveProcessRows();
      setAllRows(data);
      const areaCount = new Map<string, number>();
      const etapaCount = new Map<string, number>();
      const naturezaCount = new Map<string, number>();
      for (const row of data) {
        const rowArea = row.area ?? "Não informado";
        areaCount.set(rowArea, (areaCount.get(rowArea) ?? 0) + 1);
        if (row.etapa) etapaCount.set(row.etapa, (etapaCount.get(row.etapa) ?? 0) + 1);
        if (row.natureza) naturezaCount.set(row.natureza, (naturezaCount.get(row.natureza) ?? 0) + 1);
      }
      setFacets({
        areas: [...areaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([area, total]) => ({ area, total })),
        etapas: [...etapaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([etapa, total]) => ({ etapa, total })),
        naturezas: [...naturezaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([natureza, total]) => ({ natureza, total })),
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar processos locais.");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    const onUpdate = () => carregar();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
  }, [carregar]);

  const filteredRows = useMemo(() => {
    if (!allRows) return [];
    const query = normText(qDebounced);
    const filtered = allRows.filter((row) => {
      if (query) {
        const searchable = normText([
          row.numero, row.objeto, row.area, row.unidade, row.fornecedor, row.responsavel,
          row.etapa, row.situacao_fonte, row.status_consumo, row.status_renovacao,
          row.observacao, ...Object.values(row.extra ?? {}),
        ].filter(Boolean).join(" "));
        if (!searchable.includes(query)) return false;
      }
      if (area !== "todas" && (row.area ?? "Não informado") !== area) return false;
      if (natureza !== "todas" && row.natureza !== natureza) return false;
      if (situacao !== "todas" && row.situacao !== situacao) return false;
      if (etapa !== "todas" && row.etapa !== etapa) return false;
      return true;
    });

    const getSortValue = (row: Row): string | number => {
      if (sort === "situacao") return row.situacao;
      if (sort === "valor") return row.valor ?? Number.POSITIVE_INFINITY;
      if (sort === "quantidade") return row.quantidade ?? Number.POSITIVE_INFINITY;
      if (sort === "data_fim") return row.data_fim ?? "9999-12-31";
      return String(row[sort as keyof Row] ?? "");
    };
    filtered.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      const comparison = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), "pt-BR", { numeric: true, sensitivity: "base" });
      return dir === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [allRows, qDebounced, area, natureza, situacao, etapa, sort, dir]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activePage = Math.min(page, totalPages);
  const rows = useMemo(() => filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize), [filteredRows, activePage, pageSize]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (qDebounced) params.set("q", qDebounced);
    if (area !== "todas") params.set("area", area);
    if (natureza !== "todas") params.set("natureza", natureza);
    if (situacao !== "todas") params.set("situacao", situacao);
    if (etapa !== "todas") params.set("etapa", etapa);
    if (sort !== "data_fim") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (page > 1) params.set("page", String(page));
    const prefix = window.location.pathname.includes("/processos") ? window.location.pathname.split("/processos")[0] : "";
    const qs = params.toString();
    window.history.replaceState(null, "", `${prefix}/processos/${qs ? `?${qs}` : ""}`);
  }, [qDebounced, area, natureza, situacao, etapa, sort, dir, page]);

  const filtrosAtivos =
    (qDebounced ? 1 : 0) + (area !== "todas" ? 1 : 0) + (natureza !== "todas" ? 1 : 0) + (situacao !== "todas" ? 1 : 0) + (etapa !== "todas" ? 1 : 0);
  const semBase = !loading && allRows !== null && total === 0 && filtrosAtivos === 0;

  function limparFiltros() {
    setQ("");
    setArea("todas");
    setNatureza("todas");
    setSituacao("todas");
    setEtapa("todas");
    setPage(1);
  }

  function alternarOrdenacao(col: string) {
    if (sort === col) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setDir("asc");
    }
    setPage(1);
  }

  function exportar() {
    const max = 5000;
    const data = filteredRows.slice(0, max);
    const body = data.map((r) => [
      r.numero, r.objeto, r.area, r.unidade, r.fornecedor, r.responsavel, r.etapa,
      r.situacao_fonte, SITUACAO_LABEL[r.situacao], r.status_consumo ?? "",
      r.saving_hist ?? "", r.saving_prop ?? "", r.status_renovacao ?? "",
      r.data_previsao ? fmtDate(r.data_previsao) : "", r.data_inicio ? fmtDate(r.data_inicio) : "",
      r.data_fim ? fmtDate(r.data_fim) : "", r.quantidade ?? "", r.valor ?? "", r.observacao ?? "", r.link ?? "",
      r.file_name, r.imported_at ? fmtDateTime(r.imported_at) : "",
    ]);
    if (filteredRows.length > max) body.push([`AVISO: exportação limitada a ${max.toLocaleString("pt-BR")} linhas. Aplique mais filtros para exportar o restante.`]);
    const csv = buildCsv([
      "Nº processo", "Objeto", "Área", "Unidade", "Fornecedor", "Responsável", "Etapa", "Situação (fonte)",
      "Situação de prazo", "Status de Consumo", "Saving Histórico (R$)", "Saving Proposta (R$)", "Status Renovação",
      "Previsão", "Abertura", "Prazo/Vigência", "Qtd. itens", "Valor estimado (R$)", "Observações", "Link", "Arquivo de origem", "Importado em",
    ], body);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `giro-de-atas-processos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        overline="Consulta"
        title="Processos e atas"
        description="Pesquise em número, objeto, fornecedor, responsável, etapa, unidade e observações das bases ativas."
        actions={
          <>
            <a
              href="#exportar"
              onClick={(e) => { e.preventDefault(); exportar(); }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              title="Exporta o recorte filtrado completo (até 5.000 linhas) em CSV"
              data-no-print
            >
              <Download size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 sm:inline-flex"
              data-no-print
            >
              <Printer size={15} aria-hidden="true" />
              Imprimir
            </button>
          </>
        }
      />

      {/* Barra de filtros */}
      <section aria-label="Filtros" className="card mb-4 p-4" data-no-print>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_190px_170px]">
          <div className="relative">
            <label htmlFor="f-busca" className="sr-only">
              Pesquisar processos
            </label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="f-busca"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nº, objeto, fornecedor, responsável…"
              className="min-h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-9 text-[14px] text-ink placeholder:text-neutral-500 hover:border-navy-300"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-ink"
                aria-label="Limpar pesquisa"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <SelectFiltro
            id="f-area"
            label="Área"
            value={area}
            onChange={(v) => {
              setArea(v);
              setPage(1);
            }}
            options={[
              { key: "todas", label: "Todas as áreas" },
              ...(facets?.areas.map((a) => ({ key: a.area, label: `${a.area} (${a.total})` })) ?? [
                { key: "Indiretos", label: "Indiretos" },
                { key: "Diretos", label: "Diretos" },
                { key: "CAPEX", label: "CAPEX" },
              ]),
            ]}
          />
          <SelectFiltro
            id="f-natureza"
            label="Natureza"
            value={natureza}
            onChange={(v) => {
              setNatureza(v);
              setPage(1);
            }}
            options={[
              { key: "todas", label: "Todas as naturezas" },
              ...(facets?.naturezas.map((item) => ({
                key: item.natureza,
                label: `${item.natureza === "snapshot" ? "Snapshot" : "Operacional"} (${item.total})`,
              })) ?? [
                { key: "operacional", label: "Operacional" },
                { key: "snapshot", label: "Snapshot" },
              ]),
            ]}
          />
          <SelectFiltro
            id="f-situacao"
            label="Situação de prazo"
            value={situacao}
            onChange={(v) => {
              setSituacao(v);
              setPage(1);
            }}
            options={SITUACOES}
          />
          <SelectFiltro
            id="f-etapa"
            label="Etapa"
            value={etapa}
            onChange={(v) => {
              setEtapa(v);
              setPage(1);
            }}
            options={[
              { key: "todas", label: "Todas as etapas" },
              ...(facets?.etapas.map((e) => ({ key: e.etapa, label: `${e.etapa} (${e.total})` })) ?? []),
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {filtrosAtivos > 0 && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                <FunnelX size={14} aria-hidden="true" />
                Limpar filtros ({filtrosAtivos})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <label htmlFor="f-ordenar" className="font-medium sm:hidden">
              Ordenar por
            </label>
            <select
              id="f-ordenar"
              value={`${sort}:${dir}`}
              onChange={(e) => {
                const [s, d] = e.target.value.split(":");
                setSort(s);
                setDir(d as "asc" | "desc");
                setPage(1);
              }}
              className="min-h-9 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-medium text-ink sm:hidden"
            >
              {SORTS.map((s) => (
                <option key={`${s.key}:asc`} value={`${s.key}:asc`}>
                  {s.label} (crescente)
                </option>
              ))}
              {SORTS.map((s) => (
                <option key={`${s.key}:desc`} value={`${s.key}:desc`}>
                  {s.label} (decrescente)
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Contagem acessível */}
      <p aria-live="polite" role="status" className="mb-3 text-[13px] font-medium text-ink-soft">
        {loading
          ? "Carregando processos…"
          : erro
            ? "Erro ao carregar processos."
            : total === 0
              ? "Nenhum processo encontrado."
              : `${fmtInt(total)} ${total === 1 ? "processo encontrado" : "processos encontrados"}${filtrosAtivos > 0 ? " com os filtros ativos" : " nas bases ativas"}.`}
      </p>

      {/* Conteúdo */}
      {erro ? (
        <div className="card flex flex-col items-center gap-3 border-danger-600/30 p-10 text-center" role="alert">
          <CircleAlert size={28} className="text-danger-600" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold text-danger-700">{erro}</p>
          <button
            type="button"
            onClick={carregar}
            className="min-h-10 rounded-xl bg-navy-800 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : loading && rows === null ? (
        <div className="card space-y-2.5 p-4" aria-busy="true" aria-label="Carregando">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : semBase ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <FileStack size={30} className="text-navy-400" aria-hidden="true" />
          <h2 className="font-display text-[17px] font-bold text-navy-950">Nenhuma base ativa no momento</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            Importe uma planilha na página <a href="/importar" className="font-semibold text-navy-700 underline underline-offset-2">Importar</a> para
            pesquisar processos.
          </p>
        </div>
      ) : rows !== null && rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Search size={30} className="text-navy-400" aria-hidden="true" />
          <h2 className="font-display text-[17px] font-bold text-navy-950">Nenhum resultado para os filtros aplicados</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            Revise a grafia, remova filtros ou amplie a situação de prazo. A busca cobre número, objeto, fornecedor,
            responsável, etapa, unidade e observações.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-1 inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-navy-800 hover:bg-navy-50"
          >
            <FunnelX size={15} aria-hidden="true" />
            Limpar filtros
          </button>
        </div>
      ) : (
        rows && (
          <>
            {/* Tabela (desktop e tablet) */}
            <div className={clsx("card hidden overflow-hidden md:block", loading && "opacity-60")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-[13.5px]">
                  <caption className="sr-only">
                    Lista de processos das bases ativas{total > 0 ? ` — ${fmtInt(total)} resultados` : ""}
                  </caption>
                  <thead>
                    <tr className="border-b border-line bg-navy-50/60 text-left">
                      <Th col="numero" label="Nº processo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="objeto" label="Objeto" sort={sort} dir={dir} onSort={alternarOrdenacao} className="min-w-[220px]" />
                      <Th col="area" label="Área" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="responsavel" label="Responsável" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="data_fim" label="Prazo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="situacao" label="Situação" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="valor" label="Valor est." sort={sort} dir={dir} onSort={alternarOrdenacao} className="text-right" numeric />
                      <th scope="col" className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-navy-50/40">
                        <td className="px-3 py-3 align-top">
                          <span className="font-semibold text-navy-800">{r.numero}</span>
                          {r.etapa && <span className="mt-0.5 block text-[11.5px] text-ink-soft">{r.etapa}</span>}
                        </td>
                        <td className="max-w-[300px] px-3 py-3 align-top">
                          <span className="line-clamp-2 text-[13px] leading-snug text-ink" title={r.objeto}>
                            {r.objeto}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <AreaTag area={r.area} />
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-3 align-top text-ink" title={r.responsavel ?? ""}>
                          {r.responsavel ?? <span className="text-neutral-500">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top">
                          {r.data_fim ? (
                            <>
                              <span className="tnum font-medium text-ink">{fmtDate(r.data_fim)}</span>
                              {r.dias !== null && r.situacao !== "concluido" && r.situacao !== "cancelado" && (
                                <span
                                  className={clsx(
                                    "tnum mt-0.5 block text-[11.5px] font-semibold",
                                    r.dias < 0 ? "text-danger-700" : r.dias <= 30 ? "text-warn-700" : "text-ink-soft",
                                  )}
                                >
                                  {prazoRelativo(r.dias)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge situacao={situacaoChave(r.situacao)} />
                        </td>
                        <td className="tnum whitespace-nowrap px-3 py-3 text-right align-top font-semibold text-ink">
                          {r.valor !== null ? fmtCurrency(r.valor) : <span className="font-normal text-neutral-500">—</span>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => setDetalhe(r)}
                            className="min-h-9 rounded-lg border border-line px-3 text-[12px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                            aria-label={`Ver detalhes do processo ${r.numero}`}
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cartões (celular) */}
            <ul className={clsx("space-y-3 md:hidden", loading && "opacity-60")} aria-label="Lista de processos">
              {rows.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-800">{r.numero}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink">{r.objeto}</p>
                    </div>
                    <StatusBadge situacao={situacaoChave(r.situacao)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Área</dt>
                      <dd className="mt-0.5"><AreaTag area={r.area} /></dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Prazo</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">
                        {r.data_fim ? fmtDate(r.data_fim) : "—"}
                        {r.dias !== null && r.situacao !== "concluido" && r.situacao !== "cancelado" && (
                          <span className={clsx("ml-1 text-[11px]", r.dias < 0 ? "text-danger-700" : "text-ink-soft")}>
                            ({prazoRelativo(r.dias)})
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Responsável</dt>
                      <dd className="mt-0.5 text-ink">{r.responsavel ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Valor est.</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">{r.valor !== null ? fmtCurrency(r.valor) : "—"}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => setDetalhe(r)}
                    className="mt-3 min-h-10 w-full rounded-xl border border-line text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                    aria-label={`Ver detalhes do processo ${r.numero}`}
                  >
                    Ver detalhes
                  </button>
                </li>
              ))}
            </ul>

            {/* Paginação */}
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3"
              aria-label="Paginação dos resultados"
              data-no-print
            >
              <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                <label htmlFor="f-tamanho" className="font-medium">
                  Por página:
                </label>
                <select
                  id="f-tamanho"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="min-h-9 rounded-lg border border-line bg-surface px-2 font-semibold text-ink"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                  className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="tnum px-1 text-[13px] font-medium text-ink-soft">
                  Página {fmtInt(activePage)} de {fmtInt(totalPages)}
                </span>
                <button
                  type="button"
                  disabled={activePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                  className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </nav>
            <p className="mt-2 text-[12px] text-ink-soft" data-no-print>
              A exportação em CSV ignora a paginação e inclui todo o recorte filtrado (até 5.000 linhas, com aviso no
              arquivo se houver corte). A impressão reproduz esta tela.
            </p>
          </>
        )
      )}

      <DetalheDialog row={detalhe} onClose={() => setDetalhe(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Th({
  col,
  label,
  sort,
  dir,
  onSort,
  className,
  numeric = false,
}: {
  col: string;
  label: string;
  sort: string;
  dir: "asc" | "desc";
  onSort: (col: string) => void;
  className?: string;
  numeric?: boolean;
}) {
  const active = sort === col;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
      className={clsx("px-3 py-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className={clsx(
          "inline-flex min-h-8 items-center gap-1 rounded-md text-[11px] font-bold uppercase tracking-[0.08em] transition-colors",
          active ? "text-navy-800" : "text-ink-soft hover:text-navy-800",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp size={12} aria-hidden="true" />
          ) : (
            <ArrowDown size={12} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={12} aria-hidden="true" className="opacity-50" />
        )}
        <span className="sr-only">
          {active ? (dir === "asc" ? " (ordem crescente — clique para inverter)" : " (ordem decrescente — clique para inverter)") : " (clique para ordenar)"}
        </span>
      </button>
      {numeric && <span className="sr-only">valores monetários em reais</span>}
    </th>
  );
}

function SelectFiltro({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[13.5px] font-medium text-ink hover:border-navy-300"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diálogo de detalhes                                                  */
/* ------------------------------------------------------------------ */

function DetalheDialog({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (row && !el.open) {
      el.showModal();
      const closeBtn = el.querySelector<HTMLElement>("[data-close]");
      closeBtn?.focus();
    } else if (!row && el.open) {
      el.close();
    }
  }, [row]);

  if (!row) return <dialog ref={ref} className="hidden" aria-hidden="true" />;

  const extras = Object.entries(row.extra ?? {});

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[88dvh] w-[min(720px,94vw)] overflow-hidden rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)]"
      aria-labelledby="detalhe-titulo"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="overline mb-1">Processo {row.numero}</p>
          <h2 id="detalhe-titulo" className="font-display text-[17px] font-bold leading-snug text-navy-950">
            {row.objeto}
          </h2>
        </div>
        <button
          type="button"
          data-close
          onClick={() => ref.current?.close()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink transition-colors hover:bg-neutral-100/60"
          aria-label="Fechar detalhes"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[calc(88dvh-140px)] overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge situacao={situacaoChave(row.situacao)} />
          <AreaTag area={row.area} />
          {row.etapa && <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-semibold text-navy-700">Etapa: {row.etapa}</span>}
        </div>

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Prazo / vigência">
            {row.data_fim ? (
              <>
                <span className="tnum font-semibold">{fmtDate(row.data_fim)}</span>
                {row.dias !== null && row.situacao !== "concluido" && row.situacao !== "cancelado" && (
                  <span className={clsx("tnum ml-2 text-[12.5px]", row.dias < 0 ? "font-semibold text-danger-700" : "text-ink-soft")}>
                    ({prazoRelativo(row.dias)})
                  </span>
                )}
              </>
            ) : (
              "Não informado"
            )}
          </Field>
          <Field label="Abertura / publicação">{row.data_inicio ? fmtDate(row.data_inicio) : "Não informado"}</Field>
          <Field label="Situação declarada na fonte">{row.situacao_fonte ?? "Não informada"}</Field>
          <Field label="Situação de prazo (calculada hoje)">{SITUACAO_LABEL[situacaoChave(row.situacao)]}</Field>
          <Field label="Responsável">{row.responsavel ?? "Não informado"}</Field>
          <Field label="Fornecedor">{row.fornecedor ?? "Não informado"}</Field>
          <Field label="Unidade / solicitante">{row.unidade ?? "Não informada"}</Field>
          <Field label="Quantidade de itens">{row.quantidade !== null ? fmtInt(row.quantidade) : "Não informada"}</Field>
          <Field label="Valor estimado">
            <span className="tnum font-bold">{row.valor !== null ? fmtCurrency(row.valor) : "Não informado"}</span>
          </Field>
          <Field label="Status de Consumo">{row.status_consumo ?? "Não informado"}</Field>
          <Field label="Status Renovação">{row.status_renovacao ?? "Não informado"}</Field>
          <Field label="Previsão de Conclusão">{row.data_previsao ? fmtDate(row.data_previsao) : "Não informada"}</Field>
          <Field label="Saving Histórico">
            {row.saving_hist !== null ? fmtCurrency(row.saving_hist) : "Não informado"}
          </Field>
          <Field label="Saving Sob Proposta">
            {row.saving_prop !== null ? fmtCurrency(row.saving_prop) : "Não informado"}
          </Field>
          {row.link && (
            <Field label="Link">
              <a
                href={row.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-all font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900"
              >
                Abrir documento
                <ExternalLink size={13} aria-hidden="true" />
                <span className="sr-only">(abre em nova guia)</span>
              </a>
            </Field>
          )}
        </dl>

        <div className="mt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Observações</h3>
          <p className="mt-1.5 rounded-xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-ink">
            {row.observacao?.trim() ? row.observacao : "Nenhuma observação registrada na base."}
          </p>
        </div>

        {extras.length > 0 && (
          <details className="mt-5">
            <summary className="cursor-pointer rounded-md text-[13px] font-semibold text-navy-700 underline decoration-navy-300 underline-offset-2 hover:text-navy-900">
              Campos originais da planilha não mapeados ({extras.length})
            </summary>
            <dl className="mt-3 space-y-2 rounded-xl border border-line p-4 text-[13px]">
              {extras.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[180px_1fr]">
                  <dt className="font-semibold text-ink-soft">{k}</dt>
                  <dd className="break-words text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <div className="mt-5 rounded-xl border border-line bg-navy-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Origem deste registro</p>
          <p className="mt-0.5">
            Arquivo <strong className="text-ink">{row.file_name}</strong>
            {row.source_row ? ` · linha ${fmtInt(row.source_row)} da planilha` : ""} · base do tipo{" "}
            {KIND_LABEL[row.kind as keyof typeof KIND_LABEL] ?? row.kind} (
            {row.natureza === "snapshot" ? "snapshot semanal" : "base operacional"})
            {row.reference_date ? ` · referência ${fmtDate(row.reference_date)}` : ""} · importada em{" "}
            {fmtDateTime(row.imported_at)}.
          </p>
        </div>
      </div>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-[14px] leading-snug text-ink">{children}</dd>
    </div>
  );
}
````

## `src/components/resumo-cards.tsx`

````tsx
"use client";

import clsx from "clsx";
import { fmtInt } from "@/lib/format";

/**
 * Seis cards de resumo (espelho da página do SharePoint): uma linha para a
 * semana anterior e outra para a semana atual. Valores nulos aparecem como
 * “—” para não confundir “não lido” com zero.
 */
export type ResumoKpis = {
  concluidasAtas: number | null | undefined;
  concluidasItens: number | null | undefined;
  andamentoAtas: number | null | undefined;
  andamentoItens: number | null | undefined;
  saldoItens: number | null | undefined;
  consumidoItens: number | null | undefined;
  vencidasAtas: number | null | undefined;
  vencidasItens: number | null | undefined;
  aVencerAtas: number | null | undefined;
  aVencerItens: number | null | undefined;
};

type CardSpec = {
  titulo: string;
  cor: string;
  atas?: keyof ResumoKpis;
  itens: keyof ResumoKpis;
};

/* Cores dos valores iguais às dos cards do SharePoint. */
const CARDS: CardSpec[] = [
  { titulo: "ATA CONCLUÍDAS (VÁLIDAS)", cor: "#1e8e3e", atas: "concluidasAtas", itens: "concluidasItens" },
  { titulo: "ATAS EM ANDAMENTO", cor: "#1a56db", atas: "andamentoAtas", itens: "andamentoItens" },
  { titulo: "ITENS COM SALDO (VÁLIDOS)", cor: "#0e8c8c", itens: "saldoItens" },
  { titulo: "ITENS SEM SALDO (VÁLIDOS)", cor: "#e8870e", itens: "consumidoItens" },
  { titulo: "ATAS VENCIDAS", cor: "#d93025", atas: "vencidasAtas", itens: "vencidasItens" },
  { titulo: "ATAS A VENCER", cor: "#7a3fe0", atas: "aVencerAtas", itens: "aVencerItens" },
];

export function ResumoCards({
  titulo,
  status,
  kpis,
  tone,
}: {
  /** Ex.: “Resumo das Atas Concluídas”. */
  titulo: string;
  /** Ex.: “Status semana anterior 13/10”. */
  status: string;
  kpis: ResumoKpis;
  tone: "anterior" | "atual";
}) {
  const anterior = tone === "anterior";
  return (
    <div>
      <h3 className="mb-2 text-[15px] font-sans font-semibold leading-tight text-navy-900">
        {titulo}{" "}
        <span className={clsx("font-semibold", anterior ? "text-danger-700" : "text-ok-700")}>({status})</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((card) => {
          const atas = card.atas ? kpis[card.atas] : undefined;
          const itens = kpis[card.itens];
          return (
            <div
              key={card.titulo}
              className={clsx(
                "flex min-h-[112px] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center",
                anterior ? "border-[#f0b4b4] bg-[#f8d7d7]" : "border-[#d0d0d0] bg-[#e4e4e4]",
              )}
            >
              <p className="text-[11px] font-bold uppercase leading-tight text-navy-950">{card.titulo}</p>
              <div className="mt-2 space-y-0.5 text-[15px] font-extrabold leading-tight" style={{ color: card.cor }}>
                {card.atas && (
                  <p>
                    <span className="tabular-nums">{valor(atas)}</span> ATAS
                  </p>
                )}
                <p>
                  <span className="tabular-nums">{valor(itens)}</span> ITENS
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function valor(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : fmtInt(value);
}
````

## `src/components/status-atas.tsx`

````tsx
import { fmtDate, fmtInt } from "@/lib/format";
import { areaStyle } from "@/components/ui";
import type { SnapshotArea, SnapshotStatusAtasArea } from "@/lib/dashboard-snapshot";

const AREAS: SnapshotArea[] = ["INDIRETOS", "DIRETOS", "CAPEX"];

export function StatusAtas({
  areas,
  referencia,
}: {
  areas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
  referencia: string | null;
}) {
  return (
    <div className="space-y-6">
      {AREAS.map((area) => {
        const status = areas[area];
        const style = areaStyle(area);
        return (
          <div key={area} className="space-y-3">
            <div className={`w-full rounded-lg px-4 py-2 text-center text-[16px] font-bold uppercase tracking-wide ${style.band}`}>
              {area}
            </div>
            {status ? <StatusArea status={status} referencia={referencia} /> : (
              <div className="card border-dashed px-5 py-6 text-center text-[13px] text-ink-soft">
                <strong className="text-navy-900">{area}</strong> — bloco não encontrado na aba de status/renovações.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusArea({ status, referencia }: { status: SnapshotStatusAtasArea; referencia: string | null }) {
  const renovacoes = status.layout === "renovacoes"
    || status.totalRenovar !== null
    || status.emAndamento !== null;
  return renovacoes
    ? <StatusRenovacoesArea status={status} />
    : <StatusCarteiraArea status={status} referencia={referencia} />;
}

function StatusRenovacoesArea({ status }: { status: SnapshotStatusAtasArea }) {
  const totalRenovar = status.totalRenovar ?? status.total;
  const tiles = [
    { label: "TOTAL A RENOVAR", value: totalRenovar, tone: "bg-navy-50 border-navy-200 text-navy-800" },
    { label: "VENCIDAS", value: status.vencidas, tone: "bg-danger-100/70 border-danger-100 text-danger-700" },
    { label: "ATÉ 15 DIAS", value: status.ate15, tone: "bg-warn-100/70 border-warn-100 text-warn-700" },
    { label: "EM ANDAMENTO", value: status.emAndamento, tone: "bg-ok-100/70 border-ok-100 text-ok-700" },
  ];
  const base = status.baseDate;

  return (
    <section className="card overflow-hidden" aria-label={`Status de renovações — ${status.area}`}>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[20px] font-sans font-semibold leading-tight text-navy-900">
          {status.titulo ?? `${status.area} | Status de Renovações`}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {status.subtitulo ?? "Carteira em alerta de 100 dias | Atas a renovar"}
          {base && !status.subtitulo?.includes("Base:") ? ` | Base: ${fmtDate(base)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-line p-5 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className={`rounded-xl border px-3 py-4 ${tile.tone}`}>
            <p className="tnum text-[28px] font-bold leading-none">{fmtInt(tile.value)}</p>
            <p className="mt-2 text-[10.5px] font-bold uppercase leading-tight tracking-wide">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5">
        <h4 className="text-[16px] font-semibold text-navy-900">Prioridade | Vencimentos nos próximos 15 dias</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[12px]">
            <thead className="bg-navy-50 text-[11px] font-bold uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">CONTRATO SAP</th>
                <th className="px-3 py-2">VENCIMENTO</th>
                <th className="px-3 py-2">COMPRADOR(A)</th>
                <th className="px-3 py-2">SITUAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {status.prioridades.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-5 text-center text-ink-soft">Nenhum vencimento prioritário informado.</td></tr>
              ) : status.prioridades.map((item, index) => (
                <tr key={`${item.contrato}-${index}`}>
                  <td className="tnum px-3 py-2 font-semibold text-navy-950">{item.contrato}</td>
                  <td className="px-3 py-2">{fmtDate(item.vencimento)}</td>
                  <td className="px-3 py-2">{item.comprador ?? "—"}</td>
                  <td className="px-3 py-2">
                    {item.situacao ? <span className="inline-flex rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700">{item.situacao}</span> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {status.renovacaoEmAndamento && (
          <div className="mt-3 rounded-lg bg-ok-100 px-4 py-2.5 text-[12px] font-semibold text-ok-700">
            RENOVAÇÃO EM ANDAMENTO: {status.renovacaoEmAndamento.contrato ?? "—"} | {status.renovacaoEmAndamento.comprador ?? "—"} | VENCIMENTO {fmtDate(status.renovacaoEmAndamento.vencimento)}
          </div>
        )}
        {status.notas.length > 0 && (
          <div className="mt-3 space-y-2">
            {status.notas.map((note) => <p key={note} className="rounded-lg bg-warn-100 px-3 py-2 text-[12.5px] leading-relaxed text-warn-700">{note}</p>)}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusCarteiraArea({ status, referencia }: { status: SnapshotStatusAtasArea; referencia: string | null }) {
  const tiles = [
    ["TOTAL", status.total],
    ["VIGENTES", status.vigentes],
    ["VENCIDAS", status.vencidas],
    ["ATÉ 15 DIAS", status.ate15],
    ["16 A 30 DIAS", status.de16a30],
    ["A RENOVAR", status.aRenovar],
  ] as const;
  const base = status.baseDate ?? referencia;

  return (
    <section className="card overflow-hidden" aria-label={`Status das atas — ${status.area}`}>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[20px] font-sans font-semibold leading-tight text-navy-900">
          {status.titulo ?? `${status.area} | Status das Atas`}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {status.subtitulo ?? "Carteira da área e ações prioritárias"}{base ? ` · base ${fmtDate(base)}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {tiles.map(([label, value]) => (
          <div key={label} className="px-3 py-4 text-center">
            <p className="tnum text-[22px] font-bold text-navy-950">{fmtInt(value)}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase leading-tight text-ink-soft">{label}</p>
          </div>
        ))}
      </div>
      {(status.prioridades.length > 0 || status.carteira.length > 0 || status.notas.length > 0) && (
        <div className="grid gap-5 border-t border-line p-5 lg:grid-cols-2">
          {status.prioridades.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.07em] text-navy-900">Prioridades de vencimento</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-[12px]">
                  <thead className="bg-navy-50 text-left text-ink-soft">
                    <tr><th className="px-2 py-2">CONTRATO SAP</th><th className="px-2 py-2">VENCIMENTO</th><th className="px-2 py-2">COMPRADOR(A)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {status.prioridades.map((item, index) => (
                      <tr key={`${item.contrato}-${index}`}><td className="tnum px-2 py-2 font-semibold">{item.contrato}</td><td className="px-2 py-2">{fmtDate(item.vencimento)}</td><td className="px-2 py-2">{item.comprador ?? "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {status.carteira.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.07em] text-navy-900">Carteira por comprador(a)</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-[12px]">
                  <thead className="bg-navy-50 text-left text-ink-soft">
                    <tr><th className="px-2 py-2">COMPRADOR(A)</th><th className="px-2 py-2">VIG.</th><th className="px-2 py-2">VENC.</th><th className="px-2 py-2">A RENOVAR</th><th className="px-2 py-2">TOTAL</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {status.carteira.map((item) => (
                      <tr key={item.comprador}><td className="px-2 py-2 font-semibold">{item.comprador}</td><td className="tnum px-2 py-2">{fmtInt(item.vigentes)}</td><td className="tnum px-2 py-2">{fmtInt(item.vencidas)}</td><td className="tnum px-2 py-2">{fmtInt(item.aRenovar)}</td><td className="tnum px-2 py-2">{fmtInt(item.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {status.notas.length > 0 && (
            <div className="lg:col-span-2 space-y-2">
              {status.notas.map((note) => <p key={note} className="rounded-lg bg-warn-100 px-3 py-2 text-[12.5px] leading-relaxed text-warn-700">{note}</p>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
````

## `src/components/ui.tsx`

````tsx
import type { ReactNode } from "react";
import clsx from "clsx";
import { SITUACAO_LABEL, type SituacaoChave } from "@/lib/domain";

/* ------------------------------------------------------------------ */
/* Cabeçalho de página                                                  */
/* ------------------------------------------------------------------ */

export function PageHeader({
  overline,
  title,
  description,
  actions,
}: {
  overline: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="overline mb-1.5">{overline}</p>
        <h1 className="font-display text-pretty text-[24px] font-bold leading-tight tracking-tight text-navy-950 sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Situação — nunca só cor: ponto + rótulo textual                      */
/* ------------------------------------------------------------------ */

const SITUACAO_STYLE: Record<SituacaoChave, { chip: string; dot: string }> = {
  vencido: { chip: "bg-danger-100 text-danger-700", dot: "bg-danger-600" },
  a_vencer: { chip: "bg-warn-100 text-warn-700", dot: "bg-warn-600" },
  em_dia: { chip: "bg-ok-100 text-ok-700", dot: "bg-ok-600" },
  sem_data: { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-500" },
  concluido: { chip: "bg-navy-100 text-navy-700", dot: "bg-navy-500" },
  cancelado: { chip: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-400" },
};

export function StatusBadge({ situacao, detalhe }: { situacao: SituacaoChave; detalhe?: string }) {
  const s = SITUACAO_STYLE[situacao] ?? SITUACAO_STYLE.sem_data;
  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold", s.chip)}
    >
      <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-full", s.dot)} />
      {SITUACAO_LABEL[situacao]}
      {detalhe && <span className="font-normal opacity-90">· {detalhe}</span>}
    </span>
  );
}

export function situacaoChave(situacao: string | null | undefined): SituacaoChave {
  const keys: SituacaoChave[] = ["vencido", "a_vencer", "em_dia", "sem_data", "concluido", "cancelado"];
  return keys.includes(situacao as SituacaoChave) ? (situacao as SituacaoChave) : "sem_data";
}

/* ------------------------------------------------------------------ */
/* Área                                                                 */
/* ------------------------------------------------------------------ */

export const AREA_STYLE: Record<string, { chip: string; dot: string; bar: string; band: string; hex: string }> = {
  Indiretos: { chip: "bg-indiretos-100 text-indiretos-700", dot: "bg-indiretos-500", bar: "bg-indiretos-500", band: "bg-indiretos-500 text-white", hex: "#0b7c7b" },
  Diretos: { chip: "bg-diretos-100 text-diretos-700", dot: "bg-diretos-500", bar: "bg-diretos-500", band: "bg-diretos-500 text-white", hex: "#0a6fd6" },
  CAPEX: { chip: "bg-capex-100 text-capex-700", dot: "bg-capex-500", bar: "bg-capex-500", band: "bg-capex-500 text-navy-950", hex: "#fca500" },
  "Não informado": { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-500", bar: "bg-neutral-400", band: "bg-neutral-500 text-white", hex: "#98a2b3" },
};

export function areaStyle(area: string | null | undefined) {
  const normalized = String(area ?? "").trim().toUpperCase();
  const key = normalized === "INDIRETOS" || normalized === "INDIRETO"
    ? "Indiretos"
    : normalized === "DIRETOS" || normalized === "DIRETO"
      ? "Diretos"
      : normalized === "CAPEX" ? "CAPEX" : "Não informado";
  return AREA_STYLE[key];
}

export function AreaTag({ area }: { area: string | null | undefined }) {
  const s = areaStyle(area);
  const key = String(area ?? "").trim().toUpperCase() === "CAPEX"
    ? "CAPEX"
    : String(area ?? "").trim().toUpperCase().startsWith("DIRET")
      ? "Diretos"
      : String(area ?? "").trim().toUpperCase().startsWith("INDIRET")
        ? "Indiretos"
        : "Não informado";
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-[3px] text-[12px] font-semibold", s.chip)}>
      <span aria-hidden="true" className={clsx("h-[7px] w-[7px] rounded-[2px]", s.dot)} />
      {key}
    </span>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "navy" | "warn" | "ok" | "danger" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        tone === "neutral" && "bg-neutral-100 text-neutral-700",
        tone === "accent" && "bg-accent-100 text-accent-700",
        tone === "navy" && "bg-navy-100 text-navy-700",
        tone === "warn" && "bg-warn-100 text-warn-700",
        tone === "ok" && "bg-ok-100 text-ok-700",
        tone === "danger" && "bg-danger-100 text-danger-700",
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Estado vazio                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={clsx(
        "card flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-14 sm:px-12 sm:py-20",
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-100 text-navy-600 [&>svg]:h-7 [&>svg]:w-7"
      >
        {icon}
      </span>
      <h2 className="font-display text-[18px] font-bold text-navy-950">{title}</h2>
      {description && <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Título de seção                                                      */
/* ------------------------------------------------------------------ */

export function SectionTitle({ title, hint, aside }: { title: string; hint?: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 className="font-display text-[16.5px] font-bold tracking-tight text-navy-950">{title}</h2>
      <div className="flex items-baseline gap-3">
        {hint && <p className="text-[12.5px] text-ink-soft">{hint}</p>}
        {aside}
      </div>
    </div>
  );
}
````

## `src/lib/client-parse.ts`

````typescript
/**
 * Leitura de arquivos .xlsx/.csv **no navegador** (nada é enviado a
 * serviços de terceiros; o arquivo é processado localmente e, após a confirmação, os dados ficam no
 * IndexedDB deste navegador; não há envio automático para terceiros).
 */
import * as XLSX from "xlsx";

export const MAX_FILE_MB = 25;
export const MAX_ROWS = 60000;

export interface ParsedSheet {
  name: string;
  /** linhas brutas (matriz) já com cabeçalho removido */
  headerRowIndex: number;
  matrix: unknown[][];
}

export interface ParsedFile {
  fileName: string;
  sizeBytes: number;
  kind: "xlsx" | "csv";
  encoding: "utf-8" | "windows-1252" | null;
  delimiter: string | null;
  sheets: ParsedSheet[];
}

export class ParseError extends Error {
  code: "tipo" | "tamanho" | "vazio" | "estrutura";
  constructor(code: ParseError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r\n|\r|\n/).slice(0, 5).join("\n");
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = firstLines.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

/** Tenta UTF-8 estrito; se falhar (muito comum em CSVs do Excel pt-BR), usa Windows-1252. */
function decodeCsv(buffer: ArrayBuffer): { text: string; encoding: "utf-8" | "windows-1252" } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(buffer), encoding: "windows-1252" };
  }
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext)) {
    throw new ParseError("tipo", `O formato ".${ext}" não é suportado (${file.name}). Envie apenas .xlsx, .xls ou .csv.`);
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new ParseError("tamanho", `Arquivo ${file.name} com ${(file.size / 1048576).toFixed(1)} MB. O limite é ${MAX_FILE_MB} MB.`);
  }
  if (file.size === 0) {
    throw new ParseError("vazio", `O arquivo ${file.name} está vazio (0 bytes).`);
  }

  const buffer = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  let encoding: ParsedFile["encoding"] = null;
  let delimiter: string | null = null;

  try {
    if (ext === "csv") {
      const decoded = decodeCsv(buffer);
      encoding = decoded.encoding;
      delimiter = detectDelimiter(decoded.text);
      wb = XLSX.read(decoded.text, { type: "string", FS: delimiter, raw: true });
    } else {
      wb = XLSX.read(buffer, { type: "array", cellDates: true });
    }
  } catch {
    throw new ParseError("estrutura", `Não foi possível ler o arquivo ${file.name}. Confirme se não está protegido por senha.`);
  }

  if (!wb.SheetNames.length) {
    throw new ParseError("vazio", `Nenhuma planilha encontrada em ${file.name}.`);
  }

  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: null,
      // Preserve separators between independent pivot tables. The operational
      // extractor ignores empty records, while the dashboard extractor uses
      // them to avoid crossing from fornecedores into evolução/previsões.
      blankrows: true,
    }) as unknown[][];
    return { name, headerRowIndex: guessHeaderRow(matrix), matrix };
  });

  const nonEmpty = sheets.filter((s) => s.matrix.length > 0);
  if (!nonEmpty.length) {
    throw new ParseError("vazio", `Todas as planilhas do arquivo ${file.name} estão vazias.`);
  }

  const totalRows = nonEmpty.reduce((acc, s) => acc + s.matrix.length, 0);
  if (totalRows > MAX_ROWS + 5) {
    throw new ParseError("estrutura", `O arquivo ${file.name} tem ${totalRows.toLocaleString("pt-BR")} linhas (acima do limite de ${MAX_ROWS.toLocaleString("pt-BR")}).`);
  }

  return {
    fileName: file.name,
    sizeBytes: file.size,
    kind: ext === "csv" ? "csv" : "xlsx",
    encoding,
    delimiter,
    sheets,
  };
}

/** Lê múltiplos arquivos e converte todas as abas (com dados) em um único array consolidado de linhas. */
export async function parseMultipleFiles(files: File[]): Promise<{
  filesCount: number;
  sheetsCount: number;
  combinedTable: SheetTable;
  names: string[];
  sourceSheets: SourceSheet[];
}> {
  let combinedRows: Record<string, unknown>[] = [];
  const allHeaders = new Set<string>();
  let filesCount = 0;
  let sheetsCount = 0;
  const names: string[] = [];
  const sourceSheets: SourceSheet[] = [];

  for (const f of files) {
    const parsed = await parseFile(f);
    filesCount++;
    names.push(parsed.fileName);
    for (const sheet of parsed.sheets) {
      if (sheet.matrix.length === 0) continue;
      sourceSheets.push({
        fileName: parsed.fileName,
        sheetName: sheet.name,
        headerRowIndex: sheet.headerRowIndex,
        matrix: sheet.matrix,
      });
      const t = extractTable(sheet, sheet.headerRowIndex);
      if (t.rows.length > 0) {
        sheetsCount++;
        for (const h of t.headers) allHeaders.add(h);
        // Marcamos o arquivo e a aba de origem caso a mesma chave de identificador venha de lugares distintos
        combinedRows = combinedRows.concat(t.rows.map(r => ({ ...r, _file: parsed.fileName, _sheet: sheet.name })));
      }
    }
  }

  if (combinedRows.length > MAX_ROWS + 100) {
    throw new ParseError("estrutura", `A combinação das planilhas gerou ${combinedRows.length.toLocaleString("pt-BR")} linhas — acima do limite.`);
  }

  return {
    filesCount,
    sheetsCount,
    names,
    sourceSheets,
    combinedTable: { headers: Array.from(allHeaders), rows: combinedRows, totalRows: combinedRows.length },
  };
}

/** Heurística: a linha de cabeçalho tende a ser a linha com mais células de texto nas primeiras 12 linhas. */
export function guessHeaderRow(matrix: unknown[][]): number {
  const limit = Math.min(matrix.length, 12);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < limit; i++) {
    const row = matrix[i] ?? [];
    const filled = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "");
    const textCells = filled.filter((c) => !(c instanceof Date) && isNaN(Number(c)));
    const score = textCells.length * 2 + filled.length * 0.1 - i * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

export interface SheetTable {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

/** Matriz preservada para os blocos específicos do painel (múltiplas tabelas por aba). */
export interface SourceSheet {
  fileName: string;
  sheetName: string;
  headerRowIndex: number;
  matrix: unknown[][];
}

/** Extrai cabeçalho + linhas como objetos. Cabeçalhos duplicados recebem sufixo. */
export function extractTable(sheet: ParsedSheet, headerRowIndex: number): SheetTable {
  const { matrix } = sheet;
  const headerRow = matrix[headerRowIndex] ?? [];
  const headers: string[] = [];
  const counts = new Map<string, number>();
  for (let c = 0; c < headerRow.length; c++) {
    let h = headerRow[c];
    let name = h === null || h === undefined || String(h).trim() === "" ? `Coluna ${c + 1}` : String(h).trim();
    if (counts.has(name)) {
      const n = counts.get(name)! + 1;
      counts.set(name, n);
      name = `${name} (${n})`;
    } else {
      counts.set(name, 1);
    }
    headers.push(name);
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const line = matrix[r];
    const obj: Record<string, unknown> = {};
    let hasContent = false;
    for (let c = 0; c < headers.length; c++) {
      const v = line?.[c] ?? null;
      if (v !== null && v !== undefined && String(v).trim() !== "") hasContent = true;
      obj[headers[c]] = v;
    }
    if (hasContent) rows.push(obj);
    if (rows.length >= MAX_ROWS) break;
  }
  return { headers, rows, totalRows: rows.length };
}
````

## `src/lib/csv.ts`

````typescript
/**
 * Constrói CSV compatível com Excel pt-BR (ponto e vírgula, BOM UTF-8) e
 * protege contra injeção de fórmula ao abrir o arquivo exportado.
 */

const DANGEROUS = /^[=+\-@]/;

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) {
    s = `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`;
  } else {
    s = String(value);
  }
  // Proteção contra execução de fórmulas no Excel/Sheets.
  if (DANGEROUS.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(";")];
  for (const r of rows) lines.push(r.map(csvEscape).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}
````

## `src/lib/dashboard-snapshot.ts`

````typescript
import { normText, parseDateBR, parseNumberBR } from "@/lib/domain";

/**
 * Estruturas dos blocos consolidados da planilha de gestão de atas.
 *
 * O extrator abaixo é deliberadamente explícito: cada bloco só é aceito quando
 * encontra os nomes de linhas/colunas definidos no layout da planilha. Isso
 * evita que uma tabela parecida seja interpretada silenciosamente como outra.
 */

export const SNAPSHOT_AREAS = ["INDIRETOS", "DIRETOS", "CAPEX"] as const;
export type SnapshotArea = (typeof SNAPSHOT_AREAS)[number];

export const FORECAST_BANDS = ["ate_15", "ate_30", "ate_60", "vencidas", "acima_60", "canceladas", "finalizadas"] as const;
export type ForecastBand = (typeof FORECAST_BANDS)[number];

/** Blocos reconhecidos no snapshot e seus nomes exibidos quando uma fonte não os traz. */
export const SNAPSHOT_BLOCK_KEYS = [
  "kpis-leitura",
  "valores-por-area",
  "saving",
  "top-compradores",
  "fornecedores",
  "evolucao",
  "previsao-faixas",
  "previsao-meses",
  "previsoes-cruzadas",
  "atas-concluidas",
  "contratos-fornecedores",
  "status-atas",
] as const;
export type SnapshotBlockKey = (typeof SNAPSHOT_BLOCK_KEYS)[number];

export const SNAPSHOT_BLOCKS: Record<SnapshotBlockKey, { label: string; esperado: string }> = {
  "kpis-leitura": { label: "Leitura dos gráficos", esperado: "tabela LEITURA DOS GRÁFICOS com Gráfico, Situação apresentada, ATAS e ITENS" },
  "valores-por-area": { label: "Valor contratado por área", esperado: "VALOR DIRETOS, VALOR INDIRETOS e VALOR CAPEX" },
  saving: { label: "Saving por área", esperado: "bloco Saving com os valores contratados, saving e percentuais" },
  "top-compradores": { label: "Top compradores por área", esperado: "blocos TOP COMP por área" },
  fornecedores: { label: "Representatividade de fornecedores", esperado: "tabela FORNECEDORES GERAL" },
  evolucao: { label: "Evolução por área", esperado: "evolução por status atual e tabela EM ANDAMENTO" },
  "previsao-faixas": { label: "Previsão de conclusão por faixa", esperado: "faixas até 15, 30, 60 e vencidas; a faixa acima de 60 dias é lida e calculada, mas não exibida" },
  "previsao-meses": { label: "Previsão de conclusão por mês", esperado: "pivô PREVISÃO DE CONCLUSÃO POR MÊS" },
  "previsoes-cruzadas": { label: "Previsões por comprador", esperado: "COMPRADOR, AREA e PRAZO CONCLUSÃO" },
  "atas-concluidas": {
    label: "Atas concluídas (base de andamento)",
    esperado: "aba Base - Atas Em andamento com as colunas DESCRIÇÃO DOS LOTES ATAS, QTD ITENS, COMPRADOR, AREA, ETAPA ATUAL e N° CONTRATO",
  },
  "contratos-fornecedores": {
    label: "Fornecedor por contrato",
    esperado: "aba Base - Controle de Contratos com as colunas Contrato, Item (ou Material) e Fornecedor",
  },
  "status-atas": {
    label: "Status das atas por área",
    esperado: "aba de status/renovações com uma faixa por área (INDIRETOS, DIRETOS, CAPEX), quadros TOTAL A RENOVAR/VENCIDAS/ATÉ 15 DIAS/EM ANDAMENTO ou TOTAL/VIGENTES/VENCIDAS, tabela CONTRATO SAP | VENCIMENTO | COMPRADOR(A) | SITUAÇÃO e, quando disponível, faixa RENOVAÇÃO EM ANDAMENTO",
  },
};

export function snapshotBlockLabel(key: string): string {
  return (SNAPSHOT_BLOCKS as Record<string, { label: string }>)[key]?.label ?? key;
}

export interface SnapshotKpis {
  concluidasAtas: number | null;
  concluidasItens: number | null;
  /** Card “ATAS EM ANDAMENTO (GERAL)”; soma das áreas quando o card não existe. */
  andamentoAtas: number | null;
  andamentoItens: number | null;
  saldoItens: number | null;
  consumidoItens: number | null;
  aVencerAtas: number | null;
  aVencerItens: number | null;
  vencidasAtas: number | null;
  vencidasItens: number | null;
}

export interface SnapshotValueArea {
  valor: number | null;
  valorSaving: number | null;
  savingHist: number | null;
  savingProp: number | null;
  reducaoHistPct: number | null;
  reducaoPropPct: number | null;
}

export interface SnapshotBuyer {
  name: string;
  itens: number;
  atas: number;
  totalAtasArea: number | null;
}

export interface SnapshotTopBuyers {
  area: SnapshotArea;
  totalAtasArea: number | null;
  topAtas: number;
  buyers: SnapshotBuyer[];
}

export interface SnapshotSupplier {
  area: SnapshotArea;
  fornecedor: string;
  qtdAtas: number | null;
  qtdItens: number | null;
  concentracaoPct: number | null;
  analise: string | null;
}

/** Linhas da tabela única “FORNECEDORES GERAL”, sem misturar os quadros de área. */
export type SnapshotSupplierGeneral = Omit<SnapshotSupplier, "area"> & { area: "GERAL" };

export interface SnapshotEvolution {
  concluidasAtas: number | null;
  concluidasItens: number | null;
  andamentoAtas: number | null;
  andamentoItens: number | null;
  saldoItens: number | null;
  semSaldoItens: number | null;
  vencidasAtas: number | null;
  vencidasItens: number | null;
  aVencerAtas: number | null;
  aVencerItens: number | null;
}

export interface SnapshotForecastBuyer {
  name: string;
  /** Pode ser nulo quando a aba traz apenas a lista de nomes, sem rateio individual. */
  atas: number | null;
  itens: number | null;
  prazoConclusao: string | null;
}

export interface SnapshotForecastArea {
  atas: number | null;
  itens: number | null;
  buyers: SnapshotForecastBuyer[];
}

/** Uma linha do pivô “PREVISÃO DE CONCLUSÃO POR MÊS”. */
export interface SnapshotMonthlyForecastRow {
  label: string;
  month: number | null;
  year: number | null;
  atas: number | null;
  itens: number | null;
}

export interface SnapshotMonthlyForecastArea {
  rows: SnapshotMonthlyForecastRow[];
}

/** Uma ata da aba “Base - Atas Em andamento” cuja ETAPA ATUAL é FINALIZADO. */
export interface SnapshotAtaConcluida {
  /** Número do contrato (só dígitos) ou descrição|comprador|área quando não houver contrato. */
  key: string;
  descricao: string;
  contrato: string | null;
  fornecedor: string | null;
  itens: number | null;
  comprador: string | null;
  area: SnapshotArea | null;
  etapa: string;
  valor: number | null;
}

export interface SnapshotStatusPrioridade {
  contrato: string;
  vencimento: string | null;
  comprador: string | null;
  situacao: string | null;
}

export interface SnapshotStatusCarteira {
  comprador: string;
  vigentes: number | null;
  vencidas: number | null;
  aRenovar: number | null;
  total: number | null;
}

/** Bloco “Status das Atas” de uma área, na aba dedicada da planilha. */
export type SnapshotStatusLayout = "atas" | "renovacoes";

export interface SnapshotStatusRenovacao {
  contrato: string | null;
  comprador: string | null;
  vencimento: string | null;
  texto: string;
}

/** Bloco “Status das Atas” de uma área, na aba dedicada da planilha. */
export interface SnapshotStatusAtasArea {
  area: SnapshotArea;
  layout: SnapshotStatusLayout;
  baseDate: string | null;
  titulo: string | null;
  subtitulo: string | null;
  /** Quadro TOTAL no layout da carteira de atas. */
  total: number | null;
  vigentes: number | null;
  vencidas: number | null;
  ate15: number | null;
  de16a30: number | null;
  aRenovar: number | null;
  /** Quadro TOTAL A RENOVAR no layout novo do SharePoint. */
  totalRenovar: number | null;
  /** Quadro EM ANDAMENTO no layout novo do SharePoint. */
  emAndamento: number | null;
  prioridades: SnapshotStatusPrioridade[];
  carteira: SnapshotStatusCarteira[];
  /** Faixa “RENOVAÇÃO EM ANDAMENTO” exibida abaixo da tabela de prioridades. */
  renovacaoEmAndamento: SnapshotStatusRenovacao | null;
  notas: string[];
}

export interface SnapshotCoverage {
  found: string[];
  missing: string[];
}

export interface DashboardSnapshotPayload {
  schemaVersion: 2;
  referenceDate: string | null;
  sourceFiles: string[];
  capturedAt: string;
  kpis: SnapshotKpis;
  valueAreas: Record<SnapshotArea, SnapshotValueArea>;
  savingTotal: SnapshotValueArea;
  topCompradores: Record<SnapshotArea, SnapshotTopBuyers>;
  fornecedores: Record<SnapshotArea, SnapshotSupplier[]>;
  fornecedoresGeral: SnapshotSupplierGeneral[];
  evolucao: Record<SnapshotArea, SnapshotEvolution>;
  previsoes: Record<ForecastBand, Record<SnapshotArea, SnapshotForecastArea>>;
  previsaoMeses: Record<SnapshotArea, SnapshotMonthlyForecastArea>;
  /** Atas FINALIZADO na base de andamento; a comparação acontece no painel. */
  atasConcluidas: SnapshotAtaConcluida[];
  /** Contrato (só dígitos) → fornecedor da aba de controle de contratos. */
  fornecedoresPorContrato: Record<string, string>;
  statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
  coverage: SnapshotCoverage;
  notes: string[];
}

export interface SnapshotSourceSheet {
  fileName: string;
  sheetName: string;
  matrix: unknown[][];
  headerRowIndex?: number;
}

const AREA_SET = new Set<string>(SNAPSHOT_AREAS);

function emptyKpis(): SnapshotKpis {
  return {
    concluidasAtas: null,
    concluidasItens: null,
    andamentoAtas: null,
    andamentoItens: null,
    saldoItens: null,
    consumidoItens: null,
    aVencerAtas: null,
    aVencerItens: null,
    vencidasAtas: null,
    vencidasItens: null,
  };
}

function emptyValueArea(): SnapshotValueArea {
  return {
    valor: null,
    valorSaving: null,
    savingHist: null,
    savingProp: null,
    reducaoHistPct: null,
    reducaoPropPct: null,
  };
}

function emptyEvolution(): SnapshotEvolution {
  return {
    concluidasAtas: null,
    concluidasItens: null,
    andamentoAtas: null,
    andamentoItens: null,
    saldoItens: null,
    semSaldoItens: null,
    vencidasAtas: null,
    vencidasItens: null,
    aVencerAtas: null,
    aVencerItens: null,
  };
}

function emptyForecast(): SnapshotForecastArea {
  return { atas: null, itens: null, buyers: [] };
}

function makeAreaRecord<T>(factory: () => T): Record<SnapshotArea, T> {
  return {
    INDIRETOS: factory(),
    DIRETOS: factory(),
    CAPEX: factory(),
  };
}

function makeForecastRecord(): Record<ForecastBand, Record<SnapshotArea, SnapshotForecastArea>> {
  return {
    ate_15: makeAreaRecord(emptyForecast),
    ate_30: makeAreaRecord(emptyForecast),
    ate_60: makeAreaRecord(emptyForecast),
    vencidas: makeAreaRecord(emptyForecast),
    acima_60: makeAreaRecord(emptyForecast),
    canceladas: makeAreaRecord(emptyForecast),
    finalizadas: makeAreaRecord(emptyForecast),
  };
}

function makeMonthlyForecastRecord(): Record<SnapshotArea, SnapshotMonthlyForecastArea> {
  return makeAreaRecord(() => ({ rows: [] }));
}

export function emptyDashboardSnapshot(referenceDate: string | null = null, sourceFiles: string[] = []): DashboardSnapshotPayload {
  return {
    schemaVersion: 2,
    referenceDate,
    sourceFiles,
    capturedAt: new Date().toISOString(),
    kpis: emptyKpis(),
    valueAreas: makeAreaRecord(emptyValueArea),
    savingTotal: emptyValueArea(),
    topCompradores: {
      INDIRETOS: { area: "INDIRETOS", totalAtasArea: null, topAtas: 0, buyers: [] },
      DIRETOS: { area: "DIRETOS", totalAtasArea: null, topAtas: 0, buyers: [] },
      CAPEX: { area: "CAPEX", totalAtasArea: null, topAtas: 0, buyers: [] },
    },
    fornecedores: { INDIRETOS: [], DIRETOS: [], CAPEX: [] },
    fornecedoresGeral: [],
    evolucao: makeAreaRecord(emptyEvolution),
    previsoes: makeForecastRecord(),
    previsaoMeses: makeMonthlyForecastRecord(),
    atasConcluidas: [],
    fornecedoresPorContrato: {},
    statusAtas: makeAreaRecord(() => null),
    coverage: { found: [], missing: [] },
    notes: [],
  };
}

/* ------------------------ células e cabeçalhos -------------------- */

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).replace(/^\uFEFF/, "").replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Comparação exata, sem distinguir acentos, caixa, quebras e espaços. */
function exact(value: unknown): string {
  return normText(cellText(value)).toUpperCase();
}

function rowHas(row: unknown[], labels: string[]): boolean {
  const values = row.map(exact);
  return labels.every((label) => values.includes(exact(label)));
}

function columnIndex(row: unknown[], predicate: (value: string) => boolean): number {
  return row.findIndex((value) => predicate(exact(value)));
}

function isBlank(row: unknown[] | undefined): boolean {
  return !row || row.every((value) => cellText(value) === "");
}

function isArea(value: unknown): SnapshotArea | null {
  const n = exact(value).replace(/[()]/g, "");
  if (AREA_SET.has(n)) return n as SnapshotArea;
  if (n === "AREA INDIRETOS") return "INDIRETOS";
  if (n === "AREA DIRETOS") return "DIRETOS";
  if (n === "AREA CAPEX") return "CAPEX";
  return null;
}

function giroSheets(sheets: SnapshotSourceSheet[], number: number, label: string): SnapshotSourceSheet[] {
  const expectedNumber = String(number).padStart(2, "0");
  const expectedLabel = exact(label);
  return sheets.filter((sheet) => {
    const source = exact(`${sheet.fileName} ${sheet.sheetName}`);
    return source.includes(`GIRO ${expectedNumber}`) && source.includes(expectedLabel);
  });
}

function numberValue(value: unknown, integer = false): number | null {
  const text = cellText(value);
  if (!text || /^[-–—]+$/.test(text)) return null;
  const parsed = parseNumberBR(value, { integer, label: "métrica da tabela" });
  return parsed.value === null || !Number.isFinite(parsed.value) ? null : parsed.value;
}

function integerValue(value: unknown): number | null {
  const result = numberValue(value, true);
  return result === null ? null : Math.round(result);
}

function percentValue(value: unknown): number | null {
  const text = cellText(value);
  if (!text || /^[-–—]+$/.test(text)) return null;
  const withoutPercent = text.replace(/%/g, "").trim();
  const parsed = parseNumberBR(withoutPercent, { label: "percentual da tabela" });
  if (parsed.value === null || !Number.isFinite(parsed.value)) return null;
  // XLSX retorna 0,0947 para uma célula formatada como 9,47%.
  return Math.abs(parsed.value) <= 1 && !text.includes("%") ? parsed.value * 100 : parsed.value;
}

function firstNumberAfter(row: unknown[], start: number): number | null {
  for (let i = start + 1; i < row.length; i += 1) {
    const value = numberValue(row[i]);
    if (value !== null) return value;
  }
  return null;
}

function nextNumberInColumn(matrix: unknown[][], rowIndex: number, column: number, maxRows = 3): number | null {
  for (let r = rowIndex + 1; r < Math.min(matrix.length, rowIndex + 1 + maxRows); r += 1) {
    const value = numberValue(matrix[r]?.[column]);
    if (value !== null) return value;
  }
  return null;
}

function firstNumberForLabel(matrix: unknown[][], rowIndex: number, column: number): number | null {
  return firstNumberAfter(matrix[rowIndex] ?? [], column) ?? nextNumberInColumn(matrix, rowIndex, column);
}

function metricAt<T>(row: unknown[], column: number, parser: (value: unknown) => T): T {
  const direct = parser(row[column]);
  if (direct !== null && direct !== undefined) return direct;
  // Algumas exportações omitem a coluna “Rótulos de Linha” do cabeçalho,
  // embora mantenham a área na primeira célula das linhas. Nesse caso, os
  // valores começam uma coluna depois dos cabeçalhos numéricos.
  if (isArea(row[column])) return parser(row[column + 1]);
  return direct;
}

function addFound(payload: DashboardSnapshotPayload, key: string) {
  if (!payload.coverage.found.includes(key)) payload.coverage.found.push(key);
}

function findHeaderRows(matrix: unknown[][], predicate: (row: unknown[]) => boolean): number[] {
  const result: number[] = [];
  matrix.forEach((row, index) => {
    if (predicate(row)) result.push(index);
  });
  return result;
}

function previousContext(matrix: unknown[][], rowIndex: number, maxRows = 5): string[] {
  const context: string[] = [];
  for (let r = Math.max(0, rowIndex - maxRows); r < rowIndex; r += 1) {
    for (const cell of matrix[r] ?? []) {
      const value = exact(cell);
      if (value) context.push(value);
    }
  }
  return context;
}

function areaFromContext(matrix: unknown[][], rowIndex: number): SnapshotArea | null {
  for (const value of previousContext(matrix, rowIndex, 8).reverse()) {
    const area = isArea(value);
    if (area) return area;
    if (value.includes("FORNECEDORES") || value.includes("TOP COMP")) {
      if (value.includes("INDIRETOS")) return "INDIRETOS";
      if (value.includes("DIRETOS")) return "DIRETOS";
      if (value.includes("CAPEX")) return "CAPEX";
    }
  }
  return null;
}

function areaFromHorizontalContext(matrix: unknown[][], rowIndex: number, column: number): SnapshotArea | null {
  for (let r = Math.max(0, rowIndex - 8); r < rowIndex; r += 1) {
    const row = matrix[r] ?? [];
    // Títulos mesclados ficam normalmente na primeira coluna do grupo; uma
    // janela curta também cobre exportações que deslocam o texto uma coluna.
    for (let c = Math.max(0, column - 1); c <= Math.min(row.length - 1, column + 2); c += 1) {
      const value = exact(row[c]);
      if (!value.includes("FORNECEDORES")) continue;
      if (value.includes("INDIRETOS")) return "INDIRETOS";
      if (value.includes("DIRETOS")) return "DIRETOS";
      if (value.includes("CAPEX")) return "CAPEX";
    }
  }
  return null;
}

/* ------------------------ leitura dos gráficos -------------------- */

function extractReadingTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) => rowHas(row, ["Gráfico", "Situação apresentada", "ATAS", "ITENS"]));
    for (const headerRow of headerRows) {
      const row = matrix[headerRow] ?? [];
      const graphCol = columnIndex(row, (v) => v === "GRAFICO");
      const situationCol = columnIndex(row, (v) => v === "SITUACAO APRESENTADA");
      const atasCol = columnIndex(row, (v) => v === "ATAS");
      const itensCol = columnIndex(row, (v) => v === "ITENS");
      if (graphCol < 0 || situationCol < 0 || atasCol < 0 || itensCol < 0) continue;

      for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 30); r += 1) {
        const data = matrix[r] ?? [];
        if (isBlank(data)) break;
        const graph = exact(data[graphCol]);
        const situation = exact(data[situationCol]);
        const atas = integerValue(data[atasCol]);
        const itens = integerValue(data[itensCol]);
        if (!graph) continue;

        if (graph === "ATA CONCLUIDAS (VALIDAS)" && situation === "VALIDAS") {
          payload.kpis.concluidasAtas = atas;
          payload.kpis.concluidasItens = itens;
          found = true;
        }
        if (graph === "ITENS COM SALDOS E CONSUMIDOS (VALIDOS)" && situation === "COM SALDO") {
          payload.kpis.saldoItens = itens;
          found = true;
        }
        if (graph === "ITENS COM SALDOS E CONSUMIDOS (VALIDOS)" && situation === "CONSUMIDOS") {
          payload.kpis.consumidoItens = itens;
          found = true;
        }
        if (graph === "ATAS VENCIDAS E A VENCER" && (situation === "A VENCER (RENOVAR)" || situation === "A VENCER" || situation === "RENOVAR")) {
          payload.kpis.aVencerAtas = atas;
          payload.kpis.aVencerItens = itens;
          found = true;
        }
        if (graph === "ATAS VENCIDAS E A VENCER" && situation === "VENCIDAS") {
          payload.kpis.vencidasAtas = atas;
          payload.kpis.vencidasItens = itens;
          found = true;
        }
      }
    }
  }
  if (found) addFound(payload, "kpis-leitura");
}

/**
 * Lê o resumo visual da aba CONTROLE ATAS CONCLUÍDAS. Essa versão da
 * planilha não possui necessariamente a tabela "LEITURA DOS GRÁFICOS": os
 * números aparecem em cartões com o rótulo em uma linha e os valores
 * calculados pelas fórmulas algumas linhas abaixo.
 */
function extractSummaryCards(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type CardKind = "concluidas" | "andamento" | "saldo" | "semSaldo" | "vencidas" | "aVencer";
  let found = false;
  const bestDistance: Record<CardKind, number> = {
    concluidas: Number.POSITIVE_INFINITY,
    andamento: Number.POSITIVE_INFINITY,
    saldo: Number.POSITIVE_INFINITY,
    semSaldo: Number.POSITIVE_INFINITY,
    vencidas: Number.POSITIVE_INFINITY,
    aVencer: Number.POSITIVE_INFINITY,
  };

  const cardKind = (value: unknown): CardKind | null => {
    const label = exact(value).replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    if (!label) return null;
    if (label.includes("ATA CONCLUIDAS") && label.includes("VALID")) return "concluidas";
    if (label.includes("ATAS EM ANDAMENTO")) return "andamento";
    if (label.includes("ITENS SEM SALDO")) return "semSaldo";
    if (label.includes("ITENS COM SALDO")) return "saldo";
    if ((label === "ATAS VENCIDAS" || label.startsWith("ATAS VENCIDAS ")) && !label.includes("E A VENCER")) return "vencidas";
    if (label === "ATAS A VENCER" || label.startsWith("ATAS A VENCER ")) return "aVencer";
    return null;
  };

  const setCard = (kind: CardKind, values: number[]) => {
    if (kind === "concluidas") {
      if (values[0] !== undefined) payload.kpis.concluidasAtas = values[0];
      if (values[1] !== undefined) payload.kpis.concluidasItens = values[1];
    } else if (kind === "andamento") {
      if (values[0] !== undefined) payload.kpis.andamentoAtas = values[0];
      if (values[1] !== undefined) payload.kpis.andamentoItens = values[1];
    } else if (kind === "saldo") {
      if (values[0] !== undefined) payload.kpis.saldoItens = values[0];
    } else if (kind === "semSaldo") {
      if (values[0] !== undefined) payload.kpis.consumidoItens = values[0];
    } else if (kind === "vencidas") {
      if (values[0] !== undefined) payload.kpis.vencidasAtas = values[0];
      if (values[1] !== undefined) payload.kpis.vencidasItens = values[1];
    } else {
      if (values[0] !== undefined) payload.kpis.aVencerAtas = values[0];
      if (values[1] !== undefined) payload.kpis.aVencerItens = values[1];
    }
  };

  const preferredSheets = giroSheets(sheets, 1, "PANORAMA");
  const sourceSheets = preferredSheets.length ? preferredSheets : sheets;
  for (const sheet of sourceSheets) {
    const matrix = sheet.matrix;
    const currentMarker = preferredSheets.length
      ? matrix.findIndex((row) => row.some((value) => exact(value).includes("STATUS ATUAL")))
      : -1;
    const firstRow = currentMarker >= 0 ? currentMarker : 0;
    for (let r = firstRow; r < matrix.length; r += 1) {
      const row = matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const kind = cardKind(row[c]);
        if (!kind) continue;

        // Não atravessa para o próximo cartão quando vários títulos estão na
        // mesma linha. O limite maior cobre células mescladas do cartão atual.
        let columnEnd = Math.min(row.length - 1, c + 8);
        for (let next = c + 1; next <= columnEnd; next += 1) {
          if (cardKind(row[next])) {
            columnEnd = next - 1;
            break;
          }
        }

        const values: number[] = [];
        const targetCount = kind === "saldo" || kind === "semSaldo" ? 1 : 2;
        let nearestDistance = Number.POSITIVE_INFINITY;
        const addValue = (value: number | null, distance: number) => {
          if (value !== null && values.length < targetCount) {
            values.push(value);
            nearestDistance = Math.min(nearestDistance, distance);
          }
        };

        // Também aceita uma célula composta, por exemplo “60 ATAS / 793
        // ITENS”, caso a exportação elimine as células mescladas.
        for (let offset = 0; offset <= 2; offset += 1) {
          const candidate = matrix[r + offset]?.[c];
          const pair = evolutionPairFromCell(candidate);
          if (pair.atas !== null) addValue(pair.atas, offset);
          if (pair.itens !== null) addValue(pair.itens, offset);
        }

        // No layout mostrado, os valores ficam alguns níveis abaixo do título
        // e podem estar em qualquer célula do cartão. O limite de seis linhas
        // evita capturar os números dos gráficos que começam logo depois.
        for (let rr = r; rr <= Math.min(matrix.length - 1, r + 6) && values.length < targetCount; rr += 1) {
          for (let cc = c; cc <= columnEnd && values.length < targetCount; cc += 1) {
            const cell = matrix[rr]?.[cc];
            const text = cellText(cell);
            if (!text) continue;
            const pair = evolutionPairFromCell(cell);
            if (pair.atas !== null) addValue(pair.atas, rr - r);
            if (pair.itens !== null) addValue(pair.itens, rr - r);
            if (pair.atas === null && pair.itens === null) addValue(integerValue(cell), rr - r);
          }
        }

        if (values.length > 0 && nearestDistance <= bestDistance[kind]) {
          setCard(kind, values);
          bestDistance[kind] = nearestDistance;
          found = true;
        }
      }
    }
  }

  if (found) addFound(payload, "kpis-leitura");
}

/* -------------------------- valores e saving ---------------------- */

function extractAreaValues(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  const labels: Array<[string, SnapshotArea]> = [
    ["VALOR INDIRETOS", "INDIRETOS"],
    ["VALOR DIRETOS", "DIRETOS"],
    ["VALOR CAPEX", "CAPEX"],
  ];
  for (const sheet of sheets) {
    for (let r = 0; r < sheet.matrix.length; r += 1) {
      const row = sheet.matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const label = exact(row[c]);
        const target = labels.find(([name]) => label === name || label === `${name} R$`);
        if (!target) continue;
        const value = firstNumberForLabel(sheet.matrix, r, c);
        if (value !== null) {
          payload.valueAreas[target[1]].valor = value;
          found = true;
        }
      }
    }
  }
  if (found) addFound(payload, "valores-por-area");
}

function headerValueIndex(row: unknown[], aliases: string[]): number {
  const normalized = aliases.map(exact);
  const exactIndex = row.findIndex((value) => normalized.includes(exact(value)));
  if (exactIndex >= 0) return exactIndex;
  // Tabelas dinâmicas do Excel às vezes acrescentam “/ %”, quebras de linha,
  // unidades ou uma coluna duplicada ao título. O nome base continua sendo
  // suficiente para identificar a métrica.
  return row.findIndex((value) => normalized.some((alias) => {
    const current = exact(value);
    return current.includes(alias) || alias.includes(current);
  }));
}

function savingNumber(value: unknown): number | null {
  const direct = numberValue(value);
  if (direct !== null) return direct;
  const text = cellText(value);
  const match = text.match(/-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|-?\d+(?:[.,]\d+)?/);
  return match ? numberValue(match[0]) : null;
}

function savingPercent(value: unknown): number | null {
  const direct = percentValue(value);
  if (direct !== null) return direct;
  const text = cellText(value);
  const match = text.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  return percentValue(`${match[1]}%`);
}

function extractSaving(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const headerRows = findHeaderRows(sheet.matrix, (row) => {
      const values = row.map(exact);
      const hasContracted = values.some((value) => value.includes("VALOR CONTRATADO"));
      const savingCount = values.filter((value) => value.includes("SAVING")).length;
      const hasReduction = values.some((value) => value.includes("REDUCAO"));
      // Aceita tanto cinco colunas separadas quanto títulos combinados como
      // “SAVING HISTÓRICO R$ / %”.
      return hasContracted && savingCount >= 1 && (hasReduction || savingCount >= 2);
    });
    for (const headerRow of headerRows) {
      const headers = sheet.matrix[headerRow] ?? [];
      const contractedCol = headerValueIndex(headers, ["VALOR CONTRATADO R$"]);
      const historicCol = headerValueIndex(headers, ["SAVING HISTÓRICO R$", "SAVING HISTORICO"]);
      const proposalCol = headerValueIndex(headers, ["SAVING PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA R$", "SAVING PROPOSTA"]);
      const reductionHistoricCol = headerValueIndex(headers, ["REDUÇÃO HISTÓRICO %", "REDUCAO HISTORICO", "REDUÇÃO HISTÓRICO"]);
      const reductionProposalCol = headerValueIndex(headers, ["REDUÇÃO PROPOSTA INICIAL %", "REDUCAO PROPOSTA INICIAL", "REDUÇÃO SOB PROPOSTA INICIAL", "REDUCAO PROPOSTA"]);
      if (contractedCol < 0) continue;
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 16); r += 1) {
        const row = sheet.matrix[r] ?? [];
        const area = row.map(isArea).find(Boolean) ?? null;
        const totalRow = row.some((value) => exact(value) === "TOTAL" || exact(value).startsWith("TOTAL GERAL"));
        if (!area && !totalRow) {
          if (isBlank(row)) break;
          continue;
        }
        const target = area ? payload.valueAreas[area] : payload.savingTotal;
        const contracted = savingNumber(row[contractedCol]);
        target.valorSaving = contracted;
        if (target.valor === null && contracted !== null) target.valor = contracted;
        target.savingHist = historicCol >= 0 ? savingNumber(row[historicCol]) : null;
        target.savingProp = proposalCol >= 0 ? savingNumber(row[proposalCol]) : null;
        target.reducaoHistPct = (reductionHistoricCol >= 0 ? savingPercent(row[reductionHistoricCol]) : null)
          ?? (historicCol >= 0 ? savingPercent(row[historicCol]) : null);
        target.reducaoPropPct = (reductionProposalCol >= 0 ? savingPercent(row[reductionProposalCol]) : null)
          ?? (proposalCol >= 0 ? savingPercent(row[proposalCol]) : null);
        found = true;
        // O primeiro TOTAL encerra o bloco Saving; não atravessar tabelas
        // posteriores que também possam conter uma linha TOTAL.
        if (totalRow) break;
      }
    }
  }
  if (found) addFound(payload, "saving");
}

/* -------------------------- compradores --------------------------- */

function extractTopBuyers(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const headerRows = findHeaderRows(sheet.matrix, (row) => row.some((value) => exact(value).startsWith("TOP COMP ")) && row.some((value) => exact(value) === "ITENS") && row.some((value) => exact(value) === "ATAS"));
    for (const headerRow of headerRows) {
      const header = sheet.matrix[headerRow] ?? [];
      const topColumns = header
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value.startsWith("TOP COMP "));

      // O layout real é “wide”: os três blocos ficam na mesma linha e os
      // cabeçalhos ITENS/ATAS aparecem repetidos. Cada TOP COMP abre um grupo
      // próprio; por isso as colunas são procuradas somente até o próximo grupo.
      for (let groupIndex = 0; groupIndex < topColumns.length; groupIndex += 1) {
        const group = topColumns[groupIndex];
        const nextGroupColumn = topColumns[groupIndex + 1]?.column ?? header.length;
        const area = isArea(group.value.replace("TOP COMP ", ""));
        if (!area) continue;
        const itensCol = header.findIndex((value, column) => column > group.column && column < nextGroupColumn && exact(value) === "ITENS");
        const atasCol = header.findIndex((value, column) => column > group.column && column < nextGroupColumn && exact(value) === "ATAS");
        const totalCol = header.findIndex((value, column) => column > group.column && column < nextGroupColumn && exact(value) === "TOTAL ATAS AREA");
        const buyers: SnapshotBuyer[] = [];
        let totalAtasArea: number | null = null;
        for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 12); r += 1) {
          const row = sheet.matrix[r] ?? [];
          const name = cellText(row[group.column]);
          if (!name || exact(name).startsWith("TOP COMP") || exact(name) === "TOTAL" || isBlank(row)) break;
          if (exact(name).includes("FORNECEDOR") || exact(name).includes("ROTULOS")) break;
          const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
          const atas = atasCol >= 0 ? integerValue(row[atasCol]) : null;
          const total = totalCol >= 0 ? integerValue(row[totalCol]) : null;
          if (total !== null && totalAtasArea === null) totalAtasArea = total;
          if (itens === null && atas === null) continue;
          buyers.push({ name, itens: itens ?? 0, atas: atas ?? 0, totalAtasArea: total });
        }
        if (buyers.length > 0) {
          const top = buyers.sort((a, b) => b.itens - a.itens || b.atas - a.atas).slice(0, 5);
          payload.topCompradores[area] = {
            area,
            totalAtasArea,
            topAtas: top.reduce((sum, buyer) => sum + buyer.atas, 0),
            buyers: top,
          };
          found = true;
        }
      }
    }
  }
  if (found) addFound(payload, "top-compradores");
}

/* -------------------------- fornecedores -------------------------- */

function extractSuppliers(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type GeneralBlock = {
    items: SnapshotSupplierGeneral[];
    totalAtas: number | null;
    totalItens: number | null;
  };
  const generalBlocks: GeneralBlock[] = [];

  const isSupplierHeader = (row: unknown[]) => {
    const values = row.map(exact);
    return values.includes("FORNECEDOR")
      && values.includes("QTD ATAS")
      && values.includes("QTD ITENS")
      && values.includes("% CONCENTRACAO DE ITENS")
      && values.includes("ANALISE");
  };

  const isStopLabel = (value: string) => {
    // A exportação da planilha pode juntar os quadros seguintes à tabela de
    // fornecedores quando as linhas vazias são removidas pelo SheetJS.
    return /^(ATA |ATAS |ITEM |VENCIDAS|A VENCER|EVOLU|PREVISAO|ROTULOS|RÓTULOS|CRITERIO|CRITÉRIO|ATUALIZACAO|ATUALIZAÇÃO|FORNECEDORES)/.test(value);
  };

  for (const sheet of sheets) {
    const headerRows = findHeaderRows(sheet.matrix, isSupplierHeader);
    for (const headerRow of headerRows) {
      const header = sheet.matrix[headerRow] ?? [];
      const supplierColumns = header
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value === "FORNECEDOR");

      for (let groupIndex = 0; groupIndex < supplierColumns.length; groupIndex += 1) {
        const group = supplierColumns[groupIndex];
        const nextGroupColumn = supplierColumns[groupIndex + 1]?.column ?? header.length;
        const titleContext = previousContext(sheet.matrix, headerRow, 24);
        const isGeneral = titleContext.some((value) => value.includes("FORNECEDORES GERAL"))
          || header.some((value) => exact(value).includes("FORNECEDORES GERAL"));
        const area = areaFromHorizontalContext(sheet.matrix, headerRow, group.column)
          ?? areaFromContext(sheet.matrix, headerRow);
        const findInGroup = (wanted: string) => header.findIndex(
          (value, column) => column >= group.column && column < nextGroupColumn && exact(value) === wanted,
        );
        const atasCol = findInGroup("QTD ATAS");
        const itensCol = findInGroup("QTD ITENS");
        const concentrationCol = findInGroup("% CONCENTRACAO DE ITENS");
        const analysisCol = findInGroup("ANALISE");
        if (atasCol < 0 || itensCol < 0 || concentrationCol < 0 || analysisCol < 0) continue;

        const items: Array<SnapshotSupplier | SnapshotSupplierGeneral> = [];
        for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 40); r += 1) {
          const row = sheet.matrix[r] ?? [];
          if (isBlank(row)) break;
          const supplier = cellText(row[group.column]);
          const supplierNormalized = exact(supplier);
          if (!supplier || supplierNormalized === "FORNECEDOR") break;
          if (isStopLabel(supplierNormalized)) break;
          const qtdAtas = integerValue(row[atasCol]);
          const qtdItens = integerValue(row[itensCol]);
          const concentration = percentValue(row[concentrationCol]);
          const analise = cellText(row[analysisCol]) || null;
          const analiseNormalized = exact(analise);
          const validAnalysis = !analiseNormalized
            || ["ALTA CONCENTRACAO", "VOLUME MEDIO", "PULVERIZADO"].includes(analiseNormalized);
          // Linhas de outros pivôs que vazam para o cabeçalho de fornecedores
          // têm ANÁLISE = QTD ATA ou um número. Elas não pertencem ao bloco.
          if (!validAnalysis || /^\d+(?:[.,]\d+)?$/.test(analiseNormalized) || analiseNormalized === "QTD ATA" || analiseNormalized === "QTD ITENS") continue;
          if (supplier.length > 120) continue;
          if (qtdAtas === null && qtdItens === null && !analise) continue;
          if (isGeneral) {
            items.push({ area: "GERAL", fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          } else if (area) {
            items.push({ area, fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          }
          // O primeiro TOTAL encerra a seção. Nunca atravessar para outro
          // bloco da mesma aba, mesmo que ele tenha o mesmo cabeçalho.
          if (supplierNormalized === "TOTAL" || supplierNormalized === "TOTAL GERAL") break;
        }

        if (items.length === 0) continue;
        if (isGeneral) {
          const generalItems = items as SnapshotSupplierGeneral[];
          const total = generalItems.find((item) => {
            const label = exact(item.fornecedor);
            return label === "TOTAL" || label === "TOTAL GERAL";
          });
          generalBlocks.push({
            items: generalItems,
            totalAtas: total?.qtdAtas ?? null,
            totalItens: total?.qtdItens ?? null,
          });
        } else if (area) {
          payload.fornecedores[area] = [...payload.fornecedores[area], ...(items as SnapshotSupplier[])];
        }
      }
    }
  }

  // Pode existir mais de uma tabela com o mesmo cabeçalho em arquivos/abas
  // diferentes. A tabela geral correta é a que fecha com a leitura principal
  // do painel; na ausência desse KPI, preferimos o bloco mais completo (maior
  // TOTAL de itens). Assim um quadro parcial/antigo não substitui a tabela
  // “FORNECEDORES GERAL” da base ativa.
  if (generalBlocks.length > 0) {
    const expectedAtas = payload.kpis.concluidasAtas;
    const expectedItens = payload.kpis.concluidasItens;
    const score = (block: GeneralBlock) => {
      const hasTotal = block.totalAtas !== null || block.totalItens !== null;
      const hasOthers = block.items.some((item) => exact(item.fornecedor) === "OUTROS FORNECEDORES");
      return (hasTotal ? 100 : 0)
        + (hasOthers ? 50 : 0)
        + (expectedAtas !== null && block.totalAtas === expectedAtas ? 100000 : 0)
        + (expectedItens !== null && block.totalItens === expectedItens ? 100000 : 0)
        + (block.totalItens ?? 0)
        + (block.totalAtas ?? 0)
        + block.items.length;
    };
    const selected = [...generalBlocks].sort((a, b) => score(b) - score(a))[0];
    const deduped: SnapshotSupplierGeneral[] = [];
    const seen = new Set<string>();
    for (const item of selected.items) {
      const key = `${exact(item.fornecedor)}|${item.qtdAtas ?? ""}|${item.qtdItens ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    const others = deduped.find((item) => exact(item.fornecedor) === "OUTROS FORNECEDORES");
    const total = deduped.find((item) => exact(item.fornecedor) === "TOTAL" || exact(item.fornecedor) === "TOTAL GERAL");
    const top = deduped.filter((item) => {
      const label = exact(item.fornecedor);
      return label !== "OUTROS FORNECEDORES" && label !== "TOTAL" && label !== "TOTAL GERAL";
    }).slice(0, 4);
    payload.fornecedoresGeral = [...top, ...(others ? [others] : []), ...(total ? [total] : [])];
    if (payload.fornecedoresGeral.length > 0) addFound(payload, "fornecedores");
  }
  // Sem uma tabela nomeada FORNECEDORES GERAL, não sinalizar o bloco como
  // reconhecido: os quadros por área não atendem ao contrato visual do painel.
}
/* ----------------------------- evolução --------------------------- */

function setEvolutionPair(target: SnapshotEvolution, kind: "concluidas" | "andamento" | "vencidas" | "aVencer", atas: number | null, itens: number | null) {
  if (kind === "concluidas") {
    if (atas !== null) target.concluidasAtas = atas;
    if (itens !== null) target.concluidasItens = itens;
  } else if (kind === "andamento") {
    if (atas !== null) target.andamentoAtas = atas;
    if (itens !== null) target.andamentoItens = itens;
  } else if (kind === "vencidas") {
    if (atas !== null) target.vencidasAtas = atas;
    if (itens !== null) target.vencidasItens = itens;
  } else {
    if (atas !== null) target.aVencerAtas = atas;
    if (itens !== null) target.aVencerItens = itens;
  }
}

function extractEvolution(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type EvolutionKind = "concluidas" | "andamento" | "vencidas" | "aVencer";
  let found = false;
  let explicitAndamentoTableFound = false;
  let bestConcludedScore = -1;
  let bestConcluded: Record<SnapshotArea, { atas: number | null; itens: number | null }> | null = null;

  function headerInfo(value: unknown): { area: SnapshotArea; kind: EvolutionKind } | null {
    const label = exact(value);
    let kind: EvolutionKind | null = null;
    let areaText = "";
    if (label.startsWith("VENCIDAS ")) {
      kind = "vencidas";
      areaText = label.slice("VENCIDAS ".length);
    } else if (label.startsWith("A VENCER ")) {
      kind = "aVencer";
      areaText = label.slice("A VENCER ".length);
    } else if (label.startsWith("EM ANDAMENTO ")) {
      kind = "andamento";
      areaText = label.slice("EM ANDAMENTO ".length);
    } else if (label.startsWith("ANDAMENTO ")) {
      kind = "andamento";
      areaText = label.slice("ANDAMENTO ".length);
    } else if (label.startsWith("ATAS CONCLUIDAS ")) {
      kind = "concluidas";
      areaText = label.slice("ATAS CONCLUIDAS ".length);
    } else if (label.startsWith("ATA CONCLUIDA ")) {
      kind = "concluidas";
      areaText = label.slice("ATA CONCLUIDA ".length);
    } else if (label.startsWith("ATA ")) {
      // Estrutura nova: ATA INDIRETOS | ATA DIRETOS | ATA CAPEX.
      kind = "concluidas";
      areaText = label.slice("ATA ".length);
    }
    const area = kind ? isArea(areaText) : null;
    return area && kind ? { area, kind } : null;
  }

  function numericAt(matrix: unknown[][], row: number, column: number): number | null {
    // A posição de cada área é significativa na estrutura vertical. Não
    // procurar números em colunas vizinhas: isso desloca CAPEX/DIRETOS e pode
    // transformar o TOTAL de uma área em valor de todas as áreas.
    return integerValue(matrix[row]?.[column]);
  }

  function verticalPair(matrix: unknown[][], headerRow: number, column: number): { atas: number | null; itens: number | null } {
    let atas: number | null = null;
    let itens: number | null = null;
    const end = Math.min(matrix.length, headerRow + 8);
    for (let r = headerRow + 1; r < end; r += 1) {
      const label = exact(matrix[r]?.[column]);
      if (label === "QTD ATA" || label === "QTD ATAS") {
        atas = numericAt(matrix, r + 1, column) ?? atas;
      }
      if (label === "QTD ITEM" || label === "QTD ITENS") {
        itens = numericAt(matrix, r + 1, column) ?? itens;
      }
      // O quadro termina quando as duas métricas foram lidas ou numa linha em
      // branco depois de já encontrar a primeira; sem isso a janela alcançaria
      // uma tabela seguinte e trocaria o valor lido.
      if (atas !== null && itens !== null) break;
      if ((atas !== null || itens !== null) && isBlank(matrix[r])) break;
      // O próximo quadro começa antes de outra métrica ser encontrada.
      if (r > headerRow + 1 && headerInfo(matrix[r]?.[column])) break;
    }
    return { atas, itens };
  }

  function widePair(matrix: unknown[][], headerRow: number, column: number, nextAreaColumn: number): { atas: number | null; itens: number | null } {
    const limit = Math.min(nextAreaColumn < 0 ? matrix[headerRow]?.length ?? column + 3 : nextAreaColumn, column + 4);
    let atasCol = -1;
    let itensCol = -1;
    for (let c = column + 1; c < limit; c += 1) {
      const label = exact(matrix[headerRow]?.[c]);
      if (label === "QTD ATA" || label === "QTD ATAS") atasCol = c;
      if (label === "QTD ITEM" || label === "QTD ITENS") itensCol = c;
    }
    // Só usar o caminho wide quando o próprio cabeçalho declara as métricas.
    // Sem isso, linhas de uma tabela seguinte não podem preencher o bloco.
    if (atasCol < 0 && itensCol < 0) return { atas: null, itens: null };
    for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 4); r += 1) {
      const row = matrix[r] ?? [];
      const atas = atasCol >= 0 ? integerValue(row[atasCol]) : null;
      const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
      if (atas !== null || itens !== null) return { atas, itens };
    }
    return { atas: null, itens: null };
  }

  for (const sheet of sheets) {
    const matrix = sheet.matrix;

    // Quadros de evolução concluída, vencidas e a vencer. A estrutura nova é
    // vertical (QTD ATA, valor, QTD ITENS, valor); a leitura wide antiga também
    // é aceita para não quebrar snapshots históricos.
    for (let headerRow = 0; headerRow < matrix.length; headerRow += 1) {
      const header = matrix[headerRow] ?? [];
      const areaColumns: Array<{ area: SnapshotArea; column: number; kind: EvolutionKind }> = [];
      header.forEach((value, column) => {
        const info = headerInfo(value);
        if (info) areaColumns.push({ ...info, column });
      });
      if (areaColumns.length === 0) continue;

      const areaColumnsByKind = new Map<EvolutionKind, Array<{ area: SnapshotArea; column: number }>>();
      for (const item of areaColumns) {
        const list = areaColumnsByKind.get(item.kind) ?? [];
        list.push({ area: item.area, column: item.column });
        areaColumnsByKind.set(item.kind, list);
      }
      const concludedCandidate: Record<SnapshotArea, { atas: number | null; itens: number | null }> = {
        INDIRETOS: { atas: null, itens: null },
        DIRETOS: { atas: null, itens: null },
        CAPEX: { atas: null, itens: null },
      };
      let concludedCount = 0;
      for (const [kind, columns] of areaColumnsByKind) {
        for (let index = 0; index < columns.length; index += 1) {
          const item = columns[index];
          const nextColumn = columns[index + 1]?.column ?? -1;
          const vertical = verticalPair(matrix, headerRow, item.column);
          const wide = widePair(matrix, headerRow, item.column, nextColumn);
          const atas = vertical.atas ?? wide.atas;
          const itens = vertical.itens ?? wide.itens;
          if (kind === "concluidas") {
            concludedCandidate[item.area] = { atas, itens };
            if (atas !== null || itens !== null) concludedCount += 1;
          } else if (atas !== null || itens !== null) {
            // Vencidas e a vencer têm cabeçalhos próprios; não podem sobrescrever
            // a coluna de concluídas nem ser confundidas com andamento.
            setEvolutionPair(payload.evolucao[item.area], kind, atas, itens);
            found = true;
          }
        }
      }
      if (concludedCount > 0) {
        const context = previousContext(matrix, headerRow, 12);
        const contextScore = context.some((value) => value.includes("STATUS ATUAL") || value.includes("EVOLUCAO POR AREA"))
          ? 3
          : context.some((value) => value.includes("ANDAMENTO")) ? -3 : 0;
        const score = concludedCount * 10 + contextScore;
        if (score > bestConcludedScore) {
          bestConcludedScore = score;
          bestConcluded = concludedCandidate;
        }
      }
    }

    // Quadros de uma única métrica: ITEM SALDO V e ITEM S/SALDO. Eles podem
    // estar em uma linha horizontal ou como título seguido de uma linha de valores.
    for (let r = 0; r < matrix.length; r += 1) {
      const row = matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const label = exact(row[c]);
        const saldo = label.match(/^ITEM SALDO V (INDIRETOS|DIRETOS|CAPEX)$/);
        const semSaldo = label.match(/^ITEM (?:S\/SALDO|SEM SALDO) (INDIRETOS|DIRETOS|CAPEX)$/);
        const area = saldo ? (saldo[1] as SnapshotArea) : semSaldo ? (semSaldo[1] as SnapshotArea) : null;
        if (!area) continue;
        const value = firstNumberForLabel(matrix, r, c);
        if (value === null) continue;
        if (saldo) payload.evolucao[area].saldoItens = Math.round(value);
        if (semSaldo) payload.evolucao[area].semSaldoItens = Math.round(value);
        found = true;
      }
    }

    // “EVOLUÇÃO POR ÁREA (EM ANDAMENTO)” é uma tabela separada com
    // Rótulos de Linha | QTD ATAS | QTD ITENS. Não confundir com os pivôs de
    // previsão, que têm Rótulos de Linha, mas não possuem linhas de áreas.
    const simpleHeaders = findHeaderRows(matrix, (row) => rowHas(row, ["Rótulos de Linha", "QTD ATAS", "QTD ITENS"]));
    for (const headerRow of simpleHeaders) {
      const context = previousContext(matrix, headerRow, 10);
      if (context.some((value) => value.includes("PREVISAO DE CONCLUSAO"))) continue;
      const explicit = context.some((value) => value.includes("EM ANDAMENTO"));
      if (explicitAndamentoTableFound && !explicit) continue;
      const header = matrix[headerRow] ?? [];
      const labelCol = columnIndex(header, (value) => value === "ROTULOS DE LINHA");
      const atasCol = columnIndex(header, (value) => value === "QTD ATAS");
      const itensCol = columnIndex(header, (value) => value === "QTD ITENS");
      if (labelCol < 0 || atasCol < 0 || itensCol < 0) continue;
      let tableFound = false;
      for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 12); r += 1) {
        const row = matrix[r] ?? [];
        if (isBlank(row)) break;
        const area = isArea(row[labelCol]);
        if (!area) continue;
        const atas = integerValue(row[atasCol]);
        const itens = integerValue(row[itensCol]);
        if (atas === null && itens === null) continue;
        setEvolutionPair(payload.evolucao[area], "andamento", atas, itens);
        tableFound = true;
        found = true;
      }
      if (tableFound && explicit) explicitAndamentoTableFound = true;
    }
  }
  if (bestConcluded) {
    for (const area of SNAPSHOT_AREAS) {
      setEvolutionPair(payload.evolucao[area], "concluidas", bestConcluded[area].atas, bestConcluded[area].itens);
    }
    found = true;
  }
  if (found) addFound(payload, "evolucao");
}

function evolutionPairFromCell(value: unknown): { atas: number | null; itens: number | null } {
  const text = cellText(value);
  if (!text) return { atas: null, itens: null };
  const atasMatch = text.match(/(-?\d[\d.\s]*(?:,\d+)?)\s*ATAS?/i);
  const itensMatch = text.match(/(-?\d[\d.\s]*(?:,\d+)?)\s*ITENS?/i);
  let atas = atasMatch ? integerValue(atasMatch[1]) : null;
  let itens = itensMatch ? integerValue(itensMatch[1]) : null;
  if (atas === null || itens === null) {
    const numbers = text.match(/-?\d[\d.\s]*(?:,\d+)?/g) ?? [];
    if (atas === null && numbers[0]) atas = integerValue(numbers[0]);
    if (itens === null && numbers[1]) itens = integerValue(numbers[1]);
  }
  return { atas, itens };
}

/**
 * Estrutura da tabela mostrada no Excel: uma linha por área e métricas em
 * células compostas, por exemplo “4 ATAS / 216 ITENS”. Ela não usa os títulos
 * horizontais “ATA CAPEX” da estrutura antiga, por isso é tratada
 * explicitamente antes de finalizar o snapshot.
 */
function extractEvolutionStatusTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type Candidate = Record<SnapshotArea, { atas: number | null; itens: number | null }>;
  let best: Candidate | null = null;
  let bestScore = -1;

  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const titleRows = findHeaderRows(matrix, (row) => row.some((value) => {
      const label = exact(value);
      return label.includes("EVOLUCAO POR AREA") && label.includes("STATUS ATUAL");
    }));
    for (const titleRow of titleRows) {
      let headerRow = -1;
      for (let rowIndex = titleRow + 1; rowIndex < Math.min(matrix.length, titleRow + 8); rowIndex += 1) {
        const values = matrix[rowIndex] ?? [];
        const labels = values.map(exact);
        const hasArea = labels.some((label) => label === "AREAS" || label === "AREA");
        const hasConcluded = labels.some((label) => label.includes("CONCLUID") && label.includes("ATAS"));
        const hasVencidas = labels.some((label) => label.includes("VENCIDAS"));
        const hasAVencer = labels.some((label) => label.includes("A VENCER"));
        if (hasArea && hasConcluded && hasVencidas && hasAVencer) {
          headerRow = rowIndex;
          break;
        }
      }
      if (headerRow < 0) continue;

      const header = matrix[headerRow] ?? [];
      const columnWith = (...parts: string[]) => header.findIndex((value) => {
        const label = exact(value);
        return parts.every((part) => label.includes(part));
      });
      const areaCol = header.findIndex((value) => {
        const label = exact(value);
        return label === "AREAS" || label === "AREA";
      });
      const concludedCol = columnWith("CONCLUID", "ATAS");
      const andamentoCol = columnWith("ANDAMENTO");
      const saldoCol = columnWith("ITENS COM", "SALDO");
      const semSaldoCol = columnWith("ITENS SEM", "SALDO");
      const vencidasCol = columnWith("VENCIDAS");
      const aVencerCol = columnWith("A VENCER");
      if (areaCol < 0 || concludedCol < 0) continue;

      const candidate: Candidate = makeAreaRecord(() => ({ atas: null, itens: null }));
      let score = 0;
      for (let rowIndex = headerRow + 1; rowIndex < Math.min(matrix.length, headerRow + 12); rowIndex += 1) {
        const row = matrix[rowIndex] ?? [];
        if (isBlank(row)) break;
        const area = isArea(row[areaCol]) ?? row.slice(0, 3).map(isArea).find(Boolean) ?? null;
        if (!area) continue;
        const pair = evolutionPairFromCell(row[concludedCol]);
        if (pair.atas !== null || pair.itens !== null) {
          candidate[area] = pair;
          score += 10;
        }
        // Só preenche outras métricas quando a tabela realmente traz números;
        // a célula “ND SEM CAMPO” não deve substituir o quadro separado de
        // EM ANDAMENTO já extraído da planilha.
        const andamento = andamentoCol >= 0 ? evolutionPairFromCell(row[andamentoCol]) : { atas: null, itens: null };
        if (andamento.atas !== null || andamento.itens !== null) setEvolutionPair(payload.evolucao[area], "andamento", andamento.atas, andamento.itens);
        const saldo = saldoCol >= 0 ? integerValue(row[saldoCol]) : null;
        if (saldo !== null) payload.evolucao[area].saldoItens = saldo;
        const semSaldo = semSaldoCol >= 0 ? integerValue(row[semSaldoCol]) : null;
        if (semSaldo !== null) payload.evolucao[area].semSaldoItens = semSaldo;
        const vencidas = vencidasCol >= 0 ? evolutionPairFromCell(row[vencidasCol]) : { atas: null, itens: null };
        if (vencidas.atas !== null || vencidas.itens !== null) setEvolutionPair(payload.evolucao[area], "vencidas", vencidas.atas, vencidas.itens);
        const aVencer = aVencerCol >= 0 ? evolutionPairFromCell(row[aVencerCol]) : { atas: null, itens: null };
        if (aVencer.atas !== null || aVencer.itens !== null) setEvolutionPair(payload.evolucao[area], "aVencer", aVencer.atas, aVencer.itens);
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }

  if (best && bestScore > 0) {
    for (const area of SNAPSHOT_AREAS) {
      const pair = best[area];
      if (pair.atas !== null || pair.itens !== null) setEvolutionPair(payload.evolucao[area], "concluidas", pair.atas, pair.itens);
    }
    addFound(payload, "evolucao");
  }
}

/* ------------------------- faixas de previsão -------------------- */

function bandFromLabel(value: unknown): ForecastBand | null {
  const label = exact(value);
  // exact() já remove os acentos; aceitar também variantes com “até”/“ate”
  // e pequenas diferenças de singular/plural da tabela dinâmica.
  if (/\bATE\s*15\s*DIAS?\b/.test(label)) return "ate_15";
  if (/\bATE\s*30\s*DIAS?\b/.test(label)) return "ate_30";
  if (/\bATE\s*60\s*DIAS?\b/.test(label)) return "ate_60";
  if (label.includes("PREVISAO VENCIDA") || label === "VENCIDA" || label === "VENCIDAS") return "vencidas";
  if (label.includes("ACIMA DE 60 DIAS") || label.includes("MAIS DE 60 DIAS")) return "acima_60";
  if (label === "CANCELADO" || label === "CANCELADOS" || label === "CANCELADA" || label === "CANCELADAS") return "canceladas";
  if (label === "FINALIZADO" || label === "FINALIZADOS" || label === "FINALIZADA" || label === "FINALIZADAS") return "finalizadas";
  return null;
}

function bandFromDays(days: number): ForecastBand {
  if (days < 0) return "vencidas";
  if (days <= 15) return "ate_15";
  if (days <= 30) return "ate_30";
  if (days <= 60) return "ate_60";
  return "acima_60";
}

/** Dias entre a data-base e a previsão. A data-base deve ser a referência
 * da planilha, para que o cruzamento por comprador caia na mesma faixa do
 * pivô, mesmo quando a importação ocorrer dias depois. */
function daysUntilISO(iso: string, baseISO: string | null = null): number {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const base = baseISO ? baseISO.split("-").map(Number) : [];
  const now = new Date();
  const today = base.length === 3 && base.every((part) => Number.isFinite(part) && part > 0)
    ? new Date(base[0], base[1] - 1, base[2])
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const MONTH_NUMBERS: Record<string, number> = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
};

function monthlyLabel(value: unknown, referenceDate: string | null): { label: string; month: number | null; year: number | null } | null {
  const label = exact(value);
  if (!label) return null;
  if (label.includes("VENCIDA") || label.includes("SEM PREVISAO") || label.includes("SEM PREVISÃO")) {
    return { label: cellText(value), month: null, year: null };
  }
  const monthName = Object.keys(MONTH_NUMBERS).find((name) => new RegExp(`\\b${name}\\b`).test(label));
  if (!monthName) return null;
  const yearMatch = label.match(/\b(20\d{2})\b/);
  const reference = referenceDate
    ? new Date(Number(referenceDate.slice(0, 4)), Number(referenceDate.slice(5, 7)) - 1, 1)
    : new Date();
  const referenceYear = reference.getFullYear();
  const referenceMonth = reference.getMonth() + 1;
  const month = MONTH_NUMBERS[monthName];
  // O Excel muitas vezes traz somente “Janeiro”, sem ano. O pivô é de
  // previsões futuras: um mês numericamente anterior ao mês de referência
  // atravessou dezembro e pertence ao ano seguinte (inclusive quando a tabela
  // lista mais de dois meses à frente).
  const inferredYear = month < referenceMonth ? referenceYear + 1 : referenceYear;
  return {
    label: cellText(value),
    month,
    year: yearMatch ? Number(yearMatch[1]) : inferredYear,
  };
}

/**
 * Extrai o pivô vertical “PREVISÃO DE CONCLUSÃO POR MÊS”. A tabela de origem
 * possui uma linha de grupos (CAPEX/DIRETOS/INDIRETOS), outra linha com pares
 * QTD ATAS/QTD ITENS e uma linha por mês. O pareamento é feito pela ordem dos
 * grupos, como no Excel, para não deslocar os números entre áreas.
 */
function extractMonthlyForecastTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type Candidate = Record<SnapshotArea, SnapshotMonthlyForecastArea>;
  let best: Candidate | null = null;
  let bestScore = -1;

  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const titleRows = findHeaderRows(matrix, (row) => row.some((value) => exact(value).includes("PREVISAO DE CONCLUSAO POR MES")));
    for (const titleRow of titleRows) {
      let quantityHeaderIndex = -1;
      for (let candidate = titleRow + 1; candidate < Math.min(matrix.length, titleRow + 16); candidate += 1) {
        const values = matrix[candidate] ?? [];
        const atasCount = values.filter((value) => exact(value) === "QTD ATAS").length;
        const itensCount = values.filter((value) => exact(value) === "QTD ITENS").length;
        if (atasCount >= 2 && itensCount >= 2) {
          quantityHeaderIndex = candidate;
          break;
        }
      }
      if (quantityHeaderIndex < 0) continue;

      let groupRowIndex = -1;
      for (let candidate = quantityHeaderIndex - 1; candidate > titleRow; candidate -= 1) {
        const areas = (matrix[candidate] ?? []).filter((value) => Boolean(isArea(value)));
        if (areas.length >= 2) {
          groupRowIndex = candidate;
          break;
        }
      }
      if (groupRowIndex < 0) continue;

      const groupRow = matrix[groupRowIndex] ?? [];
      const groups = groupRow
        .map((value, column) => ({ area: isArea(value), column }))
        .filter((item): item is { area: SnapshotArea; column: number } => Boolean(item.area))
        .sort((a, b) => a.column - b.column);
      const quantityHeader = matrix[quantityHeaderIndex] ?? [];
      const qtdAtasColumns = quantityHeader
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value === "QTD ATAS")
        .map((item) => item.column);
      const qtdItensColumns = quantityHeader
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value === "QTD ITENS")
        .map((item) => item.column);
      if (groups.length === 0 || qtdAtasColumns.length === 0 || qtdItensColumns.length === 0) continue;

      const labelCol = quantityHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA") >= 0
        ? quantityHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA")
        : 0;
      const candidate: Candidate = makeMonthlyForecastRecord();
      let score = 0;
      for (let rowIndex = quantityHeaderIndex + 1; rowIndex < Math.min(matrix.length, quantityHeaderIndex + 80); rowIndex += 1) {
        const row = matrix[rowIndex] ?? [];
        if (isBlank(row)) break;
        const parsedLabel = monthlyLabel(row[labelCol], payload.referenceDate);
        if (!parsedLabel) continue;
        for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
          const atasCol = qtdAtasColumns[groupIndex];
          const itensCol = qtdItensColumns[groupIndex] ?? (atasCol !== undefined ? atasCol + 1 : -1);
          const atas = atasCol === undefined ? null : integerValue(row[atasCol]);
          const itens = itensCol < 0 ? null : integerValue(row[itensCol]);
          if (atas === null && itens === null) continue;
          const area = groups[groupIndex].area;
          const existing = candidate[area].rows.find((item) => (
            item.month === parsedLabel.month && item.year === parsedLabel.year && item.label === parsedLabel.label
          ));
          if (existing) {
            existing.atas = (existing.atas ?? 0) + (atas ?? 0);
            existing.itens = (existing.itens ?? 0) + (itens ?? 0);
          } else {
            candidate[area].rows.push({ ...parsedLabel, atas, itens });
          }
          score += 1;
        }
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }

  if (best && bestScore > 0) {
    payload.previsaoMeses = best;
    addFound(payload, "previsao-meses");
  }
}

function extractForecastBandTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const titleRows = findHeaderRows(matrix, (row) => row.some((value) => exact(value).includes("PREVISAO DE CONCLUSAO POR FAIXA")));
    for (const titleRow of titleRows) {
      for (let areaRowIndex = titleRow + 1; areaRowIndex < Math.min(matrix.length, titleRow + 12); areaRowIndex += 1) {
        const areaRow = matrix[areaRowIndex] ?? [];
        const areaColumns = areaRow
          .map((value, column) => ({ area: isArea(value), column }))
          .filter((item): item is { area: SnapshotArea; column: number } => Boolean(item.area));
        if (areaColumns.length === 0) continue;

        let quantityHeaderIndex = -1;
        for (let candidate = areaRowIndex; candidate <= Math.min(matrix.length - 1, areaRowIndex + 3); candidate += 1) {
          if ((matrix[candidate] ?? []).some((value) => exact(value) === "QTD ATAS")) {
            quantityHeaderIndex = candidate;
            break;
          }
        }
        if (quantityHeaderIndex < 0) continue;

        const labelHeader = matrix[quantityHeaderIndex] ?? [];
        const labelCol = labelHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA") >= 0
          ? labelHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA")
          : 0;
        for (let r = quantityHeaderIndex + 1; r < Math.min(matrix.length, quantityHeaderIndex + 30); r += 1) {
          const row = matrix[r] ?? [];
          if (isBlank(row)) break;
          // A tabela pode deslocar “Rótulos de Linha” uma coluna; procure a
          // faixa na primeira coluna útil, não apenas em row[0].
          let band: ForecastBand | null = bandFromLabel(row[labelCol]);
          let actualLabelCol = labelCol;
          if (!band) {
            for (let c = 0; c < Math.min(row.length, 3); c += 1) {
              const candidate = bandFromLabel(row[c]);
              if (candidate) {
                band = candidate;
                actualLabelCol = c;
                break;
              }
            }
          }
          if (!band) continue;
          const areaColumnsOrdered = [...areaColumns].sort((a, b) => a.column - b.column);
          const qtdAtasColumns = labelHeader
            .map((value, column) => ({ value: exact(value), column }))
            .filter((item) => item.value === "QTD ATAS")
            .map((item) => item.column);
          for (const item of areaColumnsOrdered) {
            // Em células mescladas o rótulo CAPEX pode estar uma coluna antes
            // da primeira QTD ATAS (ou até na coluna do rótulo da linha). O
            // pareamento por ordem dos grupos é estável e evita deslocar os
            // itens de uma área para a próxima.
            const areaIndex = areaColumnsOrdered.findIndex((candidate) => candidate.column === item.column);
            let atasCol = qtdAtasColumns[areaIndex] ?? item.column;
            let itensCol = atasCol + 1;
            const atas = integerValue(row[atasCol]);
            const itens = integerValue(row[itensCol]);
            if (atas !== null || itens !== null) {
              const target = payload.previsoes[band][item.area];
              target.atas = atas;
              target.itens = itens;
              found = true;
            }
          }
          void actualLabelCol;
        }
        // Um título de faixa corresponde a um único pivot; não interpretar a
        // tabela “por mês” que vem mais abaixo como se fosse outra faixa.
        break;
      }
    }
  }
  if (found) addFound(payload, "previsao-faixas");
}

/** Fallback para exports em que o SheetJS transforma os cabeçalhos mesclados
 * em “CAPEX QTD ATAS”, “DIRETOS QTD ATAS” etc. sem manter a linha de grupos. */
function extractForecastBandFallback(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] ?? [];
      let band: ForecastBand | null = null;
      for (let c = 0; c < Math.min(row.length, 4); c += 1) {
        band = bandFromLabel(row[c]);
        if (band) break;
      }
      if (!band) continue;

      let quantityHeaderIndex = -1;
      for (let h = rowIndex - 1; h >= Math.max(0, rowIndex - 8); h -= 1) {
        const values = matrix[h] ?? [];
        if (values.filter((value) => exact(value) === "QTD ATAS").length > 0
          && values.filter((value) => exact(value) === "QTD ITENS").length > 0) {
          quantityHeaderIndex = h;
          break;
        }
      }
      if (quantityHeaderIndex < 0) continue;
      const quantityHeader = matrix[quantityHeaderIndex] ?? [];

      const combinedColumns = new Map<SnapshotArea, { atas: number; itens: number }>();
      for (let c = 0; c < quantityHeader.length; c += 1) {
        const label = exact(quantityHeader[c]);
        for (const area of SNAPSHOT_AREAS) {
          if (!label.includes(area)) continue;
          const current = combinedColumns.get(area) ?? { atas: -1, itens: -1 };
          if (label.includes("QTD ATA")) current.atas = c;
          if (label.includes("QTD ITEM")) current.itens = c;
          combinedColumns.set(area, current);
        }
      }

      // Caso clássico do pivot: uma linha de grupos CAPEX/DIRETOS/INDIRETOS
      // acima de uma linha que repete QTD ATAS/QTD ITENS.
      const groupRowIndex = (() => {
        for (let h = quantityHeaderIndex - 1; h >= Math.max(0, quantityHeaderIndex - 4); h -= 1) {
          const count = (matrix[h] ?? []).filter((value) => Boolean(isArea(value))).length;
          if (count >= 2) return h;
        }
        return -1;
      })();
      if (groupRowIndex >= 0) {
        const groupRow = matrix[groupRowIndex] ?? [];
        const groups = groupRow
          .map((value, column) => ({ area: isArea(value), column }))
          .filter((item): item is { area: SnapshotArea; column: number } => Boolean(item.area))
          .sort((a, b) => a.column - b.column);
        const qtdAtasColumns = quantityHeader
          .map((value, column) => ({ value: exact(value), column }))
          .filter((item) => item.value === "QTD ATAS")
          .map((item) => item.column);
        for (let i = 0; i < groups.length; i += 1) {
          const current = combinedColumns.get(groups[i].area) ?? { atas: -1, itens: -1 };
          if (qtdAtasColumns[i] !== undefined) {
            current.atas = qtdAtasColumns[i];
            current.itens = qtdAtasColumns[i] + 1;
          }
          combinedColumns.set(groups[i].area, current);
        }
      }

      for (const area of SNAPSHOT_AREAS) {
        const columns = combinedColumns.get(area);
        if (!columns) continue;
        const target = payload.previsoes[band][area];
        const atas = columns.atas >= 0 ? integerValue(row[columns.atas]) : null;
        const itens = columns.itens >= 0 ? integerValue(row[columns.itens]) : null;
        if (target.atas === null && atas !== null) target.atas = atas;
        if (target.itens === null && itens !== null) target.itens = itens;
        if (atas !== null || itens !== null) found = true;
      }
    }
  }
  if (found) addFound(payload, "previsao-faixas");
}

function findCountColumn(header: unknown[], aliases: string[]): number {
  const normalized = aliases.map(exact);
  return header.findIndex((value) => normalized.includes(exact(value)));
}

function extractForecastRows(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  const entryTotals = new Map<string, { atas: number; itens: number }>();
  for (const sheet of sheets) {
    const rows = findHeaderRows(sheet.matrix, (row) => rowHas(row, ["COMPRADOR", "AREA", "PRAZO CONCLUSAO"]));
    for (const headerRow of rows) {
      const header = sheet.matrix[headerRow] ?? [];
      const buyerCol = columnIndex(header, (value) => value === "COMPRADOR");
      const areaCol = columnIndex(header, (value) => value === "AREA");
      const deadlineCol = columnIndex(header, (value) => value === "PRAZO CONCLUSAO");
      const atasCol = findCountColumn(header, ["QTD ATAS", "ATAS", "QTD ATA"]);
      const itensCol = findCountColumn(header, ["QTD ITENS", "ITENS", "QTD ITEM"]);
      if (buyerCol < 0 || areaCol < 0 || deadlineCol < 0) continue;
      // A base operacional pode conter linhas vazias entre registros. Elas são
      // separadores e não encerram a leitura imediatamente; só param após uma
      // sequência longa de linhas vazias.
      let blankRun = 0;
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 10000); r += 1) {
        const row = sheet.matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const buyer = cellText(row[buyerCol]);
        const area = isArea(row[areaCol]);
        const deadlineText = cellText(row[deadlineCol]);
        if (!buyer || !area || !deadlineText) continue;

        let iso: string | null = null;
        const date = parseDateBR(row[deadlineCol], "PRAZO CONCLUSAO");
        if (date.iso) iso = date.iso;
        const bandByText = bandFromLabel(deadlineText);
        const band = bandByText ?? (iso ? bandFromDays(daysUntilISO(iso, payload.referenceDate)) : null);
        if (!band) continue;
        const atas = atasCol >= 0 ? integerValue(row[atasCol]) ?? 1 : 1;
        const itens = itensCol >= 0 ? integerValue(row[itensCol]) ?? 0 : 0;
        const target = payload.previsoes[band][area];
        const key = `${area}\u0000${band}`;
        const totals = entryTotals.get(key) ?? { atas: 0, itens: 0 };
        totals.atas += atas;
        totals.itens += itens;
        entryTotals.set(key, totals);
        const buyerKey = `${buyer}\u0000${iso ?? deadlineText}`;
        const existing = target.buyers.find((item) => `${item.name}\u0000${item.prazoConclusao ?? ""}` === buyerKey);
        if (existing) {
          existing.atas = (existing.atas ?? 0) + atas;
          existing.itens = (existing.itens ?? 0) + itens;
        } else {
          target.buyers.push({ name: buyer, atas, itens, prazoConclusao: iso ?? deadlineText });
        }
        found = true;
      }
    }
  }
  for (const [key, totals] of entryTotals) {
    const [area, band] = key.split("\u0000") as [SnapshotArea, ForecastBand];
    const target = payload.previsoes[band][area];
    if (target.atas === null) target.atas = totals.atas;
    if (target.itens === null) target.itens = totals.itens;
  }
  for (const band of FORECAST_BANDS) {
    for (const area of SNAPSHOT_AREAS) {
      payload.previsoes[band][area].buyers.sort((a, b) => (b.itens ?? 0) - (a.itens ?? 0) || (b.atas ?? 0) - (a.atas ?? 0));
    }
  }
  if (found) addFound(payload, "previsoes-cruzadas");
}

/* ----------------------- atas em andamento (geral) ----------------- */

/**
 * Card “ATAS EM ANDAMENTO (GERAL)” do resumo. Aceita rótulo seguido dos
 * cabeçalhos QTD ATAS/QTD ITENS, dois números na mesma linha ou uma célula
 * composta como “70 ATAS / 5000 ITENS”.
 */
function extractAndamentoGeral(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const row = matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const label = exact(row[c]).replace(/[()]/g, "").replace(/\s+/g, " ").trim();
        if (!/^ATAS? EM ANDAMENTO( GERAL)?$/.test(label)) continue;
        const pair = pairFromHeaders(matrix, r, c) ?? pairFromRow(row, c) ?? pairFromComposite(matrix, r, c);
        if (!pair) continue;
        payload.kpis.andamentoAtas = pair.atas;
        payload.kpis.andamentoItens = pair.itens;
        addFound(payload, "kpis-leitura");
        return;
      }
    }
  }
}

function pairFromHeaders(matrix: unknown[][], rowIndex: number, column: number): { atas: number | null; itens: number | null } | null {
  let atas: number | null = null;
  let itens: number | null = null;
  for (let r = rowIndex; r <= Math.min(matrix.length - 1, rowIndex + 4); r += 1) {
    const row = matrix[r] ?? [];
    for (let c = Math.max(0, column - 1); c <= Math.min(row.length - 1, column + 6); c += 1) {
      const label = exact(row[c]);
      const isAtas = label === "QTD ATA" || label === "QTD ATAS";
      const isItens = label === "QTD ITEM" || label === "QTD ITENS";
      if (!isAtas && !isItens) continue;
      const value = integerValue(matrix[r + 1]?.[c]) ?? integerValue(row[c + 1]);
      if (value === null) continue;
      if (isAtas && atas === null) atas = value;
      if (isItens && itens === null) itens = value;
    }
  }
  return atas === null && itens === null ? null : { atas, itens };
}

function pairFromRow(row: unknown[], column: number): { atas: number | null; itens: number | null } | null {
  const numbers: number[] = [];
  for (let c = column + 1; c < row.length && numbers.length < 2; c += 1) {
    const text = cellText(row[c]);
    if (!text) continue;
    const value = integerValue(text);
    if (value === null) break;
    numbers.push(value);
  }
  return numbers.length === 2 ? { atas: numbers[0], itens: numbers[1] } : null;
}

function pairFromComposite(matrix: unknown[][], rowIndex: number, column: number): { atas: number | null; itens: number | null } | null {
  const candidates = [matrix[rowIndex]?.[column + 1], matrix[rowIndex + 1]?.[column], matrix[rowIndex]?.[column]];
  for (const candidate of candidates) {
    const text = exact(candidate);
    if (!/ATAS?/.test(text) || !/ITENS?/.test(text) || !/\d/.test(text)) continue;
    const pair = evolutionPairFromCell(candidate);
    if (pair.atas !== null || pair.itens !== null) return pair;
  }
  return null;
}

/* --------------------- fornecedor por contrato (SAP) --------------- */

/** Número de contrato só com dígitos; textos curtos não contam. */
function contractKey(value: unknown): string | null {
  const text = cellText(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

/** Remove código entre parênteses no fim do nome do fornecedor/comprador. */
function stripCode(value: string): string {
  return value.replace(/\s*\((?:[A-Z]{0,3}\s?\d{1,10})\)\s*$/i, "").trim();
}

function extractContratosFornecedores(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) =>
      rowHas(row, ["Contrato", "Fornecedor"])
      && (rowHas(row, ["Item"]) || rowHas(row, ["Material"]) || rowHas(row, ["Cód SAP"])),
    );
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const contratoCol = columnIndex(header, (value) => value === "CONTRATO");
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      if (contratoCol < 0 || fornecedorCol < 0) continue;
      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const key = contractKey(row[contratoCol]);
        const fornecedor = stripCode(cellText(row[fornecedorCol]));
        if (!key || !fornecedor) continue;
        if (!payload.fornecedoresPorContrato[key]) payload.fornecedoresPorContrato[key] = fornecedor;
        found = true;
      }
    }
  }
  if (found) addFound(payload, "contratos-fornecedores");
}

/* ---------------- atas concluídas (base de andamento) -------------- */

const CONCLUDED_STAGES = new Set(["FINALIZADO", "FINALIZADA", "FINALIZADOS", "FINALIZADAS", "CONCLUIDO", "CONCLUIDA", "CONCLUIDOS", "CONCLUIDAS"]);

function isContractHeader(value: string): boolean {
  const label = value.replace(/[.°º]/g, "").replace(/\s+/g, " ").trim();
  return /^(N|NO|NUM|NUMERO)?( DO| DE)?\s?CONTRATO( SAP)?$/.test(label);
}

function extractAtasConcluidas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) => rowHas(row, ["DESCRIÇÃO DOS LOTES ATAS", "ETAPA ATUAL"]));
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const descCol = columnIndex(header, (value) => value === "DESCRICAO DOS LOTES ATAS");
      const etapaCol = columnIndex(header, (value) => value === "ETAPA ATUAL");
      if (descCol < 0 || etapaCol < 0) continue;
      const itensCol = columnIndex(header, (value) => value === "QTD ITENS" || value === "QTD ITEM" || value === "QTD DE ITENS");
      const compradorCol = columnIndex(header, (value) => /^COMPRADOR\s?(\(A\)|A)?$/.test(value));
      const areaCol = columnIndex(header, (value) => value === "AREA");
      const contratoCol = columnIndex(header, isContractHeader);
      const valorCol = columnIndex(header, (value) => value === "ESTIMATIVA VALOR TOTAL" || value === "VALOR TOTAL" || value === "VALOR ESTIMADO");
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      found = true;
      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const etapa = cellText(row[etapaCol]);
        if (!CONCLUDED_STAGES.has(exact(etapa))) continue;
        const descricao = cellText(row[descCol]);
        if (!descricao) continue;
        const contrato = contratoCol >= 0 ? contractKey(row[contratoCol]) : null;
        const comprador = compradorCol >= 0 ? stripCode(cellText(row[compradorCol])) || null : null;
        const area = areaCol >= 0 ? isArea(row[areaCol]) : null;
        const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
        const valor = valorCol >= 0 ? numberValue(row[valorCol]) : null;
        const fornecedor = fornecedorCol >= 0 ? stripCode(cellText(row[fornecedorCol])) || null : null;
        const key = contrato ?? [exact(descricao), exact(comprador ?? ""), area ?? ""].join("|");
        if (payload.atasConcluidas.some((item) => item.key === key)) continue;
        payload.atasConcluidas.push({ key, descricao, contrato, fornecedor, itens, comprador, area, etapa, valor });
      }
    }
  }
  if (found) addFound(payload, "atas-concluidas");
}

/* ------------------- status das atas por área (aba) ---------------- */

const STATUS_TILES: Record<string, "total" | "vigentes" | "vencidas" | "ate15" | "de16a30" | "aRenovar" | "totalRenovar" | "emAndamento"> = {
  TOTAL: "total",
  "TOTAL DE ATAS": "total",
  "TOTAL A RENOVAR": "totalRenovar",
  "TOTAL RENOVAR": "totalRenovar",
  VIGENTES: "vigentes",
  VIGENTE: "vigentes",
  VENCIDAS: "vencidas",
  VENCIDA: "vencidas",
  "ATE 15 DIAS": "ate15",
  "ATE 15": "ate15",
  "16 A 30 DIAS": "de16a30",
  "DE 16 A 30 DIAS": "de16a30",
  "16 A 30": "de16a30",
  "A RENOVAR": "aRenovar",
  "EM ANDAMENTO": "emAndamento",
  ANDAMENTO: "emAndamento",
};

function tileKeyOf(label: string) {
  return STATUS_TILES[label.replace(/\s+/g, " ").trim()] ?? null;
}

function isBuyerHeader(value: string): boolean {
  return /^COMPRADOR\s?(\(A\)|A|\(A\)S|ES)?$/.test(value);
}

function parseRenovacaoBanner(row: unknown[]): SnapshotStatusRenovacao | null {
  const cells = row.map(cellText).filter(Boolean);
  const normalized = exact(cells.join(" | "));
  if (!normalized.includes("RENOVACAO EM ANDAMENTO")) return null;
  const texto = cells.join(" | ");
  const contrato = texto.match(/\b\d{6,}\b/)?.[0] ?? null;
  const rawDate = texto.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/)?.[0] ?? null;
  const vencimento = rawDate ? parseDateBR(rawDate, "Vencimento").iso : null;
  const comprador = cells
    .flatMap((cell) => cell.split("|"))
    .map((cell) => cell.trim())
    .find((cell) => cell
      && !exact(cell).includes("RENOVACAO EM ANDAMENTO")
      && !exact(cell).includes("VENCIMENTO")
      && !/^\d{6,}$/.test(cell)
      && !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cell)) ?? null;
  return { contrato, comprador, vencimento, texto };
}

/**
 * No Excel os cards podem estar em células mescladas e a linha dos rótulos
 * pode ficar separada da linha dos números por uma ou mais linhas formatadas.
 * Procura primeiro na mesma coluna e depois nas colunas vizinhas do mesmo
 * cartão, sem atravessar a faixa do bloco.
 */
function statusTileValue(matrix: unknown[][], rowIndex: number, column: number, start: number, end: number): number | null {
  const rows: number[] = [];
  for (let distance = 1; distance <= 4; distance += 1) {
    if (rowIndex - distance >= start) rows.push(rowIndex - distance);
    if (rowIndex + distance < end) rows.push(rowIndex + distance);
  }
  for (const row of rows) {
    const direct = integerValue(matrix[row]?.[column]);
    if (direct !== null) return direct;
    for (let offset = 1; offset <= 3; offset += 1) {
      const left = integerValue(matrix[row]?.[column - offset]);
      if (left !== null) return left;
      const right = integerValue(matrix[row]?.[column + offset]);
      if (right !== null) return right;
    }
  }
  return null;
}

function emptyStatusArea(area: SnapshotArea): SnapshotStatusAtasArea {
  return {
    area,
    layout: "atas",
    baseDate: null,
    titulo: null,
    subtitulo: null,
    total: null,
    vigentes: null,
    vencidas: null,
    ate15: null,
    de16a30: null,
    aRenovar: null,
    totalRenovar: null,
    emAndamento: null,
    prioridades: [],
    carteira: [],
    renovacaoEmAndamento: null,
    notas: [],
  };
}

function parseStatusBlock(matrix: unknown[][], area: SnapshotArea, start: number, end: number): SnapshotStatusAtasArea | null {
  const block = emptyStatusArea(area);
  let tiles = 0;
  let prioridadesHeader = -1;
  let carteiraHeader = -1;

  for (let r = start; r < end; r += 1) {
    const row = matrix[r] ?? [];
    const headerLike = row.some((value) => /^VIG\.?$|^VENC\.?$|CONTRATO/.test(exact(value)));
    for (let c = 0; c < row.length; c += 1) {
      const text = cellText(row[c]);
      if (!text) continue;
      const label = exact(text);
      const base = text.match(/BASE:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      if (base) block.baseDate = parseDateBR(base[1], "Base").iso ?? block.baseDate;
      if (label.includes("STATUS DAS ATAS") || label.includes("STATUS DE RENOVACOES")) {
        if (!block.titulo) block.titulo = text;
        if (label.includes("STATUS DE RENOVACOES")) block.layout = "renovacoes";
        continue;
      }
      if (base) {
        if (!block.subtitulo) block.subtitulo = text.split("|")[0].replace(/BASE:?.*$/i, "").trim() || null;
        continue;
      }
      if (!block.subtitulo && (label.includes("CARTEIRA") || label.includes("ALERTA") || label.includes("ATAS A RENOVAR"))) {
        block.subtitulo = text;
        continue;
      }
      const banner = parseRenovacaoBanner(row);
      if (banner) {
        block.renovacaoEmAndamento = banner;
        block.layout = "renovacoes";
        continue;
      }
      const tileKey = tileKeyOf(label);
      if (tileKey) {
        const nearby = statusTileValue(matrix, r, c, start, end);
        const value = nearby ?? (!headerLike ? integerValue(matrix[r + 1]?.[c]) : null);
        if (value !== null && block[tileKey] === null) {
          block[tileKey] = value;
          if (tileKey === "totalRenovar" || tileKey === "emAndamento") block.layout = "renovacoes";
          tiles += 1;
          continue;
        }
      } else {
        const single = label.match(/^(\d{1,5})\s+(.+)$/);
        const singleKey = single ? tileKeyOf(single[2]) : null;
        if (single && singleKey && block[singleKey] === null) {
          block[singleKey] = Number(single[1]);
          if (singleKey === "totalRenovar" || singleKey === "emAndamento") block.layout = "renovacoes";
          tiles += 1;
          continue;
        }
      }
      if (text.length > 12 && /VENCEM ENTRE|VENCIDAS?:|NOVO PROCESSO|CONTINUIDADE DA DEMANDA|ENCERRAD/.test(label) && block.notas.length < 6) {
        if (!block.notas.includes(text)) block.notas.push(text);
      }
    }

    if (prioridadesHeader < 0) {
      const contratoCol = columnIndex(row, (value) => value === "CONTRATO SAP" || value === "CONTRATO" || value === "CONTRATO (SAP)");
      if (contratoCol >= 0) {
        const vencCol = columnIndex(row, (value) => value === "VENCIMENTO" || value === "DATA DE VENCIMENTO" || value === "DATA VENCIMENTO" || value === "FIM VIGENCIA" || value === "FIM DA VIGENCIA");
        const compradorCol = row.findIndex((value, index) => index > contratoCol && isBuyerHeader(exact(value)));
        const situacaoCol = row.findIndex((value, index) => index > contratoCol && (exact(value) === "SITUACAO" || exact(value) === "STATUS"));
        prioridadesHeader = r;
        for (let dr = r + 1; dr < Math.min(end, r + 80); dr += 1) {
          const dataRow = matrix[dr] ?? [];
          const rowText = exact(dataRow.map(cellText).filter(Boolean).join(" | "));
          if (rowText.includes("RENOVACAO EM ANDAMENTO")) break;
          const rawContrato = cellText(dataRow[contratoCol]);
          const normalizedContrato = exact(rawContrato);
          if (!rawContrato || isBuyerHeader(normalizedContrato) || normalizedContrato.startsWith("TOTAL")) break;
          const contrato = contractKey(rawContrato) ?? rawContrato;
          const vencimentoRaw = vencCol >= 0 ? cellText(dataRow[vencCol]) : "";
          const vencimento = vencimentoRaw ? parseDateBR(vencimentoRaw, "Vencimento").iso : null;
          const comprador = compradorCol >= 0 ? stripCode(cellText(dataRow[compradorCol])) || null : null;
          const situacao = situacaoCol >= 0 ? cellText(dataRow[situacaoCol]) || null : null;
          block.prioridades.push({ contrato, vencimento, comprador, situacao });
        }
      }
    }

    if (carteiraHeader < 0) {
      const vigCol = columnIndex(row, (value) => /^VIG\.?$|^VIGENTES?$/.test(value));
      const vencidasCol = columnIndex(row, (value) => /^VENC\.?$|^VENCIDAS?$/.test(value));
      if (vigCol >= 0 && vencidasCol >= 0) {
        let compradorCol = -1;
        for (let c = vigCol - 1; c >= 0; c -= 1) {
          if (isBuyerHeader(exact(row[c]))) {
            compradorCol = c;
            break;
          }
        }
        if (compradorCol >= 0) {
          const renovarCol = columnIndex(row, (value) => value === "A RENOVAR" || value === "RENOVAR");
          const totalCol = row.findIndex((value, index) => index > vigCol && exact(value) === "TOTAL");
          carteiraHeader = r;
          for (let dr = r + 1; dr < Math.min(end, r + 80); dr += 1) {
            const dataRow = matrix[dr] ?? [];
            const comprador = stripCode(cellText(dataRow[compradorCol]));
            if (!comprador || /^TOTAL/.test(exact(comprador))) break;
            block.carteira.push({
              comprador,
              vigentes: integerValue(dataRow[vigCol]),
              vencidas: integerValue(dataRow[vencidasCol]),
              aRenovar: renovarCol >= 0 ? integerValue(dataRow[renovarCol]) : null,
              total: totalCol >= 0 ? integerValue(dataRow[totalCol]) : null,
            });
          }
        }
      }
    }
  }

  const tables = block.prioridades.length + block.carteira.length;
  const accepted = tiles >= 2 || (Boolean(block.titulo) && (tiles > 0 || tables > 0));
  if (!accepted) return null;
  block.prioridades.sort((a, b) => (a.vencimento ?? "9999").localeCompare(b.vencimento ?? "9999"));
  return block;
}

function extractStatusAtas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  const preferredSheets = giroSheets(sheets, 5, "RENOVACOES");
  const sourceSheets = preferredSheets.length ? preferredSheets : sheets;
  for (const sheet of sourceSheets) {
    const matrix = sheet.matrix;
    const bands: Array<{ area: SnapshotArea; row: number }> = [];
    matrix.forEach((row, index) => {
      const cells = (row ?? []).map(cellText).filter(Boolean);
      if (cells.length === 0) return;
      const area = isArea(cells[0]);
      if (!area) return;
      if (cells.every((cell) => isArea(cell) === area)) bands.push({ area, row: index });
    });
    for (let b = 0; b < bands.length; b += 1) {
      const start = bands[b].row + 1;
      const end = bands[b + 1]?.row ?? matrix.length;
      const block = parseStatusBlock(matrix, bands[b].area, start, end);
      if (!block || payload.statusAtas[bands[b].area]) continue;
      payload.statusAtas[bands[b].area] = block;
      found = true;
    }
  }
  if (found) addFound(payload, "status-atas");
}

/* -------------------- abas GIRO consolidadas ---------------------- */

function rawCellLines(value: unknown): string[] {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function unitInteger(value: unknown, unit: "ATAS" | "ITENS"): number | null {
  const text = cellText(value);
  const match = text.match(new RegExp(`(-?\\d[\\d.\\s]*(?:,\\d+)?)\\s*${unit}`, "i"));
  return match ? integerValue(match[1]) : null;
}

function displayContract(value: unknown): string | null {
  const text = cellText(value).replace(/\s*\/\s*/g, " / ").trim();
  return text || null;
}

/** GIRO 02 — tabela já filtrada de atas concluídas. */
function extractGiro02Concluidas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 2, "CONCLUIDAS");
  if (!sources.length) return;
  let foundHeader = false;
  const parsed: SnapshotAtaConcluida[] = [];

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) =>
      rowHas(row, ["ATA / PROCESSO", "CONTRATO", "QTD. ITENS", "COMPRADOR(A)", "ÁREA"]),
    );
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const descCol = columnIndex(header, (value) => value === "ATA / PROCESSO" || value === "ATA/PROCESSO");
      const contratoCol = columnIndex(header, (value) => value === "CONTRATO");
      const itensCol = columnIndex(header, (value) => value === "QTD. ITENS" || value === "QTD ITENS");
      const compradorCol = columnIndex(header, (value) => value === "COMPRADOR(A)" || value === "COMPRADOR");
      const areaCol = columnIndex(header, (value) => value === "AREA");
      if (descCol < 0 || contratoCol < 0 || itensCol < 0 || compradorCol < 0 || areaCol < 0) continue;
      foundHeader = true;

      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        const rowText = exact(row.map(cellText).filter(Boolean).join(" | "));
        if (rowText.includes("ATA CONCLUIDA MAIS RECENTE")) break;
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 2) break;
          continue;
        }
        blankRun = 0;
        const descricao = cellText(row[descCol]);
        const contratoDisplay = displayContract(row[contratoCol]);
        if (!descricao || !contratoDisplay) continue;
        const comprador = stripCode(cellText(row[compradorCol])) || null;
        const area = isArea(row[areaCol]);
        const key = contractKey(row[contratoCol]) ?? `${exact(descricao)}|${exact(comprador ?? "")}|${area ?? ""}`;
        if (parsed.some((item) => item.key === key)) continue;
        parsed.push({
          key,
          descricao,
          contrato: contratoDisplay,
          fornecedor: null,
          itens: integerValue(row[itensCol]),
          comprador,
          area,
          etapa: "FINALIZADO",
          valor: null,
        });
      }
    }
  }

  if (foundHeader) {
    payload.atasConcluidas = parsed;
    addFound(payload, "atas-concluidas");
  }
}

/** GIRO 03 — valores contratados, saving e compradores do resumo. */
function extractGiro03Resumo(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 3, "RESUMO");
  if (!sources.length) return;
  let valuesFound = false;
  let savingFound = false;
  let buyersFound = false;

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const headerRow = matrix.findIndex((row) => row.some((value) => exact(value) === "AREAS") && row.some((value) => exact(value) === "VALOR CONTRATADO R$"));
    if (headerRow >= 0) {
      const header = matrix[headerRow] ?? [];
      const areaCol = columnIndex(header, (value) => value === "AREAS" || value === "AREA");
      const contractedCols = header
        .map((value, index) => ({ value: exact(value), index }))
        .filter((item) => item.value === "VALOR CONTRATADO R$")
        .map((item) => item.index);
      const histCol = header.findIndex((value) => exact(value).includes("SAVING HISTORICO"));
      const propCol = header.findIndex((value) => exact(value).includes("SAVING SOB PROPOSTA"));
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        const areaText = exact(row[areaCol]);
        const area = isArea(row[areaCol]);
        const isTotal = areaText === "TOTAL";
        if (!area && !isTotal) continue;
        const target = isTotal ? payload.savingTotal : payload.valueAreas[area!];
        const valor = contractedCols[0] === undefined ? null : numberValue(row[contractedCols[0]]);
        const valorSaving = contractedCols[1] === undefined ? null : numberValue(row[contractedCols[1]]);
        if (!isTotal && valor !== null) {
          target.valor = valor;
          target.valorSaving = valorSaving ?? valor;
          valuesFound = true;
        }
        if (valorSaving !== null || valor !== null) {
          target.valorSaving = valorSaving ?? target.valorSaving ?? valor;
          savingFound = true;
        }
        if (histCol >= 0) {
          const hist = row[histCol];
          const histValue = savingNumber(hist);
          const histPct = savingPercent(hist);
          if (histValue !== null) target.savingHist = histValue;
          if (histPct !== null) target.reducaoHistPct = histPct;
        }
        if (propCol >= 0) {
          const prop = row[propCol];
          const propValue = savingNumber(prop);
          const propPct = savingPercent(prop);
          if (propValue !== null) target.savingProp = propValue;
          if (propPct !== null) target.reducaoPropPct = propPct;
        }
      }
    }

    const distributionRows = matrix.filter((row) => row.some((value) => {
      const label = exact(value);
      return (label.includes("INDIRETOS") || label.includes("DIRETOS") || label.includes("CAPEX")) && label.includes("ATAS");
    }));
    const totalAtasArea: Record<SnapshotArea, number | null> = { INDIRETOS: null, DIRETOS: null, CAPEX: null };
    for (const row of distributionRows) {
      for (const cell of row) {
        const text = cellText(cell);
        const area = SNAPSHOT_AREAS.find((candidate) => exact(text).includes(candidate));
        const match = text.match(/(\d[\d.]*)\s+ATAS/i);
        if (area && match) totalAtasArea[area] = integerValue(match[1]);
      }
    }

    const titleRow = matrix.findIndex((row) => row.some((value) => exact(value).includes("TOP") && exact(value).includes("COMPRADORES")));
    if (titleRow >= 0) {
      const titleCols = (matrix[titleRow] ?? [])
        .map((value, index) => ({ value: exact(value), index }))
        .filter((item) => item.value.includes("TOP") && item.value.includes("COMPRADORES"));
      titleCols.forEach((title, position) => {
        const area = SNAPSHOT_AREAS[position];
        if (!area) return;
        const buyers: SnapshotBuyer[] = [];
        for (let r = titleRow + 1; r < Math.min(matrix.length, titleRow + 10); r += 1) {
          const text = cellText(matrix[r]?.[title.index]);
          const match = text.match(/^(.+?)\s+([\d.]+)\s+ITENS\s*\|\s*([\d.]+)\s+ATAS$/i);
          if (!match) continue;
          buyers.push({
            name: match[1].trim(),
            itens: integerValue(match[2]) ?? 0,
            atas: integerValue(match[3]) ?? 0,
            totalAtasArea: totalAtasArea[area],
          });
        }
        if (buyers.length > 0) {
          payload.topCompradores[area] = {
            area,
            totalAtasArea: totalAtasArea[area],
            topAtas: buyers.length,
            buyers,
          };
          buyersFound = true;
        }
      });
    }
  }

  if (valuesFound) addFound(payload, "valores-por-area");
  if (savingFound) addFound(payload, "saving");
  if (buyersFound) addFound(payload, "top-compradores");
}

/** GIRO 04 — fornecedores e evolução por área. */
function extractGiro04Evolucao(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 4, "EVOLUCAO");
  if (!sources.length) return;
  let suppliersFound = false;
  let evolutionFound = false;

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const supplierHeader = matrix.findIndex((row) => rowHas(row, ["FORNECEDOR", "QTD ATAS", "QTD ITENS"]));
    if (supplierHeader >= 0) {
      const header = matrix[supplierHeader] ?? [];
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      const atasCol = columnIndex(header, (value) => value === "QTD ATAS");
      const itensCol = columnIndex(header, (value) => value === "QTD ITENS");
      const concentrationCol = header.findIndex((value) => exact(value).includes("CONCENTRACAO"));
      const analysisCol = columnIndex(header, (value) => value === "ANALISE");
      const suppliers: SnapshotSupplierGeneral[] = [];
      for (let r = supplierHeader + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (row.some((value) => exact(value).includes("EVOLUCAO POR AREA"))) break;
        const fornecedor = cellText(row[fornecedorCol]);
        if (!fornecedor) continue;
        suppliers.push({
          area: "GERAL",
          fornecedor,
          qtdAtas: integerValue(row[atasCol]),
          qtdItens: integerValue(row[itensCol]),
          concentracaoPct: concentrationCol >= 0 ? percentValue(row[concentrationCol]) : null,
          analise: analysisCol >= 0 ? cellText(row[analysisCol]) || null : null,
        });
      }
      if (suppliers.length) {
        payload.fornecedoresGeral = suppliers;
        suppliersFound = true;
      }
    }

    const evolutionTitle = matrix.findIndex((row) => row.some((value) => exact(value).includes("EVOLUCAO POR AREA")));
    if (evolutionTitle >= 0) {
      const headerRow = matrix.findIndex((row, index) => index > evolutionTitle && row.some((value) => exact(value) === "AREAS") && row.some((value) => exact(value).includes("VENCIDAS")));
      if (headerRow >= 0) {
        const header = matrix[headerRow] ?? [];
        const areaCol = columnIndex(header, (value) => value === "AREAS" || value === "AREA");
        const concludedCol = header.findIndex((value) => exact(value).includes("CONCLUID") && exact(value).includes("ATAS"));
        const andamentoCol = header.findIndex((value) => exact(value).includes("ANDAMENTO"));
        const saldoCol = header.findIndex((value) => exact(value).includes("ITENS COM") && exact(value).includes("SALDO"));
        const semSaldoCol = header.findIndex((value) => exact(value).includes("ITENS SEM") && exact(value).includes("SALDO"));
        const vencidasCol = header.findIndex((value) => exact(value) === "VENCIDAS");
        const aVencerCol = header.findIndex((value) => exact(value) === "A VENCER");
        for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 8); r += 1) {
          const row = matrix[r] ?? [];
          const area = isArea(row[areaCol]);
          if (!area) continue;
          const target = payload.evolucao[area];
          const concluded = evolutionPairFromCell(row[concludedCol]);
          const andamento = evolutionPairFromCell(row[andamentoCol]);
          const vencidas = evolutionPairFromCell(row[vencidasCol]);
          const aVencer = evolutionPairFromCell(row[aVencerCol]);
          target.concluidasAtas = concluded.atas;
          target.concluidasItens = concluded.itens;
          target.andamentoAtas = andamento.atas;
          target.andamentoItens = andamento.itens;
          target.saldoItens = integerValue(row[saldoCol]);
          target.semSaldoItens = integerValue(row[semSaldoCol]);
          target.vencidasAtas = vencidas.atas;
          target.vencidasItens = vencidas.itens;
          target.aVencerAtas = aVencer.atas;
          target.aVencerItens = aVencer.itens;
          evolutionFound = true;
        }
      }
    }
  }

  if (suppliersFound) addFound(payload, "fornecedores");
  if (evolutionFound) addFound(payload, "evolucao");
}

function giroForecastBand(value: unknown): ForecastBand | null {
  const label = exact(value);
  if (label.includes("PROXIMOS 15")) return "ate_15";
  if (label.includes("ATE 30")) return "ate_30";
  if (label.includes("ATE 60")) return "ate_60";
  if (label.includes("PREVISOES VENCIDAS")) return "vencidas";
  return null;
}

/** GIRO 06 — totais por faixa; os nomes são lidos somente quando houver uma contagem explícita. */
function extractGiro06Faixas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 6, "FAIXAS");
  if (!sources.length) return;
  let found = false;
  for (const band of FORECAST_BANDS) {
    for (const area of SNAPSHOT_AREAS) payload.previsoes[band][area] = emptyForecast();
  }
  for (const sheet of sources) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const band = giroForecastBand(matrix[r]?.find((value) => giroForecastBand(value) !== null));
      if (!band) continue;
      const headerRow = matrix.slice(r + 1, Math.min(matrix.length, r + 8)).findIndex((row) => SNAPSHOT_AREAS.filter((area) => row.some((value) => isArea(value) === area)).length >= 2);
      if (headerRow < 0) continue;
      const actualHeader = r + 1 + headerRow;
      const header = matrix[actualHeader] ?? [];
      const areaColumns = SNAPSHOT_AREAS.map((area) => ({ area, column: header.findIndex((value) => isArea(value) === area) })).filter((item) => item.column >= 0);
      for (const { area, column } of areaColumns) {
        let atas: number | null = null;
        let itens: number | null = null;
        for (let rr = actualHeader + 1; rr < Math.min(matrix.length, actualHeader + 8); rr += 1) {
          atas ??= unitInteger(matrix[rr]?.[column], "ATAS");
          itens ??= unitInteger(matrix[rr]?.[column], "ITENS");
        }
        if (atas !== null || itens !== null) {
          const target = payload.previsoes[band][area];
          target.atas = atas;
          target.itens = itens;
          const namesRow = matrix.slice(actualHeader + 1, Math.min(matrix.length, actualHeader + 12)).find((row) => {
            const value = row[column];
            const text = cellText(value);
            return Boolean(text)
              && unitInteger(value, "ATAS") === null
              && unitInteger(value, "ITENS") === null
              && !exact(text).includes("PREVISTAS")
              && !exact(text).includes("INDIRETOS")
              && !exact(text).includes("DIRETOS")
              && !exact(text).includes("CAPEX");
          });
          const names = rawCellLines(namesRow?.[column]).filter((name) => !exact(name).includes("SEM COMPRADORES"));
          target.buyers = names.map((name) => ({ name, atas: null, itens: null, prazoConclusao: null }));
          found = true;
        }
      }
    }
  }
  if (found) addFound(payload, "previsao-faixas");
}

/** GIRO 07 — quatro cartões mensais por área. */
function extractGiro07Mensal(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 7, "MENSAL");
  if (!sources.length) return;
  let found = false;
  for (const sheet of sources) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const area = isArea(matrix[r]?.find((value) => isArea(value) !== null));
      if (!area) continue;
      const areaColumn = (matrix[r] ?? []).findIndex((value) => isArea(value) === area);
      const countRow = matrix.slice(r + 1, Math.min(matrix.length, r + 10)).find((row) => row.some((value) => unitInteger(value, "ATAS") !== null));
      const itemRow = matrix.slice(r + 1, Math.min(matrix.length, r + 12)).find((row) => row.some((value) => unitInteger(value, "ITENS") !== null));
      const labelRow = matrix.slice(r + 1, Math.min(matrix.length, r + 16)).find((row) => row.filter((value) => monthlyLabel(value, payload.referenceDate)).length >= 3);
      if (!countRow || !itemRow || !labelRow) continue;
      const rows: SnapshotMonthlyForecastRow[] = [];
      for (let c = 0; c < labelRow.length; c += 1) {
        const parsedLabel = monthlyLabel(labelRow[c], payload.referenceDate);
        if (!parsedLabel) continue;
        rows.push({
          label: parsedLabel.label,
          month: parsedLabel.month,
          year: parsedLabel.year,
          atas: unitInteger(countRow[c], "ATAS"),
          itens: unitInteger(itemRow[c], "ITENS"),
        });
      }
      if (rows.length) {
        payload.previsaoMeses[area] = { rows };
        found = true;
      }
      void areaColumn;
    }
  }
  if (found) addFound(payload, "previsao-meses");
}

/* ---------------------------- API pública ------------------------- */

export function extractSnapshotPayload(
  sheets: SnapshotSourceSheet[],
  options: { fileNames?: string[]; referenceDate?: string | null } = {},
): DashboardSnapshotPayload {
  const payload = emptyDashboardSnapshot(options.referenceDate ?? null, options.fileNames ?? [...new Set(sheets.map((sheet) => sheet.fileName))]);
  extractReadingTable(payload, sheets);
  extractAreaValues(payload, sheets);
  extractSaving(payload, sheets);
  extractTopBuyers(payload, sheets);
  extractSuppliers(payload, sheets);
  extractEvolution(payload, sheets);
  extractEvolutionStatusTable(payload, sheets);
  extractForecastBandTable(payload, sheets);
  extractForecastBandFallback(payload, sheets);
  extractMonthlyForecastTable(payload, sheets);
  extractForecastRows(payload, sheets);
  extractAndamentoGeral(payload, sheets);
  extractContratosFornecedores(payload, sheets);
  extractAtasConcluidas(payload, sheets);
  extractStatusAtas(payload, sheets);
  // As abas GIRO consolidadas são a fonte principal quando presentes. O
  // extrator antigo permanece acima como fallback para bases legadas.
  extractGiro02Concluidas(payload, sheets);
  extractGiro03Resumo(payload, sheets);
  extractGiro04Evolucao(payload, sheets);
  extractGiro06Faixas(payload, sheets);
  extractGiro07Mensal(payload, sheets);
  // Os cartões visuais da aba de controle são a fonte mais específica do
  // resumo atual e devem prevalecer sobre o fallback calculado das linhas
  // operacionais quando a planilha não traz a tabela LEITURA DOS GRÁFICOS.
  extractSummaryCards(payload, sheets);

  // Sem o card geral, “em andamento” é a soma das três áreas da evolução —
  // somente quando as três existem, para não exibir uma soma parcial como total.
  if (payload.kpis.andamentoAtas === null && SNAPSHOT_AREAS.every((area) => payload.evolucao[area].andamentoAtas !== null)) {
    payload.kpis.andamentoAtas = SNAPSHOT_AREAS.reduce((sum, area) => sum + (payload.evolucao[area].andamentoAtas ?? 0), 0);
  }
  if (payload.kpis.andamentoItens === null && SNAPSHOT_AREAS.every((area) => payload.evolucao[area].andamentoItens !== null)) {
    payload.kpis.andamentoItens = SNAPSHOT_AREAS.reduce((sum, area) => sum + (payload.evolucao[area].andamentoItens ?? 0), 0);
  }
  for (const ata of payload.atasConcluidas) {
    if (!ata.fornecedor && ata.contrato && payload.fornecedoresPorContrato[ata.contrato]) {
      ata.fornecedor = payload.fornecedoresPorContrato[ata.contrato];
    }
  }

  const allKnown = [...SNAPSHOT_BLOCK_KEYS];
  payload.coverage.missing = allKnown.filter((key) => !payload.coverage.found.includes(key));
  if (payload.coverage.missing.length > 0) {
    payload.notes.push(`Blocos não encontrados: ${payload.coverage.missing.join(", ")}. Confira os nomes exatos dos cabeçalhos/linhas.`);
  }
  return payload;
}

export function hasSnapshotPayloadMeaningfulData(payload: DashboardSnapshotPayload | null | undefined): boolean {
  return Boolean(payload && payload.coverage.found.length > 0);
}

/**
 * Referência inicial de 13/10 (status da semana anterior na página do
 * SharePoint) para que a comparação semanal não fique vazia antes de existir
 * uma segunda importação. São somente os números dos cards de resumo.
 */
export function defaultPreviousSnapshot(): DashboardSnapshotPayload {
  const payload = emptyDashboardSnapshot("2026-10-13", ["Referência fornecida nas capturas — 13/10"]);
  payload.kpis = {
    concluidasAtas: 62,
    concluidasItens: 915,
    andamentoAtas: 70,
    andamentoItens: 5000,
    saldoItens: 862,
    consumidoItens: 100,
    aVencerAtas: 59,
    aVencerItens: 1441,
    vencidasAtas: 49,
    vencidasItens: 371,
  };
  payload.coverage.found = ["kpis-leitura"];
  payload.coverage.missing = SNAPSHOT_BLOCK_KEYS.filter((key) => key !== "kpis-leitura");
  payload.notes.push("Referência inicial fixa apenas para os cards da semana anterior; será substituída pelo snapshot imediatamente anterior após novas importações.");
  return payload;
}
````

## `src/lib/domain.ts`

````typescript
/**
 * Domínio do Giro de Atas — campos canônicos, normalização e validação.
 * Este módulo é isomórfico: roda no navegador (pré-visualização) e no
 * servidor (confirmação da importação), garantindo resultados idênticos.
 * Nenhum dado é descartado silenciosamente: tudo vira Issue oué preservado
 * em `extra` (colunas não mapeadas permanecem com o registro).
 */

export type DatasetKind = "indiretos" | "diretos" | "capex" | "outro";
export type DatasetNatureza = "operacional" | "snapshot";
export type ImportMode = "replace" | "combine";

export const KIND_LABEL: Record<DatasetKind, string> = {
  indiretos: "Indiretos",
  diretos: "Diretos",
  capex: "CAPEX",
  outro: "Outro / Geral",
};

export const AREA_LABEL: Record<string, string> = {
  Indiretos: "Indiretos",
  Diretos: "Diretos",
  CAPEX: "CAPEX",
  "Não informado": "Não informado",
};

export type SituacaoChave =
  | "vencido"
  | "a_vencer"
  | "em_dia"
  | "sem_data"
  | "concluido"
  | "cancelado";

export const SITUACAO_LABEL: Record<SituacaoChave, string> = {
  vencido: "Vencido",
  a_vencer: "A vencer (30 dias)",
  em_dia: "No prazo",
  sem_data: "Sem data de prazo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/* ------------------------------------------------------------------ */
/* Campos canônicos esperados pelo painel                              */
/* ------------------------------------------------------------------ */

export type FieldType = "text" | "date" | "number" | "money" | "url";

export interface CanonicalField {
  key: string;
  label: string;
  required: boolean;
  type: FieldType;
  hint: string;
}

export const CANONICAL_FIELDS: CanonicalField[] = [
  { key: "numero", label: "Nº do processo / identificador", required: true, type: "text", hint: "Ex.: PA 123/2025, Ata 45/2024" },
  { key: "objeto", label: "Objeto / descrição", required: true, type: "text", hint: "Descrição do que está sendo comprado" },
  { key: "area", label: "Área", required: false, type: "text", hint: "Indiretos, Diretos ou CAPEX (se houver na planilha)" },
  { key: "unidade", label: "Unidade / solicitante", required: false, type: "text", hint: "Setor ou unidade requerente" },
  { key: "fornecedor", label: "Fornecedor", required: false, type: "text", hint: "Razão social do fornecedor" },
  { key: "responsavel", label: "Responsável / comprador", required: false, type: "text", hint: "Pessoa responsável pelo processo" },
  { key: "etapa", label: "Etapa / fase", required: false, type: "text", hint: "Etapa atual do processo" },
  { key: "situacao", label: "Situação declarada na fonte", required: false, type: "text", hint: "Ex.: em andamento, concluído, cancelado" },
  { key: "data_inicio", label: "Data de abertura / publicação", required: false, type: "date", hint: "Preferência: dd/mm/aaaa" },
  { key: "data_fim", label: "Data limite / fim de vigência", required: false, type: "date", hint: "Usada para calcular vencidos e a vencer" },
  { key: "quantidade", label: "Quantidade de itens", required: false, type: "number", hint: "Número inteiro de itens do processo" },
  { key: "valor", label: "Valor estimado (R$)", required: false, type: "money", hint: "Aceita 1.234,56" },
  { key: "status_consumo", label: "Status de Consumo", required: false, type: "text", hint: "Ex.: Com Saldo, Consumido, Sem Saldo" },
  { key: "saving_hist", label: "Saving Histórico (R$)", required: false, type: "money", hint: "Valor do saving histórico" },
  { key: "saving_prop", label: "Saving Sob Proposta (R$)", required: false, type: "money", hint: "Valor do saving da proposta" },
  { key: "status_renovacao", label: "Status de Renovação", required: false, type: "text", hint: "Ex.: Não Iniciado, Novo Projeto, Em Renovação, Não será renovado" },
  { key: "data_previsao", label: "Previsão de Conclusão", required: false, type: "date", hint: "Data estimada para conclusão" },
  { key: "observacao", label: "Observações", required: false, type: "text", hint: "Notas e comentários" },
  { key: "link", label: "Link do processo/documento", required: false, type: "url", hint: "URL (SharePoint, portal etc.)" },
];

export const CANONICAL_KEYS = CANONICAL_FIELDS.map((f) => f.key);

/* ------------------------------------------------------------------ */
/* Normalização textual                                                */
/* ------------------------------------------------------------------ */

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normText(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function cleanCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return toISODateLocal(value);
  const s = String(value).replace(/\u00a0/g, " ").trim();
  return s === "" ? null : s;
}

/* ------------------------------------------------------------------ */
/* Datas (pt-BR)                                                       */
/* ------------------------------------------------------------------ */

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface ParsedDate {
  iso: string | null;
  warning?: string;
}

/** Interpreta datas sem adivinhar: formatos inequívocos entram; o resto vira aviso. */
export function parseDateBR(raw: unknown, fieldLabel: string): ParsedDate {
  if (raw === null || raw === undefined || raw === "") return { iso: null };
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return { iso: toISODateLocal(raw) };
  }
  const s = String(raw).trim();

  // ISO: aaaa-mm-dd (com ou sem hora)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})([T\s].*)?$/);
  if (m) return buildDate(+m[1], +m[2], +m[3], fieldLabel, s);

  // BR: dd/mm/aaaa ou dd-mm-aaaa ou dd.mm.aaaa (opcional hora)
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})([T\s].*)?$/);
  if (m) {
    const day = +m[1];
    const month = +m[2];
    let year = +m[3];
    let warning: string | undefined;
    if (m[3].length === 2) {
      const now = new Date().getFullYear();
      year = year <= (now + 5) % 100 ? 2000 + year : 1900 + year;
      warning = `Ano com 2 dígitos ("${s}") interpretado como ${year}. Confirme na origem.`;
    }
    if (day > 31 || month > 12) {
      return { iso: null, warning: `Data não reconhecida em "${fieldLabel}": "${s}". Linha mantida sem a data.` };
    }
    return buildDate(year, month, day, fieldLabel, s, warning);
  }

  return { iso: null, warning: `Data não reconhecida em "${fieldLabel}": "${s}". Linha mantida sem a data.` };
}

function buildDate(y: number, mo: number, d: number, fieldLabel: string, original: string, warning?: string): ParsedDate {
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return { iso: null, warning: `Data inválida em "${fieldLabel}": "${original}". Linha mantida sem a data.` };
  }
  if (y < 1990 || y > 2100) {
    return { iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, warning: `Ano ${y} incomum em "${fieldLabel}" ("${original}"). Confirme na origem.` };
  }
  return { iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, warning };
}

/* ------------------------------------------------------------------ */
/* Números e valores monetários (pt-BR)                                */
/* ------------------------------------------------------------------ */

export interface ParsedNumber {
  value: number | null;
  warning?: string;
}

export function parseNumberBR(raw: unknown, opts: { integer?: boolean; label: string }): ParsedNumber {
  const { integer = false, label } = opts;
  if (raw === null || raw === undefined || raw === "") return { value: null };
  if (typeof raw === "number" && isFinite(raw)) {
    if (integer && !Number.isInteger(raw)) {
      return { value: Math.round(raw), warning: `Quantidade não inteira (${raw}) arredondada para ${Math.round(raw)} em "${label}". Confirme na origem.` };
    }
    return { value: raw };
  }
  let s = String(raw).trim().replace(/R\$\s?/g, "").replace(/\s/g, "");
  if (s === "") return { value: null };
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized: string;
  let warning: string | undefined;
  if (hasComma && hasDot) {
    // O separador mais à direita é o decimal.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = s.replace(",", ".");
  } else if (hasDot) {
    // "3.054" -> ambíguo: milhar (pt-BR) ou decimal (en-US).
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length === 3 && integer) {
      normalized = s.replace(/\./g, "");
      warning = `"${s}" interpretado como ${normalized} (separador de milhar). Se for decimal, corrija na origem.`;
    } else if (parts.length > 2) {
      normalized = s.replace(/\./g, "");
      warning = `"${s}" interpretado com "." como separador de milhar. Confirme na origem.`;
    } else {
      normalized = s;
    }
  } else {
    normalized = s;
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { value: null, warning: `Valor não numérico em "${label}": "${String(raw)}". Linha mantida sem o valor.` };
  }
  let n = parseFloat(normalized);
  if (negative) n = -n;
  if (integer && !Number.isInteger(n)) {
    return { value: Math.round(n), warning: `Quantidade não inteira (${n}) arredondada para ${Math.round(n)} em "${label}". Confirme na origem.` };
  }
  return { value: n, ...(warning ? { warning } : {}) };
}

/* ------------------------------------------------------------------ */
/* Área, situação, consumos e renovação                                 */
/* ------------------------------------------------------------------ */

export function normalizeConsumo(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (n.includes("sem saldo")) return "Sem Saldo";
  if (n.includes("com saldo") || n.includes("saldo")) return "Com Saldo";
  if (n.includes("consumid")) return "Consumido";
  return null;
}

export function normalizeRenovacao(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (n.includes("nao iniciad") || n.includes("não iniciad")) return "Não Iniciado";
  if (n.includes("nao sera renovad") || n.includes("nao renov")) return "Não Será Renovado";
  if (n.includes("novo projeto") || n.includes("criado")) return "Criado Novo Projeto";
  if (n.includes("em renovacao") || n.includes("renovando") || n.includes("em andamento")) return "Em Renovação";
  return null;
}

export function normalizeArea(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (/capex|invest/.test(n)) return "CAPEX";
  if (/indireto/.test(n)) return "Indiretos";
  if (/direto/.test(n)) return "Diretos";
  return null;
}

/** Interpretação conservadora: só marca concluído/cancelado com padrões claros. */
export function normalizeSituacao(raw: string | null): "concluido" | "cancelado" | null {
  if (!raw) return null;
  const n = normText(raw);
  if (/cancel|anulad|revogad/.test(n)) return "cancelado";
  if (/conclu|finaliz|encerrad/.test(n)) return "concluido";
  return null;
}

export function sanitizeUrl(raw: string | null): { url: string | null; warning?: string } {
  if (!raw) return { url: null };
  const s = raw.trim();
  if (/^https?:\/\/\S+$/i.test(s)) return { url: s.slice(0, 2000) };
  return { url: null, warning: `Link com formato inesperado ("${s.slice(0, 80)}") não foi importado. Verifique na origem.` };
}

/* ------------------------------------------------------------------ */
/* Transformação e validação de linhas                                 */
/* ------------------------------------------------------------------ */

export type Mapping = Partial<Record<string, string | null>>; // canonicalKey -> sourceHeader

export interface Issue {
  row: number; // número da linha na planilha (1 = primeira linha de dados após cabeçalho)
  column: string;
  message: string;
  severity: "error" | "warning";
}

export interface CleanRecord {
  numero: string;
  objeto: string;
  area: string | null;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacaoFonte: string | null;
  situacaoNorm: "concluido" | "cancelado" | null;
  dataInicio: string | null;
  dataFim: string | null;
  quantidade: number | null;
  valor: number | null;
  statusConsumo: string | null;
  savingHist: number | null;
  savingProp: number | null;
  statusRenovacao: string | null;
  dataPrevisao: string | null;
  observacao: string | null;
  link: string | null;
  extra: Record<string, string>;
  rowHash: string;
  sourceRow: number;
}

export interface ValidationResult {
  records: CleanRecord[];
  issues: Issue[];
  skipped: number;
  duplicates: number;
  warnings: number;
}

export function transformAndValidate(
  rows: Record<string, unknown>[],
  mapping: Mapping,
  opts: { defaultArea?: string | null; maxLen?: number } = {},
): ValidationResult {
  const maxLen = opts.maxLen ?? 2000;
  const records: CleanRecord[] = [];
  const issues: Issue[] = [];
  let skipped = 0;
  let duplicates = 0;

  const get = (row: Record<string, unknown>, key: string): unknown => {
    const header = mapping[key];
    if (!header) return null;
    return row[header];
  };

  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNo = idx + 1;
    const rowIssues: Issue[] = [];
    const pushIssue = (severity: "error" | "warning", column: string, message: string) =>
      rowIssues.push({ row: rowNo, column, message, severity });

    const numero = cleanCell(get(row, "numero"))?.slice(0, maxLen) ?? null;
    const objeto = cleanCell(get(row, "objeto"))?.slice(0, 4000) ?? null;

    if (!numero) pushIssue("error", "numero", "Identificador do processo vazio (campo essencial para registros operacionais).");
    if (!objeto) pushIssue("error", "objeto", "Objeto/descrição vazio (campo essencial para registros operacionais).");

    const areaRaw = cleanCell(get(row, "area"));
    let area = normalizeArea(areaRaw);
    if (areaRaw && !area) {
      pushIssue("warning", "area", `Área "${areaRaw}" não reconhecida. Usada a área da base.`);
    }
    if (!area) area = opts.defaultArea ?? null;

    const di = parseDateBR(get(row, "data_inicio"), "Data de abertura");
    if (di.warning) pushIssue("warning", "data_inicio", di.warning);
    const dfCandidate = get(row, "data_fim");
    const df = parseDateBR(dfCandidate, "Data limite/vigência");
    if (df.warning) pushIssue("warning", "data_fim", df.warning);

    const dPrev = parseDateBR(get(row, "data_previsao"), "Previsão de Conclusão");
    if (dPrev.warning) pushIssue("warning", "data_previsao", dPrev.warning);

    const qtd = parseNumberBR(get(row, "quantidade"), { integer: true, label: "Quantidade" });
    if (qtd.warning) pushIssue("warning", "quantidade", qtd.warning);
    if (qtd.value !== null && qtd.value < 0) {
      pushIssue("warning", "quantidade", `Quantidade negativa (${qtd.value}). Valor mantido; confirme na origem.`);
    }

    const val = parseNumberBR(get(row, "valor"), { label: "Valor estimado" });
    if (val.warning) pushIssue("warning", "valor", val.warning);
    if (val.value !== null && val.value < 0) {
      pushIssue("warning", "valor", `Valor negativo (${val.value}). Valor mantido; confirme na origem.`);
    }

    const sHist = parseNumberBR(get(row, "saving_hist"), { label: "Saving Histórico" });
    if (sHist.warning) pushIssue("warning", "saving_hist", sHist.warning);
    
    const sProp = parseNumberBR(get(row, "saving_prop"), { label: "Saving Sob Proposta" });
    if (sProp.warning) pushIssue("warning", "saving_prop", sProp.warning);

    const sConsumo = normalizeConsumo(cleanCell(get(row, "status_consumo")));
    const sRenov = normalizeRenovacao(cleanCell(get(row, "status_renovacao")));

    const urlRes = sanitizeUrl(cleanCell(get(row, "link")));
    if (urlRes.warning) pushIssue("warning", "link", urlRes.warning);

    const situacaoFonte = cleanCell(get(row, "situacao"));
    const situacaoNorm = normalizeSituacao(situacaoFonte);

    // Colunas não mapeadas são preservadas (nada é descartado).
    const mappedHeaders = new Set(Object.values(mapping).filter(Boolean) as string[]);
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (!mappedHeaders.has(k) && k !== "__row") {
        const c = cleanCell(v);
        if (c !== null) extra[k] = c.slice(0, maxLen);
      }
    }

    const errors = rowIssues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      skipped += 1;
      issues.push(...rowIssues);
      return;
    }

    const hashBase = [numero, objeto, area ?? "", df.iso ?? "", cleanCell(get(row, "fornecedor")) ?? ""]
      .map((p) => normText(String(p ?? "")))
      .join("|");
    if (seen.has(hashBase)) {
      duplicates += 1;
      skipped += 1;
      issues.push({
        row: rowNo,
        column: "numero",
        message: `Linha duplicada (mesmo processo, objeto, área, prazo e fornecedor). Mantida a primeira ocorrência.`,
        severity: "error",
      });
      return;
    }
    seen.add(hashBase);

    issues.push(...rowIssues);

    records.push({
      numero: numero!,
      objeto: objeto!,
      area,
      unidade: cleanCell(get(row, "unidade"))?.slice(0, 500) ?? null,
      fornecedor: cleanCell(get(row, "fornecedor"))?.slice(0, 500) ?? null,
      responsavel: cleanCell(get(row, "responsavel"))?.slice(0, 300) ?? null,
      etapa: cleanCell(get(row, "etapa"))?.slice(0, 300) ?? null,
      situacaoFonte: situacaoFonte?.slice(0, 300) ?? null,
      situacaoNorm,
      dataInicio: di.iso,
      dataFim: df.iso,
      quantidade: qtd.value,
      valor: val.value,
      statusConsumo: sConsumo,
      savingHist: sHist.value,
      savingProp: sProp.value,
      statusRenovacao: sRenov,
      dataPrevisao: dPrev.iso,
      observacao: cleanCell(get(row, "observacao"))?.slice(0, 8000) ?? null,
      link: urlRes.url,
      extra,
      rowHash: hashBase.slice(0, 500),
      sourceRow: rowNo,
    });
  });

  const warnings = issues.filter((i) => i.severity === "warning").length;
  return { records, issues, skipped, duplicates, warnings };
}

/* ------------------------------------------------------------------ */
/* Situação de prazo (calculada em consulta, sempre contra "hoje")     */
/* ------------------------------------------------------------------ */

export function situacaoPrazo(
  situacaoNorm: "concluido" | "cancelado" | null,
  dataFim: string | null,
  hoje: Date = new Date(),
): { chave: SituacaoChave; dias: number | null } {
  if (situacaoNorm === "concluido") return { chave: "concluido", dias: null };
  if (situacaoNorm === "cancelado") return { chave: "cancelado", dias: null };
  if (!dataFim) return { chave: "sem_data", dias: null };
  const [y, m, d] = dataFim.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (dias < 0) return { chave: "vencido", dias };
  if (dias <= 30) return { chave: "a_vencer", dias };
  return { chave: "em_dia", dias };
}

/** Fragmento SQL equivalente ao situacaoPrazo (usado nas consultas). */
export const SITUACAO_SQL = `
  CASE
    WHEN r.situacao_norm = 'concluido' THEN 'concluido'
    WHEN r.situacao_norm = 'cancelado' THEN 'cancelado'
    WHEN r.data_fim IS NULL THEN 'sem_data'
    WHEN r.data_fim < CURRENT_DATE THEN 'vencido'
    WHEN r.data_fim <= CURRENT_DATE + 30 THEN 'a_vencer'
    ELSE 'em_dia'
  END`;
````

## `src/lib/format.ts`

````typescript
/** Formatação pt-BR centralizada (datas, números, moeda, prazos relativos). */

const fBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const fDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fDateLong = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const fDateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function fmtCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fBRL.format(v);
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fInt.format(v);
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fNum.format(v);
}

/** Recebe 'aaaa-mm-dd' (string) e devolve dd/mm/aaaa. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return fDate.format(new Date(y, m - 1, d));
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return fDateLong.format(new Date(y, m - 1, d));
}

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return fDateTime.format(d);
}

export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function prazoRelativo(dias: number | null): string {
  if (dias === null) return "";
  if (dias < 0) {
    const a = Math.abs(dias);
    return a === 1 ? "há 1 dia" : `há ${a} dias`;
  }
  if (dias === 0) return "vence hoje";
  return dias === 1 ? "em 1 dia" : `em ${dias} dias`;
}
````

## `src/lib/mapping.ts`

````typescript
/**
 * Sugestão automática de mapeamento coluna → campo canônico.
 * Nunca decide sozinho em caso de ambiguidade: devolve `confidence` e a
 * interface deixa o usuário confirmar ou ajustar.
 */
import { CANONICAL_FIELDS, normText, type Mapping } from "./domain";

interface Synonym {
  key: string;
  terms: string[];       // termos exatos (normalizados)
  contains: string[];    // substrings
  weight: number;        // prioridade em conflito
}

const DICTIONARY: Synonym[] = [
  { key: "numero", weight: 100, terms: ["processo", "n processo", "nº processo", "n° processo", "numero do processo", "n do processo", "numero", "nº", "n°", "num", "id", "identificador", "ata", "n ata", "ata n", "numero da ata", "nº ata", "registro", "codigo", "pa", "pedido"], contains: ["processo", "identific", "ata n", "nº ata", "numero d"] },
  { key: "objeto", weight: 95, terms: ["objeto", "descricao", "descricao do objeto", "descricao resumida", "item", "material", "descricao do item", "resumo", "especificacao", "produto", "servico"], contains: ["objeto", "descri", "especific"] },
  { key: "area", weight: 60, terms: ["area", "categoria", "grupo", "tipo", "tipo de compra", "segmento"], contains: ["categoria"] },
  { key: "unidade", weight: 50, terms: ["unidade", "setor", "solicitante", "unidade requerente", "departamento", "unidade solicitante", "area requerente", "requerente"], contains: ["solicit", "requerente", "departamento", "setor", "unidade"] },
  { key: "fornecedor", weight: 90, terms: ["fornecedor", "empresa", "razao social", "fornecedor vencedor", "adjudicatario", "contratada", "fornecedor(es)", "nome fornecedor"], contains: ["fornec", "adjudic", "razao social"] },
  { key: "responsavel", weight: 85, terms: ["responsavel", "comprador", "gestor", "buyer", "analista", "responsavel pelo processo", "gestor do contrato", "fiscal"], contains: ["respons", "comprador", "gestor"] },
  { key: "etapa", weight: 80, terms: ["etapa", "fase", "status", "andamento", "etapa atual", "fase atual", "status do processo", "situacao do processo"], contains: ["etapa", "fase"] },
  { key: "situacao", weight: 78, terms: ["situacao", "situacao atual", "condicao", "status final", "sit"], contains: ["situacao"] },
  { key: "data_inicio", weight: 70, terms: ["data abertura", "data de abertura", "publicacao", "data de publicacao", "inicio", "data inicio", "data de inicio", "abertura", "data", "dt abertura", "data do pedido", "data de criacao"], contains: ["abertura", "publicac", "inicio"] },
  { key: "data_fim", weight: 92, terms: ["vigencia", "fim da vigencia", "validade", "vencimento", "data fim", "data de vencimento", "limite", "prazo", "fim", "termino", "data limite", "validade da ata", "dt vencimento", "fim vigencia", "ate", "data final de vigencia", "vencimento da ata"], contains: ["vigenc", "vencim", "validade", "prazo", "limite", "termino"] },
  { key: "quantidade", weight: 75, terms: ["quantidade", "qtd", "qtde", "itens", "qtd itens", "numero de itens", "total de itens", "qnt", "quant"], contains: ["quant", "itens"] },
  { key: "valor", weight: 88, terms: ["valor", "valor estimado", "valor total", "montante", "r$", "valor r$", "valor global", "preco", "valor unitario", "valor homologado", "valor da ata", "valor do contrato", "total"], contains: ["valor", "preco", "montante"] },
  { key: "status_consumo", weight: 80, terms: ["status consumo", "consumo", "nivel de consumo qtd", "saldo"], contains: ["consumo", "saldo"] },
  { key: "saving_hist", weight: 85, terms: ["saving historico", "saving hist", "saving historico r$"], contains: ["saving historico", "saving hist"] },
  { key: "saving_prop", weight: 85, terms: ["saving sob proposta", "saving proposta r$", "saving prop"], contains: ["saving proposta", "saving sob proposta"] },
  { key: "status_renovacao", weight: 82, terms: ["status renovacao", "status de renovacao", "decisao nova ata", "decisao", "renovacao"], contains: ["renovacao", "decisao"] },
  { key: "data_previsao", weight: 75, terms: ["previsao de conclusao", "estimativa de conclusao", "data previsao", "previsao"], contains: ["previsao", "estimativa"] },
  { key: "observacao", weight: 40, terms: ["observacao", "obs", "notas", "comentario", "observacoes", "comentarios", "anotacao", "anotacoes", "detalhes"], contains: ["observa", "comenta", "nota"] },
  { key: "link", weight: 65, terms: ["link", "url", "endereco", "caminho", "sharepoint", "documento", "arquivo", "hiperlink", "link do processo", "link sharepoint"], contains: ["link", "url", "sharepoint", "hiperlink"] },
];

export interface Suggestion {
  mapping: Mapping;               // canonicalKey -> header
  byHeader: Record<string, string | null>; // header -> canonicalKey
  confidence: Record<string, "exact" | "partial" | "none">; // canonicalKey
  unmappedHeaders: string[];      // colunas que ficarão em "extra"
}

export function suggestMapping(headers: string[]): Suggestion {
  const mapping: Mapping = {};
  const byHeader: Record<string, string | null> = {};
  const confidence: Record<string, "exact" | "partial" | "none"> = {};
  for (const f of CANONICAL_FIELDS) confidence[f.key] = "none";

  const normalized = headers.map((h) => ({ raw: h, n: normText(h) }));
  const usedHeaders = new Set<string>();

  interface Cand { key: string; header: string; score: number; exact: boolean }
  const cands: Cand[] = [];
  for (const entry of DICTIONARY) {
    for (const h of normalized) {
      if (usedHeaders.has(h.raw)) continue;
      if (h.n === "") continue;
      if (entry.terms.includes(h.n)) {
        cands.push({ key: entry.key, header: h.raw, score: entry.weight + 1000 + h.raw.length * -0.001, exact: true });
      } else if (entry.contains.some((c) => h.n.includes(c))) {
        cands.push({ key: entry.key, header: h.raw, score: entry.weight, exact: false });
      }
    }
  }
  cands.sort((a, b) => b.score - a.score);
  const usedKeys = new Set<string>();
  for (const c of cands) {
    if (usedKeys.has(c.key) || usedHeaders.has(c.header)) continue;
    usedKeys.add(c.key);
    usedHeaders.add(c.header);
    mapping[c.key] = c.header;
    byHeader[c.header] = c.key;
    confidence[c.key] = c.exact ? "exact" : "partial";
  }
  for (const h of headers) if (!(h in byHeader)) byHeader[h] = null;

  const unmappedHeaders = headers.filter((h) => !byHeader[h]);
  return { mapping, byHeader, confidence, unmappedHeaders };
}
````

## `src/lib/static-dashboard.ts`

````typescript
import {
  listActiveDatasets,
  listActiveProcessRows,
  listDatasets,
  listSnapshotDatasets,
  formatStoredDataset,
  type ProcessRow,
} from "@/lib/static-store";
import {
  defaultPreviousSnapshot,
  type DashboardSnapshotPayload,
  type ForecastBand,
  type SnapshotArea,
  type SnapshotAtaConcluida,
  type SnapshotStatusAtasArea,
  SNAPSHOT_AREAS,
  type SnapshotBlockKey,
} from "@/lib/dashboard-snapshot";

/** Blocos do panorama que podem ficar sem dado quando a planilha não os traz. */
export const PANORAMA_BLOCKS = [
  "kpis-leitura",
  "atas-concluidas",
  "valores-por-area",
  "saving",
  "top-compradores",
  "fornecedores",
  "evolucao",
  "status-atas",
  "previsao-faixas",
  "previsao-meses",
] as const;
export type PanoramaBlock = (typeof PANORAMA_BLOCKS)[number];

/** Atas que passaram a FINALIZADO desde a importação anterior. */
export interface AtasConcluidasResult {
  disponivel: boolean;
  primeiraLeitura: boolean;
  comparadoComReferencia: string | null;
  comparadoComImportadoEm: string | null;
  totalFinalizadas: number;
  novas: SnapshotAtaConcluida[];
}

export type PanoramaBlockSource = "snapshot" | "registros" | "ausente";

export interface StaticDashboardData {
  geradoEm: string;
  hasData: boolean;
  currentSnapshot: DashboardSnapshotPayload | null;
  previousSnapshot: DashboardSnapshotPayload | null;
  blocos: Record<PanoramaBlock, PanoramaBlockSource>;
  savingTotal: {
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  } | null;
  snapshotHistory: Array<{
    id: number;
    fileName: string;
    referenceDate: string | null;
    importedAt: string;
    status: string;
    coverage: string[];
  }>;
  kpis: {
    processos: number;
    valorTotal: number;
    itens: number;
    concluidosAtas: number;
    concluidosItens: number;
    andamentoAtas: number;
    andamentoItens: number;
    saldoAtas: number;
    saldoItens: number;
    consumidoAtas: number;
    consumidoItens: number;
    aVencerAtas: number;
    aVencerItens: number;
    vencidasAtas: number;
    vencidasItens: number;
    vencidasVencerAtas: number;
    vencidasVencerItens: number;
  };
  porArea: Array<{
    area: string;
    processos: number;
    valor: number;
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  }>;
  topCompradores: Array<{
    area: string;
    responsavel: string;
    atas: number;
    itens: number;
    totalAtasArea: number | null;
  }>;
  fornecedores: Array<{
    area: string;
    fornecedor: string;
    atas: number;
    itens: number;
    concentracao: number;
    analise: string | null;
  }>;
  evolucao: Array<{
    area: string;
    concluidas_atas: number;
    concluidas_itens: number;
    andamento_atas: number;
    andamento_itens: number;
    saldo_itens: number;
    semsaldo_itens: number;
    vencidas_atas: number;
    vencidas_itens: number;
    a_vencer_atas: number;
    a_vencer_itens: number;
  }>;
  atasConcluidas: AtasConcluidasResult;
  statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
  previsoes: Array<{
    area: string;
    responsavel: string;
    data_previsao: string;
    dias: number;
    atas: number;
    itens: number;
    band?: ForecastBand;
  }>;
  datasets: ReturnType<typeof formatStoredDataset>[];
}

const AREAS = ["Indiretos", "Diretos", "CAPEX"] as const;
const AREA_KEYS: Record<string, SnapshotArea> = {
  INDIRETOS: "INDIRETOS",
  INDIRETO: "INDIRETOS",
  DIRETOS: "DIRETOS",
  DIRETO: "DIRETOS",
  CAPEX: "CAPEX",
};

function n(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function groupKey(...values: string[]) {
  return values.join("\u0000");
}

function areaKey(value: string | null | undefined): SnapshotArea | null {
  if (!value) return null;
  return AREA_KEYS[value.trim().toUpperCase()] ?? null;
}

function areaDisplay(value: SnapshotArea): string {
  return value[0] + value.slice(1).toLowerCase();
}

function daysUntil(iso: string, baseISO: string | null = null): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const base = baseISO ? baseISO.split("-").map(Number) : [];
  const now = new Date();
  const today = base.length === 3 && base.every((part) => Number.isFinite(part) && part > 0)
    ? new Date(base[0], base[1] - 1, base[2])
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function emptyEvolution(area: string) {
  return {
    area,
    concluidas_atas: 0,
    concluidas_itens: 0,
    andamento_atas: 0,
    andamento_itens: 0,
    saldo_itens: 0,
    semsaldo_itens: 0,
    vencidas_atas: 0,
    vencidas_itens: 0,
    a_vencer_atas: 0,
    a_vencer_itens: 0,
  };
}

function forecastBandDays(band: ForecastBand): number {
  if (band === "vencidas") return -1;
  if (band === "ate_15") return 7;
  if (band === "ate_30") return 23;
  if (band === "ate_60") return 45;
  return 61;
}

function snapshotHas(snapshot: DashboardSnapshotPayload | null | undefined, key: string): boolean {
  return Boolean(snapshot?.coverage.found.includes(key));
}

/** Compara as atas FINALIZADO atuais com a importação anterior que trouxe a aba. */
function buildAtasConcluidas(
  current: DashboardSnapshotPayload | null,
  datasets: Array<{ snapshot: DashboardSnapshotPayload | null | undefined; importedAt: string }>,
): AtasConcluidasResult {
  const empty: AtasConcluidasResult = {
    disponivel: false,
    primeiraLeitura: true,
    comparadoComReferencia: null,
    comparadoComImportadoEm: null,
    totalFinalizadas: 0,
    novas: [],
  };
  if (!current || !snapshotHas(current, "atas-concluidas")) return empty;
  const atuais = current.atasConcluidas ?? [];
  const older = datasets.slice(1).filter((dataset) => snapshotHas(dataset.snapshot, "atas-concluidas"));
  const currentRef = current.referenceDate;
  const previous = older.find((dataset) => {
    const ref = dataset.snapshot?.referenceDate ?? null;
    return !currentRef || !ref || ref < currentRef;
  }) ?? older[0] ?? null;
  const previousKeys = new Set((previous?.snapshot?.atasConcluidas ?? []).map((ata) => ata.key));
  const novas = previous ? atuais.filter((ata) => !previousKeys.has(ata.key)) : [...atuais];
  const maps = [
    current.fornecedoresPorContrato ?? {},
    ...datasets.slice(1).map((dataset) => dataset.snapshot?.fornecedoresPorContrato ?? {}),
  ];
  const resolved = novas.map((ata) => {
    if (ata.fornecedor || !ata.contrato) return ata;
    const fornecedor = maps.map((map) => map[ata.contrato!]).find(Boolean) ?? null;
    return { ...ata, fornecedor };
  });
  return {
    disponivel: true,
    primeiraLeitura: !previous,
    comparadoComReferencia: previous?.snapshot?.referenceDate ?? null,
    comparadoComImportadoEm: previous?.importedAt ?? null,
    totalFinalizadas: atuais.length,
    novas: resolved,
  };
}

export async function getStaticDashboardData(): Promise<StaticDashboardData> {
  const [rows, allDatasets, snapshotDatasets] = await Promise.all([
    listActiveProcessRows(),
    listDatasets(),
    listSnapshotDatasets(),
  ]);

  const currentSnapshot = snapshotDatasets[0]?.snapshot ?? null;
  // Antes de uma segunda importação, a referência fornecida para 13/10 mantém
  // os cards da semana anterior comparáveis. A partir da segunda leitura, o
  // histórico real ocupa este lugar automaticamente.
  const previousSnapshot = snapshotDatasets[1]?.snapshot ?? (currentSnapshot ? defaultPreviousSnapshot() : null);

  const byArea = new Map<string, ProcessRow[]>();
  for (const row of rows) {
    const area = row.area ?? "Não informado";
    const current = byArea.get(area) ?? [];
    current.push(row);
    byArea.set(area, current);
  }

  const valueOf = (list: ProcessRow[], key: keyof ProcessRow) =>
    list.reduce((sum, row) => sum + n(row[key] as number | null), 0);

  const baseKpis = {
    processos: rows.length,
    valorTotal: valueOf(rows, "valor"),
    itens: valueOf(rows, "quantidade"),
    concluidosAtas: rows.filter((r) => r.situacao_norm === "concluido").length,
    concluidosItens: rows.filter((r) => r.situacao_norm === "concluido").reduce((s, r) => s + n(r.quantidade), 0),
    andamentoAtas: rows.filter((r) => r.situacao_norm === null).length,
    andamentoItens: rows.filter((r) => r.situacao_norm === null).reduce((s, r) => s + n(r.quantidade), 0),
    saldoAtas: rows.filter((r) => r.status_consumo === "Com Saldo").length,
    saldoItens: rows.filter((r) => r.status_consumo === "Com Saldo").reduce((s, r) => s + n(r.quantidade), 0),
    consumidoAtas: rows.filter((r) => r.status_consumo === "Consumido").length,
    consumidoItens: rows.filter((r) => r.status_consumo === "Consumido").reduce((s, r) => s + n(r.quantidade), 0),
    aVencerAtas: rows.filter((r) => r.situacao === "a_vencer").length,
    aVencerItens: rows.filter((r) => r.situacao === "a_vencer").reduce((s, r) => s + n(r.quantidade), 0),
    vencidasAtas: rows.filter((r) => r.situacao === "vencido").length,
    vencidasItens: rows.filter((r) => r.situacao === "vencido").reduce((s, r) => s + n(r.quantidade), 0),
    vencidasVencerAtas: rows.filter((r) => r.situacao === "vencido" || r.situacao === "a_vencer").length,
    vencidasVencerItens: rows
      .filter((r) => r.situacao === "vencido" || r.situacao === "a_vencer")
      .reduce((s, r) => s + n(r.quantidade), 0),
  };

  const baseAreaRows = new Map<SnapshotArea, ProcessRow[]>();
  for (const area of SNAPSHOT_AREAS) baseAreaRows.set(area, []);
  for (const [name, areaRows] of byArea) {
    const key = areaKey(name);
    if (key) baseAreaRows.set(key, [...(baseAreaRows.get(key) ?? []), ...areaRows]);
  }

  const baseEvolution = new Map<SnapshotArea, ReturnType<typeof emptyEvolution>>();
  for (const area of SNAPSHOT_AREAS) {
    const areaRows = baseAreaRows.get(area) ?? [];
    const concluidas = areaRows.filter((r) => r.situacao_norm === "concluido");
    const andamento = areaRows.filter((r) => r.situacao_norm === null);
    const vencidas = areaRows.filter((r) => r.situacao === "vencido");
    const aVencer = areaRows.filter((r) => r.situacao === "a_vencer");
    baseEvolution.set(area, {
      area: areaDisplay(area),
      concluidas_atas: concluidas.length,
      concluidas_itens: concluidas.reduce((s, r) => s + n(r.quantidade), 0),
      andamento_atas: andamento.length,
      andamento_itens: andamento.reduce((s, r) => s + n(r.quantidade), 0),
      saldo_itens: areaRows.filter((r) => r.status_consumo === "Com Saldo").reduce((s, r) => s + n(r.quantidade), 0),
      semsaldo_itens: areaRows.filter((r) => r.status_consumo === "Sem Saldo").reduce((s, r) => s + n(r.quantidade), 0),
      vencidas_atas: vencidas.length,
      vencidas_itens: vencidas.reduce((s, r) => s + n(r.quantidade), 0),
      a_vencer_atas: aVencer.length,
      a_vencer_itens: aVencer.reduce((s, r) => s + n(r.quantidade), 0),
    });
  }

  const currentEvolution = baseEvolution;
  if (currentSnapshot && snapshotHas(currentSnapshot, "evolucao")) {
    for (const area of SNAPSHOT_AREAS) {
      const source = currentSnapshot.evolucao[area];
      const target = currentEvolution.get(area)!;
      target.concluidas_atas = source.concluidasAtas ?? target.concluidas_atas;
      target.concluidas_itens = source.concluidasItens ?? target.concluidas_itens;
      target.andamento_atas = source.andamentoAtas ?? target.andamento_atas;
      target.andamento_itens = source.andamentoItens ?? target.andamento_itens;
      target.saldo_itens = source.saldoItens ?? target.saldo_itens;
      target.semsaldo_itens = source.semSaldoItens ?? target.semsaldo_itens;
      target.vencidas_atas = source.vencidasAtas ?? target.vencidas_atas;
      target.vencidas_itens = source.vencidasItens ?? target.vencidas_itens;
      target.a_vencer_atas = source.aVencerAtas ?? target.a_vencer_atas;
      target.a_vencer_itens = source.aVencerItens ?? target.a_vencer_itens;
    }
  }

  const kpis = { ...baseKpis };
  if (currentSnapshot && snapshotHas(currentSnapshot, "kpis-leitura")) {
    kpis.concluidosAtas = currentSnapshot.kpis.concluidasAtas ?? kpis.concluidosAtas;
    kpis.concluidosItens = currentSnapshot.kpis.concluidasItens ?? kpis.concluidosItens;
    kpis.andamentoAtas = currentSnapshot.kpis.andamentoAtas ?? kpis.andamentoAtas;
    kpis.andamentoItens = currentSnapshot.kpis.andamentoItens ?? kpis.andamentoItens;
    kpis.saldoItens = currentSnapshot.kpis.saldoItens ?? kpis.saldoItens;
    kpis.consumidoItens = currentSnapshot.kpis.consumidoItens ?? kpis.consumidoItens;
    kpis.aVencerAtas = currentSnapshot.kpis.aVencerAtas ?? kpis.aVencerAtas;
    kpis.aVencerItens = currentSnapshot.kpis.aVencerItens ?? kpis.aVencerItens;
    kpis.vencidasAtas = currentSnapshot.kpis.vencidasAtas ?? kpis.vencidasAtas;
    kpis.vencidasItens = currentSnapshot.kpis.vencidasItens ?? kpis.vencidasItens;
    kpis.vencidasVencerAtas = kpis.aVencerAtas + kpis.vencidasAtas;
    kpis.vencidasVencerItens = kpis.aVencerItens + kpis.vencidasItens;
  }

  const porArea = SNAPSHOT_AREAS.map((key) => {
    const areaRows = baseAreaRows.get(key) ?? [];
    const source = currentSnapshot?.valueAreas[key];
    const evolution = currentEvolution.get(key)!;
    const totalFromTop = currentSnapshot?.topCompradores[key]?.totalAtasArea ?? null;
    const processos = totalFromTop ?? ((evolution.concluidas_atas + evolution.andamento_atas) || areaRows.length);
    return {
      area: areaDisplay(key),
      processos,
      valor: source?.valor ?? valueOf(areaRows, "valor"),
      valorSaving: source?.valorSaving ?? source?.valor ?? valueOf(areaRows, "valor"),
      saving_hist: source?.savingHist ?? valueOf(areaRows, "saving_hist"),
      saving_prop: source?.savingProp ?? valueOf(areaRows, "saving_prop"),
      reducao_hist_pct: source?.reducaoHistPct ?? null,
      reducao_prop_pct: source?.reducaoPropPct ?? null,
    };
  });

  // Quando a planilha consolidada é a única fonte, os totais do painel vêm
  // dos blocos explícitos, não da contagem de linhas operacionais (que pode ser
  // zero em uma importação somente de métricas).
  if (currentSnapshot) {
    kpis.processos = porArea.reduce((sum, area) => sum + area.processos, 0);
    kpis.valorTotal = porArea.reduce((sum, area) => sum + area.valor, 0);
    kpis.itens = [...currentEvolution.values()].reduce((sum, area) => sum + area.concluidas_itens + area.andamento_itens, 0);
  }

  const genericBuyerGroups = new Map<string, { area: string; responsavel: string; atas: number; itens: number; totalAtasArea: number | null }>();
  for (const row of rows) {
    const responsavel = row.responsavel?.trim();
    if (!responsavel) continue;
    const area = row.area ?? "Não informado";
    const key = groupKey(area, responsavel);
    const current = genericBuyerGroups.get(key) ?? { area, responsavel, atas: 0, itens: 0, totalAtasArea: null };
    current.atas += 1;
    current.itens += n(row.quantidade);
    genericBuyerGroups.set(key, current);
  }
  let topCompradores = [...genericBuyerGroups.values()]
    .sort((a, b) => b.itens - a.itens || b.atas - a.atas)
    .reduce((acc, item) => {
      const count = acc.filter((x) => x.area === item.area).length;
      if (count < 5) acc.push(item);
      return acc;
    }, [] as Array<{ area: string; responsavel: string; atas: number; itens: number; totalAtasArea: number | null }>);
  if (currentSnapshot && snapshotHas(currentSnapshot, "top-compradores")) {
    topCompradores = SNAPSHOT_AREAS.flatMap((area) => currentSnapshot.topCompradores[area].buyers.map((buyer) => ({
      area: areaDisplay(area),
      responsavel: buyer.name,
      atas: buyer.atas,
      itens: buyer.itens,
      totalAtasArea: currentSnapshot.topCompradores[area].totalAtasArea,
    })));
  }

  // O panorama usa exclusivamente a tabela FORNECEDORES GERAL. Não há
  // fallback para agrupar fornecedores dos registros operacionais, pois isso
  // troca a base consolidada da planilha por uma contagem parcial/por área.
  const fornecedores: StaticDashboardData["fornecedores"] = currentSnapshot && snapshotHas(currentSnapshot, "fornecedores")
    ? (currentSnapshot.fornecedoresGeral ?? []).map((item) => ({
        area: "Geral",
        fornecedor: item.fornecedor,
        atas: item.qtdAtas ?? 0,
        itens: item.qtdItens ?? 0,
        concentracao: item.concentracaoPct ?? 0,
        analise: item.analise,
      }))
    : [];

  const atasConcluidas = buildAtasConcluidas(currentSnapshot, snapshotDatasets);
  const statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null> = {
    INDIRETOS: null,
    DIRETOS: null,
    CAPEX: null,
  };
  if (currentSnapshot && snapshotHas(currentSnapshot, "status-atas")) {
    for (const area of SNAPSHOT_AREAS) statusAtas[area] = currentSnapshot.statusAtas?.[area] ?? null;
  }

  const forecastGroups = new Map<string, { area: string; responsavel: string; data_previsao: string; dias: number; atas: number; itens: number; band?: ForecastBand }>();
  for (const row of rows) {
    if (row.situacao_norm !== null || !row.data_previsao) continue;
    const area = row.area ?? "Não informado";
    const responsavel = row.responsavel ?? "Não informado";
    const key = groupKey(area, responsavel, row.data_previsao);
    const current = forecastGroups.get(key) ?? { area, responsavel, data_previsao: row.data_previsao, dias: daysUntil(row.data_previsao, currentSnapshot?.referenceDate ?? null), atas: 0, itens: 0 };
    current.atas += 1;
    current.itens += n(row.quantidade);
    forecastGroups.set(key, current);
  }
  let previsoes = [...forecastGroups.values()].sort((a, b) => a.dias - b.dias);
  if (currentSnapshot && (snapshotHas(currentSnapshot, "previsao-faixas") || snapshotHas(currentSnapshot, "previsoes-cruzadas"))) {
    const snapshotForecast: typeof previsoes = [];
    // O panorama não exibe previsões canceladas ou finalizadas, mesmo quando
    // essas faixas existirem no snapshot importado.
    for (const band of ["acima_60", "ate_15", "ate_30", "ate_60", "vencidas"] as ForecastBand[]) {
      for (const area of SNAPSHOT_AREAS) {
        const source = currentSnapshot.previsoes[band][area];
        const totalAtas = source.atas ?? 0;
        const totalItens = source.itens ?? 0;
        const listedAtas = source.buyers.reduce((sum, buyer) => sum + (buyer.atas ?? 0), 0);
        const listedItens = source.buyers.reduce((sum, buyer) => sum + (buyer.itens ?? 0), 0);
        for (const buyer of source.buyers) {
          snapshotForecast.push({
            area: areaDisplay(area),
            responsavel: buyer.name,
            data_previsao: buyer.prazoConclusao ?? "",
            dias: buyer.prazoConclusao && /^\d{4}-\d{2}-\d{2}$/.test(buyer.prazoConclusao)
              ? daysUntil(buyer.prazoConclusao, currentSnapshot?.referenceDate ?? null)
              : forecastBandDays(band),
            atas: buyer.atas ?? 0,
            itens: buyer.itens ?? 0,
            band,
          });
        }
        // Mantém os totais exatos da tabela de faixas mesmo quando a planilha
        // de compradores possui somente parte das linhas detalhadas.
        if (totalAtas !== listedAtas || totalItens !== listedItens) {
          snapshotForecast.push({
            area: areaDisplay(area),
            responsavel: "",
            data_previsao: "",
            dias: forecastBandDays(band),
            atas: Math.max(0, totalAtas - listedAtas),
            itens: Math.max(0, totalItens - listedItens),
            band,
          });
        }
      }
    }
    previsoes = snapshotForecast;
  }

  const hasData = rows.length > 0 || Boolean(currentSnapshot);
  const savingTotal = currentSnapshot && snapshotHas(currentSnapshot, "saving")
    ? {
        valorSaving: currentSnapshot.savingTotal.valorSaving ?? porArea.reduce((sum, area) => sum + area.valorSaving, 0),
        saving_hist: currentSnapshot.savingTotal.savingHist ?? porArea.reduce((sum, area) => sum + area.saving_hist, 0),
        saving_prop: currentSnapshot.savingTotal.savingProp ?? porArea.reduce((sum, area) => sum + area.saving_prop, 0),
        reducao_hist_pct: currentSnapshot.savingTotal.reducaoHistPct,
        reducao_prop_pct: currentSnapshot.savingTotal.reducaoPropPct,
      }
    : null;

  // Um bloco ausente não deve aparecer como zero: isso diferencia “não veio na
  // planilha” de um indicador realmente igual a zero.
  const hasRows = rows.length > 0;
  const fromSnapshotOr = (key: SnapshotBlockKey, fallback: boolean): PanoramaBlockSource =>
    snapshotHas(currentSnapshot, key) ? "snapshot" : fallback ? "registros" : "ausente";
  const blocos: Record<PanoramaBlock, PanoramaBlockSource> = {
    "kpis-leitura": fromSnapshotOr("kpis-leitura", hasRows),
    "atas-concluidas": fromSnapshotOr("atas-concluidas", false),
    "valores-por-area": fromSnapshotOr("valores-por-area", rows.some((row) => row.valor !== null)),
    saving: fromSnapshotOr("saving", rows.some((row) => row.saving_hist !== null || row.saving_prop !== null)),
    "top-compradores": fromSnapshotOr("top-compradores", rows.some((row) => Boolean(row.responsavel?.trim()))),
    fornecedores: fromSnapshotOr("fornecedores", false),
    evolucao: fromSnapshotOr("evolucao", hasRows),
    "status-atas": fromSnapshotOr("status-atas", false),
    "previsao-faixas": snapshotHas(currentSnapshot, "previsao-faixas") || snapshotHas(currentSnapshot, "previsoes-cruzadas")
      ? "snapshot"
      : rows.some((row) => row.situacao_norm === null && Boolean(row.data_previsao)) ? "registros" : "ausente",
    "previsao-meses": fromSnapshotOr("previsao-meses", false),
  };

  const snapshotHistory = snapshotDatasets.map((dataset) => ({
    id: dataset.id,
    fileName: dataset.fileName,
    referenceDate: dataset.referenceDate,
    importedAt: dataset.importedAt,
    status: dataset.status,
    coverage: dataset.snapshot?.coverage.found ?? [],
  }));

  return {
    geradoEm: new Date().toISOString(),
    hasData,
    currentSnapshot,
    previousSnapshot,
    blocos,
    savingTotal,
    snapshotHistory,
    kpis,
    porArea,
    topCompradores,
    fornecedores,
    evolucao: [...currentEvolution.values()],
    atasConcluidas,
    statusAtas,
    previsoes,
    datasets: allDatasets.map(formatStoredDataset),
  };
}

export async function getStaticBaseSummary() {
  const data = await getStaticDashboardData();
  const active = await listActiveDatasets();
  const references = active.map((d) => d.referenceDate).filter(Boolean) as string[];
  return {
    hasData: data.hasData,
    referenceDate: references.sort().reverse()[0] ?? data.currentSnapshot?.referenceDate ?? null,
    activeCount: active.length,
    processCount: data.kpis.processos,
  };
}
````

## `src/lib/static-store.ts`

````typescript
import {
  situacaoPrazo,
  type CleanRecord,
  type DatasetKind,
  type DatasetNatureza,
  type ImportMode,
  type Issue,
  type SituacaoChave,
} from "@/lib/domain";
import type { DashboardSnapshotPayload } from "@/lib/dashboard-snapshot";

/**
 * Persistência local para a versão publicada no GitHub Pages.
 *
 * GitHub Pages não oferece API nem PostgreSQL. Para manter a importação
 * funcional, os datasets ficam no IndexedDB do navegador do usuário. Isso
 * preserva os registros entre visitas no mesmo navegador, mas não sincroniza
 * dados entre pessoas, dispositivos ou o SharePoint.
 */

export const STATIC_DATA_EVENT = "giro:base-updated";
const DB_NAME = "giro-de-atas-static";
const DB_VERSION = 2;
const DATASETS_STORE = "datasets";
const DOCUMENTS_STORE = "documents";

export interface StoredDataset {
  id: number;
  kind: DatasetKind;
  natureza: DatasetNatureza;
  fileName: string;
  sheetName: string | null;
  referenceDate: string | null;
  importedAt: string;
  status: "active" | "superseded";
  mode: ImportMode;
  rowCount: number;
  validCount: number;
  skippedCount: number;
  dupCount: number;
  warningCount: number;
  report: {
    issues: Issue[];
    issuesTotal: number;
  };
  records: CleanRecord[];
  /** Leitura explícita dos blocos do painel; permanece no histórico local. */
  snapshot: DashboardSnapshotPayload | null;
}

export interface StoredDocument {
  id: number;
  titulo: string;
  url: string;
  categoria: string;
  descricao: string | null;
  createdAt: string;
}

export interface SaveDatasetInput {
  kind: DatasetKind;
  natureza: DatasetNatureza;
  fileName: string;
  sheetName: string | null;
  referenceDate: string | null;
  importMode: ImportMode;
  rowCount: number;
  result: {
    records: CleanRecord[];
    issues: Issue[];
    skipped: number;
    duplicates: number;
    warnings: number;
  };
  snapshot?: DashboardSnapshotPayload | null;
}

export interface ProcessRow {
  id: string;
  dataset_id: number;
  area: string | null;
  numero: string;
  objeto: string;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacao_fonte: string | null;
  situacao_norm: "concluido" | "cancelado" | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade: number | null;
  valor: number | null;
  status_consumo: string | null;
  saving_hist: number | null;
  saving_prop: number | null;
  status_renovacao: string | null;
  data_previsao: string | null;
  observacao: string | null;
  link: string | null;
  source_row: number | null;
  extra: Record<string, string> | null;
  dias: number | null;
  situacao: SituacaoChave;
  file_name: string;
  kind: string;
  natureza: string;
  reference_date: string | null;
  imported_at: string;
}

function assertBrowser() {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    throw new Error("O armazenamento local só está disponível no navegador.");
  }
}

function openDatabase(): Promise<IDBDatabase> {
  assertBrowser();
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATASETS_STORE)) {
        db.createObjectStore(DATASETS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
        db.createObjectStore(DOCUMENTS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha no armazenamento local."));
  });
}

async function readAll<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readonly");
    return await requestResult(tx.objectStore(storeName).getAll() as IDBRequest<T[]>);
  } finally {
    db.close();
  }
}

async function put<T>(storeName: string, value: T): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar no armazenamento local."));
      tx.onabort = () => reject(tx.error ?? new Error("Operação cancelada no armazenamento local."));
    });
  } finally {
    db.close();
  }
}

async function deleteById(storeName: string, id: number): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao excluir do armazenamento local."));
      tx.onabort = () => reject(tx.error ?? new Error("Operação cancelada no armazenamento local."));
    });
  } finally {
    db.close();
  }
}

export async function listDatasets(): Promise<StoredDataset[]> {
  const rows = await readAll<StoredDataset>(DATASETS_STORE);
  return rows.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function listActiveDatasets(): Promise<StoredDataset[]> {
  const rows = await listDatasets();
  return rows.filter((d) => d.status === "active");
}

/** Snapshots ativos e arquivados, em ordem do mais recente para o mais antigo. */
export async function listSnapshotDatasets(): Promise<StoredDataset[]> {
  const rows = await listDatasets();
  return rows.filter((dataset) => Boolean(dataset.snapshot)).sort((a, b) => b.importedAt.localeCompare(a.importedAt));
}

export async function saveDataset(input: SaveDatasetInput): Promise<StoredDataset> {
  const existing = await listDatasets();
  const id = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const now = new Date().toISOString();

  const superseded = [
    ...(input.importMode === "replace"
      ? existing
          .filter((item) => item.status === "active" && item.kind === input.kind)
          .map((item) => ({ ...item, status: "superseded" as const }))
      : []),
    // Em “Substituir”, a leitura anterior continua no histórico e deixa de
    // ser ativa. Em “Combinar”, as leituras locais permanecem ativas para que
    // o histórico/série do snapshot possa ser consultado sem apagar a base.
    ...(input.snapshot && input.importMode === "replace"
      ? existing
          .filter((item) => item.status === "active" && item.snapshot)
          .filter((item) => !existing.some((candidate) => candidate.id === item.id && candidate.status === "superseded"))
          .map((item) => ({ ...item, status: "superseded" as const }))
      : []),
  ].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);

  const dataset: StoredDataset = {
    id,
    kind: input.kind,
    natureza: input.natureza,
    fileName: input.fileName,
    sheetName: input.sheetName,
    referenceDate: input.referenceDate,
    importedAt: now,
    status: "active",
    mode: input.importMode,
    rowCount: input.rowCount,
    validCount: input.result.records.length,
    skippedCount: input.result.skipped,
    dupCount: input.result.duplicates,
    warningCount: input.result.warnings,
    report: {
      issues: input.result.issues.slice(0, 500),
      issuesTotal: input.result.issues.length,
    },
    records: input.result.records,
    snapshot: input.snapshot ?? null,
  };

  // Uma única transação mantém a substituição e a nova base consistentes:
  // se qualquer gravação falhar, nenhuma das alterações é confirmada.
  const db = await openDatabase();
  try {
    const tx = db.transaction(DATASETS_STORE, "readwrite");
    const store = tx.objectStore(DATASETS_STORE);
    for (const previous of superseded) store.put(previous);
    store.put(dataset);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Falha ao salvar a importação local."));
      tx.onabort = () => reject(tx.error ?? new Error("Importação local cancelada."));
    });
  } finally {
    db.close();
  }
  return dataset;
}

export async function deleteDataset(id: number): Promise<void> {
  await deleteById(DATASETS_STORE, id);
}

export async function listActiveProcessRows(): Promise<ProcessRow[]> {
  const datasets = await listActiveDatasets();
  const rows: ProcessRow[] = [];
  for (const dataset of datasets) {
    dataset.records.forEach((record, index) => {
      const prazo = situacaoPrazo(record.situacaoNorm, record.dataFim);
      rows.push({
        id: `${dataset.id}:${index}`,
        dataset_id: dataset.id,
        area: record.area,
        numero: record.numero,
        objeto: record.objeto,
        unidade: record.unidade,
        fornecedor: record.fornecedor,
        responsavel: record.responsavel,
        etapa: record.etapa,
        situacao_fonte: record.situacaoFonte,
        situacao_norm: record.situacaoNorm,
        data_inicio: record.dataInicio,
        data_fim: record.dataFim,
        quantidade: record.quantidade,
        valor: record.valor,
        status_consumo: record.statusConsumo,
        saving_hist: record.savingHist,
        saving_prop: record.savingProp,
        status_renovacao: record.statusRenovacao,
        data_previsao: record.dataPrevisao,
        observacao: record.observacao,
        link: record.link,
        source_row: record.sourceRow,
        extra: record.extra,
        dias: prazo.dias,
        situacao: prazo.chave,
        file_name: dataset.fileName,
        kind: dataset.kind,
        natureza: dataset.natureza,
        reference_date: dataset.referenceDate,
        imported_at: dataset.importedAt,
      });
    });
  }
  return rows;
}

export async function listDocuments(): Promise<StoredDocument[]> {
  const rows = await readAll<StoredDocument>(DOCUMENTS_STORE);
  return rows.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.titulo.localeCompare(b.titulo));
}

export async function createDocument(input: Omit<StoredDocument, "id" | "createdAt">): Promise<StoredDocument> {
  const existing = await listDocuments();
  const id = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const document: StoredDocument = { ...input, id, createdAt: new Date().toISOString() };
  await put(DOCUMENTS_STORE, document);
  return document;
}

export async function deleteDocument(id: number): Promise<void> {
  await deleteById(DOCUMENTS_STORE, id);
}

export function notifyStaticDataChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(STATIC_DATA_EVENT));
}

export function formatStoredDataset(dataset: StoredDataset) {
  return {
    id: dataset.id,
    kind: dataset.kind,
    natureza: dataset.natureza,
    file_name: dataset.fileName,
    sheet_name: dataset.sheetName,
    reference_date: dataset.referenceDate,
    imported_at: dataset.importedAt,
    status: dataset.status,
    mode: dataset.mode,
    row_count: dataset.rowCount,
    valid_count: dataset.validCount,
    skipped_count: dataset.skippedCount,
    dup_count: dataset.dupCount,
    warning_count: dataset.warningCount,
    registros: dataset.records.length,
    has_snapshot: Boolean(dataset.snapshot),
    snapshot_coverage: dataset.snapshot?.coverage ?? null,
    report: dataset.report,
  };
}
````

## `tsconfig.json`

````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
````
