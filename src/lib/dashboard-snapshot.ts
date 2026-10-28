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

/** Blocos reconhecidos no snapshot e seus nomes exibidos quando uma fonte não os traz. */
export const SNAPSHOT_BLOCK_KEYS = [
  "kpis-leitura",
  "valores-por-area",
  "saving",
  "top-compradores",
  "fornecedores",
  "evolucao",
  "previsao-faixas",
  "previsao-meses",
  "previsoes-cruzadas",
  "atas-concluidas",
  "contratos-fornecedores",
  "status-atas",
] as const;
export type SnapshotBlockKey = (typeof SNAPSHOT_BLOCK_KEYS)[number];

export const SNAPSHOT_BLOCKS: Record<SnapshotBlockKey, { label: string; esperado: string }> = {
  "kpis-leitura": { label: "Leitura dos gráficos", esperado: "tabela LEITURA DOS GRÁFICOS com Gráfico, Situação apresentada, ATAS e ITENS" },
  "valores-por-area": { label: "Valor contratado por área", esperado: "VALOR DIRETOS, VALOR INDIRETOS e VALOR CAPEX" },
  saving: { label: "Saving por área", esperado: "bloco Saving com os valores contratados, saving e percentuais" },
  "top-compradores": { label: "Top compradores por área", esperado: "blocos TOP COMP por área" },
  fornecedores: { label: "Representatividade de fornecedores", esperado: "tabela FORNECEDORES GERAL" },
  evolucao: { label: "Evolução por área", esperado: "evolução por status atual e tabela EM ANDAMENTO" },
  "previsao-faixas": { label: "Previsão de conclusão por faixa", esperado: "faixas até 15, 30, 60 e vencidas; a faixa acima de 60 dias é lida e calculada, mas não exibida" },
  "previsao-meses": { label: "Previsão de conclusão por mês", esperado: "pivô PREVISÃO DE CONCLUSÃO POR MÊS" },
  "previsoes-cruzadas": { label: "Previsões por comprador", esperado: "COMPRADOR, AREA e PRAZO CONCLUSÃO" },
  "atas-concluidas": {
    label: "Atas concluídas (base de andamento)",
    esperado: "aba Base - Atas Em andamento com as colunas DESCRIÇÃO DOS LOTES ATAS, QTD ITENS, COMPRADOR, AREA, ETAPA ATUAL e N° CONTRATO",
  },
  "contratos-fornecedores": {
    label: "Fornecedor por contrato",
    esperado: "aba Base - Controle de Contratos com as colunas Contrato, Item (ou Material) e Fornecedor",
  },
  "status-atas": {
    label: "Status das atas por área",
    esperado: "aba de status/renovações com uma faixa por área (INDIRETOS, DIRETOS, CAPEX), quadros TOTAL A RENOVAR/VENCIDAS/ATÉ 15 DIAS/EM ANDAMENTO ou TOTAL/VIGENTES/VENCIDAS, tabela CONTRATO SAP | VENCIMENTO | COMPRADOR(A) | SITUAÇÃO e, quando disponível, faixa RENOVAÇÃO EM ANDAMENTO",
  },
};

export function snapshotBlockLabel(key: string): string {
  return (SNAPSHOT_BLOCKS as Record<string, { label: string }>)[key]?.label ?? key;
}

export interface SnapshotKpis {
  concluidasAtas: number | null;
  concluidasItens: number | null;
  /** Card “ATAS EM ANDAMENTO (GERAL)”; soma das áreas quando o card não existe. */
  andamentoAtas: number | null;
  andamentoItens: number | null;
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
  /** Pode ser nulo quando a aba traz apenas a lista de nomes, sem rateio individual. */
  atas: number | null;
  itens: number | null;
  prazoConclusao: string | null;
}

export interface SnapshotForecastArea {
  atas: number | null;
  itens: number | null;
  buyers: SnapshotForecastBuyer[];
}

/** Uma linha do pivô “PREVISÃO DE CONCLUSÃO POR MÊS”. */
export interface SnapshotMonthlyForecastRow {
  label: string;
  month: number | null;
  year: number | null;
  atas: number | null;
  itens: number | null;
}

export interface SnapshotMonthlyForecastArea {
  rows: SnapshotMonthlyForecastRow[];
}

/** Uma ata da aba “Base - Atas Em andamento” cuja ETAPA ATUAL é FINALIZADO. */
export interface SnapshotAtaConcluida {
  /** Número do contrato (só dígitos) ou descrição|comprador|área quando não houver contrato. */
  key: string;
  descricao: string;
  contrato: string | null;
  fornecedor: string | null;
  itens: number | null;
  comprador: string | null;
  area: SnapshotArea | null;
  etapa: string;
  valor: number | null;
}

export interface SnapshotStatusPrioridade {
  contrato: string;
  vencimento: string | null;
  comprador: string | null;
  situacao: string | null;
}

export interface SnapshotStatusCarteira {
  comprador: string;
  vigentes: number | null;
  vencidas: number | null;
  aRenovar: number | null;
  total: number | null;
}

/** Bloco “Status das Atas” de uma área, na aba dedicada da planilha. */
export type SnapshotStatusLayout = "atas" | "renovacoes";

export interface SnapshotStatusRenovacao {
  contrato: string | null;
  comprador: string | null;
  vencimento: string | null;
  texto: string;
}

/** Bloco “Status das Atas” de uma área, na aba dedicada da planilha. */
export interface SnapshotStatusAtasArea {
  area: SnapshotArea;
  layout: SnapshotStatusLayout;
  baseDate: string | null;
  titulo: string | null;
  subtitulo: string | null;
  /** Quadro TOTAL no layout da carteira de atas. */
  total: number | null;
  vigentes: number | null;
  vencidas: number | null;
  ate15: number | null;
  de16a30: number | null;
  aRenovar: number | null;
  /** Quadro TOTAL A RENOVAR no layout novo do SharePoint. */
  totalRenovar: number | null;
  /** Quadro EM ANDAMENTO no layout novo do SharePoint. */
  emAndamento: number | null;
  prioridades: SnapshotStatusPrioridade[];
  carteira: SnapshotStatusCarteira[];
  /** Faixa “RENOVAÇÃO EM ANDAMENTO” exibida abaixo da tabela de prioridades. */
  renovacaoEmAndamento: SnapshotStatusRenovacao | null;
  notas: string[];
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
  previsaoMeses: Record<SnapshotArea, SnapshotMonthlyForecastArea>;
  /** Atas FINALIZADO na base de andamento; a comparação acontece no painel. */
  atasConcluidas: SnapshotAtaConcluida[];
  /** Contrato (só dígitos) → fornecedor da aba de controle de contratos. */
  fornecedoresPorContrato: Record<string, string>;
  statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
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
    andamentoAtas: null,
    andamentoItens: null,
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

function makeMonthlyForecastRecord(): Record<SnapshotArea, SnapshotMonthlyForecastArea> {
  return makeAreaRecord(() => ({ rows: [] }));
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
    previsaoMeses: makeMonthlyForecastRecord(),
    atasConcluidas: [],
    fornecedoresPorContrato: {},
    statusAtas: makeAreaRecord(() => null),
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
  return String(value).replace(/^\uFEFF/, "").replace(/\u00a0/g, " ").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
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

function giroSheets(sheets: SnapshotSourceSheet[], number: number, label: string): SnapshotSourceSheet[] {
  const expectedNumber = String(number).padStart(2, "0");
  const expectedLabel = exact(label);
  return sheets.filter((sheet) => {
    const source = exact(`${sheet.fileName} ${sheet.sheetName}`);
    return source.includes(`GIRO ${expectedNumber}`) && source.includes(expectedLabel);
  });
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

/**
 * Lê o resumo visual da aba CONTROLE ATAS CONCLUÍDAS. Essa versão da
 * planilha não possui necessariamente a tabela "LEITURA DOS GRÁFICOS": os
 * números aparecem em cartões com o rótulo em uma linha e os valores
 * calculados pelas fórmulas algumas linhas abaixo.
 */
function extractSummaryCards(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type CardKind = "concluidas" | "andamento" | "saldo" | "semSaldo" | "vencidas" | "aVencer";
  let found = false;
  const bestDistance: Record<CardKind, number> = {
    concluidas: Number.POSITIVE_INFINITY,
    andamento: Number.POSITIVE_INFINITY,
    saldo: Number.POSITIVE_INFINITY,
    semSaldo: Number.POSITIVE_INFINITY,
    vencidas: Number.POSITIVE_INFINITY,
    aVencer: Number.POSITIVE_INFINITY,
  };

  const cardKind = (value: unknown): CardKind | null => {
    const label = exact(value).replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    if (!label) return null;
    if (label.includes("ATA CONCLUIDAS") && label.includes("VALID")) return "concluidas";
    if (label.includes("ATAS EM ANDAMENTO")) return "andamento";
    if (label.includes("ITENS SEM SALDO")) return "semSaldo";
    if (label.includes("ITENS COM SALDO")) return "saldo";
    if ((label === "ATAS VENCIDAS" || label.startsWith("ATAS VENCIDAS ")) && !label.includes("E A VENCER")) return "vencidas";
    if (label === "ATAS A VENCER" || label.startsWith("ATAS A VENCER ")) return "aVencer";
    return null;
  };

  const setCard = (kind: CardKind, values: number[]) => {
    if (kind === "concluidas") {
      if (values[0] !== undefined) payload.kpis.concluidasAtas = values[0];
      if (values[1] !== undefined) payload.kpis.concluidasItens = values[1];
    } else if (kind === "andamento") {
      if (values[0] !== undefined) payload.kpis.andamentoAtas = values[0];
      if (values[1] !== undefined) payload.kpis.andamentoItens = values[1];
    } else if (kind === "saldo") {
      if (values[0] !== undefined) payload.kpis.saldoItens = values[0];
    } else if (kind === "semSaldo") {
      if (values[0] !== undefined) payload.kpis.consumidoItens = values[0];
    } else if (kind === "vencidas") {
      if (values[0] !== undefined) payload.kpis.vencidasAtas = values[0];
      if (values[1] !== undefined) payload.kpis.vencidasItens = values[1];
    } else {
      if (values[0] !== undefined) payload.kpis.aVencerAtas = values[0];
      if (values[1] !== undefined) payload.kpis.aVencerItens = values[1];
    }
  };

  const preferredSheets = giroSheets(sheets, 1, "PANORAMA");
  const sourceSheets = preferredSheets.length ? preferredSheets : sheets;
  for (const sheet of sourceSheets) {
    const matrix = sheet.matrix;
    const currentMarker = preferredSheets.length
      ? matrix.findIndex((row) => row.some((value) => exact(value).includes("STATUS ATUAL")))
      : -1;
    const firstRow = currentMarker >= 0 ? currentMarker : 0;
    for (let r = firstRow; r < matrix.length; r += 1) {
      const row = matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const kind = cardKind(row[c]);
        if (!kind) continue;

        // Não atravessa para o próximo cartão quando vários títulos estão na
        // mesma linha. O limite maior cobre células mescladas do cartão atual.
        let columnEnd = Math.min(row.length - 1, c + 8);
        for (let next = c + 1; next <= columnEnd; next += 1) {
          if (cardKind(row[next])) {
            columnEnd = next - 1;
            break;
          }
        }

        const values: number[] = [];
        const targetCount = kind === "saldo" || kind === "semSaldo" ? 1 : 2;
        let nearestDistance = Number.POSITIVE_INFINITY;
        const addValue = (value: number | null, distance: number) => {
          if (value !== null && values.length < targetCount) {
            values.push(value);
            nearestDistance = Math.min(nearestDistance, distance);
          }
        };

        // Também aceita uma célula composta, por exemplo “60 ATAS / 793
        // ITENS”, caso a exportação elimine as células mescladas.
        for (let offset = 0; offset <= 2; offset += 1) {
          const candidate = matrix[r + offset]?.[c];
          const pair = evolutionPairFromCell(candidate);
          if (pair.atas !== null) addValue(pair.atas, offset);
          if (pair.itens !== null) addValue(pair.itens, offset);
        }

        // No layout mostrado, os valores ficam alguns níveis abaixo do título
        // e podem estar em qualquer célula do cartão. O limite de seis linhas
        // evita capturar os números dos gráficos que começam logo depois.
        for (let rr = r; rr <= Math.min(matrix.length - 1, r + 6) && values.length < targetCount; rr += 1) {
          for (let cc = c; cc <= columnEnd && values.length < targetCount; cc += 1) {
            const cell = matrix[rr]?.[cc];
            const text = cellText(cell);
            if (!text) continue;
            const pair = evolutionPairFromCell(cell);
            if (pair.atas !== null) addValue(pair.atas, rr - r);
            if (pair.itens !== null) addValue(pair.itens, rr - r);
            if (pair.atas === null && pair.itens === null) addValue(integerValue(cell), rr - r);
          }
        }

        if (values.length > 0 && nearestDistance <= bestDistance[kind]) {
          setCard(kind, values);
          bestDistance[kind] = nearestDistance;
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
  const exactIndex = row.findIndex((value) => normalized.includes(exact(value)));
  if (exactIndex >= 0) return exactIndex;
  // Tabelas dinâmicas do Excel às vezes acrescentam “/ %”, quebras de linha,
  // unidades ou uma coluna duplicada ao título. O nome base continua sendo
  // suficiente para identificar a métrica.
  return row.findIndex((value) => normalized.some((alias) => {
    const current = exact(value);
    return current.includes(alias) || alias.includes(current);
  }));
}

function savingNumber(value: unknown): number | null {
  const direct = numberValue(value);
  if (direct !== null) return direct;
  const text = cellText(value);
  const match = text.match(/-?\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|-?\d+(?:[.,]\d+)?/);
  return match ? numberValue(match[0]) : null;
}

function savingPercent(value: unknown): number | null {
  const direct = percentValue(value);
  if (direct !== null) return direct;
  const text = cellText(value);
  const match = text.match(/(-?\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return null;
  return percentValue(`${match[1]}%`);
}

function extractSaving(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const headerRows = findHeaderRows(sheet.matrix, (row) => {
      const values = row.map(exact);
      const hasContracted = values.some((value) => value.includes("VALOR CONTRATADO"));
      const savingCount = values.filter((value) => value.includes("SAVING")).length;
      const hasReduction = values.some((value) => value.includes("REDUCAO"));
      // Aceita tanto cinco colunas separadas quanto títulos combinados como
      // “SAVING HISTÓRICO R$ / %”.
      return hasContracted && savingCount >= 1 && (hasReduction || savingCount >= 2);
    });
    for (const headerRow of headerRows) {
      const headers = sheet.matrix[headerRow] ?? [];
      const contractedCol = headerValueIndex(headers, ["VALOR CONTRATADO R$"]);
      const historicCol = headerValueIndex(headers, ["SAVING HISTÓRICO R$", "SAVING HISTORICO"]);
      const proposalCol = headerValueIndex(headers, ["SAVING PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA INICIAL R$", "SAVING SOB PROPOSTA R$", "SAVING PROPOSTA"]);
      const reductionHistoricCol = headerValueIndex(headers, ["REDUÇÃO HISTÓRICO %", "REDUCAO HISTORICO", "REDUÇÃO HISTÓRICO"]);
      const reductionProposalCol = headerValueIndex(headers, ["REDUÇÃO PROPOSTA INICIAL %", "REDUCAO PROPOSTA INICIAL", "REDUÇÃO SOB PROPOSTA INICIAL", "REDUCAO PROPOSTA"]);
      if (contractedCol < 0) continue;
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 16); r += 1) {
        const row = sheet.matrix[r] ?? [];
        const area = row.map(isArea).find(Boolean) ?? null;
        const totalRow = row.some((value) => exact(value) === "TOTAL" || exact(value).startsWith("TOTAL GERAL"));
        if (!area && !totalRow) {
          if (isBlank(row)) break;
          continue;
        }
        const target = area ? payload.valueAreas[area] : payload.savingTotal;
        const contracted = savingNumber(row[contractedCol]);
        target.valorSaving = contracted;
        if (target.valor === null && contracted !== null) target.valor = contracted;
        target.savingHist = historicCol >= 0 ? savingNumber(row[historicCol]) : null;
        target.savingProp = proposalCol >= 0 ? savingNumber(row[proposalCol]) : null;
        target.reducaoHistPct = (reductionHistoricCol >= 0 ? savingPercent(row[reductionHistoricCol]) : null)
          ?? (historicCol >= 0 ? savingPercent(row[historicCol]) : null);
        target.reducaoPropPct = (reductionProposalCol >= 0 ? savingPercent(row[reductionProposalCol]) : null)
          ?? (proposalCol >= 0 ? savingPercent(row[proposalCol]) : null);
        found = true;
        // O primeiro TOTAL encerra o bloco Saving; não atravessar tabelas
        // posteriores que também possam conter uma linha TOTAL.
        if (totalRow) break;
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
  type GeneralBlock = {
    items: SnapshotSupplierGeneral[];
    totalAtas: number | null;
    totalItens: number | null;
  };
  const generalBlocks: GeneralBlock[] = [];

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
    return /^(ATA |ATAS |ITEM |VENCIDAS|A VENCER|EVOLU|PREVISAO|ROTULOS|RÓTULOS|CRITERIO|CRITÉRIO|ATUALIZACAO|ATUALIZAÇÃO|FORNECEDORES)/.test(value);
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
        const titleContext = previousContext(sheet.matrix, headerRow, 24);
        const isGeneral = titleContext.some((value) => value.includes("FORNECEDORES GERAL"))
          || header.some((value) => exact(value).includes("FORNECEDORES GERAL"));
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
          const analiseNormalized = exact(analise);
          const validAnalysis = !analiseNormalized
            || ["ALTA CONCENTRACAO", "VOLUME MEDIO", "PULVERIZADO"].includes(analiseNormalized);
          // Linhas de outros pivôs que vazam para o cabeçalho de fornecedores
          // têm ANÁLISE = QTD ATA ou um número. Elas não pertencem ao bloco.
          if (!validAnalysis || /^\d+(?:[.,]\d+)?$/.test(analiseNormalized) || analiseNormalized === "QTD ATA" || analiseNormalized === "QTD ITENS") continue;
          if (supplier.length > 120) continue;
          if (qtdAtas === null && qtdItens === null && !analise) continue;
          if (isGeneral) {
            items.push({ area: "GERAL", fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          } else if (area) {
            items.push({ area, fornecedor: supplier, qtdAtas, qtdItens, concentracaoPct: concentration, analise });
          }
          // O primeiro TOTAL encerra a seção. Nunca atravessar para outro
          // bloco da mesma aba, mesmo que ele tenha o mesmo cabeçalho.
          if (supplierNormalized === "TOTAL" || supplierNormalized === "TOTAL GERAL") break;
        }

        if (items.length === 0) continue;
        if (isGeneral) {
          const generalItems = items as SnapshotSupplierGeneral[];
          const total = generalItems.find((item) => {
            const label = exact(item.fornecedor);
            return label === "TOTAL" || label === "TOTAL GERAL";
          });
          generalBlocks.push({
            items: generalItems,
            totalAtas: total?.qtdAtas ?? null,
            totalItens: total?.qtdItens ?? null,
          });
        } else if (area) {
          payload.fornecedores[area] = [...payload.fornecedores[area], ...(items as SnapshotSupplier[])];
        }
      }
    }
  }

  // Pode existir mais de uma tabela com o mesmo cabeçalho em arquivos/abas
  // diferentes. A tabela geral correta é a que fecha com a leitura principal
  // do painel; na ausência desse KPI, preferimos o bloco mais completo (maior
  // TOTAL de itens). Assim um quadro parcial/antigo não substitui a tabela
  // “FORNECEDORES GERAL” da base ativa.
  if (generalBlocks.length > 0) {
    const expectedAtas = payload.kpis.concluidasAtas;
    const expectedItens = payload.kpis.concluidasItens;
    const score = (block: GeneralBlock) => {
      const hasTotal = block.totalAtas !== null || block.totalItens !== null;
      const hasOthers = block.items.some((item) => exact(item.fornecedor) === "OUTROS FORNECEDORES");
      return (hasTotal ? 100 : 0)
        + (hasOthers ? 50 : 0)
        + (expectedAtas !== null && block.totalAtas === expectedAtas ? 100000 : 0)
        + (expectedItens !== null && block.totalItens === expectedItens ? 100000 : 0)
        + (block.totalItens ?? 0)
        + (block.totalAtas ?? 0)
        + block.items.length;
    };
    const selected = [...generalBlocks].sort((a, b) => score(b) - score(a))[0];
    const deduped: SnapshotSupplierGeneral[] = [];
    const seen = new Set<string>();
    for (const item of selected.items) {
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
    if (payload.fornecedoresGeral.length > 0) addFound(payload, "fornecedores");
  }
  // Sem uma tabela nomeada FORNECEDORES GERAL, não sinalizar o bloco como
  // reconhecido: os quadros por área não atendem ao contrato visual do painel.
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
  let bestConcludedScore = -1;
  let bestConcluded: Record<SnapshotArea, { atas: number | null; itens: number | null }> | null = null;

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

  function numericAt(matrix: unknown[][], row: number, column: number): number | null {
    // A posição de cada área é significativa na estrutura vertical. Não
    // procurar números em colunas vizinhas: isso desloca CAPEX/DIRETOS e pode
    // transformar o TOTAL de uma área em valor de todas as áreas.
    return integerValue(matrix[row]?.[column]);
  }

  function verticalPair(matrix: unknown[][], headerRow: number, column: number): { atas: number | null; itens: number | null } {
    let atas: number | null = null;
    let itens: number | null = null;
    const end = Math.min(matrix.length, headerRow + 8);
    for (let r = headerRow + 1; r < end; r += 1) {
      const label = exact(matrix[r]?.[column]);
      if (label === "QTD ATA" || label === "QTD ATAS") {
        atas = numericAt(matrix, r + 1, column) ?? atas;
      }
      if (label === "QTD ITEM" || label === "QTD ITENS") {
        itens = numericAt(matrix, r + 1, column) ?? itens;
      }
      // O quadro termina quando as duas métricas foram lidas ou numa linha em
      // branco depois de já encontrar a primeira; sem isso a janela alcançaria
      // uma tabela seguinte e trocaria o valor lido.
      if (atas !== null && itens !== null) break;
      if ((atas !== null || itens !== null) && isBlank(matrix[r])) break;
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
    // Só usar o caminho wide quando o próprio cabeçalho declara as métricas.
    // Sem isso, linhas de uma tabela seguinte não podem preencher o bloco.
    if (atasCol < 0 && itensCol < 0) return { atas: null, itens: null };
    for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 4); r += 1) {
      const row = matrix[r] ?? [];
      const atas = atasCol >= 0 ? integerValue(row[atasCol]) : null;
      const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
      if (atas !== null || itens !== null) return { atas, itens };
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
      const concludedCandidate: Record<SnapshotArea, { atas: number | null; itens: number | null }> = {
        INDIRETOS: { atas: null, itens: null },
        DIRETOS: { atas: null, itens: null },
        CAPEX: { atas: null, itens: null },
      };
      let concludedCount = 0;
      for (const [kind, columns] of areaColumnsByKind) {
        for (let index = 0; index < columns.length; index += 1) {
          const item = columns[index];
          const nextColumn = columns[index + 1]?.column ?? -1;
          const vertical = verticalPair(matrix, headerRow, item.column);
          const wide = widePair(matrix, headerRow, item.column, nextColumn);
          const atas = vertical.atas ?? wide.atas;
          const itens = vertical.itens ?? wide.itens;
          if (kind === "concluidas") {
            concludedCandidate[item.area] = { atas, itens };
            if (atas !== null || itens !== null) concludedCount += 1;
          } else if (atas !== null || itens !== null) {
            // Vencidas e a vencer têm cabeçalhos próprios; não podem sobrescrever
            // a coluna de concluídas nem ser confundidas com andamento.
            setEvolutionPair(payload.evolucao[item.area], kind, atas, itens);
            found = true;
          }
        }
      }
      if (concludedCount > 0) {
        const context = previousContext(matrix, headerRow, 12);
        const contextScore = context.some((value) => value.includes("STATUS ATUAL") || value.includes("EVOLUCAO POR AREA"))
          ? 3
          : context.some((value) => value.includes("ANDAMENTO")) ? -3 : 0;
        const score = concludedCount * 10 + contextScore;
        if (score > bestConcludedScore) {
          bestConcludedScore = score;
          bestConcluded = concludedCandidate;
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
  if (bestConcluded) {
    for (const area of SNAPSHOT_AREAS) {
      setEvolutionPair(payload.evolucao[area], "concluidas", bestConcluded[area].atas, bestConcluded[area].itens);
    }
    found = true;
  }
  if (found) addFound(payload, "evolucao");
}

function evolutionPairFromCell(value: unknown): { atas: number | null; itens: number | null } {
  const text = cellText(value);
  if (!text) return { atas: null, itens: null };
  const atasMatch = text.match(/(-?\d[\d.\s]*(?:,\d+)?)\s*ATAS?/i);
  const itensMatch = text.match(/(-?\d[\d.\s]*(?:,\d+)?)\s*ITENS?/i);
  let atas = atasMatch ? integerValue(atasMatch[1]) : null;
  let itens = itensMatch ? integerValue(itensMatch[1]) : null;
  if (atas === null || itens === null) {
    const numbers = text.match(/-?\d[\d.\s]*(?:,\d+)?/g) ?? [];
    if (atas === null && numbers[0]) atas = integerValue(numbers[0]);
    if (itens === null && numbers[1]) itens = integerValue(numbers[1]);
  }
  return { atas, itens };
}

/**
 * Estrutura da tabela mostrada no Excel: uma linha por área e métricas em
 * células compostas, por exemplo “4 ATAS / 216 ITENS”. Ela não usa os títulos
 * horizontais “ATA CAPEX” da estrutura antiga, por isso é tratada
 * explicitamente antes de finalizar o snapshot.
 */
function extractEvolutionStatusTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type Candidate = Record<SnapshotArea, { atas: number | null; itens: number | null }>;
  let best: Candidate | null = null;
  let bestScore = -1;

  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const titleRows = findHeaderRows(matrix, (row) => row.some((value) => {
      const label = exact(value);
      return label.includes("EVOLUCAO POR AREA") && label.includes("STATUS ATUAL");
    }));
    for (const titleRow of titleRows) {
      let headerRow = -1;
      for (let rowIndex = titleRow + 1; rowIndex < Math.min(matrix.length, titleRow + 8); rowIndex += 1) {
        const values = matrix[rowIndex] ?? [];
        const labels = values.map(exact);
        const hasArea = labels.some((label) => label === "AREAS" || label === "AREA");
        const hasConcluded = labels.some((label) => label.includes("CONCLUID") && label.includes("ATAS"));
        const hasVencidas = labels.some((label) => label.includes("VENCIDAS"));
        const hasAVencer = labels.some((label) => label.includes("A VENCER"));
        if (hasArea && hasConcluded && hasVencidas && hasAVencer) {
          headerRow = rowIndex;
          break;
        }
      }
      if (headerRow < 0) continue;

      const header = matrix[headerRow] ?? [];
      const columnWith = (...parts: string[]) => header.findIndex((value) => {
        const label = exact(value);
        return parts.every((part) => label.includes(part));
      });
      const areaCol = header.findIndex((value) => {
        const label = exact(value);
        return label === "AREAS" || label === "AREA";
      });
      const concludedCol = columnWith("CONCLUID", "ATAS");
      const andamentoCol = columnWith("ANDAMENTO");
      const saldoCol = columnWith("ITENS COM", "SALDO");
      const semSaldoCol = columnWith("ITENS SEM", "SALDO");
      const vencidasCol = columnWith("VENCIDAS");
      const aVencerCol = columnWith("A VENCER");
      if (areaCol < 0 || concludedCol < 0) continue;

      const candidate: Candidate = makeAreaRecord(() => ({ atas: null, itens: null }));
      let score = 0;
      for (let rowIndex = headerRow + 1; rowIndex < Math.min(matrix.length, headerRow + 12); rowIndex += 1) {
        const row = matrix[rowIndex] ?? [];
        if (isBlank(row)) break;
        const area = isArea(row[areaCol]) ?? row.slice(0, 3).map(isArea).find(Boolean) ?? null;
        if (!area) continue;
        const pair = evolutionPairFromCell(row[concludedCol]);
        if (pair.atas !== null || pair.itens !== null) {
          candidate[area] = pair;
          score += 10;
        }
        // Só preenche outras métricas quando a tabela realmente traz números;
        // a célula “ND SEM CAMPO” não deve substituir o quadro separado de
        // EM ANDAMENTO já extraído da planilha.
        const andamento = andamentoCol >= 0 ? evolutionPairFromCell(row[andamentoCol]) : { atas: null, itens: null };
        if (andamento.atas !== null || andamento.itens !== null) setEvolutionPair(payload.evolucao[area], "andamento", andamento.atas, andamento.itens);
        const saldo = saldoCol >= 0 ? integerValue(row[saldoCol]) : null;
        if (saldo !== null) payload.evolucao[area].saldoItens = saldo;
        const semSaldo = semSaldoCol >= 0 ? integerValue(row[semSaldoCol]) : null;
        if (semSaldo !== null) payload.evolucao[area].semSaldoItens = semSaldo;
        const vencidas = vencidasCol >= 0 ? evolutionPairFromCell(row[vencidasCol]) : { atas: null, itens: null };
        if (vencidas.atas !== null || vencidas.itens !== null) setEvolutionPair(payload.evolucao[area], "vencidas", vencidas.atas, vencidas.itens);
        const aVencer = aVencerCol >= 0 ? evolutionPairFromCell(row[aVencerCol]) : { atas: null, itens: null };
        if (aVencer.atas !== null || aVencer.itens !== null) setEvolutionPair(payload.evolucao[area], "aVencer", aVencer.atas, aVencer.itens);
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }

  if (best && bestScore > 0) {
    for (const area of SNAPSHOT_AREAS) {
      const pair = best[area];
      if (pair.atas !== null || pair.itens !== null) setEvolutionPair(payload.evolucao[area], "concluidas", pair.atas, pair.itens);
    }
    addFound(payload, "evolucao");
  }
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

/** Dias entre a data-base e a previsão. A data-base deve ser a referência
 * da planilha, para que o cruzamento por comprador caia na mesma faixa do
 * pivô, mesmo quando a importação ocorrer dias depois. */
function daysUntilISO(iso: string, baseISO: string | null = null): number {
  const [year, month, day] = iso.split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const base = baseISO ? baseISO.split("-").map(Number) : [];
  const now = new Date();
  const today = base.length === 3 && base.every((part) => Number.isFinite(part) && part > 0)
    ? new Date(base[0], base[1] - 1, base[2])
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const MONTH_NUMBERS: Record<string, number> = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
};

function monthlyLabel(value: unknown, referenceDate: string | null): { label: string; month: number | null; year: number | null } | null {
  const label = exact(value);
  if (!label) return null;
  if (label.includes("VENCIDA") || label.includes("SEM PREVISAO") || label.includes("SEM PREVISÃO")) {
    return { label: cellText(value), month: null, year: null };
  }
  const monthName = Object.keys(MONTH_NUMBERS).find((name) => new RegExp(`\\b${name}\\b`).test(label));
  if (!monthName) return null;
  const yearMatch = label.match(/\b(20\d{2})\b/);
  const reference = referenceDate
    ? new Date(Number(referenceDate.slice(0, 4)), Number(referenceDate.slice(5, 7)) - 1, 1)
    : new Date();
  const referenceYear = reference.getFullYear();
  const referenceMonth = reference.getMonth() + 1;
  const month = MONTH_NUMBERS[monthName];
  // O Excel muitas vezes traz somente “Janeiro”, sem ano. O pivô é de
  // previsões futuras: um mês numericamente anterior ao mês de referência
  // atravessou dezembro e pertence ao ano seguinte (inclusive quando a tabela
  // lista mais de dois meses à frente).
  const inferredYear = month < referenceMonth ? referenceYear + 1 : referenceYear;
  return {
    label: cellText(value),
    month,
    year: yearMatch ? Number(yearMatch[1]) : inferredYear,
  };
}

/**
 * Extrai o pivô vertical “PREVISÃO DE CONCLUSÃO POR MÊS”. A tabela de origem
 * possui uma linha de grupos (CAPEX/DIRETOS/INDIRETOS), outra linha com pares
 * QTD ATAS/QTD ITENS e uma linha por mês. O pareamento é feito pela ordem dos
 * grupos, como no Excel, para não deslocar os números entre áreas.
 */
function extractMonthlyForecastTable(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  type Candidate = Record<SnapshotArea, SnapshotMonthlyForecastArea>;
  let best: Candidate | null = null;
  let bestScore = -1;

  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const titleRows = findHeaderRows(matrix, (row) => row.some((value) => exact(value).includes("PREVISAO DE CONCLUSAO POR MES")));
    for (const titleRow of titleRows) {
      let quantityHeaderIndex = -1;
      for (let candidate = titleRow + 1; candidate < Math.min(matrix.length, titleRow + 16); candidate += 1) {
        const values = matrix[candidate] ?? [];
        const atasCount = values.filter((value) => exact(value) === "QTD ATAS").length;
        const itensCount = values.filter((value) => exact(value) === "QTD ITENS").length;
        if (atasCount >= 2 && itensCount >= 2) {
          quantityHeaderIndex = candidate;
          break;
        }
      }
      if (quantityHeaderIndex < 0) continue;

      let groupRowIndex = -1;
      for (let candidate = quantityHeaderIndex - 1; candidate > titleRow; candidate -= 1) {
        const areas = (matrix[candidate] ?? []).filter((value) => Boolean(isArea(value)));
        if (areas.length >= 2) {
          groupRowIndex = candidate;
          break;
        }
      }
      if (groupRowIndex < 0) continue;

      const groupRow = matrix[groupRowIndex] ?? [];
      const groups = groupRow
        .map((value, column) => ({ area: isArea(value), column }))
        .filter((item): item is { area: SnapshotArea; column: number } => Boolean(item.area))
        .sort((a, b) => a.column - b.column);
      const quantityHeader = matrix[quantityHeaderIndex] ?? [];
      const qtdAtasColumns = quantityHeader
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value === "QTD ATAS")
        .map((item) => item.column);
      const qtdItensColumns = quantityHeader
        .map((value, column) => ({ value: exact(value), column }))
        .filter((item) => item.value === "QTD ITENS")
        .map((item) => item.column);
      if (groups.length === 0 || qtdAtasColumns.length === 0 || qtdItensColumns.length === 0) continue;

      const labelCol = quantityHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA") >= 0
        ? quantityHeader.findIndex((value) => exact(value) === "ROTULOS DE LINHA")
        : 0;
      const candidate: Candidate = makeMonthlyForecastRecord();
      let score = 0;
      for (let rowIndex = quantityHeaderIndex + 1; rowIndex < Math.min(matrix.length, quantityHeaderIndex + 80); rowIndex += 1) {
        const row = matrix[rowIndex] ?? [];
        if (isBlank(row)) break;
        const parsedLabel = monthlyLabel(row[labelCol], payload.referenceDate);
        if (!parsedLabel) continue;
        for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
          const atasCol = qtdAtasColumns[groupIndex];
          const itensCol = qtdItensColumns[groupIndex] ?? (atasCol !== undefined ? atasCol + 1 : -1);
          const atas = atasCol === undefined ? null : integerValue(row[atasCol]);
          const itens = itensCol < 0 ? null : integerValue(row[itensCol]);
          if (atas === null && itens === null) continue;
          const area = groups[groupIndex].area;
          const existing = candidate[area].rows.find((item) => (
            item.month === parsedLabel.month && item.year === parsedLabel.year && item.label === parsedLabel.label
          ));
          if (existing) {
            existing.atas = (existing.atas ?? 0) + (atas ?? 0);
            existing.itens = (existing.itens ?? 0) + (itens ?? 0);
          } else {
            candidate[area].rows.push({ ...parsedLabel, atas, itens });
          }
          score += 1;
        }
      }
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }

  if (best && bestScore > 0) {
    payload.previsaoMeses = best;
    addFound(payload, "previsao-meses");
  }
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
          const areaColumnsOrdered = [...areaColumns].sort((a, b) => a.column - b.column);
          const qtdAtasColumns = labelHeader
            .map((value, column) => ({ value: exact(value), column }))
            .filter((item) => item.value === "QTD ATAS")
            .map((item) => item.column);
          for (const item of areaColumnsOrdered) {
            // Em células mescladas o rótulo CAPEX pode estar uma coluna antes
            // da primeira QTD ATAS (ou até na coluna do rótulo da linha). O
            // pareamento por ordem dos grupos é estável e evita deslocar os
            // itens de uma área para a próxima.
            const areaIndex = areaColumnsOrdered.findIndex((candidate) => candidate.column === item.column);
            let atasCol = qtdAtasColumns[areaIndex] ?? item.column;
            let itensCol = atasCol + 1;
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

/** Fallback para exports em que o SheetJS transforma os cabeçalhos mesclados
 * em “CAPEX QTD ATAS”, “DIRETOS QTD ATAS” etc. sem manter a linha de grupos. */
function extractForecastBandFallback(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex += 1) {
      const row = matrix[rowIndex] ?? [];
      let band: ForecastBand | null = null;
      for (let c = 0; c < Math.min(row.length, 4); c += 1) {
        band = bandFromLabel(row[c]);
        if (band) break;
      }
      if (!band) continue;

      let quantityHeaderIndex = -1;
      for (let h = rowIndex - 1; h >= Math.max(0, rowIndex - 8); h -= 1) {
        const values = matrix[h] ?? [];
        if (values.filter((value) => exact(value) === "QTD ATAS").length > 0
          && values.filter((value) => exact(value) === "QTD ITENS").length > 0) {
          quantityHeaderIndex = h;
          break;
        }
      }
      if (quantityHeaderIndex < 0) continue;
      const quantityHeader = matrix[quantityHeaderIndex] ?? [];

      const combinedColumns = new Map<SnapshotArea, { atas: number; itens: number }>();
      for (let c = 0; c < quantityHeader.length; c += 1) {
        const label = exact(quantityHeader[c]);
        for (const area of SNAPSHOT_AREAS) {
          if (!label.includes(area)) continue;
          const current = combinedColumns.get(area) ?? { atas: -1, itens: -1 };
          if (label.includes("QTD ATA")) current.atas = c;
          if (label.includes("QTD ITEM")) current.itens = c;
          combinedColumns.set(area, current);
        }
      }

      // Caso clássico do pivot: uma linha de grupos CAPEX/DIRETOS/INDIRETOS
      // acima de uma linha que repete QTD ATAS/QTD ITENS.
      const groupRowIndex = (() => {
        for (let h = quantityHeaderIndex - 1; h >= Math.max(0, quantityHeaderIndex - 4); h -= 1) {
          const count = (matrix[h] ?? []).filter((value) => Boolean(isArea(value))).length;
          if (count >= 2) return h;
        }
        return -1;
      })();
      if (groupRowIndex >= 0) {
        const groupRow = matrix[groupRowIndex] ?? [];
        const groups = groupRow
          .map((value, column) => ({ area: isArea(value), column }))
          .filter((item): item is { area: SnapshotArea; column: number } => Boolean(item.area))
          .sort((a, b) => a.column - b.column);
        const qtdAtasColumns = quantityHeader
          .map((value, column) => ({ value: exact(value), column }))
          .filter((item) => item.value === "QTD ATAS")
          .map((item) => item.column);
        for (let i = 0; i < groups.length; i += 1) {
          const current = combinedColumns.get(groups[i].area) ?? { atas: -1, itens: -1 };
          if (qtdAtasColumns[i] !== undefined) {
            current.atas = qtdAtasColumns[i];
            current.itens = qtdAtasColumns[i] + 1;
          }
          combinedColumns.set(groups[i].area, current);
        }
      }

      for (const area of SNAPSHOT_AREAS) {
        const columns = combinedColumns.get(area);
        if (!columns) continue;
        const target = payload.previsoes[band][area];
        const atas = columns.atas >= 0 ? integerValue(row[columns.atas]) : null;
        const itens = columns.itens >= 0 ? integerValue(row[columns.itens]) : null;
        if (target.atas === null && atas !== null) target.atas = atas;
        if (target.itens === null && itens !== null) target.itens = itens;
        if (atas !== null || itens !== null) found = true;
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
      // A base operacional pode conter linhas vazias entre registros. Elas são
      // separadores e não encerram a leitura imediatamente; só param após uma
      // sequência longa de linhas vazias.
      let blankRun = 0;
      for (let r = headerRow + 1; r < Math.min(sheet.matrix.length, headerRow + 10000); r += 1) {
        const row = sheet.matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const buyer = cellText(row[buyerCol]);
        const area = isArea(row[areaCol]);
        const deadlineText = cellText(row[deadlineCol]);
        if (!buyer || !area || !deadlineText) continue;

        let iso: string | null = null;
        const date = parseDateBR(row[deadlineCol], "PRAZO CONCLUSAO");
        if (date.iso) iso = date.iso;
        const bandByText = bandFromLabel(deadlineText);
        const band = bandByText ?? (iso ? bandFromDays(daysUntilISO(iso, payload.referenceDate)) : null);
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
          existing.atas = (existing.atas ?? 0) + atas;
          existing.itens = (existing.itens ?? 0) + itens;
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
      payload.previsoes[band][area].buyers.sort((a, b) => (b.itens ?? 0) - (a.itens ?? 0) || (b.atas ?? 0) - (a.atas ?? 0));
    }
  }
  if (found) addFound(payload, "previsoes-cruzadas");
}

/* ----------------------- atas em andamento (geral) ----------------- */

/**
 * Card “ATAS EM ANDAMENTO (GERAL)” do resumo. Aceita rótulo seguido dos
 * cabeçalhos QTD ATAS/QTD ITENS, dois números na mesma linha ou uma célula
 * composta como “70 ATAS / 5000 ITENS”.
 */
function extractAndamentoGeral(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const row = matrix[r] ?? [];
      for (let c = 0; c < row.length; c += 1) {
        const label = exact(row[c]).replace(/[()]/g, "").replace(/\s+/g, " ").trim();
        if (!/^ATAS? EM ANDAMENTO( GERAL)?$/.test(label)) continue;
        const pair = pairFromHeaders(matrix, r, c) ?? pairFromRow(row, c) ?? pairFromComposite(matrix, r, c);
        if (!pair) continue;
        payload.kpis.andamentoAtas = pair.atas;
        payload.kpis.andamentoItens = pair.itens;
        addFound(payload, "kpis-leitura");
        return;
      }
    }
  }
}

function pairFromHeaders(matrix: unknown[][], rowIndex: number, column: number): { atas: number | null; itens: number | null } | null {
  let atas: number | null = null;
  let itens: number | null = null;
  for (let r = rowIndex; r <= Math.min(matrix.length - 1, rowIndex + 4); r += 1) {
    const row = matrix[r] ?? [];
    for (let c = Math.max(0, column - 1); c <= Math.min(row.length - 1, column + 6); c += 1) {
      const label = exact(row[c]);
      const isAtas = label === "QTD ATA" || label === "QTD ATAS";
      const isItens = label === "QTD ITEM" || label === "QTD ITENS";
      if (!isAtas && !isItens) continue;
      const value = integerValue(matrix[r + 1]?.[c]) ?? integerValue(row[c + 1]);
      if (value === null) continue;
      if (isAtas && atas === null) atas = value;
      if (isItens && itens === null) itens = value;
    }
  }
  return atas === null && itens === null ? null : { atas, itens };
}

function pairFromRow(row: unknown[], column: number): { atas: number | null; itens: number | null } | null {
  const numbers: number[] = [];
  for (let c = column + 1; c < row.length && numbers.length < 2; c += 1) {
    const text = cellText(row[c]);
    if (!text) continue;
    const value = integerValue(text);
    if (value === null) break;
    numbers.push(value);
  }
  return numbers.length === 2 ? { atas: numbers[0], itens: numbers[1] } : null;
}

function pairFromComposite(matrix: unknown[][], rowIndex: number, column: number): { atas: number | null; itens: number | null } | null {
  const candidates = [matrix[rowIndex]?.[column + 1], matrix[rowIndex + 1]?.[column], matrix[rowIndex]?.[column]];
  for (const candidate of candidates) {
    const text = exact(candidate);
    if (!/ATAS?/.test(text) || !/ITENS?/.test(text) || !/\d/.test(text)) continue;
    const pair = evolutionPairFromCell(candidate);
    if (pair.atas !== null || pair.itens !== null) return pair;
  }
  return null;
}

/* --------------------- fornecedor por contrato (SAP) --------------- */

/** Número de contrato só com dígitos; textos curtos não contam. */
function contractKey(value: unknown): string | null {
  const text = cellText(value);
  if (!text) return null;
  const digits = text.replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

/** Remove código entre parênteses no fim do nome do fornecedor/comprador. */
function stripCode(value: string): string {
  return value.replace(/\s*\((?:[A-Z]{0,3}\s?\d{1,10})\)\s*$/i, "").trim();
}

function extractContratosFornecedores(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) =>
      rowHas(row, ["Contrato", "Fornecedor"])
      && (rowHas(row, ["Item"]) || rowHas(row, ["Material"]) || rowHas(row, ["Cód SAP"])),
    );
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const contratoCol = columnIndex(header, (value) => value === "CONTRATO");
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      if (contratoCol < 0 || fornecedorCol < 0) continue;
      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const key = contractKey(row[contratoCol]);
        const fornecedor = stripCode(cellText(row[fornecedorCol]));
        if (!key || !fornecedor) continue;
        if (!payload.fornecedoresPorContrato[key]) payload.fornecedoresPorContrato[key] = fornecedor;
        found = true;
      }
    }
  }
  if (found) addFound(payload, "contratos-fornecedores");
}

/* ---------------- atas concluídas (base de andamento) -------------- */

const CONCLUDED_STAGES = new Set(["FINALIZADO", "FINALIZADA", "FINALIZADOS", "FINALIZADAS", "CONCLUIDO", "CONCLUIDA", "CONCLUIDOS", "CONCLUIDAS"]);

function isContractHeader(value: string): boolean {
  const label = value.replace(/[.°º]/g, "").replace(/\s+/g, " ").trim();
  return /^(N|NO|NUM|NUMERO)?( DO| DE)?\s?CONTRATO( SAP)?$/.test(label);
}

function extractAtasConcluidas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  for (const sheet of sheets) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) => rowHas(row, ["DESCRIÇÃO DOS LOTES ATAS", "ETAPA ATUAL"]));
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const descCol = columnIndex(header, (value) => value === "DESCRICAO DOS LOTES ATAS");
      const etapaCol = columnIndex(header, (value) => value === "ETAPA ATUAL");
      if (descCol < 0 || etapaCol < 0) continue;
      const itensCol = columnIndex(header, (value) => value === "QTD ITENS" || value === "QTD ITEM" || value === "QTD DE ITENS");
      const compradorCol = columnIndex(header, (value) => /^COMPRADOR\s?(\(A\)|A)?$/.test(value));
      const areaCol = columnIndex(header, (value) => value === "AREA");
      const contratoCol = columnIndex(header, isContractHeader);
      const valorCol = columnIndex(header, (value) => value === "ESTIMATIVA VALOR TOTAL" || value === "VALOR TOTAL" || value === "VALOR ESTIMADO");
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      found = true;
      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 25) break;
          continue;
        }
        blankRun = 0;
        const etapa = cellText(row[etapaCol]);
        if (!CONCLUDED_STAGES.has(exact(etapa))) continue;
        const descricao = cellText(row[descCol]);
        if (!descricao) continue;
        const contrato = contratoCol >= 0 ? contractKey(row[contratoCol]) : null;
        const comprador = compradorCol >= 0 ? stripCode(cellText(row[compradorCol])) || null : null;
        const area = areaCol >= 0 ? isArea(row[areaCol]) : null;
        const itens = itensCol >= 0 ? integerValue(row[itensCol]) : null;
        const valor = valorCol >= 0 ? numberValue(row[valorCol]) : null;
        const fornecedor = fornecedorCol >= 0 ? stripCode(cellText(row[fornecedorCol])) || null : null;
        const key = contrato ?? [exact(descricao), exact(comprador ?? ""), area ?? ""].join("|");
        if (payload.atasConcluidas.some((item) => item.key === key)) continue;
        payload.atasConcluidas.push({ key, descricao, contrato, fornecedor, itens, comprador, area, etapa, valor });
      }
    }
  }
  if (found) addFound(payload, "atas-concluidas");
}

/* ------------------- status das atas por área (aba) ---------------- */

const STATUS_TILES: Record<string, "total" | "vigentes" | "vencidas" | "ate15" | "de16a30" | "aRenovar" | "totalRenovar" | "emAndamento"> = {
  TOTAL: "total",
  "TOTAL DE ATAS": "total",
  "TOTAL A RENOVAR": "totalRenovar",
  "TOTAL RENOVAR": "totalRenovar",
  VIGENTES: "vigentes",
  VIGENTE: "vigentes",
  VENCIDAS: "vencidas",
  VENCIDA: "vencidas",
  "ATE 15 DIAS": "ate15",
  "ATE 15": "ate15",
  "16 A 30 DIAS": "de16a30",
  "DE 16 A 30 DIAS": "de16a30",
  "16 A 30": "de16a30",
  "A RENOVAR": "aRenovar",
  "EM ANDAMENTO": "emAndamento",
  ANDAMENTO: "emAndamento",
};

function tileKeyOf(label: string) {
  return STATUS_TILES[label.replace(/\s+/g, " ").trim()] ?? null;
}

function isBuyerHeader(value: string): boolean {
  return /^COMPRADOR\s?(\(A\)|A|\(A\)S|ES)?$/.test(value);
}

function parseRenovacaoBanner(row: unknown[]): SnapshotStatusRenovacao | null {
  const cells = row.map(cellText).filter(Boolean);
  const normalized = exact(cells.join(" | "));
  if (!normalized.includes("RENOVACAO EM ANDAMENTO")) return null;
  const texto = cells.join(" | ");
  const contrato = texto.match(/\b\d{6,}\b/)?.[0] ?? null;
  const rawDate = texto.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/)?.[0] ?? null;
  const vencimento = rawDate ? parseDateBR(rawDate, "Vencimento").iso : null;
  const comprador = cells
    .flatMap((cell) => cell.split("|"))
    .map((cell) => cell.trim())
    .find((cell) => cell
      && !exact(cell).includes("RENOVACAO EM ANDAMENTO")
      && !exact(cell).includes("VENCIMENTO")
      && !/^\d{6,}$/.test(cell)
      && !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(cell)) ?? null;
  return { contrato, comprador, vencimento, texto };
}

/**
 * No Excel os cards podem estar em células mescladas e a linha dos rótulos
 * pode ficar separada da linha dos números por uma ou mais linhas formatadas.
 * Procura primeiro na mesma coluna e depois nas colunas vizinhas do mesmo
 * cartão, sem atravessar a faixa do bloco.
 */
function statusTileValue(matrix: unknown[][], rowIndex: number, column: number, start: number, end: number): number | null {
  const rows: number[] = [];
  for (let distance = 1; distance <= 4; distance += 1) {
    if (rowIndex - distance >= start) rows.push(rowIndex - distance);
    if (rowIndex + distance < end) rows.push(rowIndex + distance);
  }
  for (const row of rows) {
    const direct = integerValue(matrix[row]?.[column]);
    if (direct !== null) return direct;
    for (let offset = 1; offset <= 3; offset += 1) {
      const left = integerValue(matrix[row]?.[column - offset]);
      if (left !== null) return left;
      const right = integerValue(matrix[row]?.[column + offset]);
      if (right !== null) return right;
    }
  }
  return null;
}

function emptyStatusArea(area: SnapshotArea): SnapshotStatusAtasArea {
  return {
    area,
    layout: "atas",
    baseDate: null,
    titulo: null,
    subtitulo: null,
    total: null,
    vigentes: null,
    vencidas: null,
    ate15: null,
    de16a30: null,
    aRenovar: null,
    totalRenovar: null,
    emAndamento: null,
    prioridades: [],
    carteira: [],
    renovacaoEmAndamento: null,
    notas: [],
  };
}

function parseStatusBlock(matrix: unknown[][], area: SnapshotArea, start: number, end: number): SnapshotStatusAtasArea | null {
  const block = emptyStatusArea(area);
  let tiles = 0;
  let prioridadesHeader = -1;
  let carteiraHeader = -1;

  for (let r = start; r < end; r += 1) {
    const row = matrix[r] ?? [];
    const headerLike = row.some((value) => /^VIG\.?$|^VENC\.?$|CONTRATO/.test(exact(value)));
    for (let c = 0; c < row.length; c += 1) {
      const text = cellText(row[c]);
      if (!text) continue;
      const label = exact(text);
      const base = text.match(/BASE:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
      if (base) block.baseDate = parseDateBR(base[1], "Base").iso ?? block.baseDate;
      if (label.includes("STATUS DAS ATAS") || label.includes("STATUS DE RENOVACOES")) {
        if (!block.titulo) block.titulo = text;
        if (label.includes("STATUS DE RENOVACOES")) block.layout = "renovacoes";
        continue;
      }
      if (base) {
        if (!block.subtitulo) block.subtitulo = text.split("|")[0].replace(/BASE:?.*$/i, "").trim() || null;
        continue;
      }
      if (!block.subtitulo && (label.includes("CARTEIRA") || label.includes("ALERTA") || label.includes("ATAS A RENOVAR"))) {
        block.subtitulo = text;
        continue;
      }
      const banner = parseRenovacaoBanner(row);
      if (banner) {
        block.renovacaoEmAndamento = banner;
        block.layout = "renovacoes";
        continue;
      }
      const tileKey = tileKeyOf(label);
      if (tileKey) {
        const nearby = statusTileValue(matrix, r, c, start, end);
        const value = nearby ?? (!headerLike ? integerValue(matrix[r + 1]?.[c]) : null);
        if (value !== null && block[tileKey] === null) {
          block[tileKey] = value;
          if (tileKey === "totalRenovar" || tileKey === "emAndamento") block.layout = "renovacoes";
          tiles += 1;
          continue;
        }
      } else {
        const single = label.match(/^(\d{1,5})\s+(.+)$/);
        const singleKey = single ? tileKeyOf(single[2]) : null;
        if (single && singleKey && block[singleKey] === null) {
          block[singleKey] = Number(single[1]);
          if (singleKey === "totalRenovar" || singleKey === "emAndamento") block.layout = "renovacoes";
          tiles += 1;
          continue;
        }
      }
      if (text.length > 12 && /VENCEM ENTRE|VENCIDAS?:|NOVO PROCESSO|CONTINUIDADE DA DEMANDA|ENCERRAD/.test(label) && block.notas.length < 6) {
        if (!block.notas.includes(text)) block.notas.push(text);
      }
    }

    if (prioridadesHeader < 0) {
      const contratoCol = columnIndex(row, (value) => value === "CONTRATO SAP" || value === "CONTRATO" || value === "CONTRATO (SAP)");
      if (contratoCol >= 0) {
        const vencCol = columnIndex(row, (value) => value === "VENCIMENTO" || value === "DATA DE VENCIMENTO" || value === "DATA VENCIMENTO" || value === "FIM VIGENCIA" || value === "FIM DA VIGENCIA");
        const compradorCol = row.findIndex((value, index) => index > contratoCol && isBuyerHeader(exact(value)));
        const situacaoCol = row.findIndex((value, index) => index > contratoCol && (exact(value) === "SITUACAO" || exact(value) === "STATUS"));
        prioridadesHeader = r;
        let blankRun = 0;
        for (let dr = r + 1; dr < Math.min(end, r + 80); dr += 1) {
          const dataRow = matrix[dr] ?? [];
          if (isBlank(dataRow)) {
            blankRun += 1;
            // As planilhas exportadas pelo Excel costumam deixar uma ou mais
            // linhas formatadas entre o cabeçalho e o primeiro vencimento.
            // Só encerramos depois de uma faixa realmente vazia.
            if ((block.prioridades.length > 0 && blankRun >= 3) || blankRun >= 8) break;
            continue;
          }
          blankRun = 0;
          const rowText = exact(dataRow.map(cellText).filter(Boolean).join(" | "));
          if (rowText.includes("RENOVACAO EM ANDAMENTO")) break;
          const rawContrato = cellText(dataRow[contratoCol]);
          const normalizedContrato = exact(rawContrato);
          if (!rawContrato || isBuyerHeader(normalizedContrato) || normalizedContrato.startsWith("TOTAL")) break;
          const contrato = contractKey(rawContrato) ?? rawContrato;
          const vencimentoRaw = vencCol >= 0 ? cellText(dataRow[vencCol]) : "";
          const vencimento = vencimentoRaw ? parseDateBR(vencimentoRaw, "Vencimento").iso : null;
          const comprador = compradorCol >= 0 ? stripCode(cellText(dataRow[compradorCol])) || null : null;
          const situacao = situacaoCol >= 0 ? cellText(dataRow[situacaoCol]) || null : null;
          block.prioridades.push({ contrato, vencimento, comprador, situacao });
        }
      }
    }

    if (carteiraHeader < 0) {
      const vigCol = columnIndex(row, (value) => /^VIG\.?$|^VIGENTES?$/.test(value));
      const vencidasCol = columnIndex(row, (value) => /^VENC\.?$|^VENCIDAS?$/.test(value));
      if (vigCol >= 0 && vencidasCol >= 0) {
        let compradorCol = -1;
        for (let c = vigCol - 1; c >= 0; c -= 1) {
          if (isBuyerHeader(exact(row[c]))) {
            compradorCol = c;
            break;
          }
        }
        if (compradorCol >= 0) {
          const renovarCol = columnIndex(row, (value) => value === "A RENOVAR" || value === "RENOVAR");
          const totalCol = row.findIndex((value, index) => index > vigCol && exact(value) === "TOTAL");
          carteiraHeader = r;
          for (let dr = r + 1; dr < Math.min(end, r + 80); dr += 1) {
            const dataRow = matrix[dr] ?? [];
            const comprador = stripCode(cellText(dataRow[compradorCol]));
            if (!comprador || /^TOTAL/.test(exact(comprador))) break;
            block.carteira.push({
              comprador,
              vigentes: integerValue(dataRow[vigCol]),
              vencidas: integerValue(dataRow[vencidasCol]),
              aRenovar: renovarCol >= 0 ? integerValue(dataRow[renovarCol]) : null,
              total: totalCol >= 0 ? integerValue(dataRow[totalCol]) : null,
            });
          }
        }
      }
    }
  }

  const tables = block.prioridades.length + block.carteira.length;
  const accepted = tiles >= 2 || (Boolean(block.titulo) && (tiles > 0 || tables > 0));
  if (!accepted) return null;
  block.prioridades.sort((a, b) => (a.vencimento ?? "9999").localeCompare(b.vencimento ?? "9999"));
  return block;
}

function extractStatusAtas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  let found = false;
  const preferredSheets = giroSheets(sheets, 5, "RENOVACOES");
  const sourceSheets = preferredSheets.length ? preferredSheets : sheets;
  for (const sheet of sourceSheets) {
    const matrix = sheet.matrix;
    const bands: Array<{ area: SnapshotArea; row: number }> = [];
    matrix.forEach((row, index) => {
      const cells = (row ?? []).map(cellText).filter(Boolean);
      if (cells.length === 0) return;
      const area = isArea(cells[0]);
      if (!area) return;
      if (cells.every((cell) => isArea(cell) === area)) bands.push({ area, row: index });
    });
    for (let b = 0; b < bands.length; b += 1) {
      const start = bands[b].row + 1;
      const end = bands[b + 1]?.row ?? matrix.length;
      const block = parseStatusBlock(matrix, bands[b].area, start, end);
      if (!block || payload.statusAtas[bands[b].area]) continue;
      payload.statusAtas[bands[b].area] = block;
      found = true;
    }
  }
  if (found) addFound(payload, "status-atas");
}

/* -------------------- abas GIRO consolidadas ---------------------- */

function rawCellLines(value: unknown): string[] {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function unitInteger(value: unknown, unit: "ATAS" | "ITENS"): number | null {
  const text = cellText(value);
  const match = text.match(new RegExp(`(-?\\d[\\d.\\s]*(?:,\\d+)?)\\s*${unit}`, "i"));
  return match ? integerValue(match[1]) : null;
}

function displayContract(value: unknown): string | null {
  const text = cellText(value).replace(/\s*\/\s*/g, " / ").trim();
  return text || null;
}

/** GIRO 02 — tabela já filtrada de atas concluídas. */
function extractGiro02Concluidas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 2, "CONCLUIDAS");
  if (!sources.length) return;
  let foundHeader = false;
  const parsed: SnapshotAtaConcluida[] = [];

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const headerRows = findHeaderRows(matrix, (row) =>
      rowHas(row, ["ATA / PROCESSO", "CONTRATO", "QTD. ITENS", "COMPRADOR(A)", "ÁREA"]),
    );
    for (const headerRow of headerRows) {
      const header = matrix[headerRow] ?? [];
      const descCol = columnIndex(header, (value) => value === "ATA / PROCESSO" || value === "ATA/PROCESSO");
      const contratoCol = columnIndex(header, (value) => value === "CONTRATO");
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      const itensCol = columnIndex(header, (value) => value === "QTD. ITENS" || value === "QTD ITENS");
      const compradorCol = columnIndex(header, (value) => value === "COMPRADOR(A)" || value === "COMPRADOR");
      const areaCol = columnIndex(header, (value) => value === "AREA");
      if (descCol < 0 || contratoCol < 0 || itensCol < 0 || compradorCol < 0 || areaCol < 0) continue;
      foundHeader = true;

      let blankRun = 0;
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        const rowText = exact(row.map(cellText).filter(Boolean).join(" | "));
        if (rowText.includes("ATA CONCLUIDA MAIS RECENTE")) break;
        if (isBlank(row)) {
          blankRun += 1;
          if (blankRun >= 2) break;
          continue;
        }
        blankRun = 0;
        const descricao = cellText(row[descCol]);
        const contratoDisplay = displayContract(row[contratoCol]);
        if (!descricao || !contratoDisplay) continue;
        const comprador = stripCode(cellText(row[compradorCol])) || null;
        const area = isArea(row[areaCol]);
        const key = contractKey(row[contratoCol]) ?? `${exact(descricao)}|${exact(comprador ?? "")}|${area ?? ""}`;
        if (parsed.some((item) => item.key === key)) continue;
        parsed.push({
          key,
          descricao,
          contrato: contratoDisplay,
          fornecedor: fornecedorCol >= 0 ? stripCode(cellText(row[fornecedorCol])) || null : null,
          itens: integerValue(row[itensCol]),
          comprador,
          area,
          etapa: "FINALIZADO",
          valor: null,
        });
      }
    }
  }

  if (foundHeader) {
    payload.atasConcluidas = parsed;
    addFound(payload, "atas-concluidas");
  }
}

/** GIRO 03 — valores contratados, saving e compradores do resumo. */
function extractGiro03Resumo(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 3, "RESUMO");
  if (!sources.length) return;
  let valuesFound = false;
  let savingFound = false;
  let buyersFound = false;

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const headerRow = matrix.findIndex((row) => row.some((value) => exact(value) === "AREAS") && row.some((value) => exact(value) === "VALOR CONTRATADO R$"));
    if (headerRow >= 0) {
      const header = matrix[headerRow] ?? [];
      const areaCol = columnIndex(header, (value) => value === "AREAS" || value === "AREA");
      const contractedCols = header
        .map((value, index) => ({ value: exact(value), index }))
        .filter((item) => item.value === "VALOR CONTRATADO R$")
        .map((item) => item.index);
      const histCol = header.findIndex((value) => exact(value).includes("SAVING HISTORICO"));
      const propCol = header.findIndex((value) => exact(value).includes("SAVING SOB PROPOSTA"));
      for (let r = headerRow + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        const areaText = exact(row[areaCol]);
        const area = isArea(row[areaCol]);
        const isTotal = areaText === "TOTAL";
        if (!area && !isTotal) continue;
        const target = isTotal ? payload.savingTotal : payload.valueAreas[area!];
        const valor = contractedCols[0] === undefined ? null : numberValue(row[contractedCols[0]]);
        const valorSaving = contractedCols[1] === undefined ? null : numberValue(row[contractedCols[1]]);
        if (!isTotal && valor !== null) {
          target.valor = valor;
          target.valorSaving = valorSaving ?? valor;
          valuesFound = true;
        }
        if (valorSaving !== null || valor !== null) {
          target.valorSaving = valorSaving ?? target.valorSaving ?? valor;
          savingFound = true;
        }
        if (histCol >= 0) {
          const hist = row[histCol];
          const histValue = savingNumber(hist);
          const histPct = savingPercent(hist);
          if (histValue !== null) target.savingHist = histValue;
          if (histPct !== null) target.reducaoHistPct = histPct;
        }
        if (propCol >= 0) {
          const prop = row[propCol];
          const propValue = savingNumber(prop);
          const propPct = savingPercent(prop);
          if (propValue !== null) target.savingProp = propValue;
          if (propPct !== null) target.reducaoPropPct = propPct;
        }
      }
    }

    const distributionRows = matrix.filter((row) => row.some((value) => {
      const label = exact(value);
      return (label.includes("INDIRETOS") || label.includes("DIRETOS") || label.includes("CAPEX")) && label.includes("ATAS");
    }));
    const totalAtasArea: Record<SnapshotArea, number | null> = { INDIRETOS: null, DIRETOS: null, CAPEX: null };
    for (const row of distributionRows) {
      for (const cell of row) {
        const text = cellText(cell);
        const area = SNAPSHOT_AREAS.find((candidate) => exact(text).includes(candidate));
        const match = text.match(/(\d[\d.]*)\s+ATAS/i);
        if (area && match) totalAtasArea[area] = integerValue(match[1]);
      }
    }

    const titleRow = matrix.findIndex((row) => row.some((value) => exact(value).includes("TOP") && exact(value).includes("COMPRADORES")));
    if (titleRow >= 0) {
      const titleCols = (matrix[titleRow] ?? [])
        .map((value, index) => ({ value: exact(value), index }))
        .filter((item) => item.value.includes("TOP") && item.value.includes("COMPRADORES"));
      titleCols.forEach((title, position) => {
        const area = SNAPSHOT_AREAS[position];
        if (!area) return;
        const buyers: SnapshotBuyer[] = [];
        for (let r = titleRow + 1; r < Math.min(matrix.length, titleRow + 10); r += 1) {
          const text = cellText(matrix[r]?.[title.index]);
          const match = text.match(/^(.+?)\s+([\d.]+)\s+ITENS\s*\|\s*([\d.]+)\s+ATAS$/i);
          if (!match) continue;
          buyers.push({
            name: match[1].trim(),
            itens: integerValue(match[2]) ?? 0,
            atas: integerValue(match[3]) ?? 0,
            totalAtasArea: totalAtasArea[area],
          });
        }
        if (buyers.length > 0) {
          payload.topCompradores[area] = {
            area,
            totalAtasArea: totalAtasArea[area],
            topAtas: buyers.length,
            buyers,
          };
          buyersFound = true;
        }
      });
    }
  }

  if (valuesFound) addFound(payload, "valores-por-area");
  if (savingFound) addFound(payload, "saving");
  if (buyersFound) addFound(payload, "top-compradores");
}

/** GIRO 04 — fornecedores e evolução por área. */
function extractGiro04Evolucao(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 4, "EVOLUCAO");
  if (!sources.length) return;
  let suppliersFound = false;
  let evolutionFound = false;

  for (const sheet of sources) {
    const matrix = sheet.matrix;
    const supplierHeader = matrix.findIndex((row) => rowHas(row, ["FORNECEDOR", "QTD ATAS", "QTD ITENS"]));
    if (supplierHeader >= 0) {
      const header = matrix[supplierHeader] ?? [];
      const fornecedorCol = columnIndex(header, (value) => value === "FORNECEDOR");
      const atasCol = columnIndex(header, (value) => value === "QTD ATAS");
      const itensCol = columnIndex(header, (value) => value === "QTD ITENS");
      const concentrationCol = header.findIndex((value) => exact(value).includes("CONCENTRACAO"));
      const analysisCol = columnIndex(header, (value) => value === "ANALISE");
      const suppliers: SnapshotSupplierGeneral[] = [];
      for (let r = supplierHeader + 1; r < matrix.length; r += 1) {
        const row = matrix[r] ?? [];
        if (row.some((value) => exact(value).includes("EVOLUCAO POR AREA"))) break;
        const fornecedor = cellText(row[fornecedorCol]);
        if (!fornecedor) continue;
        suppliers.push({
          area: "GERAL",
          fornecedor,
          qtdAtas: integerValue(row[atasCol]),
          qtdItens: integerValue(row[itensCol]),
          concentracaoPct: concentrationCol >= 0 ? percentValue(row[concentrationCol]) : null,
          analise: analysisCol >= 0 ? cellText(row[analysisCol]) || null : null,
        });
      }
      if (suppliers.length) {
        payload.fornecedoresGeral = suppliers;
        suppliersFound = true;
      }
    }

    const evolutionTitle = matrix.findIndex((row) => row.some((value) => exact(value).includes("EVOLUCAO POR AREA")));
    if (evolutionTitle >= 0) {
      const headerRow = matrix.findIndex((row, index) => index > evolutionTitle && row.some((value) => exact(value) === "AREAS") && row.some((value) => exact(value).includes("VENCIDAS")));
      if (headerRow >= 0) {
        const header = matrix[headerRow] ?? [];
        const areaCol = columnIndex(header, (value) => value === "AREAS" || value === "AREA");
        const concludedCol = header.findIndex((value) => exact(value).includes("CONCLUID") && exact(value).includes("ATAS"));
        const andamentoCol = header.findIndex((value) => exact(value).includes("ANDAMENTO"));
        const saldoCol = header.findIndex((value) => exact(value).includes("ITENS COM") && exact(value).includes("SALDO"));
        const semSaldoCol = header.findIndex((value) => exact(value).includes("ITENS SEM") && exact(value).includes("SALDO"));
        const vencidasCol = header.findIndex((value) => exact(value) === "VENCIDAS");
        const aVencerCol = header.findIndex((value) => exact(value) === "A VENCER");
        for (let r = headerRow + 1; r < Math.min(matrix.length, headerRow + 8); r += 1) {
          const row = matrix[r] ?? [];
          const area = isArea(row[areaCol]);
          if (!area) continue;
          const target = payload.evolucao[area];
          const concluded = evolutionPairFromCell(row[concludedCol]);
          const andamento = evolutionPairFromCell(row[andamentoCol]);
          const vencidas = evolutionPairFromCell(row[vencidasCol]);
          const aVencer = evolutionPairFromCell(row[aVencerCol]);
          target.concluidasAtas = concluded.atas;
          target.concluidasItens = concluded.itens;
          target.andamentoAtas = andamento.atas;
          target.andamentoItens = andamento.itens;
          target.saldoItens = integerValue(row[saldoCol]);
          target.semSaldoItens = integerValue(row[semSaldoCol]);
          target.vencidasAtas = vencidas.atas;
          target.vencidasItens = vencidas.itens;
          target.aVencerAtas = aVencer.atas;
          target.aVencerItens = aVencer.itens;
          evolutionFound = true;
        }
      }
    }
  }

  if (suppliersFound) addFound(payload, "fornecedores");
  if (evolutionFound) addFound(payload, "evolucao");
}

function giroForecastBand(value: unknown): ForecastBand | null {
  const label = exact(value);
  if (label.includes("PROXIMOS 15")) return "ate_15";
  if (label.includes("ATE 30")) return "ate_30";
  if (label.includes("ATE 60")) return "ate_60";
  if (label.includes("PREVISOES VENCIDAS")) return "vencidas";
  return null;
}

/** GIRO 06 — totais por faixa; os nomes são lidos somente quando houver uma contagem explícita. */
function extractGiro06Faixas(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 6, "FAIXAS");
  if (!sources.length) return;
  let found = false;
  for (const band of FORECAST_BANDS) {
    for (const area of SNAPSHOT_AREAS) payload.previsoes[band][area] = emptyForecast();
  }
  for (const sheet of sources) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const band = giroForecastBand(matrix[r]?.find((value) => giroForecastBand(value) !== null));
      if (!band) continue;
      const headerRow = matrix.slice(r + 1, Math.min(matrix.length, r + 8)).findIndex((row) => SNAPSHOT_AREAS.filter((area) => row.some((value) => isArea(value) === area)).length >= 2);
      if (headerRow < 0) continue;
      const actualHeader = r + 1 + headerRow;
      const header = matrix[actualHeader] ?? [];
      const areaColumns = SNAPSHOT_AREAS.map((area) => ({ area, column: header.findIndex((value) => isArea(value) === area) })).filter((item) => item.column >= 0);
      for (const { area, column } of areaColumns) {
        let atas: number | null = null;
        let itens: number | null = null;
        for (let rr = actualHeader + 1; rr < Math.min(matrix.length, actualHeader + 8); rr += 1) {
          atas ??= unitInteger(matrix[rr]?.[column], "ATAS");
          itens ??= unitInteger(matrix[rr]?.[column], "ITENS");
        }
        if (atas !== null || itens !== null) {
          const target = payload.previsoes[band][area];
          target.atas = atas;
          target.itens = itens;
          const namesRow = matrix.slice(actualHeader + 1, Math.min(matrix.length, actualHeader + 12)).find((row) => {
            const value = row[column];
            const text = cellText(value);
            return Boolean(text)
              && unitInteger(value, "ATAS") === null
              && unitInteger(value, "ITENS") === null
              && !exact(text).includes("PREVISTAS")
              && !exact(text).includes("INDIRETOS")
              && !exact(text).includes("DIRETOS")
              && !exact(text).includes("CAPEX");
          });
          const names = rawCellLines(namesRow?.[column]).filter((name) => !exact(name).includes("SEM COMPRADORES"));
          target.buyers = names.map((name) => ({ name, atas: null, itens: null, prazoConclusao: null }));
          found = true;
        }
      }
    }
  }
  if (found) addFound(payload, "previsao-faixas");
}

/** GIRO 07 — quatro cartões mensais por área. */
function extractGiro07Mensal(payload: DashboardSnapshotPayload, sheets: SnapshotSourceSheet[]) {
  const sources = giroSheets(sheets, 7, "MENSAL");
  if (!sources.length) return;
  let found = false;
  for (const sheet of sources) {
    const matrix = sheet.matrix;
    for (let r = 0; r < matrix.length; r += 1) {
      const area = isArea(matrix[r]?.find((value) => isArea(value) !== null));
      if (!area) continue;
      const areaColumn = (matrix[r] ?? []).findIndex((value) => isArea(value) === area);
      const countRow = matrix.slice(r + 1, Math.min(matrix.length, r + 10)).find((row) => row.some((value) => unitInteger(value, "ATAS") !== null));
      const itemRow = matrix.slice(r + 1, Math.min(matrix.length, r + 12)).find((row) => row.some((value) => unitInteger(value, "ITENS") !== null));
      const labelRow = matrix.slice(r + 1, Math.min(matrix.length, r + 16)).find((row) => row.filter((value) => monthlyLabel(value, payload.referenceDate)).length >= 3);
      if (!countRow || !itemRow || !labelRow) continue;
      const rows: SnapshotMonthlyForecastRow[] = [];
      for (let c = 0; c < labelRow.length; c += 1) {
        const parsedLabel = monthlyLabel(labelRow[c], payload.referenceDate);
        if (!parsedLabel) continue;
        rows.push({
          label: parsedLabel.label,
          month: parsedLabel.month,
          year: parsedLabel.year,
          atas: unitInteger(countRow[c], "ATAS"),
          itens: unitInteger(itemRow[c], "ITENS"),
        });
      }
      if (rows.length) {
        payload.previsaoMeses[area] = { rows };
        found = true;
      }
      void areaColumn;
    }
  }
  if (found) addFound(payload, "previsao-meses");
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
  extractEvolutionStatusTable(payload, sheets);
  extractForecastBandTable(payload, sheets);
  extractForecastBandFallback(payload, sheets);
  extractMonthlyForecastTable(payload, sheets);
  extractForecastRows(payload, sheets);
  extractAndamentoGeral(payload, sheets);
  extractContratosFornecedores(payload, sheets);
  extractAtasConcluidas(payload, sheets);
  extractStatusAtas(payload, sheets);
  // As abas GIRO consolidadas são a fonte principal quando presentes. O
  // extrator antigo permanece acima como fallback para bases legadas.
  extractGiro02Concluidas(payload, sheets);
  extractGiro03Resumo(payload, sheets);
  extractGiro04Evolucao(payload, sheets);
  extractGiro06Faixas(payload, sheets);
  extractGiro07Mensal(payload, sheets);
  // Os cartões visuais da aba de controle são a fonte mais específica do
  // resumo atual e devem prevalecer sobre o fallback calculado das linhas
  // operacionais quando a planilha não traz a tabela LEITURA DOS GRÁFICOS.
  extractSummaryCards(payload, sheets);

  // Sem o card geral, “em andamento” é a soma das três áreas da evolução —
  // somente quando as três existem, para não exibir uma soma parcial como total.
  if (payload.kpis.andamentoAtas === null && SNAPSHOT_AREAS.every((area) => payload.evolucao[area].andamentoAtas !== null)) {
    payload.kpis.andamentoAtas = SNAPSHOT_AREAS.reduce((sum, area) => sum + (payload.evolucao[area].andamentoAtas ?? 0), 0);
  }
  if (payload.kpis.andamentoItens === null && SNAPSHOT_AREAS.every((area) => payload.evolucao[area].andamentoItens !== null)) {
    payload.kpis.andamentoItens = SNAPSHOT_AREAS.reduce((sum, area) => sum + (payload.evolucao[area].andamentoItens ?? 0), 0);
  }
  for (const ata of payload.atasConcluidas) {
    if (!ata.fornecedor && ata.contrato && payload.fornecedoresPorContrato[ata.contrato]) {
      ata.fornecedor = payload.fornecedoresPorContrato[ata.contrato];
    }
  }

  const allKnown = [...SNAPSHOT_BLOCK_KEYS];
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
 * Referência inicial de 13/10 (status da semana anterior na página do
 * SharePoint) para que a comparação semanal não fique vazia antes de existir
 * uma segunda importação. São somente os números dos cards de resumo.
 */
export function defaultPreviousSnapshot(): DashboardSnapshotPayload {
  const payload = emptyDashboardSnapshot("2026-10-13", ["Referência fornecida nas capturas — 13/10"]);
  payload.kpis = {
    concluidasAtas: 62,
    concluidasItens: 915,
    andamentoAtas: 70,
    andamentoItens: 5000,
    saldoItens: 862,
    consumidoItens: 100,
    aVencerAtas: 59,
    aVencerItens: 1441,
    vencidasAtas: 49,
    vencidasItens: 371,
  };
  payload.coverage.found = ["kpis-leitura"];
  payload.coverage.missing = SNAPSHOT_BLOCK_KEYS.filter((key) => key !== "kpis-leitura");
  payload.notes.push("Referência inicial fixa apenas para os cards da semana anterior; será substituída pelo snapshot imediatamente anterior após novas importações.");
  return payload;
}
