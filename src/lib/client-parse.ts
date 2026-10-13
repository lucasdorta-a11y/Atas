/**
 * Leitura de arquivos .xlsx/.csv **no navegador** (nada é enviado a
 * serviços de terceiros; o o arquivo é processado localmente e, após a confirmação, os dados ficam no
 * IndexedDB deste navegador; não há envio automático para terceiros).
 */
import * as XLSX from "xlsx";

export const MAX_FILE_MB = 25;
export const MAX_ROWS = 60000;

export interface ParsedSheet {
  name: string;
  /** linhas brutas (matriz) já com cabeçalho removido */
  headerRowIndex: number;
  matrix: unknown[][];
}

export interface ParsedFile {
  fileName: string;
  sizeBytes: number;
  kind: "xlsx" | "csv";
  encoding: "utf-8" | "windows-1252" | null;
  delimiter: string | null;
  sheets: ParsedSheet[];
}

export class ParseError extends Error {
  code: "tipo" | "tamanho" | "vazio" | "estrutura";
  constructor(code: ParseError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function detectDelimiter(text: string): string {
  const firstLines = text.split(/\r\n|\r|\n/).slice(0, 5).join("\n");
  const candidates = [";", ",", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const c of candidates) {
    const count = firstLines.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

/** Tenta UTF-8 estrito; se falhar (muito comum em CSVs do Excel pt-BR), usa Windows-1252. */
function decodeCsv(buffer: ArrayBuffer): { text: string; encoding: "utf-8" | "windows-1252" } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(buffer), encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(buffer), encoding: "windows-1252" };
  }
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext)) {
    throw new ParseError("tipo", `O formato ".${ext}" não é suportado (${file.name}). Envie apenas .xlsx, .xls ou .csv.`);
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new ParseError("tamanho", `Arquivo ${file.name} com ${(file.size / 1048576).toFixed(1)} MB. O limite é ${MAX_FILE_MB} MB.`);
  }
  if (file.size === 0) {
    throw new ParseError("vazio", `O arquivo ${file.name} está vazio (0 bytes).`);
  }

  const buffer = await file.arrayBuffer();
  let wb: XLSX.WorkBook;
  let encoding: ParsedFile["encoding"] = null;
  let delimiter: string | null = null;

  try {
    if (ext === "csv") {
      const decoded = decodeCsv(buffer);
      encoding = decoded.encoding;
      delimiter = detectDelimiter(decoded.text);
      wb = XLSX.read(decoded.text, { type: "string", FS: delimiter, raw: true });
    } else {
      wb = XLSX.read(buffer, { type: "array", cellDates: true });
    }
  } catch {
    throw new ParseError("estrutura", `Não foi possível ler o arquivo ${file.name}. Confirme se não está protegido por senha.`);
  }

  if (!wb.SheetNames.length) {
    throw new ParseError("vazio", `Nenhuma planilha encontrada em ${file.name}.`);
  }

  const sheets: ParsedSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      defval: null,
      blankrows: false,
    }) as unknown[][];
    return { name, headerRowIndex: guessHeaderRow(matrix), matrix };
  });

  const nonEmpty = sheets.filter((s) => s.matrix.length > 0);
  if (!nonEmpty.length) {
    throw new ParseError("vazio", `Todas as planilhas do arquivo ${file.name} estão vazias.`);
  }

  const totalRows = nonEmpty.reduce((acc, s) => acc + s.matrix.length, 0);
  if (totalRows > MAX_ROWS + 5) {
    throw new ParseError("estrutura", `O arquivo ${file.name} tem ${totalRows.toLocaleString("pt-BR")} linhas (acima do limite de ${MAX_ROWS.toLocaleString("pt-BR")}).`);
  }

  return {
    fileName: file.name,
    sizeBytes: file.size,
    kind: ext === "csv" ? "csv" : "xlsx",
    encoding,
    delimiter,
    sheets,
  };
}

/** Lê múltiplos arquivos e converte todas as abas (com dados) em um único array consolidado de linhas. */
export async function parseMultipleFiles(files: File[]): Promise<{
  filesCount: number;
  sheetsCount: number;
  combinedTable: SheetTable;
  names: string[];
  sourceSheets: SourceSheet[];
}> {
  let combinedRows: Record<string, unknown>[] = [];
  const allHeaders = new Set<string>();
  let filesCount = 0;
  let sheetsCount = 0;
  const names: string[] = [];
  const sourceSheets: SourceSheet[] = [];

  for (const f of files) {
    const parsed = await parseFile(f);
    filesCount++;
    names.push(parsed.fileName);
    for (const sheet of parsed.sheets) {
      if (sheet.matrix.length === 0) continue;
      sourceSheets.push({
        fileName: parsed.fileName,
        sheetName: sheet.name,
        headerRowIndex: sheet.headerRowIndex,
        matrix: sheet.matrix,
      });
      const t = extractTable(sheet, sheet.headerRowIndex);
      if (t.rows.length > 0) {
        sheetsCount++;
        for (const h of t.headers) allHeaders.add(h);
        // Marcamos o arquivo e a aba de origem caso a mesma chave de identificador venha de lugares distintos
        combinedRows = combinedRows.concat(t.rows.map(r => ({ ...r, _file: parsed.fileName, _sheet: sheet.name })));
      }
    }
  }

  if (combinedRows.length > MAX_ROWS + 100) {
    throw new ParseError("estrutura", `A combinação das planilhas gerou ${combinedRows.length.toLocaleString("pt-BR")} linhas — acima do limite.`);
  }

  return {
    filesCount,
    sheetsCount,
    names,
    sourceSheets,
    combinedTable: { headers: Array.from(allHeaders), rows: combinedRows, totalRows: combinedRows.length },
  };
}

/** Heurística: a linha de cabeçalho tende a ser a linha com mais células de texto nas primeiras 12 linhas. */
export function guessHeaderRow(matrix: unknown[][]): number {
  const limit = Math.min(matrix.length, 12);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < limit; i++) {
    const row = matrix[i] ?? [];
    const filled = row.filter((c) => c !== null && c !== undefined && String(c).trim() !== "");
    const textCells = filled.filter((c) => !(c instanceof Date) && isNaN(Number(c)));
    const score = textCells.length * 2 + filled.length * 0.1 - i * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

export interface SheetTable {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

/** Matriz preservada para os blocos específicos do painel (múltiplas tabelas por aba). */
export interface SourceSheet {
  fileName: string;
  sheetName: string;
  headerRowIndex: number;
  matrix: unknown[][];
}

/** Extrai cabeçalho + linhas como objetos. Cabeçalhos duplicados recebem sufixo. */
export function extractTable(sheet: ParsedSheet, headerRowIndex: number): SheetTable {
  const { matrix } = sheet;
  const headerRow = matrix[headerRowIndex] ?? [];
  const headers: string[] = [];
  const counts = new Map<string, number>();
  for (let c = 0; c < headerRow.length; c++) {
    let h = headerRow[c];
    let name = h === null || h === undefined || String(h).trim() === "" ? `Coluna ${c + 1}` : String(h).trim();
    if (counts.has(name)) {
      const n = counts.get(name)! + 1;
      counts.set(name, n);
      name = `${name} (${n})`;
    } else {
      counts.set(name, 1);
    }
    headers.push(name);
  }

  const rows: Record<string, unknown>[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const line = matrix[r];
    const obj: Record<string, unknown> = {};
    let hasContent = false;
    for (let c = 0; c < headers.length; c++) {
      const v = line?.[c] ?? null;
      if (v !== null && v !== undefined && String(v).trim() !== "") hasContent = true;
      obj[headers[c]] = v;
    }
    if (hasContent) rows.push(obj);
    if (rows.length >= MAX_ROWS) break;
  }
  return { headers, rows, totalRows: rows.length };
}
