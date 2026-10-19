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
  const principais = fornecedores.filter((row) => !/^(TOTAL|TOTAL GERAL)$/i.test(row.fornecedor) && row.fornecedor.toUpperCase() !== "OUTROS FORNECEDORES");
  const primeiro = principais[0];
  const concentration = principais.reduce((sum, row) => sum + (row.concentracao || 0), 0);

  return (
    <aside className="mt-4 rounded-xl border border-accent-200 bg-accent-50 px-4 py-4" aria-label="Análise automática de fornecedores">
      <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-accent-700">Análise automática</h4>
      <ul className="mt-2 grid gap-2 text-[12.5px] leading-relaxed text-ink sm:grid-cols-3">
        <li>
          {primeiro ? <><strong>{primeiro.fornecedor}</strong> concentra {fmtNum(primeiro.concentracao)}% dos itens entre os principais fornecedores ({fmtInt(primeiro.itens)} itens).</> : "Não há fornecedor principal reconhecido para analisar."}
        </li>
        <li>
          {total ? <>A tabela soma <strong>{fmtInt(total.atas)} atas</strong> e <strong>{fmtInt(total.itens)} itens</strong>; os quatro principais representam {fmtNum(concentration)}% da concentração informada.</> : "A linha TOTAL não foi localizada na tabela de fornecedores."}
        </li>
        <li>
          {outros ? <>OUTROS FORNECEDORES reúne {fmtInt(outros.atas)} atas e {fmtInt(outros.itens)} itens ({fmtNum(outros.concentracao)}%).</> : "A linha OUTROS FORNECEDORES não foi localizada."}
        </li>
      </ul>
    </aside>
  );
}
