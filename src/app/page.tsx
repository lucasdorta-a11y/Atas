"use client";

import Link from "next/link";
import { FileStack, FileUp } from "lucide-react";
import { getStaticDashboardData, type StaticDashboardData } from "@/lib/static-dashboard";
import { STATIC_DATA_EVENT } from "@/lib/static-store";
import { useCallback, useEffect, useState } from "react";
import { DatasetsPanel } from "@/components/datasets-panel";
import { EmptyState, PageHeader } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import clsx from "clsx";

export default function PanoramaPage() {
  const [data, setData] = useState<StaticDashboardData | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setData(await getStaticDashboardData());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar os dados locais.");
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

  const { kpis, porArea, topCompradores, fornecedores, evolucao, renovacoes, previsoes, currentSnapshot, previousSnapshot, savingTotal } = data;

  // Helpers para o funil de renovação
  const getRenov = (area: string, status: string) => {
    const row = (renovacoes as any[]).find(r => r.area === area && r.status === status);
    return { atas: row?.atas || 0, itens: row?.itens || 0 };
  };

  // Previsões de Conclusão por Faixa
  const prevByAreaAndRange = (area: string, rangeFunc: (dias: number) => boolean) => {
    const rows = (previsoes as any[]).filter(r => r.area === area && r.dias !== null && rangeFunc(r.dias));
    const atas = rows.reduce((acc, r) => acc + r.atas, 0);
    const itens = rows.reduce((acc, r) => acc + r.itens, 0);
    // Agrupa por comprador; linhas sem nome preservam apenas o total da faixa.
    const buyersMap = new Map<string, { atas: number; itens: number }>();
    for (const r of rows) {
      if (!r.responsavel) continue;
      const current = buyersMap.get(r.responsavel) || { atas: 0, itens: 0 };
      current.atas += r.atas;
      current.itens += r.itens;
      buyersMap.set(r.responsavel, current);
    }
    const buyers = Array.from(buyersMap.entries())
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.itens - a.itens || b.atas - a.atas);
    return { atas, itens, buyers };
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
      />

      {/* Bloco 1: três gráficos da semana anterior e três da semana atual. */}
      <section aria-labelledby="comparacao-semanal" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="comparacao-semanal" className="text-[20px] font-display text-navy-900">Leitura dos gráficos</h2>
            <p className="mt-1 text-[12.5px] text-ink-soft">A semana anterior é preservada no IndexedDB deste navegador e substituída pela leitura imediatamente anterior após uma nova importação.</p>
          </div>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-[12px] font-semibold text-navy-700">
            Referência anterior: {formatReferenceDate(previousSnapshot?.referenceDate)}
          </span>
        </div>
        {previousSnapshot && <SnapshotCharts title={`Semana anterior · ${formatReferenceDate(previousSnapshot.referenceDate)}`} kpis={previousSnapshot.kpis} muted />}
        <SnapshotCharts
          title={`Semana atual${currentSnapshot?.referenceDate ? ` · ${formatReferenceDate(currentSnapshot.referenceDate)}` : ""}`}
          kpis={{
            concluidasAtas: kpis.concluidosAtas,
            concluidasItens: kpis.concluidosItens,
            saldoItens: kpis.saldoItens,
            consumidoItens: kpis.consumidoItens,
            aVencerAtas: kpis.aVencerAtas,
            aVencerItens: kpis.aVencerItens,
            vencidasAtas: kpis.vencidasAtas,
            vencidasItens: kpis.vencidasItens,
          }}
        />
      </section>

      {/* Bloco 2: Valor Contratado & Saving (Ref: Screenshot 2 & 12) */}
      <section className="card overflow-hidden text-[13px]">
        <div className="grid lg:grid-cols-2 divide-x divide-line">
          <div>
            <h3 className="px-5 py-3 text-[18px] text-navy-900 font-display">Valor Contratado Por Área</h3>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold">
                  <th className="px-5 py-3">ÁREAS</th>
                  <th className="px-5 py-3 text-right">VALOR CONTRATADO R$</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white">
                {(porArea as any[]).map(a => (
                  <tr key={a.area} className={a.area.toUpperCase() === "DIRETOS" ? "bg-diretos-500 text-white font-bold" : a.area.toUpperCase() === "INDIRETOS" ? "bg-indiretos-500 text-white font-bold" : a.area.toUpperCase() === "CAPEX" ? "bg-capex-100 font-bold" : "bg-neutral-100 font-bold"}>
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
          </div>
          <div>
            <h3 className="px-5 py-3 text-[18px] text-navy-900 font-display">Saving <span className="text-[14px] text-danger-700 block mt-1 font-sans">Mapeamento iniciado em abr.2026</span></h3>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white font-bold text-[11px] text-center">
                  <th className="px-2 py-3">VALOR CONTRATADO R$</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING HISTÓRICO R$ / %</th>
                  <th className="px-2 py-3 border-l border-white/20">SAVING SOB PROPOSTA R$ / %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-b-4 border-white text-center font-medium bg-[#E6E6E6]">
                {(porArea as any[]).map(a => (
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
          </div>
        </div>
      </section>

      {/* Bloco 3: Distribuição de Volume & Fornecedores (Ref: Screenshot 3 & 13) */}
      <section className="space-y-6">
        <div>
          <h2 className="text-[20px] font-display text-navy-900 mb-4">Distribuição de Volume por Área (% Atas)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
              const areaStats = (porArea as any[]).find(a => a.area.toUpperCase() === area) || { processos: 0 };
              const percent = areaPercent(area);
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className="bg-navy-950 text-white text-center py-3">
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
        </div>

        <div>
          <h2 className="text-[20px] font-display text-navy-900 mb-4">Representatividade Fornecedores (Top 20)</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {["INDIRETOS", "DIRETOS", "CAPEX"].map((area) => {
              const areaSuppliers = (fornecedores as any[]).filter((item) => item.area?.toUpperCase() === area);
              return (
                <div key={area} className="card overflow-hidden overflow-x-auto text-[11px]">
                  <h3 className={clsx("px-3 py-2 text-center font-bold text-white", area === "INDIRETOS" ? "bg-indiretos-600" : area === "DIRETOS" ? "bg-diretos-500" : "bg-capex-500")}>
                    FORNECEDORES — {area}
                  </h3>
                  <table className="w-full text-left">
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
                      {areaSuppliers.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-5 text-ink-soft">Nenhuma linha específica reconhecida.</td></tr>
                      ) : areaSuppliers.map((f: any, index: number) => {
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
              );
            })}
          </div>
        </div>
      </section>

      {/* Bloco 4: Evolução Por Área (Ref: Screenshot 4 & 14) */}
      <section>
        <h2 className="text-[20px] font-display text-navy-900 mb-4">Evolução Por Área (Por Status Atual)</h2>
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
              {(evolucao as any[]).map(e => (
                <tr key={e.area}>
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", e.area.toUpperCase() === "DIRETOS" ? "bg-diretos-500" : e.area.toUpperCase() === "INDIRETOS" ? "bg-indiretos-500" : e.area.toUpperCase() === "CAPEX" ? "bg-capex-500" : "bg-neutral-500")}>
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
      </section>

      {/* Bloco 5: Status de Renovações (Ref: Screenshots 5, 6, 7 & 15, 16, 17) */}
      <section>
        <h2 className="text-[24px] font-display text-accent-500 mb-6 font-bold">Status de Renovações</h2>
        <div className="space-y-8">
          {["INDIRETOS", "DIRETOS", "CAPEX"].map(area => {
            const naoIniciado = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Não Iniciado");
            const naoRenov = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Não Será Renovado");
            const novoProj = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Criado Novo Projeto");
            const emRenov = getRenov(area === "INDIRETOS" ? "Indiretos" : area === "DIRETOS" ? "Diretos" : "CAPEX", "Em Renovação");

            return (
              <div key={area}>
                <div className={clsx("w-full py-2 text-center text-white font-bold mb-3 tracking-wider", area === "INDIRETOS" ? "bg-indiretos-600" : area === "DIRETOS" ? "bg-diretos-500" : "bg-capex-500")}>
                  {area}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-[12px]">
                  <RenovBox title="NÃO INICIADO" data={naoIniciado} bg="bg-[#f0e6f5]" />
                  <RenovBox title="NÃO SERÁ RENOVADO" data={naoRenov} bg="bg-[#f7e6e6]" />
                  <RenovBox title="CRIADO NOVO PROJETO" data={novoProj} bg="bg-[#fbdca3]" />
                  <RenovBox title="EM RENOVAÇÃO" data={emRenov} bg="bg-[#eaf5d8]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bloco 6: Previsão de Conclusão Por Faixa (Ref: Screenshots 8 & 18) */}
      <section>
        <h2 className="text-[24px] font-display text-accent-500 mb-6 font-bold">Indicadores - Atas em andamento</h2>
        <h3 className="text-[18px] text-navy-900 mb-4 font-display">Previsão de Conclusão Por Faixa (Até 60 dias)</h3>
        
        <div className="space-y-8">
          <FaixaPrevisao title="Previstas para concluir nos próximos 15 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d >= 0 && d <= 15) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d >= 0 && d <= 15) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d >= 0 && d <= 15) }
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 30 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d > 15 && d <= 30) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d > 15 && d <= 30) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d > 15 && d <= 30) }
          ]}/>
          <FaixaPrevisao title="Previstas para concluir até 60 dias" areaStats={[
            { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d > 30 && d <= 60) },
            { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d > 30 && d <= 60) },
            { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d > 30 && d <= 60) }
          ]}/>
          <FaixaPrevisao
            title="Previsões vencidas"
            titleClass="bg-[#b42318] text-white border-danger-700"
            areaStats={[
              { area: "INDIRETOS", bg: "bg-[#0b7c7b]", ...prevByAreaAndRange("Indiretos", d => d < 0) },
              { area: "DIRETOS", bg: "bg-[#008cff]", ...prevByAreaAndRange("Diretos", d => d < 0) },
              { area: "CAPEX", bg: "bg-[#fca500]", ...prevByAreaAndRange("CAPEX", d => d < 0) }
            ]}
          />
        </div>
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

function formatReferenceDate(value: string | null | undefined): string {
  if (!value) return "sem data";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

type SnapshotChartKpis = {
  concluidasAtas: number | null;
  concluidasItens: number | null;
  saldoItens: number | null;
  consumidoItens: number | null;
  aVencerAtas: number | null;
  aVencerItens: number | null;
  vencidasAtas: number | null;
  vencidasItens: number | null;
};

function SnapshotCharts({ title, kpis, muted = false }: { title: string; kpis: SnapshotChartKpis; muted?: boolean }) {
  return (
    <div className={clsx("rounded-2xl border p-4 sm:p-5", muted ? "border-line bg-navy-50/40" : "border-line bg-surface")}>
      <h3 className="mb-4 text-[15px] font-bold uppercase tracking-wide text-navy-900">{title}</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        <MiniMetricChart
          title="ATA CONCLUÍDAS (VÁLIDAS)"
          groups={[{ label: "VÁLIDO", bars: [{ label: "ATAS", value: kpis.concluidasAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.concluidasItens, color: "#e06e1f" }] }]}
        />
        <MiniMetricChart
          title="ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)"
          groups={[{ label: "COM SALDO", bars: [{ label: "ITENS", value: kpis.saldoItens, color: "#0c2338" }] }, { label: "CONSUMIDO", bars: [{ label: "ITENS", value: kpis.consumidoItens, color: "#e06e1f" }] }]}
        />
        <MiniMetricChart
          title="ATAS VENCIDAS E A VENCER"
          groups={[{ label: "RENOVAR", bars: [{ label: "ATAS", value: kpis.aVencerAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.aVencerItens, color: "#e06e1f" }] }, { label: "VENCIDO", bars: [{ label: "ATAS", value: kpis.vencidasAtas, color: "#0c2338" }, { label: "ITENS", value: kpis.vencidasItens, color: "#e06e1f" }] }]}
        />
      </div>
    </div>
  );
}

function MiniMetricChart({ title, groups }: { title: string; groups: Array<{ label: string; bars: Array<{ label: string; value: number | null; color: string }> }> }) {
  const max = Math.max(1, ...groups.flatMap((group) => group.bars.map((bar) => bar.value ?? 0)));
  return (
    <div className="rounded-xl border border-line bg-white p-3" aria-label={title}>
      <h4 className="min-h-8 text-center text-[11px] font-bold uppercase leading-tight text-navy-900">{title}</h4>
      <div className="mt-3 flex h-32 items-end justify-around gap-2 border-b border-line px-1">
        {groups.map((group) => (
          <div key={group.label} className="flex h-full flex-1 items-end justify-center gap-1">
            {group.bars.map((bar) => {
              const value = bar.value ?? 0;
              return (
                <div key={`${group.label}-${bar.label}`} className="flex h-full w-7 flex-col items-center justify-end">
                  <span className="mb-1 text-[10px] font-bold text-navy-900">{fmtInt(value)}</span>
                  <div className="w-full rounded-t-sm" style={{ height: `${Math.max(value ? 5 : 2, (value / max) * 78)}px`, backgroundColor: bar.color }} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-around gap-2 text-center text-[9px] font-bold uppercase text-ink-soft">
        {groups.map((group) => <span key={group.label} className="flex-1">{group.label}</span>)}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-ink-soft">
        {[...new Map(groups.flatMap((group) => group.bars.map((bar) => [bar.label, bar.color] as const))).entries()].map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1"><span className="h-2 w-2" style={{ backgroundColor: color }} aria-hidden="true" />{label}</span>
        ))}
      </div>
    </div>
  );
}

function KpiChartCard({ title, bars, groupLabel }: { title: string, bars: { label: string, val: number, color: string }[], groupLabel?: string }) {
  const max = Math.max(...bars.map(b => b.val), 1);
  return (
    <div className="card p-4 border border-line flex flex-col items-center justify-center">
      <h3 className="text-[12px] font-bold text-neutral-500 uppercase tracking-wide text-center mb-6 h-8">{title}</h3>
      <div className="flex items-end gap-2 h-24 mb-2 relative">
        {bars.map((b, i) => (
          <div key={b.label} className="flex flex-col items-center justify-end w-10">
            <span className="text-[11px] font-bold text-white px-1 py-0.5 rounded-sm z-10" style={{ backgroundColor: b.color, transform: 'translateY(5px)' }}>
              {b.val}
            </span>
            <div className="w-full" style={{ height: `${(b.val / max) * 60}px`, backgroundColor: b.color }} />
          </div>
        ))}
      </div>
      <div className="w-full border-t border-line mt-1 relative pt-2 text-center text-[10px] font-bold text-neutral-500">
        {groupLabel ? groupLabel : (
          <div className="flex gap-4 justify-center">
            {bars.map(b => <span key={b.label}>{b.label}</span>)}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 mt-4 items-end w-full pr-4 text-[10px] font-bold text-neutral-500">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2" style={{ backgroundColor: b.color }} />
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RenovBox({ title, data, bg }: { title: string, data: { atas: number, itens: number }, bg: string }) {
  return (
    <div className="flex flex-col border border-line">
      <div className="bg-navy-950 text-white font-bold py-2 px-1 text-[11px]">{title}</div>
      <div className={clsx("flex-1 py-4 font-medium flex flex-col items-center justify-center min-h-[60px]", bg)}>
        {data.atas === 0 && data.itens === 0 ? (
          <span className="text-neutral-500">0</span>
        ) : (
          <>
            <span className="text-navy-950">{fmtInt(data.atas)} ATAS</span>
            <span className="text-navy-950">{fmtInt(data.itens)} ITENS</span>
          </>
        )}
      </div>
    </div>
  );
}

function FaixaPrevisao({ title, titleClass = "bg-[#dcf0cf] text-navy-950", areaStats }: { title: string, titleClass?: string, areaStats: any[] }) {
  return (
    <div>
      <div className={clsx("border border-line py-2 text-center font-bold mb-4", titleClass)}>{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("py-1 text-center text-white text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="text-[#0d952e] font-display mb-6">
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
