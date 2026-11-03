/**
 * Gera o snapshot compartilhado do Giro a partir das abas/arquivos exportados.
 *
 * Uso:
 *   npm run giro:json -- \
 *     "GIRO 01 - Panorama.csv" ... "GIRO 07 - Mensal.csv" \
 *     --ref=2026-10-28 --out=/tmp/giro-current.json
 *
 * O arquivo de saída contém somente o DashboardSnapshotPayload consolidado.
 * Não publique os arquivos de origem quando eles tiverem dados restritos.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  extractSnapshotPayload,
  hasSnapshotPayloadMeaningfulData,
  type SnapshotSourceSheet,
} from "@/lib/dashboard-snapshot";
import type { PublishedSnapshotDocument } from "@/lib/published-snapshot";

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;
const outputArg = args.find((arg) => arg.startsWith("--out="))?.slice(6);

if (files.length === 0 || !outputArg) {
  console.error("Uso: npm run giro:json -- <arquivo.csv|xlsx> [...] --ref=AAAA-MM-DD --out=/caminho/giro-current.json");
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
  return [";", ",", "\t", "|"]
    .sort((a, b) => (sample.split(b).length - 1) - (sample.split(a).length - 1))[0];
}

function readSheets(inputFiles: string[]): SnapshotSourceSheet[] {
  const sheets: SnapshotSourceSheet[] = [];
  for (const file of inputFiles) {
    const buffer = readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    const workbook = ext === ".csv"
      ? (() => {
          const text = decodeCsv(buffer);
          return XLSX.read(text, { type: "string", FS: delimiter(text), raw: true });
        })()
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

const sourceFiles = files.map((file) => path.basename(file));
const snapshot = extractSnapshotPayload(readSheets(files), {
  fileNames: sourceFiles,
  referenceDate,
});

if (!hasSnapshotPayloadMeaningfulData(snapshot)) {
  console.error("Nenhum bloco consolidado foi reconhecido; o JSON não foi gerado.");
  process.exit(2);
}

const document: PublishedSnapshotDocument = {
  schemaVersion: 1,
  kind: "giro-snapshot",
  generatedAt: new Date().toISOString(),
  snapshot,
};

const output = path.resolve(outputArg);
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`Snapshot compartilhado gerado em ${output}`);
console.log(`Referência: ${snapshot.referenceDate ?? "não informada"}`);
console.log(`Blocos reconhecidos: ${snapshot.coverage.found.length}`);
console.log(`Blocos ausentes: ${snapshot.coverage.missing.length}`);
