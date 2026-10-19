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
  type SnapshotAtaConcluida,
  type SnapshotStatusAtasArea,
  SNAPSHOT_AREAS,
  type SnapshotBlockKey,
} from "@/lib/dashboard-snapshot";

/** Blocos do panorama que podem ficar sem dado quando a planilha não os traz. */
export const PANORAMA_BLOCKS = [
  "kpis-leitura",
  "atas-concluidas",
  "valores-por-area",
  "saving",
  "top-compradores",
  "fornecedores",
  "evolucao",
  "status-atas",
  "previsao-faixas",
  "previsao-meses",
] as const;
export type PanoramaBlock = (typeof PANORAMA_BLOCKS)[number];

/** Atas que passaram a FINALIZADO desde a importação anterior. */
export interface AtasConcluidasResult {
  disponivel: boolean;
  primeiraLeitura: boolean;
  comparadoComReferencia: string | null;
  comparadoComImportadoEm: string | null;
  totalFinalizadas: number;
  novas: SnapshotAtaConcluida[];
}

export type PanoramaBlockSource = "snapshot" | "registros" | "ausente";

export interface StaticDashboardData {
  geradoEm: string;
  hasData: boolean;
  currentSnapshot: DashboardSnapshotPayload | null;
  previousSnapshot: DashboardSnapshotPayload | null;
  blocos: Record<PanoramaBlock, PanoramaBlockSource>;
  savingTotal: {
    valorSaving: number;
    saving_hist: number;
    saving_prop: number;
    reducao_hist_pct: number | null;
    reducao_prop_pct: number | null;
  } | null;
  snapshotHistory: Array<{
    id: number;
    fileName: string;
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
    andamentoAtas: number;
    andamentoItens: number;
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
  atasConcluidas: AtasConcluidasResult;
  statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null>;
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

function daysUntil(iso: string, baseISO: string | null = null): number {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const base = baseISO ? baseISO.split("-").map(Number) : [];
  const now = new Date();
  const today = base.length === 3 && base.every((part) => Number.isFinite(part) && part > 0)
    ? new Date(base[0], base[1] - 1, base[2])
    : new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

function snapshotHas(snapshot: DashboardSnapshotPayload | null | undefined, key: string): boolean {
  return Boolean(snapshot?.coverage.found.includes(key));
}

/** Compara as atas FINALIZADO atuais com a importação anterior que trouxe a aba. */
function buildAtasConcluidas(
  current: DashboardSnapshotPayload | null,
  datasets: Array<{ snapshot: DashboardSnapshotPayload | null | undefined; importedAt: string }>,
): AtasConcluidasResult {
  const empty: AtasConcluidasResult = {
    disponivel: false,
    primeiraLeitura: true,
    comparadoComReferencia: null,
    comparadoComImportadoEm: null,
    totalFinalizadas: 0,
    novas: [],
  };
  if (!current || !snapshotHas(current, "atas-concluidas")) return empty;
  const atuais = current.atasConcluidas ?? [];
  const older = datasets.slice(1).filter((dataset) => snapshotHas(dataset.snapshot, "atas-concluidas"));
  const currentRef = current.referenceDate;
  const previous = older.find((dataset) => {
    const ref = dataset.snapshot?.referenceDate ?? null;
    return !currentRef || !ref || ref < currentRef;
  }) ?? older[0] ?? null;
  const previousKeys = new Set((previous?.snapshot?.atasConcluidas ?? []).map((ata) => ata.key));
  const novas = previous ? atuais.filter((ata) => !previousKeys.has(ata.key)) : [...atuais];
  const maps = [
    current.fornecedoresPorContrato ?? {},
    ...datasets.slice(1).map((dataset) => dataset.snapshot?.fornecedoresPorContrato ?? {}),
  ];
  const resolved = novas.map((ata) => {
    if (ata.fornecedor || !ata.contrato) return ata;
    const fornecedor = maps.map((map) => map[ata.contrato!]).find(Boolean) ?? null;
    return { ...ata, fornecedor };
  });
  return {
    disponivel: true,
    primeiraLeitura: !previous,
    comparadoComReferencia: previous?.snapshot?.referenceDate ?? null,
    comparadoComImportadoEm: previous?.importedAt ?? null,
    totalFinalizadas: atuais.length,
    novas: resolved,
  };
}

export async function getStaticDashboardData(): Promise<StaticDashboardData> {
  const [rows, allDatasets, snapshotDatasets] = await Promise.all([
    listActiveProcessRows(),
    listDatasets(),
    listSnapshotDatasets(),
  ]);

  const currentSnapshot = snapshotDatasets[0]?.snapshot ?? null;
  // Antes de uma segunda importação, a referência fornecida para 13/10 mantém
  // os cards da semana anterior comparáveis. A partir da segunda leitura, o
  // histórico real ocupa este lugar automaticamente.
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
    andamentoAtas: rows.filter((r) => r.situacao_norm === null).length,
    andamentoItens: rows.filter((r) => r.situacao_norm === null).reduce((s, r) => s + n(r.quantidade), 0),
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
    kpis.andamentoAtas = currentSnapshot.kpis.andamentoAtas ?? kpis.andamentoAtas;
    kpis.andamentoItens = currentSnapshot.kpis.andamentoItens ?? kpis.andamentoItens;
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

  // O panorama usa exclusivamente a tabela FORNECEDORES GERAL. Não há
  // fallback para agrupar fornecedores dos registros operacionais, pois isso
  // troca a base consolidada da planilha por uma contagem parcial/por área.
  const fornecedores: StaticDashboardData["fornecedores"] = currentSnapshot && snapshotHas(currentSnapshot, "fornecedores")
    ? (currentSnapshot.fornecedoresGeral ?? []).map((item) => ({
        area: "Geral",
        fornecedor: item.fornecedor,
        atas: item.qtdAtas ?? 0,
        itens: item.qtdItens ?? 0,
        concentracao: item.concentracaoPct ?? 0,
        analise: item.analise,
      }))
    : [];

  const atasConcluidas = buildAtasConcluidas(currentSnapshot, snapshotDatasets);
  const statusAtas: Record<SnapshotArea, SnapshotStatusAtasArea | null> = {
    INDIRETOS: null,
    DIRETOS: null,
    CAPEX: null,
  };
  if (currentSnapshot && snapshotHas(currentSnapshot, "status-atas")) {
    for (const area of SNAPSHOT_AREAS) statusAtas[area] = currentSnapshot.statusAtas?.[area] ?? null;
  }

  const forecastGroups = new Map<string, { area: string; responsavel: string; data_previsao: string; dias: number; atas: number; itens: number; band?: ForecastBand }>();
  for (const row of rows) {
    if (row.situacao_norm !== null || !row.data_previsao) continue;
    const area = row.area ?? "Não informado";
    const responsavel = row.responsavel ?? "Não informado";
    const key = groupKey(area, responsavel, row.data_previsao);
    const current = forecastGroups.get(key) ?? { area, responsavel, data_previsao: row.data_previsao, dias: daysUntil(row.data_previsao, currentSnapshot?.referenceDate ?? null), atas: 0, itens: 0 };
    current.atas += 1;
    current.itens += n(row.quantidade);
    forecastGroups.set(key, current);
  }
  let previsoes = [...forecastGroups.values()].sort((a, b) => a.dias - b.dias);
  if (currentSnapshot && (snapshotHas(currentSnapshot, "previsao-faixas") || snapshotHas(currentSnapshot, "previsoes-cruzadas"))) {
    const snapshotForecast: typeof previsoes = [];
    // O panorama não exibe previsões canceladas ou finalizadas, mesmo quando
    // essas faixas existirem no snapshot importado.
    for (const band of ["acima_60", "ate_15", "ate_30", "ate_60", "vencidas"] as ForecastBand[]) {
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
              ? daysUntil(buyer.prazoConclusao, currentSnapshot?.referenceDate ?? null)
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

  // Um bloco ausente não deve aparecer como zero: isso diferencia “não veio na
  // planilha” de um indicador realmente igual a zero.
  const hasRows = rows.length > 0;
  const fromSnapshotOr = (key: SnapshotBlockKey, fallback: boolean): PanoramaBlockSource =>
    snapshotHas(currentSnapshot, key) ? "snapshot" : fallback ? "registros" : "ausente";
  const blocos: Record<PanoramaBlock, PanoramaBlockSource> = {
    "kpis-leitura": fromSnapshotOr("kpis-leitura", hasRows),
    "atas-concluidas": fromSnapshotOr("atas-concluidas", false),
    "valores-por-area": fromSnapshotOr("valores-por-area", rows.some((row) => row.valor !== null)),
    saving: fromSnapshotOr("saving", rows.some((row) => row.saving_hist !== null || row.saving_prop !== null)),
    "top-compradores": fromSnapshotOr("top-compradores", rows.some((row) => Boolean(row.responsavel?.trim()))),
    fornecedores: fromSnapshotOr("fornecedores", false),
    evolucao: fromSnapshotOr("evolucao", hasRows),
    "status-atas": fromSnapshotOr("status-atas", false),
    "previsao-faixas": snapshotHas(currentSnapshot, "previsao-faixas") || snapshotHas(currentSnapshot, "previsoes-cruzadas")
      ? "snapshot"
      : rows.some((row) => row.situacao_norm === null && Boolean(row.data_previsao)) ? "registros" : "ausente",
    "previsao-meses": fromSnapshotOr("previsao-meses", false),
  };

  const snapshotHistory = snapshotDatasets.map((dataset) => ({
    id: dataset.id,
    fileName: dataset.fileName,
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
    blocos,
    savingTotal,
    snapshotHistory,
    kpis,
    porArea,
    topCompradores,
    fornecedores,
    evolucao: [...currentEvolution.values()],
    atasConcluidas,
    statusAtas,
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
