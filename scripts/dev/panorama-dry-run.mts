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
