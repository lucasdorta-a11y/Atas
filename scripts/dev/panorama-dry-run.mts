/**
 * Simula o panorama no Node: lê as planilhas, extrai o snapshot e monta o
 * mesmo StaticDashboardData da tela, sem navegador nem IndexedDB.
 *
 *   npm run panorama:dry-run -- amostras/a.csv amostras/b.csv --ref=2026-10-14
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { extractSnapshotPayload, type SnapshotSourceSheet } from "@/lib/dashboard-snapshot";

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;

if (files.length === 0) {
  console.error("uso: npm run panorama:dry-run -- <arquivo.csv|xlsx> [...] [--ref=AAAA-MM-DD]");
  process.exit(1);
}

const sheets: SnapshotSourceSheet[] = [];
for (const file of files) {
  const buffer = readFileSync(file);
  const workbook = path.extname(file).toLowerCase() === ".csv"
    ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string", FS: ";", raw: true })
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

const snapshot = extractSnapshotPayload(sheets, {
  referenceDate,
  fileNames: files.map((file) => path.basename(file)),
});
(globalThis as Record<string, unknown>).__ATAS_STORE__ = { snapshots: [snapshot], rows: [], datasets: [] };

const storeModule = await import("@/lib/static-store");
if (!("__STUB__" in storeModule)) {
  console.error("O stub do armazenamento não foi ativado; use npm run panorama:dry-run.");
  process.exit(1);
}
const { getStaticDashboardData } = await import("@/lib/static-dashboard");
const data = await getStaticDashboardData();
console.log("hasData:", data.hasData, "| referência:", data.currentSnapshot?.referenceDate);
console.log("\nBlocos:", data.blocos);
console.log("\nKPIs:", data.kpis);
console.log("\nPor área:", data.porArea);
console.log("\nSaving total:", data.savingTotal);
console.log("\nTop compradores:", data.topCompradores);
console.log("\nFornecedores:", data.fornecedores);
console.log("\nEvolução:", data.evolucao);
console.log("\nPrevisões:", data.previsoes.length, data.previsoes.slice(0, 5));
