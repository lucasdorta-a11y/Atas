"use client";

import { CircleCheckBig } from "lucide-react";
import type { AtasConcluidasResult } from "@/lib/static-dashboard";
import { AreaTag } from "@/components/ui";
import { fmtDate, fmtDateTime, fmtInt } from "@/lib/format";

/**
 * Lista compacta das atas que passaram a FINALIZADO desde a importação
 * anterior (uma linha por ata). O fornecedor prioriza a coluna FORNECEDOR
 * do GIRO 02 e usa a aba de controle de contratos como fallback.
 */
export function AtasConcluidas({ dados, referencia }: { dados: AtasConcluidasResult; referencia: string | null }) {
  const { novas, primeiraLeitura, comparadoComReferencia, comparadoComImportadoEm, totalFinalizadas } = dados;
  const semFornecedor = novas.filter((ata) => ata.contrato && !ata.fornecedor).length;
  const semContrato = novas.filter((ata) => !ata.contrato).length;

  const comparacao = primeiraLeitura
    ? `Sem base anterior para comparação. Esta é a primeira importação com a aba de andamento: todas as ${fmtInt(totalFinalizadas)} atas FINALIZADO aparecem abaixo como posição da base atual, não como novas conclusões do período. A partir da próxima importação, só entram as que mudaram para FINALIZADO.`
    : `Base de ${fmtDate(referencia)} comparada com a importação de ${comparadoComReferencia ? fmtDate(comparadoComReferencia) : fmtDateTime(comparadoComImportadoEm)}: ${fmtInt(novas.length)} ${novas.length === 1 ? "ata passou" : "atas passaram"} a FINALIZADO (${fmtInt(totalFinalizadas)} finalizadas no total).`;

  return (
    <div className="card overflow-hidden text-[12.5px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ok-100/60 px-5 py-3">
        <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-ok-700">
          <CircleCheckBig size={16} aria-hidden="true" />
          {fmtInt(novas.length)} {primeiraLeitura ? (novas.length === 1 ? "ata finalizada na base atual" : "atas finalizadas na base atual") : (novas.length === 1 ? "ata concluída" : "atas concluídas")}
        </p>
        <p className="text-[12px] text-ink-soft">{comparacao}</p>
      </div>
      {novas.length === 0 ? (
        <p role="status" className="px-5 py-6 text-center text-ink-soft">
          {primeiraLeitura ? "Nenhuma ata FINALIZADO na base atual. Sem base anterior para comparação." : "Nenhuma ata passou a FINALIZADO desde a importação anterior."}
        </p>
      ) : (
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 z-10">
              <tr className="bg-navy-950 text-[11px] font-bold uppercase text-white">
                <th className="px-4 py-2">Ata</th>
                <th className="px-3 py-2">Contrato</th>
                <th className="px-3 py-2">Fornecedor</th>
                <th className="px-3 py-2 text-right">Qtd. de itens</th>
                <th className="px-3 py-2">Comprador(a)</th>
                <th className="px-3 py-2">Área</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {novas.map((ata) => (
                <tr key={ata.key} className="odd:bg-white even:bg-navy-50/40">
                  <td className="px-4 py-2 font-semibold uppercase text-navy-950">
                    <span className="text-ink-soft">ATA: </span>
                    {ata.descricao}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-navy-900">{ata.contrato ?? <span className="text-ink-soft">—</span>}</td>
                  <td className="px-3 py-2 uppercase text-navy-900">
                    {ata.fornecedor ?? (
                      <span className="text-ink-soft" title={ata.contrato ? "Contrato não encontrado na aba Base - Controle de Contratos" : "Ata sem nº de contrato na base"}>—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-navy-900">{fmtInt(ata.itens)}</td>
                  <td className="px-3 py-2 text-navy-900">{ata.comprador ?? <span className="text-ink-soft">—</span>}</td>
                  <td className="px-3 py-2">{ata.area ? <AreaTag area={ata.area} /> : <span className="text-ink-soft">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(semFornecedor > 0 || semContrato > 0) && (
        <p className="border-t border-line px-5 py-2 text-[11.5px] text-ink-soft">
          {semFornecedor > 0 && `${fmtInt(semFornecedor)} ${semFornecedor === 1 ? "ata sem fornecedor" : "atas sem fornecedor"}: não foi encontrado fornecedor no GIRO 02 nem na aba “Base - Controle de Contratos” importada. `}
          {semContrato > 0 && `${fmtInt(semContrato)} ${semContrato === 1 ? "ata sem nº de contrato" : "atas sem nº de contrato"} na base de andamento.`}
        </p>
      )}
    </div>
  );
}
