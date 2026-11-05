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
import type { DashboardSnapshotPayload, SnapshotSourceSheet } from "@/lib/dashboard-snapshot";
import { situacaoPrazo } from "@/lib/domain";
import {
  EMPTY_EXECUTIVE_FILTERS,
  filterExecutiveProcesses,
  normalizeExecutiveProcesses,
  relatedProcessQuery,
  summarizeExecutiveProcesses,
} from "@/lib/process-executive";
import { panoramaCardHref } from "@/lib/process-links";

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith("--"));
const referenceDate = args.find((arg) => arg.startsWith("--ref="))?.slice(6) ?? null;
const previousFile = args.find((arg) => arg.startsWith("--previous="))?.slice(11) ?? null;
if (!files.length) {
  console.error("Uso: npm run consolidado:dry-run -- <arquivos .xlsx/.csv> [--ref=AAAA-MM-DD] [--previous=snapshot-anterior.json]");
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
const previousSnapshot: DashboardSnapshotPayload | null = previousFile ? (() => {
  const parsed = JSON.parse(readFileSync(previousFile, "utf8")) as { snapshot?: DashboardSnapshotPayload } & DashboardSnapshotPayload;
  return parsed.snapshot ?? parsed;
})() : null;

assert(snapshot.coverage.missing.length === 0, "há blocos ausentes no snapshot");
assert(!previousSnapshot || (previousSnapshot.referenceDate < snapshot.referenceDate && Array.isArray(previousSnapshot.atasConcluidas)), "snapshot anterior válido e mais antigo");
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
      extra: record.extra, giro: record.giro ?? null, dias: prazo.dias, situacao: prazo.chave,
      file_name: "dry-run", kind: "outro", natureza: record.extra.Natureza ?? "snapshot",
      reference_date: snapshot.referenceDate, imported_at: snapshot.capturedAt,
    };
  });
  (globalThis as Record<string, unknown>).__ATAS_STORE__ = { snapshots: [snapshot, ...(previousSnapshot ? [previousSnapshot] : [])], rows, datasets: [] };
  const { getStaticDashboardData, getStaticBaseSummary } = await import("@/lib/static-dashboard");
  const dashboard = await getStaticDashboardData();
  const summary = await getStaticBaseSummary();
  assert(summary.processCount === result.records.length, "contagem global do Panorama");
  assert(dashboard.kpis.concluidosAtas === snapshot.kpis.concluidasAtas, "card de concluídas no Panorama");
  assert(dashboard.kpis.andamentoAtas === snapshot.kpis.andamentoAtas, "card de andamento no Panorama");
  assert(dashboard.atasConcluidas.totalFinalizadas === finalizadas, "lista de finalizadas no Panorama");
  if (previousSnapshot) {
    const previousKeys = new Set(previousSnapshot.atasConcluidas.map((ata) => ata.key));
    const expectedNew = snapshot.atasConcluidas.filter((ata) => !previousKeys.has(ata.key));
    assert(dashboard.previousSnapshot?.referenceDate === previousSnapshot.referenceDate, "referência anterior no histórico");
    assert(dashboard.atasConcluidas.comparadoComReferencia === previousSnapshot.referenceDate, "comparação com a importação anterior");
    assert(new Set(dashboard.atasConcluidas.novas.map((ata) => ata.key)).size === expectedNew.length
      && dashboard.atasConcluidas.novas.every((ata) => !previousKeys.has(ata.key))
      && expectedNew.every((ata) => dashboard.atasConcluidas.novas.some((current) => current.key === ata.key)), "delta exato de finalizadas entre as duas referências");
    console.log(`Histórico integrado: ${previousSnapshot.referenceDate} → ${snapshot.referenceDate} | ${expectedNew.length} nova(s) finalizada(s)`);
  }

  const executive = normalizeExecutiveProcesses(rows);
  const apply = (patch: Partial<typeof EMPTY_EXECUTIVE_FILTERS>) => {
    const current = { ...EMPTY_EXECUTIVE_FILTERS, ...patch };
    const filtered = filterExecutiveProcesses(executive, current);
    return { filtered, summary: summarizeExecutiveProcesses(filtered, current) };
  };
  const concluidas = apply({ carteira: "concluidas" });
  const aVencer = apply({ carteira: "a_vencer" });
  const vencidas = apply({ carteira: "vencidas" });
  const andamentoProc = apply({ natureza: "Atas em Andamento" });
  const comSaldo = apply({ carteira: "concluidas", saldo: "com_saldo" });
  const semSaldo = apply({ carteira: "concluidas", saldo: "com_esgotados" });
  assert(concluidas.summary.processos === snapshot.kpis.concluidasAtas && concluidas.summary.itens === snapshot.kpis.concluidasItens, "drill-through do card Concluídas");
  assert(aVencer.summary.processos === snapshot.kpis.aVencerAtas && aVencer.summary.itens === snapshot.kpis.aVencerItens, "drill-through do card A Vencer");
  assert(vencidas.summary.processos === snapshot.kpis.vencidasAtas && vencidas.summary.itens === snapshot.kpis.vencidasItens, "drill-through do card Vencidas");
  assert(andamentoProc.summary.processos === snapshot.kpis.andamentoAtas && andamentoProc.summary.itens === snapshot.kpis.andamentoItens, "drill-through do card Andamento");
  assert(comSaldo.summary.itens === snapshot.kpis.saldoItens, "drill-through do card Itens com Saldo");
  assert(semSaldo.summary.itens === snapshot.kpis.consumidoItens, "drill-through do card Itens sem Saldo");
  for (const area of areas) {
    const areaLabel = area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX";
    const expected = snapshot.evolucao[area];
    const areaConcluidas = apply({ area: areaLabel, carteira: "concluidas" }).summary;
    const areaAndamento = apply({ area: areaLabel, natureza: "Atas em Andamento" }).summary;
    const areaComSaldo = apply({ area: areaLabel, carteira: "concluidas", saldo: "com_saldo" }).summary;
    const areaSemSaldo = apply({ area: areaLabel, carteira: "concluidas", saldo: "com_esgotados" }).summary;
    const areaVencidas = apply({ area: areaLabel, carteira: "vencidas" }).summary;
    const areaAVencer = apply({ area: areaLabel, carteira: "a_vencer" }).summary;
    assert(areaConcluidas.processos === expected.concluidasAtas && areaConcluidas.itens === expected.concluidasItens, `card Concluídas — ${area}`);
    assert(areaAndamento.processos === expected.andamentoAtas && areaAndamento.itens === expected.andamentoItens, `card Andamento — ${area}`);
    assert(areaComSaldo.itens === expected.saldoItens && areaSemSaldo.itens === expected.semSaldoItens, `cards de saldo — ${area}`);
    assert(areaVencidas.processos === expected.vencidasAtas && areaVencidas.itens === expected.vencidasItens, `card Vencidas — ${area}`);
    assert(areaAVencer.processos === expected.aVencerAtas && areaAVencer.itens === expected.aVencerItens, `card A Vencer — ${area}`);
  }
  const cardUrl = new URL(panoramaCardHref("saldo", "DIRETOS"), "https://local.invalid");
  assert(cardUrl.searchParams.get("area") === "Diretos" && cardUrl.searchParams.get("carteira") === "concluidas" && cardUrl.searchParams.get("saldo") === "com_saldo", "URL do card preserva área e recorte");
  const saving = apply({ saving: "com" }).filtered;
  assert(saving.length > 0 && saving.every((row) => row.savingMapeado > 0), "recorte de saving mapeado");
  const semContrato = apply({ alerta: "sem_contrato" }).filtered.length;
  assert(semContrato === result.issues.filter((issue) => issue.column === "N° CONTRATO").length, "alerta de finalizados sem contrato SAP");
  const cwSample = executive.find((row) => row.cw.length > 0)?.cw[0];
  if (cwSample) assert(apply({ q: cwSample }).filtered.length > 0, "pesquisa por CW");
  const relatedSample = executive.find((row) => Boolean(row.ariba));
  if (relatedSample) {
    const related = apply({ q: relatedProcessQuery(relatedSample) }).filtered;
    assert(related.length > 0 && related.some((row) => row.id === relatedSample.id), "filtro de processo e vínculos");
  }
  const monthSample = snapshot.previsaoMeses.INDIRETOS.rows.find((row) => row.month !== null && row.year !== null);
  if (monthSample) {
    const key = `${monthSample.year}-${String(monthSample.month).padStart(2, "0")}`;
    const expected = sum(areas.map((area) => sum(snapshot.previsaoMeses[area].rows.filter((row) => row.month === monthSample.month && row.year === monthSample.year).map((row) => row.atas))));
    assert(apply({ mes: key }).summary.processos === expected, `filtro de previsão mensal ${key}`);
  }
  console.log(`Panorama integrado: ${summary.processCount} registros | ${dashboard.atasConcluidas.totalFinalizadas} finalizadas na base atual`);
  console.log(`Drill-through: concluídas ${concluidas.summary.processos}/${concluidas.summary.itens} | andamento ${andamentoProc.summary.processos}/${andamentoProc.summary.itens} | saldo ${comSaldo.summary.itens} | sem saldo ${semSaldo.summary.itens} | vencidas ${vencidas.summary.processos}/${vencidas.summary.itens} | a vencer ${aVencer.summary.processos}/${aVencer.summary.itens}`);
}
