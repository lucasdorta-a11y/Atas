"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { fmtInt } from "@/lib/format";
import type { PanoramaCardKey } from "@/lib/process-links";

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
  key: PanoramaCardKey;
  titulo: string;
  cor: string;
  atas?: keyof ResumoKpis;
  itens: keyof ResumoKpis;
};

/* Cores dos valores iguais às dos cards do SharePoint. */
const CARDS: CardSpec[] = [
  { key: "concluidas", titulo: "ATA CONCLUÍDAS (VÁLIDAS)", cor: "#1e8e3e", atas: "concluidasAtas", itens: "concluidasItens" },
  { key: "andamento", titulo: "ATAS EM ANDAMENTO", cor: "#1a56db", atas: "andamentoAtas", itens: "andamentoItens" },
  { key: "saldo", titulo: "ITENS COM SALDO (VÁLIDOS)", cor: "#0e8c8c", itens: "saldoItens" },
  { key: "sem_saldo", titulo: "ITENS SEM SALDO (VÁLIDOS)", cor: "#e8870e", itens: "consumidoItens" },
  { key: "vencidas", titulo: "ATAS VENCIDAS", cor: "#d93025", atas: "vencidasAtas", itens: "vencidasItens" },
  { key: "a_vencer", titulo: "ATAS A VENCER", cor: "#7a3fe0", atas: "aVencerAtas", itens: "aVencerItens" },
];

export function ResumoCards({
  titulo,
  status,
  kpis,
  tone,
  hrefForCard,
}: {
  /** Ex.: “Resumo das Atas Concluídas”. */
  titulo: string;
  /** Ex.: “Status semana anterior 13/10”. */
  status: string;
  kpis: ResumoKpis;
  tone: "anterior" | "atual";
  /** Somente a leitura atual possui processos completos para drill-through. */
  hrefForCard?: (card: PanoramaCardKey) => string;
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
          const href = hrefForCard?.(card.key);
          const classes = clsx(
            "group flex min-h-[112px] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center",
            anterior ? "resumo-card-prev" : "resumo-card-curr",
            href && "transition-all hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500",
          );
          const content = (
            <>
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
              {href && (
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-navy-600 opacity-75 transition-opacity group-hover:opacity-100">
                  Ver processos <ArrowUpRight size={11} aria-hidden="true" />
                </span>
              )}
            </>
          );
          return href ? (
            <Link key={card.key} href={href} className={classes} aria-label={`${card.titulo}: abrir processos filtrados`}>
              {content}
            </Link>
          ) : (
            <div key={card.key} className={classes}>
              {content}
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
