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
