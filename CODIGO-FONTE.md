# Giro de Atas — Código-fonte consolidado

Documento de referência com todos os arquivos do projeto e seus respectivos códigos, na ordem da estrutura de pastas.

> Gerado automaticamente por `npm run docs:fonte` (`scripts/gerar-codigo-fonte.mjs`). Não edite à mão: rode o comando após alterar o código.

---

## Sumário

- [Arquivos de configuração](#arquivos-de-configuração)
  - [package.json](#packagejson)
  - [tsconfig.json](#tsconfigjson)
  - [next.config.ts](#nextconfigts)
  - [eslint.config.mjs](#eslintconfigmjs)
  - [postcss.config.mjs](#postcssconfigmjs)
  - [.gitignore](#gitignore)
- [Rotas (src/app/)](#rotas-srcapp)
  - [src/app/globals.css](#srcappglobalscss)
  - [src/app/layout.tsx](#srcapplayouttsx)
  - [src/app/page.tsx](#srcapppagetsx)
  - [src/app/documentos/page.tsx](#srcappdocumentospagetsx)
  - [src/app/importar/page.tsx](#srcappimportarpagetsx)
  - [src/app/processos/page.tsx](#srcappprocessospagetsx)
- [Componentes (src/components/)](#componentes-srccomponents)
  - [src/components/ui.tsx](#srccomponentsuitsx)
  - [src/components/documentos/documents-manager.tsx](#srccomponentsdocumentosdocuments-managertsx)
  - [src/components/importar/import-wizard.tsx](#srccomponentsimportarimport-wizardtsx)
  - [src/components/layout/app-shell.tsx](#srccomponentslayoutapp-shelltsx)
  - [src/components/panorama/datasets-panel.tsx](#srccomponentspanoramadatasets-paneltsx)
  - [src/components/panorama/panorama-view.tsx](#srccomponentspanoramapanorama-viewtsx)
  - [src/components/processos/processos-browser.tsx](#srccomponentsprocessosprocessos-browsertsx)
- [Bibliotecas (src/lib/)](#bibliotecas-srclib)
  - [src/lib/csv.ts](#srclibcsvts)
  - [src/lib/domain.ts](#srclibdomaints)
  - [src/lib/format.ts](#srclibformatts)
  - [src/lib/dashboard/dashboard-snapshot.ts](#srclibdashboarddashboard-snapshotts)
  - [src/lib/dashboard/static-dashboard.ts](#srclibdashboardstatic-dashboardts)
  - [src/lib/import/client-parse.ts](#srclibimportclient-parsets)
  - [src/lib/import/mapping.ts](#srclibimportmappingts)
  - [src/lib/storage/static-store.ts](#srclibstoragestatic-storets)
- [CI/CD e publicação](#cicd-e-publicação)
  - [.github/workflows/deploy.yml](#githubworkflowsdeployyml)
  - [public/.nojekyll](#publicnojekyll)
- [Scripts](#scripts)
  - [scripts/gerar-codigo-fonte.mjs](#scriptsgerar-codigo-fontemjs)

---

## Arquivos de configuração

### package.json

```json
{
  "name": "giro-de-atas-pages",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "docs:fonte": "node scripts/gerar-codigo-fonte.mjs"
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

### next.config.ts

```typescript
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
};

export default nextConfig;
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

### postcss.config.mjs

```javascript
const postcssConfig = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default postcssConfig;
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

## Rotas (src/app/)

### src/app/globals.css

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
```

### src/app/layout.tsx

```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
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
```

### src/app/page.tsx

```tsx
import { PanoramaView } from "@/components/panorama/panorama-view";

export default function PanoramaPage() {
  return <PanoramaView />;
}
```

### src/app/documentos/page.tsx

```tsx
import { DocumentsManager } from "@/components/documentos/documents-manager";

export const metadata = { title: "Documentos de apoio" };

export default function DocumentosPage() {
  return <DocumentsManager documentos={[]} erroInicial={false} />;
}
```

### src/app/importar/page.tsx

```tsx
import { ImportWizard } from "@/components/importar/import-wizard";

export const metadata = { title: "Importar dados" };

export default function ImportarPage() {
  return <ImportWizard />;
}
```

### src/app/processos/page.tsx

```tsx
import { Suspense } from "react";
import { ProcessosBrowser } from "@/components/processos/processos-browser";

export const metadata = { title: "Processos" };

export default function ProcessosPage() {
  return (
    <Suspense>
      <ProcessosBrowser />
    </Suspense>
  );
}
```

## Componentes (src/components/)

### src/components/ui.tsx

```tsx
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

export const AREA_STYLE: Record<string, { chip: string; dot: string; bar: string; hex: string }> = {
  Indiretos: { chip: "bg-indiretos-100 text-indiretos-700", dot: "bg-indiretos-500", bar: "bg-indiretos-500", hex: "#2f6ba0" },
  Diretos: { chip: "bg-diretos-100 text-diretos-700", dot: "bg-diretos-500", bar: "bg-diretos-500", hex: "#118578" },
  CAPEX: { chip: "bg-capex-100 text-capex-700", dot: "bg-capex-600", bar: "bg-capex-600", hex: "#b45309" },
  "Não informado": { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-500", bar: "bg-neutral-400", hex: "#98a2b3" },
};

export function AreaTag({ area }: { area: string | null | undefined }) {
  const key = area && AREA_STYLE[area] ? area : "Não informado";
  const s = AREA_STYLE[key];
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
```

### src/components/documentos/documents-manager.tsx

```tsx
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BookOpen, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { createDocument, deleteDocument, listDocuments } from "@/lib/storage/static-store";

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
        <p><strong className="text-ink">Status “A Renovar”:</strong> Adotada a régua de 100 dias pré-vencimento para garantir margem de tempo na estruturação e renovação dos processos.</p>
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
```

### src/components/importar/import-wizard.tsx

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, CircleAlert, CircleCheckBig, Download, FileSpreadsheet,
  FileUp, Loader2, ShieldCheck, TriangleAlert,
} from "lucide-react";
import clsx from "clsx";
import { PageHeader, SectionTitle } from "@/components/ui";
import {
  parseMultipleFiles, ParseError, MAX_FILE_MB, type SheetTable, type SourceSheet
} from "@/lib/import/client-parse";
import { suggestMapping, type Suggestion } from "@/lib/import/mapping";
import {
  CANONICAL_FIELDS, KIND_LABEL, transformAndValidate,
  type DatasetKind, type DatasetNatureza, type ImportMode, type Issue, type Mapping, type ValidationResult,
} from "@/lib/domain";
import { buildCsv } from "@/lib/csv";
import { fmtCurrency, fmtInt, todayISO } from "@/lib/format";
import { notifyStaticDataChanged, saveDataset } from "@/lib/storage/static-store";
import {
  extractSnapshotPayload,
  hasSnapshotPayloadMeaningfulData,
  type DashboardSnapshotPayload,
} from "@/lib/dashboard/dashboard-snapshot";

/* ------------------------------------------------------------------ */

const STEPS = [
  { n: 1, label: "Arquivo" },
  { n: 2, label: "Tipo de base" },
  { n: 3, label: "Colunas" },
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

export function ImportWizard() {
  const [step, setStep] = useState(1);
  
  // Agora armazenamos a tabela combinada de TODOS os arquivos/abas selecionados
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

  const [kind, setKind] = useState<DatasetKind>("indiretos");
  const [natureza, setNatureza] = useState<DatasetNatureza>("operacional");
  const [importMode, setImportMode] = useState<ImportMode>("replace");
  const [referenceDate, setReferenceDate] = useState(todayISO());

  const [mapping, setMapping] = useState<Mapping>({});
  const [mappingTocado, setMappingTocado] = useState(false);

  const [validacao, setValidacao] = useState<ValidateResponse | null>(null);
  const [resultadoValidacao, setResultadoValidacao] = useState<ValidationResult | null>(null);
  const [resultadoSnapshot, setResultadoSnapshot] = useState<DashboardSnapshotPayload | null>(null);
  const [validando, setValidando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroEtapa, setErroEtapa] = useState<string | null>(null);
  const [avisoEstrutura, setAvisoEstrutura] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  // Foco no título a cada troca de etapa (orientação por teclado/leitor de tela)
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
      setErroEtapa(null);
      try {
        const info = await parseMultipleFiles(files);
        setCombinedInfo(info);
        setMappingTocado(false);
        announce(
          `${info.filesCount} arquivos lidos com sucesso. ${info.sheetsCount} abas processadas.`,
        );
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

  /* ---------------- Tabela combinada ---------------- */

  const table: SheetTable | null = combinedInfo?.combinedTable ?? null;

  const suggestion: Suggestion | null = useMemo(
    () => (table ? suggestMapping(table.headers) : null),
    [table],
  );

  // Os blocos do panorama são automáticos e não dependem deste formulário.
  // Deixe o mapeamento operacional limpo por padrão; o usuário escolhe apenas
  // os campos que deseja gravar na busca de processos.
  useEffect(() => {
    if (!suggestion || mappingTocado) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMapping({});
    setAvisoEstrutura(null);
  }, [suggestion, mappingTocado]);

  const obrigatoriosOk = Boolean(mapping.numero && mapping.objeto);

  /* ---------------- Validação local (GitHub Pages) ---------------- */

  const defaultArea = kind === "indiretos" ? "Indiretos" : kind === "diretos" ? "Diretos" : kind === "capex" ? "CAPEX" : null;
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
  const canValidate = obrigatoriosOk || snapshotMeaningful;

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
      const result: ValidationResult = obrigatoriosOk
        ? transformAndValidate(table.rows, mapping, { defaultArea })
        : { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 };
      const meaningful = hasSnapshotPayloadMeaningfulData(snapshot);
      if (result.records.length === 0 && !meaningful) {
        throw new Error("Nenhum registro operacional ou bloco específico do painel foi reconhecido. Revise os nomes exatos das colunas e o mapeamento.");
      }
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
      announce(
        `Validação concluída: ${resumo.validos.toLocaleString("pt-BR")} linhas operacionais e ${snapshot.coverage.found.length.toLocaleString("pt-BR")} blocos específicos reconhecidos.`,
      );
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
    if (resultadoValidacao.records.length === 0 && !meaningfulSnapshot) return;
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
        snapshot: meaningfulSnapshot ? resultadoSnapshot : null,
      });
      setValidacao((current) => current ? { ...current, datasetId: dataset.id } : current);
      setStep(5);
      notifyStaticDataChanged();
      announce(`Importação concluída. ${resultadoValidacao.records.length.toLocaleString("pt-BR")} linhas operacionais e ${meaningfulSnapshot ? "leitura do painel" : "nenhum snapshot"} salvos neste navegador.`);
    } catch (e) {
      setErroEtapa(e instanceof Error ? e.message : "Falha ao salvar a importação neste navegador.");
      announce("Falha na importação.");
    } finally {
      setConfirmando(false);
    }
  }

  function baixarRelatorio() {
    if (!table) return;
    // Mesma validação do preview — aqui para gerar o relatório integral.
    const result = resultadoValidacao ?? (obrigatoriosOk
      ? transformAndValidate(table.rows, mapping, { defaultArea })
      : { records: [], issues: [], skipped: 0, duplicates: 0, warnings: 0 });
    const csv = buildCsv(
      ["Linha na planilha", "Coluna", "Tipo", "Ocorrência"],
      result.issues.map((i) => [i.row, i.column, i.severity === "error" ? "linha ignorada" : "aviso", i.message]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-importacao.csv`;
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
    setAvisoEstrutura(null);
    setMapping({});
    setMappingTocado(false);
    if (inputFileRef.current) inputFileRef.current.value = "";
  }

  /* ================================ RENDER */

  return (
    <>
      <PageHeader
        overline="Dados"
        title="Importar planilha"
        description={`Leia arquivos .xlsx, .xls ou .csv de até ${MAX_FILE_MB} MB. A leitura, a validação e o armazenamento acontecem no seu navegador — os dados ficam neste navegador após a sua confirmação.`}
      />

      <div ref={liveRef} role="status" aria-live="polite" className="sr-only" />

      {/* Passo a passo */}
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
              Todas as abas com dados serão lidas e combinadas automaticamente.
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
                    <p className="text-[15px] font-bold text-navy-950">{combinedInfo.filesCount} {combinedInfo.filesCount === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-soft">
                      {combinedInfo.names.join(", ")}
                    </p>
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
          <fieldset className="card p-5">
            <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
              A qual área esta base pertence?
            </legend>
            <p className="mt-1 text-[13px] text-ink-soft">
              Se a planilha tiver uma coluna de área, ela poderá ser mapeada na próxima etapa e prevalece linha a linha.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(Object.keys(KIND_LABEL) as DatasetKind[]).map((k) => (
                <RadioCard
                  key={k}
                  name="kind"
                  checked={kind === k}
                  onChange={() => setKind(k)}
                  title={KIND_LABEL[k]}
                  desc={
                    k === "indiretos" ? "Materiais e serviços indiretos (administrativo, TI, facilities…)"
                    : k === "diretos" ? "Materiais e insumos ligados à produção e pesquisa"
                    : k === "capex" ? "Investimentos: equipamentos, obras e infraestrutura"
                    : "Base geral, sem distinção de área"
                  }
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="card p-5">
            <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
              Qual a natureza desta base?
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <RadioCard
                name="natureza"
                checked={natureza === "operacional"}
                onChange={() => setNatureza("operacional")}
                title="Base operacional detalhada"
                desc="Planilha de trabalho do dia a dia, com todos os campos de acompanhamento."
              />
              <RadioCard
                name="natureza"
                checked={natureza === "snapshot"}
                onChange={() => setNatureza("snapshot")}
                title="Snapshot semanal"
                desc="Fotografia consolidada de uma data (ex.: relatório semanal). Escopo e campos podem diferir da base operacional."
              />
            </div>
            {natureza === "snapshot" && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn-100/60 px-4 py-3 text-[12.5px] leading-relaxed text-warn-700">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                Snapshots não são misturados silenciosamente: o painel sinaliza quando bases de naturezas
                diferentes estiverem ativas ao mesmo tempo.
              </p>
            )}
          </fieldset>

          <div className="grid gap-5 lg:grid-cols-2">
            <fieldset className="card p-5">
              <legend className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Como tratar a base atual?
              </legend>
              <div className="mt-3 space-y-2">
                <RadioCard
                  name="modo"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  title="Substituir a base ativa desta área"
                  desc="A base anterior fica arquivada como “substituída” (auditoria e comparação de variação) e sai dos indicadores."
                />
                <RadioCard
                  name="modo"
                  checked={importMode === "combine"}
                  onChange={() => setImportMode("combine")}
                  title="Combinar com as bases ativas"
                  desc="Soma os registros às bases existentes. Use apenas se os arquivos cobrirem recortes diferentes."
                />
              </div>
            </fieldset>

            <div className="card p-5">
              <label htmlFor="ref-date" className="text-[12.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">
                Data de referência da base
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
                Data em que a planilha foi gerada na origem (ex.: data do snapshot). Ela identifica a base no painel e
                nas comparações. O cálculo de vencidos/a vencer usa sempre a data de hoje.
              </p>
            </div>
          </div>

          <WizardNav
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Mapear colunas"
          />
        </section>
      )}

      {/* =============== ETAPA 3: MAPEAMENTO =============== */}
      {step === 3 && combinedInfo && table && suggestion && (
        <section aria-label="Mapeamento de colunas" className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-[14.5px] font-bold text-navy-950">
                  Mapeamento de Colunas Unificado
                </h3>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                  As colunas de todas as abas foram combinadas. Aponte cada informação para a sua respectiva coluna nas planilhas.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] text-ink-soft">
              {fmtInt(table.totalRows)} linhas unidas · {table.headers.length} colunas únicas.
              Colunas não associadas ficarão salvas nos detalhes de cada registro (não serão perdidas).
            </p>
          </div>

          <div className="card border-navy-200 bg-navy-50/70 p-5" aria-label="Mapeamento específico das tabelas do dashboard">
            <h3 className="text-[14.5px] font-bold text-navy-950">Leitura específica do painel</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">
              Além do mapeamento operacional abaixo, o Giro de Atas procura somente os nomes exatos da planilha para montar o snapshot semanal. Nenhuma coluna parecida é usada por inferência.
            </p>
            <ul className="mt-3 grid gap-2 text-[12px] leading-relaxed text-ink sm:grid-cols-2">
              <li><strong>Leitura dos gráficos:</strong> <code>Gráfico</code>, <code>Situação apresentada</code>, <code>ATAS</code>, <code>ITENS</code>.</li>
              <li><strong>Valores:</strong> <code>VALOR DIRETOS</code>, <code>VALOR INDIRETOS</code>, <code>VALOR CAPEX</code>.</li>
              <li><strong>Saving:</strong> <code>Rótulos de Linha</code> (CAPEX/DIRETOS/INDIRETOS/TOTAL), <code>VALOR CONTRATADO R$</code>, <code>SAVING HISTÓRICO R$</code>, <code>SAVING PROPOSTA INICIAL R$</code>, reduções.</li>
              <li><strong>Compradores:</strong> <code>TOP COMP INDIRETOS</code>, <code>TOP COMP DIRETOS</code>, <code>TOP COMP CAPEX</code>, <code>ITENS</code>, <code>ATAS</code>.</li>
              <li><strong>Fornecedores:</strong> <code>FORNECEDOR</code>, <code>QTD ATAS</code>, <code>QTD ITENS</code>, <code>% CONCENTRAÇÃO DE ITENS</code>, <code>ANÁLISE</code>.</li>
              <li><strong>Evolução:</strong> <code>ATA INDIRETOS</code>, <code>ATA DIRETOS</code>, <code>ATA CAPEX</code>, <code>ITEM SALDO V ...</code>, <code>ITEM S/SALDO ...</code>, <code>VENCIDAS ...</code>, <code>A VENCER ...</code>.</li>
              <li><strong>Previsões:</strong> em outra planilha, <code>COMPRADOR</code>, <code>AREA</code>, <code>PRAZO CONCLUSÃO</code>.</li>
            </ul>
            {snapshotPreview && (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12px] font-semibold text-navy-700" role="status">
                Blocos reconhecidos nesta leitura: {snapshotPreview.coverage.found.length ? snapshotPreview.coverage.found.join(", ") : "nenhum ainda"}.
              </p>
            )}
          </div>

          {avisoEstrutura && (
            <div className="card flex items-start gap-2.5 border-warn-600/30 bg-warn-100/50 p-4 text-[13px] leading-relaxed text-warn-700" role="status">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              {avisoEstrutura}
            </div>
          )}

          <div className="card overflow-hidden">
            <ul className="divide-y divide-line/70">
              {CANONICAL_FIELDS.map((f) => {
                const selecionada = mapping[f.key] ?? "";
                const confianca = suggestion.confidence[f.key];
                const amostras = selecionada
                  ? [...new Set(table.rows.slice(0, 60).map((r) => r[selecionada]).filter((v) => v !== null && v !== undefined && String(v).trim() !== "").map((v) => (v instanceof Date ? v.toLocaleDateString("pt-BR") : String(v))))].slice(0, 3)
                  : [];
                return (
                  <li key={f.key} className="grid gap-2 px-5 py-4 md:grid-cols-[240px_1fr] md:items-center md:gap-5">
                    <div>
                      <p className="text-[13.5px] font-bold text-ink">{f.label}</p>
                      <p className="mt-0.5 text-[12px] text-ink-soft">{f.hint}</p>
                      {confianca === "partial" && selecionada && (
                        <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-semibold text-warn-700">
                          <TriangleAlert size={12} aria-hidden="true" />
                          Sugestão aproximada — confira
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor={`map-${f.key}`} className="sr-only">
                        Coluna da planilha para {f.label}
                      </label>
                      <select
                        id={`map-${f.key}`}
                        value={selecionada}
                        onChange={(e) => {
                          setMappingTocado(true);
                          setMapping((m) => ({ ...m, [f.key]: e.target.value || null }));
                        }}
                        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[13.5px] font-medium text-ink"
                      >
                        <option value="">— não importar este campo —</option>
                        {table.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      {amostras.length > 0 && (
                        <p className="mt-1.5 truncate text-[12px] text-ink-soft" title={amostras.join(" · ")}>
                          <span className="font-semibold">Exemplos:</span> {amostras.join(" · ")}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {!canValidate && (
            <div className="card flex items-start gap-2.5 border-danger-600/30 bg-danger-100/40 p-4 text-[13px] leading-relaxed text-danger-700" role="alert">
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Para continuar, associe os campos essenciais de uma base operacional ou forneça uma planilha com os blocos específicos e nomes exatos do painel.
            </div>
          )}
          {canValidate && !obrigatoriosOk && snapshotMeaningful && (
            <div className="card flex items-start gap-2.5 border-ok-600/30 bg-ok-100/60 p-4 text-[13px] leading-relaxed text-ok-700" role="status">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              Blocos do dashboard reconhecidos. O mapeamento operacional é opcional para uma importação somente de métricas; os registros de processos não serão criados.
            </div>
          )}

          <WizardNav
            onBack={() => setStep(2)}
            onNext={validar}
            nextLabel={validando ? "Validando…" : "Validar dados"}
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Linhas válidas" value={fmtInt(validacao.resumo.validos)} tone="ok" />
            <Stat label="Ignoradas (campos essenciais/duplic.)" value={fmtInt(validacao.resumo.ignoradas)} tone={validacao.resumo.ignoradas > 0 ? "warn" : "neutral"} />
            <Stat label="Duplicadas removidas" value={fmtInt(validacao.resumo.duplicadas)} tone={validacao.resumo.duplicadas > 0 ? "warn" : "neutral"} />
            <Stat label="Avisos de interpretação" value={fmtInt(validacao.resumo.avisos)} tone={validacao.resumo.avisos > 0 ? "navy" : "neutral"} />
          </div>

          <div className="card p-5">
            <SectionTitle title="Resumo do que será importado" />
            <dl className="grid gap-x-8 gap-y-3 text-[13.5px] sm:grid-cols-2">
              <ResumoItem label="Arquivos">{combinedInfo.names.join(", ")} ({combinedInfo.sheetsCount} abas)</ResumoItem>
              <ResumoItem label="Base">{KIND_LABEL[kind]} · {natureza === "snapshot" ? "snapshot semanal" : "base operacional"}</ResumoItem>
              <ResumoItem label="Modo">{importMode === "replace" ? `Substituir a base ativa de ${KIND_LABEL[kind]} (a atual vai para o histórico)` : "Combinar com as bases ativas"}</ResumoItem>
              <ResumoItem label="Data de referência">{referenceDate ? referenceDate.split("-").reverse().join("/") : "—"}</ResumoItem>
              <ResumoItem label="Valor estimado total">
                {fmtCurrency(validacao.resumo.valorTotal)}{" "}
                <span className="text-ink-soft">(presente em {fmtInt(validacao.resumo.valorCobertura)} linhas)</span>
              </ResumoItem>
              <ResumoItem label="Itens">
                {fmtInt(validacao.resumo.itensTotal)}{" "}
                <span className="text-ink-soft">(presente em {fmtInt(validacao.resumo.itensCobertura)} linhas)</span>
              </ResumoItem>
              <ResumoItem label="Blocos específicos do dashboard">
                {validacao.snapshotCoverage?.found.length ?? 0} reconhecidos
                {validacao.snapshotCoverage?.found.length ? <span className="text-ink-soft"> · {validacao.snapshotCoverage.found.join(", ")}</span> : null}
              </ResumoItem>
            </dl>
          </div>

          {validacao.resumo.issuesTotal > 0 ? (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-[14.5px] font-bold text-navy-950">Ocorrências encontradas na validação</h3>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">
                    Mostrando {fmtInt(Math.min(validacao.resumo.issuesAmostra.length, 60))} de{" "}
                    {fmtInt(validacao.resumo.issuesTotal)}. Baixe o relatório para ver todas — nada é ocultado.
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
                    {validacao.resumo.issuesAmostra.slice(0, 60).map((i, idx) => (
                      <tr key={idx} className="border-b border-line/60 last:border-0">
                        <td className="tnum px-4 py-2.5 font-semibold text-ink">{fmtInt(i.row)}</td>
                        <td className="px-4 py-2.5">
                          {i.severity === "error" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-100 px-2.5 py-1 text-[11.5px] font-semibold text-danger-700">
                              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-danger-600" />
                              linha ignorada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-100 px-2.5 py-1 text-[11.5px] font-semibold text-warn-700">
                              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-warn-600" />
                              aviso — linha mantida
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-ink">{i.column}</td>
                        <td className="px-4 py-2.5 leading-snug text-ink">{i.message}</td>
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
                {validacao.resumo.validos === 0 && validacao.snapshotMeaningful
                  ? "Nenhuma linha operacional foi criada; a validação reconheceu somente os blocos específicos do snapshot."
                  : "Nenhuma ocorrência: os campos essenciais estão preenchidos, sem duplicidades e sem avisos de interpretação."}
              </p>
            </div>
          )}

          {validacao.resumo.validos === 0 && !validacao.snapshotMeaningful && (
            <div className="card border-danger-600/30 bg-danger-100/40 p-5 text-[13.5px] font-semibold text-danger-700" role="alert">
              Nenhuma linha válida para importar. Volte e ajuste o mapeamento ou corrija a planilha na origem.
            </div>
          )}
          {validacao.resumo.validos === 0 && validacao.snapshotMeaningful && (
            <div className="card border-ok-600/30 bg-ok-100/60 p-5 text-[13.5px] font-semibold text-ok-700" role="status">
              Esta importação contém somente métricas/tabelas do dashboard. Os blocos reconhecidos serão salvos como snapshot e não exigem identificador de processo.
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
              Voltar ao mapeamento
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={confirmando || (validacao.resumo.validos === 0 && !validacao.snapshotMeaningful)}
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent-600 px-6 text-[14.5px] font-bold text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-describedby="confirm-hint"
            >
              {confirmando ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={17} aria-hidden="true" />}
              {confirmando ? "Importando…" : `Confirmar importação${validacao.resumo.validos > 0 ? ` de ${fmtInt(validacao.resumo.validos)} linhas` : " do snapshot"}`}
            </button>
          </div>
          <p id="confirm-hint" className="text-right text-[12px] text-ink-soft">
            {importMode === "replace"
              ? `A base ativa de ${KIND_LABEL[kind]} será substituída (mantida no histórico).`
              : "As linhas serão somadas às bases ativas."}{" "}
            A gravação local é atômica: ou o dataset é salvo completo, ou nada é alterado.
          </p>
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
              <strong className="tnum text-ink">{fmtInt(validacao.resumo.validos)}</strong> registros operacionais foram
              processados e agora alimentam os indicadores e a busca.
              {validacao.snapshotMeaningful && (
                <> Os blocos específicos do dashboard também foram salvos como snapshot local.</>
              )}
              {validacao.resumo.ignoradas > 0 && (
                <>
                  {" "}
                  <strong className="tnum text-ink">{fmtInt(validacao.resumo.ignoradas)}</strong> linhas foram ignoradas
                  e estão listadas no relatório — corrija na origem e reimporte se necessário.
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
```

### src/components/layout/app-shell.tsx

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { BookOpen, LayoutDashboard, Maximize2, Minimize2, Table2, Upload } from "lucide-react";
import clsx from "clsx";
import { fmtDate } from "@/lib/format";
import { getStaticBaseSummary } from "@/lib/dashboard/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/storage/static-store";

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
```

### src/components/panorama/datasets-panel.tsx

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Database, FileSpreadsheet, Trash2, CircleAlert } from "lucide-react";
import clsx from "clsx";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";
import { KIND_LABEL } from "@/lib/domain";
import { deleteDataset, formatStoredDataset, listDatasets, notifyStaticDataChanged } from "@/lib/storage/static-store";

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
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 font-medium text-accent-700" title={d.snapshot_coverage?.found.join(", ") || "Snapshot local"}>
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
```

### src/components/panorama/panorama-view.tsx

```tsx
"use client";

import Link from "next/link";
import { FileStack, FileUp, RefreshCw } from "lucide-react";
import { getStaticDashboardData, type StaticDashboardData } from "@/lib/dashboard/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/storage/static-store";
import type { ForecastBand, SnapshotArea, SnapshotMonthlyForecastRow } from "@/lib/dashboard/dashboard-snapshot";
import { useCallback, useEffect, useState } from "react";
import { DatasetsPanel } from "@/components/panorama/datasets-panel";
import { EmptyState, PageHeader } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import clsx from "clsx";

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

export function PanoramaView() {
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

  const { kpis, porArea, topCompradores, fornecedores, evolucao, renovacoes, previsoes, currentSnapshot, previousSnapshot, savingTotal } = data;
  const areaVisualOrder = ["CAPEX", "DIRETOS", "INDIRETOS"];
  const porAreaVisual = [...(porArea as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));
  const evolucaoVisual = [...(evolucao as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));

  // Helpers para o funil de renovação
  const getRenov = (area: string, status: string) => {
    const row = (renovacoes as any[]).find(r => r.area === area && r.status === status);
    return { atas: row?.atas || 0, itens: row?.itens || 0 };
  };

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

      {/* Bloco 1: três gráficos da semana anterior e três da semana atual. */}
      <section aria-labelledby="comparacao-semanal" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="comparacao-semanal" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Leitura dos gráficos</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">A semana anterior é preservada no IndexedDB deste navegador e substituída pela leitura imediatamente anterior após uma nova importação.</p>
          </div>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-[12px] font-semibold text-navy-700">
            Referência anterior: {formatReferenceDate(previousSnapshot?.referenceDate)}
          </span>
        </div>
        {previousSnapshot && <SnapshotCharts title={`Semana anterior · ${formatReferenceDate(previousSnapshot.referenceDate)}`} kpis={previousSnapshot.kpis} muted />}
        <SnapshotCharts
          title={`Semana atual${currentSnapshot?.referenceDate ? ` · ${formatReferenceDate(currentSnapshot.referenceDate)}` : ""}`}
          kpis={{
            concluidasAtas: kpis.concluidosAtas,
            concluidasItens: kpis.concluidosItens,
            saldoItens: kpis.saldoItens,
            consumidoItens: kpis.consumidoItens,
            aVencerAtas: kpis.aVencerAtas,
            aVencerItens: kpis.aVencerItens,
            vencidasAtas: kpis.vencidasAtas,
            vencidasItens: kpis.vencidasItens,
          }}
        />
      </section>

      {/* Bloco 2: Valor Contratado & Saving (Ref: Screenshot 2 & 12) */}
      <section className="card overflow-hidden text-[13px]">
        <div className="grid items-stretch lg:grid-cols-2 divide-x divide-line">
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] items-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Valor Contratado Por Área</h3>
            <table className="w-full flex-1 text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="h-full divide-y divide-white border-b-4 border-white">
                {porAreaVisual.map((a) => (
                  <tr key={a.area} className={a.area.toUpperCase() === "DIRETOS" ? "bg-diretos-500 text-white font-bold" : a.area.toUpperCase() === "INDIRETOS" ? "bg-indiretos-500 text-white font-bold" : a.area.toUpperCase() === "CAPEX" ? "bg-[#37474f] text-white font-bold" : "bg-neutral-100 font-bold"}>
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
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] flex-col justify-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Saving <span className="text-[14px] text-danger-700 block mt-1 font-sans">Mapeamento iniciado em abr.2026</span></h3>
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
          </div>
        </div>
      </section>

      {/* Bloco 3: Distribuição de Volume & Fornecedores (Ref: Screenshot 3 & 13) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Distribuição de Volume por Área (% Atas)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = areaPercent(area);
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className="bg-navy-950 text-white text-center py-3">
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
        </div>

        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Representatividade Fornecedores</h2>
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
        </div>
      </section>

      {/* Bloco 4: Evolução Por Área (Ref: Screenshot 4 & 14) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Evolução Por Área (Por Status Atual)</h2>
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
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", e.area.toUpperCase() === "DIRETOS" ? "bg-diretos-500" : e.area.toUpperCase() === "INDIRETOS" ? "bg-indiretos-500" : e.area.toUpperCase() === "CAPEX" ? "bg-capex-500" : "bg-neutral-500")}>
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

      {/* Bloco 5: Status de Renovações (Ref: Screenshots 5, 6, 7 & 15, 16, 17) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-6">Status de Renovações</h2>
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

      {/* Bloco 6: Previsão de Conclusão Por Faixa (Ref: Screenshots 8 & 18) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-6">Indicadores - Atas em andamento</h2>
        <h3 className="text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Previsão de Conclusão Por Faixa (Até 60 dias)</h3>
        
        <div className="space-y-8">
          <FaixaPrevisao title="Previsões para concluir acima de 60 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByBand("Indiretos", "acima_60") },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByBand("Diretos", "acima_60") },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByBand("CAPEX", "acima_60") },
          ]}/>
          <FaixaPrevisao title="Previstas para concluir nos próximos 15 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByBand("Indiretos", "ate_15") },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByBand("Diretos", "ate_15") },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByBand("CAPEX", "ate_15") },
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 30 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByBand("Indiretos", "ate_30") },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByBand("Diretos", "ate_30") },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByBand("CAPEX", "ate_30") },
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 60 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByBand("Indiretos", "ate_60") },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByBand("Diretos", "ate_60") },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByBand("CAPEX", "ate_60") },
          ]}/>
          <FaixaPrevisao
            title="Previsões vencidas"
            titleClass="bg-[#b42318] text-white border-danger-700"
            areaStats={[
              { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByBand("Indiretos", "vencidas") },
              { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByBand("Diretos", "vencidas") },
              { area: "CAPEX", bg: "bg-[#fca500]", ...prevByBand("CAPEX", "vencidas") },
            ]}
          />

          <PrevisaoMensal
            areas={[
              { area: "INDIRETOS", bg: "bg-[#0b7c7b]", buckets: monthlyForArea("Indiretos") },
              { area: "DIRETOS", bg: "bg-[#008cff]", buckets: monthlyForArea("Diretos") },
              { area: "CAPEX", bg: "bg-[#fca500]", buckets: monthlyForArea("CAPEX") },
            ]}
          />
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

function formatReferenceDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

type SnapshotChartKpis = {
  concluidasAtas: number | null;
  concluidasItens: number | null;
  saldoItens: number | null;
  consumidoItens: number | null;
  aVencerAtas: number | null;
  aVencerItens: number | null;
  vencidasAtas: number | null;
  vencidasItens: number | null;
};

function SnapshotCharts({ title, kpis, muted = false }: { title: string; kpis: SnapshotChartKpis; muted?: boolean }) {
  return (
    <div className={clsx("rounded-2xl border p-4 sm:p-5", muted ? "border-line bg-navy-50/40" : "border-line bg-surface")}>
      <h3 className="mb-4 text-[15px] font-bold uppercase tracking-wide text-navy-900">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        <MiniMetricChart
          title="ATA CONCLUÍDAS (VÁLIDAS)"
          groups={[{ label: "VÁLIDO", bars: [{ label: "ATAS", value: kpis.concluidasAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.concluidasItens, color: "#e06e1f" }] }]}
        />
        <MiniMetricChart
          title="ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)"
          groups={[{ label: "COM SALDO", bars: [{ label: "ITENS", value: kpis.saldoItens, color: "#0c2338" }] }, { label: "CONSUMIDO", bars: [{ label: "ITENS", value: kpis.consumidoItens, color: "#e06e1f" }] }]}
        />
        <MiniMetricChart
          title="ATAS VENCIDAS E A VENCER"
          groups={[{ label: "RENOVAR", bars: [{ label: "ATAS", value: kpis.aVencerAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.aVencerItens, color: "#e06e1f" }] }, { label: "VENCIDO", bars: [{ label: "ATAS", value: kpis.vencidasAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.vencidasItens, color: "#e06e1f" }] }]}
        />
      </div>
    </div>
  );
}

function MiniMetricChart({ title, groups }: { title: string; groups: Array<{ label: string; bars: Array<{ label: string; value: number | null; color: string }> }> }) {
  const max = Math.max(1, ...groups.flatMap((group) => group.bars.map((bar) => bar.value ?? 0)));
  return (
    <div className="rounded-xl border border-line bg-white p-3" aria-label={title}>
      <h4 className="min-h-8 text-center text-[11px] font-bold uppercase leading-tight text-navy-900">{title}</h4>
      <div className="mt-3 flex h-32 items-end justify-around gap-2 border-b border-line px-1">
        {groups.map((group) => (
          <div key={group.label} className="flex h-full flex-1 items-end justify-center gap-1">
            {group.bars.map((bar) => {
              const value = bar.value ?? 0;
              return (
                <div key={`${group.label}-${bar.label}`} className="flex h-full w-7 flex-col items-center justify-end">
                  <span className="mb-1 text-[10px] font-bold text-navy-900">{fmtInt(value)}</span>
                  <div className="w-full rounded-t-sm" style={{ height: `${Math.max(value ? 5 : 2, (value / max) * 78)}px`, backgroundColor: bar.color }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-around gap-2 text-center text-[9px] font-bold uppercase text-ink-soft">
        {groups.map((group) => <span key={group.label} className="flex-1">{group.label}</span>)}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-ink-soft">
        {[...new Map(groups.flatMap((group) => group.bars.map((bar) => [bar.label, bar.color] as const))).entries()].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1"><span className="h-2 w-2" style={{ backgroundColor: color }} aria-hidden="true" />{label}</span>
        ))}
      </div>
    </div>
  );
}

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
                  <div className="text-[10px] font-semibold text-ink-soft">{fmtInt(b.atas)} ATAS · {fmtInt(b.itens)} ITENS</div>
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
```

### src/components/processos/processos-browser.tsx

```tsx
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
import { listActiveProcessRows, STATIC_DATA_EVENT } from "@/lib/storage/static-store";

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
      for (const row of data) {
        const rowArea = row.area ?? "Não informado";
        areaCount.set(rowArea, (areaCount.get(rowArea) ?? 0) + 1);
        if (row.etapa) etapaCount.set(row.etapa, (etapaCount.get(row.etapa) ?? 0) + 1);
      }
      setFacets({
        areas: [...areaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([area, total]) => ({ area, total })),
        etapas: [...etapaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([etapa, total]) => ({ etapa, total })),
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
  }, [allRows, qDebounced, area, situacao, etapa, sort, dir]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activePage = Math.min(page, totalPages);
  const rows = useMemo(() => filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize), [filteredRows, activePage, pageSize]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (qDebounced) params.set("q", qDebounced);
    if (area !== "todas") params.set("area", area);
    if (situacao !== "todas") params.set("situacao", situacao);
    if (etapa !== "todas") params.set("etapa", etapa);
    if (sort !== "data_fim") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (page > 1) params.set("page", String(page));
    const prefix = window.location.pathname.includes("/processos") ? window.location.pathname.split("/processos")[0] : "";
    const qs = params.toString();
    window.history.replaceState(null, "", `${prefix}/processos/${qs ? `?${qs}` : ""}`);
  }, [qDebounced, area, situacao, etapa, sort, dir, page]);

  const filtrosAtivos =
    (qDebounced ? 1 : 0) + (area !== "todas" ? 1 : 0) + (situacao !== "todas" ? 1 : 0) + (etapa !== "todas" ? 1 : 0);
  const semBase = !loading && allRows !== null && total === 0 && filtrosAtivos === 0;

  function limparFiltros() {
    setQ("");
    setArea("todas");
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_190px]">
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
```

## Bibliotecas (src/lib/)

### src/lib/csv.ts

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

### src/lib/domain.ts

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

### src/lib/format.ts

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

### src/lib/dashboard/dashboard-snapshot.ts

```typescript
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

export interface SnapshotKpis {
  concluidasAtas: number | null;
  concluidasItens: number | null;
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
  atas: number;
  itens: number;
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
  return String(value).replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
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

function daysUntilISO(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
  const referenceYear = referenceDate ? Number(referenceDate.slice(0, 4)) : new Date().getFullYear();
  return {
    label: cellText(value),
    month: MONTH_NUMBERS[monthName],
    year: yearMatch ? Number(yearMatch[1]) : referenceYear,
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
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 10000); r += 1) {
        const row = sheet.matrix[r] ?? [];
        if (isBlank(row)) break;
        const buyer = cellText(row[buyerCol]);
        const area = isArea(row[areaCol]);
        const deadlineText = cellText(row[deadlineCol]);
        if (!buyer || !area || !deadlineText) continue;

        let iso: string | null = null;
        const date = parseDateBR(row[deadlineCol], "PRAZO CONCLUSAO");
        if (date.iso) iso = date.iso;
        const bandByText = bandFromLabel(deadlineText);
        const band = bandByText ?? (iso ? bandFromDays(daysUntilISO(iso)) : null);
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
          existing.atas += atas;
          existing.itens += itens;
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
      payload.previsoes[band][area].buyers.sort((a, b) => b.itens - a.itens || b.atas - a.atas);
    }
  }
  if (found) addFound(payload, "previsoes-cruzadas");
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

  const allKnown = [
    "kpis-leitura",
    "valores-por-area",
    "saving",
    "top-compradores",
    "fornecedores",
    "evolucao",
    "previsao-faixas",
    "previsao-meses",
    "previsoes-cruzadas",
  ];
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
 * Referência inicial de 28/09 solicitada para que a comparação semanal não
 * fique vazia antes de existir uma segunda importação. São somente os números
 * da tabela “LEITURA DOS GRÁFICOS” fornecida como referência.
 */
export function defaultPreviousSnapshot(): DashboardSnapshotPayload {
  const payload = emptyDashboardSnapshot("2026-09-28", ["Referência fornecida nas capturas — 28/09"]);
  payload.kpis = {
    concluidasAtas: 58,
    concluidasItens: 956,
    saldoItens: 877,
    consumidoItens: 80,
    aVencerAtas: 58,
    aVencerItens: 1215,
    vencidasAtas: 48,
    vencidasItens: 334,
  };
  payload.coverage.found = ["kpis-leitura"];
  payload.coverage.missing = ["valores-por-area", "saving", "top-compradores", "fornecedores", "evolucao", "previsao-faixas", "previsao-meses", "previsoes-cruzadas"];
  payload.notes.push("Referência inicial fixa apenas para a comparação dos três gráficos; será substituída pelo snapshot imediatamente anterior após novas importações.");
  return payload;
}
```

### src/lib/dashboard/static-dashboard.ts

```typescript
import {
  listActiveDatasets,
  listActiveProcessRows,
  listDatasets,
  listSnapshotDatasets,
  formatStoredDataset,
  type ProcessRow,
} from "@/lib/storage/static-store";
import {
  defaultPreviousSnapshot,
  type DashboardSnapshotPayload,
  type ForecastBand,
  type SnapshotArea,
  SNAPSHOT_AREAS,
} from "@/lib/dashboard/dashboard-snapshot";

export interface StaticDashboardData {
  geradoEm: string;
  hasData: boolean;
  currentSnapshot: DashboardSnapshotPayload | null;
  previousSnapshot: DashboardSnapshotPayload | null;
  savingTotal: {
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  } | null;
  snapshotHistory: Array<{
    id: number;
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
  renovacoes: Array<{ area: string; status: string; atas: number; itens: number }>;
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

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

function snapshotHas(snapshot: DashboardSnapshotPayload | null, key: string): boolean {
  return Boolean(snapshot?.coverage.found.includes(key));
}

export async function getStaticDashboardData(): Promise<StaticDashboardData> {
  const [rows, allDatasets, snapshotDatasets] = await Promise.all([
    listActiveProcessRows(),
    listDatasets(),
    listSnapshotDatasets(),
  ]);

  const currentSnapshot = snapshotDatasets[0]?.snapshot ?? null;
  // Antes de uma segunda importação, a referência fornecida para 28/09 mantém
  // os três gráficos comparáveis. A partir da segunda leitura, o histórico real
  // ocupa este lugar automaticamente.
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

  const renewalGroups = new Map<string, { area: string; status: string; atas: number; itens: number }>();
  for (const row of rows) {
    const key = groupKey(row.area ?? "Não informado", row.status_renovacao ?? "Outros");
    const current = renewalGroups.get(key) ?? { area: row.area ?? "Não informado", status: row.status_renovacao ?? "Outros", atas: 0, itens: 0 };
    current.atas += 1;
    current.itens += n(row.quantidade);
    renewalGroups.set(key, current);
  }

  const forecastGroups = new Map<string, { area: string; responsavel: string; data_previsao: string; dias: number; atas: number; itens: number; band?: ForecastBand }>();
  for (const row of rows) {
    if (row.situacao_norm !== null || !row.data_previsao) continue;
    const area = row.area ?? "Não informado";
    const responsavel = row.responsavel ?? "Não informado";
    const key = groupKey(area, responsavel, row.data_previsao);
    const current = forecastGroups.get(key) ?? { area, responsavel, data_previsao: row.data_previsao, dias: daysUntil(row.data_previsao), atas: 0, itens: 0 };
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
        const listedAtas = source.buyers.reduce((sum, buyer) => sum + buyer.atas, 0);
        const listedItens = source.buyers.reduce((sum, buyer) => sum + buyer.itens, 0);
        for (const buyer of source.buyers) {
          snapshotForecast.push({
            area: areaDisplay(area),
            responsavel: buyer.name,
            data_previsao: buyer.prazoConclusao ?? "",
            dias: buyer.prazoConclusao && /^\d{4}-\d{2}-\d{2}$/.test(buyer.prazoConclusao)
              ? daysUntil(buyer.prazoConclusao)
              : forecastBandDays(band),
            atas: buyer.atas,
            itens: buyer.itens,
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
  const snapshotHistory = snapshotDatasets.map((dataset) => ({
    id: dataset.id,
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
    savingTotal,
    snapshotHistory,
    kpis,
    porArea,
    topCompradores,
    fornecedores,
    evolucao: [...currentEvolution.values()],
    renovacoes: [...renewalGroups.values()].sort((a, b) => a.area.localeCompare(b.area) || a.status.localeCompare(b.status)),
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
```

### src/lib/import/client-parse.ts

```typescript
/**
 * Leitura de arquivos .xlsx/.csv **no navegador** (nada é enviado a
 * serviços de terceiros; o o arquivo é processado localmente e, após a confirmação, os dados ficam no
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
```

### src/lib/import/mapping.ts

```typescript
/**
 * Sugestão automática de mapeamento coluna → campo canônico.
 * Nunca decide sozinho em caso de ambiguidade: devolve `confidence` e a
 * interface deixa o usuário confirmar ou ajustar.
 */
import { CANONICAL_FIELDS, normText, type Mapping } from "@/lib/domain";

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

### src/lib/storage/static-store.ts

```typescript
import {
  situacaoPrazo,
  type CleanRecord,
  type DatasetKind,
  type DatasetNatureza,
  type ImportMode,
  type Issue,
  type SituacaoChave,
} from "@/lib/domain";
import type { DashboardSnapshotPayload } from "@/lib/dashboard/dashboard-snapshot";

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
    // Snapshot é uma série única do painel: ao importar uma nova leitura,
    // a leitura anterior continua no histórico e deixa de ser a ativa.
    ...(input.snapshot
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
```

## CI/CD e publicação

### .github/workflows/deploy.yml

```yaml
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
```

### public/.nojekyll

_(arquivo vazio — apenas sinaliza ao GitHub Pages para não processar o site com Jekyll)_

## Scripts

### scripts/gerar-codigo-fonte.mjs

```javascript
/**
 * Regenera o CODIGO-FONTE.md: documento único com todos os arquivos do projeto
 * e seus respectivos códigos, na ordem da estrutura de pastas.
 *
 *   npm run docs:fonte
 *
 * A saída é determinística (sem data/hora), então o arquivo só muda quando o
 * código muda. Não depende de nenhum pacote externo.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = join(ROOT, "CODIGO-FONTE.md");

/** Seções na ordem em que aparecem no documento. Pastas são percorridas recursivamente. */
const SECTIONS = [
  {
    title: "Arquivos de configuração",
    entries: ["package.json", "tsconfig.json", "next.config.ts", "eslint.config.mjs", "postcss.config.mjs", ".gitignore"],
  },
  { title: "Rotas (src/app/)", entries: ["src/app"] },
  { title: "Componentes (src/components/)", entries: ["src/components"] },
  { title: "Bibliotecas (src/lib/)", entries: ["src/lib"] },
  { title: "CI/CD e publicação", entries: [".github/workflows/deploy.yml", "public/.nojekyll"] },
  { title: "Scripts", entries: ["scripts"] },
];

const LANGUAGES = {
  ".ts": "typescript",
  ".tsx": "tsx",
  ".mjs": "javascript",
  ".js": "javascript",
  ".json": "json",
  ".css": "css",
  ".yml": "yaml",
  ".yaml": "yaml",
  ".md": "markdown",
};

/** Arquivos da pasta primeiro (ordem alfabética), depois subpastas (ordem alfabética). */
function listFiles(dir) {
  const items = readdirSync(dir).map((name) => join(dir, name));
  const files = items.filter((p) => statSync(p).isFile()).sort();
  const dirs = items.filter((p) => statSync(p).isDirectory()).sort();
  return [...files, ...dirs.flatMap(listFiles)];
}

function expand(entry) {
  const abs = join(ROOT, entry);
  return statSync(abs).isDirectory() ? listFiles(abs) : [abs];
}

/** Mesma regra de âncora que o GitHub aplica aos títulos (letras acentuadas são preservadas). */
function anchor(heading) {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M} _-]/gu, "")
    .replace(/ /g, "-");
}

function fence(content) {
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map((m) => m[0].length));
  return "`".repeat(longest + 1);
}

const toc = [];
const body = [];

for (const section of SECTIONS) {
  const files = section.entries.flatMap(expand);
  toc.push(`- [${section.title}](#${anchor(section.title)})`);
  body.push(`## ${section.title}`, "");
  for (const file of files) {
    const rel = relative(ROOT, file).split("\\").join("/");
    const heading = rel;
    toc.push(`  - [${rel}](#${anchor(heading)})`);
    const content = readFileSync(file, "utf8").replace(/\r\n/g, "\n").replace(/\n+$/, "");
    body.push(`### ${heading}`, "");
    if (content.trim() === "") {
      body.push("_(arquivo vazio — apenas sinaliza ao GitHub Pages para não processar o site com Jekyll)_", "");
      continue;
    }
    const lang = LANGUAGES[extname(file)] ?? (basename(file) === ".gitignore" ? "gitignore" : "text");
    const f = fence(content);
    body.push(`${f}${lang}`, content, f, "");
  }
}

const doc = [
  "# Giro de Atas — Código-fonte consolidado",
  "",
  "Documento de referência com todos os arquivos do projeto e seus respectivos códigos, na ordem da estrutura de pastas.",
  "",
  "> Gerado automaticamente por `npm run docs:fonte` (`scripts/gerar-codigo-fonte.mjs`). Não edite à mão: rode o comando após alterar o código.",
  "",
  "---",
  "",
  "## Sumário",
  "",
  ...toc,
  "",
  "---",
  "",
  ...body,
].join("\n");

writeFileSync(OUTPUT, doc.trimEnd() + "\n", "utf8");
console.log(`CODIGO-FONTE.md gerado com ${toc.filter((l) => l.startsWith("  -")).length} arquivos (${(Buffer.byteLength(doc) / 1024).toFixed(0)} KB).`);
```
