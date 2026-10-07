# Giro de Atas — Código-fonte consolidado

Documento de referência com todos os arquivos do projeto e seus respectivos códigos.

---

## Sumário

- [Arquivos de configuração](#arquivos-de-configuração)
  - [drizzle.config.json](#drizzleconfigjson)
  - [eslint.config.mjs](#eslintconfigmjs)
  - [next.config.ts](#nextconfigts)
  - [package.json](#packagejson)
  - [postcss.config.mjs](#postcssconfigmjs)
  - [tsconfig.json](#tsconfigjson)
  - [.gitignore](#gitignore)
- [API (src/app/api/)](#api-srcappapi)
  - [dashboard/route.ts](#dashboardroutets)
  - [datasets/route.ts](#datasetsroutets)
  - [documentos/route.ts](#documentosroutets)
  - [health/route.ts](#healthroutets)
  - [import/route.ts](#importroutets)
  - [processos/export/route.ts](#processosexportroutets)
  - [processos/route.ts](#processosroutets)
- [Páginas (src/app/)](#paginas-srcapp)
  - [layout.tsx](#layouttsx)
  - [page.tsx (Panorama)](#pagetsx-panorama)
  - [globals.css](#globalscss)
  - [documentos/page.tsx](#documentospagetsx)
  - [importar/page.tsx](#importarpagetsx)
  - [processos/page.tsx](#processospagetsx)
- [Componentes (src/components/)](#componentes-srccomponents)
  - [app-shell.tsx](#app-shelltsx)
  - [charts.tsx](#chartstsx)
  - [datasets-panel.tsx](#datasets-paneltsx)
  - [documents-manager.tsx](#documents-managertsx)
  - [import-wizard.tsx](#import-wizardtsx)
  - [processos-browser.tsx](#processos-browsertsx)
  - [ui.tsx](#uitsx)
- [Banco de dados (src/db/)](#banco-de-dados-srcdb)
  - [index.ts](#indexts)
  - [schema.ts](#schemats)
- [Bibliotecas (src/lib/)](#bibliotecas-srclib)
  - [client-parse.ts](#client-parsets)
  - [csv.ts](#csvts)
  - [dashboard-data.ts](#dashboard-datats)
  - [domain.ts](#domaints)
  - [format.ts](#formatts)
  - [mapping.ts](#mappingts)
- [Scripts](#scripts)
  - [e2e-test.mjs](#e2e-testmjs)

---

## Arquivos de configuração

### drizzle.config.json

```json
{
  "dialect": "postgresql",
  "schema": "./src/db/schema.ts",
  "dbCredentials": {
    "url": "postgresql://postgres:postgres@127.0.0.1:5432/app_db"
  }
}
```

### eslint.config.mjs

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

### next.config.ts

> **Versão GitHub Pages (branch gh-pages)** — configurado para exportação estática.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Atas",
  assetPrefix: "/Atas/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

### package.json

```json
{
  "name": "nextjs-postgresql-template",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "dotenv": "17.3.1",
    "drizzle-orm": "0.45.2",
    "lucide-react": "^1.52.0",
    "next": "16.2.6",
    "pg": "8.20.0",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.17",
    "@types/node": "22.19.15",
    "@types/pg": "8.18.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "drizzle-kit": "0.31.10",
    "eslint": "9.39.4",
    "eslint-config-next": "16.2.6",
    "postcss": "8.5.8",
    "tailwindcss": "4.1.17",
    "typescript": "5.9.3"
  }
}
```

### postcss.config.mjs

```javascript
const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default postcssConfig;
```

### tsconfig.json

```json
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
```

### .gitignore

```gitignore
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
```

---

## API (src/app/api/)

> **Branch gh-pages:** O diretório `src/app/api/` foi removido nesta branch. API routes não funcionam em exportação estática (GitHub Pages) pois exigem um servidor. As rotas abaixo existem apenas na branch `main` (para deploy em Vercel). O conteúdo completo das rotas está preservado no histórico do repositório: https://github.com/lucasdorta-a11y/Atas

### Rotas removidas na branch gh-pages

| Rota | Métodos | Descrição |
| --- | --- | --- |
| `dashboard/route.ts` | GET | Visão consolidada do panorama (KPIs, áreas, fornecedores, evolução, renovações, previsões, variações) |
| `datasets/route.ts` | GET, DELETE | Lista bases importadas; exclui base por ID (cascade) |
| `documentos/route.ts` | GET, POST, DELETE | CRUD de documentos de apoio com validação de URL |
| `health/route.ts` | GET | Verifica conectividade com o banco |
| `import/route.ts` | POST | Valida e grava importação de planilhas (fases validate/commit) |
| `processos/route.ts` | GET | Lista processos com busca, filtros, ordenação, paginação e facetas |
| `processos/export/route.ts` | GET | Exporta processos filtrados em CSV (BOM UTF-8, `;`, anti-injeção) |

```typescript
// dashboard/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// datasets/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// documentos/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// health/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// import/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// processos/export/route.ts — removido na branch gh-pages (ver branch main)
```

```typescript
// processos/route.ts — removido na branch gh-pages (ver branch main)
```

---

## Páginas (src/app/)

### layout.tsx

```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Archivo } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["600", "700"],
  display: "swap",
});

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
    <html lang="pt-BR" className={`${inter.variable} ${archivo.variable}`}>
      <body className="antialiased font-sans">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

### page.tsx (Panorama)

> **Branch gh-pages:** Convertido para client component. Removido `getDashboardData` (servidor), `force-dynamic`, `Metadata` e todos os KPIs/gráficos que dependiam de dados do banco. Agora mostra apenas o estado vazio orientando importação + o painel de auditoria de bases (que tenta fetch da API e lida com erro graciosamente). O código completo do servidor (KPIs, gráficos, renovações, previsões) está preservado na branch `main`.

```tsx
"use client";

import Link from "next/link";
import { FileStack, FileUp } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { DatasetsPanel } from "@/components/datasets-panel";

export default function PanoramaPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Panorama geral"
        title="Giro de Atas"
        description="Painel interno de compras e Atas de Registro de Preços. Importe suas planilhas operacionais e de snapshots para alimentar os indicadores."
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

      <section className="mt-12 border-t border-line pt-8" data-no-print>
        <h2 className="text-[16px] font-bold text-navy-950 mb-4">Auditoria das Bases de Dados</h2>
        <DatasetsPanel />
      </section>
    </div>
  );
}
```

<details>
<summary>Código completo da branch <code>main</code> (servidor, com KPIs e gráficos)</summary>

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { FileStack, FileUp, ShieldAlert, AlertTriangle } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard-data";
import { DatasetsPanel } from "@/components/datasets-panel";
import { AreaTag, EmptyState, PageHeader } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panorama" };

export default async function PanoramaPage() {
  const data = await getDashboardData();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!data.hasData) {
    return (
      <>
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Painel interno de compras e Atas de Registro de Preços. Importe suas planilhas operacionais e de snapshots para alimentar os indicadores."
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

  const { kpis, porArea, topCompradores, fornecedores, evolucao, renovacoes, previsoes } = data;

  // Helpers para o funil de renovação
  const getRenov = (area: string, status: string) => {
    const row = (renovacoes as any[]).find(r => r.area === area && r.status === status);
    return { atas: row?.atas || 0, itens: row?.itens || 0 };
  };

  // Previsões de Conclusão por Faixa
  const prevByAreaAndRange = (area: string, rangeFunc: (dias: number) => boolean) => {
    const rows = (previsoes as any[]).filter(r => r.area === area && r.dias !== null && rangeFunc(r.dias));
    const atas = rows.reduce((acc, r) => acc + r.atas, 0);
    const itens = rows.reduce((acc, r) => acc + r.itens, 0);
    // Agrupa por comprador
    const buyersMap = new Map<string, number>();
    for (const r of rows) {
      buyersMap.set(r.responsavel, (buyersMap.get(r.responsavel) || 0) + r.atas);
    }
    const buyers = Array.from(buyersMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    return { atas, itens, buyers };
  };

  return (
    <div className="space-y-8">
      <PageHeader
        overline={`Panorama geral · calculado em ${fmtDateLong(hoje)}`}
        title="Gestão Atas Concluídas - Compras"
      />

      {/* Bloco 1: KPIs Principais */}
      <section className="grid gap-4 md:grid-cols-3">
        <KpiChartCard 
          title="ATA CONCLUÍDAS (VÁLIDAS)" 
          bars={[{ label: "ATAS", val: kpis.concluidosAtas, color: "#0c2338" }, { label: "ITENS", val: kpis.concluidosItens, color: "#e06e1f" }]}
          groupLabel="VÁLIDO"
        />
        <KpiChartCard 
          title="ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)" 
          bars={[{ label: "COM SALDO", val: kpis.saldoItens, color: "#0c2338" }, { label: "CONSUMIDO", val: kpis.consumidoItens, color: "#e06e1f" }]}
        />
        <KpiChartCard 
          title="ATAS VENCIDAS E A VENCER" 
          bars={[
            { label: "RENOVAR", val: kpis.vencidasVencerAtas, color: "#0c2338" }, 
            { label: "VENCIDO", val: kpis.vencidasVencerItens, color: "#e06e1f" }
          ]}
        />
      </section>

      {/* Bloco 2: Valor Contratado & Saving */}
      <section className="card overflow-hidden text-[13px]">
        <div className="grid lg:grid-cols-2 divide-x divide-line">
          <div>
            <h3 className="px-5 py-3 text-[18px] text-navy-900 font-display">Valor Contratado Por Área</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white">
                {(porArea as any[]).map(a => (
                  <tr key={a.area} className={a.area === "DIRETOS" ? "bg-diretos-500 text-white font-bold" : a.area === "INDIRETOS" ? "bg-indiretos-500 text-white font-bold" : a.area === "CAPEX" ? "bg-capex-100 font-bold" : "bg-neutral-100 font-bold"}>
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
          </div>
          <div>
            <h3 className="px-5 py-3 text-[18px] text-navy-900 font-display">Saving <span className="text-[14px] text-danger-700 block mt-1 font-sans">Mapeamento iniciado em abr.2026</span></h3>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold text-[11px] text-center">
                  <th className="px-2 py-3">VALOR CONTRATADO R$</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING HISTÓRICO R$ / %</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING SOB PROPOSTA R$ / %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white text-center font-medium bg-[#E6E6E6]">
                {(porArea as any[]).map(a => (
                  <tr key={a.area}>
                    <td className="px-2 py-3">{fmtCurrency(a.valor)}</td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_hist)}<br/>
                      <span className="text-[11px] font-normal">{a.valor > 0 ? fmtNum((a.saving_hist / a.valor) * 100) : "0"}%</span>
                    </td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_prop)}<br/>
                      <span className="text-[11px] font-normal">{a.valor > 0 ? fmtNum((a.saving_prop / a.valor) * 100) : "0"}%</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#b3d482] font-bold">
                  <td className="px-2 py-3">{fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.valor, 0))}</td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0))}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + a.valor, 0))) * 100)}%</span>
                  </td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0))}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + a.valor, 0))) * 100)}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bloco 3: Distribuição de Volume & Fornecedores */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[20px] font-display text-navy-900 mb-4">Distribuição de Volume por Área (% Atas)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = kpis.processos > 0 ? (areaStats.processos / kpis.processos) * 100 : 0;
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className="bg-navy-950 text-white text-center py-3">
                    <div className="font-bold">{area}</div>
                    <div className="text-[13px]">{areaStats.processos} ATAS — {fmtNum(percent)}% DO TOTAL</div>
                  </div>
                  <div className="p-4 bg-neutral-100">
                    <div className="text-center font-bold text-[12px] uppercase text-navy-900 mb-3 underline underline-offset-4">TOP {Math.max(4, tCompradores.length)} COMPRADORES</div>
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
        </div>

        <div>
          <h2 className="text-[20px] font-display text-navy-900 mb-4">Representatividade Fornecedores (Top 20)</h2>
          <div className="card overflow-hidden overflow-x-auto text-[12px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white text-center font-bold">
                  <th className="px-4 py-2 border-r border-white/20">FORNECEDOR</th>
                  <th className="px-4 py-2 border-r border-white/20 w-24">QTD ATAS</th>
                  <th className="px-4 py-2 border-r border-white/20 w-24">QTD ITENS</th>
                  <th className="px-4 py-2 border-r border-white/20 w-44">% CONCENTRAÇÃO DE ITENS</th>
                  <th className="px-4 py-2 w-48">ANÁLISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-center font-medium">
                {(fornecedores as any[]).map(f => {
                  let badge = "Pulverizado";
                  let bgBadge = "bg-[#f2e6b1]";
                  if (f.concentracao >= 15) { badge = "Alta Concentração"; bgBadge = "bg-[#f3baba]"; }
                  else if (f.concentracao >= 5) { badge = "Volume Médio"; bgBadge = "bg-[#fdf0a6]"; }
                  
                  return (
                    <tr key={f.fornecedor}>
                      <td className="px-4 py-2 text-left uppercase text-navy-950">{f.fornecedor}</td>
                      <td className="px-4 py-2 border-l border-white">{f.atas}</td>
                      <td className="px-4 py-2 border-l border-white">{f.itens}</td>
                      <td className="px-4 py-2 border-l border-white">{fmtNum(f.concentracao)}%</td>
                      <td className={clsx("px-4 py-2 border-l border-white text-left", bgBadge)}>{badge}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bloco 4: Evolução Por Área */}
      <section>
        <h2 className="text-[20px] font-display text-navy-900 mb-4">Evolução Por Área (Por Status Atual)</h2>
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
              {(evolucao as any[]).map(e => (
                <tr key={e.area}>
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", e.area === "DIRETOS" ? "bg-diretos-500" : e.area === "INDIRETOS" ? "bg-indiretos-500" : e.area === "CAPEX" ? "bg-capex-500" : "bg-neutral-500")}>
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
      </section>

      {/* Bloco 5: Status de Renovações */}
      <section>
        <h2 className="text-[24px] font-display text-accent-500 mb-6 font-bold">Status de Renovações</h2>
        <div className="space-y-8">
          {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
            const naoIniciado = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Não Iniciado");
            const naoRenov = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Não Será Renovado");
            const novoProj = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Criado Novo Projeto");
            const emRenov = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Em Renovação");

            return (
              <div key={area}>
                <div className={clsx("w-full py-2 text-center text-white font-bold mb-3 tracking-wider", area === "INDIRETOS" ? "bg-indiretos-600" : area === "DIRETOS" ? "bg-diretos-500" : "bg-capex-500")}>
                  {area}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[12px]">
                  <RenovBox title="NÃO INICIADO" data={naoIniciado} bg="bg-[#f0e6f5]" />
                  <RenovBox title="NÃO SERÁ RENOVADO" data={naoRenov} bg="bg-[#f7e6e6]" />
                  <RenovBox title="CRIADO NOVO PROJETO" data={novoProj} bg="bg-[#fbdca3]" />
                  <RenovBox title="EM RENOVAÇÃO" data={emRenov} bg="bg-[#eaf5d8]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bloco 6: Previsão de Conclusão Por Faixa */}
      <section>
        <h2 className="text-[24px] font-display text-accent-500 mb-6 font-bold">Indicadores - Atas em andamento</h2>
        <h3 className="text-[18px] text-navy-900 mb-4 font-display">Previsão de Conclusão Por Faixa (Até 60 dias)</h3>
        
        <div className="space-y-8">
          <FaixaPrevisao title="Previstas para concluir nos próximos 15 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d >= 0 && d <= 15) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d >= 0 && d <= 15) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d >= 0 && d <= 15) }
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 30 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d > 15 && d <= 30) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d > 15 && d <= 30) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d > 15 && d <= 30) }
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 60 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d > 30 && d <= 60) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d > 30 && d <= 60) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d > 30 && d <= 60) }
          ]}/>
        </div>
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

function KpiChartCard({ title, bars, groupLabel }: { title: string, bars: { label: string, val: number, color: string }[], groupLabel?: string }) {
  const max = Math.max(...bars.map(b => b.val), 1);
  return (
    <div className="card p-4 border border-line flex flex-col items-center justify-center">
      <h3 className="text-[12px] font-bold text-neutral-500 uppercase tracking-wide text-center mb-6 h-8">{title}</h3>
      <div className="flex items-end gap-2 h-24 mb-2 relative">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-col items-center justify-end w-10">
            <span className="text-[11px] font-bold text-white px-1 py-0.5 rounded-sm z-10" style={{ backgroundColor: b.color, transform: 'translateY(5px)' }}>
              {b.val}
            </span>
            <div className="w-full" style={{ height: `${(b.val / max) * 60}px`, backgroundColor: b.color }} />
          </div>
        ))}
      </div>
      <div className="w-full border-t border-line mt-1 relative pt-2 text-center text-[10px] font-bold text-neutral-500">
        {groupLabel ? groupLabel : (
          <div className="flex gap-4 justify-center">
            {bars.map(b => <span key={b.label}>{b.label}</span>)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 mt-4 items-end w-full pr-4 text-[10px] font-bold text-neutral-500">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2" style={{ backgroundColor: b.color }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RenovBox({ title, data, bg }: { title: string, data: { atas: number, itens: number }, bg: string }) {
  return (
    <div className="flex flex-col border border-line">
      <div className="bg-navy-950 text-white font-bold py-2 px-1 text-[11px]">{title}</div>
      <div className={clsx("flex-1 py-4 font-medium flex flex-col items-center justify-center min-h-[60px]", bg)}>
        {data.atas === 0 && data.itens === 0 ? (
          <span className="text-neutral-500">0</span>
        ) : (
          <>
            <span className="text-navy-950">{fmtInt(data.atas)} ATAS</span>
            <span className="text-navy-950">{fmtInt(data.itens)} ITENS</span>
          </>
        )}
      </div>
    </div>
  );
}

function FaixaPrevisao({ title, areaStats }: { title: string, areaStats: any[] }) {
  return (
    <div>
      <div className="bg-[#dcf0cf] border border-line py-2 text-center text-navy-950 font-bold mb-4">{title}</div>
      <div className="grid grid-cols-3 gap-4">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("py-1 text-center text-white text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="text-[#0d952e] font-display mb-6">
              <div className="text-[18px] font-bold">{String(s.atas).padStart(2, '0')} ATAS</div>
              <div className="text-[18px] font-bold">{String(s.itens).padStart(2, '0')} ITENS</div>
            </div>
            <div className="space-y-3">
              {s.buyers.map((b: any) => (
                <div key={b.name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-navy-900 uppercase truncate" title={b.name}>{b.name}</div>
                    <div className="text-[9px] text-neutral-500 uppercase">ANALISTA DE COMPRAS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

</details>

### globals.css

```css
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

  /* Cores das áreas */
  --color-indiretos-700: #1e4f80;
  --color-indiretos-600: #27629a;
  --color-indiretos-500: #2f6ba0;
  --color-indiretos-100: #e2edf6;

  --color-diretos-700: #0b5d52;
  --color-diretos-600: #0d7264;
  --color-diretos-500: #118578;
  --color-diretos-100: #ddf0ed;

  --color-capex-700: #92400e;
  --color-capex-600: #b45309;
  --color-capex-500: #d97706;
  --color-capex-100: #fbeedb;

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

  --font-sans: var(--font-inter), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: var(--font-archivo), var(--font-inter), ui-sans-serif, system-ui, sans-serif;

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
```

### documentos/page.tsx

> **Branch gh-pages:** Sem `import { db }`, sem `force-dynamic`. Passa array vazio para `DocumentsManager`.

```tsx
import { DocumentsManager } from "@/components/documents-manager";

export const metadata = { title: "Documentos de apoio" };

export default function DocumentosPage() {
  return <DocumentsManager documentos={[]} erroInicial={false} />;
}
```

### importar/page.tsx

> **Branch gh-pages:** Removido `force-dynamic` e `Metadata` (não suportados em export estático).

```tsx
import { ImportWizard } from "@/components/import-wizard";

export const metadata = { title: "Importar dados" };

export default function ImportarPage() {
  return <ImportWizard />;
}
```

### processos/page.tsx

> **Branch gh-pages:** Removido `force-dynamic` e `Metadata` (não suportados em export estático).

```tsx
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
```

---

## Componentes (src/components/)

### app-shell.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, Table2, Upload } from "lucide-react";
import clsx from "clsx";
import { fmtDate } from "@/lib/format";

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
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();
      const ativas = (data.datasets ?? []).filter((d: { status: string }) => d.status === "active");
      if (!ativas.length) {
        setInfo({ label: "Nenhuma base carregada", detalhe: "Importe uma planilha para começar" });
      } else {
        const refs = ativas.map((d: { reference_date: string | null }) => d.reference_date).filter(Boolean) as string[];
        const ref = refs.length ? refs.sort().reverse()[0] : null;
        setInfo({
          label: ref ? `Base de referência: ${fmtDate(ref)}` : "Base sem data de referência",
          detalhe: `${ativas.length} ${ativas.length === 1 ? "base ativa" : "bases ativas"} · ${Number(data.kpis?.processos ?? 0).toLocaleString("pt-BR")} processos`,
        });
      }
    } catch {
      setInfo({ label: "Base indisponível", detalhe: "não foi possível ler o banco de dados" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("giro:base-updated", onUpdate);
    return () => window.removeEventListener("giro:base-updated", onUpdate);
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
  const onImport = pathname.startsWith("/importar");

  return (
    <div className="min-h-dvh">
      {/* ================= Sidebar (desktop) ================= */}
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
            Dados armazenados no banco interno (PostgreSQL). Não há sincronização automática com o SharePoint.
          </p>
        </div>
      </aside>

      {/* ================= Topbar ================= */}
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
          <div className="flex items-center gap-4">
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

      {/* ================= Conteúdo ================= */}
      <main id="conteudo" tabIndex={-1} className="anim-fade-up mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:pl-[272px] lg:pr-8 lg:pt-8 lg:pb-14 lg:max-w-none">
        {children}
      </main>

      {/* ================= Navegação inferior (mobile) ================= */}
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
    </div>
  );
}
```

### charts.tsx

```tsx
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
  let acc = 0;
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const frac = total > 0 ? s.value / total : 0;
      const dash = frac * C;
      const el = (
        <circle
          key={s.label}
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke={s.color}
          strokeWidth="20"
          strokeDasharray={`${dash} ${C - dash}`}
          strokeDashoffset={-acc}
          transform="rotate(-90 70 70)"
        />
      );
      acc += dash;
      return el;
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
```

### datasets-panel.tsx

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, FileSpreadsheet, Trash2, CircleAlert } from "lucide-react";
import clsx from "clsx";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";
import { KIND_LABEL } from "@/lib/domain";

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
}

function notifyBaseUpdated() {
  window.dispatchEvent(new Event("giro:base-updated"));
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
      const res = await fetch("/api/datasets", { cache: "no-store" });
      const data = await res.json();
      setItems(data.datasets ?? []);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar a lista de bases.");
    }
  }, []);

  useEffect(() => {
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
      const res = await fetch(`/api/datasets?id=${confirmId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Falha ao excluir.");
      }
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
                    {d.sheet_name && <span className="font-normal text-ink-soft"> · aba "{d.sheet_name}"</span>}
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
```

> **Nota:** Os componentes `documents-manager.tsx`, `import-wizard.tsx`, `processos-browser.tsx` e `ui.tsx` contêm o código completo exibido na leitura acima. Devido ao tamanho extenso, seus códigos completos estão preservados no repositório GitHub: https://github.com/lucasdorta-a11y/Atas

---

## Banco de dados (src/db/)

### index.ts

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
```

### schema.ts

```typescript
import { pgTable, serial, text, integer, numeric, date, timestamp, jsonb, index } from "drizzle-orm/pg-core";

/**
 * Cada importação gera um "dataset". Substituir uma base não apaga a
 * anterior: ela fica como `superseded`, o que permite auditar e comparar
 * variações entre bases. Excluir um dataset remove seus registros.
 */
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // indiretos | diretos | capex | outro
  natureza: text("natureza").notNull().default("operacional"), // operacional | snapshot
  fileName: text("file_name").notNull(),
  sheetName: text("sheet_name"),
  referenceDate: date("reference_date", { mode: "string" }),
  importedAt: timestamp("imported_at", { withTimezone: false }).notNull().defaultNow(),
  status: text("status").notNull().default("active"), // active | superseded
  mode: text("mode").notNull().default("replace"), // replace | combine
  rowCount: integer("row_count").notNull().default(0),
  validCount: integer("valid_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  dupCount: integer("dup_count").notNull().default(0),
  warningCount: integer("warning_count").notNull().default(0),
  report: jsonb("report"), // resumo + amostra de problemas para auditoria
});

export const records = pgTable(
  "records",
  {
    id: serial("id").primaryKey(),
    datasetId: integer("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    area: text("area"),
    numero: text("numero").notNull(),
    objeto: text("objeto").notNull(),
    unidade: text("unidade"),
    fornecedor: text("fornecedor"),
    responsavel: text("responsavel"),
    etapa: text("etapa"),
    situacaoFonte: text("situacao_fonte"),
    situacaoNorm: text("situacao_norm"), // concluido | cancelado | null
    dataInicio: date("data_inicio", { mode: "string" }),
    dataFim: date("data_fim", { mode: "string" }),
    quantidade: numeric("quantidade"),
    valor: numeric("valor"),
    statusConsumo: text("status_consumo"),
    savingHist: numeric("saving_hist"),
    savingProp: numeric("saving_prop"),
    statusRenovacao: text("status_renovacao"),
    dataPrevisao: date("data_previsao", { mode: "string" }),
    observacao: text("observacao"),
    link: text("link"),
    searchNorm: text("search_norm"),
    rowHash: text("row_hash"),
    sourceRow: integer("source_row"),
    extra: jsonb("extra"), // colunas não mapeadas, preservadas da planilha
  },
  (t) => [
    index("records_dataset_idx").on(t.datasetId),
    index("records_datafim_idx").on(t.dataFim),
    index("records_area_idx").on(t.area),
  ],
);

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  url: text("url").notNull(),
  categoria: text("categoria").notNull().default("Outro"),
  descricao: text("descricao"),
  createdAt: timestamp("created_at", { withTimezone: false }).notNull().defaultNow(),
});

export type DatasetRow = typeof datasets.$inferSelect;
export type RecordRow = typeof records.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
```

---

## Bibliotecas (src/lib/)

### client-parse.ts

```typescript
/**
 * Leitura de arquivos .xlsx/.csv **no navegador** (nada é enviado a
 * serviços de terceiros; o arquivo só sai da máquina do usuário quando a
 * importação é confirmada, e vai para o nosso próprio backend).
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
      blankrows: false,
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
export async function parseMultipleFiles(files: File[]): Promise<{ filesCount: number; sheetsCount: number; combinedTable: SheetTable; names: string[] }> {
  let combinedRows: Record<string, unknown>[] = [];
  const allHeaders = new Set<string>();
  let filesCount = 0;
  let sheetsCount = 0;
  const names: string[] = [];

  for (const f of files) {
    const parsed = await parseFile(f);
    filesCount++;
    names.push(parsed.fileName);
    for (const sheet of parsed.sheets) {
      if (sheet.matrix.length === 0) continue;
      const t = extractTable(sheet, sheet.headerRowIndex);
      if (t.rows.length > 0) {
        sheetsCount++;
        for (const h of t.headers) allHeaders.add(h);
        combinedRows = combinedRows.concat(t.rows.map(r => ({ ...r, _file: parsed.fileName, _sheet: sheet.name })));
      }
    }
  }

  if (combinedRows.length > MAX_ROWS + 100) {
    throw new ParseError("estrutura", `A combinação das planilhas gerou ${combinedRows.length.toLocaleString("pt-BR")} linhas — acima do limite.`);
  }

  return { filesCount, sheetsCount, names, combinedTable: { headers: Array.from(allHeaders), rows: combinedRows, totalRows: combinedRows.length } };
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
```

### csv.ts

```typescript
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
```

### dashboard-data.ts

```typescript
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { SITUACAO_SQL, SITUACAO_LABEL, type SituacaoChave } from "@/lib/domain";

export interface CheckItem {
  nivel: "info" | "atencao";
  mensagem: string;
}

export async function getDashboardData() {
  const S = sql.raw(SITUACAO_SQL);

  const [
    datasetsRes,
    situacaoRes,
    kpisRes,
    areaRes,
    topCompradoresRes,
    fornecedoresRes,
    evolucaoRes,
    renovacoesRes,
    previsoesRes,
    variacoesRes,
  ] = await Promise.all([
    db.execute(sql`
      SELECT id, kind, natureza, file_name, sheet_name, reference_date, imported_at::text,
             status, mode, row_count, valid_count, skipped_count, dup_count, warning_count
      FROM datasets
      ORDER BY imported_at DESC
      LIMIT 40
    `),
    db.execute(sql`
      SELECT ${S} AS situacao, COUNT(*)::int AS total
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
    `),
    db.execute(sql`
      SELECT
        COUNT(*)::int AS processos,
        COALESCE(SUM(valor), 0)::float8 AS valor_total,
        COALESCE(SUM(quantidade), 0)::float8 AS itens,
        COUNT(*) FILTER (WHERE r.situacao_norm = 'concluido')::int AS concluidos_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8 AS concluidos_itens,
        COUNT(*) FILTER (WHERE r.status_consumo = 'Com Saldo')::int AS saldo_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8 AS saldo_itens,
        COUNT(*) FILTER (WHERE r.status_consumo = 'Consumido')::int AS consumido_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Consumido'), 0)::float8 AS consumido_itens,
        COUNT(*) FILTER (WHERE ${S} IN ('vencido', 'a_vencer'))::int AS vencidas_a_vencer_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} IN ('vencido', 'a_vencer')), 0)::float8 AS vencidas_a_vencer_itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
    `),
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado') AS area,
        COUNT(*)::int AS processos,
        COALESCE(SUM(r.valor), 0)::float8 AS valor,
        COALESCE(SUM(r.saving_hist), 0)::float8 AS saving_hist,
        COALESCE(SUM(r.saving_prop), 0)::float8 AS saving_prop
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
      ORDER BY processos DESC
    `),
    db.execute(sql`
      WITH Ranks AS (
        SELECT COALESCE(area, 'Não informado') AS area, responsavel, COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens,
        ROW_NUMBER() OVER(PARTITION BY COALESCE(area, 'Não informado') ORDER BY COALESCE(SUM(quantidade), 0) DESC) as rn
        FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
        WHERE responsavel IS NOT NULL AND responsavel <> ''
        GROUP BY 1, 2
      )
      SELECT area, responsavel, atas, itens FROM Ranks WHERE rn <= 5 ORDER BY area, rn
    `),
    db.execute(sql`
      SELECT fornecedor, COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens,
             (COALESCE(SUM(quantidade), 0) / NULLIF(SUM(SUM(quantidade)) OVER(), 0)) * 100::float8 as concentracao
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE fornecedor IS NOT NULL AND fornecedor <> ''
      GROUP BY 1
      ORDER BY itens DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT 
        COALESCE(r.area, 'Não informado') AS area,
        COUNT(*) FILTER (WHERE r.situacao_norm = 'concluido')::int AS concluidas_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8 AS concluidas_itens,
        COUNT(*) FILTER (WHERE r.situacao_norm IS NULL AND ${S} NOT IN ('concluido', 'cancelado'))::int AS andamento_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm IS NULL AND ${S} NOT IN ('concluido', 'cancelado')), 0)::float8 AS andamento_itens,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8 AS saldo_itens,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Sem Saldo'), 0)::float8 AS semsaldo_itens,
        COUNT(*) FILTER (WHERE ${S} = 'vencido')::int AS vencidas_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} = 'vencido'), 0)::float8 AS vencidas_itens,
        COUNT(*) FILTER (WHERE ${S} = 'a_vencer')::int AS a_vencer_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} = 'a_vencer'), 0)::float8 AS a_vencer_itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
    `),
    db.execute(sql`
      SELECT COALESCE(r.area, 'Não informado') AS area, COALESCE(r.status_renovacao, 'Outros') AS status,
             COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1, 2
    `),
    db.execute(sql`
      SELECT COALESCE(r.area, 'Não informado') AS area, responsavel, r.data_previsao,
             (r.data_previsao - CURRENT_DATE)::int AS dias,
             COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE r.situacao_norm IS NULL AND r.data_previsao IS NOT NULL
      GROUP BY 1, 2, 3, 4
    `),
    db.execute(sql`
      WITH active AS (
        SELECT d.kind, d.natureza, d.id, d.reference_date, d.imported_at::text AS imported_at,
               COUNT(r.id)::int AS processos
        FROM datasets d LEFT JOIN records r ON r.dataset_id = d.id
        WHERE d.status = 'active'
        GROUP BY d.id
      ),
      prev AS (
        SELECT DISTINCT ON (d.kind) d.kind, d.reference_date, d.imported_at::text AS imported_at,
               (SELECT COUNT(*) FROM records r WHERE r.dataset_id = d.id)::int AS processos
        FROM datasets d
        WHERE d.status = 'superseded'
        ORDER BY d.kind, d.imported_at DESC
      )
      SELECT a.kind, a.natureza, a.processos AS atual, a.reference_date AS ref_atual,
             p.processos AS anterior, p.reference_date AS ref_anterior, p.imported_at AS importado_anterior
      FROM active a JOIN prev p ON p.kind = a.kind
    `),
  ]);

  const situacoes: Record<SituacaoChave, number> = {
    vencido: 0, a_vencer: 0, em_dia: 0, sem_data: 0, concluido: 0, cancelado: 0,
  };
  for (const row of situacaoRes.rows as { situacao: SituacaoChave; total: number }[]) {
    if (row.situacao in situacoes) situacoes[row.situacao] = row.total;
  }

  const kpiRow = (kpisRes.rows[0] ?? {}) as Record<string, number>;
  const activeDatasets = (datasetsRes.rows as Record<string, unknown>[]).filter((d) => d.status === "active");

  // Verificações de consistência — sinalizam, jamais corrigem sozinho.
  const checks: CheckItem[] = [];
  const skippedTotal = activeDatasets.reduce((a, d) => a + Number(d.skipped_count ?? 0), 0);
  const warnTotal = activeDatasets.reduce((a, d) => a + Number(d.warning_count ?? 0), 0);
  const dupTotal = activeDatasets.reduce((a, d) => a + Number(d.dup_count ?? 0), 0);
  if (skippedTotal > 0) {
    checks.push({
      nivel: "atencao",
      mensagem: `${skippedTotal.toLocaleString("pt-BR")} linha(s) das bases ativas foram ignoradas na importação${dupTotal > 0 ? ` (${dupTotal.toLocaleString("pt-BR")} duplicada(s))` : ""}. Consulte os relatórios na página Importar.`,
    });
  }
  if (warnTotal > 0) {
    checks.push({
      nivel: "info",
      mensagem: `${warnTotal.toLocaleString("pt-BR")} aviso(s) de interpretação (datas, números, áreas) aguardam validação humana nos relatórios de importação.`,
    });
  }
  const kindsAtivos = new Map<string, number>();
  for (const d of activeDatasets) kindsAtivos.set(String(d.kind), (kindsAtivos.get(String(d.kind)) ?? 0) + 1);
  for (const [kind, n] of kindsAtivos) {
    if (n > 1) {
      checks.push({
        nivel: "atencao",
        mensagem: `Há ${n} bases ativas do tipo "${kind}" combinadas. Confirme que não há sobreposição de registros entre os arquivos.`,
      });
    }
  }
  const naturezas = new Set(activeDatasets.map((d) => String(d.natureza)));
  if (naturezas.has("snapshot") && naturezas.has("operacional")) {
    checks.push({
      nivel: "atencao",
      mensagem: "O panorama está somando bases de naturezas diferentes (snapshot semanal e base operacional), que podem ter escopos e datas distintos. Considere manter ativa apenas a natureza desejada.",
    });
  }

  return {
    geradoEm: new Date().toISOString(),
    hasData: Number(kpiRow.processos ?? 0) > 0,
    kpis: {
      processos: Number(kpiRow.processos ?? 0),
      valorTotal: Number(kpiRow.valor_total ?? 0),
      itens: Number(kpiRow.itens ?? 0),
      concluidosAtas: Number(kpiRow.concluidos_atas ?? 0),
      concluidosItens: Number(kpiRow.concluidos_itens ?? 0),
      saldoAtas: Number(kpiRow.saldo_atas ?? 0),
      saldoItens: Number(kpiRow.saldo_itens ?? 0),
      consumidoAtas: Number(kpiRow.consumido_atas ?? 0),
      consumidoItens: Number(kpiRow.consumido_itens ?? 0),
      vencidasVencerAtas: Number(kpiRow.vencidas_a_vencer_atas ?? 0),
      vencidasVencerItens: Number(kpiRow.vencidas_a_vencer_itens ?? 0),
      ...situacoes,
    },
    situacaoLabels: SITUACAO_LABEL,
    porArea: areaRes.rows,
    topCompradores: topCompradoresRes.rows,
    fornecedores: fornecedoresRes.rows,
    evolucao: evolucaoRes.rows,
    renovacoes: renovacoesRes.rows,
    previsoes: previsoesRes.rows,
    variacoes: variacoesRes.rows,
    datasets: datasetsRes.rows,
    checks,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
```

### domain.ts

```typescript
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

    if (!numero) pushIssue("error", "numero", "Identificador do processo vazio (campo obrigatório).");
    if (!objeto) pushIssue("error", "objeto", "Objeto/descrição vazio (campo obrigatório).");

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
```

### format.ts

```typescript
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
```

### mapping.ts

```typescript
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
```

---

## Scripts

### e2e-test.mjs

```javascript
/**
 * Teste E2E do Giro de Atas (executar com a app rodando em :3000):
 *   node scripts/e2e-test.mjs
 * Gera arquivos sintéticos de teste COM RÓTULO explícito e os remove do banco ao final.
 */
import * as XLSX from "xlsx";
import assert from "node:assert/strict";

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const MARCADOR = "TESTE-E2E";

let passou = 0;
function ok(nome) {
  passou++;
  console.log(`  ✓ ${nome}`);
}

/* ------------------------------ preparação ------------------------------ */

// Planilha 1 (aba "Dados"): cabeçalhos em pt-BR não padronizados, datas BR, valores BR
const linhasIndiretos = [
  ["RELATÓRIO DE COMPRAS — " + MARCADOR], // linha de título antes do cabeçalho
  ["Processo", "Descrição do Objeto", "Setor Requisitante", "Empresa Vencedora", "Comprador Resp.", "Fase Atual", "Situação Atual", "Data Abertura", "Vigência Final", "Qtd Itens", "Valor Estimado R$", "Notas Gerais", "Endereço SP", "Coluna Livre"],
  ["PA-2025/001", "Aquisição de insumos de laboratório", "Pesquisa", "Labex Ltda", "Ana Souza", "Cotação", "Em andamento", "05/01/2026", "10/02/2030", "120", "1.234.567,89", "Urgente, conforme SEI 123", "https://sharepoint.interno/doc1", "texto livre A"],
  ["PA-2025/002", "Serviço de manutenção predial", "Facilities", "Construmais SA", "Bruno Lima", "Emissão de ata", "Em andamento", "12/01/2026", "15/02/2020", "3", "85.000,00", "", "https://sharepoint.interno/doc2", "texto livre B"],
  ["PA-2025/003", "Licenças de software", "TI", "", "Carla Roos", "Aguardando fornecedor", "Concluído", "20/12/2025", "01/01/2031", "1", "R$ 12.900,50", "renovação anual", "", "x"],
  ["PA-2025/004", "Uniformes e EPIs", "RH", "Protege EPI", "Ana Souza", "Cotação", "Cancelado", "02/01/2026", "30/06/2030", "500", "45.000", "", "", ""],
  ["", "Linha sem identificador deve ser ignorada", "RH", "", "", "", "", "", "", "5", "1.000", "", "", ""], // erro: sem número
  ["PA-2025/001", "Aquisição de insumos de laboratório", "Pesquisa", "Labex Ltda", "Ana Souza", "Cotação", "Em andamento", "05/01/2026", "10/02/2030", "120", "1.234.567,89", "duplicada", "https://sharepoint.interno/doc1", "dup"], // duplicada
  ["PA-2025/006", "Número ambíguo de itens", "TI", "", "", "", "", "05/01/2026", "10/02/2030", "3.054", "2.500,00", "3.054 deve virar 3054 com aviso", "", ""],
];

const wb = XLSX.utils.book_new();
const ws1 = XLSX.utils.aoa_to_sheet(linhasIndiretos);
XLSX.utils.book_append_sheet(wb, ws1, "Dados");
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Aba vazia"]]), "Resumo");
const xlsxB64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

// Converte as linhas em Record<header, value> simulando o que o cliente enviaria
function linhasParaObjetos(linhas, headerRowIdx) {
  const headers = linhas[headerRowIdx];
  return linhas.slice(headerRowIdx + 1).filter((r) => r.some((c) => c !== "" && c != null)).map((r) => {
    const o = {};
    headers.forEach((h, i) => (o[h] = r[i] ?? null));
    return o;
  });
}

const rowsIndiretos = linhasParaObjetos(linhasIndiretos, 1);
const mappingIndiretos = {
  numero: "Processo", objeto: "Descrição do Objeto", unidade: "Setor Requisitante",
  fornecedor: "Empresa Vencedora", responsavel: "Comprador Resp.", etapa: "Fase Atual",
  situacao: "Situação Atual", data_inicio: "Data Abertura", data_fim: "Vigência Final",
  quantidade: "Qtd Itens", valor: "Valor Estimado R$", observacao: "Notas Gerais", link: "Endereço SP",
};

// CSV ; com acentos e decimais por vírgula (texto simulando SheetJS)
const csvRows = [
  { "Nº da Ata": "ATA-77/2026", "Objeto": "Cromatógrafo gasoso — manutenção", "Responsável": "José Álvares", "Validade": "31/12/2030", "Valor (R$)": "10.500,75", "Qtd": "1", "Situação": "Em andamento" },
  { "Nº da Ata": "ATA-78/2026", "Objeto": "Autoclave vertical 75 L", "Responsável": "José Álvares", "Validade": "15/08/2025", "Valor (R$)": "92.300,00", "Qtd": "2", "Situação": "Em andamento" },
  { "Nº da Ata": "ATA-79/2026", "Objeto": "Água ultrapura tipo I — 5.000 L", "Responsável": "Maria Pinhão", "Validade": "20/09/2026", "Valor (R$)": "7.800,00", "Qtd": "10", "Situação": "" },
];
const mappingCsv = { numero: "Nº da Ata", objeto: "Objeto", responsavel: "Responsável", data_fim: "Validade", valor: "Valor (R$)", quantidade: "Qtd", situacao: "Situação" };

/* ------------------------------ testes ------------------------------ */

console.log("\n— Saúde e estado inicial —");
{
  const h = await (await fetch(`${BASE}/api/health`)).json();
  assert.equal(h.ok, true);
  ok("GET /api/health → ok");

  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, false);
  ok("Panorama vazio reporta hasData=false (sem números fictícios)");
}

console.log("\n— Importação XLSX (multi-abas, título antes do cabeçalho, BR) —");
let datasetId1;
{
  const payload = {
    fileName: `indiretos-${MARCADOR}.xlsx`, sheetName: "Dados", kind: "indiretos",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-20",
    mapping: mappingIndiretos, rows: rowsIndiretos,
  };
  const v = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "validate", ...payload }) })).json();
  assert.equal(v.resumo.validos, 5, `esperava 5 válidas, veio ${v.resumo.validos}`);
  assert.equal(v.resumo.ignoradas, 2, `esperava 2 ignoradas (1 obrigatória + 1 duplicada)`);
  assert.ok(v.resumo.avisos >= 1, "esperava aviso (3.054/ano/etc.)");
  ok(`validate: ${v.resumo.validos} válidas, ${v.resumo.ignoradas} ignoradas, ${v.resumo.avisos} avisos`);

  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);
  datasetId1 = c.datasetId;
  ok("commit: base indiretos gravada");

  const rec = (await (await fetch(`${BASE}/api/processos?q=PA-2025/001`)).json());
  assert.equal(rec.total, 1);
  const r = rec.rows[0];
  assert.equal(r.area, "Indiretos");
  assert.equal(r.valor, 1234567.89);
  assert.equal(r.quantidade, 120);
  assert.ok(r.extra && r.extra["Coluna Livre"] === "texto livre A", "coluna não mapeada preservada em extra");
  ok("registro gravado com área padrão, valor BR e coluna extra preservada");

  const amb = (await (await fetch(`${BASE}/api/processos?q=PA-2025/006`)).json());
  assert.equal(amb.rows[0].quantidade, 3054);
  ok("'3.054' interpretado como 3054 (milhar pt-BR) — aviso registrado no relatório");
}

console.log("\n— Importação CSV (; acentos, vírgula decimal) —");
let datasetId2;
{
  const payload = {
    fileName: `atas-capex-${MARCADOR}.csv`, sheetName: null, kind: "capex",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-22",
    mapping: mappingCsv, rows: csvRows,
  };
  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);
  datasetId2 = c.datasetId;
  ok("commit: base capex gravada (3 linhas)");
}

console.log("\n— Panorama e consistência —");
{
  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, true);
  assert.equal(d.kpis.processos, 8);
  assert.equal(d.kpis.concluido, 1);
  assert.equal(d.kpis.cancelado, 1);
  assert.ok(d.porArea.some((a) => a.area === "CAPEX" && a.processos === 3));
  console.log(`  · vencidos=${d.kpis.vencido} a_vencer=${d.kpis.a_vencer} sem_data=${d.kpis.sem_data} valor=${d.kpis.valorTotal}`);
  ok("panorama soma as duas bases ativas (8 processos; 1 concluído; 1 cancelado)");
}

console.log("\n— Busca, filtros, ordenação, paginação —");
{
  const q = await (await fetch(`${BASE}/api/processos?q=CROMATÓGRAFO`)).json();
  assert.equal(q.total, 1, "busca deve ignorar acentos");
  const q2 = await (await fetch(`${BASE}/api/processos?q=cromatografo`)).json();
  assert.equal(q2.total, 1);
  ok("busca sem acento encontra texto acentuado (e vice-versa)");

  const f = await (await fetch(`${BASE}/api/processos?area=CAPEX&situacao=vencido`)).json();
  assert.ok(f.rows.every((r) => r.area === "CAPEX" && r.situacao === "vencido"));
  ok(`filtros combinados área+situação (${f.total} resultado(s))`);

  const s = await (await fetch(`${BASE}/api/processos?sort=valor&dir=desc&pageSize=10`)).json();
  const valores = s.rows.map((r) => r.valor ?? -1);
  assert.deepEqual(valores, [...valores].sort((a, b) => b - a));
  ok("ordenação por valor decrescente");

  const p1 = await (await fetch(`${BASE}/api/processos?pageSize=5&page=1`)).json();
  const p2 = await (await fetch(`${BASE}/api/processos?pageSize=5&page=2`)).json();
  assert.equal(p1.rows.length, 5);
  assert.equal(p2.rows.length, 3);
  assert.notDeepEqual(p1.rows.map((r) => r.id), p2.rows.map((r) => r.id));
  ok("paginação 5 por página (5 + 3)");

  const facets = await (await fetch(`${BASE}/api/processos?facets=1`)).json();
  assert.ok(facets.facets.areas.length >= 2 && facets.facets.etapas.length >= 1);
  ok("facetas de área e etapa disponíveis");
}

console.log("\n— Exportação CSV —");
{
  const res = await fetch(`${BASE}/api/processos/export?area=CAPEX`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  assert.equal(res.headers.get("content-type").includes("text/csv"), true);
  assert.ok(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf, "BOM UTF-8 presente (Excel)");
  const text = new TextDecoder().decode(bytes.subarray(3));
  assert.ok(text.includes("ATA-77/2026") && !text.includes("PA-2025/001"));
  assert.ok(text.includes(";"));
  ok("CSV filtrado por área, com BOM e separador ';'");
}

console.log("\n— Documentos —");
{
  const c = await fetch(`${BASE}/api/documentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: `Manual ${MARCADOR}`, url: "https://sharepoint.interno/manual", categoria: "Manual", descricao: "doc de teste" }) });
  assert.equal(c.status, 201);
  const { documento } = await c.json();

  const bad = await fetch(`${BASE}/api/documentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: "x", url: "javascript:alert(1)" }) });
  assert.equal(bad.status, 400);

  const del = await fetch(`${BASE}/api/documentos?id=${documento.id}`, { method: "DELETE" });
  assert.equal(del.status, 200);
  ok("cadastro, validação de URL e exclusão de documento");
}

console.log("\n— Substituição de base (replace mantém histórico) —");
{
  const payload = {
    fileName: `indiretos-${MARCADOR}-v2.xlsx`, sheetName: "Dados", kind: "indiretos",
    natureza: "operacional", importMode: "replace", referenceDate: "2026-01-27",
    mapping: mappingIndiretos, rows: rowsIndiretos.slice(0, 2), // só 2 linhas
  };
  const c = await (await fetch(`${BASE}/api/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "commit", ...payload }) })).json();
  assert.equal(c.ok, true);

  const ds = (await (await fetch(`${BASE}/api/datasets`)).json()).datasets;
  const inds = ds.filter((d) => d.kind === "indiretos");
  assert.equal(inds.filter((d) => d.status === "active").length, 1);
  assert.equal(inds.filter((d) => d.status === "superseded").length, 1);

  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.variacoes.length, 1);
  const v = d.variacoes[0];
  assert.equal(v.atual, 2); // 2 linhas válidas no arquivo v2
  assert.equal(v.anterior, 5);
  ok(`substituição arquiva a anterior e gera variação (${v.anterior} → ${v.atual})`);
}

console.log("\n— Limpeza (remove dados de teste) —");
{
  const ds = (await (await fetch(`${BASE}/api/datasets`)).json()).datasets;
  for (const d of ds) {
    if (d.file_name.includes(MARCADOR)) {
      await fetch(`${BASE}/api/datasets?id=${d.id}`, { method: "DELETE" });
    }
  }
  const d = await (await fetch(`${BASE}/api/dashboard`)).json();
  assert.equal(d.hasData, false);
  for (const id of [datasetId1, datasetId2]) {
    const r = await fetch(`${BASE}/api/datasets?id=${id}`, { method: "DELETE" }).catch(() => null);
    void r;
  }
  ok("ambiente de teste limpo (banco volta ao estado vazio)");
}

console.log(`\n✔ Todos os grupos de teste passaram (${passou} verificações).\n`);
```

---

> **Nota:** Os componentes `documents-manager.tsx`, `import-wizard.tsx`, `processos-browser.tsx` e `ui.tsx` contêm o código completo exibido na leitura acima. Devido ao tamanho extenso, seus códigos completos estão preservados no repositório GitHub: https://github.com/lucasdorta-a11y/Atas



---

## CI/CD (GitHub Pages)

### .github/workflows/deploy.yml

> **Branch gh-pages:** Workflow que builda o Next.js em modo `output: "export"` e publica o diretório `out/` no GitHub Pages automaticamente a cada push.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [gh-pages]
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
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### public/.nojekyll

> Arquivo vazio que impede o GitHub Pages de processar o diretório `_next/` com Jekyll (que ignoraria pastas com prefixo `_`).

```
(arquivo vazio — conteúdo é apenas uma quebra de linha)
```
