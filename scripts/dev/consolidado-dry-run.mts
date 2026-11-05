/**
 * Valida a leitura das três bases consolidadas sem escrever JSON nem dados em public/.
 *
 * npm run consolidado:dry-run -- negociacao.xlsx renovacao.xlsx contratos.xlsx --ref=AAAA-MM-DD
 * Também aceita um único .xlsx com as três abas, ou três CSVs.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { extractConsolidatedGiro } from "@/lib/consolidated-giro";
import type { SnapshotSourceSheet } from "@/lib/dashboard-snapshot";
import { situacaoPrazo } from "@/lib/domain";

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;
if (!files.length) {
  console.error("Uso: npm run consolidado:dry-run -- <arquivos .xlsx/.csv> [--ref=AAAA-MM-DD]");
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
  const sample = text.split(/\r\n|\r|\n/).slice(0, 30).join("\n");
  return [";", ",", "\t", "|"].sort((a, b) => (sample.split(b).length - 1) - (sample.split(a).length - 1))[0];
}

const sheets: SnapshotSourceSheet[] = [];
for (const file of files) {
  const buffer = readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const text = ext === ".csv" ? decodeCsv(buffer) : null;
  const workbook = ext === ".csv"
    ? XLSX.read(text, { type: "string", FS: delimiter(text!), raw: true })
    : XLSX.read(buffer, { type: "buffer", cellDates: true });
  for (const sheetName of workbook.SheetNames) {
    sheets.push({
      fileName: path.basename(file),
      sheetName,
      matrix: XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
        header: 1, raw: true, defval: null, blankrows: true,
      }) as unknown[][],
    });
  }
}

const extracted = extractConsolidatedGiro(sheets, { referenceDate, fileNames: files.map((file) => path.basename(file)) });
if (!extracted) throw new Error("As três bases consolidadas não foram reconhecidas.");
const { snapshot, result } = extracted;
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(`Falha de consistência: ${message}`);
};
const sum = (values: Array<number | null | undefined>) => values.reduce<number>((total, value) => total + (value ?? 0), 0);
const areas = ["INDIRETOS", "DIRETOS", "CAPEX"] as const;
const natureCount = (nature: string) => result.records.filter((record) => record.extra.Natureza === nature).length;
const contratos = sum(areas.map((area) => snapshot.topCompradores[area].totalAtasArea));
const finalizadas = snapshot.atasConcluidas.length;
const canceladas = sum(areas.map((area) => snapshot.previsoes.canceladas[area].atas));
const andamento = snapshot.kpis.andamentoAtas ?? 0;

assert(snapshot.coverage.missing.length === 0, "há blocos ausentes no snapshot");
assert(result.records.length === contratos + finalizadas + canceladas + andamento, "Processos não reconcilia com Contratos + Negociação");
assert(natureCount("Contratos Vigentes") === contratos, "natureza Contratos Vigentes");
assert(natureCount("Histórico (Finaliz./Canc.)") === finalizadas + canceladas, "natureza Histórico");
assert(natureCount("Atas em Andamento") === andamento, "natureza Atas em Andamento");
assert(new Set(result.records.map((record) => record.rowHash)).size === result.records.length, "rowHash duplicado");
assert(result.records.every((record) => record.numero && record.objeto), "registro sem número ou objeto");
for (const area of areas) {
  const evolution = snapshot.evolucao[area];
  assert(evolution.andamentoAtas === snapshot.previsaoMeses[area].rows.reduce((total, row) => total + (row.atas ?? 0), 0), `previsão mensal de ${area}`);
}

const cwSearchable = result.records.filter((record) => /\bCW\d+/i.test(record.extra.CW ?? "")).length;
console.log("Leitura consolidada íntegra — nenhum arquivo foi gravado.");
console.log(`Referência: ${snapshot.referenceDate} | blocos: ${snapshot.coverage.found.length} | avisos: ${result.warnings}`);
console.log(`Processos: ${result.records.length} = ${andamento} Andamento + ${contratos} Contratos + ${finalizadas + canceladas} Histórico`);
console.log(`Registros com CW pesquisável: ${cwSearchable}`);
console.log("KPIs:", JSON.stringify(snapshot.kpis));
console.log(`Valor contratado: ${sum(areas.map((area) => snapshot.valueAreas[area].valor)).toFixed(2)}`);
console.log(`Saldo vigente disponível: ${sum(areas.map((area) => snapshot.valueAreas[area].saldoDisponivel)).toFixed(2)}`);
console.log(`Saving sob proposta: ${(snapshot.savingTotal.savingProp ?? 0).toFixed(2)}`);

// Com ATAS_STUB_STORE=1, testa também a montagem real do Panorama sem IndexedDB.
if (process.env.ATAS_STUB_STORE === "1") {
  const rows = result.records.map((record, index) => {
    const prazo = situacaoPrazo(record.situacaoNorm, record.dataFim);
    return {
      id: `dry-${index}`, dataset_id: 1,
      area: record.area, numero: record.numero, objeto: record.objeto,
      unidade: record.unidade, fornecedor: record.fornecedor, responsavel: record.responsavel,
      etapa: record.etapa, situacao_fonte: record.situacaoFonte, situacao_norm: record.situacaoNorm,
      data_inicio: record.dataInicio, data_fim: record.dataFim, quantidade: record.quantidade,
      valor: record.valor, status_consumo: record.statusConsumo,
      saving_hist: record.savingHist, saving_prop: record.savingProp,
      status_renovacao: record.statusRenovacao, data_previsao: record.dataPrevisao,
      observacao: record.observacao, link: record.link, source_row: record.sourceRow,
      extra: record.extra, dias: prazo.dias, situacao: prazo.chave,
      file_name: "dry-run", kind: "outro", natureza: record.extra.Natureza ?? "snapshot",
      reference_date: snapshot.referenceDate, imported_at: snapshot.capturedAt,
    };
  });
  (globalThis as Record<string, unknown>).__ATAS_STORE__ = { snapshots: [snapshot], rows, datasets: [] };
  const { getStaticDashboardData, getStaticBaseSummary } = await import("@/lib/static-dashboard");
  const dashboard = await getStaticDashboardData();
  const summary = await getStaticBaseSummary();
  assert(summary.processCount === result.records.length, "contagem global do Panorama");
  assert(dashboard.kpis.concluidosAtas === snapshot.kpis.concluidasAtas, "card de concluídas no Panorama");
  assert(dashboard.kpis.andamentoAtas === snapshot.kpis.andamentoAtas, "card de andamento no Panorama");
  assert(dashboard.atasConcluidas.totalFinalizadas === finalizadas, "lista de finalizadas no Panorama");
  console.log(`Panorama integrado: ${summary.processCount} registros | ${dashboard.atasConcluidas.totalFinalizadas} finalizadas na base atual`);
}
