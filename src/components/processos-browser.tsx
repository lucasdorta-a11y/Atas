"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown, ArrowUp, ArrowUpDown, BadgeDollarSign, CircleAlert, Download,
  ExternalLink, FileStack, Filter, FunnelX, ListFilter, PackageCheck,
  Printer, Search, SlidersHorizontal, TimerReset, X,
} from "lucide-react";
import clsx from "clsx";
import { AreaTag, PageHeader } from "@/components/ui";
import { KIND_LABEL } from "@/lib/domain";
import { fmtCurrency, fmtDate, fmtDateTime, fmtInt, prazoRelativo } from "@/lib/format";
import { buildCsv } from "@/lib/csv";
import { listActiveProcessRows, STATIC_DATA_EVENT } from "@/lib/static-store";
import {
  activeExecutiveFilterCount,
  EMPTY_EXECUTIVE_FILTERS,
  filterExecutiveProcesses,
  normalizeExecutiveProcesses,
  relatedProcessQuery,
  sortExecutiveProcesses,
  summarizeExecutiveProcesses,
  type ExecutiveFilters,
  type ExecutiveProcess,
  type ExecutiveSituation,
} from "@/lib/process-executive";

/* ------------------------------------------------------------------ */
/* Opções executivas                                                   */
/* ------------------------------------------------------------------ */

const SITUACOES = [
  { key: "todas", label: "Todas as situações" },
  { key: "vencido", label: "Vencido / atrasado" },
  { key: "ate_15", label: "Até 15 dias (crítico)" },
  { key: "16_30", label: "16 a 30 dias" },
  { key: "ate_30", label: "Até 30 dias (acumulado)" },
  { key: "31_60", label: "31 a 60 dias" },
  { key: "61_100", label: "61 a 100 dias (Régua Giro)" },
  { key: "a_renovar", label: "A Renovar SAP (≤ 100d)" },
  { key: "acima_100", label: "Acima de 100 dias" },
  { key: "sem_data", label: "Sem data prevista" },
  { key: "concluido", label: "Concluído (histórico)" },
  { key: "cancelado", label: "Cancelado (histórico)" },
];

const VALORES = [
  { key: "todos", label: "Todos os valores" },
  { key: "100k", label: "Acima de R$ 100 mil" },
  { key: "500k", label: "Acima de R$ 500 mil" },
  { key: "1m", label: "Acima de R$ 1 milhão" },
  { key: "5m", label: "Acima de R$ 5 milhões" },
  { key: "sem", label: "Sem valor informado" },
];

const SALDOS = [
  { key: "todos", label: "Saldo: todos" },
  { key: "com_saldo", label: "Com itens com saldo" },
  { key: "sem_saldo", label: "100% sem saldo (ruptura)" },
  { key: "com_esgotados", label: "Com itens esgotados" },
  { key: "integral", label: "Com saldo integral" },
  { key: "500k", label: "Saldo disponível ≥ R$ 500 mil" },
];

const ALERTAS = [
  { key: "todos", label: "Todos os alertas" },
  { key: "criticos", label: "Críticos imediatos (vencidos ou ≤ 15d)" },
  { key: "a_renovar", label: "Carteira A Renovar (vigentes ≤ 100d)" },
  { key: "itens_esgotados", label: "Atas vigentes com itens esgotados" },
  { key: "sem_saldo", label: "Atas vigentes 100% sem saldo" },
  { key: "andamento_atrasado", label: "Andamento atrasado ou sem previsão" },
  { key: "sem_contrato", label: "Finalizados sem nº contrato SAP" },
  { key: "por_valor", label: "SAP Por Valor (fora do padrão Qtd.)" },
  { key: "por_quantidade", label: "SAP padrão Por Quantidade" },
  { key: "fornecedor_multiplo", label: "Fornecedor com múltiplas atas (≥ 2)" },
];

const MODALIDADES_BASE = ["Ato Convocatório", "Cotação Simplificada", "Dispensa", "Exclusividade", "Inexigibilidade", "Ata / Catálogo", "Não informada"];
const SORTS = [
  { key: "prazo", label: "Menor prazo" },
  { key: "valor", label: "Maior valor R$" },
  { key: "valor_disponivel", label: "Maior saldo R$" },
  { key: "saving", label: "Maior saving R$" },
  { key: "quantidade", label: "Maior quantidade de itens" },
];
const QUICK_ALERTS = [
  { key: "todos", label: "Todos" },
  { key: "criticos", label: "Críticos" },
  { key: "a_renovar", label: "A Renovar" },
  { key: "itens_esgotados", label: "Itens esgotados" },
  { key: "sem_saldo", label: "100% sem saldo" },
  { key: "andamento_atrasado", label: "Andamento atrasado" },
];
const ORIGENS: Record<string, string> = {
  "card-concluidas": "Atas concluídas (válidas)",
  "card-andamento": "Atas em andamento",
  "card-saldo": "Itens com saldo nos contratos válidos",
  "card-sem_saldo": "Itens sem saldo nos contratos válidos",
  "card-vencidas": "Atas vencidas sem ação",
  "card-a_vencer": "Atas a vencer",
  "atalho-criticos": "Críticos imediatos",
  "atalho-renovar": "Carteira A Renovar",
  "atalho-sem-saldo": "Atas vigentes com itens esgotados",
  "atalho-andamento": "Atas em andamento",
  comprador: "Comprador selecionado no Panorama",
  fornecedor: "Fornecedor selecionado no Panorama",
  processo: "Processo e vínculos",
  "saldo-executivo": "Processos com saldo no recorte",
  "saving-executivo": "Processos com saving no recorte",
};

const SITUACAO_LABEL: Record<ExecutiveSituation, string> = {
  vencido: "Vencido",
  ate_15: "Crítico ≤15d",
  "16_30": "16 a 30d",
  "31_60": "31 a 60d",
  "61_100": "A Renovar ≤100d",
  acima_100: "Vigente >100d",
  sem_data: "Sem data",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

interface Facets {
  areas: { value: string; total: number }[];
  etapas: { value: string; total: number }[];
  naturezas: { value: string; total: number }[];
  compradores: { value: string; total: number }[];
  modalidades: { value: string; total: number }[];
  grupos: { value: string; total: number }[];
  fornecedores: { value: string; total: number }[];
}

/* ------------------------------------------------------------------ */

export function ProcessosBrowser() {
  const sp = useSearchParams();
  const [filters, setFilters] = useState<ExecutiveFilters>(() => ({
    ...EMPTY_EXECUTIVE_FILTERS,
    q: sp.get("q") ?? "",
    area: sp.get("area") ?? "todas",
    natureza: sp.get("natureza") ?? "todas",
    situacao: sp.get("situacao") ?? "todas",
    etapa: sp.get("etapa") ?? "todas",
    comprador: sp.get("comprador") ?? "todos",
    valor: sp.get("valor") ?? "todos",
    saldo: sp.get("saldo") ?? "todos",
    modalidade: sp.get("modalidade") ?? "todas",
    grupo: sp.get("grupo") ?? "todas",
    fornecedor: sp.get("fornecedor") ?? "todos",
    alerta: sp.get("alerta") ?? "todos",
    carteira: sp.get("carteira") ?? "todas",
    saving: sp.get("saving") ?? "todos",
    mes: sp.get("mes") ?? "todos",
  }));
  const [qDebounced, setQDebounced] = useState(filters.q);
  const [sort, setSort] = useState(sp.get("sort") ?? "prazo");
  const [dir, setDir] = useState<"asc" | "desc">(sp.get("dir") === "desc" || ["valor", "valor_disponivel", "saving", "quantidade"].includes(sp.get("sort") ?? "") ? "desc" : "asc");
  const [page, setPage] = useState(Math.max(1, Number(sp.get("page") ?? 1) || 1));
  const [pageSize, setPageSize] = useState(25);
  const [origem, setOrigem] = useState<string | null>(sp.get("origem"));
  const [advancedOpen, setAdvancedOpen] = useState(() => ["comprador", "valor", "saldo", "modalidade", "grupo", "fornecedor", "carteira", "saving", "mes"].some((key) => sp.get(key)));

  const [allRows, setAllRows] = useState<ExecutiveProcess[] | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<ExecutiveProcess | null>(null);
  const lastWrittenSearch = useRef<string | null>(null);

  const sincronizarParametros = useCallback(() => {
    setFilters({
      ...EMPTY_EXECUTIVE_FILTERS,
      q: sp.get("q") ?? "", area: sp.get("area") ?? "todas", natureza: sp.get("natureza") ?? "todas",
      situacao: sp.get("situacao") ?? "todas", etapa: sp.get("etapa") ?? "todas", comprador: sp.get("comprador") ?? "todos",
      valor: sp.get("valor") ?? "todos", saldo: sp.get("saldo") ?? "todos", modalidade: sp.get("modalidade") ?? "todas",
      grupo: sp.get("grupo") ?? "todas", fornecedor: sp.get("fornecedor") ?? "todos", alerta: sp.get("alerta") ?? "todos",
      carteira: sp.get("carteira") ?? "todas", saving: sp.get("saving") ?? "todos", mes: sp.get("mes") ?? "todos",
    });
    const nextQ = sp.get("q") ?? "";
    setQDebounced(nextQ);
    const nextSort = sp.get("sort") ?? "prazo";
    setSort(nextSort);
    setDir(sp.get("dir") === "desc" || ["valor", "valor_disponivel", "saving", "quantidade"].includes(nextSort) ? "desc" : "asc");
    setPage(Math.max(1, Number(sp.get("page") ?? 1) || 1));
    setOrigem(sp.get("origem"));
    setAdvancedOpen(["comprador", "valor", "saldo", "modalidade", "grupo", "fornecedor", "carteira", "saving", "mes"].some((key) => sp.get(key)));
  }, [sp]);

  useEffect(() => {
    if (lastWrittenSearch.current === sp.toString()) return;
    sincronizarParametros();
  }, [sp, sincronizarParametros]);

  useEffect(() => {
    const timer = setTimeout(() => setQDebounced(filters.q), 300);
    return () => clearTimeout(timer);
  }, [filters.q]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = normalizeExecutiveProcesses(await listActiveProcessRows());
      setAllRows(data);
      setFacets({
        areas: facet(data, (row) => row.area ?? "Não informado"),
        etapas: facet(data, (row) => row.etapa),
        naturezas: facet(data, (row) => row.natureza),
        compradores: facet(data, (row) => row.responsavel),
        modalidades: facet(data, (row) => row.modalidade),
        grupos: facet(data, (row) => row.grupo && row.grupo !== "Não classificado" ? row.grupo : null),
        fornecedores: facet(data, (row) => row.fornecedorPrincipal),
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar processos locais.");
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    const onUpdate = () => carregar();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
  }, [carregar]);

  const effectiveFilters = useMemo(() => ({ ...filters, q: qDebounced }), [filters, qDebounced]);
  const filteredBase = useMemo(() => filterExecutiveProcesses(allRows ?? [], effectiveFilters), [allRows, effectiveFilters]);
  const filteredRows = useMemo(() => sortExecutiveProcesses(filteredBase, sort, dir), [filteredBase, sort, dir]);
  const summary = useMemo(() => summarizeExecutiveProcesses(filteredRows, effectiveFilters), [filteredRows, effectiveFilters]);
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activePage = Math.min(page, totalPages);
  const rows = useMemo(() => filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize), [filteredRows, activePage, pageSize]);
  const filtrosAtivos = activeExecutiveFilterCount(effectiveFilters);
  const semBase = !loading && allRows !== null && allRows.length === 0;
  const mesOptions = useMemo(() => monthFilterOptions(allRows ?? []), [allRows]);

  useEffect(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(effectiveFilters)) {
      const defaultValue = EMPTY_EXECUTIVE_FILTERS[key as keyof ExecutiveFilters];
      if (value !== defaultValue) params.set(key, value);
    }
    if (sort !== "prazo") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (page > 1) params.set("page", String(page));
    if (origem) params.set("origem", origem);
    const prefix = window.location.pathname.includes("/processos") ? window.location.pathname.split("/processos")[0] : "";
    const query = params.toString();
    lastWrittenSearch.current = query;
    window.history.replaceState(null, "", `${prefix}/processos/${query ? `?${query}` : ""}`);
  }, [effectiveFilters, sort, dir, page, origem]);

  function setFilter<K extends keyof ExecutiveFilters>(key: K, value: ExecutiveFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function aplicarRecorte(next: ExecutiveFilters, nextSort = "prazo", nextDir: "asc" | "desc" = "asc", nextOrigem: string | null = null) {
    setFilters(next);
    setQDebounced(next.q);
    setSort(nextSort);
    setDir(nextDir);
    setOrigem(nextOrigem);
    setPage(1);
    if (next.saldo !== "todos" || next.saving !== "todos" || next.carteira !== "todas") setAdvancedOpen(true);
  }

  function limparFiltros() {
    aplicarRecorte({ ...EMPTY_EXECUTIVE_FILTERS });
  }

  function filtrarRelacionados(row: ExecutiveProcess) {
    aplicarRecorte({ ...EMPTY_EXECUTIVE_FILTERS, q: relatedProcessQuery(row) }, "prazo", "asc", "processo");
    setDetalhe(null);
  }

  function alternarOrdenacao(column: string) {
    if (sort === column) setDir((current) => current === "asc" ? "desc" : "asc");
    else {
      setSort(column);
      setDir(["valor", "valor_disponivel", "saving", "quantidade"].includes(column) ? "desc" : "asc");
    }
    setPage(1);
  }

  function exportar() {
    const max = 5000;
    const data = filteredRows.slice(0, max);
    const body = data.map((row) => [
      row.numero, row.ariba ?? "", row.cw.join(" / "), row.natureza, row.objeto, row.area,
      row.fornecedor ?? "", row.responsavel ?? "", row.gestor ?? "", row.grupo ?? "", row.etapa ?? "",
      SITUACAO_LABEL[row.situacaoExecutiva], row.data_inicio ?? "", row.data_fim ?? "", row.quantidade ?? "",
      row.valor ?? "", row.valorDisponivel, row.savingMapeado, row.tipoDocSap ?? "", row.modalidade ?? "",
      row.status_renovacao ?? "", row.observacao ?? "", row.link ?? "", row.file_name, fmtDateTime(row.imported_at),
    ]);
    if (filteredRows.length > max) body.push([`AVISO: exportação limitada a ${max.toLocaleString("pt-BR")} linhas. Aplique mais filtros para exportar o restante.`]);
    const csv = buildCsv([
      "Nº processo", "Projeto Ariba", "CW", "Natureza", "Objeto", "Área", "Fornecedor", "Comprador", "Gestor", "Categoria", "Etapa",
      "Régua Giro", "Abertura", "Prazo/Vigência", "Qtd. itens", "Valor (R$)", "Saldo disponível (R$)", "Saving (R$)",
      "Tipo documento SAP", "Modalidade", "Status Renovação", "Observações", "Link", "Arquivo de origem", "Importado em",
    ], body);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `giro-de-atas-processos-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const activeChips = filterChips(effectiveFilters);

  return (
    <>
      <PageHeader
        overline="Visão Analítica & Governança"
        title="Processos, Vigência e Saldo de Atas"
        description="Consulte toda a base por contrato, CW, Ariba, fornecedor, comprador, prazo, saldo e alertas executivos. Clique em um processo para abrir seus detalhes e vínculos."
        actions={
          <>
            <button type="button" onClick={exportar} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50" data-no-print>
              <Download size={15} aria-hidden="true" /><span className="hidden sm:inline">Exportar CSV</span><span className="sm:hidden">CSV</span>
            </button>
            <button type="button" onClick={() => window.print()} className="hidden min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 sm:inline-flex" data-no-print>
              <Printer size={15} aria-hidden="true" />Imprimir
            </button>
          </>
        }
      />

      <section aria-label="Filtros executivos" className="card mb-4 overflow-hidden" data-no-print>
        <div className="border-b border-line px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] font-bold text-navy-900"><ListFilter size={16} aria-hidden="true" /> Recortes rápidos</div>
            <button type="button" onClick={() => setAdvancedOpen((open) => !open)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12px] font-semibold text-navy-800 hover:bg-navy-50" aria-expanded={advancedOpen}>
              <SlidersHorizontal size={13} aria-hidden="true" />{advancedOpen ? "Ocultar filtros avançados" : "Filtros avançados"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Alertas rápidos">
            {QUICK_ALERTS.map((alert) => (
              <button
                key={alert.key}
                type="button"
                onClick={() => setFilter("alerta", alert.key)}
                aria-pressed={filters.alerta === alert.key}
                className={clsx(
                  "min-h-9 rounded-full border px-3.5 text-[12px] font-semibold transition-colors",
                  filters.alerta === alert.key ? "border-accent-600 bg-accent-600 text-white" : "border-line bg-surface text-navy-800 hover:border-navy-300 hover:bg-navy-50",
                )}
              >{alert.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="relative">
            <label htmlFor="f-busca" className="mb-1.5 block text-[12px] font-semibold text-navy-900">Busca livre — contrato, CW, Ariba, objeto ou fornecedor</label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute bottom-3.5 left-3.5 text-neutral-500" />
            <input
              id="f-busca" type="search" value={filters.q} onChange={(event) => setFilter("q", event.target.value)}
              placeholder="Ex.: nº do contrato, CW, projeto Ariba, fornecedor ou objeto…"
              className="min-h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-[14px] text-ink placeholder:text-neutral-500 hover:border-navy-300"
            />
            {filters.q && <button type="button" onClick={() => setFilter("q", "")} className="absolute bottom-1.5 right-2 grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-ink" aria-label="Limpar pesquisa"><X size={15} /></button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SelectFiltro id="f-area" label="Área" value={filters.area} onChange={(value) => setFilter("area", value)} options={[{ key: "todas", label: "Todas as áreas" }, ...facetOptions(facets?.areas)]} />
            <SelectFiltro id="f-natureza" label="Natureza" value={filters.natureza} onChange={(value) => setFilter("natureza", value)} options={[{ key: "todas", label: "Todas as naturezas" }, ...facetOptions(facets?.naturezas)]} />
            <SelectFiltro id="f-situacao" label="Situação / Régua Giro" value={filters.situacao} onChange={(value) => setFilter("situacao", value)} options={SITUACOES} />
            <SelectFiltro id="f-etapa" label="Etapa" value={filters.etapa} onChange={(value) => setFilter("etapa", value)} options={[{ key: "todas", label: "Todas as etapas" }, ...facetOptions(facets?.etapas)]} />
            <SelectFiltro id="f-ordenar" label="Ordenação executiva" value={`${sort}:${dir}`} onChange={(value) => { const [nextSort, nextDir] = value.split(":"); setSort(nextSort); setDir(nextDir as "asc" | "desc"); setPage(1); }} options={SORTS.map((item) => ({ key: `${item.key}:${item.key === "prazo" ? "asc" : "desc"}`, label: item.label }))} />
          </div>

          {advancedOpen && (
            <div className="grid gap-3 border-t border-line pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectFiltro id="f-comprador" label="Comprador" value={filters.comprador} onChange={(value) => setFilter("comprador", value)} options={[{ key: "todos", label: "Todos os compradores" }, ...facetOptions(facets?.compradores)]} />
              <SelectFiltro id="f-fornecedor" label="Fornecedor" value={filters.fornecedor} onChange={(value) => setFilter("fornecedor", value)} options={[{ key: "todos", label: "Todos os fornecedores" }, ...facetOptions(facets?.fornecedores)]} />
              <SelectFiltro id="f-grupo" label="Categoria / grupo" value={filters.grupo} onChange={(value) => setFilter("grupo", value)} options={[{ key: "todas", label: "Todas as categorias" }, ...facetOptions(facets?.grupos)]} />
              <SelectFiltro id="f-modalidade" label="Modalidade" value={filters.modalidade} onChange={(value) => setFilter("modalidade", value)} options={[{ key: "todas", label: "Todas as modalidades" }, ...modalidadeOptions(facets?.modalidades)]} />
              <SelectFiltro id="f-valor" label="Materialidade" value={filters.valor} onChange={(value) => setFilter("valor", value)} options={VALORES} />
              <SelectFiltro id="f-saldo" label="Saldo e ruptura" value={filters.saldo} onChange={(value) => setFilter("saldo", value)} options={SALDOS} />
              <SelectFiltro id="f-alerta" label="Alerta de governança" value={filters.alerta} onChange={(value) => setFilter("alerta", value)} options={ALERTAS} />
              <SelectFiltro id="f-carteira" label="Carteira dos cards" value={filters.carteira} onChange={(value) => setFilter("carteira", value)} options={[{ key: "todas", label: "Todas as carteiras" }, { key: "concluidas", label: "Concluídas válidas" }, { key: "a_vencer", label: "A vencer / renovar" }, { key: "vencidas", label: "Vencidas sem ação" }]} />
              <SelectFiltro id="f-saving" label="Saving" value={filters.saving} onChange={(value) => setFilter("saving", value)} options={[{ key: "todos", label: "Com ou sem saving" }, { key: "com", label: "Somente com saving mapeado" }]} />
              <SelectFiltro id="f-mes" label="Previsão de conclusão" value={filters.mes} onChange={(value) => setFilter("mes", value)} options={mesOptions} />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-ink-soft">{filtrosAtivos > 0 ? `${filtrosAtivos} ${filtrosAtivos === 1 ? "filtro ativo" : "filtros ativos"}` : "Todos os processos das bases ativas"}</p>
            {filtrosAtivos > 0 && <button type="button" onClick={limparFiltros} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-navy-800 hover:bg-navy-50"><FunnelX size={14} aria-hidden="true" />Limpar filtros</button>}
          </div>
        </div>
      </section>

      {(origem || activeChips.length > 0) && (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filtros aplicados" data-no-print>
          {origem && <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1.5 text-[12px] font-bold text-accent-700"><Filter size={12} aria-hidden="true" />{ORIGENS[origem] ?? "Recorte executivo"}</span>}
          {activeChips.map((chip) => (
            <button key={chip.key} type="button" onClick={() => setFilter(chip.key, EMPTY_EXECUTIVE_FILTERS[chip.key])} className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[11.5px] font-semibold text-navy-800 hover:border-danger-300 hover:bg-danger-50" title={`Remover filtro ${chip.label}`}>
              {chip.label}<X size={12} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {allRows && allRows.length > 0 && (
        <section aria-label="Indicadores do recorte" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-no-print>
          <SummaryCard icon={<FileStack size={17} />} label="Processos no recorte" value={fmtInt(summary.processos)} detail={`${fmtInt(summary.itens)} ${summary.itemLabel}`} hint="Ver todos os processos" onClick={limparFiltros} />
          <SummaryCard icon={<BadgeDollarSign size={17} />} label="Valor contratado / estimado" value={fmtCurrency(summary.valor)} detail="Materialidade total filtrada" hint="Ordenar por maior valor" onClick={() => { setSort("valor"); setDir("desc"); setPage(1); }} />
          <SummaryCard icon={<PackageCheck size={17} />} label="Saldo vigente disponível" value={fmtCurrency(summary.saldo)} detail={`${fmtInt(summary.comItensEsgotados)} ata(s) com item esgotado`} hint="Filtrar processos com saldo" tone="ok" onClick={() => aplicarRecorte({ ...effectiveFilters, saldo: "com_saldo" }, "valor_disponivel", "desc", "saldo-executivo")} />
          <SummaryCard icon={<BadgeDollarSign size={17} />} label="Saving mapeado" value={fmtCurrency(summary.saving)} detail="Economia registrada na base" hint="Filtrar e ordenar por saving" tone="info" onClick={() => aplicarRecorte({ ...effectiveFilters, saving: "com" }, "saving", "desc", "saving-executivo")} />
          <SummaryCard icon={<TimerReset size={17} />} label="Termômetro de prazo" value={`${fmtInt(summary.criticos)} críticos`} detail={`${fmtInt(summary.janela16a100)} na janela 16–100d`} hint="Filtrar críticos imediatos" tone="danger" onClick={() => aplicarRecorte({ ...effectiveFilters, alerta: "criticos" }, "prazo", "asc", "atalho-criticos")} />
        </section>
      )}

      <p aria-live="polite" role="status" className="mb-3 text-[13px] font-medium text-ink-soft">
        {loading ? "Carregando processos…" : erro ? "Erro ao carregar processos." : total === 0 ? "Nenhum processo encontrado." : `Exibindo ${fmtInt(total)} de ${fmtInt(allRows?.length ?? 0)} registros · ${SORTS.find((item) => item.key === sort)?.label ?? "Ordenação personalizada"}.`}
      </p>

      {erro ? (
        <div className="card flex flex-col items-center gap-3 border-danger-600/30 p-10 text-center" role="alert">
          <CircleAlert size={28} className="text-danger-600" aria-hidden="true" /><p className="text-[14.5px] font-semibold text-danger-700">{erro}</p>
          <button type="button" onClick={carregar} className="btn-brand min-h-10 rounded-xl px-4 text-[13.5px] font-semibold">Tentar novamente</button>
        </div>
      ) : loading && allRows === null ? (
        <div className="card space-y-2.5 p-4" aria-busy="true" aria-label="Carregando">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-14 w-full" />)}</div>
      ) : semBase ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <FileStack size={30} className="text-navy-400" aria-hidden="true" /><h2 className="font-display text-[17px] font-bold text-navy-950">Nenhuma base ativa no momento</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">Importe a pasta consolidada na página <Link href="/importar" className="font-semibold text-navy-700 underline underline-offset-2">Importar</Link> para pesquisar processos.</p>
        </div>
      ) : total === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Search size={30} className="text-navy-400" aria-hidden="true" /><h2 className="font-display text-[17px] font-bold text-navy-950">Nenhum resultado para os filtros aplicados</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">Revise a combinação de filtros ou limpe o recorte para restaurar todos os processos.</p>
          <button type="button" onClick={limparFiltros} className="mt-1 inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-navy-800 hover:bg-navy-50"><FunnelX size={15} />Limpar filtros</button>
        </div>
      ) : (
        <>
          <div className={clsx("card hidden overflow-hidden lg:block", loading && "opacity-60")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1260px] text-[12.5px]">
                <caption className="sr-only">Processos das bases ativas — {fmtInt(total)} resultados</caption>
                <thead><tr className="border-b border-line bg-navy-50/60 text-left">
                  <Th col="numero" label="Nº / Etapa / SAP" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                  <Th col="objeto" label="Objeto / Categoria / Fornecedor" sort={sort} dir={dir} onSort={alternarOrdenacao} className="min-w-[280px]" />
                  <Th col="area" label="Célula" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                  <Th col="responsavel" label="Comprador / Saldo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                  <Th col="data_fim" label="Prazo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                  <Th col="situacao" label="Régua Giro" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                  <Th col="valor" label="Valor / Saldo R$" sort={sort} dir={dir} onSort={alternarOrdenacao} className="text-right" />
                  <th scope="col" className="px-3 py-3"><span className="sr-only">Ações</span></th>
                </tr></thead>
                <tbody>{rows.map((row) => <ProcessTableRow key={row.id} row={row} onDetails={() => setDetalhe(row)} />)}</tbody>
              </table>
            </div>
          </div>

          <ul className={clsx("space-y-3 lg:hidden", loading && "opacity-60")} aria-label="Lista de processos">
            {rows.map((row) => <ProcessMobileCard key={row.id} row={row} onDetails={() => setDetalhe(row)} />)}
          </ul>

          <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Paginação dos resultados" data-no-print>
            <div className="flex items-center gap-2 text-[13px] text-ink-soft"><label htmlFor="f-tamanho">Por página:</label>
              <select id="f-tamanho" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="min-h-9 rounded-lg border border-line bg-surface px-2 font-semibold text-ink">{[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={activePage <= 1 || loading} onClick={() => setPage((current) => Math.max(1, Math.min(current, totalPages) - 1))} className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 hover:bg-navy-50 disabled:opacity-40">Anterior</button>
              <span className="tnum px-1 text-[13px] text-ink-soft">Página {fmtInt(activePage)} de {fmtInt(totalPages)}</span>
              <button type="button" disabled={activePage >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, Math.min(current, totalPages) + 1))} className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 hover:bg-navy-50 disabled:opacity-40">Próxima</button>
            </div>
          </nav>
          <p className="mt-2 text-[12px] text-ink-soft" data-no-print>A exportação inclui todo o recorte filtrado, sem depender da paginação.</p>
        </>
      )}

      <DetalheDialog row={detalhe} onClose={() => setDetalhe(null)} onFilterRelated={filtrarRelacionados} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Linhas e indicadores                                                */
/* ------------------------------------------------------------------ */

function SummaryCard({ icon, label, value, detail, hint, onClick, tone = "navy" }: { icon: React.ReactNode; label: string; value: string; detail: string; hint: string; onClick: () => void; tone?: "navy" | "ok" | "info" | "danger" }) {
  return (
    <button type="button" onClick={onClick} className="group rounded-2xl border border-line bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500" title={hint}>
      <span className={clsx("mb-3 inline-grid h-8 w-8 place-items-center rounded-lg", tone === "ok" && "bg-ok-100 text-ok-700", tone === "info" && "bg-navy-100 text-navy-700", tone === "danger" && "bg-danger-100 text-danger-700", tone === "navy" && "bg-navy-100 text-navy-700")} aria-hidden="true">{icon}</span>
      <span className="block text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-soft">{label}</span>
      <span className={clsx("mt-1 block break-words text-[18px] font-extrabold leading-tight", tone === "ok" && "text-ok-700", tone === "danger" && "text-danger-700", (tone === "navy" || tone === "info") && "text-navy-950")}>{value}</span>
      <span className="mt-1 block text-[11px] leading-snug text-ink-soft">{detail}</span>
      <span className="mt-2 block text-[10.5px] font-semibold text-accent-700 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{hint} →</span>
    </button>
  );
}

function ProcessTableRow({ row, onDetails }: { row: ExecutiveProcess; onDetails: () => void }) {
  return (
    <tr className="border-b border-line/60 align-top transition-colors last:border-0 hover:bg-navy-50/40">
      <td className="px-3 py-3">
        <button type="button" onClick={onDetails} className="text-left font-bold text-navy-800 underline decoration-transparent underline-offset-2 hover:text-accent-700 hover:decoration-current">{row.numero}</button>
        {row.ariba && !row.numero.includes(row.ariba) && <span className="mt-0.5 block text-[10.5px] font-semibold text-navy-600">Ariba {row.ariba}</span>}
        {row.cw.length > 0 && <span className="mt-0.5 block text-[10.5px] text-ink-soft">{row.cw.join(" / ")}</span>}
        <span className="mt-1 block font-semibold text-ink">{row.etapa ?? "—"}</span>
        <span className="mt-0.5 block text-[10px] text-ink-soft">{row.natureza}</span>
        {row.tipoDocSap && <span className={clsx("mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[9.5px] font-bold", row.tipoDocSap === "Por Quantidade" ? "bg-ok-100 text-ok-700" : "bg-warn-100 text-warn-700")}>SAP: {row.tipoDocSap}</span>}
      </td>
      <td className="max-w-[330px] px-3 py-3">
        <span className="font-semibold leading-snug text-ink">{row.objeto}</span>
        {row.grupo && row.grupo !== "Não classificado" && <span className="mt-1.5 inline-flex rounded bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-700">{row.grupo}</span>}
        {row.fornecedor && <span className="mt-1.5 block text-[11px] text-ink"><strong>Fornecedor:</strong> {row.fornecedor} {row.qtdAtasFornecedor >= 2 && <span className="ml-1 rounded-full bg-warn-100 px-1.5 py-0.5 text-[9.5px] font-bold text-warn-700">{row.qtdAtasFornecedor} atas SAP</span>}</span>}
        <span className="mt-1 block text-[10.5px] text-ink-soft">{row.modalidade ?? "Não informada"}{row.data_inicio ? ` · Início: ${fmtDate(row.data_inicio)}` : ""}</span>
      </td>
      <td className="px-3 py-3 text-center"><AreaTag area={row.area} /></td>
      <td className="px-3 py-3">
        <span className="font-semibold text-ink">{row.responsavel ?? "—"}</span>
        {row.gestor && <span className="mt-0.5 block text-[10.5px] text-ink-soft">Gestor: {row.gestor}</span>}
        {row.consumo && <span className="mt-1 block text-[10.5px] font-semibold text-navy-600">{row.consumo}</span>}
        <SaldoBadge row={row} />
      </td>
      <td className="whitespace-nowrap px-3 py-3"><Prazo row={row} /></td>
      <td className="px-3 py-3 text-center"><PrazoBadge situacao={row.situacaoExecutiva} /></td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        <span className="block font-bold text-navy-950">{row.valor !== null ? fmtCurrency(row.valor) : "—"}</span>
        {row.quantidade !== null && <span className="mt-0.5 block text-[10.5px] text-ink-soft">{fmtInt(row.quantidade)} itens</span>}
        {row.valorDisponivel > 0 && <span className="mt-0.5 block text-[10px] font-semibold text-ok-700">Saldo: {fmtCurrency(row.valorDisponivel)}</span>}
        {row.savingMapeado > 0 && <span className="mt-0.5 block text-[10px] font-semibold text-navy-600">Saving: {fmtCurrency(row.savingMapeado)}</span>}
      </td>
      <td className="px-3 py-3"><button type="button" onClick={onDetails} className="min-h-9 rounded-lg border border-line px-3 text-[11.5px] font-semibold text-navy-800 hover:bg-navy-50">Detalhes</button></td>
    </tr>
  );
}

function ProcessMobileCard({ row, onDetails }: { row: ExecutiveProcess; onDetails: () => void }) {
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><button type="button" onClick={onDetails} className="text-left font-bold text-navy-800">{row.numero}</button><p className="mt-1 text-[13px] font-semibold leading-snug text-ink">{row.objeto}</p>{row.ariba && <p className="mt-1 text-[11px] text-navy-600">Ariba {row.ariba}</p>}</div>
        <PrazoBadge situacao={row.situacaoExecutiva} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2"><AreaTag area={row.area} /><span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700">{row.natureza}</span>{row.tipoDocSap && <span className="rounded-full bg-warn-100 px-2.5 py-1 text-[11px] font-semibold text-warn-700">SAP {row.tipoDocSap}</span>}</div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
        <div><dt className="text-[10.5px] font-bold uppercase text-ink-soft">Comprador</dt><dd className="mt-0.5">{row.responsavel ?? "—"}</dd></div>
        <div><dt className="text-[10.5px] font-bold uppercase text-ink-soft">Prazo</dt><dd className="mt-0.5"><Prazo row={row} /></dd></div>
        <div><dt className="text-[10.5px] font-bold uppercase text-ink-soft">Valor</dt><dd className="mt-0.5 font-semibold">{row.valor !== null ? fmtCurrency(row.valor) : "—"}</dd></div>
        <div><dt className="text-[10.5px] font-bold uppercase text-ink-soft">Saldo</dt><dd className="mt-0.5 font-semibold text-ok-700">{row.valorDisponivel > 0 ? fmtCurrency(row.valorDisponivel) : "—"}</dd></div>
      </dl>
      {row.fornecedor && <p className="mt-3 text-[11.5px] text-ink"><strong>Fornecedor:</strong> {row.fornecedor}</p>}
      <button type="button" onClick={onDetails} className="mt-3 min-h-10 w-full rounded-xl border border-line text-[13px] font-semibold text-navy-800 hover:bg-navy-50">Ver detalhes e vínculos</button>
    </li>
  );
}

function Prazo({ row }: { row: ExecutiveProcess }) {
  if (!row.data_fim) return <span className="text-neutral-500">—</span>;
  return (
    <><span className="tnum font-semibold text-ink">{fmtDate(row.data_fim)}</span>
      {row.diasExecutivo !== null && row.situacao_norm === null && <span className={clsx("tnum mt-0.5 block text-[10.5px] font-semibold", row.diasExecutivo < 0 ? "text-danger-700" : row.diasExecutivo <= 30 ? "text-warn-700" : "text-ink-soft")}>{prazoRelativo(row.diasExecutivo)}</span>}
    </>
  );
}

function SaldoBadge({ row }: { row: ExecutiveProcess }) {
  if (row.saldoStatus === "sem_saldo") return <span className="mt-1.5 inline-flex rounded-full bg-danger-100 px-2 py-0.5 text-[10px] font-bold text-danger-700">100% sem saldo</span>;
  if (row.saldoStatus === "parcial") return <span className="mt-1.5 inline-flex rounded-full bg-warn-100 px-2 py-0.5 text-[10px] font-bold text-warn-700">{row.qtdConsumidos} item(ns) sem saldo</span>;
  return null;
}

function PrazoBadge({ situacao }: { situacao: ExecutiveSituation }) {
  const style = situacao === "vencido" || situacao === "ate_15" ? "bg-danger-100 text-danger-700 border-danger-200"
    : situacao === "16_30" || situacao === "31_60" ? "bg-warn-100 text-warn-700 border-warn-200"
      : situacao === "61_100" ? "bg-purple-100 text-purple-700 border-purple-200"
        : situacao === "acima_100" ? "bg-ok-100 text-ok-700 border-ok-200"
          : situacao === "concluido" ? "bg-navy-100 text-navy-700 border-navy-200" : "bg-neutral-100 text-neutral-600 border-line";
  return <span className={clsx("inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10.5px] font-bold", style)}>{SITUACAO_LABEL[situacao]}</span>;
}

/* ------------------------------------------------------------------ */
/* Filtros auxiliares                                                  */
/* ------------------------------------------------------------------ */

function facet(rows: ExecutiveProcess[], select: (row: ExecutiveProcess) => string | null): { value: string; total: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = select(row)?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([value, total]) => ({ value, total }));
}

function facetOptions(values: { value: string; total: number }[] | undefined) {
  return (values ?? []).map((item) => ({ key: item.value, label: `${item.value} (${item.total})` }));
}

function modalidadeOptions(values: { value: string; total: number }[] | undefined) {
  const counts = new Map((values ?? []).map((item) => [item.value, item.total]));
  for (const value of MODALIDADES_BASE) if (!counts.has(value)) counts.set(value, 0);
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([value, total]) => ({ key: value, label: total > 0 ? `${value} (${total})` : value }));
}

function monthFilterOptions(rows: ExecutiveProcess[]): { key: string; label: string }[] {
  const months = [...new Set(rows
    .filter((row) => row.natureza === "Atas em Andamento" && row.data_previsao)
    .map((row) => row.data_previsao!.slice(0, 7))
    .filter((value) => /^\d{4}-\d{2}$/.test(value)))].sort();
  const names = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return [
    { key: "todos", label: "Todas as previsões" },
    { key: "vencidas", label: "Vencida / sem previsão" },
    ...months.map((value) => {
      const [year, month] = value.split("-").map(Number);
      return { key: value, label: `${names[month - 1]}/${year}` };
    }),
  ];
}

function filterChips(filters: ExecutiveFilters): Array<{ key: keyof ExecutiveFilters; label: string }> {
  const labels: Partial<Record<keyof ExecutiveFilters, string>> = {
    area: "Área", natureza: "Natureza", situacao: "Situação", etapa: "Etapa", comprador: "Comprador",
    valor: "Valor", saldo: "Saldo", modalidade: "Modalidade", grupo: "Categoria", fornecedor: "Fornecedor",
    alerta: "Alerta", carteira: "Carteira", saving: "Saving", mes: "Previsão",
  };
  const valueLabels = new Map<string, string>([
    ...SITUACOES, ...VALORES, ...SALDOS, ...ALERTAS,
    { key: "concluidas", label: "Concluídas válidas" }, { key: "a_vencer", label: "A vencer / renovar" }, { key: "vencidas", label: "Vencidas sem ação" },
    { key: "com", label: "Somente com saving" },
  ].map((item) => [item.key, item.label]));
  const chips: Array<{ key: keyof ExecutiveFilters; label: string }> = [];
  if (filters.q) chips.push({ key: "q", label: `Busca: ${filters.q}` });
  for (const [key, label] of Object.entries(labels) as Array<[keyof ExecutiveFilters, string]>) {
    const value = filters[key];
    if (value === EMPTY_EXECUTIVE_FILTERS[key]) continue;
    const valueLabel = key === "mes" && value === "vencidas" ? "Vencida / sem previsão" : valueLabels.get(value) ?? value;
    chips.push({ key, label: `${label}: ${valueLabel}` });
  }
  return chips;
}

function SelectFiltro({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (value: string) => void; options: { key: string; label: string }[] }) {
  const safeOptions = options.some((option) => option.key === value) ? options : [{ key: value, label: value }, ...options];
  return (
    <label htmlFor={id} className="min-w-0 text-[12px] font-semibold text-navy-900"><span className="mb-1.5 block truncate" title={label}>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 w-full rounded-xl border border-line bg-surface px-3 text-[12.5px] font-medium text-ink hover:border-navy-300">
        {safeOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Th({ col, label, sort, dir, onSort, className }: { col: string; label: string; sort: string; dir: "asc" | "desc"; onSort: (column: string) => void; className?: string }) {
  const active = sort === col;
  return (
    <th scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined} className={clsx("px-3 py-3", className)}>
      <button type="button" onClick={() => onSort(col)} className={clsx("inline-flex min-h-8 items-center gap-1 rounded-md text-[10.5px] font-bold uppercase tracking-[0.06em]", active ? "text-navy-800" : "text-ink-soft hover:text-navy-800")}>
        {label}{active ? dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-50" />}
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* Diálogo de detalhes e vínculos                                      */
/* ------------------------------------------------------------------ */

function DetalheDialog({ row, onClose, onFilterRelated }: { row: ExecutiveProcess | null; onClose: () => void; onFilterRelated: (row: ExecutiveProcess) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (row && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>("[data-close]")?.focus();
    } else if (!row && element.open) element.close();
  }, [row]);
  if (!row) return <dialog ref={ref} className="hidden" aria-hidden="true" />;
  const extras = Object.entries(row.extra ?? {});
  return (
    <dialog ref={ref} onClose={onClose} className="max-h-[90dvh] w-[min(780px,94vw)] overflow-hidden rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)]" aria-labelledby="detalhe-titulo">
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0"><p className="overline mb-1">Processo {row.numero}</p><h2 id="detalhe-titulo" className="font-display text-[18px] font-bold leading-snug text-navy-950">{row.objeto}</h2></div>
        <button type="button" data-close onClick={() => ref.current?.close()} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink hover:bg-neutral-100/60" aria-label="Fechar detalhes"><X size={18} /></button>
      </div>
      <div className="max-h-[calc(90dvh-140px)] overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2"><PrazoBadge situacao={row.situacaoExecutiva} /><AreaTag area={row.area} /><span className="rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-semibold text-navy-700">{row.natureza}</span>{row.etapa && <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[12px] font-semibold text-neutral-700">{row.etapa}</span>}</div>
        <div className="mb-5 rounded-xl border border-accent-200 bg-accent-50 p-4">
          <p className="text-[12.5px] leading-relaxed text-ink">Abra somente este processo e os registros vinculados pelo mesmo contrato ou projeto Ariba.</p>
          <button type="button" onClick={() => { ref.current?.close(); onFilterRelated(row); }} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-accent-600 px-3.5 text-[12.5px] font-bold text-white hover:bg-accent-700"><Filter size={14} />Filtrar processo e vínculos</button>
        </div>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Projeto Ariba">{row.ariba ?? "Não informado"}</Field><Field label="CW">{row.cw.length ? row.cw.join(" / ") : "Não informado"}</Field>
          <Field label="Prazo / vigência"><Prazo row={row} /></Field><Field label="Abertura / publicação">{row.data_inicio ? fmtDate(row.data_inicio) : "Não informado"}</Field>
          <Field label="Responsável">{row.responsavel ?? "Não informado"}</Field><Field label="Gestor">{row.gestor ?? "Não informado"}</Field>
          <Field label="Fornecedor">{row.fornecedor ?? "Não informado"}</Field><Field label="Categoria / grupo">{row.grupo ?? "Não informado"}</Field>
          <Field label="Modalidade">{row.modalidade ?? "Não informada"}</Field><Field label="Tipo de documento SAP">{row.tipoDocSap ?? "Não informado"}</Field>
          <Field label="Quantidade de itens">{row.quantidade !== null ? fmtInt(row.quantidade) : "Não informada"}</Field><Field label="Valor estimado"><span className="tnum font-bold">{row.valor !== null ? fmtCurrency(row.valor) : "Não informado"}</span></Field>
          <Field label="Saldo disponível">{fmtCurrency(row.valorDisponivel)}</Field><Field label="Saving mapeado">{fmtCurrency(row.savingMapeado)}</Field>
          <Field label="Itens com saldo">{fmtInt(row.qtdComSaldo)}</Field><Field label="Itens consumidos / sem saldo">{fmtInt(row.qtdConsumidos)}</Field>
          <Field label="Status Renovação">{row.status_renovacao ?? "Não informado"}</Field><Field label="Previsão de Conclusão">{row.data_previsao ? fmtDate(row.data_previsao) : "Não informada"}</Field>
          <Field label="Saving Histórico">{row.saving_hist !== null ? fmtCurrency(row.saving_hist) : "Não informado"}</Field><Field label="Saving Sob Proposta">{row.saving_prop !== null ? fmtCurrency(row.saving_prop) : "Não informado"}</Field>
          {row.link && <Field label="Link"><a href={row.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all font-semibold text-navy-700 underline underline-offset-2">Abrir documento<ExternalLink size={13} /></a></Field>}
        </dl>
        <div className="mt-5"><h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Observações</h3><p className="mt-1.5 rounded-xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-ink">{row.observacao?.trim() || "Nenhuma observação registrada na base."}</p></div>
        {extras.length > 0 && <details className="mt-5"><summary className="cursor-pointer rounded-md text-[13px] font-semibold text-navy-700 underline underline-offset-2">Campos originais da planilha ({extras.length})</summary><dl className="mt-3 space-y-2 rounded-xl border border-line p-4 text-[13px]">{extras.map(([key, value]) => <div key={key} className="grid gap-1 sm:grid-cols-[180px_1fr]"><dt className="font-semibold text-ink-soft">{key}</dt><dd className="break-words text-ink">{value}</dd></div>)}</dl></details>}
        <div className="mt-5 rounded-xl border border-line bg-navy-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Origem deste registro</p><p className="mt-0.5">Arquivo <strong className="text-ink">{row.file_name}</strong>{row.source_row ? ` · linha ${fmtInt(row.source_row)} da importação` : ""} · {KIND_LABEL[row.kind as keyof typeof KIND_LABEL] ?? row.kind} · {row.natureza}{row.reference_date ? ` · referência ${fmtDate(row.reference_date)}` : ""} · importada em {fmtDateTime(row.imported_at)}.</p>
        </div>
      </div>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">{label}</dt><dd className="mt-1 text-[14px] leading-snug text-ink">{children}</dd></div>;
}
