import { db } from "@/db";
import { sql, type SQL } from "drizzle-orm";
import { normText, SITUACAO_SQL, SITUACAO_LABEL, type SituacaoChave } from "@/lib/domain";
import { buildCsv } from "@/lib/csv";
import { fmtDate } from "@/lib/format";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const MAX_EXPORT = 5000;
const SITUACAO_EXPR = sql.raw(SITUACAO_SQL);

/** Exporta em CSV exatamente o recorte dos filtros atuais (sem paginação, com teto de segurança). */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const clauses: SQL[] = [sql`d.status = 'active'`];
    const q = (p.get("q") ?? "").trim();
    if (q) clauses.push(sql`r.search_norm ILIKE ${"%" + normText(q) + "%"}`);
    const area = (p.get("area") ?? "").trim();
    if (area && area !== "todas") {
      if (area === "Não informado") clauses.push(sql`r.area IS NULL`);
      else clauses.push(sql`r.area = ${area}`);
    }
    const situacao = (p.get("situacao") ?? "").trim();
    if (situacao && situacao !== "todas") clauses.push(sql`${SITUACAO_EXPR} = ${situacao}`);
    const etapa = (p.get("etapa") ?? "").trim();
    if (etapa && etapa !== "todas") clauses.push(sql`r.etapa = ${etapa}`);
    const where = sql.join(clauses, sql` AND `);

    const res = await db.execute(sql`
      SELECT r.numero, r.objeto, r.area, r.unidade, r.fornecedor, r.responsavel, r.etapa,
             r.situacao_fonte, ${SITUACAO_EXPR} AS situacao,
             r.status_consumo, r.saving_hist::float8 AS saving_hist, r.saving_prop::float8 AS saving_prop,
             r.status_renovacao, r.data_previsao,
             r.data_inicio, r.data_fim, r.quantidade::float8 AS quantidade, r.valor::float8 AS valor,
             r.observacao, r.link, d.file_name, d.imported_at::text AS imported_at
      FROM records r JOIN datasets d ON d.id = r.dataset_id
      WHERE ${where}
      ORDER BY r.id ASC
      LIMIT ${MAX_EXPORT + 1}
    `);

    const rows = res.rows as Record<string, unknown>[];
    const truncado = rows.length > MAX_EXPORT;
    const data = truncado ? rows.slice(0, MAX_EXPORT) : rows;

    const headers = [
      "Nº processo", "Objeto", "Área", "Unidade", "Fornecedor", "Responsável", "Etapa",
      "Situação (fonte)", "Situação de prazo", "Status de Consumo", "Saving Histórico (R$)", "Saving Proposta (R$)", "Status Renovação", "Previsão",
      "Abertura", "Prazo/Vigência",
      "Qtd. itens", "Valor estimado (R$)", "Observações", "Link", "Arquivo de origem", "Importado em",
    ];
    const body = data.map((r) => [
      r.numero, r.objeto, r.area, r.unidade, r.fornecedor, r.responsavel, r.etapa,
      r.situacao_fonte, SITUACAO_LABEL[(r.situacao as SituacaoChave) ?? "sem_data"],
      r.status_consumo ?? "",
      r.saving_hist !== null && r.saving_hist !== undefined ? Number(r.saving_hist).toFixed(2).replace(".", ",") : "",
      r.saving_prop !== null && r.saving_prop !== undefined ? Number(r.saving_prop).toFixed(2).replace(".", ",") : "",
      r.status_renovacao ?? "",
      r.data_previsao ? fmtDate(String(r.data_previsao)) : "",
      r.data_inicio ? fmtDate(String(r.data_inicio)) : "",
      r.data_fim ? fmtDate(String(r.data_fim)) : "",
      r.quantidade ?? "",
      r.valor !== null && r.valor !== undefined ? Number(r.valor).toFixed(2).replace(".", ",") : "",
      r.observacao, r.link, r.file_name,
      r.imported_at ? fmtDate(String(r.imported_at).slice(0, 10)) : "",
    ]);
    if (truncado) {
      body.push([`AVISO: exportação limitada a ${MAX_EXPORT.toLocaleString("pt-BR")} linhas. Aplique mais filtros para exportar o restante.`]);
    }
    const csv = buildCsv(headers, body);
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="giro-de-atas-processos-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("export", err);
    return Response.json({ erro: "Não foi possível exportar." }, { status: 500 });
  }
}
