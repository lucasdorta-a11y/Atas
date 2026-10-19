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
