import { fmtInt, fmtNum } from "@/lib/format";

interface SupplierRow {
  fornecedor: string;
  atas: number;
  itens: number;
  concentracao: number;
  analise: string | null;
}

export function FornecedoresAnalise({ fornecedores }: { fornecedores: SupplierRow[] }) {
  const total = fornecedores.find((row) => /^(TOTAL|TOTAL GERAL)$/i.test(row.fornecedor));
  const outros = fornecedores.find((row) => row.fornecedor.toUpperCase() === "OUTROS FORNECEDORES");
  const principais = fornecedores.filter(
    (row) => !/^(TOTAL|TOTAL GERAL)$/i.test(row.fornecedor)
      && row.fornecedor.toUpperCase() !== "OUTROS FORNECEDORES",
  );
  const primeiro = principais[0];
  const topFour = principais.slice(0, 4);
  const concentration = topFour.reduce((sum, row) => sum + (row.concentracao || 0), 0);

  return (
    <aside
      className="mt-4 overflow-hidden rounded-2xl border border-accent-200 bg-accent-50"
      aria-label="Análise automática de fornecedores"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-accent-200 px-4 py-3">
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-accent-700">Análise automática</h4>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">
            Leitura resumida da tabela FORNECEDORES GERAL, sem substituir os valores da fonte.
          </p>
        </div>
        {total && (
          <div className="rounded-lg bg-white/70 px-3 py-2 text-right">
            <p className="tnum text-[15px] font-bold text-navy-900">{fmtInt(total.itens)} itens</p>
            <p className="tnum text-[11.5px] text-ink-soft">{fmtInt(total.atas)} atas no total</p>
          </div>
        )}
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Maior concentração</p>
          {primeiro ? (
            <>
              <p className="mt-1 truncate text-[13px] font-bold text-navy-950" title={primeiro.fornecedor}>{primeiro.fornecedor}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink">
                {fmtNum(primeiro.concentracao)}% · {fmtInt(primeiro.itens)} itens
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Nenhum fornecedor principal reconhecido.</p>
          )}
        </article>

        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Quatro principais</p>
          {topFour.length > 0 ? (
            <p className="mt-1 text-[13px] font-bold text-navy-950">{fmtNum(concentration)}% dos itens</p>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Concentração não disponível.</p>
          )}
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
            Soma das linhas principais disponíveis na fonte.
          </p>
        </article>

        <article className="min-w-0 rounded-xl border border-accent-200/80 bg-white/70 p-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-ink-soft">Outros fornecedores</p>
          {outros ? (
            <>
              <p className="mt-1 text-[13px] font-bold text-navy-950">{fmtNum(outros.concentracao)}% dos itens</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                {fmtInt(outros.itens)} itens · {fmtInt(outros.atas)} atas
              </p>
            </>
          ) : (
            <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">Linha não localizada na fonte.</p>
          )}
        </article>
      </div>
    </aside>
  );
}
