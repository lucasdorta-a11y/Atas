import { db } from "@/db";
import { sql } from "drizzle-orm";
import { SITUACAO_SQL, SITUACAO_LABEL, type SituacaoChave } from "@/lib/domain";

export interface CheckItem {
  nivel: "info" | "atencao";
  mensagem: string;
}

export async function getDashboardData() {
  const S = sql.raw(SITUACAO_SQL);

  const [
    datasetsRes,
    situacaoRes,
    kpisRes,
    areaRes,
    topCompradoresRes,
    fornecedoresRes,
    evolucaoRes,
    renovacoesRes,
    previsoesRes,
    variacoesRes,
  ] = await Promise.all([
    db.execute(sql`
      SELECT id, kind, natureza, file_name, sheet_name, reference_date, imported_at::text,
             status, mode, row_count, valid_count, skipped_count, dup_count, warning_count
      FROM datasets
      ORDER BY imported_at DESC
      LIMIT 40
    `),
    db.execute(sql`
      SELECT ${S} AS situacao, COUNT(*)::int AS total
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
    `),
    db.execute(sql`
      SELECT
        COUNT(*)::int AS processos,
        COALESCE(SUM(valor), 0)::float8 AS valor_total,
        COALESCE(SUM(quantidade), 0)::float8 AS itens,
        COUNT(*) FILTER (WHERE r.situacao_norm = 'concluido')::int AS concluidos_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8 AS concluidos_itens,
        COUNT(*) FILTER (WHERE r.status_consumo = 'Com Saldo')::int AS saldo_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8 AS saldo_itens,
        COUNT(*) FILTER (WHERE r.status_consumo = 'Consumido')::int AS consumido_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Consumido'), 0)::float8 AS consumido_itens,
        COUNT(*) FILTER (WHERE ${S} IN ('vencido', 'a_vencer'))::int AS vencidas_a_vencer_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} IN ('vencido', 'a_vencer')), 0)::float8 AS vencidas_a_vencer_itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
    `),
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado') AS area,
        COUNT(*)::int AS processos,
        COALESCE(SUM(r.valor), 0)::float8 AS valor,
        COALESCE(SUM(r.saving_hist), 0)::float8 AS saving_hist,
        COALESCE(SUM(r.saving_prop), 0)::float8 AS saving_prop
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
      ORDER BY processos DESC
    `),
    db.execute(sql`
      WITH Ranks AS (
        SELECT COALESCE(area, 'Não informado') AS area, responsavel, COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens,
        ROW_NUMBER() OVER(PARTITION BY COALESCE(area, 'Não informado') ORDER BY COALESCE(SUM(quantidade), 0) DESC) as rn
        FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
        WHERE responsavel IS NOT NULL AND responsavel <> ''
        GROUP BY 1, 2
      )
      SELECT area, responsavel, atas, itens FROM Ranks WHERE rn <= 5 ORDER BY area, rn
    `),
    db.execute(sql`
      SELECT fornecedor, COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens,
             (COALESCE(SUM(quantidade), 0) / NULLIF(SUM(SUM(quantidade)) OVER(), 0)) * 100::float8 as concentracao
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE fornecedor IS NOT NULL AND fornecedor <> ''
      GROUP BY 1
      ORDER BY itens DESC
      LIMIT 20
    `),
    db.execute(sql`
      SELECT 
        COALESCE(r.area, 'Não informado') AS area,
        COUNT(*) FILTER (WHERE r.situacao_norm = 'concluido')::int AS concluidas_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8 AS concluidas_itens,
        COUNT(*) FILTER (WHERE r.situacao_norm IS NULL AND ${S} NOT IN ('concluido', 'cancelado'))::int AS andamento_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE r.situacao_norm IS NULL AND ${S} NOT IN ('concluido', 'cancelado')), 0)::float8 AS andamento_itens,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8 AS saldo_itens,
        COALESCE(SUM(quantidade) FILTER (WHERE r.status_consumo = 'Sem Saldo'), 0)::float8 AS semsaldo_itens,
        COUNT(*) FILTER (WHERE ${S} = 'vencido')::int AS vencidas_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} = 'vencido'), 0)::float8 AS vencidas_itens,
        COUNT(*) FILTER (WHERE ${S} = 'a_vencer')::int AS a_vencer_atas,
        COALESCE(SUM(quantidade) FILTER (WHERE ${S} = 'a_vencer'), 0)::float8 AS a_vencer_itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
    `),
    db.execute(sql`
      SELECT COALESCE(r.area, 'Não informado') AS area, COALESCE(r.status_renovacao, 'Outros') AS status,
             COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1, 2
    `),
    db.execute(sql`
      SELECT COALESCE(r.area, 'Não informado') AS area, responsavel, r.data_previsao,
             (r.data_previsao - CURRENT_DATE)::int AS dias,
             COUNT(*)::int AS atas, COALESCE(SUM(quantidade), 0)::float8 AS itens
      FROM records r JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE r.situacao_norm IS NULL AND r.data_previsao IS NOT NULL
      GROUP BY 1, 2, 3, 4
    `),
    db.execute(sql`
      WITH active AS (
        SELECT d.kind, d.natureza, d.id, d.reference_date, d.imported_at::text AS imported_at,
               COUNT(r.id)::int AS processos
        FROM datasets d LEFT JOIN records r ON r.dataset_id = d.id
        WHERE d.status = 'active'
        GROUP BY d.id
      ),
      prev AS (
        SELECT DISTINCT ON (d.kind) d.kind, d.reference_date, d.imported_at::text AS imported_at,
               (SELECT COUNT(*) FROM records r WHERE r.dataset_id = d.id)::int AS processos
        FROM datasets d
        WHERE d.status = 'superseded'
        ORDER BY d.kind, d.imported_at DESC
      )
      SELECT a.kind, a.natureza, a.processos AS atual, a.reference_date AS ref_atual,
             p.processos AS anterior, p.reference_date AS ref_anterior, p.imported_at AS importado_anterior
      FROM active a JOIN prev p ON p.kind = a.kind
    `),
  ]);

  const situacoes: Record<SituacaoChave, number> = {
    vencido: 0, a_vencer: 0, em_dia: 0, sem_data: 0, concluido: 0, cancelado: 0,
  };
  for (const row of situacaoRes.rows as { situacao: SituacaoChave; total: number }[]) {
    if (row.situacao in situacoes) situacoes[row.situacao] = row.total;
  }

  const kpiRow = (kpisRes.rows[0] ?? {}) as Record<string, number>;
  const activeDatasets = (datasetsRes.rows as Record<string, unknown>[]).filter((d) => d.status === "active");

  // Verificações de consistência — sinalizam, jamais corrigem sozinho.
  const checks: CheckItem[] = [];
  const skippedTotal = activeDatasets.reduce((a, d) => a + Number(d.skipped_count ?? 0), 0);
  const warnTotal = activeDatasets.reduce((a, d) => a + Number(d.warning_count ?? 0), 0);
  const dupTotal = activeDatasets.reduce((a, d) => a + Number(d.dup_count ?? 0), 0);
  if (skippedTotal > 0) {
    checks.push({
      nivel: "atencao",
      mensagem: `${skippedTotal.toLocaleString("pt-BR")} linha(s) das bases ativas foram ignoradas na importação${dupTotal > 0 ? ` (${dupTotal.toLocaleString("pt-BR")} duplicada(s))` : ""}. Consulte os relatórios na página Importar.`,
    });
  }
  if (warnTotal > 0) {
    checks.push({
      nivel: "info",
      mensagem: `${warnTotal.toLocaleString("pt-BR")} aviso(s) de interpretação (datas, números, áreas) aguardam validação humana nos relatórios de importação.`,
    });
  }
  const kindsAtivos = new Map<string, number>();
  for (const d of activeDatasets) kindsAtivos.set(String(d.kind), (kindsAtivos.get(String(d.kind)) ?? 0) + 1);
  for (const [kind, n] of kindsAtivos) {
    if (n > 1) {
      checks.push({
        nivel: "atencao",
        mensagem: `Há ${n} bases ativas do tipo "${kind}" combinadas. Confirme que não há sobreposição de registros entre os arquivos.`,
      });
    }
  }
  const naturezas = new Set(activeDatasets.map((d) => String(d.natureza)));
  if (naturezas.has("snapshot") && naturezas.has("operacional")) {
    checks.push({
      nivel: "atencao",
      mensagem: "O panorama está somando bases de naturezas diferentes (snapshot semanal e base operacional), que podem ter escopos e datas distintos. Considere manter ativa apenas a natureza desejada.",
    });
  }

  return {
    geradoEm: new Date().toISOString(),
    hasData: Number(kpiRow.processos ?? 0) > 0,
    kpis: {
      processos: Number(kpiRow.processos ?? 0),
      valorTotal: Number(kpiRow.valor_total ?? 0),
      itens: Number(kpiRow.itens ?? 0),
      concluidosAtas: Number(kpiRow.concluidos_atas ?? 0),
      concluidosItens: Number(kpiRow.concluidos_itens ?? 0),
      saldoAtas: Number(kpiRow.saldo_atas ?? 0),
      saldoItens: Number(kpiRow.saldo_itens ?? 0),
      consumidoAtas: Number(kpiRow.consumido_atas ?? 0),
      consumidoItens: Number(kpiRow.consumido_itens ?? 0),
      vencidasVencerAtas: Number(kpiRow.vencidas_a_vencer_atas ?? 0),
      vencidasVencerItens: Number(kpiRow.vencidas_a_vencer_itens ?? 0),
      ...situacoes,
    },
    situacaoLabels: SITUACAO_LABEL,
    porArea: areaRes.rows,
    topCompradores: topCompradoresRes.rows,
    fornecedores: fornecedoresRes.rows,
    evolucao: evolucaoRes.rows,
    renovacoes: renovacoesRes.rows,
    previsoes: previsoesRes.rows,
    variacoes: variacoesRes.rows,
    datasets: datasetsRes.rows,
    checks,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
