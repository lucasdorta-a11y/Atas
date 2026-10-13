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
    kpisRes,
    porAreaRes,
    topCompradoresRes,
    fornecedoresRes,
    evolucaoRes,
    renovacoesRes,
    // Previsões de conclusão (atas em andamento): groupadas por área + responsável + data_previsao
    previsoesRes,
    // Previsão por mês: área + mês/ano da data_previsao
    previsoesMesRes,
    variacoesRes,
  ] = await Promise.all([

    // ── Datasets (auditoria) ──────────────────────────────────────────
    db.execute(sql`
      SELECT id, kind, natureza, file_name, sheet_name, reference_date, imported_at::text,
             status, mode, row_count, valid_count, skipped_count, dup_count, warning_count
      FROM datasets
      ORDER BY imported_at DESC
      LIMIT 40
    `),

    // ── KPIs globais (Bloco 1 das imagens) ───────────────────────────
    // Imagem 2: Atas Concluídas (Válidas) | Itens com Saldos e Consumidos | Atas Vencidas e A Vencer
    db.execute(sql`
      SELECT
        COUNT(*)::int                                                           AS processos,
        COALESCE(SUM(r.valor), 0)::float8                                      AS valor_total,
        COALESCE(SUM(r.quantidade), 0)::float8                                 AS itens_total,

        -- Bloco "Ata Concluídas (Válidas)" — situacao_norm = 'concluido'
        COUNT(*)         FILTER (WHERE r.situacao_norm = 'concluido')::int     AS concluidos_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8
                                                                               AS concluidos_itens,

        -- Bloco "Itens com Saldos e Consumidos (Válidos)"
        COUNT(*)         FILTER (WHERE r.status_consumo = 'Com Saldo')::int    AS saldo_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8
                                                                               AS saldo_itens,
        COUNT(*)         FILTER (WHERE r.status_consumo = 'Consumido')::int    AS consumido_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.status_consumo = 'Consumido'), 0)::float8
                                                                               AS consumido_itens,

        -- Bloco "Atas Vencidas e A Vencer": RENOVAR = a_vencer, VENCIDO = vencido
        COUNT(*)         FILTER (WHERE ${S} = 'a_vencer')::int                 AS a_vencer_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE ${S} = 'a_vencer'), 0)::float8
                                                                               AS a_vencer_itens,
        COUNT(*)         FILTER (WHERE ${S} = 'vencido')::int                  AS vencido_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE ${S} = 'vencido'), 0)::float8
                                                                               AS vencido_itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
    `),

    // ── Por Área: Valor Contratado + Saving (Imagem 3) ───────────────
    // Também alimenta: Distribuição de Volume (Imagem 4) e Evolução por Área (Imagem 5)
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado')                                      AS area,
        COUNT(*)::int                                                           AS processos,
        COALESCE(SUM(r.valor), 0)::float8                                      AS valor,
        COALESCE(SUM(r.saving_hist), 0)::float8                                AS saving_hist,
        COALESCE(SUM(r.saving_prop), 0)::float8                                AS saving_prop,
        COALESCE(SUM(r.quantidade), 0)::float8                                 AS itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
      ORDER BY processos DESC
    `),

    // ── Top 5 Compradores por Área (Imagem 4) ────────────────────────
    db.execute(sql`
      WITH ranked AS (
        SELECT
          COALESCE(r.area, 'Não informado')                                    AS area,
          r.responsavel,
          COUNT(*)::int                                                         AS atas,
          COALESCE(SUM(r.quantidade), 0)::float8                               AS itens,
          ROW_NUMBER() OVER (
            PARTITION BY COALESCE(r.area, 'Não informado')
            ORDER BY COALESCE(SUM(r.quantidade), 0) DESC, COUNT(*) DESC
          )                                                                     AS rn
        FROM records r
        JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
        WHERE r.responsavel IS NOT NULL AND r.responsavel <> ''
        GROUP BY 1, 2
      )
      SELECT area, responsavel, atas, itens
      FROM ranked
      WHERE rn <= 5
      ORDER BY area, rn
    `),

    // ── Top 20 Fornecedores com % Concentração (Imagem 4) ────────────
    db.execute(sql`
      SELECT
        r.fornecedor,
        COUNT(*)::int                                                           AS atas,
        COALESCE(SUM(r.quantidade), 0)::float8                                 AS itens,
        ROUND(
          (COALESCE(SUM(r.quantidade), 0) /
           NULLIF(SUM(SUM(r.quantidade)) OVER (), 0)) * 100, 2
        )::float8                                                               AS concentracao
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE r.fornecedor IS NOT NULL AND r.fornecedor <> ''
      GROUP BY 1
      ORDER BY itens DESC
      LIMIT 20
    `),

    // ── Evolução Por Área — Por Status Atual (Imagem 5) ──────────────
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado')                                                  AS area,

        -- Concluídas (Válidas): situacao_norm = 'concluido'
        COUNT(*)         FILTER (WHERE r.situacao_norm = 'concluido')::int                 AS concluidas_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.situacao_norm = 'concluido'), 0)::float8
                                                                                           AS concluidas_itens,

        -- Em Andamento: não concluído/cancelado e prazo vigente ou sem data
        COUNT(*)         FILTER (WHERE r.situacao_norm IS NULL
                                   AND ${S} NOT IN ('concluido','cancelado','vencido'))::int AS andamento_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.situacao_norm IS NULL
                                            AND ${S} NOT IN ('concluido','cancelado','vencido')), 0)::float8
                                                                                           AS andamento_itens,

        -- Itens com Saldo (Válidos)
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.status_consumo = 'Com Saldo'), 0)::float8
                                                                                           AS saldo_itens,

        -- Itens sem Saldo (Válidos)
        COALESCE(SUM(r.quantidade) FILTER (WHERE r.status_consumo = 'Sem Saldo'), 0)::float8
                                                                                           AS semsaldo_itens,

        -- Vencidas
        COUNT(*)         FILTER (WHERE ${S} = 'vencido')::int                             AS vencidas_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE ${S} = 'vencido'), 0)::float8            AS vencidas_itens,

        -- A Vencer
        COUNT(*)         FILTER (WHERE ${S} = 'a_vencer')::int                            AS a_vencer_atas,
        COALESCE(SUM(r.quantidade) FILTER (WHERE ${S} = 'a_vencer'), 0)::float8           AS a_vencer_itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1
    `),

    // ── Status de Renovações por Área × status_renovacao (Imagens 6–7) ─
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado')              AS area,
        COALESCE(r.status_renovacao, 'Não Iniciado')   AS status,
        COUNT(*)::int                                   AS atas,
        COALESCE(SUM(r.quantidade), 0)::float8          AS itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      GROUP BY 1, 2
    `),

    // ── Previsão de Conclusão Por Faixa — atas EM ANDAMENTO (Imagens 9–12) ─
    // dias = data_previsao - hoje (pode ser negativo = vencida)
    // agrupado por área + responsável (para listar compradores na faixa)
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado')                                AS area,
        r.responsavel,
        (r.data_previsao::date - CURRENT_DATE)::int                      AS dias,
        COUNT(*)::int                                                     AS atas,
        COALESCE(SUM(r.quantidade), 0)::float8                           AS itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE r.situacao_norm IS NULL
        AND r.data_previsao IS NOT NULL
      GROUP BY 1, 2, 3
      ORDER BY 1, 3 ASC
    `),

    // ── Previsão de Conclusão por Mês (Imagem 13) ────────────────────
    // Para atas em andamento com data_previsao; inclui NULL como "Sem Previsão"
    db.execute(sql`
      SELECT
        COALESCE(r.area, 'Não informado')                                AS area,
        TO_CHAR(r.data_previsao::date, 'YYYY-MM')                        AS mes,
        COUNT(*)::int                                                     AS atas,
        COALESCE(SUM(r.quantidade), 0)::float8                           AS itens
      FROM records r
      JOIN datasets d ON d.id = r.dataset_id AND d.status = 'active'
      WHERE r.situacao_norm IS NULL
      GROUP BY 1, 2
      ORDER BY 1, 2 ASC NULLS LAST
    `),

    // ── Variação em relação à base anterior ──────────────────────────
    db.execute(sql`
      WITH active AS (
        SELECT d.kind, d.natureza, d.id, d.reference_date,
               d.imported_at::text AS imported_at,
               COUNT(r.id)::int    AS processos
        FROM datasets d
        LEFT JOIN records r ON r.dataset_id = d.id
        WHERE d.status = 'active'
        GROUP BY d.id
      ),
      prev AS (
        SELECT DISTINCT ON (d.kind)
               d.kind, d.reference_date,
               d.imported_at::text AS imported_at,
               (SELECT COUNT(*) FROM records r WHERE r.dataset_id = d.id)::int AS processos
        FROM datasets d
        WHERE d.status = 'superseded'
        ORDER BY d.kind, d.imported_at DESC
      )
      SELECT a.kind, a.natureza,
             a.processos  AS atual,   a.reference_date AS ref_atual,
             p.processos  AS anterior, p.reference_date AS ref_anterior,
             p.imported_at AS importado_anterior
      FROM active a
      JOIN prev p ON p.kind = a.kind
    `),
  ]);

  // ── Monta KPIs ───────────────────────────────────────────────────────
  const kpiRow = (kpisRes.rows[0] ?? {}) as Record<string, number>;
  const activeDatasets = (datasetsRes.rows as Record<string, unknown>[]).filter(
    (d) => d.status === "active",
  );

  // ── Verificações de consistência ────────────────────────────────────
  const checks: CheckItem[] = [];
  const skippedTotal = activeDatasets.reduce((a, d) => a + Number(d.skipped_count ?? 0), 0);
  const warnTotal    = activeDatasets.reduce((a, d) => a + Number(d.warning_count ?? 0), 0);
  const dupTotal     = activeDatasets.reduce((a, d) => a + Number(d.dup_count ?? 0), 0);

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
  for (const d of activeDatasets) {
    kindsAtivos.set(String(d.kind), (kindsAtivos.get(String(d.kind)) ?? 0) + 1);
  }
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
      mensagem:
        "O panorama está somando bases de naturezas diferentes (snapshot semanal e base operacional), que podem ter escopos e datas distintos. Considere manter ativa apenas a natureza desejada.",
    });
  }

  return {
    geradoEm: new Date().toISOString(),
    hasData: Number(kpiRow.processos ?? 0) > 0,

    // ── Bloco 1: KPIs (Imagem 2) ──
    kpis: {
      processos:       Number(kpiRow.processos       ?? 0),
      valorTotal:      Number(kpiRow.valor_total      ?? 0),
      itensTotal:      Number(kpiRow.itens_total      ?? 0),
      // Ata Concluídas (Válidas)
      concluidosAtas:  Number(kpiRow.concluidos_atas  ?? 0),
      concluidosItens: Number(kpiRow.concluidos_itens ?? 0),
      // Itens com Saldos e Consumidos (Válidos)
      saldoAtas:       Number(kpiRow.saldo_atas       ?? 0),
      saldoItens:      Number(kpiRow.saldo_itens      ?? 0),
      consumidoAtas:   Number(kpiRow.consumido_atas   ?? 0),
      consumidoItens:  Number(kpiRow.consumido_itens  ?? 0),
      // Atas Vencidas e A Vencer
      renovarAtas:     Number(kpiRow.a_vencer_atas    ?? 0),   // RENOVAR = a_vencer
      renovarItens:    Number(kpiRow.a_vencer_itens   ?? 0),
      vencidoAtas:     Number(kpiRow.vencido_atas     ?? 0),   // VENCIDO = vencido
      vencidoItens:    Number(kpiRow.vencido_itens    ?? 0),
    },

    situacaoLabels: SITUACAO_LABEL,

    // ── Bloco 2: Valor Contratado por Área + Saving (Imagem 3) ──
    porArea: porAreaRes.rows,

    // ── Bloco 3: Distribuição de Volume — Top 5 Compradores (Imagem 4) ──
    topCompradores: topCompradoresRes.rows,

    // ── Bloco 4: Representatividade Fornecedores Top 20 (Imagem 4) ──
    fornecedores: fornecedoresRes.rows,

    // ── Bloco 5: Evolução Por Área (Imagem 5) ──
    evolucao: evolucaoRes.rows,

    // ── Bloco 6: Status de Renovações (Imagens 6–7) ──
    renovacoes: renovacoesRes.rows,

    // ── Bloco 7: Previsão de Conclusão por Faixa (Imagens 9–12) ──
    previsoes: previsoesRes.rows,

    // ── Bloco 8: Previsão de Conclusão por Mês (Imagem 13) ──
    previsoesMes: previsoesMesRes.rows,

    // ── Variações vs base anterior ──
    variacoes: variacoesRes.rows,

    // ── Datasets (auditoria) ──
    datasets: datasetsRes.rows,

    checks,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
