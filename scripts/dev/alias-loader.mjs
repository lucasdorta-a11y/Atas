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
