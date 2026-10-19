import { fmtCurrency, fmtDate, fmtInt } from "@/lib/format";
import type { AtasConcluidasResult } from "@/lib/static-dashboard";

export function AtasConcluidas({ dados, referencia }: { dados: AtasConcluidasResult; referencia: string | null }) {
  const comparacao = dados.primeiraLeitura
    ? "Primeira leitura da aba de andamento"
    : `Comparado com a importação de ${fmtDate(dados.comparadoComReferencia)}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
        <div>
          <h3 className="text-[14.5px] font-bold text-navy-950">Atas que passaram a FINALIZADO</h3>
          <p className="mt-1 text-[12.5px] text-ink-soft">{comparacao}{referencia ? ` · base atual ${fmtDate(referencia)}` : ""}</p>
        </div>
        <span className="rounded-full bg-ok-100 px-3 py-1 text-[12px] font-semibold text-ok-700">
          {fmtInt(dados.novas.length)} novas · {fmtInt(dados.totalFinalizadas)} finalizadas na base
        </span>
      </div>
      {dados.novas.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13.5px] text-ink-soft">
          Nenhuma ata nova passou a FINALIZADO desde a importação anterior.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[12.5px]">
            <caption className="sr-only">Atas concluídas desde a última atualização</caption>
            <thead className="bg-navy-950 text-white">
              <tr>
                {[
                  "ATA",
                  "CONTRATO",
                  "FORNECEDOR",
                  "QTD. DE ITENS",
                  "COMPRADOR(A)",
                  "ÁREA",
                  "VALOR",
                ].map((label) => <th key={label} scope="col" className="px-3 py-3 font-bold">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {dados.novas.map((ata) => (
                <tr key={ata.key} className="hover:bg-navy-50/50">
                  <td className="max-w-[280px] px-3 py-3 font-semibold text-navy-950">ATA: {ata.descricao}</td>
                  <td className="tnum px-3 py-3 text-ink">{ata.contrato ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{ata.fornecedor ?? "—"}</td>
                  <td className="tnum px-3 py-3 text-ink">{fmtInt(ata.itens)}</td>
                  <td className="px-3 py-3 text-ink">{ata.comprador ?? "—"}</td>
                  <td className="px-3 py-3 font-semibold text-navy-700">{ata.area ?? "—"}</td>
                  <td className="tnum px-3 py-3 text-ink">{fmtCurrency(ata.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
