/**
 * Constrói CSV compatível com Excel pt-BR (ponto e vírgula, BOM UTF-8) e
 * protege contra injeção de fórmula ao abrir o arquivo exportado.
 */

const DANGEROUS = /^[=+\-@]/;

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) {
    s = `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}/${value.getFullYear()}`;
  } else {
    s = String(value);
  }
  // Proteção contra execução de fórmulas no Excel/Sheets.
  if (DANGEROUS.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(";")];
  for (const r of rows) lines.push(r.map(csvEscape).join(";"));
  return "\uFEFF" + lines.join("\r\n");
}
