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
