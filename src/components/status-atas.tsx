import { fmtDate, fmtInt } from "@/lib/format";
import { areaStyle } from "@/components/ui";
import type { SnapshotArea, SnapshotStatusAtasArea } from "@/lib/dashboard-snapshot";

const AREAS: SnapshotArea[] = ["INDIRETOS", "DIRETOS", "CAPEX"];

export function StatusAtas({
  areas,
  referencia,
}: {
  areas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
  referencia: string | null;
}) {
  return (
    <div className="space-y-6">
      {AREAS.map((area) => {
        const status = areas[area];
        const style = areaStyle(area);
        return (
          <div key={area} className="space-y-3">
            <div className={`w-full rounded-lg px-4 py-2 text-center text-[16px] font-bold uppercase tracking-wide ${style.band}`}>
              {area}
            </div>
            {status ? <StatusArea status={status} referencia={referencia} /> : (
              <div className="card border-dashed px-5 py-6 text-center text-[13px] text-ink-soft">
                <strong className="text-navy-900">{area}</strong> — bloco não encontrado na aba de status/renovações.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusArea({ status, referencia }: { status: SnapshotStatusAtasArea; referencia: string | null }) {
  const renovacoes = status.layout === "renovacoes"
    || status.totalRenovar !== null
    || status.emAndamento !== null;
  return renovacoes
    ? <StatusRenovacoesArea status={status} />
    : <StatusCarteiraArea status={status} referencia={referencia} />;
}

function StatusRenovacoesArea({ status }: { status: SnapshotStatusAtasArea }) {
  const totalRenovar = status.totalRenovar ?? status.total;
  const tiles = [
    { label: "TOTAL A RENOVAR", value: totalRenovar, tone: "bg-navy-50 border-navy-200 text-navy-800" },
    { label: "VENCIDAS", value: status.vencidas, tone: "bg-danger-100/70 border-danger-100 text-danger-700" },
    { label: "ATÉ 15 DIAS", value: status.ate15, tone: "bg-warn-100/70 border-warn-100 text-warn-700" },
    { label: "EM ANDAMENTO", value: status.emAndamento, tone: "bg-ok-100/70 border-ok-100 text-ok-700" },
  ];
  const base = status.baseDate;

  return (
    <section className="card overflow-hidden" aria-label={`Status de renovações — ${status.area}`}>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[20px] font-sans font-semibold leading-tight text-navy-900">
          {status.titulo ?? `${status.area} | Status de Renovações`}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {status.subtitulo ?? "Carteira em alerta de 100 dias | Atas a renovar"}
          {base && !status.subtitulo?.includes("Base:") ? ` | Base: ${fmtDate(base)}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-line p-5 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className={`rounded-xl border px-3 py-4 ${tile.tone}`}>
            <p className="tnum text-[28px] font-bold leading-none">{fmtInt(tile.value)}</p>
            <p className="mt-2 text-[10.5px] font-bold uppercase leading-tight tracking-wide">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="p-5">
        <h4 className="text-[16px] font-semibold text-navy-900">Prioridade | Vencimentos nos próximos 15 dias</h4>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[12px]">
            <thead className="bg-navy-50 text-[11px] font-bold uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-2">CONTRATO SAP</th>
                <th className="px-3 py-2">VENCIMENTO</th>
                <th className="px-3 py-2">COMPRADOR(A)</th>
                <th className="px-3 py-2">SITUAÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {status.prioridades.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-5 text-center text-ink-soft">Nenhum vencimento prioritário informado.</td></tr>
              ) : status.prioridades.map((item, index) => (
                <tr key={`${item.contrato}-${index}`}>
                  <td className="tnum px-3 py-2 font-semibold text-navy-950">{item.contrato}</td>
                  <td className="px-3 py-2">{fmtDate(item.vencimento)}</td>
                  <td className="px-3 py-2">{item.comprador ?? "—"}</td>
                  <td className="px-3 py-2">
                    {item.situacao ? <span className="inline-flex rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700">{item.situacao}</span> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {status.renovacaoEmAndamento && (
          <div className="mt-3 rounded-lg bg-ok-100 px-4 py-2.5 text-[12px] font-semibold text-ok-700">
            RENOVAÇÃO EM ANDAMENTO: {status.renovacaoEmAndamento.contrato ?? "—"} | {status.renovacaoEmAndamento.comprador ?? "—"} | VENCIMENTO {fmtDate(status.renovacaoEmAndamento.vencimento)}
          </div>
        )}
        {status.notas.length > 0 && (
          <div className="mt-3 space-y-2">
            {status.notas.map((note) => <p key={note} className="rounded-lg bg-warn-100 px-3 py-2 text-[12.5px] leading-relaxed text-warn-700">{note}</p>)}
          </div>
        )}
      </div>
    </section>
  );
}

function StatusCarteiraArea({ status, referencia }: { status: SnapshotStatusAtasArea; referencia: string | null }) {
  const tiles = [
    ["TOTAL", status.total],
    ["VIGENTES", status.vigentes],
    ["VENCIDAS", status.vencidas],
    ["ATÉ 15 DIAS", status.ate15],
    ["16 A 30 DIAS", status.de16a30],
    ["A RENOVAR", status.aRenovar],
  ] as const;
  const base = status.baseDate ?? referencia;

  return (
    <section className="card overflow-hidden" aria-label={`Status das atas — ${status.area}`}>
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-[20px] font-sans font-semibold leading-tight text-navy-900">
          {status.titulo ?? `${status.area} | Status das Atas`}
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {status.subtitulo ?? "Carteira da área e ações prioritárias"}{base ? ` · base ${fmtDate(base)}` : ""}
        </p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {tiles.map(([label, value]) => (
          <div key={label} className="px-3 py-4 text-center">
            <p className="tnum text-[22px] font-bold text-navy-950">{fmtInt(value)}</p>
            <p className="mt-1 text-[10.5px] font-bold uppercase leading-tight text-ink-soft">{label}</p>
          </div>
        ))}
      </div>
      {(status.prioridades.length > 0 || status.carteira.length > 0 || status.notas.length > 0) && (
        <div className="grid gap-5 border-t border-line p-5 lg:grid-cols-2">
          {status.prioridades.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.07em] text-navy-900">Prioridades de vencimento</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-[12px]">
                  <thead className="bg-navy-50 text-left text-ink-soft">
                    <tr><th className="px-2 py-2">CONTRATO SAP</th><th className="px-2 py-2">VENCIMENTO</th><th className="px-2 py-2">COMPRADOR(A)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {status.prioridades.map((item, index) => (
                      <tr key={`${item.contrato}-${index}`}><td className="tnum px-2 py-2 font-semibold">{item.contrato}</td><td className="px-2 py-2">{fmtDate(item.vencimento)}</td><td className="px-2 py-2">{item.comprador ?? "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {status.carteira.length > 0 && (
            <div>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.07em] text-navy-900">Carteira por comprador(a)</h4>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[360px] text-[12px]">
                  <thead className="bg-navy-50 text-left text-ink-soft">
                    <tr><th className="px-2 py-2">COMPRADOR(A)</th><th className="px-2 py-2">VIG.</th><th className="px-2 py-2">VENC.</th><th className="px-2 py-2">A RENOVAR</th><th className="px-2 py-2">TOTAL</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {status.carteira.map((item) => (
                      <tr key={item.comprador}><td className="px-2 py-2 font-semibold">{item.comprador}</td><td className="tnum px-2 py-2">{fmtInt(item.vigentes)}</td><td className="tnum px-2 py-2">{fmtInt(item.vencidas)}</td><td className="tnum px-2 py-2">{fmtInt(item.aRenovar)}</td><td className="tnum px-2 py-2">{fmtInt(item.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {status.notas.length > 0 && (
            <div className="lg:col-span-2 space-y-2">
              {status.notas.map((note) => <p key={note} className="rounded-lg bg-warn-100 px-3 py-2 text-[12.5px] leading-relaxed text-warn-700">{note}</p>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
