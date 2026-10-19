"use client";

import clsx from "clsx";
import { fmtInt } from "@/lib/format";

/**
 * Seis cards de resumo (espelho da página do SharePoint): uma linha para a
 * semana anterior e outra para a semana atual. Valores nulos aparecem como
 * “—” para não confundir “não lido” com zero.
 */
export type ResumoKpis = {
  concluidasAtas: number | null | undefined;
  concluidasItens: number | null | undefined;
  andamentoAtas: number | null | undefined;
  andamentoItens: number | null | undefined;
  saldoItens: number | null | undefined;
  consumidoItens: number | null | undefined;
  vencidasAtas: number | null | undefined;
  vencidasItens: number | null | undefined;
  aVencerAtas: number | null | undefined;
  aVencerItens: number | null | undefined;
};

type CardSpec = {
  titulo: string;
  cor: string;
  atas?: keyof ResumoKpis;
  itens: keyof ResumoKpis;
};

/* Cores dos valores iguais às dos cards do SharePoint. */
const CARDS: CardSpec[] = [
  { titulo: "ATA CONCLUÍDAS (VÁLIDAS)", cor: "#1e8e3e", atas: "concluidasAtas", itens: "concluidasItens" },
  { titulo: "ATAS EM ANDAMENTO", cor: "#1a56db", atas: "andamentoAtas", itens: "andamentoItens" },
  { titulo: "ITENS COM SALDO (VÁLIDOS)", cor: "#0e8c8c", itens: "saldoItens" },
  { titulo: "ITENS SEM SALDO (VÁLIDOS)", cor: "#e8870e", itens: "consumidoItens" },
  { titulo: "ATAS VENCIDAS", cor: "#d93025", atas: "vencidasAtas", itens: "vencidasItens" },
  { titulo: "ATAS A VENCER", cor: "#7a3fe0", atas: "aVencerAtas", itens: "aVencerItens" },
];

export function ResumoCards({
  titulo,
  status,
  kpis,
  tone,
}: {
  /** Ex.: “Resumo das Atas Concluídas”. */
  titulo: string;
  /** Ex.: “Status semana anterior 13/10”. */
  status: string;
  kpis: ResumoKpis;
  tone: "anterior" | "atual";
}) {
  const anterior = tone === "anterior";
  return (
    <div>
      <h3 className="mb-2 text-[15px] font-sans font-semibold leading-tight text-navy-900">
        {titulo}{" "}
        <span className={clsx("font-semibold", anterior ? "text-danger-700" : "text-ok-700")}>({status})</span>
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((card) => {
          const atas = card.atas ? kpis[card.atas] : undefined;
          const itens = kpis[card.itens];
          return (
            <div
              key={card.titulo}
              className={clsx(
                "flex min-h-[112px] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center",
                anterior ? "border-[#f0b4b4] bg-[#f8d7d7]" : "border-[#d0d0d0] bg-[#e4e4e4]",
              )}
            >
              <p className="text-[11px] font-bold uppercase leading-tight text-navy-950">{card.titulo}</p>
              <div className="mt-2 space-y-0.5 text-[15px] font-extrabold leading-tight" style={{ color: card.cor }}>
                {card.atas && (
                  <p>
                    <span className="tabular-nums">{valor(atas)}</span> ATAS
                  </p>
                )}
                <p>
                  <span className="tabular-nums">{valor(itens)}</span> ITENS
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function valor(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : fmtInt(value);
}
