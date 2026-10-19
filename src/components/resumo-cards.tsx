import { fmtInt } from "@/lib/format";
import type { SnapshotKpis } from "@/lib/dashboard-snapshot";

export function ResumoCards({
  titulo,
  status,
  kpis,
  tone,
}: {
  titulo: string;
  status: string;
  kpis: SnapshotKpis;
  tone: "anterior" | "atual";
}) {
  const cards = [
    { label: "Concluídas", value: kpis.concluidasAtas, detail: `${fmtInt(kpis.concluidasItens)} itens`, tone: "navy" },
    { label: "Em andamento", value: kpis.andamentoAtas, detail: `${fmtInt(kpis.andamentoItens)} itens`, tone: "blue" },
    { label: "Itens com saldo", value: kpis.saldoItens, detail: "itens válidos", tone: "teal" },
    { label: "Itens sem saldo", value: kpis.consumidoItens, detail: "itens válidos", tone: "orange" },
    { label: "Vencidas", value: kpis.vencidasAtas, detail: `${fmtInt(kpis.vencidasItens)} itens`, tone: "red" },
    { label: "A vencer", value: kpis.aVencerAtas, detail: `${fmtInt(kpis.aVencerItens)} itens`, tone: "amber" },
  ] as const;

  return (
    <section className="card overflow-hidden" aria-label={`${titulo} — ${status}`}>
      <div className={tone === "anterior" ? "bg-[#f8e8e8] px-5 py-3" : "bg-[#e7e7e7] px-5 py-3"}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-bold uppercase tracking-[0.06em] text-navy-950">{titulo}</h3>
          <span className="text-[12px] font-semibold text-ink-soft">{status}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-line sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
        {cards.map((card) => (
          <div key={card.label} className="min-h-[112px] px-3 py-4 text-center sm:px-4">
            <div className={`mx-auto mb-2 h-1 w-12 rounded-full ${
              card.tone === "navy" ? "bg-navy-700" :
              card.tone === "blue" ? "bg-diretos-500" :
              card.tone === "teal" ? "bg-indiretos-500" :
              card.tone === "orange" ? "bg-accent-500" :
              card.tone === "red" ? "bg-danger-600" : "bg-warn-600"
            }`} aria-hidden="true" />
            <p className="tnum font-display text-[25px] font-bold tracking-tight text-navy-950">{fmtInt(card.value)}</p>
            <p className="mt-1 text-[11.5px] font-bold uppercase leading-tight text-ink-soft">{card.label}</p>
            <p className="mt-1 text-[11px] text-ink-soft">{card.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
