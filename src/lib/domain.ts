/**
 * Domínio do Giro de Atas — campos canônicos, normalização e validação.
 * Este módulo é isomórfico: roda no navegador (pré-visualização) e no
 * servidor (confirmação da importação), garantindo resultados idênticos.
 * Nenhum dado é descartado silenciosamente: tudo vira Issue oué preservado
 * em `extra` (colunas não mapeadas permanecem com o registro).
 */

export type DatasetKind = "indiretos" | "diretos" | "capex" | "outro";
export type DatasetNatureza = "operacional" | "snapshot";
export type ImportMode = "replace" | "combine";

export const KIND_LABEL: Record<DatasetKind, string> = {
  indiretos: "Indiretos",
  diretos: "Diretos",
  capex: "CAPEX",
  outro: "Outro / Geral",
};

export const AREA_LABEL: Record<string, string> = {
  Indiretos: "Indiretos",
  Diretos: "Diretos",
  CAPEX: "CAPEX",
  "Não informado": "Não informado",
};

export type SituacaoChave =
  | "vencido"
  | "a_vencer"
  | "em_dia"
  | "sem_data"
  | "concluido"
  | "cancelado";

export const SITUACAO_LABEL: Record<SituacaoChave, string> = {
  vencido: "Vencido",
  a_vencer: "A vencer (30 dias)",
  em_dia: "No prazo",
  sem_data: "Sem data de prazo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/* ------------------------------------------------------------------ */
/* Campos canônicos esperados pelo painel                              */
/* ------------------------------------------------------------------ */

export type FieldType = "text" | "date" | "number" | "money" | "url";

export interface CanonicalField {
  key: string;
  label: string;
  required: boolean;
  type: FieldType;
  hint: string;
}

export const CANONICAL_FIELDS: CanonicalField[] = [
  { key: "numero", label: "Nº do processo / identificador", required: true, type: "text", hint: "Ex.: PA 123/2025, Ata 45/2024" },
  { key: "objeto", label: "Objeto / descrição", required: true, type: "text", hint: "Descrição do que está sendo comprado" },
  { key: "area", label: "Área", required: false, type: "text", hint: "Indiretos, Diretos ou CAPEX (se houver na planilha)" },
  { key: "unidade", label: "Unidade / solicitante", required: false, type: "text", hint: "Setor ou unidade requerente" },
  { key: "fornecedor", label: "Fornecedor", required: false, type: "text", hint: "Razão social do fornecedor" },
  { key: "responsavel", label: "Responsável / comprador", required: false, type: "text", hint: "Pessoa responsável pelo processo" },
  { key: "etapa", label: "Etapa / fase", required: false, type: "text", hint: "Etapa atual do processo" },
  { key: "situacao", label: "Situação declarada na fonte", required: false, type: "text", hint: "Ex.: em andamento, concluído, cancelado" },
  { key: "data_inicio", label: "Data de abertura / publicação", required: false, type: "date", hint: "Preferência: dd/mm/aaaa" },
  { key: "data_fim", label: "Data limite / fim de vigência", required: false, type: "date", hint: "Usada para calcular vencidos e a vencer" },
  { key: "quantidade", label: "Quantidade de itens", required: false, type: "number", hint: "Número inteiro de itens do processo" },
  { key: "valor", label: "Valor estimado (R$)", required: false, type: "money", hint: "Aceita 1.234,56" },
  { key: "status_consumo", label: "Status de Consumo", required: false, type: "text", hint: "Ex.: Com Saldo, Consumido, Sem Saldo" },
  { key: "saving_hist", label: "Saving Histórico (R$)", required: false, type: "money", hint: "Valor do saving histórico" },
  { key: "saving_prop", label: "Saving Sob Proposta (R$)", required: false, type: "money", hint: "Valor do saving da proposta" },
  { key: "status_renovacao", label: "Status de Renovação", required: false, type: "text", hint: "Ex.: Não Iniciado, Novo Projeto, Em Renovação, Não será renovado" },
  { key: "data_previsao", label: "Previsão de Conclusão", required: false, type: "date", hint: "Data estimada para conclusão" },
  { key: "observacao", label: "Observações", required: false, type: "text", hint: "Notas e comentários" },
  { key: "link", label: "Link do processo/documento", required: false, type: "url", hint: "URL (SharePoint, portal etc.)" },
];

export const CANONICAL_KEYS = CANONICAL_FIELDS.map((f) => f.key);

/* ------------------------------------------------------------------ */
/* Normalização textual                                                */
/* ------------------------------------------------------------------ */

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normText(value: string): string {
  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function cleanCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return toISODateLocal(value);
  const s = String(value).replace(/\u00a0/g, " ").trim();
  return s === "" ? null : s;
}

/* ------------------------------------------------------------------ */
/* Datas (pt-BR)                                                       */
/* ------------------------------------------------------------------ */

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface ParsedDate {
  iso: string | null;
  warning?: string;
}

/** Interpreta datas sem adivinhar: formatos inequívocos entram; o resto vira aviso. */
export function parseDateBR(raw: unknown, fieldLabel: string): ParsedDate {
  if (raw === null || raw === undefined || raw === "") return { iso: null };
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return { iso: toISODateLocal(raw) };
  }
  const s = String(raw).trim();

  // ISO: aaaa-mm-dd (com ou sem hora)
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})([T\s].*)?$/);
  if (m) return buildDate(+m[1], +m[2], +m[3], fieldLabel, s);

  // BR: dd/mm/aaaa ou dd-mm-aaaa ou dd.mm.aaaa (opcional hora)
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2}|\d{4})([T\s].*)?$/);
  if (m) {
    const day = +m[1];
    const month = +m[2];
    let year = +m[3];
    let warning: string | undefined;
    if (m[3].length === 2) {
      const now = new Date().getFullYear();
      year = year <= (now + 5) % 100 ? 2000 + year : 1900 + year;
      warning = `Ano com 2 dígitos ("${s}") interpretado como ${year}. Confirme na origem.`;
    }
    if (day > 31 || month > 12) {
      return { iso: null, warning: `Data não reconhecida em "${fieldLabel}": "${s}". Linha mantida sem a data.` };
    }
    return buildDate(year, month, day, fieldLabel, s, warning);
  }

  return { iso: null, warning: `Data não reconhecida em "${fieldLabel}": "${s}". Linha mantida sem a data.` };
}

function buildDate(y: number, mo: number, d: number, fieldLabel: string, original: string, warning?: string): ParsedDate {
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return { iso: null, warning: `Data inválida em "${fieldLabel}": "${original}". Linha mantida sem a data.` };
  }
  if (y < 1990 || y > 2100) {
    return { iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, warning: `Ano ${y} incomum em "${fieldLabel}" ("${original}"). Confirme na origem.` };
  }
  return { iso: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`, warning };
}

/* ------------------------------------------------------------------ */
/* Números e valores monetários (pt-BR)                                */
/* ------------------------------------------------------------------ */

export interface ParsedNumber {
  value: number | null;
  warning?: string;
}

export function parseNumberBR(raw: unknown, opts: { integer?: boolean; label: string }): ParsedNumber {
  const { integer = false, label } = opts;
  if (raw === null || raw === undefined || raw === "") return { value: null };
  if (typeof raw === "number" && isFinite(raw)) {
    if (integer && !Number.isInteger(raw)) {
      return { value: Math.round(raw), warning: `Quantidade não inteira (${raw}) arredondada para ${Math.round(raw)} em "${label}". Confirme na origem.` };
    }
    return { value: raw };
  }
  let s = String(raw).trim().replace(/R\$\s?/g, "").replace(/\s/g, "");
  if (s === "") return { value: null };
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized: string;
  let warning: string | undefined;
  if (hasComma && hasDot) {
    // O separador mais à direita é o decimal.
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      normalized = s.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = s.replace(",", ".");
  } else if (hasDot) {
    // "3.054" -> ambíguo: milhar (pt-BR) ou decimal (en-US).
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    if (parts.length === 2 && last.length === 3 && integer) {
      normalized = s.replace(/\./g, "");
      warning = `"${s}" interpretado como ${normalized} (separador de milhar). Se for decimal, corrija na origem.`;
    } else if (parts.length > 2) {
      normalized = s.replace(/\./g, "");
      warning = `"${s}" interpretado com "." como separador de milhar. Confirme na origem.`;
    } else {
      normalized = s;
    }
  } else {
    normalized = s;
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { value: null, warning: `Valor não numérico em "${label}": "${String(raw)}". Linha mantida sem o valor.` };
  }
  let n = parseFloat(normalized);
  if (negative) n = -n;
  if (integer && !Number.isInteger(n)) {
    return { value: Math.round(n), warning: `Quantidade não inteira (${n}) arredondada para ${Math.round(n)} em "${label}". Confirme na origem.` };
  }
  return { value: n, ...(warning ? { warning } : {}) };
}

/* ------------------------------------------------------------------ */
/* Área, situação, consumos e renovação                                 */
/* ------------------------------------------------------------------ */

export function normalizeConsumo(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (n.includes("sem saldo")) return "Sem Saldo";
  if (n.includes("com saldo") || n.includes("saldo")) return "Com Saldo";
  if (n.includes("consumid")) return "Consumido";
  return null;
}

export function normalizeRenovacao(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (n.includes("nao iniciad") || n.includes("não iniciad")) return "Não Iniciado";
  if (n.includes("nao sera renovad") || n.includes("nao renov")) return "Não Será Renovado";
  if (n.includes("novo projeto") || n.includes("criado")) return "Criado Novo Projeto";
  if (n.includes("em renovacao") || n.includes("renovando") || n.includes("em andamento")) return "Em Renovação";
  return null;
}

export function normalizeArea(raw: string | null): string | null {
  if (!raw) return null;
  const n = normText(raw);
  if (/capex|invest/.test(n)) return "CAPEX";
  if (/indireto/.test(n)) return "Indiretos";
  if (/direto/.test(n)) return "Diretos";
  return null;
}

/** Interpretação conservadora: só marca concluído/cancelado com padrões claros. */
export function normalizeSituacao(raw: string | null): "concluido" | "cancelado" | null {
  if (!raw) return null;
  const n = normText(raw);
  if (/cancel|anulad|revogad/.test(n)) return "cancelado";
  if (/conclu|finaliz|encerrad/.test(n)) return "concluido";
  return null;
}

export function sanitizeUrl(raw: string | null): { url: string | null; warning?: string } {
  if (!raw) return { url: null };
  const s = raw.trim();
  if (/^https?:\/\/\S+$/i.test(s)) return { url: s.slice(0, 2000) };
  return { url: null, warning: `Link com formato inesperado ("${s.slice(0, 80)}") não foi importado. Verifique na origem.` };
}

/* ------------------------------------------------------------------ */
/* Transformação e validação de linhas                                 */
/* ------------------------------------------------------------------ */

export type Mapping = Partial<Record<string, string | null>>; // canonicalKey -> sourceHeader

export interface Issue {
  row: number; // número da linha na planilha (1 = primeira linha de dados após cabeçalho)
  column: string;
  message: string;
  severity: "error" | "warning";
}

export interface CleanRecord {
  numero: string;
  objeto: string;
  area: string | null;
  unidade: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  etapa: string | null;
  situacaoFonte: string | null;
  situacaoNorm: "concluido" | "cancelado" | null;
  dataInicio: string | null;
  dataFim: string | null;
  quantidade: number | null;
  valor: number | null;
  statusConsumo: string | null;
  savingHist: number | null;
  savingProp: number | null;
  statusRenovacao: string | null;
  dataPrevisao: string | null;
  observacao: string | null;
  link: string | null;
  extra: Record<string, string>;
  rowHash: string;
  sourceRow: number;
}

export interface ValidationResult {
  records: CleanRecord[];
  issues: Issue[];
  skipped: number;
  duplicates: number;
  warnings: number;
}

export function transformAndValidate(
  rows: Record<string, unknown>[],
  mapping: Mapping,
  opts: { defaultArea?: string | null; maxLen?: number } = {},
): ValidationResult {
  const maxLen = opts.maxLen ?? 2000;
  const records: CleanRecord[] = [];
  const issues: Issue[] = [];
  let skipped = 0;
  let duplicates = 0;

  const get = (row: Record<string, unknown>, key: string): unknown => {
    const header = mapping[key];
    if (!header) return null;
    return row[header];
  };

  const seen = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNo = idx + 1;
    const rowIssues: Issue[] = [];
    const pushIssue = (severity: "error" | "warning", column: string, message: string) =>
      rowIssues.push({ row: rowNo, column, message, severity });

    const numero = cleanCell(get(row, "numero"))?.slice(0, maxLen) ?? null;
    const objeto = cleanCell(get(row, "objeto"))?.slice(0, 4000) ?? null;

    if (!numero) pushIssue("error", "numero", "Identificador do processo vazio (campo obrigatório).");
    if (!objeto) pushIssue("error", "objeto", "Objeto/descrição vazio (campo obrigatório).");

    const areaRaw = cleanCell(get(row, "area"));
    let area = normalizeArea(areaRaw);
    if (areaRaw && !area) {
      pushIssue("warning", "area", `Área "${areaRaw}" não reconhecida. Usada a área da base.`);
    }
    if (!area) area = opts.defaultArea ?? null;

    const di = parseDateBR(get(row, "data_inicio"), "Data de abertura");
    if (di.warning) pushIssue("warning", "data_inicio", di.warning);
    const dfCandidate = get(row, "data_fim");
    const df = parseDateBR(dfCandidate, "Data limite/vigência");
    if (df.warning) pushIssue("warning", "data_fim", df.warning);

    const dPrev = parseDateBR(get(row, "data_previsao"), "Previsão de Conclusão");
    if (dPrev.warning) pushIssue("warning", "data_previsao", dPrev.warning);

    const qtd = parseNumberBR(get(row, "quantidade"), { integer: true, label: "Quantidade" });
    if (qtd.warning) pushIssue("warning", "quantidade", qtd.warning);
    if (qtd.value !== null && qtd.value < 0) {
      pushIssue("warning", "quantidade", `Quantidade negativa (${qtd.value}). Valor mantido; confirme na origem.`);
    }

    const val = parseNumberBR(get(row, "valor"), { label: "Valor estimado" });
    if (val.warning) pushIssue("warning", "valor", val.warning);
    if (val.value !== null && val.value < 0) {
      pushIssue("warning", "valor", `Valor negativo (${val.value}). Valor mantido; confirme na origem.`);
    }

    const sHist = parseNumberBR(get(row, "saving_hist"), { label: "Saving Histórico" });
    if (sHist.warning) pushIssue("warning", "saving_hist", sHist.warning);
    
    const sProp = parseNumberBR(get(row, "saving_prop"), { label: "Saving Sob Proposta" });
    if (sProp.warning) pushIssue("warning", "saving_prop", sProp.warning);

    const sConsumo = normalizeConsumo(cleanCell(get(row, "status_consumo")));
    const sRenov = normalizeRenovacao(cleanCell(get(row, "status_renovacao")));

    const urlRes = sanitizeUrl(cleanCell(get(row, "link")));
    if (urlRes.warning) pushIssue("warning", "link", urlRes.warning);

    const situacaoFonte = cleanCell(get(row, "situacao"));
    const situacaoNorm = normalizeSituacao(situacaoFonte);

    // Colunas não mapeadas são preservadas (nada é descartado).
    const mappedHeaders = new Set(Object.values(mapping).filter(Boolean) as string[]);
    const extra: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (!mappedHeaders.has(k) && k !== "__row") {
        const c = cleanCell(v);
        if (c !== null) extra[k] = c.slice(0, maxLen);
      }
    }

    const errors = rowIssues.filter((i) => i.severity === "error");
    if (errors.length > 0) {
      skipped += 1;
      issues.push(...rowIssues);
      return;
    }

    const hashBase = [numero, objeto, area ?? "", df.iso ?? "", cleanCell(get(row, "fornecedor")) ?? ""]
      .map((p) => normText(String(p ?? "")))
      .join("|");
    if (seen.has(hashBase)) {
      duplicates += 1;
      skipped += 1;
      issues.push({
        row: rowNo,
        column: "numero",
        message: `Linha duplicada (mesmo processo, objeto, área, prazo e fornecedor). Mantida a primeira ocorrência.`,
        severity: "error",
      });
      return;
    }
    seen.add(hashBase);

    issues.push(...rowIssues);

    records.push({
      numero: numero!,
      objeto: objeto!,
      area,
      unidade: cleanCell(get(row, "unidade"))?.slice(0, 500) ?? null,
      fornecedor: cleanCell(get(row, "fornecedor"))?.slice(0, 500) ?? null,
      responsavel: cleanCell(get(row, "responsavel"))?.slice(0, 300) ?? null,
      etapa: cleanCell(get(row, "etapa"))?.slice(0, 300) ?? null,
      situacaoFonte: situacaoFonte?.slice(0, 300) ?? null,
      situacaoNorm,
      dataInicio: di.iso,
      dataFim: df.iso,
      quantidade: qtd.value,
      valor: val.value,
      statusConsumo: sConsumo,
      savingHist: sHist.value,
      savingProp: sProp.value,
      statusRenovacao: sRenov,
      dataPrevisao: dPrev.iso,
      observacao: cleanCell(get(row, "observacao"))?.slice(0, 8000) ?? null,
      link: urlRes.url,
      extra,
      rowHash: hashBase.slice(0, 500),
      sourceRow: rowNo,
    });
  });

  const warnings = issues.filter((i) => i.severity === "warning").length;
  return { records, issues, skipped, duplicates, warnings };
}

/* ------------------------------------------------------------------ */
/* Situação de prazo (calculada em consulta, sempre contra "hoje")     */
/* ------------------------------------------------------------------ */

export function situacaoPrazo(
  situacaoNorm: "concluido" | "cancelado" | null,
  dataFim: string | null,
  hoje: Date = new Date(),
): { chave: SituacaoChave; dias: number | null } {
  if (situacaoNorm === "concluido") return { chave: "concluido", dias: null };
  if (situacaoNorm === "cancelado") return { chave: "cancelado", dias: null };
  if (!dataFim) return { chave: "sem_data", dias: null };
  const [y, m, d] = dataFim.split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const today = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const dias = Math.round((end.getTime() - today.getTime()) / 86400000);
  if (dias < 0) return { chave: "vencido", dias };
  if (dias <= 30) return { chave: "a_vencer", dias };
  return { chave: "em_dia", dias };
}

/** Fragmento SQL equivalente ao situacaoPrazo (usado nas consultas). */
export const SITUACAO_SQL = `
  CASE
    WHEN r.situacao_norm = 'concluido' THEN 'concluido'
    WHEN r.situacao_norm = 'cancelado' THEN 'cancelado'
    WHEN r.data_fim IS NULL THEN 'sem_data'
    WHEN r.data_fim < CURRENT_DATE THEN 'vencido'
    WHEN r.data_fim <= CURRENT_DATE + 30 THEN 'a_vencer'
    ELSE 'em_dia'
  END`;
