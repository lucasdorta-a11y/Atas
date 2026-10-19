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
        return status ? <StatusArea key={area} status={status} referencia={referencia} /> : (
          <div key={area} className="card border-dashed px-5 py-6 text-center text-[13px] text-ink-soft">
            <strong className="text-navy-900">{area}</strong> — bloco não encontrado na aba Status das Atas.
          </div>
        );
      })}
    </div>
  );
}

function StatusArea({ status, referencia }: { status: SnapshotStatusAtasArea; referencia: string | null }) {
  const style = areaStyle(status.area);
  const tiles = [
    ["TOTAL", status.total],
    ["VIGENTES", status.vigentes],
    ["VENCIDAS", status.vencidas],
    ["ATÉ 15 DIAS", status.ate15],
    ["16 A 30 DIAS", status.de16a30],
    ["A RENOVAR", status.aRenovar],
  ] as const;
  return (
    <section className="card overflow-hidden" aria-label={`Status das atas — ${status.area}`}>
      <div className={`px-5 py-3 text-center font-bold ${style.band}`}>
        <div className="text-[16px] uppercase tracking-wide">{status.area}</div>
        <div className="mt-1 text-[12px] font-medium opacity-90">
          {status.titulo ?? "Status das Atas"}{status.baseDate ? ` · base ${fmtDate(status.baseDate)}` : referencia ? ` · referência ${fmtDate(referencia)}` : ""}
        </div>
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
