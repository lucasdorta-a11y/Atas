import Link from "next/link";
import type { Metadata } from "next";
import { FileStack, FileUp, ShieldAlert, AlertTriangle } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard-data";
import { DatasetsPanel } from "@/components/datasets-panel";
import { AreaTag, EmptyState, PageHeader } from "@/components/ui";
import { fmtCurrency, fmtDateLong, fmtInt, fmtNum } from "@/lib/format";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panorama" };

export default async function PanoramaPage() {
  const data = await getDashboardData();
  const hoje = new Date().toISOString().slice(0, 10);

  if (!data.hasData) {
    return (
      <>
        <PageHeader
          overline="Panorama geral"
          title="Giro de Atas"
          description="Painel interno de compras e Atas de Registro de Preços. Importe suas planilhas operacionais e de snapshots para alimentar os indicadores."
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

  const { kpis, porArea, topCompradores, fornecedores, evolucao, renovacoes, previsoes } = data;

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
    // Agrupa por comprador
    const buyersMap = new Map<string, number>();
    for (const r of rows) {
      buyersMap.set(r.responsavel, (buyersMap.get(r.responsavel) || 0) + r.atas);
    }
    const buyers = Array.from(buyersMap.entries()).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    return { atas, itens, buyers };
  };

  return (
    <div className="space-y-8">
      <PageHeader
        overline={`Panorama geral · calculado em ${fmtDateLong(hoje)}`}
        title="Gestão Atas Concluídas - Compras"
      />

      {/* Bloco 1: KPIs Principais (Ref: Screenshot 1 & 11) */}
      <section className="grid gap-4 md:grid-cols-3">
        <KpiChartCard 
          title="ATA CONCLUÍDAS (VÁLIDAS)" 
          bars={[{ label: "ATAS", val: kpis.concluidosAtas, color: "#0c2338" }, { label: "ITENS", val: kpis.concluidosItens, color: "#e06e1f" }]}
          groupLabel="VÁLIDO"
        />
        <KpiChartCard 
          title="ITENS COM SALDOS E CONSUMIDOS (VÁLIDOS)" 
          bars={[{ label: "COM SALDO", val: kpis.saldoItens, color: "#0c2338" }, { label: "CONSUMIDO", val: kpis.consumidoItens, color: "#e06e1f" }]}
        />
        <KpiChartCard 
          title="ATAS VENCIDAS E A VENCER" 
          bars={[
            { label: "RENOVAR", val: kpis.vencidasVencerAtas, color: "#0c2338" }, 
            { label: "VENCIDO", val: kpis.vencidasVencerItens, color: "#e06e1f" }
          ]}
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
                  <tr key={a.area} className={a.area === "DIRETOS" ? "bg-diretos-500 text-white font-bold" : a.area === "INDIRETOS" ? "bg-indiretos-500 text-white font-bold" : a.area === "CAPEX" ? "bg-capex-100 font-bold" : "bg-neutral-100 font-bold"}>
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
                    <td className="px-2 py-3">{fmtCurrency(a.valor)}</td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_hist)}<br/>
                      <span className="text-[11px] font-normal">{a.valor > 0 ? fmtNum((a.saving_hist / a.valor) * 100) : "0"}%</span>
                    </td>
                    <td className="px-2 py-3 border-l border-white">
                      {fmtCurrency(a.saving_prop)}<br/>
                      <span className="text-[11px] font-normal">{a.valor > 0 ? fmtNum((a.saving_prop / a.valor) * 100) : "0"}%</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#b3d482] font-bold">
                  <td className="px-2 py-3">{fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.valor, 0))}</td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0))}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(((porArea as any[]).reduce((acc, a) => acc + a.saving_hist, 0) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + a.valor, 0))) * 100)}%</span>
                  </td>
                  <td className="px-2 py-3 border-l border-white">
                    {fmtCurrency((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0))}<br/>
                    <span className="text-[11px] font-normal">{fmtNum(((porArea as any[]).reduce((acc, a) => acc + a.saving_prop, 0) / Math.max(1, (porArea as any[]).reduce((acc, a) => acc + a.valor, 0))) * 100)}%</span>
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
              const percent = kpis.processos > 0 ? (areaStats.processos / kpis.processos) * 100 : 0;
              const tCompradores = (topCompradores as any[]).filter(t => t.area.toUpperCase() === area);
              
              return (
                <div key={area} className="card overflow-hidden">
                  <div className="bg-navy-950 text-white text-center py-3">
                    <div className="font-bold">{area}</div>
                    <div className="text-[13px]">{areaStats.processos} ATAS — {fmtNum(percent)}% DO TOTAL</div>
                  </div>
                  <div className="p-4 bg-neutral-100">
                    <div className="text-center font-bold text-[12px] uppercase text-navy-900 mb-3 underline underline-offset-4">TOP {Math.max(4, tCompradores.length)} COMPRADORES</div>
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
          <div className="card overflow-hidden overflow-x-auto text-[12px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 text-white text-center font-bold">
                  <th className="px-4 py-2 border-r border-white/20">FORNECEDOR</th>
                  <th className="px-4 py-2 border-r border-white/20 w-24">QTD ATAS</th>
                  <th className="px-4 py-2 border-r border-white/20 w-24">QTD ITENS</th>
                  <th className="px-4 py-2 border-r border-white/20 w-44">% CONCENTRAÇÃO DE ITENS</th>
                  <th className="px-4 py-2 w-48">ANÁLISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white border-t-2 border-white bg-[#E6E6E6] text-center font-medium">
                {(fornecedores as any[]).map(f => {
                  let badge = "Pulverizado";
                  let bgBadge = "bg-[#f2e6b1]"; // Pulverizado (amarelo claro)
                  if (f.concentracao >= 15) { badge = "Alta Concentração"; bgBadge = "bg-[#f3baba]"; }
                  else if (f.concentracao >= 5) { badge = "Volume Médio"; bgBadge = "bg-[#fdf0a6]"; }
                  
                  return (
                    <tr key={f.fornecedor}>
                      <td className="px-4 py-2 text-left uppercase text-navy-950">{f.fornecedor}</td>
                      <td className="px-4 py-2 border-l border-white">{f.atas}</td>
                      <td className="px-4 py-2 border-l border-white">{f.itens}</td>
                      <td className="px-4 py-2 border-l border-white">{fmtNum(f.concentracao)}%</td>
                      <td className={clsx("px-4 py-2 border-l border-white text-left", bgBadge)}>{badge}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
                  <td className={clsx("px-3 py-3 font-bold text-white uppercase", e.area === "DIRETOS" ? "bg-diretos-500" : e.area === "INDIRETOS" ? "bg-indiretos-500" : e.area === "CAPEX" ? "bg-capex-500" : "bg-neutral-500")}>
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

function FaixaPrevisao({ title, areaStats }: { title: string, areaStats: any[] }) {
  return (
    <div>
      <div className="bg-[#dcf0cf] border border-line py-2 text-center text-navy-950 font-bold mb-4">{title}</div>
      <div className="grid grid-cols-3 gap-4">
        {areaStats.map(s => (
          <div key={s.area}>
            <div className={clsx("py-1 text-center text-white text-[12px] font-bold mb-4", s.bg)}>{s.area}</div>
            <div className="text-[#0d952e] font-display mb-6">
              <div className="text-[18px] font-bold">{String(s.atas).padStart(2, '0')} ATAS</div>
              <div className="text-[18px] font-bold">{String(s.itens).padStart(2, '0')} ITENS</div>
            </div>
            <div className="space-y-3">
              {s.buyers.map((b: any) => (
                <div key={b.name} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[11px] font-bold text-navy-900 uppercase truncate" title={b.name}>{b.name}</div>
                    <div className="text-[9px] text-neutral-500 uppercase">ANALISTA DE COMPRAS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
