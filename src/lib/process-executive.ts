import { normText } from "./domain";
import type { ProcessRow } from "./static-store";

export type ExecutiveSituation =
  | "vencido"
  | "ate_15"
  | "16_30"
  | "31_60"
  | "61_100"
  | "acima_100"
  | "sem_data"
  | "concluido"
  | "cancelado";

export type CarteiraPanorama = "concluidas" | "a_vencer" | "vencidas";
export type SaldoStatus = "sem_saldo" | "parcial" | "integral" | "na";

export interface ExecutiveProcess extends ProcessRow {
  ariba: string | null;
  cw: string[];
  fornecedorPrincipal: string | null;
  qtdAtasFornecedor: number;
  gestor: string | null;
  grupo: string | null;
  modalidade: string | null;
  tipoDocSap: string | null;
  saldoStatus: SaldoStatus;
  qtdComSaldo: number;
  qtdConsumidos: number;
  semContratoSap: boolean;
  valorDisponivel: number;
  savingMapeado: number;
  consumo: string | null;
  carteira: CarteiraPanorama | null;
  itemKeys: string[];
  temDataFim: boolean;
  diasExecutivo: number | null;
  situacaoExecutiva: ExecutiveSituation;
  prazoSort: number;
  buscaExecutiva: string;
}

export interface ExecutiveFilters {
  q: string;
  area: string;
  natureza: string;
  situacao: string;
  etapa: string;
  comprador: string;
  valor: string;
  saldo: string;
  modalidade: string;
  grupo: string;
  fornecedor: string;
  alerta: string;
  carteira: string;
  saving: string;
  mes: string;
}

export const EMPTY_EXECUTIVE_FILTERS: ExecutiveFilters = {
  q: "",
  area: "todas",
  natureza: "todas",
  situacao: "todas",
  etapa: "todas",
  comprador: "todos",
  valor: "todos",
  saldo: "todos",
  modalidade: "todas",
  grupo: "todas",
  fornecedor: "todos",
  alerta: "todos",
  carteira: "todas",
  saving: "todos",
  mes: "todos",
};

function numeric(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  let text = raw.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, "");
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function integer(value: unknown): number {
  return Math.round(numeric(value));
}

function text(value: unknown): string | null {
  const result = String(value ?? "").trim();
  return result || null;
}

function supplierName(value: string | null): string {
  return String(value ?? "").replace(/\s*\(\d+\)\s*$/, "").trim();
}

function daysFromToday(iso: string | null): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
  return Math.round((target - today) / 86400000);
}

function activeRenewal(row: ProcessRow): boolean {
  const status = normText(row.status_renovacao ?? "");
  return Boolean(status) && !status.includes("renovado") && !status.includes("nao renovar");
}

function normalizeCarteira(value: unknown): CarteiraPanorama | null {
  const explicit = normText(String(value ?? "")).replace(/\s+/g, "_");
  if (explicit === "concluidas" || explicit === "vencidas") return explicit;
  if (explicit === "a_vencer" || explicit === "avencer") return "a_vencer";
  return null;
}

function deriveCarteira(row: ProcessRow, dias: number | null): CarteiraPanorama | null {
  if (row.natureza !== "Contratos Vigentes") return null;
  const explicit = normalizeCarteira(row.extra?.["Carteira do Panorama"]);
  if (explicit) return explicit;
  const renewal = activeRenewal(row);
  const etapa = String(row.etapa ?? "").toUpperCase();
  if (etapa === "VENCIDO") return renewal ? "a_vencer" : "vencidas";
  if (etapa === "RENOVAR" || renewal) return "a_vencer";
  if (etapa === "VÁLIDO" || etapa === "VALIDO") return "concluidas";
  if (dias !== null && dias < 0) return renewal ? "a_vencer" : "vencidas";
  if (dias !== null && dias <= 100) return "a_vencer";
  return "concluidas";
}

function situationOf(row: ProcessRow, dias: number | null): ExecutiveSituation {
  if (row.situacao_norm === "concluido") return "concluido";
  if (row.situacao_norm === "cancelado") return "cancelado";
  if (!row.data_fim) return "sem_data";
  const days = dias ?? 0;
  const etapa = String(row.etapa ?? "").toUpperCase();
  if (days < 0 || etapa === "VENCIDO") return "vencido";
  if (days <= 15) return "ate_15";
  if (days <= 30) return "16_30";
  if (days <= 60) return "31_60";
  if (days <= 100 || etapa === "RENOVAR") return "61_100";
  return "acima_100";
}

/** Normaliza registros novos e antigos sem exigir nova importação para os filtros básicos. */
export function normalizeExecutiveProcesses(rows: ProcessRow[]): ExecutiveProcess[] {
  const supplierCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.natureza !== "Contratos Vigentes") continue;
    const suppliers = new Set(String(row.fornecedor ?? "").split(" / ").map(supplierName).filter(Boolean));
    for (const supplier of suppliers) supplierCounts.set(supplier, (supplierCounts.get(supplier) ?? 0) + 1);
  }

  return rows.map((row) => {
    const metadata = row.giro ?? {};
    const dias = row.data_fim ? (row.dias ?? daysFromToday(row.data_fim)) : null;
    const qtdComSaldo = metadata.qtdComSaldo ?? (row.extra?.["Itens com saldo"] !== undefined
      ? integer(row.extra["Itens com saldo"])
      : row.status_consumo === "Com Saldo" ? row.quantidade ?? 0 : 0);
    const qtdConsumidos = metadata.qtdConsumidos ?? (row.extra?.["Itens consumidos"] !== undefined
      ? integer(row.extra["Itens consumidos"])
      : row.status_consumo === "Consumido" ? row.quantidade ?? 0 : 0);
    const saldoStatus: SaldoStatus = metadata.saldoStatus
      ?? (qtdConsumidos > 0 && qtdComSaldo === 0 ? "sem_saldo" : qtdConsumidos > 0 ? "parcial" : row.natureza === "Contratos Vigentes" ? "integral" : "na");
    const fornecedorPrincipal = metadata.fornecedorPrincipal ?? text(supplierName(String(row.fornecedor ?? "").split(" / ")[0] ?? ""));
    const savingMapeado = metadata.savingMapeado ?? (row.natureza === "Contratos Vigentes"
      ? Math.max(0, row.saving_hist ?? 0, row.saving_prop ?? 0)
      : (row.saving_hist ?? 0) > 0 ? row.saving_hist ?? 0 : Math.max(0, row.saving_prop ?? 0));
    const situacaoExecutiva = situationOf(row, dias);
    const prazoSort = row.situacao_norm === "concluido" ? 200000 - (dias ?? 0)
      : row.situacao_norm === "cancelado" ? 300000
        : !row.data_fim ? 99999 : dias ?? 99999;
    const ariba = metadata.ariba ?? text(row.extra?.["N° Projeto Ariba"]);
    const cw = metadata.cw ?? String(row.extra?.CW ?? "").split(" / ").map((value) => value.trim()).filter(Boolean);
    const gestor = metadata.gestor ?? text(row.extra?.Gestor);
    const grupo = metadata.grupo ?? text(row.extra?.["Grupo de mercadorias"]);
    const modalidade = metadata.modalidade ?? text(row.extra?.Modalidade) ?? "Não informada";
    const tipoDocSap = metadata.tipoDocSap ?? text(row.extra?.["Tipo de documento SAP"]);
    const consumo = metadata.consumo ?? text(row.extra?.Consumo)
      ?? ([qtdComSaldo ? `${qtdComSaldo} c/ saldo` : "", qtdConsumidos ? `${qtdConsumidos} consum.` : ""].filter(Boolean).join(" · ") || null);
    const search = normText([
      row.numero, ariba, ...cw, row.objeto, row.area, row.natureza, row.fornecedor,
      row.responsavel, gestor, grupo, row.etapa, tipoDocSap, consumo, modalidade,
      row.situacao_fonte, row.status_consumo, row.status_renovacao, row.observacao,
      ...Object.values(row.extra ?? {}),
    ].filter(Boolean).join(" "));

    return {
      ...row,
      ariba,
      cw,
      fornecedorPrincipal,
      qtdAtasFornecedor: fornecedorPrincipal ? supplierCounts.get(fornecedorPrincipal) ?? 0 : 0,
      gestor,
      grupo,
      modalidade,
      tipoDocSap,
      saldoStatus,
      qtdComSaldo,
      qtdConsumidos,
      semContratoSap: metadata.semContratoSap ?? row.extra?.["Sem contrato SAP"] === "Sim",
      valorDisponivel: metadata.valorDisponivel ?? numeric(row.extra?.["Saldo disponível"]),
      savingMapeado,
      consumo,
      carteira: normalizeCarteira(metadata.carteira) ?? deriveCarteira(row, dias),
      itemKeys: metadata.itemKeys ?? [],
      temDataFim: Boolean(row.data_fim),
      diasExecutivo: dias,
      situacaoExecutiva,
      prazoSort,
      buscaExecutiva: search,
    };
  });
}

function same(selected: string, actual: string | null, all: string): boolean {
  return selected === all || String(actual ?? "") === selected;
}

function matchesSituation(row: ExecutiveProcess, selected: string): boolean {
  const situation = row.situacaoExecutiva;
  if (selected === "todas") return true;
  if (selected === "a_renovar") {
    return row.natureza === "Contratos Vigentes"
      && (String(row.etapa ?? "").toUpperCase() === "RENOVAR" || (row.temDataFim && (row.diasExecutivo ?? -1) >= 0 && (row.diasExecutivo ?? 101) <= 100));
  }
  if (selected === "ate_30") return situation === "ate_15" || situation === "16_30";
  // Compatibilidade com URLs da versão anterior do site.
  if (selected === "a_vencer") return situation === "ate_15" || situation === "16_30";
  if (selected === "em_dia") return ["31_60", "61_100", "acima_100"].includes(situation);
  return situation === selected;
}

function matchesAlert(row: ExecutiveProcess, selected: string): boolean {
  if (selected === "todos") return true;
  const situation = row.situacaoExecutiva;
  const contracts = row.natureza === "Contratos Vigentes";
  const etapa = String(row.etapa ?? "").toUpperCase();
  if (selected === "criticos") return situation === "vencido" || situation === "ate_15";
  if (selected === "a_renovar") return matchesSituation(row, "a_renovar");
  if (selected === "itens_esgotados") return contracts && etapa !== "VENCIDO" && (row.saldoStatus === "sem_saldo" || row.saldoStatus === "parcial");
  if (selected === "sem_saldo") return contracts && etapa !== "VENCIDO" && row.saldoStatus === "sem_saldo";
  if (selected === "andamento_atrasado") return row.natureza === "Atas em Andamento" && (!row.temDataFim || (row.diasExecutivo ?? 0) < 0);
  if (selected === "sem_contrato") return row.situacao_norm === "concluido" && row.semContratoSap;
  if (selected === "por_valor") return contracts && row.tipoDocSap === "Por Valor";
  if (selected === "por_quantidade") return contracts && row.tipoDocSap === "Por Quantidade";
  if (selected === "fornecedor_multiplo") return contracts && row.qtdAtasFornecedor >= 2;
  return true;
}

export function filterExecutiveProcesses(rows: ExecutiveProcess[], filters: ExecutiveFilters): ExecutiveProcess[] {
  const query = normText(filters.q.trim());
  return rows.filter((row) => {
    if (query && !row.buscaExecutiva.includes(query)) return false;
    if (!same(filters.area, row.area, "todas")) return false;
    if (!same(filters.natureza, row.natureza, "todas")) return false;
    if (!same(filters.comprador, row.responsavel, "todos")) return false;
    if (!same(filters.etapa, row.etapa, "todas")) return false;
    if (!same(filters.modalidade, row.modalidade, "todas")) return false;
    if (!same(filters.grupo, row.grupo, "todas")) return false;
    if (filters.fornecedor !== "todos") {
      const selected = normText(supplierName(filters.fornecedor));
      const primary = normText(row.fornecedorPrincipal ?? "");
      const full = normText(row.fornecedor ?? "");
      if (primary !== selected && !full.includes(selected)) return false;
    }
    if (!matchesSituation(row, filters.situacao)) return false;
    if (filters.carteira !== "todas" && row.carteira !== filters.carteira) return false;
    if (filters.saving === "com" && row.savingMapeado <= 0) return false;
    if (filters.mes !== "todos") {
      if (row.natureza !== "Atas em Andamento") return false;
      if (filters.mes === "vencidas") {
        if (row.data_previsao && row.data_previsao >= (row.reference_date ?? "")) return false;
      } else if (!row.data_previsao?.startsWith(filters.mes)) return false;
    }
    if (filters.valor === "100k" && (row.valor ?? 0) < 100000) return false;
    if (filters.valor === "500k" && (row.valor ?? 0) < 500000) return false;
    if (filters.valor === "1m" && (row.valor ?? 0) < 1000000) return false;
    if (filters.valor === "5m" && (row.valor ?? 0) < 5000000) return false;
    if (filters.valor === "sem" && (row.valor ?? 0) > 0) return false;
    if (filters.saldo === "sem_saldo" && row.saldoStatus !== "sem_saldo") return false;
    if (filters.saldo === "com_esgotados" && row.saldoStatus !== "sem_saldo" && row.saldoStatus !== "parcial") return false;
    if (filters.saldo === "integral" && row.saldoStatus !== "integral") return false;
    if (filters.saldo === "500k" && row.valorDisponivel < 500000) return false;
    if (filters.saldo === "com_saldo" && row.qtdComSaldo <= 0) return false;
    return matchesAlert(row, filters.alerta);
  });
}

function sortValue(row: ExecutiveProcess, key: string): string | number | null {
  if (key === "prazo") return row.prazoSort;
  if (key === "valor") return row.valor;
  if (key === "valor_disponivel") return row.valorDisponivel;
  if (key === "saving") return row.savingMapeado;
  if (key === "quantidade") return row.quantidade;
  if (key === "data_fim") return row.data_fim;
  if (key === "situacao") return row.situacaoExecutiva;
  if (key === "fornecedor") return row.fornecedorPrincipal;
  const value = row[key as keyof ExecutiveProcess];
  return typeof value === "string" || typeof value === "number" ? value : null;
}

export function sortExecutiveProcesses(rows: ExecutiveProcess[], key: string, direction: "asc" | "desc"): ExecutiveProcess[] {
  const result = [...rows];
  result.sort((left, right) => {
    const a = sortValue(left, key);
    const b = sortValue(right, key);
    if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1;
    if (b === null || b === undefined) return -1;
    const comparison = typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "pt-BR", { numeric: true, sensitivity: "base" });
    return direction === "asc" ? comparison : -comparison;
  });
  return result;
}

export function distinctItemCount(rows: ExecutiveProcess[]): number {
  const keys = new Set<string>();
  let fallback = 0;
  for (const row of rows) {
    if (row.itemKeys.length > 0) row.itemKeys.forEach((key) => keys.add(key));
    else fallback += row.quantidade ?? 0;
  }
  return keys.size + fallback;
}

export interface ExecutiveSummary {
  processos: number;
  itens: number;
  itemLabel: string;
  valor: number;
  saldo: number;
  saving: number;
  criticos: number;
  janela16a100: number;
  comItensEsgotados: number;
}

export function summarizeExecutiveProcesses(rows: ExecutiveProcess[], filters: ExecutiveFilters): ExecutiveSummary {
  const bySaldo = filters.saldo === "com_saldo" || filters.saldo === "com_esgotados";
  const byCarteira = filters.carteira !== "todas";
  const itens = filters.saldo === "com_saldo"
    ? rows.reduce((sum, row) => sum + row.qtdComSaldo, 0)
    : filters.saldo === "com_esgotados"
      ? rows.reduce((sum, row) => sum + row.qtdConsumidos, 0)
      : byCarteira ? distinctItemCount(rows) : rows.reduce((sum, row) => sum + (row.quantidade ?? 0), 0);
  return {
    processos: rows.length,
    itens,
    itemLabel: filters.saldo === "com_saldo" ? "itens com saldo" : filters.saldo === "com_esgotados" ? "itens sem saldo" : byCarteira ? "itens distintos SAP" : "itens somados",
    valor: rows.reduce((sum, row) => sum + (row.valor ?? 0), 0),
    saldo: rows.reduce((sum, row) => sum + row.valorDisponivel, 0),
    saving: rows.reduce((sum, row) => sum + row.savingMapeado, 0),
    criticos: rows.filter((row) => row.situacaoExecutiva === "vencido" || row.situacaoExecutiva === "ate_15").length,
    janela16a100: rows.filter((row) => ["16_30", "31_60", "61_100"].includes(row.situacaoExecutiva)).length,
    comItensEsgotados: rows.filter((row) => row.saldoStatus === "sem_saldo" || row.saldoStatus === "parcial").length,
  };
}

export function relatedProcessQuery(row: ExecutiveProcess): string {
  return row.ariba ?? row.numero.match(/\d{7,}/)?.[0] ?? row.numero;
}

export function activeExecutiveFilterCount(filters: ExecutiveFilters): number {
  return Object.entries(filters).reduce((count, [key, value]) => {
    const defaultValue = EMPTY_EXECUTIVE_FILTERS[key as keyof ExecutiveFilters];
    return count + (value !== defaultValue ? 1 : 0);
  }, 0);
}

export function isRenovacaoWindow(row: ExecutiveProcess): boolean {
  return matchesSituation(row, "a_renovar");
}
