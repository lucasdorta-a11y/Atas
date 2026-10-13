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
  return row.findIndex((value) => normalized.includes(exact(value)));
}

function extractSaving(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  const required = ["VALOR CONTRATADO R$", "SAVING HISTÓRICO R$"];
  for (const sheet of sheets) {
    const headerRows = findHeaderRows(sheet.matrix, (row) => {
      const values = row.map(exact);
      return required.every((item) => values.includes(exact(item))) && values.some((item) => item.includes("REDUCAO"));
    });
    for (const headerRow of headerRows) {
      const headers = sheet.matrix[headerRow] ?? [];
      const contractedCol = headerValueIndex(headers, ["VALOR CONTRATADO R$"]);
      const historicCol = headerValueIndex(headers, ["SAVING HISTÓRICO R$"]);
      const proposalCol = headerValueIndex(headers, ["SAVING PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA R$"]);
      const reductionHistoricCol = headerValueIndex(headers, ["REDUÇÃO HISTÓRICO %"]);
      const reductionProposalCol = headerValueIndex(headers, ["REDUÇÃO PROPOSTA INICIAL %", "REDUÇÃO SOB PROPOSTA INICIAL %"]);
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 12); r += 1) {
        const row = sheet.matrix[r] ?? [];
        const area = isArea(row[0]) ?? row.map(isArea).find(Boolean) ?? null;
        const totalRow = exact(row[0]).startsWith("TOTAL");
        if (!area && !totalRow) {
          if (isBlank(row)) break;
          continue;
        }
        const target = area ? payload.valueAreas[area] : payload.savingTotal;
        const contracted = contractedCol >= 0 ? metricAt(row, contractedCol, numberValue) : null;
        target.valorSaving = contracted;
        if (target.valor === null && contracted !== null) target.valor = contracted;
        target.savingHist = historicCol >= 0 ? metricAt(row, historicCol, numberValue) : null;
        target.savingProp = proposalCol >= 0 ? metricAt(row, proposalCol, numberValue) : null;
        target.reducaoHistPct = reductionHistoricCol >= 0 ? metricAt(row, reductionHistoricCol, percentValue) : null;
        target.reducaoPropPct = reductionProposalCol >= 0 ? metricAt(row, reductionProposalCol, percentValue) : null;
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
  let found = false;
  const generalCandidates: SnapshotSupplierGeneral[] = [];

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
    return /^(ATA |ATAS |ITEM |VENCIDAS|A VENCER|EVOLU|PREVISAO|ROTULOS|RÓTULOS)/.test(value);
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
        const titleContext = previousContext(sheet.matrix, headerRow, 10);
        const isGeneral = titleContext.some((value) => value.includes("FORNECEDORES GERAL"));
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
          if (qtdAtas === null && qtdItens === null && !analise) continue;
          if (isGeneral) {
            items.push({ area: "GERAL", fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          } else if (area) {
            items.push({ area, fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          }
        }

        if (items.length === 0) continue;
        found = true;
        if (isGeneral) {
          generalCandidates.push(...(items as SnapshotSupplierGeneral[]));
        } else if (area) {
          payload.fornecedores[area] = [...payload.fornecedores[area], ...(items as SnapshotSupplier[])];
        }
      }
    }
  }

  // “FORNECEDORES GERAL” é a única tabela exibida no panorama. Preserve a
  // ordem original e force o contrato visual: exatamente Top 4, OUTROS e TOTAL.
  if (generalCandidates.length > 0) {
    const deduped: SnapshotSupplierGeneral[] = [];
    const seen = new Set<string>();
    for (const item of generalCandidates) {
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
    addFound(payload, "fornecedores");
  } else if (found) {
    addFound(payload, "fornecedores");
  }
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

  function numericNear(matrix: unknown[][], row: number, column: number): number | null {
    const direct = integerValue(matrix[row]?.[column]);
    if (direct !== null) return direct;
    // Algumas planilhas deixam a etiqueta na primeira coluna e deslocam o
    // valor para a célula seguinte; a posição da área continua sendo a âncora.
    for (let c = column + 1; c < Math.min((matrix[row] ?? []).length, column + 3); c += 1) {
      const value = integerValue(matrix[row]?.[c]);
      if (value !== null) return value;
    }
    return null;
  }

  function verticalPair(matrix: unknown[][], headerRow: number, column: number): { atas: number | null; itens: number | null } {
    let atas: number | null = null;
    let itens: number | null = null;
    const end = Math.min(matrix.length, headerRow + 10);
    for (let r = headerRow + 1; r < end; r += 1) {
      const label = exact(matrix[r]?.[column]);
      if (label === "QTD ATA" || label === "QTD ATAS") {
        atas = numericNear(matrix, r + 1, column) ?? atas;
      }
      if (label === "QTD ITEM" || label === "QTD ITENS") {
        itens = numericNear(matrix, r + 1, column) ?? itens;
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
    for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 4); r += 1) {
      const row = matrix[r] ?? [];
      const atas = atasCol >= 0 ? integerValue(row[atasCol]) : null;
      const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
      if (atas !== null || itens !== null) return { atas, itens };
      // Wide exports sometimes have no QTD labels in the same row; the two
      // cells immediately following the area title are then the pair.
      const positionalAtas = integerValue(row[column + 1]);
      const positionalItens = integerValue(row[column + 2]);
      if (positionalAtas !== null || positionalItens !== null) return { atas: positionalAtas, itens: positionalItens };
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
      for (const [kind, columns] of areaColumnsByKind) {
        for (let index = 0; index < columns.length; index += 1) {
          const item = columns[index];
          const nextColumn = columns[index + 1]?.column ?? -1;
          const vertical = verticalPair(matrix, headerRow, item.column);
          const wide = widePair(matrix, headerRow, item.column, nextColumn);
          const atas = vertical.atas ?? wide.atas;
          const itens = vertical.itens ?? wide.itens;
          if (atas !== null || itens !== null) {
            setEvolutionPair(payload.evolucao[item.area], kind, atas, itens);
            found = true;
          }
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
  if (found) addFound(payload, "evolucao");
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
          for (const item of areaColumns) {
            // Em um pivot do Excel o nome da área fica na primeira coluna do
            // grupo e QTD ATAS/QTD ITENS ocupam essa coluna e a seguinte.
            // Se o título mesclado estiver deslocado, o cabeçalho de quantidade
            // fornece a posição correta.
            let atasCol = item.column;
            let itensCol = item.column + 1;
            const nextArea = areaColumns.find((candidate) => candidate.column > item.column)?.column ?? row.length;
            const areaHeaderPos = item.column;
            for (let c = areaHeaderPos; c < Math.min(nextArea, labelHeader.length); c += 1) {
              if (exact(labelHeader[c]) === "QTD ATAS") {
                atasCol = c;
                itensCol = c + 1;
                break;
              }
            }
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
  extractForecastBandTable(payload, sheets);
  extractForecastRows(payload, sheets);

  const allKnown = [
    "kpis-leitura",
    "valores-por-area",
    "saving",
    "top-compradores",
    "fornecedores",
    "evolucao",
    "previsao-faixas",
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
  payload.coverage.missing = ["valores-por-area", "saving", "top-compradores", "fornecedores", "evolucao", "previsao-faixas", "previsoes-cruzadas"];
  payload.notes.push("Referência inicial fixa apenas para a comparação dos três gráficos; será substituída pelo snapshot imediatamente anterior após novas importações.");
  return payload;
}
