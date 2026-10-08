import {
  listActiveDatasets,
  listActiveProcessRows,
  listDatasets,
  listSnapshotDatasets,
  formatStoredDataset,
  type ProcessRow,
} from "@/lib/static-store";
import {
  defaultPreviousSnapshot,
  type DashboardSnapshotPayload,
  type ForecastBand,
  type SnapshotArea,
  SNAPSHOT_AREAS,
} from "@/lib/dashboard-snapshot";

export interface StaticDashboardData {
  geradoEm: string;
  hasData: boolean;
  currentSnapshot: DashboardSnapshotPayload | null;
  previousSnapshot: DashboardSnapshotPayload | null;
  savingTotal: {
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  } | null;
  snapshotHistory: Array<{
    id: number;
    referenceDate: string | null;
    importedAt: string;
    status: string;
    coverage: string[];
  }>;
  kpis: {
    processos: number;
    valorTotal: number;
    itens: number;
    concluidosAtas: number;
    concluidosItens: number;
    saldoAtas: number;
    saldoItens: number;
    consumidoAtas: number;
    consumidoItens: number;
    aVencerAtas: number;
    aVencerItens: number;
    vencidasAtas: number;
    vencidasItens: number;
    vencidasVencerAtas: number;
    vencidasVencerItens: number;
  };
  porArea: Array<{
    area: string;
    processos: number;
    valor: number;
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  }>;
  topCompradores: Array<{
    area: string;
    responsavel: string;
    atas: number;
    itens: number;
    totalAtasArea: number | null;
  }>;
  fornecedores: Array<{
    area: string;
    fornecedor: string;
    atas: number;
    itens: number;
    concentracao: number;
    analise: string | null;
  }>;
  evolucao: Array<{
    area: string;
    concluidas_atas: number;
    concluidas_itens: number;
    andamento_atas: number;
    andamento_itens: number;
    saldo_itens: number;
    semsaldo_itens: number;
    vencidas_atas: number;
    vencidas_itens: number;
    a_vencer_atas: number;
    a_vencer_itens: number;
  }>;
  renovacoes: Array<{ area: string; status: string; atas: number; itens: number }>;
  previsoes: Array<{
    area: string;
    responsavel: string;
    data_previsao: string;
    dias: number;
    atas: number;
    itens: number;
    band?: ForecastBand;
  }>;
  datasets: ReturnType<typeof formatStoredDataset>[];
}

const AREAS = ["Indiretos", "Diretos", "CAPEX"] as const;
const AREA_KEYS: Record<string, SnapshotArea> = {
  INDIRETOS: "INDIRETOS",
  INDIRETO: "INDIRETOS",
  DIRETOS: "DIRETOS",
  DIRETO: "DIRETOS",
  CAPEX: "CAPEX",
};

function n(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function groupKey(...values: string[]) {
  return values.join("\u0000");
}

function areaKey(value: string | null | undefined): SnapshotArea | null {
  if (!value) return null;
  return AREA_KEYS[value.trim().toUpperCase()] ?? null;
}

function areaDisplay(value: SnapshotArea): string {
  return value[0] + value.slice(1).toLowerCase();
}

function daysUntil(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function emptyEvolution(area: string) {
  return {
    area,
    concluidas_atas: 0,
    concluidas_itens: 0,
    andamento_atas: 0,
    andamento_itens: 0,
    saldo_itens: 0,
    semsaldo_itens: 0,
    vencidas_atas: 0,
    vencidas_itens: 0,
    a_vencer_atas: 0,
    a_vencer_itens: 0,
  };
}

function forecastBandDays(band: ForecastBand): number {
  if (band === "vencidas") return -1;
  if (band === "ate_15") return 7;
  if (band === "ate_30") return 23;
  if (band === "ate_60") return 45;
  return 61;
}

function snapshotHas(snapshot: DashboardSnapshotPayload | null, key: string): boolean {
  return Boolean(snapshot?.coverage.found.includes(key));
}

export async function getStaticDashboardData(): Promise<StaticDashboardData> {
  const [rows, allDatasets, snapshotDatasets] = await Promise.all([
    listActiveProcessRows(),
    listDatasets(),
    listSnapshotDatasets(),
  ]);

  const currentSnapshot = snapshotDatasets[0]?.snapshot ?? null;
  // Antes de uma segunda importação, a referência fornecida para 28/09 mantém
  // os três gráficos comparáveis. A partir da segunda leitura, o histórico real
  // ocupa este lugar automaticamente.
  const previousSnapshot = snapshotDatasets[1]?.snapshot ?? (currentSnapshot ? defaultPreviousSnapshot() : null);

  const byArea = new Map<string, ProcessRow[]>();
  for (const row of rows) {
    const area = row.area ?? "Não informado";
    const current = byArea.get(area) ?? [];
    current.push(row);
    byArea.set(area, current);
  }

  const valueOf = (list: ProcessRow[], key: keyof ProcessRow) =>
    list.reduce((sum, row) => sum + n(row[key] as number | null), 0);

  const baseKpis = {
    processos: rows.length,
    valorTotal: valueOf(rows, "valor"),
    itens: valueOf(rows, "quantidade"),
    concluidosAtas: rows.filter((r) => r.situacao_norm === "concluido").length,
    concluidosItens: rows.filter((r) => r.situacao_norm === "concluido").reduce((s, r) => s + n(r.quantidade), 0),
    saldoAtas: rows.filter((r) => r.status_consumo === "Com Saldo").length,
    saldoItens: rows.filter((r) => r.status_consumo === "Com Saldo").reduce((s, r) => s + n(r.quantidade), 0),
    consumidoAtas: rows.filter((r) => r.status_consumo === "Consumido").length,
    consumidoItens: rows.filter((r) => r.status_consumo === "Consumido").reduce((s, r) => s + n(r.quantidade), 0),
    aVencerAtas: rows.filter((r) => r.situacao === "a_vencer").length,
    aVencerItens: rows.filter((r) => r.situacao === "a_vencer").reduce((s, r) => s + n(r.quantidade), 0),
    vencidasAtas: rows.filter((r) => r.situacao === "vencido").length,
    vencidasItens: rows.filter((r) => r.situacao === "vencido").reduce((s, r) => s + n(r.quantidade), 0),
    vencidasVencerAtas: rows.filter((r) => r.situacao === "vencido" || r.situacao === "a_vencer").length,
    vencidasVencerItens: rows
      .filter((r) => r.situacao === "vencido" || r.situacao === "a_vencer")
      .reduce((s, r) => s + n(r.quantidade), 0),
  };

  const baseAreaRows = new Map<SnapshotArea, ProcessRow[]>();
  for (const area of SNAPSHOT_AREAS) baseAreaRows.set(area, []);
  for (const [name, areaRows] of byArea) {
    const key = areaKey(name);
    if (key) baseAreaRows.set(key, [...(baseAreaRows.get(key) ?? []), ...areaRows]);
  }

  const baseEvolution = new Map<SnapshotArea, ReturnType<typeof emptyEvolution>>();
  for (const area of SNAPSHOT_AREAS) {
    const areaRows = baseAreaRows.get(area) ?? [];
    const concluidas = areaRows.filter((r) => r.situacao_norm === "concluido");
    const andamento = areaRows.filter((r) => r.situacao_norm === null);
    const vencidas = areaRows.filter((r) => r.situacao === "vencido");
    const aVencer = areaRows.filter((r) => r.situacao === "a_vencer");
    baseEvolution.set(area, {
      area: areaDisplay(area),
      concluidas_atas: concluidas.length,
      concluidas_itens: concluidas.reduce((s, r) => s + n(r.quantidade), 0),
      andamento_atas: andamento.length,
      andamento_itens: andamento.reduce((s, r) => s + n(r.quantidade), 0),
      saldo_itens: areaRows.filter((r) => r.status_consumo === "Com Saldo").reduce((s, r) => s + n(r.quantidade), 0),
      semsaldo_itens: areaRows.filter((r) => r.status_consumo === "Sem Saldo").reduce((s, r) => s + n(r.quantidade), 0),
      vencidas_atas: vencidas.length,
      vencidas_itens: vencidas.reduce((s, r) => s + n(r.quantidade), 0),
      a_vencer_atas: aVencer.length,
      a_vencer_itens: aVencer.reduce((s, r) => s + n(r.quantidade), 0),
    });
  }

  const currentEvolution = baseEvolution;
  if (currentSnapshot && snapshotHas(currentSnapshot, "evolucao")) {
    for (const area of SNAPSHOT_AREAS) {
      const source = currentSnapshot.evolucao[area];
      const target = currentEvolution.get(area)!;
      target.concluidas_atas = source.concluidasAtas ?? target.concluidas_atas;
      target.concluidas_itens = source.concluidasItens ?? target.concluidas_itens;
      target.andamento_atas = source.andamentoAtas ?? target.andamento_atas;
      target.andamento_itens = source.andamentoItens ?? target.andamento_itens;
      target.saldo_itens = source.saldoItens ?? target.saldo_itens;
      target.semsaldo_itens = source.semSaldoItens ?? target.semsaldo_itens;
      target.vencidas_atas = source.vencidasAtas ?? target.vencidas_atas;
      target.vencidas_itens = source.vencidasItens ?? target.vencidas_itens;
      target.a_vencer_atas = source.aVencerAtas ?? target.a_vencer_atas;
      target.a_vencer_itens = source.aVencerItens ?? target.a_vencer_itens;
    }
  }

  const kpis = { ...baseKpis };
  if (currentSnapshot && snapshotHas(currentSnapshot, "kpis-leitura")) {
    kpis.concluidosAtas = currentSnapshot.kpis.concluidasAtas ?? kpis.concluidosAtas;
    kpis.concluidosItens = currentSnapshot.kpis.concluidasItens ?? kpis.concluidosItens;
    kpis.saldoItens = currentSnapshot.kpis.saldoItens ?? kpis.saldoItens;
    kpis.consumidoItens = currentSnapshot.kpis.consumidoItens ?? kpis.consumidoItens;
    kpis.aVencerAtas = currentSnapshot.kpis.aVencerAtas ?? kpis.aVencerAtas;
    kpis.aVencerItens = currentSnapshot.kpis.aVencerItens ?? kpis.aVencerItens;
    kpis.vencidasAtas = currentSnapshot.kpis.vencidasAtas ?? kpis.vencidasAtas;
    kpis.vencidasItens = currentSnapshot.kpis.vencidasItens ?? kpis.vencidasItens;
    kpis.vencidasVencerAtas = kpis.aVencerAtas + kpis.vencidasAtas;
    kpis.vencidasVencerItens = kpis.aVencerItens + kpis.vencidasItens;
  }

  const porArea = SNAPSHOT_AREAS.map((key) => {
    const areaRows = baseAreaRows.get(key) ?? [];
    const source = currentSnapshot?.valueAreas[key];
    const evolution = currentEvolution.get(key)!;
    const totalFromTop = currentSnapshot?.topCompradores[key]?.totalAtasArea ?? null;
    const processos = totalFromTop ?? ((evolution.concluidas_atas + evolution.andamento_atas) || areaRows.length);
    return {
      area: areaDisplay(key),
      processos,
      valor: source?.valor ?? valueOf(areaRows, "valor"),
      valorSaving: source?.valorSaving ?? source?.valor ?? valueOf(areaRows, "valor"),
      saving_hist: source?.savingHist ?? valueOf(areaRows, "saving_hist"),
      saving_prop: source?.savingProp ?? valueOf(areaRows, "saving_prop"),
      reducao_hist_pct: source?.reducaoHistPct ?? null,
      reducao_prop_pct: source?.reducaoPropPct ?? null,
    };
  });

  // Quando a planilha consolidada é a única fonte, os totais do painel vêm
  // dos blocos explícitos, não da contagem de linhas operacionais (que pode ser
  // zero em uma importação somente de métricas).
  if (currentSnapshot) {
    kpis.processos = porArea.reduce((sum, area) => sum + area.processos, 0);
    kpis.valorTotal = porArea.reduce((sum, area) => sum + area.valor, 0);
    kpis.itens = [...currentEvolution.values()].reduce((sum, area) => sum + area.concluidas_itens + area.andamento_itens, 0);
  }

  const genericBuyerGroups = new Map<string, { area: string; responsavel: string; atas: number; itens: number; totalAtasArea: number | null }>();
  for (const row of rows) {
    const responsavel = row.responsavel?.trim();
    if (!responsavel) continue;
    const area = row.area ?? "Não informado";
    const key = groupKey(area, responsavel);
    const current = genericBuyerGroups.get(key) ?? { area, responsavel, atas: 0, itens: 0, totalAtasArea: null };
    current.atas += 1;
    current.itens += n(row.quantidade);
    genericBuyerGroups.set(key, current);
  }
  let topCompradores = [...genericBuyerGroups.values()]
    .sort((a, b) => b.itens - a.itens || b.atas - a.atas)
    .reduce((acc, item) => {
      const count = acc.filter((x) => x.area === item.area).length;
      if (count < 5) acc.push(item);
      return acc;
    }, [] as Array<{ area: string; responsavel: string; atas: number; itens: number; totalAtasArea: number | null }>);
  if (currentSnapshot && snapshotHas(currentSnapshot, "top-compradores")) {
    topCompradores = SNAPSHOT_AREAS.flatMap((area) => currentSnapshot.topCompradores[area].buyers.map((buyer) => ({
      area: areaDisplay(area),
      responsavel: buyer.name,
      atas: buyer.atas,
      itens: buyer.itens,
      totalAtasArea: currentSnapshot.topCompradores[area].totalAtasArea,
    })));
  }

  const genericSupplierGroups = new Map<string, { area: string; fornecedor: string; atas: number; itens: number; concentracao: number; analise: string | null }>();
  for (const row of rows) {
    const fornecedor = row.fornecedor?.trim();
    if (!fornecedor) continue;
    const area = row.area ?? "Não informado";
    const key = groupKey(area, fornecedor);
    const current = genericSupplierGroups.get(key) ?? { area, fornecedor, atas: 0, itens: 0, concentracao: 0, analise: null };
    current.atas += 1;
    current.itens += n(row.quantidade);
    genericSupplierGroups.set(key, current);
  }
  const genericSuppliers = [...genericSupplierGroups.values()];
  const totalSupplierItems = genericSuppliers.reduce((sum, item) => sum + item.itens, 0);
  let fornecedores = genericSuppliers
    .map((item) => ({ ...item, concentracao: totalSupplierItems ? (item.itens / totalSupplierItems) * 100 : 0 }))
    .sort((a, b) => b.itens - a.itens)
    .slice(0, 20);
  if (currentSnapshot && snapshotHas(currentSnapshot, "fornecedores")) {
    fornecedores = SNAPSHOT_AREAS.flatMap((area) => currentSnapshot.fornecedores[area].map((item) => ({
      area: areaDisplay(area),
      fornecedor: item.fornecedor,
      atas: item.qtdAtas ?? 0,
      itens: item.qtdItens ?? 0,
      concentracao: item.concentracaoPct ?? 0,
      analise: item.analise,
    })));
  }

  const renewalGroups = new Map<string, { area: string; status: string; atas: number; itens: number }>();
  for (const row of rows) {
    const key = groupKey(row.area ?? "Não informado", row.status_renovacao ?? "Outros");
    const current = renewalGroups.get(key) ?? { area: row.area ?? "Não informado", status: row.status_renovacao ?? "Outros", atas: 0, itens: 0 };
    current.atas += 1;
    current.itens += n(row.quantidade);
    renewalGroups.set(key, current);
  }

  const forecastGroups = new Map<string, { area: string; responsavel: string; data_previsao: string; dias: number; atas: number; itens: number; band?: ForecastBand }>();
  for (const row of rows) {
    if (row.situacao_norm !== null || !row.data_previsao) continue;
    const area = row.area ?? "Não informado";
    const responsavel = row.responsavel ?? "Não informado";
    const key = groupKey(area, responsavel, row.data_previsao);
    const current = forecastGroups.get(key) ?? { area, responsavel, data_previsao: row.data_previsao, dias: daysUntil(row.data_previsao), atas: 0, itens: 0 };
    current.atas += 1;
    current.itens += n(row.quantidade);
    forecastGroups.set(key, current);
  }
  let previsoes = [...forecastGroups.values()].sort((a, b) => a.dias - b.dias);
  if (currentSnapshot && (snapshotHas(currentSnapshot, "previsao-faixas") || snapshotHas(currentSnapshot, "previsoes-cruzadas"))) {
    const snapshotForecast: typeof previsoes = [];
    for (const band of ["ate_15", "ate_30", "ate_60", "vencidas"] as ForecastBand[]) {
      for (const area of SNAPSHOT_AREAS) {
        const source = currentSnapshot.previsoes[band][area];
        const totalAtas = source.atas ?? 0;
        const totalItens = source.itens ?? 0;
        const listedAtas = source.buyers.reduce((sum, buyer) => sum + buyer.atas, 0);
        const listedItens = source.buyers.reduce((sum, buyer) => sum + buyer.itens, 0);
        for (const buyer of source.buyers) {
          snapshotForecast.push({
            area: areaDisplay(area),
            responsavel: buyer.name,
            data_previsao: buyer.prazoConclusao ?? "",
            dias: buyer.prazoConclusao && /^\d{4}-\d{2}-\d{2}$/.test(buyer.prazoConclusao)
              ? daysUntil(buyer.prazoConclusao)
              : forecastBandDays(band),
            atas: buyer.atas,
            itens: buyer.itens,
            band,
          });
        }
        // Mantém os totais exatos da tabela de faixas mesmo quando a planilha
        // de compradores possui somente parte das linhas detalhadas.
        if (totalAtas !== listedAtas || totalItens !== listedItens) {
          snapshotForecast.push({
            area: areaDisplay(area),
            responsavel: "",
            data_previsao: "",
            dias: forecastBandDays(band),
            atas: Math.max(0, totalAtas - listedAtas),
            itens: Math.max(0, totalItens - listedItens),
            band,
          });
        }
      }
    }
    previsoes = snapshotForecast;
  }

  const hasData = rows.length > 0 || Boolean(currentSnapshot);
  const savingTotal = currentSnapshot && snapshotHas(currentSnapshot, "saving")
    ? {
        valorSaving: currentSnapshot.savingTotal.valorSaving ?? porArea.reduce((sum, area) => sum + area.valorSaving, 0),
        saving_hist: currentSnapshot.savingTotal.savingHist ?? porArea.reduce((sum, area) => sum + area.saving_hist, 0),
        saving_prop: currentSnapshot.savingTotal.savingProp ?? porArea.reduce((sum, area) => sum + area.saving_prop, 0),
        reducao_hist_pct: currentSnapshot.savingTotal.reducaoHistPct,
        reducao_prop_pct: currentSnapshot.savingTotal.reducaoPropPct,
      }
    : null;
  const snapshotHistory = snapshotDatasets.map((dataset) => ({
    id: dataset.id,
    referenceDate: dataset.referenceDate,
    importedAt: dataset.importedAt,
    status: dataset.status,
    coverage: dataset.snapshot?.coverage.found ?? [],
  }));

  return {
    geradoEm: new Date().toISOString(),
    hasData,
    currentSnapshot,
    previousSnapshot,
    savingTotal,
    snapshotHistory,
    kpis,
    porArea,
    topCompradores,
    fornecedores,
    evolucao: [...currentEvolution.values()],
    renovacoes: [...renewalGroups.values()].sort((a, b) => a.area.localeCompare(b.area) || a.status.localeCompare(b.status)),
    previsoes,
    datasets: allDatasets.map(formatStoredDataset),
  };
}

export async function getStaticBaseSummary() {
  const data = await getStaticDashboardData();
  const active = await listActiveDatasets();
  const references = active.map((d) => d.referenceDate).filter(Boolean) as string[];
  return {
    hasData: data.hasData,
    referenceDate: references.sort().reverse()[0] ?? data.currentSnapshot?.referenceDate ?? null,
    activeCount: active.length,
    processCount: data.kpis.processos,
  };
}
