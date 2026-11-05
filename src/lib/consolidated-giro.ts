/**
 * Leitura automática das três bases consolidadas do Giro:
 * Negociação + Renovação + Base - Controle de Contratos.
 *
 * Não depende das abas-resumo GIRO 01–07 nem de posições fixas de colunas.
 * O mesmo módulo alimenta o snapshot do Panorama e os registros da consulta
 * de Processos; a comparação semanal continua sendo feita pelo IndexedDB.
 */
import type {
  DashboardSnapshotPayload,
  SnapshotSourceSheet,
} from "./dashboard-snapshot";
import type { CleanRecord, Issue, ValidationResult } from "./domain";

const AREAS = ["INDIRETOS", "DIRETOS", "CAPEX"] as const;
const BANDS = ["ate_15", "ate_30", "ate_60", "vencidas", "acima_60", "canceladas", "finalizadas"] as const;
const BLOCK_KEYS = [
  "kpis-leitura", "valores-por-area", "saving", "top-compradores", "fornecedores",
  "evolucao", "previsao-faixas", "previsao-meses", "previsoes-cruzadas",
  "atas-concluidas", "contratos-fornecedores", "status-atas",
];
const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

type Area = (typeof AREAS)[number];
type Rec = Record<string, any>;
type Matrix = unknown[][];
interface Table {
  sheet: SnapshotSourceSheet;
  headerRow: number;
  map: Record<string, number>;
  rows: Matrix;
  preHeader: Matrix;
}

export interface ConsolidatedGiroExtraction {
  snapshot: DashboardSnapshotPayload;
  result: ValidationResult;
}

function clean(value: unknown): string {
  return String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function headerNorm(value: unknown): string {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

function upper(value: unknown): string {
  return clean(value).toUpperCase();
}

function round2(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function parseMoneyBR(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? round2(value) : 0;
  const raw = clean(value);
  if (!raw || /^R?\$?\s*-?$/.test(raw) || raw.includes("#")) return 0;
  const negative = /^\s*-/.test(raw) || /^\(.*\)$/.test(raw);
  let text = raw.replace(/R\$/gi, "").replace(/%/g, "").replace(/\s/g, "");
  text = text.replace(/[^\d.,-]/g, "").replace(/-/g, "");
  if (!text) return 0;
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".");
  else text = text.replace(/\.(?=\d{3}(?:\D|$))/g, "");
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return 0;
  return round2(negative ? -Math.abs(parsed) : parsed);
}

function parseIntBR(value: unknown): number {
  return Math.round(parseMoneyBR(value));
}

function parseDateBR(value: unknown): { iso: string; br: string } {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return { iso: `${year}-${month}-${day}`, br: `${day}/${month}/${year}` };
  }
  const raw = clean(value);
  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12) return { iso: "", br: "" };
    const dd = String(day).padStart(2, "0");
    const mm = String(month).padStart(2, "0");
    return { iso: `${year}-${mm}-${dd}`, br: `${dd}/${mm}/${year}` };
  }
  match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return { iso: raw, br: `${match[3]}/${match[2]}/${match[1]}` };
  return { iso: "", br: "" };
}

function daysBetween(fromIso: string, toIso: string): number | null {
  if (!fromIso || !toIso) return null;
  return Math.round((new Date(`${toIso}T00:00:00Z`).getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86400000);
}

function pct(num: number, den: number): number {
  return den ? round2((num * 100) / den) : 0;
}

function areaKey(raw: unknown): Area | "" {
  const value = upper(raw);
  if (value.includes("CAPEX")) return "CAPEX";
  if (value.includes("INDIRET")) return "INDIRETOS";
  if (value.includes("DIRET")) return "DIRETOS";
  return "";
}

function areaLabel(raw: unknown): string {
  const key = areaKey(raw);
  return key === "INDIRETOS" ? "Indiretos" : key === "DIRETOS" ? "Diretos" : key === "CAPEX" ? "CAPEX" : "Não informado";
}

function stripCode(raw: unknown): string {
  return clean(raw).replace(/\s*\([A-Z]?\d+\)\s*$/i, "").trim();
}

function normBuyer(raw: unknown): string {
  const value = stripCode(raw).toUpperCase();
  if (!value) return "";
  if (["FABIO LUIS", "FÁBIO LUIS", "FABIO LUÍS"].includes(value)) return "FÁBIO LUÍS";
  if (value === "LUCAS MAIA VICENTINI") return "LUCAS VICENTINI";
  return value;
}

function normModalidade(raw: unknown): string {
  const original = clean(raw).replace(/\s*\(\d+\)\s*$/, "").trim();
  const value = upper(original);
  if (!value) return "Não informada";
  if (value.includes("ATO CONVOCAT")) return "Ato Convocatório";
  if (value.includes("COTA") && value.includes("SIMPLIF")) return "Cotação Simplificada";
  if (value.includes("DISPENSA")) return "Dispensa";
  if (value.includes("EXCLUSIV")) return "Exclusividade";
  if (value.includes("INEXIG") || value.includes("INEXIB")) return "Inexigibilidade";
  if (value.includes("CATÁLOGO") || value.includes("CATALOGO")) return "Ata / Catálogo";
  return original;
}

function normGrupo(raw: unknown): string {
  const base = clean(raw).replace(/\s*\(\d+\)\s*$/, "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!base) return "Não classificado";
  if (base.startsWith("ALMOXATIFADO") || base.startsWith("ALMOXARIFADO")) return "ALMOXARIFADO TÉCNICO";
  if (base.startsWith("ALIMENTOS PARA ANIMA")) return "ALIMENTOS PARA ANIMAIS";
  if (base.startsWith("ANIMAIS E ACESSORIOS")) return "ANIMAIS E ACESSÓRIOS";
  if (base.startsWith("AUX. DE PRODU") || base.startsWith("AUXILIAR DE PRODU") || base === "MATERIAL AUXILIAR DE PRODUÇÃO") return "AUXILIAR DE PRODUÇÃO";
  if (base.startsWith("MATERIAIS AUX CRITIC")) return "MATERIAIS AUX. CRÍTICOS";
  if (base.startsWith("CONSTR.CV")) return "CONSTRUÇÃO CIVIL / MARCENARIA";
  if (base.startsWith("CONSUMÍVEL DE PRODU") || base.startsWith("CONSUMIVEL DE PRODU")) return base.includes("REAGENTE") ? "CONSUMÍVEIS / REAGENTES CONTROLADOS" : "CONSUMÍVEL DE PRODUÇÃO";
  if (base.startsWith("ELETRICA / AUTOMA")) return "ELÉTRICA / AUTOMAÇÃO";
  if (base.startsWith("EMBALAG")) return "EMBALAGENS E ACONDICIONAMENTO";
  if (base.startsWith("EPI E EPC")) return "EPI E EPC";
  if (base.startsWith("FERRAMENTAS MANUAIS")) return "FERRAMENTAS MANUAIS";
  if (base.startsWith("FERTILIZANTES E DEFE")) return "FERTILIZANTES E DEFENSIVOS";
  if (base.startsWith("FLORES,PLANTAS")) return "FLORES, PLANTAS E SEMENTES";
  if (base.startsWith("INSUMOS CLINICOS")) return "INSUMOS CLÍNICOS E DIAGNÓSTICOS";
  if (base.startsWith("INSUMOS HOSP")) return "INSUMOS HOSPITALARES";
  if (base.startsWith("INSUMOS PARA FAZENDA")) return "INSUMOS PARA FAZENDA";
  if (base.startsWith("MATERIA PRIMA") || base.startsWith("MATÉRIA PRIMA")) return "MATÉRIA-PRIMA";
  if (base.startsWith("MATERIAIS DE ESCRITO")) return "MATERIAIS DE ESCRITÓRIO";
  if (base.startsWith("MATERIAIS E EQUIPAME")) return "MATERIAIS E EQUIPAMENTOS LAB.";
  if (base.startsWith("MATERIAIS ESTUDOS CL")) return "MATERIAIS ESTUDOS CLÍNICOS";
  if (base.startsWith("PECAS DE VEICULOS")) return "PEÇAS DE VEÍCULOS";
  if (base.startsWith("REAGENTE CONTROLAD") || base.startsWith("REAGENTES CONTROLAD")) return "REAGENTES CONTROLADOS";
  if (base.startsWith("REAGENTE CONSUMO") || base.startsWith("REAGENTES CONSUMO")) return base.includes("AUXILIAR") ? "REAGENTES E AUX. PRODUÇÃO" : "REAGENTES DE CONSUMO";
  if (base.startsWith("SERVICOS DE MANUTENC")) return "SERVIÇOS DE MANUTENÇÃO";
  if (base.startsWith("SUPRIMENTOS DE INFOR")) return "SUPRIMENTOS DE INFORMÁTICA";
  if (base.startsWith("TINTAS / ABRASIVOS")) return "TINTAS E ABRASIVOS";
  if (base === "MOBILIARIO") return "MOBILIÁRIO";
  return base;
}

function normTipoDocSap(raw: unknown): string {
  const value = upper(raw);
  if (!value) return "";
  if (value.includes("QTD") || value.includes("QUANT")) return "Por Quantidade";
  if (value.includes("VALOR")) return "Por Valor";
  return clean(raw);
}

function makeHeader(sheet: SnapshotSourceSheet, required: string[]): Table | null {
  const req = required.map(headerNorm);
  const headerRow = sheet.matrix.findIndex((row) => {
    const cells = new Set(row.map(headerNorm));
    return req.every((name) => cells.has(name));
  });
  if (headerRow < 0) return null;
  const map: Record<string, number> = {};
  sheet.matrix[headerRow].forEach((value, index) => {
    const key = headerNorm(value);
    // Em cabeçalhos duplicados, preserva a primeira ocorrência, como no gerador validado.
    if (key && map[key] === undefined) map[key] = index;
  });
  return { sheet, headerRow, map, rows: sheet.matrix.slice(headerRow + 1), preHeader: sheet.matrix.slice(0, headerRow) };
}

function findTable(sheets: SnapshotSourceSheet[], required: string[]): Table | null {
  for (const sheet of sheets) {
    const table = makeHeader(sheet, required);
    if (table) return table;
  }
  return null;
}

function cell(row: unknown[], map: Record<string, number>, name: string): string {
  const index = map[headerNorm(name)];
  return index === undefined ? "" : clean(row[index]);
}

function rawCell(row: unknown[], map: Record<string, number>, name: string): unknown {
  const index = map[headerNorm(name)];
  return index === undefined ? null : row[index];
}

function hashRecord(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `consolidado-${(hash >>> 0).toString(16)}`;
}

function compactStrings(values: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    const text = clean(value);
    if (text) result[key] = text;
  }
  return result;
}

/**
 * Retorna null para planilhas legadas, permitindo o fallback GIRO 01–07.
 * Se a nova Base for detectada sem as outras duas bases, informa o que falta.
 */
export function extractConsolidatedGiro(
  sheets: SnapshotSourceSheet[],
  options: { fileNames?: string[]; referenceDate?: string | null } = {},
): ConsolidatedGiroExtraction | null {
  const base = findTable(sheets, ["CW", "Contrato", "Cód SAP", "Valor total", "Área", "Status do CW"]);
  if (!base) return null;
  const neg = findTable(sheets, ["DESCRIÇÃO DOS LOTES ATAS", "QTD ITENS", "N° PROJETO ARIBA", "N° CONTRATO", "ESTIMATIVA DE CONCLUSÃO"]);
  const ren = findTable(sheets, ["CONTRATO", "CW", "STATUS CW", "DECISÃO COMPRADOR", "QTD ITENS ATUAIS"]);
  if (!neg || !ren) {
    const missing = [!neg ? "Atas em Negociação" : "", !ren ? "Atas em Renovação" : ""].filter(Boolean).join(" e ");
    throw new Error(`A Base - Controle de Contratos foi reconhecida, mas faltam as abas ${missing}. Envie a pasta consolidada completa.`);
  }

  let referenceDate = options.referenceDate ? parseDateBR(options.referenceDate).iso : "";
  if (!referenceDate) {
    for (const source of [base, ren]) {
      for (const row of source.preHeader) {
        for (const value of row) {
          const parsed = parseDateBR(value);
          if (parsed.iso) {
            referenceDate = parsed.iso;
            break;
          }
        }
        if (referenceDate) break;
      }
      if (referenceDate) break;
    }
  }
  if (!referenceDate) throw new Error("Data de referência não localizada. Informe a data da atualização antes de validar.");

  // ---------- Base de contratos ----------
  const baseItems: Rec[] = [];
  for (const row of base.rows) {
    const contrato = cell(row, base.map, "Contrato");
    if (!/^\d+$/.test(contrato)) continue;
    const vt = parseMoneyBR(rawCell(row, base.map, "Valor total"));
    const vl = parseMoneyBR(rawCell(row, base.map, "Valor liberado"));
    const vdRaw = cell(row, base.map, "Valor Disponivel");
    const vd = vdRaw ? parseMoneyBR(rawCell(row, base.map, "Valor Disponivel")) : Math.max(0, round2(vt - vl));
    const nivel = upper(cell(row, base.map, "NIVEL DE CONSUMO QTD"));
    const qtdPrev = parseMoneyBR(rawCell(row, base.map, "Quantidade prevista"));
    const qtdAberto = parseMoneyBR(rawCell(row, base.map, "Meta de quantidade em aberto"));
    const consumo = nivel.includes("CONSUMIDO") ? "CONSUMIDO" : nivel.includes("SALDO") ? "COM SALDO" : qtdPrev > 0 && qtdAberto <= 0 ? "CONSUMIDO" : "COM SALDO";
    baseItems.push({
      contrato,
      cw: cell(row, base.map, "CW"),
      cwStatus: cell(row, base.map, "Status do CW"),
      item: cell(row, base.map, "Item"),
      sap: cell(row, base.map, "Cód SAP"),
      material: cell(row, base.map, "Material"),
      fornecedorRaw: cell(row, base.map, "Fornecedor"),
      fornecedor: stripCode(cell(row, base.map, "Fornecedor")),
      consumo, vt, vl, vd,
      di: parseDateBR(rawCell(row, base.map, "Válido desde")),
      df: parseDateBR(rawCell(row, base.map, "Válido até")),
      statusVig: upper(cell(row, base.map, "Status Vigência")),
      tipoDoc: normTipoDocSap(cell(row, base.map, "Descr,tp,doc,compras")),
      compradorRaw: cell(row, base.map, "Comprador"),
      comprador: normBuyer(cell(row, base.map, "Comprador")),
      grupoRaw: cell(row, base.map, "Grupo de mercadorias"),
      grupo: normGrupo(cell(row, base.map, "Grupo de mercadorias")),
      gestor: cell(row, base.map, "Gestor do Contrato"),
      modalidade: normModalidade(cell(row, base.map, "Modalidade")),
      area: areaKey(cell(row, base.map, "Área")),
    });
  }

  const contracts = new Map<string, Rec>();
  const cwIndex = new Map<string, Set<string>>();
  for (const item of baseItems) {
    if (!contracts.has(item.contrato)) contracts.set(item.contrato, { contrato: item.contrato, items: [] });
    contracts.get(item.contrato)!.items.push(item);
    if (item.cw) {
      if (!cwIndex.has(item.cw)) cwIndex.set(item.cw, new Set());
      cwIndex.get(item.cw)!.add(item.contrato);
    }
  }

  function dominantArea(items: Rec[]): Area | "" {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.area, (counts.get(item.area) ?? 0) + 1);
    return ([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "") as Area | "";
  }

  function contractStatus(items: Rec[]): string {
    const statuses = new Set(items.map((item) => item.statusVig).filter(Boolean));
    if (statuses.has("VENCIDO")) return "VENCIDO";
    if (statuses.has("RENOVAR")) return "RENOVAR";
    if (statuses.has("VÁLIDO")) return "VÁLIDO";
    return "";
  }

  for (const contract of contracts.values()) {
    const first = contract.items[0];
    contract.area = dominantArea(contract.items);
    contract.statusVig = contractStatus(contract.items);
    contract.df = contract.items.find((item: Rec) => item.df.iso)?.df ?? { iso: "", br: "" };
    contract.di = contract.items.find((item: Rec) => item.di.iso)?.di ?? { iso: "", br: "" };
    contract.cws = [...new Set(contract.items.map((item: Rec) => item.cw).filter(Boolean))];
    contract.cwStatuses = [...new Set(contract.items.map((item: Rec) => item.cwStatus).filter(Boolean))];
    contract.fornecedoresRaw = [...new Set(contract.items.map((item: Rec) => item.fornecedorRaw).filter(Boolean))];
    contract.fornecedores = [...new Set(contract.items.map((item: Rec) => item.fornecedor).filter(Boolean))];
    contract.fornCodes = contract.fornecedoresRaw.map((value: string) => value.match(/\((\d+)\)\s*$/)?.[1]).filter(Boolean);
    contract.compradorRaw = first.compradorRaw;
    contract.comprador = first.comprador;
    contract.grupoRaw = first.grupoRaw;
    contract.grupo = first.grupo;
    contract.gestor = first.gestor;
    contract.modalidade = first.modalidade;
    contract.tipoDoc = first.tipoDoc;
    contract.comSaldo = contract.items.filter((item: Rec) => item.consumo === "COM SALDO").length;
    contract.consumido = contract.items.filter((item: Rec) => item.consumo === "CONSUMIDO").length;
    contract.valorTotal = round2(contract.items.reduce((sum: number, item: Rec) => sum + item.vt, 0));
    contract.valorDisp = round2(contract.items.reduce((sum: number, item: Rec) => sum + item.vd, 0));
  }

  // ---------- Renovação ----------
  const renewals: Rec[] = [];
  let renewalCwFallback = 0;
  let renewalUnmatched = 0;
  for (const row of ren.rows) {
    const contrato = cell(row, ren.map, "CONTRATO");
    if (!contrato) continue;
    const cw = cell(row, ren.map, "CW");
    let linkedContract = contracts.has(contrato) ? contrato : "";
    if (!linkedContract && cw && cwIndex.get(cw)?.size === 1) {
      linkedContract = [...cwIndex.get(cw)!][0];
      renewalCwFallback++;
    }
    if (!linkedContract) renewalUnmatched++;
    const df = parseDateBR(rawCell(row, ren.map, "VALIDO ATÉ"));
    const diasPlanilha = parseIntBR(rawCell(row, ren.map, "DIAS VIGÊNCIA"));
    const diasData = daysBetween(referenceDate, df.iso);
    renewals.push({
      contrato, linkedContract, cw,
      qtdItens: parseIntBR(rawCell(row, ren.map, "QTD ITENS ATUAIS")),
      valorContrato: parseMoneyBR(rawCell(row, ren.map, "VALOR DO CONTRATO")),
      fornecedor: cell(row, ren.map, "FORNECEDOR"),
      di: parseDateBR(rawCell(row, ren.map, "VÁLIDO DESDE")), df,
      dias: diasData ?? diasPlanilha,
      statusVig: upper(cell(row, ren.map, "STATUS VIGÊNCIA")),
      comprador: cell(row, ren.map, "COMPRADOR ORIGINAL"),
      area: areaKey(cell(row, ren.map, "AREA")),
      modalidade: cell(row, ren.map, "MODALIDADE ORIGINAL"),
      statusCW: upper(cell(row, ren.map, "STATUS CW")),
      decisao: upper(cell(row, ren.map, "DECISÃO COMPRADOR")),
      qtdRenovar: parseIntBR(rawCell(row, ren.map, "QTD DE ITENS A RENOVAR")),
      valorAta: parseMoneyBR(rawCell(row, ren.map, "VALOR DA ATA")),
      valorRenovado: parseMoneyBR(rawCell(row, ren.map, "VALOR RENOVADO")),
      observacao: cell(row, ren.map, "OBSERVAÇÕES / MOTIVO DA NÃO RENOVAÇÃO / EXCLUSÃO DE ITENS / NOVA ATA"),
    });
  }

  function renewalIsActive(renewal: Rec): boolean {
    return renewal.statusCW !== "RENOVADO" && !renewal.decisao.includes("NÃO RENOVAR") && !renewal.decisao.includes("NAO RENOVAR");
  }
  const activeRenewalContracts = new Set(renewals.filter(renewalIsActive).map((renewal) => renewal.linkedContract || renewal.contrato));

  // ---------- Negociação ----------
  const negotiations: Rec[] = [];
  for (const row of neg.rows) {
    const descricao = cell(row, neg.map, "DESCRIÇÃO DOS LOTES ATAS");
    if (!descricao) continue;
    const etapa = cell(row, neg.map, "ETAPA ATUAL") || "EM PREPARAÇÃO";
    const etapaUpper = upper(etapa);
    const sn = etapaUpper.includes("FINALIZ") ? "concluido" : etapaUpper.includes("CANCEL") ? "cancelado" : "";
    const contratoTexto = cell(row, neg.map, "N° CONTRATO");
    const contratosEncontrados = contratoTexto.match(/\d{7,}/g) ?? [];
    const contratosVinculados = contratosEncontrados.filter((contrato) => contracts.has(contrato));
    const ariba = cell(row, neg.map, "N° PROJETO ARIBA");
    const rawBuyer = cell(row, neg.map, "COMPRADOR");
    const rawCat = cell(row, neg.map, "CATEGORIA");
    negotiations.push({
      descricao, etapa, sn, ariba, contratoTexto, contratosEncontrados, contratosVinculados,
      qtdItens: parseIntBR(rawCell(row, neg.map, "QTD ITENS")),
      qtdContratada: parseIntBR(rawCell(row, neg.map, "QTD CONTRATADA")),
      estimativa: parseMoneyBR(rawCell(row, neg.map, "ESTIMATIVA VALOR TOTAL")),
      precoHistorico: parseMoneyBR(rawCell(row, neg.map, "PREÇO HISTÓRICO")),
      propostaInicial: parseMoneyBR(rawCell(row, neg.map, "PROPOSTA INICIAL")),
      propostaFinal: parseMoneyBR(rawCell(row, neg.map, "PROPOSTA FINAL")),
      savingHist: parseMoneyBR(rawCell(row, neg.map, "REDUÇÃO HISTÓRICO")),
      savingProp: parseMoneyBR(rawCell(row, neg.map, "REDUÇÃO PROPOSTA INICIAL")),
      compradorRaw: rawBuyer,
      comprador: normBuyer(rawBuyer),
      grupoRaw: rawCat,
      grupo: normGrupo(rawCat),
      area: areaKey(cell(row, neg.map, "AREA")),
      modalidade: normModalidade(cell(row, neg.map, "MODALIDADE")),
      di: parseDateBR(rawCell(row, neg.map, "DATA DE INICIO")),
      df: parseDateBR(rawCell(row, neg.map, "ESTIMATIVA DE CONCLUSÃO")),
      prazo: cell(row, neg.map, "PRAZO CONCLUSÃO"),
      mes: cell(row, neg.map, "ESTIMATIVA MÊS CONCLUSÃO"),
      statusAta: cell(row, neg.map, "STATUS DA ATA"),
    });
  }
  const activeNegotiations = negotiations.filter((item) => !item.sn);
  const finalizedNegotiations = negotiations.filter((item) => item.sn === "concluido");
  const contractEnrich = new Map<string, Rec>();
  for (const negotiation of negotiations) {
    for (const contrato of negotiation.contratosVinculados) {
      contractEnrich.set(contrato, { lote: negotiation.descricao, ariba: negotiation.ariba, sh: negotiation.savingHist, sp: negotiation.savingProp });
    }
  }

  // ---------- KPIs e evolução ----------
  const metricSets: Rec = Object.fromEntries(AREAS.map((area) => [area, { concluidas: [], aVencer: [], vencidas: [] }]));
  for (const contract of contracts.values()) {
    let category = "";
    if (contract.statusVig === "VENCIDO") category = activeRenewalContracts.has(contract.contrato) ? "aVencer" : "vencidas";
    else if (contract.statusVig === "RENOVAR" || activeRenewalContracts.has(contract.contrato)) category = "aVencer";
    else if (contract.statusVig === "VÁLIDO") category = "concluidas";
    else {
      const days = daysBetween(referenceDate, contract.df.iso);
      if (days !== null && days < 0) category = activeRenewalContracts.has(contract.contrato) ? "aVencer" : "vencidas";
      else if (days !== null && days <= 100) category = "aVencer";
      else category = "concluidas";
    }
    contract.carteira = category === "aVencer" ? "a_vencer" : category;
    if (metricSets[contract.area]) metricSets[contract.area][category].push(contract);
  }

  function distinctItems(contractList: Rec[]): number {
    const keys = new Set<string>();
    for (const contract of contractList) {
      for (const item of contract.items) keys.add(item.sap ? `SAP:${item.sap}` : `ITEM:${item.contrato}:${item.item}`);
    }
    return keys.size;
  }

  const evolucao: Rec = {};
  for (const area of AREAS) {
    const sets = metricSets[area];
    const validItems = sets.concluidas.flatMap((contract: Rec) => contract.items);
    const andamento = activeNegotiations.filter((item) => item.area === area);
    evolucao[area] = {
      concluidasAtas: sets.concluidas.length,
      concluidasItens: distinctItems(sets.concluidas),
      andamentoAtas: andamento.length,
      andamentoItens: andamento.reduce((sum: number, item: Rec) => sum + item.qtdItens, 0),
      saldoItens: validItems.filter((item: Rec) => item.consumo === "COM SALDO").length,
      semSaldoItens: validItems.filter((item: Rec) => item.consumo === "CONSUMIDO").length,
      vencidasAtas: sets.vencidas.length,
      vencidasItens: distinctItems(sets.vencidas),
      aVencerAtas: sets.aVencer.length,
      aVencerItens: distinctItems(sets.aVencer),
    };
  }
  const kpis = {
    concluidasAtas: AREAS.reduce((sum, area) => sum + evolucao[area].concluidasAtas, 0),
    concluidasItens: AREAS.reduce((sum, area) => sum + evolucao[area].concluidasItens, 0),
    andamentoAtas: activeNegotiations.length,
    andamentoItens: activeNegotiations.reduce((sum, item) => sum + item.qtdItens, 0),
    saldoItens: AREAS.reduce((sum, area) => sum + evolucao[area].saldoItens, 0),
    consumidoItens: AREAS.reduce((sum, area) => sum + evolucao[area].semSaldoItens, 0),
    aVencerAtas: AREAS.reduce((sum, area) => sum + evolucao[area].aVencerAtas, 0),
    aVencerItens: AREAS.reduce((sum, area) => sum + evolucao[area].aVencerItens, 0),
    vencidasAtas: AREAS.reduce((sum, area) => sum + evolucao[area].vencidasAtas, 0),
    vencidasItens: AREAS.reduce((sum, area) => sum + evolucao[area].vencidasItens, 0),
  };

  // ---------- Valores, saving, compradores e fornecedores ----------
  const valueAreas: Rec = {};
  for (const area of AREAS) {
    const items = baseItems.filter((item) => item.area === area);
    const finals = finalizedNegotiations.filter((item) => item.area === area);
    const valorSaving = round2(finals.reduce((sum, item) => sum + item.propostaFinal, 0));
    const savingHist = round2(finals.reduce((sum, item) => sum + item.savingHist, 0));
    const savingProp = round2(finals.reduce((sum, item) => sum + item.savingProp, 0));
    valueAreas[area] = {
      valor: round2(items.reduce((sum, item) => sum + item.vt, 0)),
      valorSaving, savingHist, savingProp,
      reducaoHistPct: pct(savingHist, valorSaving),
      reducaoPropPct: pct(savingProp, valorSaving),
      saldoDisponivel: round2(items.filter((item) => item.statusVig !== "VENCIDO").reduce((sum, item) => sum + item.vd, 0)),
    };
  }
  const savingTotal = {
    valor: null,
    valorSaving: round2(AREAS.reduce((sum, area) => sum + valueAreas[area].valorSaving, 0)),
    savingHist: round2(AREAS.reduce((sum, area) => sum + valueAreas[area].savingHist, 0)),
    savingProp: round2(AREAS.reduce((sum, area) => sum + valueAreas[area].savingProp, 0)),
    reducaoHistPct: round2(AREAS.reduce((sum, area) => sum + valueAreas[area].reducaoHistPct, 0)),
    reducaoPropPct: round2(AREAS.reduce((sum, area) => sum + valueAreas[area].reducaoPropPct, 0)),
  };

  const topCompradores: Rec = {};
  for (const area of AREAS) {
    const byBuyer = new Map<string, Rec>();
    for (const item of baseItems.filter((row) => row.area === area)) {
      const key = item.comprador || "NÃO INFORMADO";
      if (!byBuyer.has(key)) byBuyer.set(key, { name: key, itens: 0, contracts: new Set<string>() });
      const stat = byBuyer.get(key)!;
      stat.itens++;
      stat.contracts.add(item.contrato);
    }
    const totalAtasArea = [...contracts.values()].filter((contract) => contract.area === area).length;
    const buyers = [...byBuyer.values()].map((item) => ({ name: item.name, itens: item.itens, atas: item.contracts.size, totalAtasArea }))
      .sort((a, b) => b.itens - a.itens || b.atas - a.atas || a.name.localeCompare(b.name)).slice(0, 5);
    topCompradores[area] = { area, totalAtasArea, topAtas: buyers.length, buyers };
  }

  function supplierStats(items: Rec[], area: string): Rec[] {
    const bySupplier = new Map<string, Rec>();
    for (const item of items) {
      if (!item.fornecedorRaw) continue;
      if (!bySupplier.has(item.fornecedorRaw)) bySupplier.set(item.fornecedorRaw, { fornecedor: item.fornecedorRaw, itens: 0, contracts: new Set<string>() });
      const stat = bySupplier.get(item.fornecedorRaw)!;
      stat.itens++;
      stat.contracts.add(item.contrato);
    }
    return [...bySupplier.values()].map((item) => {
      const concentracaoPct = pct(item.itens, items.length);
      return {
        area, fornecedor: item.fornecedor, qtdAtas: item.contracts.size, qtdItens: item.itens, concentracaoPct,
        analise: concentracaoPct >= 15 ? "Alta Concentração" : concentracaoPct >= 5 ? "Volume Médio" : "Pulverizado",
        _sort: item.itens,
      };
    }).sort((a, b) => b._sort - a._sort || b.qtdAtas - a.qtdAtas || a.fornecedor.localeCompare(b.fornecedor));
  }

  const fornecedores: Rec = {};
  for (const area of AREAS) {
    fornecedores[area] = supplierStats(baseItems.filter((item) => item.area === area), area).slice(0, 5).map(({ _sort, ...item }) => item);
  }
  const generalSuppliers = supplierStats(baseItems, "GERAL");
  const fornecedoresGeral: Rec[] = generalSuppliers.slice(0, 4).map(({ _sort, ...item }) => item);
  if (generalSuppliers.length > 4) {
    const others = generalSuppliers.slice(4);
    const qtdItens = others.reduce((sum, item) => sum + item.qtdItens, 0);
    const concentracaoPct = pct(qtdItens, baseItems.length);
    fornecedoresGeral.push({
      area: "GERAL", fornecedor: "OUTROS FORNECEDORES",
      qtdAtas: others.reduce((sum, item) => sum + item.qtdAtas, 0), qtdItens, concentracaoPct,
      analise: concentracaoPct >= 15 ? "Alta Concentração" : concentracaoPct >= 5 ? "Volume Médio" : "Pulverizado",
    });
  }

  // ---------- Previsões ----------
  const previsoes: Rec = Object.fromEntries(BANDS.map((band) => [band, Object.fromEntries(AREAS.map((area) => [area, { atas: 0, itens: 0, buyers: [] }]))]));
  const forecastBuyerMaps = new Map<string, Map<string, Rec>>();
  function forecastBand(negotiation: Rec): string {
    if (negotiation.sn === "concluido") return "finalizadas";
    if (negotiation.sn === "cancelado") return "canceladas";
    const prazo = upper(negotiation.prazo);
    if (prazo.includes("15")) return "ate_15";
    if (prazo.includes("30")) return "ate_30";
    if (prazo.includes("60") && !prazo.includes("ACIMA")) return "ate_60";
    if (prazo.includes("ACIMA")) return "acima_60";
    return "vencidas";
  }
  for (const negotiation of negotiations) {
    const band = forecastBand(negotiation);
    if (!previsoes[band] || !previsoes[band][negotiation.area]) continue;
    const target = previsoes[band][negotiation.area];
    target.atas++;
    target.itens += negotiation.qtdItens;
    const key = `${band}|${negotiation.area}`;
    if (!forecastBuyerMaps.has(key)) forecastBuyerMaps.set(key, new Map());
    const byBuyer = forecastBuyerMaps.get(key)!;
    const buyerKey = negotiation.compradorRaw || "NÃO INFORMADO";
    if (!byBuyer.has(buyerKey)) byBuyer.set(buyerKey, { name: buyerKey, atas: 0, itens: 0, dates: [] });
    const buyer = byBuyer.get(buyerKey)!;
    buyer.atas++;
    buyer.itens += negotiation.qtdItens;
    if (negotiation.df.iso) buyer.dates.push(negotiation.df.iso);
  }
  for (const band of BANDS) {
    for (const area of AREAS) {
      const byBuyer = forecastBuyerMaps.get(`${band}|${area}`) ?? new Map<string, Rec>();
      previsoes[band][area].buyers = [...byBuyer.values()].map((item) => ({
        name: item.name, atas: item.atas, itens: item.itens, prazoConclusao: item.dates.sort()[0] ?? null,
      })).sort((a, b) => b.itens - a.itens || b.atas - a.atas || a.name.localeCompare(b.name));
    }
  }

  const futureMonthKeys = new Set<string>();
  for (const negotiation of activeNegotiations) {
    if (negotiation.df.iso && negotiation.df.iso >= referenceDate) futureMonthKeys.add(negotiation.df.iso.slice(0, 7));
  }
  const refMonth = referenceDate.slice(0, 7);
  for (let index = 0; index < 3; index++) {
    const date = new Date(`${refMonth}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + index);
    futureMonthKeys.add(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const monthKeys = [...futureMonthKeys].sort();
  const previsaoMeses: Rec = {};
  for (const area of AREAS) {
    const rows: Rec[] = monthKeys.map((key) => {
      const matching = activeNegotiations.filter((item) => item.area === area && item.df.iso && item.df.iso >= referenceDate && item.df.iso.startsWith(key));
      const [year, month] = key.split("-").map(Number);
      return { label: `${MONTHS[month - 1]}/${year}`, month, year, atas: matching.length, itens: matching.reduce((sum, item) => sum + item.qtdItens, 0) };
    });
    const expired = activeNegotiations.filter((item) => item.area === area && (!item.df.iso || item.df.iso < referenceDate));
    rows.push({ label: "Vencida/Sem Previsão", month: null, year: null, atas: expired.length, itens: expired.reduce((sum, item) => sum + item.qtdItens, 0) });
    previsaoMeses[area] = { rows };
  }

  // ---------- Status de renovações ----------
  const statusAtas: Rec = {};
  for (const area of AREAS) {
    const rows = renewals.filter((renewal) => renewal.area === area && renewalIsActive(renewal));
    const priorities = rows.filter((renewal) => renewal.dias !== null && renewal.dias <= 15)
      .sort((a, b) => (a.df.iso || "9999").localeCompare(b.df.iso || "9999"))
      .map((renewal) => ({
        contrato: renewal.contrato,
        vencimento: renewal.df.iso || null,
        comprador: normBuyer(renewal.comprador) || null,
        situacao: renewal.statusCW === "NÃO INICIADO" ? "A INICIAR" : renewal.statusCW || renewal.decisao || "A INICIAR",
      }));
    const inProgress = rows.find((renewal) => renewal.statusCW === "EM RENOVAÇÃO");
    statusAtas[area] = {
      area, layout: "renovacoes", baseDate: referenceDate,
      titulo: `${area} | Status de Renovações`, subtitulo: "Carteira em alerta de 100 dias | Atas a renovar",
      total: null, vigentes: null,
      vencidas: rows.filter((renewal) => renewal.statusVig === "VENCIDO" || renewal.dias < 0).length,
      ate15: rows.filter((renewal) => renewal.statusVig !== "VENCIDO" && renewal.dias >= 0 && renewal.dias <= 15).length,
      de16a30: null, aRenovar: null, totalRenovar: rows.length,
      emAndamento: rows.filter((renewal) => renewal.statusCW === "EM RENOVAÇÃO").length,
      prioridades: priorities, carteira: [],
      renovacaoEmAndamento: inProgress ? {
        contrato: inProgress.contrato, comprador: normBuyer(inProgress.comprador) || null,
        vencimento: inProgress.df.iso || null, texto: [inProgress.cw, inProgress.decisao].filter(Boolean).join(" · "),
      } : null,
      notas: [],
    };
  }

  // Todas as finalizadas ficam no snapshot: o IndexedDB compara com a importação anterior.
  const atasConcluidas = finalizedNegotiations.map((negotiation) => {
    const suppliers = [...new Set(negotiation.contratosVinculados.flatMap((contrato: string) => contracts.get(contrato)?.fornecedores ?? []))] as string[];
    return {
      key: negotiation.contratosEncontrados.join("") || (negotiation.ariba ? `ARIBA:${negotiation.ariba}` : `LOTE:${upper(negotiation.descricao)}|${negotiation.comprador}|${negotiation.area}`),
      descricao: negotiation.descricao,
      contrato: negotiation.contratoTexto ? negotiation.contratoTexto.replace(/\s*\/\s*/g, " / ") : null,
      fornecedor: suppliers.length ? suppliers.join(" / ") : null,
      itens: negotiation.qtdItens,
      comprador: negotiation.comprador || null,
      area: negotiation.area || null,
      etapa: negotiation.etapa,
      valor: negotiation.propostaFinal || null,
    };
  });
  const fornecedoresPorContrato = Object.fromEntries([...contracts.values()].map((contract) => [contract.contrato, contract.fornecedores.join(" / ")]));
  const missingSupplierFinals = finalizedNegotiations.filter((negotiation) => negotiation.contratosVinculados.length === 0);
  const notes = [
    "Leitura calculada diretamente das três bases consolidadas, sem as abas-resumo GIRO 01–07.",
    "Atas Concluídas contém todas as finalizadas da base atual; as novas são calculadas pela comparação com a importação anterior no histórico local.",
  ];
  if (missingSupplierFinals.length) notes.push(`${missingSupplierFinals.length} ata(s) finalizada(s) sem contrato correspondente na Base; o fornecedor não foi inferido.`);
  if (renewalUnmatched) notes.push(`${renewalUnmatched} renovação(ões) sem contrato correspondente na Base; mantida(s) somente em Status de Renovações.`);
  if (renewalCwFallback) notes.push(`${renewalCwFallback} renovação(ões) vinculada(s) pelo CW como fallback.`);

  const snapshot = {
    schemaVersion: 2,
    referenceDate,
    sourceFiles: options.fileNames ?? [...new Set(sheets.map((sheet) => sheet.fileName))],
    capturedAt: new Date().toISOString(),
    kpis, valueAreas, savingTotal, topCompradores, fornecedores, fornecedoresGeral,
    evolucao, previsoes, previsaoMeses, atasConcluidas, fornecedoresPorContrato, statusAtas,
    coverage: { found: [...BLOCK_KEYS], missing: [] }, notes,
  } as unknown as DashboardSnapshotPayload;

  // ---------- Registros completos da consulta de Processos ----------
  const records: CleanRecord[] = [];
  const issues: Issue[] = [];
  let sourceRow = 0;
  const addRecord = (input: Omit<CleanRecord, "rowHash" | "sourceRow">, hashKey: string) => {
    sourceRow++;
    records.push({ ...input, sourceRow, rowHash: hashRecord(`${hashKey}|${sourceRow}`) });
  };

  for (const contract of contracts.values()) {
    const info = contractEnrich.get(contract.contrato);
    const groupClean = clean(contract.grupoRaw).replace(/\s*\(\d+\)\s*$/, "").trim();
    const materials = [...new Set(contract.items.map((item: Rec) => item.material).filter(Boolean))] as string[];
    const matSample = materials.slice(0, 2).join("; ");
    const objeto = info?.lote ? `${info.lote}${groupClean ? ` — ${groupClean}` : ""}` : groupClean ? `${groupClean} — ${matSample}` : matSample || "Contrato SAP";
    const linkedRenewal = renewals.find((renewal) => (renewal.linkedContract || renewal.contrato) === contract.contrato);
    addRecord({
      numero: contract.contrato,
      objeto,
      area: areaLabel(contract.area),
      unidade: null,
      fornecedor: contract.fornecedores.join(" / ") || null,
      responsavel: contract.comprador || null,
      etapa: contract.statusVig || "VÁLIDO",
      situacaoFonte: contract.statusVig || "VÁLIDO",
      situacaoNorm: null,
      dataInicio: contract.di.iso || null,
      dataFim: contract.df.iso || null,
      quantidade: contract.items.length,
      valor: contract.valorTotal,
      statusConsumo: contract.comSaldo > 0 ? "Com Saldo" : contract.consumido > 0 ? "Consumido" : null,
      savingHist: info?.sh ?? null,
      savingProp: info?.sp ?? null,
      statusRenovacao: linkedRenewal?.statusCW || linkedRenewal?.decisao || null,
      dataPrevisao: null,
      observacao: linkedRenewal?.observacao || null,
      link: null,
      extra: compactStrings({
        Natureza: "Contratos Vigentes",
        CW: contract.cws.join(" / "),
        "Status do CW": contract.cwStatuses.join(" / "),
        "N° Projeto Ariba": info?.ariba,
        "Grupo de mercadorias": contract.grupo,
        Modalidade: contract.modalidade,
        Gestor: contract.gestor,
        "Tipo de documento SAP": contract.tipoDoc,
        "Itens com saldo": contract.comSaldo,
        "Itens consumidos": contract.consumido,
        "Saldo disponível": contract.valorDisp,
        "Carteira do Panorama": contract.carteira,
      }),
      giro: {
        natureza: "Contratos Vigentes",
        ariba: info?.ariba ?? null,
        cw: [...contract.cws],
        fornecedorPrincipal: contract.fornecedores[0] ?? null,
        gestor: contract.gestor || null,
        grupo: contract.grupo || null,
        modalidade: contract.modalidade || null,
        tipoDocSap: contract.tipoDoc || null,
        saldoStatus: contract.consumido > 0 && contract.comSaldo === 0 ? "sem_saldo" : contract.consumido > 0 ? "parcial" : "integral",
        qtdComSaldo: contract.comSaldo,
        qtdConsumidos: contract.consumido,
        semContratoSap: false,
        valorDisponivel: contract.valorDisp,
        savingMapeado: info ? round2(Math.max(info.sh || 0, info.sp || 0)) : 0,
        consumo: [contract.comSaldo ? `${contract.comSaldo} c/ saldo` : "", contract.consumido ? `${contract.consumido} consum.` : ""].filter(Boolean).join(" · ") || null,
        carteira: contract.carteira ?? null,
        itemKeys: contract.items.map((item: Rec) => item.sap ? `SAP:${item.sap}` : `ITEM:${item.contrato}:${item.item}`),
      },
    }, `CONTRATO:${contract.contrato}`);
  }

  for (const negotiation of negotiations) {
    const linked = negotiation.contratosVinculados.map((contrato: string) => contracts.get(contrato)).filter(Boolean);
    const suppliers = [...new Set(linked.flatMap((contract: Rec) => contract.fornecedores))] as string[];
    const cws = [...new Set(linked.flatMap((contract: Rec) => contract.cws))] as string[];
    const numero = negotiation.contratoTexto ? negotiation.contratoTexto.replace(/\s+/g, " ") : negotiation.ariba ? `Ariba ${negotiation.ariba}` : `Lote ${negotiation.descricao}`;
    addRecord({
      numero,
      objeto: negotiation.descricao,
      area: areaLabel(negotiation.area),
      unidade: null,
      fornecedor: suppliers.join(" / ") || null,
      responsavel: negotiation.comprador || null,
      etapa: negotiation.etapa,
      situacaoFonte: negotiation.etapa,
      situacaoNorm: negotiation.sn || null,
      dataInicio: negotiation.di.iso || null,
      dataFim: negotiation.df.iso || null,
      quantidade: negotiation.qtdItens,
      valor: negotiation.propostaFinal > 0 ? negotiation.propostaFinal : negotiation.estimativa,
      statusConsumo: null,
      savingHist: negotiation.savingHist || null,
      savingProp: negotiation.savingProp || null,
      statusRenovacao: null,
      dataPrevisao: negotiation.df.iso || null,
      observacao: negotiation.statusAta || null,
      link: null,
      extra: compactStrings({
        Natureza: negotiation.sn ? "Histórico (Finaliz./Canc.)" : "Atas em Andamento",
        CW: cws.join(" / "),
        "N° Projeto Ariba": negotiation.ariba,
        "Qtd. contratada": negotiation.qtdContratada,
        "Grupo de mercadorias": negotiation.grupo,
        Modalidade: negotiation.modalidade,
        "Prazo de conclusão": negotiation.prazo,
        "Sem contrato SAP": negotiation.sn === "concluido" && linked.length === 0 ? "Sim" : "",
      }),
      giro: {
        natureza: negotiation.sn ? "Histórico (Finaliz./Canc.)" : "Atas em Andamento",
        ariba: negotiation.ariba || null,
        cw: [...cws],
        fornecedorPrincipal: suppliers[0] ?? null,
        gestor: null,
        grupo: negotiation.grupo || null,
        modalidade: negotiation.modalidade || null,
        tipoDocSap: null,
        saldoStatus: "na",
        qtdComSaldo: 0,
        qtdConsumidos: 0,
        semContratoSap: negotiation.sn === "concluido" && linked.length === 0,
        valorDisponivel: 0,
        savingMapeado: negotiation.savingHist > 0 ? negotiation.savingHist : negotiation.savingProp > 0 ? negotiation.savingProp : 0,
        consumo: negotiation.prazo || null,
        carteira: null,
        itemKeys: [],
      },
    }, `NEGOCIACAO:${negotiation.ariba}|${negotiation.descricao}`);
  }

  for (const negotiation of missingSupplierFinals) {
    issues.push({
      row: negotiations.indexOf(negotiation) + 1,
      column: "N° CONTRATO",
      message: `Ata finalizada sem contrato correspondente na Base; fornecedor não inferido (${negotiation.contratoTexto || negotiation.ariba || negotiation.descricao}).`,
      severity: "warning",
    });
  }
  if (renewalUnmatched) {
    issues.push({ row: 1, column: "CONTRATO / CW", message: `${renewalUnmatched} renovação(ões) sem correspondência na Base; nenhum vínculo foi inventado.`, severity: "warning" });
  }

  return {
    snapshot,
    result: { records, issues, skipped: 0, duplicates: 0, warnings: issues.filter((issue) => issue.severity === "warning").length },
  };
}
