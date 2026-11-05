"use client";

import Link from "next/link";
import { ArrowUpRight, FileStack, FileUp, RefreshCw, SearchX, SlidersHorizontal } from "lucide-react";
import { getStaticDashboardData, type PanoramaBlock, type StaticDashboardData } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";
import { SNAPSHOT_BLOCKS, type DashboardSnapshotPayload, type ForecastBand, type SnapshotArea, type SnapshotMonthlyForecastRow } from "@/lib/dashboard-snapshot";
import { useCallback, useEffect, useState } from "react";
import { DatasetsPanel } from "@/components/datasets-panel";
import { ResumoCards, type ResumoKpis } from "@/components/resumo-cards";
import { AtasConcluidas } from "@/components/atas-concluidas";
import { FornecedoresAnalise } from "@/components/fornecedores-analise";
import { StatusAtas } from "@/components/status-atas";
import { EmptyState, PageHeader, areaStyle } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import { panoramaCardHref, panoramaQuickHref, processosHref, type PanoramaAreaFilter } from "@/lib/process-links";
import clsx from "clsx";

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/**
 * Faixas de previsão em ordem cronológica. No Excel as faixas são exclusivas
 * ("ATÉ 30 DIAS" não inclui as de até 15); os cálculos permanecem exclusivos.
 */
const FAIXAS_PREVISAO: Array<{ band: ForecastBand; title: string; titleClass?: string }> = [
  { band: "ate_15", title: "Previstas para concluir nos próximos 15 dias" },
  { band: "ate_30", title: "Previstas para concluir até 30 dias" },
  { band: "ate_60", title: "Previstas para concluir até 60 dias" },
  { band: "vencidas", title: "Previsões Vencidas", titleClass: "bg-danger-700 text-white border-danger-700" },
];

export default function PanoramaPage() {
  const [data, setData] = useState<StaticDashboardData | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [areaPanorama, setAreaPanorama] = useState<PanoramaAreaFilter>("TODAS");
  const [baseSaving, setBaseSaving] = useState<"contratado" | "referencia">("contratado");

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setErro(null);
      setData(await getStaticDashboardData());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados locais.");
    } finally {
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    carregar();
    const onUpdate = () => carregar();
    window.addEventListener(STATIC_DATA_EVENT, onUpdate);
    return () => window.removeEventListener(STATIC_DATA_EVENT, onUpdate);
  }, [carregar]);

  if (!data) {
    return (
      <div className="space-y-8">
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Carregando a base local deste navegador."
        />
        {erro ? (
          <div className="card border-danger-600/30 bg-danger-100/40 p-5 text-[13.5px] font-semibold text-danger-700" role="alert">
            {erro}
          </div>
        ) : (
          <div className="card space-y-4 p-6" aria-busy="true" aria-label="Carregando panorama">
            <div className="skeleton h-8 w-1/3" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const hoje = new Date().toISOString().slice(0, 10);

  if (!data.hasData) {
    return (
      <>
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Painel interno de compras e Atas de Registro de Preços. Os dados são calculados a partir das planilhas importadas neste navegador."
          actions={(
            <button
              type="button"
              onClick={carregar}
              disabled={atualizando}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-900 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
              aria-label="Atualizar e reprocessar o panorama com os dados locais"
            >
              <RefreshCw size={16} aria-hidden="true" className={atualizando ? "animate-spin" : undefined} />
              {atualizando ? "Atualizando…" : "Atualizar panorama"}
            </button>
          )}
        />
        <EmptyState
          icon={<FileStack />}
          title="Comece importando as planilhas"
          description="Os números do painel são alimentados pelas planilhas Excel ou CSV. Use as planilhas da equipe para espelhar as visões do SharePoint aqui."
          action={
            <Link
              href="/importar"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-accent-700"
            >
              <FileUp size={17} aria-hidden="true" />
              Importar planilhas
            </Link>
          }
        />
      </>
    );
  }

  const { kpis, porArea, topCompradores, fornecedores, evolucao, previsoes, currentSnapshot, previousSnapshot, savingTotal, blocos, atasConcluidas, statusAtas } = data;
  const referencia = currentSnapshot?.referenceDate ?? null;
  const ausente = (bloco: PanoramaBlock) => blocos[bloco] === "ausente";
  // Ordem única das áreas em todos os blocos do painel, conforme a planilha.
  const areaVisualOrder: SnapshotArea[] = ["INDIRETOS", "DIRETOS", "CAPEX"];
  const areasVisiveis = areaPanorama === "TODAS" ? areaVisualOrder : [areaPanorama];
  const porAreaVisual = [...(porArea as any[])]
    .filter((item) => areaPanorama === "TODAS" || String(item.area).toUpperCase() === areaPanorama)
    .sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase() as SnapshotArea) - areaVisualOrder.indexOf(String(b.area).toUpperCase() as SnapshotArea));
  const evolucaoVisual = [...(evolucao as any[])]
    .filter((item) => areaPanorama === "TODAS" || String(item.area).toUpperCase() === areaPanorama)
    .sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase() as SnapshotArea) - areaVisualOrder.indexOf(String(b.area).toUpperCase() as SnapshotArea));
  const currentResumoKpis: ResumoKpis = areaPanorama === "TODAS" ? {
    concluidasAtas: kpis.concluidosAtas,
    concluidasItens: kpis.concluidosItens,
    andamentoAtas: kpis.andamentoAtas,
    andamentoItens: kpis.andamentoItens,
    saldoItens: kpis.saldoItens,
    consumidoItens: kpis.consumidoItens,
    aVencerAtas: kpis.aVencerAtas,
    aVencerItens: kpis.aVencerItens,
    vencidasAtas: kpis.vencidasAtas,
    vencidasItens: kpis.vencidasItens,
  } : evolutionToResumo(evolucaoVisual[0]);
  const previousResumoKpis = previousSnapshot ? snapshotKpisForArea(previousSnapshot, areaPanorama) : null;
  const savingVisual = areaPanorama === "TODAS" ? savingTotal : porAreaVisual[0] ? {
    valorSaving: porAreaVisual[0].valorSaving ?? porAreaVisual[0].valor,
    saving_hist: porAreaVisual[0].saving_hist,
    saving_prop: porAreaVisual[0].saving_prop,
    reducao_hist_pct: porAreaVisual[0].reducao_hist_pct,
    reducao_prop_pct: porAreaVisual[0].reducao_prop_pct,
  } : null;
  const fornecedoresVisual = areaPanorama === "TODAS" ? fornecedores : (currentSnapshot?.fornecedores[areaPanorama] ?? []).map((item) => ({
    area: areaPanorama,
    fornecedor: item.fornecedor,
    atas: item.qtdAtas ?? 0,
    itens: item.qtdItens ?? 0,
    concentracao: item.concentracaoPct ?? 0,
    analise: item.analise,
  }));
  const atasConcluidasVisual = areaPanorama === "TODAS" ? atasConcluidas : {
    ...atasConcluidas,
    novas: atasConcluidas.novas.filter((item) => item.area === areaPanorama),
    totalFinalizadas: currentSnapshot?.atasConcluidas.filter((item) => item.area === areaPanorama).length ?? atasConcluidas.novas.filter((item) => item.area === areaPanorama).length,
  };
  const savingPct = (valorBase: number, saving: number, original: number | null | undefined) => {
    if (baseSaving === "contratado") return original ?? (valorBase > 0 ? (saving * 100) / valorBase : 0);
    return valorBase + saving > 0 ? (saving * 100) / (valorBase + saving) : 0;
  };

  const valorSavingVisualTotal = savingVisual?.valorSaving ?? porAreaVisual.reduce((sum, item) => sum + Number(item.valorSaving ?? item.valor ?? 0), 0);
  const savingHistVisualTotal = savingVisual?.saving_hist ?? porAreaVisual.reduce((sum, item) => sum + Number(item.saving_hist ?? 0), 0);
  const savingPropVisualTotal = savingVisual?.saving_prop ?? porAreaVisual.reduce((sum, item) => sum + Number(item.saving_prop ?? 0), 0);

  const prevByBand = (area: string, band: ForecastBand) => {
    const key = area.toUpperCase() as SnapshotArea;
    const source = currentSnapshot?.coverage.found.includes("previsao-faixas")
      ? currentSnapshot.previsoes?.[band]?.[key]
      : undefined;
    if (source) {
      return {
        atas: source.atas ?? 0,
        itens: source.itens ?? 0,
        buyers: source.buyers.map((buyer) => ({ name: buyer.name, atas: buyer.atas, itens: buyer.itens })),
      };
    }
    const rows = (previsoes as any[]).filter((row) => {
      if (String(row.area).toUpperCase() !== area.toUpperCase()) return false;
      if (row.band) return row.band === band;
      const days = Number(row.dias);
      if (band === "vencidas") return days < 0;
      if (band === "ate_15") return days >= 0 && days <= 15;
      if (band === "ate_30") return days > 15 && days <= 30;
      if (band === "ate_60") return days > 30 && days <= 60;
      return days > 60;
    });
    const buyersMap = new Map<string, { atas: number; itens: number }>();
    for (const row of rows) {
      if (!row.responsavel) continue;
      const current = buyersMap.get(row.responsavel) ?? { atas: 0, itens: 0 };
      current.atas += Number(row.atas ?? 0);
      current.itens += Number(row.itens ?? 0);
      buyersMap.set(row.responsavel, current);
    }
    return {
      atas: rows.reduce((sum, row) => sum + Number(row.atas ?? 0), 0),
      itens: rows.reduce((sum, row) => sum + Number(row.itens ?? 0), 0),
      buyers: [...buyersMap.entries()].map(([name, values]) => ({ name, ...values })),
    };
  };

  const monthlyForArea = (area: string) => {
    const key = area.toUpperCase() as SnapshotArea;
    const sourceRows: SnapshotMonthlyForecastRow[] = currentSnapshot?.previsaoMeses?.[key]?.rows ?? [];
    const reference = currentSnapshot?.referenceDate ?? hoje;
    const [year, month] = reference.split("-").map(Number);
    const baseDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);

    const sumRows = (rows: SnapshotMonthlyForecastRow[]) => ({
      atas: rows.reduce((sum, row) => sum + Number(row.atas ?? 0), 0),
      itens: rows.reduce((sum, row) => sum + Number(row.itens ?? 0), 0),
    });
    const buckets = [0, 1, 2].map((offset) => {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
      const monthNumber = date.getMonth() + 1;
      const rows = sourceRows.filter((row) => row.month === monthNumber && row.year === date.getFullYear());
      return {
        label: `${MONTH_NAMES_PT[monthNumber - 1]}/${date.getFullYear()}`,
        ...sumRows(rows),
      };
    });
    const explicitLast = sumRows(sourceRows.filter((row) => row.month === null));
    const overdue = explicitLast.atas || explicitLast.itens ? explicitLast : prevByBand(area, "vencidas");
    return [...buckets, { label: "Vencida/Sem Previsão", ...overdue }];
  };

  const areaPercent = (area: string) => {
    const ordered = ["INDIRETOS", "DIRETOS", "CAPEX"];
    const index = ordered.indexOf(area);
    const total = porAreaVisual.reduce((sum, item) => sum + Number(item.processos || 0), 0);
    if (total <= 0 || index < 0) return 0;
    if (index === ordered.length - 1 || areasVisiveis.length === 1) {
      const prior = porAreaVisual.filter((item) => ordered.indexOf(String(item.area).toUpperCase()) < index)
        .reduce((sum, item) => sum + Number(((Number(item.processos || 0) / total) * 100).toFixed(2)), 0);
      return Math.max(0, Number((100 - prior).toFixed(2)));
    }
    const current = porAreaVisual.find((item) => String(item.area).toUpperCase() === area);
    return Number(((Number(current?.processos || 0) / total) * 100).toFixed(2));
  };

  return (
    <div className="space-y-8">
      <PageHeader
        overline={`Panorama geral · calculado em ${fmtDateLong(hoje)}`}
        title="Gestão Atas Concluídas - Compras"
        actions={(
          <button
            type="button"
            onClick={carregar}
            disabled={atualizando}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13px] font-semibold text-navy-900 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
            aria-label="Atualizar e reprocessar o panorama com os dados locais"
          >
            <RefreshCw size={16} aria-hidden="true" className={atualizando ? "animate-spin" : undefined} />
            {atualizando ? "Atualizando…" : "Atualizar panorama"}
          </button>
        )}
      />

      <section aria-label="Filtros executivos do panorama" className="card space-y-4 p-4" data-no-print>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            <label className="text-[12px] font-semibold text-navy-900">
              <span className="mb-1.5 flex items-center gap-1.5"><SlidersHorizontal size={14} aria-hidden="true" /> Área do panorama</span>
              <select
                value={areaPanorama}
                onChange={(event) => setAreaPanorama(event.target.value as PanoramaAreaFilter)}
                className="min-h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink"
              >
                <option value="TODAS">Todas as células</option>
                <option value="INDIRETOS">Indiretos</option>
                <option value="DIRETOS">Diretos</option>
                <option value="CAPEX">CAPEX</option>
              </select>
            </label>
            <label className="text-[12px] font-semibold text-navy-900">
              <span className="mb-1.5 block">Base dos percentuais de saving</span>
              <select
                value={baseSaving}
                onChange={(event) => setBaseSaving(event.target.value as "contratado" | "referencia")}
                className="min-h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px] font-medium text-ink"
              >
                <option value="contratado">% sobre valor contratado</option>
                <option value="referencia">% sobre preço inicial de referência</option>
              </select>
            </label>
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.07em] text-ink-soft">Abrir recorte em Processos</p>
            <div className="flex flex-wrap gap-2">
              {([
                ["criticos", "Críticos"],
                ["renovar", "A Renovar"],
                ["sem_saldo", "Sem saldo"],
                ["andamento", "Andamento"],
              ] as const).map(([action, label]) => (
                <Link
                  key={action}
                  href={panoramaQuickHref(action, areaPanorama)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[12px] font-semibold text-navy-800 transition-colors hover:border-navy-300 hover:bg-navy-50"
                >
                  {label}<ArrowUpRight size={12} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="text-[12px] leading-relaxed text-ink-soft">
          Os cards da semana atual também são clicáveis e abrem os processos correspondentes. O filtro de área é preservado nessa navegação.
        </p>
      </section>

      {/* Bloco 1: seis cards de resumo — semana anterior e semana atual. */}
      <section aria-labelledby="comparacao-semanal" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="comparacao-semanal" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Resumo das atas</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">A semana anterior é preservada no IndexedDB deste navegador e substituída pela leitura imediatamente anterior após uma nova importação.</p>
          </div>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-[12px] font-semibold text-navy-700">
            Referência anterior: {formatReferenceDate(previousSnapshot?.referenceDate)}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Bases da comparação semanal">
          <div className="rounded-xl border border-line bg-surface p-4 text-[12.5px]">
            <h3 className="font-semibold text-navy-900">Base atual</h3>
            <p className="mt-1 text-ink-soft">Data de referência: {formatReferenceDate(currentSnapshot?.referenceDate)}</p>
            <p className="mt-1 break-words text-ink-soft">Arquivo: {currentSnapshot ? (data.snapshotHistory[0]?.fileName || "Nome do arquivo não disponível") : "Sem snapshot importado; indicadores disponíveis vêm dos registros operacionais."}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 text-[12.5px]">
            <h3 className="font-semibold text-navy-900">Base anterior</h3>
            <p className="mt-1 text-ink-soft">Data de referência: {formatReferenceDate(previousSnapshot?.referenceDate)}</p>
            <p className="mt-1 break-words text-ink-soft">Arquivo: {data.snapshotHistory[1] ? (data.snapshotHistory[1].fileName || "Nome do arquivo não disponível") : previousSnapshot ? "Não se aplica — referência fixa, sem arquivo importado" : "Sem base anterior"}</p>
          </div>
        </div>
        {previousSnapshot && !data.snapshotHistory[1] && (
          <p role="status" className="rounded-xl border border-line bg-navy-50 p-4 text-[12.5px] text-navy-900">
            A base anterior usa a referência fixa de {formatReferenceDate(previousSnapshot.referenceDate)}, fornecida na captura do SharePoint, e não uma planilha importada. Ela contém apenas os indicadores de resumo; será substituída pelo histórico real quando houver uma importação anterior disponível.
          </p>
        )}
        {previousSnapshot && (
          <ResumoCards
            titulo="Resumo das Atas Concluídas"
            status={`Status semana anterior ${formatShortDate(previousSnapshot.referenceDate)}`}
            kpis={previousResumoKpis ?? previousSnapshot.kpis}
            tone="anterior"
          />
        )}
        {ausente("kpis-leitura") ? (
          <BlocoAusente bloco="kpis-leitura" referencia={referencia} />
        ) : (
          <ResumoCards
            titulo="Resumo das Atas Concluídas"
            status={`Status atual ${formatShortDate(currentSnapshot?.referenceDate)}`}
            tone="atual"
            kpis={currentResumoKpis}
            hrefForCard={(card) => panoramaCardHref(card, areaPanorama)}
          />
        )}
      </section>

      {/* Bloco 1b: atas que passaram a FINALIZADO desde a importação anterior. */}
      <section aria-labelledby="atas-concluidas-recentes" className="space-y-4">
        <div>
          <h2 id="atas-concluidas-recentes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Atas Concluídas desde a Última Atualização</h2>
          <p className="mt-1 text-[12.5px] text-ink-soft">Atas com ETAPA ATUAL = FINALIZADO na aba “Base - Atas Em andamento” que não estavam finalizadas na importação anterior. Quando disponível, o fornecedor é lido diretamente da coluna FORNECEDOR do GIRO 02; o cruzamento pela aba “Base - Controle de Contratos” permanece como fallback pelo nº do contrato.</p>
        </div>
        {ausente("atas-concluidas") ? (
          <BlocoAusente bloco="atas-concluidas" referencia={referencia} />
        ) : (
          <AtasConcluidas dados={atasConcluidasVisual} referencia={referencia} />
        )}
      </section>

      {/* Bloco 2: Valor Contratado & Saving (Ref: Screenshot 2 & 12) */}
      <section className="card overflow-hidden text-[13px]">
        <div className="grid items-stretch lg:grid-cols-2 divide-x divide-line">
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] items-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Valor Contratado Por Área</h3>
            {ausente("valores-por-area") ? (
              <div className="flex-1 px-5 pb-5"><BlocoAusente bloco="valores-por-area" referencia={referencia} compact /></div>
            ) : (
            <table className="w-full flex-1 text-left">
              <thead>
                <tr className="tbl-head font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="h-full divide-y divide-line">
                {porAreaVisual.map((a) => (
                  <tr key={a.area} className={clsx("font-bold", areaStyle(a.area).band)}>
                    <td className="px-5 py-3 uppercase">{a.area}</td>
                    <td className="px-5 py-3 text-right">{fmtCurrency(a.valor)}</td>
                  </tr>
                ))}
                <tr className="tbl-total-row font-bold">
                  <td className="px-5 py-3">TOTAL</td>
                  <td className="px-5 py-3 text-right">{fmtCurrency(porAreaVisual.reduce((acc, a) => acc + Number(a.valor ?? 0), 0))}</td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
          <div className="flex h-full min-h-full flex-col">
            <h3 className="flex min-h-[58px] flex-col justify-center px-5 py-3 text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Saving <span className="text-[14px] text-danger-700 block mt-1 font-sans">Mapeamento iniciado em abr.2026</span></h3>
            {ausente("saving") ? (
              <div className="flex-1 px-5 pb-5"><BlocoAusente bloco="saving" referencia={referencia} compact /></div>
            ) : (
            <table className="w-full flex-1 text-left">
              <thead>
                <tr className="tbl-head font-bold text-[11px] text-center">
                  <th className="px-2 py-3">VALOR CONTRATADO R$</th>
                  <th className="px-2 py-3 border-l border-line">SAVING HISTÓRICO R$ / %</th>
                  <th className="px-2 py-3 border-l border-line">SAVING SOB PROPOSTA R$ / %</th>
                </tr>
              </thead>
              <tbody className="tbl-body-themed divide-y divide-line text-center font-medium">
                {porAreaVisual.map((a: any) => (
                  <tr key={a.area}>
                    <td className="px-2 py-3">{fmtCurrency(a.valorSaving ?? a.valor)}</td>
                    <td className="px-2 py-3 border-l border-line">
                      {fmtCurrency(a.saving_hist)}<br/>
                      <span className="text-[11px] font-normal text-ink-soft">{fmtNum(savingPct(Number(a.valorSaving ?? a.valor ?? 0), Number(a.saving_hist ?? 0), a.reducao_hist_pct))}%</span>
                    </td>
                    <td className="px-2 py-3 border-l border-line">
                      {fmtCurrency(a.saving_prop)}<br/>
                      <span className="text-[11px] font-normal text-ink-soft">{fmtNum(savingPct(Number(a.valorSaving ?? a.valor ?? 0), Number(a.saving_prop ?? 0), a.reducao_prop_pct))}%</span>
                    </td>
                  </tr>
                ))}
                <tr className="tbl-total-row font-bold border-t border-line">
                  <td className="px-2 py-3">{fmtCurrency(valorSavingVisualTotal)}</td>
                  <td className="px-2 py-3 border-l border-line">
                    {fmtCurrency(savingHistVisualTotal)}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(savingPct(valorSavingVisualTotal, savingHistVisualTotal, savingVisual?.reducao_hist_pct))}%</span>
                  </td>
                  <td className="px-2 py-3 border-l border-line">
                    {fmtCurrency(savingPropVisualTotal)}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(savingPct(valorSavingVisualTotal, savingPropVisualTotal, savingVisual?.reducao_prop_pct))}%</span>
                  </td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
        </div>
      </section>

      {/* Bloco 3: Distribuição de Volume & Fornecedores (Ref: Screenshot 3 & 13) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Distribuição de Volume por Área (% Atas)</h2>
          {ausente("top-compradores") ? (
            <BlocoAusente bloco="top-compradores" referencia={referencia} />
          ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {areasVisiveis.map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = areaPercent(area);
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className={clsx("text-center py-3", areaStyle(area).band)}>
                    <div className="font-bold">{area}</div>
                    <div className="text-[13px]">{fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))} ATAS (TOP 5) — {fmtNum(percent)}% DO TOTAL</div>
                    <div className="text-[10px] opacity-80">Área: {fmtInt(areaStats.processos)} ATAS</div>
                  </div>
                  <div className="p-4 bg-surface">
                    <div className="text-center font-bold text-[12px] uppercase text-navy-900 mb-3 underline underline-offset-4">TOP 5 COMPRADORES · ATAS SOMADAS: {fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))}</div>
                    <ul className="space-y-1.5 text-[11px] divide-y divide-line/60">
                      {tCompradores.map(c => (
                        <li key={c.responsavel} className="flex justify-between items-center pt-1.5 first:pt-0 text-navy-800">
                          <Link
                            href={processosHref({ comprador: c.responsavel, area: area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", origem: "comprador" })}
                            className="truncate pr-2 font-bold uppercase text-navy-700 underline decoration-transparent underline-offset-2 transition-colors hover:text-accent-700 hover:decoration-current"
                            title={`Abrir processos de ${c.responsavel}`}
                          >{c.responsavel}</Link>
                          <span className="shrink-0 text-navy-950 font-semibold">{c.itens} ITENS | {c.atas} ATAS</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <div>
          <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Representatividade Fornecedores</h2>
          {ausente("fornecedores") ? (
            <BlocoAusente bloco="fornecedores" referencia={referencia} />
          ) : (
          <div className="card overflow-hidden overflow-x-auto text-[11px]">
            <h3 className="tbl-subhead px-3 py-3 text-center font-bold">{areaPanorama === "TODAS" ? "FORNECEDORES GERAL" : `FORNECEDORES — ${areaPanorama}`}</h3>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="tbl-head text-center font-bold">
                  <th className="px-2 py-2">FORNECEDOR</th>
                  <th className="px-2 py-2">QTD ATAS</th>
                  <th className="px-2 py-2">QTD ITENS</th>
                  <th className="px-2 py-2">% CONCENTRAÇÃO DE ITENS</th>
                  <th className="px-2 py-2">ANÁLISE</th>
                </tr>
              </thead>
              <tbody className="tbl-body-themed divide-y divide-line text-center font-medium">
                {(fornecedoresVisual as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-5 text-ink-soft">Nenhuma linha específica reconhecida.</td></tr>
                ) : (fornecedoresVisual as any[]).map((f: any, index: number) => {
                  const analysis = f.analise || (f.concentracao >= 15 ? "Alta Concentração" : f.concentracao >= 5 ? "Volume Médio" : "Pulverizado");
                  const analysisTone = analysis.toUpperCase().includes("ALTA") ? "tone-alta" : analysis.toUpperCase().includes("MÉDIO") || analysis.toUpperCase().includes("MEDIO") ? "tone-media" : "tone-pulv";
                  return (
                    <tr key={`${f.fornecedor}-${index}`}>
                      <td className="px-2 py-2 text-left uppercase text-navy-950 font-semibold">
                        {f.fornecedor === "OUTROS FORNECEDORES" ? f.fornecedor : (
                          <Link
                            href={processosHref({ fornecedor: f.fornecedor, area: areaPanorama === "TODAS" ? undefined : areaPanorama === "INDIRETOS" ? "Indiretos" : areaPanorama === "DIRETOS" ? "Diretos" : "CAPEX", origem: "fornecedor" })}
                            className="underline decoration-transparent underline-offset-2 transition-colors hover:text-accent-700 hover:decoration-current"
                            title={`Abrir processos de ${f.fornecedor}`}
                          >{f.fornecedor}</Link>
                        )}
                      </td>
                      <td className="px-2 py-2 border-l border-line">{fmtInt(f.atas)}</td>
                      <td className="px-2 py-2 border-l border-line">{fmtInt(f.itens)}</td>
                      <td className="px-2 py-2 border-l border-line">{fmtNum(f.concentracao)}%</td>
                      <td className={clsx("px-2 py-2 border-l border-line text-left font-semibold", analysisTone)}>{analysis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
          {!ausente("fornecedores") && areaPanorama === "TODAS" && <FornecedoresAnalise fornecedores={fornecedoresVisual} />}
        </div>
      </section>

      {/* Bloco 4: Evolução Por Área (Ref: Screenshot 4 & 14) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Evolução Por Área (Por Status Atual)</h2>
        {ausente("evolucao") ? (
          <BlocoAusente bloco="evolucao" referencia={referencia} />
        ) : (
        <div className="card overflow-x-auto text-[12px]">
          <table className="w-full text-center">
            <thead>
              <tr className="tbl-head font-bold leading-tight">
                <th className="px-3 py-3 w-32 border-r border-line">ÁREAS</th>
                <th className="px-3 py-3 border-r border-line">ATAS | ITENS<br/>Concluídas<br/>(Válidas)</th>
                <th className="px-3 py-3 border-r border-line">EM<br/>ANDAMENTO</th>
                <th className="px-3 py-3 border-r border-line">ITENS COM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-line">ITENS SEM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-line">VENCIDAS</th>
                <th className="px-3 py-3">A VENCER</th>
              </tr>
            </thead>
            <tbody className="tbl-body-themed divide-y divide-line font-medium">
              {evolucaoVisual.map((e: any) => (
                <tr key={e.area}>
                  <td className={clsx("px-3 py-3 font-bold uppercase", areaStyle(e.area).band)}>
                    {e.area}
                  </td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.concluidas_atas)} ATAS<br/>{fmtInt(e.concluidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.andamento_atas)} ATAS<br/>{fmtInt(e.andamento_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.saldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.semsaldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.vencidas_atas)} ATAS<br/>{fmtInt(e.vencidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-line">{fmtInt(e.a_vencer_atas)} ATAS<br/>{fmtInt(e.a_vencer_itens)} ITENS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Bloco 5: Status das Atas por área (aba dedicada da planilha). */}
      <section aria-labelledby="status-das-atas">
        <h2 id="status-das-atas" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-2">Status das Atas</h2>
        <p className="mb-6 text-[12.5px] text-ink-soft">Carteira de renovações, vencimentos prioritários e situação dos contratos, lidos da aba de status/renovações importada junto com o resumo.</p>
        {ausente("status-atas") ? (
          <BlocoAusente bloco="status-atas" referencia={referencia} />
        ) : (
          <StatusAtas areas={statusAtas} referencia={referencia} areasVisiveis={areasVisiveis} />
        )}
      </section>

      {/* Bloco 6: Previsão de Conclusão Por Faixa (Ref: Screenshots 8 & 18) */}
      <section>
        <h2 className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-accent-500 mb-6">Indicadores - Atas em andamento</h2>
        <h3 className="text-[17px] font-sans font-semibold leading-tight tracking-normal text-navy-900 mb-4">Previsão de Conclusão por Faixa</h3>
        
        {ausente("previsao-faixas") ? (
          <BlocoAusente bloco="previsao-faixas" referencia={referencia} />
        ) : (
        <div className="space-y-8">
          {FAIXAS_PREVISAO.map(({ band, title, titleClass }) => (
            <FaixaPrevisao
              key={band}
              title={title}
              titleClass={titleClass}
              areaStats={[
                ...areasVisiveis.map((area) => ({ area, bg: areaStyle(area).band, ...prevByBand(area, band) })),
              ]}
            />
          ))}
        </div>
        )}
        {ausente("previsao-meses") ? (
          <BlocoAusente bloco="previsao-meses" referencia={referencia} />
        ) : (
          <PrevisaoMensal
            areas={[
              ...areasVisiveis.map((area) => ({ area, bg: areaStyle(area).band, buckets: monthlyForArea(area) })),
            ]}
          />
        )}
      </section>

      {/* Bases e origem */}
      <section className="mt-12 border-t border-line pt-8" data-no-print>
        <h2 className="text-[16px] font-bold text-navy-950 mb-4">Auditoria das Bases de Dados</h2>
        <DatasetsPanel />
      </section>
    </div>
  );
}

function evolutionToResumo(evolution: any): ResumoKpis {
  const value = (snake: string, camel: string) => evolution?.[snake] ?? evolution?.[camel] ?? null;
  return {
    concluidasAtas: value("concluidas_atas", "concluidasAtas"),
    concluidasItens: value("concluidas_itens", "concluidasItens"),
    andamentoAtas: value("andamento_atas", "andamentoAtas"),
    andamentoItens: value("andamento_itens", "andamentoItens"),
    saldoItens: value("saldo_itens", "saldoItens"),
    consumidoItens: value("semsaldo_itens", "semSaldoItens"),
    vencidasAtas: value("vencidas_atas", "vencidasAtas"),
    vencidasItens: value("vencidas_itens", "vencidasItens"),
    aVencerAtas: value("a_vencer_atas", "aVencerAtas"),
    aVencerItens: value("a_vencer_itens", "aVencerItens"),
  };
}

function snapshotKpisForArea(snapshot: DashboardSnapshotPayload, area: PanoramaAreaFilter): ResumoKpis {
  return area === "TODAS" ? snapshot.kpis : evolutionToResumo(snapshot.evolucao[area]);
}

/* --- Componentes de Gráficos --- */

function BlocoAusente({ bloco, referencia, compact = false }: { bloco: PanoramaBlock; referencia: string | null; compact?: boolean }) {
  const info = SNAPSHOT_BLOCKS[bloco];
  return (
    <div
      role="status"
      className={clsx("rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/40 text-center", compact ? "px-4 py-6" : "px-6 py-10")}
    >
      <SearchX size={22} className="mx-auto text-navy-400" aria-hidden="true" />
      <p className="mt-2 text-[14px] font-bold text-navy-900">Bloco não encontrado na planilha importada</p>
      <p className="mx-auto mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-soft">
        A importação{referencia ? ` de ${formatReferenceDate(referencia)}` : " atual"} não trazia <strong className="font-semibold text-navy-800">{info.label.toLowerCase()}</strong>; por isso nenhum número é exibido aqui — não significa zero.
      </p>
      <p className="mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-navy-800">Esperado na planilha:</span> {info.esperado}.
      </p>
    </div>
  );
}

function formatReferenceDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

/** dd/mm, como nos títulos dos cards do SharePoint. */
function formatShortDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

function FaixaPrevisao({ title, titleClass = "band-faixa-ok", areaStats }: { title: string, titleClass?: string, areaStats: any[] }) {
  return (
    <div>
      <div className={clsx("rounded-lg border py-2 text-center font-bold mb-4", titleClass)}>{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("rounded-md py-1 text-center text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="tnum mb-6 font-sans leading-tight tracking-normal text-ok-700">
              <div className="text-[18px] font-bold">{String(s.atas).padStart(2, '0')} ATAS</div>
              <div className="text-[18px] font-bold">{String(s.itens).padStart(2, '0')} ITENS</div>
            </div>
            <div className="space-y-3">
              {s.buyers.map((b: any, index: number) => (
                <div key={`${b.name}-${index}`} className="border-b border-line/60 pb-2 leading-tight">
                  <div className="text-[11px] font-bold text-navy-900 uppercase truncate" title={b.name}>{b.name}</div>
                  {(b.atas !== null || b.itens !== null) && (
                    <div className="text-[10px] font-semibold text-ink-soft">{fmtInt(b.atas)} ATAS · {fmtInt(b.itens)} ITENS</div>
                  )}
                </div>
              ))}
              {s.buyers.length === 0 && <p className="text-[11px] text-ink-soft">Nenhum comprador reconhecido nesta faixa.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrevisaoMensal({ areas }: { areas: Array<{ area: string; bg: string; buckets: Array<{ label: string; atas: number; itens: number }> }> }) {
  const bucketColors = ["bucket-0", "bucket-1", "bucket-2", "bucket-3"];
  return (
    <section className="space-y-6 border-t border-line pt-2" aria-labelledby="previsao-por-mes">
      <h3 id="previsao-por-mes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">
        Previsão de Conclusão por Mês
      </h3>
      <div className="space-y-7">
        {areas.map(({ area, bg, buckets }) => (
          <div key={area}>
            <div className={clsx("mb-3 rounded-md border border-line py-2 text-center text-[16px] font-bold", bg)}>{area}</div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {buckets.map((bucket, index) => (
                <div key={`${area}-${bucket.label}`} className="relative min-w-0">
                  <div className={clsx("flex min-h-[58px] flex-col items-center justify-center rounded-lg border border-line px-1 text-center font-sans leading-tight tracking-normal", bucketColors[index % 4])}>
                    <span className="tnum text-[13px] font-semibold">{String(bucket.atas).padStart(2, "0")} ATAS</span>
                    <span className="tnum text-[13px] font-semibold">{String(bucket.itens).padStart(2, "0")} ITENS</span>
                  </div>
                  <div className="mt-2 flex min-h-7 items-start justify-center text-center text-[11px] font-sans leading-tight tracking-normal text-ink-soft">
                    <span>{bucket.label}</span>
                    {index < buckets.length - 1 && <span className="ml-2 hidden font-bold text-navy-900 sm:inline" aria-hidden="true">→</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
