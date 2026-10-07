import { db } from "@/db";
import { sql, type SQL } from "drizzle-orm";
import { normText, SITUACAO_SQL } from "@/lib/domain";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SORTABLE = new Set([
  "numero", "objeto", "area", "fornecedor", "responsavel", "etapa",
  "data_fim", "data_inicio", "valor", "quantidade", "situacao",
]);

const SITUACAO_EXPR = sql.raw(SITUACAO_SQL);

function buildWhere(p: URLSearchParams): SQL {
  const clauses: SQL[] = [sql`d.status = 'active'`];

  const q = (p.get("q") ?? "").trim();
  if (q) clauses.push(sql`r.search_norm ILIKE ${"%" + normText(q) + "%"}`);

  const area = (p.get("area") ?? "").trim();
  if (area && area !== "todas") {
    if (area === "Não informado") clauses.push(sql`r.area IS NULL`);
    else clauses.push(sql`r.area = ${area}`);
  }
  const situacao = (p.get("situacao") ?? "").trim();
  if (situacao && situacao !== "todas") {
    clauses.push(sql`${SITUACAO_EXPR} = ${situacao}`);
  }
  const etapa = (p.get("etapa") ?? "").trim();
  if (etapa && etapa !== "todas") clauses.push(sql`r.etapa = ${etapa}`);

  const responsavel = (p.get("responsavel") ?? "").trim();
  if (responsavel) clauses.push(sql`r.responsavel ILIKE ${"%" + responsavel + "%"}`);

  const fornecedor = (p.get("fornecedor") ?? "").trim();
  if (fornecedor) clauses.push(sql`r.fornecedor ILIKE ${"%" + fornecedor + "%"}`);

  return sql.join(clauses, sql` AND `);
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const where = buildWhere(p);

    const page = Math.max(1, parseInt(p.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(p.get("pageSize") ?? "25", 10) || 25));
    const sort = SORTABLE.has(p.get("sort") ?? "") ? (p.get("sort") as string) : "data_fim";
    const dir = p.get("dir") === "desc" ? "DESC" : "ASC";

    // Ordenação: coluna sempre da lista branca; direção apenas ASC/DESC.
    const sortExpr = sort === "situacao" ? SITUACAO_SQL : `r.${sort}`;
    const orderBy = sql.raw(`${sortExpr} ${dir} NULLS LAST, r.id ASC`);

    const baseFrom = sql`FROM records r JOIN datasets d ON d.id = r.dataset_id WHERE ${where}`;

    const countRows = await db.execute(sql`SELECT COUNT(*)::int AS total ${baseFrom}`);
    const total = Number((countRows.rows[0] as { total: number })?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const dataRows = await db.execute(sql`
      SELECT r.id, r.dataset_id, r.area, r.numero, r.objeto, r.unidade, r.fornecedor,
             r.responsavel, r.etapa, r.situacao_fonte, r.situacao_norm,
             r.data_inicio, r.data_fim, r.quantidade::float8 AS quantidade, r.valor::float8 AS valor,
             r.status_consumo, r.saving_hist::float8 AS saving_hist, r.saving_prop::float8 AS saving_prop,
             r.status_renovacao, r.data_previsao,
             r.observacao, r.link, r.source_row, r.extra,
             (r.data_fim - CURRENT_DATE)::int AS dias,
             ${SITUACAO_EXPR} AS situacao,
             d.file_name, d.kind, d.natureza, d.reference_date, d.imported_at::text AS imported_at
      ${baseFrom}
      ORDER BY ${orderBy}
      LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}
    `);

    const respondFacets = p.get("facets") === "1";
    let facets: Record<string, unknown> | undefined;
    if (respondFacets) {
      const areas = await db.execute(sql`
        SELECT COALESCE(r.area, 'Não informado') AS area, COUNT(*)::int AS total
        FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
        GROUP BY 1 ORDER BY total DESC`);
      const etapas = await db.execute(sql`
        SELECT r.etapa, COUNT(*)::int AS total
        FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
        WHERE r.etapa IS NOT NULL AND r.etapa <> ''
        GROUP BY 1 ORDER BY total DESC LIMIT 60`);
      facets = { areas: areas.rows, etapas: etapas.rows };
    }

    return Response.json({ rows: dataRows.rows, total, page: safePage, pageSize, totalPages, ...(facets ? { facets } : {}) });
  } catch (err) {
    console.error("processos", err);
    return Response.json({ erro: "Não foi possível carregar os processos." }, { status: 500 });
  }
}
