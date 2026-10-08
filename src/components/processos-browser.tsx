"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CircleAlert, Download, ExternalLink, FileStack,
  FunnelX, Printer, Search, X,
} from "lucide-react";
import clsx from "clsx";
import { AreaTag, PageHeader, StatusBadge, situacaoChave } from "@/components/ui";
import { KIND_LABEL, SITUACAO_LABEL, normText, type SituacaoChave } from "@/lib/domain";
import { fmtCurrency, fmtDate, fmtDateTime, fmtInt, prazoRelativo } from "@/lib/format";
import { buildCsv } from "@/lib/csv";
import { listActiveProcessRows, STATIC_DATA_EVENT } from "@/lib/static-store";

/* ------------------------------------------------------------------ */

interface Row {
  id: string | number;
  dataset_id: number;
  area: string | null;
  numero: string;
  objeto: string;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacao_fonte: string | null;
  situacao_norm: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  quantidade: number | null;
  valor: number | null;
  status_consumo: string | null;
  saving_hist: number | null;
  saving_prop: number | null;
  status_renovacao: string | null;
  data_previsao: string | null;
  observacao: string | null;
  link: string | null;
  source_row: number | null;
  extra: Record<string, string> | null;
  dias: number | null;
  situacao: SituacaoChave;
  file_name: string;
  kind: string;
  natureza: string;
  reference_date: string | null;
  imported_at: string;
}

interface Facets {
  areas: { area: string; total: number }[];
  etapas: { etapa: string; total: number }[];
}

const SORTS = [
  { key: "data_fim", label: "Prazo / vigência" },
  { key: "numero", label: "Nº do processo" },
  { key: "objeto", label: "Objeto" },
  { key: "area", label: "Área" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "responsavel", label: "Responsável" },
  { key: "etapa", label: "Etapa" },
  { key: "situacao", label: "Situação de prazo" },
  { key: "valor", label: "Valor estimado" },
  { key: "quantidade", label: "Qtd. de itens" },
];

const SITUACOES: { key: string; label: string }[] = [
  { key: "todas", label: "Todas as situações" },
  { key: "vencido", label: "Vencido" },
  { key: "a_vencer", label: "A vencer (30 dias)" },
  { key: "em_dia", label: "No prazo" },
  { key: "sem_data", label: "Sem data de prazo" },
  { key: "concluido", label: "Concluído" },
  { key: "cancelado", label: "Cancelado" },
];

/* ------------------------------------------------------------------ */

export function ProcessosBrowser() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [qDebounced, setQDebounced] = useState(q);
  const [area, setArea] = useState(sp.get("area") ?? "todas");
  const [situacao, setSituacao] = useState(sp.get("situacao") ?? "todas");
  const [etapa, setEtapa] = useState(sp.get("etapa") ?? "todas");
  const [sort, setSort] = useState(sp.get("sort") ?? "data_fim");
  const [dir, setDir] = useState<"asc" | "desc">(sp.get("dir") === "desc" ? "desc" : "asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [allRows, setAllRows] = useState<Row[] | null>(null);
  const [facets, setFacets] = useState<Facets | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detalhe, setDetalhe] = useState<Row | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listActiveProcessRows();
      setAllRows(data);
      const areaCount = new Map<string, number>();
      const etapaCount = new Map<string, number>();
      for (const row of data) {
        const rowArea = row.area ?? "Não informado";
        areaCount.set(rowArea, (areaCount.get(rowArea) ?? 0) + 1);
        if (row.etapa) etapaCount.set(row.etapa, (etapaCount.get(row.etapa) ?? 0) + 1);
      }
      setFacets({
        areas: [...areaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([area, total]) => ({ area, total })),
        etapas: [...etapaCount.entries()].sort((a, b) => a[0].localeCompare(b[0], "pt-BR")).map(([etapa, total]) => ({ etapa, total })),
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar processos locais.");
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

  const filteredRows = useMemo(() => {
    if (!allRows) return [];
    const query = normText(qDebounced);
    const filtered = allRows.filter((row) => {
      if (query) {
        const searchable = normText([
          row.numero, row.objeto, row.area, row.unidade, row.fornecedor, row.responsavel,
          row.etapa, row.situacao_fonte, row.status_consumo, row.status_renovacao,
          row.observacao, ...Object.values(row.extra ?? {}),
        ].filter(Boolean).join(" "));
        if (!searchable.includes(query)) return false;
      }
      if (area !== "todas" && (row.area ?? "Não informado") !== area) return false;
      if (situacao !== "todas" && row.situacao !== situacao) return false;
      if (etapa !== "todas" && row.etapa !== etapa) return false;
      return true;
    });

    const getSortValue = (row: Row): string | number => {
      if (sort === "situacao") return row.situacao;
      if (sort === "valor") return row.valor ?? Number.POSITIVE_INFINITY;
      if (sort === "quantidade") return row.quantidade ?? Number.POSITIVE_INFINITY;
      if (sort === "data_fim") return row.data_fim ?? "9999-12-31";
      return String(row[sort as keyof Row] ?? "");
    };
    filtered.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      const comparison = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), "pt-BR", { numeric: true, sensitivity: "base" });
      return dir === "asc" ? comparison : -comparison;
    });
    return filtered;
  }, [allRows, qDebounced, area, situacao, etapa, sort, dir]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activePage = Math.min(page, totalPages);
  const rows = useMemo(() => filteredRows.slice((activePage - 1) * pageSize, activePage * pageSize), [filteredRows, activePage, pageSize]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (qDebounced) params.set("q", qDebounced);
    if (area !== "todas") params.set("area", area);
    if (situacao !== "todas") params.set("situacao", situacao);
    if (etapa !== "todas") params.set("etapa", etapa);
    if (sort !== "data_fim") params.set("sort", sort);
    if (dir !== "asc") params.set("dir", dir);
    if (page > 1) params.set("page", String(page));
    const prefix = window.location.pathname.includes("/processos") ? window.location.pathname.split("/processos")[0] : "";
    const qs = params.toString();
    window.history.replaceState(null, "", `${prefix}/processos/${qs ? `?${qs}` : ""}`);
  }, [qDebounced, area, situacao, etapa, sort, dir, page]);

  const filtrosAtivos =
    (qDebounced ? 1 : 0) + (area !== "todas" ? 1 : 0) + (situacao !== "todas" ? 1 : 0) + (etapa !== "todas" ? 1 : 0);
  const semBase = !loading && allRows !== null && total === 0 && filtrosAtivos === 0;

  function limparFiltros() {
    setQ("");
    setArea("todas");
    setSituacao("todas");
    setEtapa("todas");
    setPage(1);
  }

  function alternarOrdenacao(col: string) {
    if (sort === col) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setDir("asc");
    }
    setPage(1);
  }

  function exportar() {
    const max = 5000;
    const data = filteredRows.slice(0, max);
    const body = data.map((r) => [
      r.numero, r.objeto, r.area, r.unidade, r.fornecedor, r.responsavel, r.etapa,
      r.situacao_fonte, SITUACAO_LABEL[r.situacao], r.status_consumo ?? "",
      r.saving_hist ?? "", r.saving_prop ?? "", r.status_renovacao ?? "",
      r.data_previsao ? fmtDate(r.data_previsao) : "", r.data_inicio ? fmtDate(r.data_inicio) : "",
      r.data_fim ? fmtDate(r.data_fim) : "", r.quantidade ?? "", r.valor ?? "", r.observacao ?? "", r.link ?? "",
      r.file_name, r.imported_at ? fmtDateTime(r.imported_at) : "",
    ]);
    if (filteredRows.length > max) body.push([`AVISO: exportação limitada a ${max.toLocaleString("pt-BR")} linhas. Aplique mais filtros para exportar o restante.`]);
    const csv = buildCsv([
      "Nº processo", "Objeto", "Área", "Unidade", "Fornecedor", "Responsável", "Etapa", "Situação (fonte)",
      "Situação de prazo", "Status de Consumo", "Saving Histórico (R$)", "Saving Proposta (R$)", "Status Renovação",
      "Previsão", "Abertura", "Prazo/Vigência", "Qtd. itens", "Valor estimado (R$)", "Observações", "Link", "Arquivo de origem", "Importado em",
    ], body);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `giro-de-atas-processos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        overline="Consulta"
        title="Processos e atas"
        description="Pesquise em número, objeto, fornecedor, responsável, etapa, unidade e observações das bases ativas."
        actions={
          <>
            <a
              href="#exportar"
              onClick={(e) => { e.preventDefault(); exportar(); }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              title="Exporta o recorte filtrado completo (até 5.000 linhas) em CSV"
              data-no-print
            >
              <Download size={15} aria-hidden="true" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 sm:inline-flex"
              data-no-print
            >
              <Printer size={15} aria-hidden="true" />
              Imprimir
            </button>
          </>
        }
      />

      {/* Barra de filtros */}
      <section aria-label="Filtros" className="card mb-4 p-4" data-no-print>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_190px_190px]">
          <div className="relative">
            <label htmlFor="f-busca" className="sr-only">
              Pesquisar processos
            </label>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="f-busca"
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nº, objeto, fornecedor, responsável…"
              className="min-h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-9 text-[14px] text-ink placeholder:text-neutral-500 hover:border-navy-300"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-ink"
                aria-label="Limpar pesquisa"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <SelectFiltro
            id="f-area"
            label="Área"
            value={area}
            onChange={(v) => {
              setArea(v);
              setPage(1);
            }}
            options={[
              { key: "todas", label: "Todas as áreas" },
              ...(facets?.areas.map((a) => ({ key: a.area, label: `${a.area} (${a.total})` })) ?? [
                { key: "Indiretos", label: "Indiretos" },
                { key: "Diretos", label: "Diretos" },
                { key: "CAPEX", label: "CAPEX" },
              ]),
            ]}
          />
          <SelectFiltro
            id="f-situacao"
            label="Situação de prazo"
            value={situacao}
            onChange={(v) => {
              setSituacao(v);
              setPage(1);
            }}
            options={SITUACOES}
          />
          <SelectFiltro
            id="f-etapa"
            label="Etapa"
            value={etapa}
            onChange={(v) => {
              setEtapa(v);
              setPage(1);
            }}
            options={[
              { key: "todas", label: "Todas as etapas" },
              ...(facets?.etapas.map((e) => ({ key: e.etapa, label: `${e.etapa} (${e.total})` })) ?? []),
            ]}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {filtrosAtivos > 0 && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
              >
                <FunnelX size={14} aria-hidden="true" />
                Limpar filtros ({filtrosAtivos})
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <label htmlFor="f-ordenar" className="font-medium sm:hidden">
              Ordenar por
            </label>
            <select
              id="f-ordenar"
              value={`${sort}:${dir}`}
              onChange={(e) => {
                const [s, d] = e.target.value.split(":");
                setSort(s);
                setDir(d as "asc" | "desc");
                setPage(1);
              }}
              className="min-h-9 rounded-lg border border-line bg-surface px-2 text-[12.5px] font-medium text-ink sm:hidden"
            >
              {SORTS.map((s) => (
                <option key={`${s.key}:asc`} value={`${s.key}:asc`}>
                  {s.label} (crescente)
                </option>
              ))}
              {SORTS.map((s) => (
                <option key={`${s.key}:desc`} value={`${s.key}:desc`}>
                  {s.label} (decrescente)
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Contagem acessível */}
      <p aria-live="polite" role="status" className="mb-3 text-[13px] font-medium text-ink-soft">
        {loading
          ? "Carregando processos…"
          : erro
            ? "Erro ao carregar processos."
            : total === 0
              ? "Nenhum processo encontrado."
              : `${fmtInt(total)} ${total === 1 ? "processo encontrado" : "processos encontrados"}${filtrosAtivos > 0 ? " com os filtros ativos" : " nas bases ativas"}.`}
      </p>

      {/* Conteúdo */}
      {erro ? (
        <div className="card flex flex-col items-center gap-3 border-danger-600/30 p-10 text-center" role="alert">
          <CircleAlert size={28} className="text-danger-600" aria-hidden="true" />
          <p className="text-[14.5px] font-semibold text-danger-700">{erro}</p>
          <button
            type="button"
            onClick={carregar}
            className="min-h-10 rounded-xl bg-navy-800 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : loading && rows === null ? (
        <div className="card space-y-2.5 p-4" aria-busy="true" aria-label="Carregando">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : semBase ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <FileStack size={30} className="text-navy-400" aria-hidden="true" />
          <h2 className="font-display text-[17px] font-bold text-navy-950">Nenhuma base ativa no momento</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            Importe uma planilha na página <a href="/importar" className="font-semibold text-navy-700 underline underline-offset-2">Importar</a> para
            pesquisar processos.
          </p>
        </div>
      ) : rows !== null && rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Search size={30} className="text-navy-400" aria-hidden="true" />
          <h2 className="font-display text-[17px] font-bold text-navy-950">Nenhum resultado para os filtros aplicados</h2>
          <p className="max-w-md text-[13.5px] leading-relaxed text-ink-soft">
            Revise a grafia, remova filtros ou amplie a situação de prazo. A busca cobre número, objeto, fornecedor,
            responsável, etapa, unidade e observações.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="mt-1 inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-[13.5px] font-semibold text-navy-800 hover:bg-navy-50"
          >
            <FunnelX size={15} aria-hidden="true" />
            Limpar filtros
          </button>
        </div>
      ) : (
        rows && (
          <>
            {/* Tabela (desktop e tablet) */}
            <div className={clsx("card hidden overflow-hidden md:block", loading && "opacity-60")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-[13.5px]">
                  <caption className="sr-only">
                    Lista de processos das bases ativas{total > 0 ? ` — ${fmtInt(total)} resultados` : ""}
                  </caption>
                  <thead>
                    <tr className="border-b border-line bg-navy-50/60 text-left">
                      <Th col="numero" label="Nº processo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="objeto" label="Objeto" sort={sort} dir={dir} onSort={alternarOrdenacao} className="min-w-[220px]" />
                      <Th col="area" label="Área" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="responsavel" label="Responsável" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="data_fim" label="Prazo" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="situacao" label="Situação" sort={sort} dir={dir} onSort={alternarOrdenacao} />
                      <Th col="valor" label="Valor est." sort={sort} dir={dir} onSort={alternarOrdenacao} className="text-right" numeric />
                      <th scope="col" className="px-3 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-soft">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-navy-50/40">
                        <td className="px-3 py-3 align-top">
                          <span className="font-semibold text-navy-800">{r.numero}</span>
                          {r.etapa && <span className="mt-0.5 block text-[11.5px] text-ink-soft">{r.etapa}</span>}
                        </td>
                        <td className="max-w-[300px] px-3 py-3 align-top">
                          <span className="line-clamp-2 text-[13px] leading-snug text-ink" title={r.objeto}>
                            {r.objeto}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <AreaTag area={r.area} />
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-3 align-top text-ink" title={r.responsavel ?? ""}>
                          {r.responsavel ?? <span className="text-neutral-500">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top">
                          {r.data_fim ? (
                            <>
                              <span className="tnum font-medium text-ink">{fmtDate(r.data_fim)}</span>
                              {r.dias !== null && r.situacao !== "concluido" && r.situacao !== "cancelado" && (
                                <span
                                  className={clsx(
                                    "tnum mt-0.5 block text-[11.5px] font-semibold",
                                    r.dias < 0 ? "text-danger-700" : r.dias <= 30 ? "text-warn-700" : "text-ink-soft",
                                  )}
                                >
                                  {prazoRelativo(r.dias)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge situacao={situacaoChave(r.situacao)} />
                        </td>
                        <td className="tnum whitespace-nowrap px-3 py-3 text-right align-top font-semibold text-ink">
                          {r.valor !== null ? fmtCurrency(r.valor) : <span className="font-normal text-neutral-500">—</span>}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => setDetalhe(r)}
                            className="min-h-9 rounded-lg border border-line px-3 text-[12px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                            aria-label={`Ver detalhes do processo ${r.numero}`}
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cartões (celular) */}
            <ul className={clsx("space-y-3 md:hidden", loading && "opacity-60")} aria-label="Lista de processos">
              {rows.map((r) => (
                <li key={r.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-800">{r.numero}</p>
                      <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink">{r.objeto}</p>
                    </div>
                    <StatusBadge situacao={situacaoChave(r.situacao)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Área</dt>
                      <dd className="mt-0.5"><AreaTag area={r.area} /></dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Prazo</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">
                        {r.data_fim ? fmtDate(r.data_fim) : "—"}
                        {r.dias !== null && r.situacao !== "concluido" && r.situacao !== "cancelado" && (
                          <span className={clsx("ml-1 text-[11px]", r.dias < 0 ? "text-danger-700" : "text-ink-soft")}>
                            ({prazoRelativo(r.dias)})
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Responsável</dt>
                      <dd className="mt-0.5 text-ink">{r.responsavel ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Valor est.</dt>
                      <dd className="tnum mt-0.5 font-medium text-ink">{r.valor !== null ? fmtCurrency(r.valor) : "—"}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => setDetalhe(r)}
                    className="mt-3 min-h-10 w-full rounded-xl border border-line text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50"
                    aria-label={`Ver detalhes do processo ${r.numero}`}
                  >
                    Ver detalhes
                  </button>
                </li>
              ))}
            </ul>

            {/* Paginação */}
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3"
              aria-label="Paginação dos resultados"
              data-no-print
            >
              <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                <label htmlFor="f-tamanho" className="font-medium">
                  Por página:
                </label>
                <select
                  id="f-tamanho"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="min-h-9 rounded-lg border border-line bg-surface px-2 font-semibold text-ink"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={activePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, Math.min(p, totalPages) - 1))}
                  className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="tnum px-1 text-[13px] font-medium text-ink-soft">
                  Página {fmtInt(activePage)} de {fmtInt(totalPages)}
                </span>
                <button
                  type="button"
                  disabled={activePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, Math.min(p, totalPages) + 1))}
                  className="min-h-10 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-800 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </nav>
            <p className="mt-2 text-[12px] text-ink-soft" data-no-print>
              A exportação em CSV ignora a paginação e inclui todo o recorte filtrado (até 5.000 linhas, com aviso no
              arquivo se houver corte). A impressão reproduz esta tela.
            </p>
          </>
        )
      )}

      <DetalheDialog row={detalhe} onClose={() => setDetalhe(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Th({
  col,
  label,
  sort,
  dir,
  onSort,
  className,
  numeric = false,
}: {
  col: string;
  label: string;
  sort: string;
  dir: "asc" | "desc";
  onSort: (col: string) => void;
  className?: string;
  numeric?: boolean;
}) {
  const active = sort === col;
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
      className={clsx("px-3 py-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className={clsx(
          "inline-flex min-h-8 items-center gap-1 rounded-md text-[11px] font-bold uppercase tracking-[0.08em] transition-colors",
          active ? "text-navy-800" : "text-ink-soft hover:text-navy-800",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? (
            <ArrowUp size={12} aria-hidden="true" />
          ) : (
            <ArrowDown size={12} aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown size={12} aria-hidden="true" className="opacity-50" />
        )}
        <span className="sr-only">
          {active ? (dir === "asc" ? " (ordem crescente — clique para inverter)" : " (ordem decrescente — clique para inverter)") : " (clique para ordenar)"}
        </span>
      </button>
      {numeric && <span className="sr-only">valores monetários em reais</span>}
    </th>
  );
}

function SelectFiltro({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-[13.5px] font-medium text-ink hover:border-navy-300"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Diálogo de detalhes                                                  */
/* ------------------------------------------------------------------ */

function DetalheDialog({ row, onClose }: { row: Row | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (row && !el.open) {
      el.showModal();
      const closeBtn = el.querySelector<HTMLElement>("[data-close]");
      closeBtn?.focus();
    } else if (!row && el.open) {
      el.close();
    }
  }, [row]);

  if (!row) return <dialog ref={ref} className="hidden" aria-hidden="true" />;

  const extras = Object.entries(row.extra ?? {});

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="max-h-[88dvh] w-[min(720px,94vw)] overflow-hidden rounded-2xl border border-line bg-surface p-0 shadow-[var(--shadow-pop)]"
      aria-labelledby="detalhe-titulo"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="overline mb-1">Processo {row.numero}</p>
          <h2 id="detalhe-titulo" className="font-display text-[17px] font-bold leading-snug text-navy-950">
            {row.objeto}
          </h2>
        </div>
        <button
          type="button"
          data-close
          onClick={() => ref.current?.close()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-ink transition-colors hover:bg-neutral-100/60"
          aria-label="Fechar detalhes"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[calc(88dvh-140px)] overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge situacao={situacaoChave(row.situacao)} />
          <AreaTag area={row.area} />
          {row.etapa && <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-semibold text-navy-700">Etapa: {row.etapa}</span>}
        </div>

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Prazo / vigência">
            {row.data_fim ? (
              <>
                <span className="tnum font-semibold">{fmtDate(row.data_fim)}</span>
                {row.dias !== null && row.situacao !== "concluido" && row.situacao !== "cancelado" && (
                  <span className={clsx("tnum ml-2 text-[12.5px]", row.dias < 0 ? "font-semibold text-danger-700" : "text-ink-soft")}>
                    ({prazoRelativo(row.dias)})
                  </span>
                )}
              </>
            ) : (
              "Não informado"
            )}
          </Field>
          <Field label="Abertura / publicação">{row.data_inicio ? fmtDate(row.data_inicio) : "Não informado"}</Field>
          <Field label="Situação declarada na fonte">{row.situacao_fonte ?? "Não informada"}</Field>
          <Field label="Situação de prazo (calculada hoje)">{SITUACAO_LABEL[situacaoChave(row.situacao)]}</Field>
          <Field label="Responsável">{row.responsavel ?? "Não informado"}</Field>
          <Field label="Fornecedor">{row.fornecedor ?? "Não informado"}</Field>
          <Field label="Unidade / solicitante">{row.unidade ?? "Não informada"}</Field>
          <Field label="Quantidade de itens">{row.quantidade !== null ? fmtInt(row.quantidade) : "Não informada"}</Field>
          <Field label="Valor estimado">
            <span className="tnum font-bold">{row.valor !== null ? fmtCurrency(row.valor) : "Não informado"}</span>
          </Field>
          <Field label="Status de Consumo">{row.status_consumo ?? "Não informado"}</Field>
          <Field label="Status Renovação">{row.status_renovacao ?? "Não informado"}</Field>
          <Field label="Previsão de Conclusão">{row.data_previsao ? fmtDate(row.data_previsao) : "Não informada"}</Field>
          <Field label="Saving Histórico">
            {row.saving_hist !== null ? fmtCurrency(row.saving_hist) : "Não informado"}
          </Field>
          <Field label="Saving Sob Proposta">
            {row.saving_prop !== null ? fmtCurrency(row.saving_prop) : "Não informado"}
          </Field>
          {row.link && (
            <Field label="Link">
              <a
                href={row.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 break-all font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900"
              >
                Abrir documento
                <ExternalLink size={13} aria-hidden="true" />
                <span className="sr-only">(abre em nova guia)</span>
              </a>
            </Field>
          )}
        </dl>

        <div className="mt-5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-soft">Observações</h3>
          <p className="mt-1.5 rounded-xl bg-canvas px-4 py-3 text-[13.5px] leading-relaxed text-ink">
            {row.observacao?.trim() ? row.observacao : "Nenhuma observação registrada na base."}
          </p>
        </div>

        {extras.length > 0 && (
          <details className="mt-5">
            <summary className="cursor-pointer rounded-md text-[13px] font-semibold text-navy-700 underline decoration-navy-300 underline-offset-2 hover:text-navy-900">
              Campos originais da planilha não mapeados ({extras.length})
            </summary>
            <dl className="mt-3 space-y-2 rounded-xl border border-line p-4 text-[13px]">
              {extras.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[180px_1fr]">
                  <dt className="font-semibold text-ink-soft">{k}</dt>
                  <dd className="break-words text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <div className="mt-5 rounded-xl border border-line bg-navy-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Origem deste registro</p>
          <p className="mt-0.5">
            Arquivo <strong className="text-ink">{row.file_name}</strong>
            {row.source_row ? ` · linha ${fmtInt(row.source_row)} da planilha` : ""} · base do tipo{" "}
            {KIND_LABEL[row.kind as keyof typeof KIND_LABEL] ?? row.kind} (
            {row.natureza === "snapshot" ? "snapshot semanal" : "base operacional"})
            {row.reference_date ? ` · referência ${fmtDate(row.reference_date)}` : ""} · importada em{" "}
            {fmtDateTime(row.imported_at)}.
          </p>
        </div>
      </div>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">{label}</dt>
      <dd className="mt-1 text-[14px] leading-snug text-ink">{children}</dd>
    </div>
  );
}
