"use client";

import Link from "next/link";
import { FileStack, FileUp, RefreshCw, SearchX } from "lucide-react";
import { getStaticDashboardData, type PanoramaBlock, type StaticDashboardData } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";
import { SNAPSHOT_BLOCKS, type ForecastBand, type SnapshotArea, type SnapshotMonthlyForecastRow } from "@/lib/dashboard-snapshot";
import { useCallback, useEffect, useState } from "react";
import { DatasetsPanel } from "@/components/datasets-panel";
import { ResumoCards } from "@/components/resumo-cards";
import { AtasConcluidas } from "@/components/atas-concluidas";
import { FornecedoresAnalise } from "@/components/fornecedores-analise";
import { StatusAtas } from "@/components/status-atas";
import { EmptyState, PageHeader, areaStyle } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
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
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 text-[13px] font-semibold text-navy-800 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
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
  const areaVisualOrder = ["INDIRETOS", "DIRETOS", "CAPEX"];
  const porAreaVisual = [...(porArea as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));
  const evolucaoVisual = [...(evolucao as any[])].sort((a, b) => areaVisualOrder.indexOf(String(a.area).toUpperCase()) - areaVisualOrder.indexOf(String(b.area).toUpperCase()));

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
    const total = (porArea as any[]).reduce((sum, item) => sum + Number(item.processos || 0), 0);
    if (total <= 0 || index < 0) return 0;
    if (index === ordered.length - 1) {
      const prior = (porArea as any[]).filter((item) => ordered.indexOf(String(item.area).toUpperCase()) < index)
        .reduce((sum, item) => sum + Number(((Number(item.processos || 0) / total) * 100).toFixed(2)), 0);
      return Math.max(0, Number((100 - prior).toFixed(2)));
    }
    const current = (porArea as any[]).find((item) => String(item.area).toUpperCase() === area);
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
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 text-[13px] font-semibold text-navy-800 shadow-sm transition-colors hover:bg-navy-50 disabled:cursor-wait disabled:opacity-70"
            aria-label="Atualizar e reprocessar o panorama com os dados locais"
          >
            <RefreshCw size={16} aria-hidden="true" className={atualizando ? "animate-spin" : undefined} />
            {atualizando ? "Atualizando…" : "Atualizar panorama"}
          </button>
        )}
      />

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
          <div className="rounded-xl border border-line bg-white p-4 text-[12.5px]">
            <h3 className="font-semibold text-navy-900">Base atual</h3>
            <p className="mt-1 text-ink-soft">Data de referência: {formatReferenceDate(currentSnapshot?.referenceDate)}</p>
            <p className="mt-1 break-words text-ink-soft">Arquivo: {currentSnapshot ? (data.snapshotHistory[0]?.fileName || "Nome do arquivo não disponível") : "Sem snapshot importado; indicadores disponíveis vêm dos registros operacionais."}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-4 text-[12.5px]">
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
            kpis={previousSnapshot.kpis}
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
            kpis={{
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
            }}
          />
        )}
      </section>

      {/* Bloco 1b: atas que passaram a FINALIZADO desde a importação anterior. */}
      <section aria-labelledby="atas-concluidas-recentes" className="space-y-4">
        <div>
          <h2 id="atas-concluidas-recentes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">Atas Concluídas desde a Última Atualização</h2>
          <p className="mt-1 text-[12.5px] text-ink-soft">Atas com ETAPA ATUAL = FINALIZADO na aba “Base - Atas Em andamento” que não estavam finalizadas na importação anterior. O fornecedor vem da aba “Base - Controle de Contratos”, pelo nº do contrato.</p>
        </div>
        {ausente("atas-concluidas") ? (
          <BlocoAusente bloco="atas-concluidas" referencia={referencia} />
        ) : (
          <AtasConcluidas dados={atasConcluidas} referencia={referencia} />
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
                <tr className="bg-navy-950 text-white font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="h-full divide-y divide-white border-b-4 border-white">
                {porAreaVisual.map((a) => (
                  <tr key={a.area} className={clsx("font-bold text-white", areaStyle(a.area).band)}>
                    <td className="px-5 py-3 uppercase">{a.area}</td>
                    <td className="px-5 py-3 text-right">{fmtCurrency(a.valor)}</td>
                  </tr>
                ))}
                <tr className="bg-[#2A4D14] text-white font-bold">
                  <td className="px-5 py-3">TOTAL</td>
                  <td className="px-5 py-3 text-right">{fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.valor, 0))}</td>
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
                <tr className="bg-navy-950 text-white font-bold text-[11px] text-center">
                  <th className="px-2 py-3">VALOR CONTRATADO R$</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING HISTÓRICO R$ / %</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING SOB PROPOSTA R$ / %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white text-center font-medium bg-[#E6E6E6]">
                {porAreaVisual.map((a: any) => (
                  <tr key={a.area}>
                    <td className="px-2 py-3">{fmtCurrency(a.valorSaving ?? a.valor)}</td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_hist)}<br/>
                      <span className="text-[11px] font-normal">{a.reducao_hist_pct !== null && a.reducao_hist_pct !== undefined ? fmtNum(a.reducao_hist_pct) : (a.valorSaving > 0 ? fmtNum((a.saving_hist / a.valorSaving) * 100) : "0")}%</span>
                    </td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_prop)}<br/>
                      <span className="text-[11px] font-normal">{a.reducao_prop_pct !== null && a.reducao_prop_pct !== undefined ? fmtNum(a.reducao_prop_pct) : (a.valorSaving > 0 ? fmtNum((a.saving_prop / a.valorSaving) * 100) : "0")}%</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#b3d482] font-bold">
                  <td className="px-2 py-3">{fmtCurrency(savingTotal?.valorSaving ?? (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))}</td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency(savingTotal?.saving_hist ?? (porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0))}<br/>
                    <span className="text-[11px] font-normal">{savingTotal?.reducao_hist_pct !== null && savingTotal?.reducao_hist_pct !== undefined
                      ? `${fmtNum(savingTotal.reducao_hist_pct)}%`
                      : `${fmtNum((((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0)) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))) * 100)}%`}</span>
                  </td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency(savingTotal?.saving_prop ?? (porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0))}<br/>
                    <span className="text-[11px] font-normal">{savingTotal?.reducao_prop_pct !== null && savingTotal?.reducao_prop_pct !== undefined
                      ? `${fmtNum(savingTotal.reducao_prop_pct)}%`
                      : `${fmtNum((((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0)) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + (a.valorSaving ?? a.valor), 0))) * 100)}%`}</span>
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
            {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = areaPercent(area);
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className={clsx("text-center py-3 text-white", areaStyle(area).band)}>
                    <div className="font-bold">{area}</div>
                    <div className="text-[13px]">{fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))} ATAS (TOP 5) — {fmtNum(percent)}% DO TOTAL</div>
                    <div className="text-[10px] text-white/75">Área: {fmtInt(areaStats.processos)} ATAS</div>
                  </div>
                  <div className="p-4 bg-neutral-100">
                    <div className="text-center font-bold text-[12px] uppercase text-navy-900 mb-3 underline underline-offset-4">TOP 5 COMPRADORES · ATAS SOMADAS: {fmtInt(tCompradores.reduce((sum: number, item: any) => sum + item.atas, 0))}</div>
                    <ul className="space-y-1 text-[11px]">
                      {tCompradores.map(c => (
                        <li key={c.responsavel} className="flex justify-between items-center text-navy-800">
                          <span className="font-bold text-navy-500 uppercase truncate pr-2">{c.responsavel}</span>
                          <span className="shrink-0 text-navy-950 font-medium">{c.itens} ITENS | {c.atas} ATAS</span>
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
            <h3 className="bg-[#111c75] px-3 py-3 text-center font-bold text-white">FORNECEDORES GERAL</h3>
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="bg-navy-950 text-white text-center font-bold">
                  <th className="px-2 py-2">FORNECEDOR</th>
                  <th className="px-2 py-2">QTD ATAS</th>
                  <th className="px-2 py-2">QTD ITENS</th>
                  <th className="px-2 py-2">% CONCENTRAÇÃO DE ITENS</th>
                  <th className="px-2 py-2">ANÁLISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-center font-medium">
                {(fornecedores as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-5 text-ink-soft">Nenhuma linha específica reconhecida.</td></tr>
                ) : (fornecedores as any[]).map((f: any, index: number) => {
                  const analysis = f.analise || (f.concentracao >= 15 ? "Alta Concentração" : f.concentracao >= 5 ? "Volume Médio" : "Pulverizado");
                  const analysisTone = analysis.toUpperCase().includes("ALTA") ? "bg-[#f3baba]" : analysis.toUpperCase().includes("MÉDIO") || analysis.toUpperCase().includes("MEDIO") ? "bg-[#fdf0a6]" : "bg-[#f2e6b1]";
                  return (
                    <tr key={`${f.fornecedor}-${index}`}>
                      <td className="px-2 py-2 text-left uppercase text-navy-950">{f.fornecedor}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtInt(f.atas)}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtInt(f.itens)}</td>
                      <td className="px-2 py-2 border-l border-white">{fmtNum(f.concentracao)}%</td>
                      <td className={clsx("px-2 py-2 border-l border-white text-left", analysisTone)}>{analysis}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
          {!ausente("fornecedores") && <FornecedoresAnalise fornecedores={fornecedores} />}
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
              <tr className="bg-navy-950 text-white font-bold leading-tight">
                <th className="px-3 py-3 w-32 border-r border-white/20">ÁREAS</th>
                <th className="px-3 py-3 border-r border-white/20">ATAS | ITENS<br/>Concluídas<br/>(Válidas)</th>
                <th className="px-3 py-3 border-r border-white/20">EM<br/>ANDAMENTO</th>
                <th className="px-3 py-3 border-r border-white/20">ITENS COM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-white/20">ITENS SEM<br/>SALDO<br/>(Válidos)</th>
                <th className="px-3 py-3 border-r border-white/20">VENCIDAS</th>
                <th className="px-3 py-3">A VENCER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-navy-900 font-medium">
              {evolucaoVisual.map((e: any) => (
                <tr key={e.area}>
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", areaStyle(e.area).band)}>
                    {e.area}
                  </td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.concluidas_atas)} ATAS<br/>{fmtInt(e.concluidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.andamento_atas)} ATAS<br/>{fmtInt(e.andamento_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.saldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.semsaldo_itens)}</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.vencidas_atas)} ATAS<br/>{fmtInt(e.vencidas_itens)} ITENS</td>
                  <td className="px-3 py-3 border-l border-white">{fmtInt(e.a_vencer_atas)} ATAS<br/>{fmtInt(e.a_vencer_itens)} ITENS</td>
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
        <p className="mb-6 text-[12.5px] text-ink-soft">Carteira de cada área, vencimentos prioritários e distribuição por comprador(a), lidos da aba “Status das Atas” importada junto com o resumo.</p>
        {ausente("status-atas") ? (
          <BlocoAusente bloco="status-atas" referencia={referencia} />
        ) : (
          <StatusAtas areas={statusAtas} referencia={referencia} />
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
                { area: "INDIRETOS", bg: areaStyle("Indiretos").band, ...prevByBand("Indiretos", band) },
                { area: "DIRETOS", bg: areaStyle("Diretos").band, ...prevByBand("Diretos", band) },
                { area: "CAPEX", bg: areaStyle("CAPEX").band, ...prevByBand("CAPEX", band) },
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
              { area: "INDIRETOS", bg: areaStyle("Indiretos").band, buckets: monthlyForArea("Indiretos") },
              { area: "DIRETOS", bg: areaStyle("Diretos").band, buckets: monthlyForArea("Diretos") },
              { area: "CAPEX", bg: areaStyle("CAPEX").band, buckets: monthlyForArea("CAPEX") },
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

function FaixaPrevisao({ title, titleClass = "bg-[#dcf0cf] text-navy-950", areaStats }: { title: string, titleClass?: string, areaStats: any[] }) {
  return (
    <div>
      <div className={clsx("border border-line py-2 text-center font-bold mb-4", titleClass)}>{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("py-1 text-center text-white text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="tnum mb-6 font-sans leading-tight tracking-normal text-[#0d952e]">
              <div className="text-[18px] font-bold">{String(s.atas).padStart(2, '0')} ATAS</div>
              <div className="text-[18px] font-bold">{String(s.itens).padStart(2, '0')} ITENS</div>
            </div>
            <div className="space-y-3">
              {s.buyers.map((b: any, index: number) => (
                <div key={`${b.name}-${index}`} className="border-b border-line/60 pb-2 leading-tight">
                  <div className="text-[11px] font-bold text-navy-900 uppercase truncate" title={b.name}>{b.name}</div>
                  <div className="text-[10px] font-semibold text-ink-soft">{fmtInt(b.atas)} ATAS · {fmtInt(b.itens)} ITENS</div>
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
  const bucketColors = ["bg-[#e2e2e2]", "bg-[#f9dfa8]", "bg-[#edf8df]", "bg-[#f7e7e7]"];
  return (
    <section className="space-y-6 border-t border-line pt-2" aria-labelledby="previsao-por-mes">
      <h3 id="previsao-por-mes" className="text-[20px] font-sans font-semibold leading-tight tracking-normal text-navy-900">
        Previsão de Conclusão por Mês
      </h3>
      <div className="space-y-7">
        {areas.map(({ area, bg, buckets }) => (
          <div key={area}>
            <div className={clsx("mb-3 border border-navy-900 py-2 text-center text-[16px] font-bold text-white", bg)}>{area}</div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {buckets.map((bucket, index) => (
                <div key={`${area}-${bucket.label}`} className="relative min-w-0">
                  <div className={clsx("flex min-h-[58px] flex-col items-center justify-center px-1 text-center font-sans leading-tight tracking-normal", bucketColors[index])}>
                    <span className="tnum text-[13px] font-semibold text-navy-950">{String(bucket.atas).padStart(2, "0")} ATAS</span>
                    <span className="tnum text-[13px] font-semibold text-navy-950">{String(bucket.itens).padStart(2, "0")} ITENS</span>
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
